import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, json } from "../_shared/scoring.ts";

const BASE_URL = "https://api.openparldata.ch/v1";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface AffairEvent {
  id: number;
  date?: string;
  position?: number;
  title_de?: string;
  title_harmonized?: string;
  actor_de?: string;
  last?: boolean;
  details_url?: string;
}

export interface TimelineStep {
  date: string | null;
  title: string;
  actor: string | null;
  position: number;
  last: boolean;
  url: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { event_id, force } = await req.json().catch(() => ({}));
    if (!event_id) return json({ error: "event_id ist erforderlich" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: event, error } = await supabase
      .from("events")
      .select("id, affair_id, affair_state, timeline, timeline_synced_at")
      .eq("id", event_id)
      .maybeSingle();

    if (error) return json({ error: error.message }, 500);
    if (!event) return json({ error: "Ereignis nicht gefunden" }, 404);
    if (!event.affair_id) {
      return json({ timeline: [], affair_state: event.affair_state ?? null, cached: true });
    }

    const fresh =
      !force &&
      event.timeline_synced_at &&
      Date.now() - new Date(event.timeline_synced_at).getTime() < MAX_AGE_MS;

    if (fresh) {
      return json({
        timeline: event.timeline ?? [],
        affair_state: event.affair_state ?? null,
        cached: true,
      });
    }

    const qs = new URLSearchParams({ lang: "de", lang_format: "flat", limit: "100" });
    const [stepsRes, affairRes] = await Promise.all([
      fetch(`${BASE_URL}/affairs/${event.affair_id}/events?${qs}`),
      fetch(`${BASE_URL}/affairs/${event.affair_id}?${qs}`),
    ]);

    if (!stepsRes.ok) {
      return json({
        timeline: event.timeline ?? [],
        affair_state: event.affair_state ?? null,
        cached: true,
        warning: `OpenParlData antwortete mit ${stepsRes.status}`,
      });
    }

    const stepsBody = await stepsRes.json();
    const raw: AffairEvent[] = stepsBody?.data ?? [];

    const timeline: TimelineStep[] = raw
      .map((s, i) => ({
        date: s.date ? String(s.date).slice(0, 10) : null,
        title: s.title_harmonized || s.title_de || "Verfahrensschritt",
        actor: s.actor_de ?? null,
        position: typeof s.position === "number" ? s.position : i + 1,
        last: Boolean(s.last),
        url: s.details_url ?? null,
      }))
      .sort((a, b) => {
        if (a.date && b.date && a.date !== b.date) return a.date.localeCompare(b.date);
        return a.position - b.position;
      });

    if (timeline.length && !timeline.some((s) => s.last)) {
      timeline[timeline.length - 1].last = true;
    }

    let affairState: string | null = event.affair_state ?? null;
    if (affairRes.ok) {
      const affairBody = await affairRes.json();
      const a = affairBody?.data ?? affairBody;
      affairState = a?.state_name_harmonized_de || a?.state_name_de || affairState;
    }
    if (!affairState && timeline.length) {
      affairState = timeline[timeline.length - 1].title;
    }

    await supabase
      .from("events")
      .update({
        timeline,
        affair_state: affairState,
        timeline_synced_at: new Date().toISOString(),
      })
      .eq("id", event_id);

    return json({ timeline, affair_state: affairState, cached: false });
  } catch (e) {
    console.error("affair-timeline", e);
    return json({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }, 500);
  }
});
