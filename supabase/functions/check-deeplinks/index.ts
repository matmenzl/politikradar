import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, json } from "../_shared/scoring.ts";
import { checkDeeplinks, REASON_LABELS, type DeeplinkTarget } from "../_shared/deeplinks.ts";

/**
 * On-demand link check: validates every /g/:id and /s/:id deeplink the newsletter
 * would produce for the given period, plus all published stories.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Nicht angemeldet." }, 401);

    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userError } = await authClient.auth.getUser();
    if (userError || !userData.user) return json({ error: "Nicht angemeldet." }, 401);

    const body = await req.json().catch(() => ({}));
    const days: number = Math.min(Math.max(Number(body.days) || 30, 1), 365);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceIso = since.toISOString().slice(0, 10);

    const [{ data: events }, { data: stories }] = await Promise.all([
      supabase
        .from("events")
        .select("id, title, event_date")
        .gte("event_date", sinceIso)
        .neq("selection_status", "rejected")
        .not("political_relevance", "is", null)
        .order("political_relevance", { ascending: false })
        .limit(300),
      supabase
        .from("stories")
        .select("id, event_id, headline, status")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(300),
    ]);

    const titles: Record<string, string> = {};
    for (const e of events || []) titles[e.id] = e.title;
    for (const s of stories || []) if (s.event_id && !titles[s.event_id]) titles[s.event_id] = s.headline;

    const newestStory: Record<string, string> = {};
    for (const s of stories || []) {
      if (s.event_id && !newestStory[s.event_id]) newestStory[s.event_id] = s.id;
    }

    const targets: DeeplinkTarget[] = [];
    const seen = new Set<string>();
    for (const e of events || []) {
      targets.push({ eventId: e.id, storyId: newestStory[e.id] ?? null });
      seen.add(e.id);
    }
    for (const s of stories || []) {
      if (s.event_id && !seen.has(s.event_id)) {
        targets.push({ eventId: s.event_id, storyId: s.id });
        seen.add(s.event_id);
      }
    }

    const check = await checkDeeplinks(supabase, targets);
    const broken = check.broken.map((b) => ({
      ...b,
      label: REASON_LABELS[b.reason],
      title: titles[b.eventId] ?? null,
    }));

    return json({
      days,
      checked: targets.length,
      valid_events: check.validEvents.size,
      valid_stories: check.validStories.size,
      broken,
      checked_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("check-deeplinks", e);
    return json({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }, 500);
  }
});
