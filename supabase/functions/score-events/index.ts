import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  corsHeaders,
  json,
  hardFilter,
  weightedScore,
  loadScoringConfig,
} from "../_shared/scoring.ts";
import { TOPIC_KEYS, normalizeTopics } from "../_shared/topics.ts";

const BATCH = 25;

interface EventRow {
  id: string;
  parliament: string;
  political_level: string;
  event_type: string;
  event_date: string;
  title: string;
  description: string | null;
  source_id: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const from: string | undefined = body.from;
    const to: string | undefined = body.to;
    const limit: number = Math.min(Number(body.limit) || 200, 500);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY ist nicht konfiguriert");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const config = await loadScoringConfig(supabase);

    let q = supabase
      .from("events")
      .select("id, parliament, political_level, event_type, event_date, title, description, source_id")
      .eq("selection_status", "new")
      .is("political_relevance", null)
      .order("event_date", { ascending: false })
      .limit(limit);
    if (from) q = q.gte("event_date", from);
    if (to) q = q.lte("event_date", to);

    const { data: events, error } = await q;
    if (error) throw error;
    const rows = (events || []) as EventRow[];

    let excluded = 0;
    const scorable: EventRow[] = [];

    for (const e of rows) {
      const reason = hardFilter({
        title: e.title,
        event_type: e.event_type,
        source_url: e.source_id ? "ok" : null,
      });
      if (reason) {
        excluded++;
        await supabase
          .from("events")
          .update({ selection_status: "excluded", exclusion_reason: reason, political_relevance: 0, social_potential: 0, editorial_confidence: 0 })
          .eq("id", e.id);
      } else {
        scorable.push(e);
      }
    }

    let scored = 0;

    for (let i = 0; i < scorable.length; i += BATCH) {
      const batch = scorable.slice(i, i + BATCH);
      const list = batch
        .map((e, idx) =>
          `${idx}. [${e.event_type}] ${e.title} — ${e.parliament} (${e.political_level}), ${e.event_date}${e.description ? ` · ${e.description}` : ""}`,
        )
        .join("\n");

      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                `Du bewertest Schweizer parlamentarische Ereignisse für eine Redaktion. Bewerte jeden Eintrag mit Faktoren von 0-100. Sei streng und differenziert; vergib nicht überall ähnliche Werte. Ordne jedem Eintrag zusätzlich 1-3 Themen aus dieser festen Liste zu: ${TOPIC_KEYS.join(", ")}. Antworte ausschliesslich über das Tool.`,
            },
            { role: "user", content: `Bewerte diese Ereignisse:\n\n${list}` },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "score_events",
                description: "Bewertet Ereignisse nach politischer Relevanz und Social-Media-Potenzial.",
                parameters: {
                  type: "object",
                  properties: {
                    results: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          index: { type: "number" },
                          decision_impact: { type: "number" },
                          scope: { type: "number" },
                          controversy: { type: "number" },
                          topic_salience: { type: "number" },
                          process_stage: { type: "number" },
                          emotional_hook: { type: "number" },
                          clarity: { type: "number" },
                          everyday_relevance: { type: "number" },
                          conflict: { type: "number" },
                          visual_potential: { type: "number" },
                          novelty: { type: "number" },
                          confidence: { type: "number" },
                          topics: { type: "array", items: { type: "string", enum: [...TOPIC_KEYS] } },
                          rationale: { type: "string" },
                        },
                        required: [
                          "index", "decision_impact", "scope", "controversy", "topic_salience", "process_stage",
                          "emotional_hook", "clarity", "everyday_relevance", "conflict", "visual_potential",
                          "novelty", "confidence", "rationale", "topics",
                        ],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["results"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "score_events" } },
        }),
      });

      if (res.status === 429) return json({ error: "Rate-Limit erreicht, bitte später erneut versuchen." }, 429);
      if (res.status === 402) return json({ error: "AI-Guthaben aufgebraucht." }, 402);
      if (!res.ok) throw new Error(`AI Gateway: ${res.status} ${await res.text()}`);

      const payload = await res.json();
      const args = payload.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (!args) continue;
      const results = JSON.parse(args).results || [];

      for (const r of results) {
        const e = batch[r.index];
        if (!e) continue;
        const relevance = weightedScore(r, config.relevance_weights);
        const social = weightedScore(r, config.social_weights);
        const confidence = Math.max(0, Math.min(100, Math.round(Number(r.confidence) || 0)));
        await supabase
          .from("events")
          .update({
            political_relevance: relevance,
            social_potential: social,
            editorial_confidence: confidence,
            topics: normalizeTopics(r.topics),
            score_factors: { ...r, rationale: r.rationale, thresholds: config.thresholds, weights: { relevance: config.relevance_weights, social: config.social_weights } },
          })
          .eq("id", e.id);
        scored++;
      }
    }

    return json({ scored, excluded, total: rows.length });
  } catch (e) {
    console.error("score-events", e);
    return json({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }, 500);
  }
});
