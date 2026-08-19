import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, json } from "../_shared/scoring.ts";
import { TOPIC_LABELS } from "../_shared/topics.ts";
import { sendTemplateEmail } from "../_shared/transactional-email-templates/send-email.ts";
import { checkDeeplinks, resolveLink, type BrokenLink, type DeeplinkTarget, type LinkCheckResult } from "../_shared/deeplinks.ts";

interface EventRow {
  id: string;
  title: string;
  parliament: string;
  event_date: string;
  description: string | null;
  topics: string[] | null;
  political_relevance: number | null;
}

interface Profile {
  user_id: string;
  email: string;
  parliaments: string[];
  topics: string[];
  keywords: string[];
  min_relevance: number;
  alerts_enabled: boolean;
}

/** Maps event ids to the newest published story id (for direct story links). */
const loadStoryMap = async (supabase: any, eventIds: string[]) => {
  if (!eventIds.length) return {} as Record<string, string>;
  const { data } = await supabase
    .from("stories")
    .select("id, event_id, published_at")
    .eq("status", "published")
    .in("event_id", eventIds)
    .order("published_at", { ascending: false });
  const map: Record<string, string> = {};
  for (const row of data || []) {
    if (row.event_id && !map[row.event_id]) map[row.event_id] = row.id;
  }
  return map;
};

const itemPayload = (e: EventRow, link: { url: string; hasStory: boolean }) => ({
  title: e.title,
  parliament: e.parliament,
  date: e.event_date,
  relevance: e.political_relevance,
  topics: (e.topics ?? []).map((t) => TOPIC_LABELS[t] ?? t),
  url: link.url,
  hasStory: link.hasStory,
});

/**
 * Validates the deeplinks for a batch of events and keeps only entries with a
 * working public landing page. Broken ids are returned for reporting.
 */
const buildItems = async (supabase: any, hits: EventRow[]) => {
  const storyMap = await loadStoryMap(supabase, hits.map((e) => e.id));
  const targets: DeeplinkTarget[] = hits.map((e) => ({ eventId: e.id, storyId: storyMap[e.id] ?? null }));
  const check: LinkCheckResult = await checkDeeplinks(supabase, targets);

  const items: ReturnType<typeof itemPayload>[] = [];
  const kept: EventRow[] = [];
  const dropped: { event_id: string; title: string }[] = [];

  hits.forEach((e, i) => {
    const link = resolveLink(targets[i], check);
    if (!link) {
      dropped.push({ event_id: e.id, title: e.title });
      return;
    }
    items.push(itemPayload(e, link));
    kept.push(e);
  });

  return { items, kept, dropped, broken: check.broken };
};

const logBroken = (scope: string, broken: BrokenLink[], dropped: { event_id: string }[]) => {
  if (!broken.length) return;
  console.error(
    `send-topic-alerts link-check ${scope}: ${broken.length} fehlerhafte Deeplinks, ${dropped.length} Einträge entfernt`,
    broken.map((b) => `${b.kind}:${b.id} (${b.reason})`).join(", "),
  );
};

const matches = (e: EventRow, p: Profile) => {
  if ((e.political_relevance ?? 0) < (p.min_relevance ?? 0)) return false;
  if (p.parliaments.length && !p.parliaments.includes(e.parliament)) return false;
  const haystack = `${e.title} ${e.description ?? ""}`.toLowerCase();
  const keywordHit = p.keywords.some((k) => haystack.includes(k.toLowerCase()));
  const topicHit = !p.topics.length || (e.topics ?? []).some((t) => p.topics.includes(t));
  if (p.keywords.length && keywordHit) return true;
  return topicHit && (!p.keywords.length || keywordHit);
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const days: number = Math.min(Number(body.days) || 2, 30);
    const dryRun: boolean = body.dry_run === true;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceIso = since.toISOString().slice(0, 10);

    const [{ data: profiles }, { data: events }] = await Promise.all([
      supabase.from("subscriber_profiles").select("*").eq("alerts_enabled", true),
      supabase
        .from("events")
        .select("id, title, parliament, event_date, description, topics, political_relevance")
        .gte("event_date", sinceIso)
        .neq("selection_status", "rejected")
        .not("political_relevance", "is", null)
        .order("political_relevance", { ascending: false })
        .limit(300),
    ]);

    const eventRows = (events || []) as EventRow[];

    // Test send: one sample alert with the top events, ignoring profiles & delivery history.
    const testEmail: string | undefined = typeof body.test_email === "string" ? body.test_email : undefined;
    if (testEmail) {
      const hits = eventRows.slice(0, 5);
      if (!hits.length) return json({ error: "Keine Ereignisse im Zeitraum gefunden." }, 400);
      const { items, dropped, broken } = await buildItems(supabase, hits);
      logBroken(`test:${testEmail}`, broken, dropped);
      if (!items.length) {
        return json({ error: "Alle Deeplinks im Zeitraum sind fehlerhaft.", broken_links: broken, dropped }, 400);
      }
      const result = await sendTemplateEmail("topic-alert", testEmail, {
        idempotencyKey: `topic-alert-test-${testEmail}-${Date.now()}`,
        templateData: { items },
      });
      return json({
        test: true,
        email: testEmail,
        sent: result.sent,
        items: items.length,
        broken_links: broken,
        dropped,
      });
    }

    let sent = 0;
    const preview: { email: string; count: number }[] = [];
    const brokenLinks: (BrokenLink & { email: string })[] = [];
    const droppedItems: { email: string; event_id: string; title: string }[] = [];

    for (const p of (profiles || []) as Profile[]) {
      const { data: delivered } = await supabase
        .from("alert_deliveries")
        .select("event_id")
        .eq("user_id", p.user_id);
      const seen = new Set((delivered || []).map((d) => d.event_id));

      const hits = eventRows.filter((e) => !seen.has(e.id) && matches(e, p)).slice(0, 8);
      if (!hits.length) continue;

      const { items, kept, dropped, broken } = await buildItems(supabase, hits);
      logBroken(p.email, broken, dropped);
      brokenLinks.push(...broken.map((b) => ({ ...b, email: p.email })));
      droppedItems.push(...dropped.map((d) => ({ ...d, email: p.email })));

      if (!items.length) continue;
      preview.push({ email: p.email, count: items.length });
      if (dryRun) continue;

      try {
        const result = await sendTemplateEmail("topic-alert", p.email, {
          idempotencyKey: `topic-alert-${p.user_id}-${kept[0].id}`,
          templateData: { items },
        });
        if (!result.sent) {
          console.warn("send-topic-alerts suppressed", p.email);
          continue;
        }
      } catch (mailError) {
        console.error("send-topic-alerts mail", p.email, mailError);
        continue;
      }

      await supabase
        .from("alert_deliveries")
        .upsert(kept.map((e) => ({ user_id: p.user_id, event_id: e.id })), {
          onConflict: "user_id,event_id",
        });
      sent++;
    }

    return json({
      sent,
      profiles: profiles?.length ?? 0,
      events: eventRows.length,
      dry_run: dryRun,
      preview,
      broken_links: brokenLinks,
      dropped: droppedItems,
    });
  } catch (e) {
    console.error("send-topic-alerts", e);
    return json({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }, 500);
  }
});
