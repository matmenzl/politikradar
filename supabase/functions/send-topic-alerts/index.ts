import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, json } from "../_shared/scoring.ts";
import { TOPIC_LABELS } from "../_shared/topics.ts";
import { sendTemplateEmail } from "../_shared/transactional-email-templates/send-email.ts";

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
    let sent = 0;
    const preview: { email: string; count: number }[] = [];

    for (const p of (profiles || []) as Profile[]) {
      const { data: delivered } = await supabase
        .from("alert_deliveries")
        .select("event_id")
        .eq("user_id", p.user_id);
      const seen = new Set((delivered || []).map((d) => d.event_id));

      const hits = eventRows.filter((e) => !seen.has(e.id) && matches(e, p)).slice(0, 8);
      if (!hits.length) continue;
      preview.push({ email: p.email, count: hits.length });
      if (dryRun) continue;

      const { error: mailError } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "topic-alert",
          recipientEmail: p.email,
          idempotencyKey: `topic-alert-${p.user_id}-${hits[0].id}`,
          templateData: {
            items: hits.map((e) => ({
              title: e.title,
              parliament: e.parliament,
              date: e.event_date,
              relevance: e.political_relevance,
              topics: (e.topics ?? []).map((t) => TOPIC_LABELS[t] ?? t),
            })),
          },
        },
      });
      if (mailError) {
        console.error("send-topic-alerts mail", p.email, mailError);
        continue;
      }

      await supabase
        .from("alert_deliveries")
        .upsert(hits.map((e) => ({ user_id: p.user_id, event_id: e.id })), {
          onConflict: "user_id,event_id",
        });
      sent++;
    }

    return json({ sent, profiles: profiles?.length ?? 0, events: eventRows.length, dry_run: dryRun, preview });
  } catch (e) {
    console.error("send-topic-alerts", e);
    return json({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }, 500);
  }
});
