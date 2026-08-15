import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, json } from "../_shared/scoring.ts";

/** Slide structure of the MVP story outline. */
const OUTLINE = [
  { slide_type: "hook", label: "Was ist passiert" },
  { slide_type: "context", label: "Worum geht es" },
  { slide_type: "decision", label: "Was wurde beschlossen" },
  { slide_type: "vote", label: "Wie wurde abgestimmt" },
  { slide_type: "positions", label: "Wer war dafür, wer dagegen" },
  { slide_type: "outlook", label: "Was passiert jetzt" },
  { slide_type: "sources", label: "Quellen" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { event_id } = await req.json();
    if (!event_id || typeof event_id !== "string") {
      return json({ error: "event_id ist erforderlich" }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY ist nicht konfiguriert");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: event, error: evErr } = await supabase
      .from("events")
      .select("*")
      .eq("id", event_id)
      .single();
    if (evErr || !event) return json({ error: "Ereignis nicht gefunden" }, 404);

    const { data: facts } = await supabase
      .from("facts")
      .select("fact_type, label, value")
      .eq("event_id", event_id)
      .order("position");

    const { data: source } = event.source_id
      ? await supabase.from("sources").select("url, label").eq("id", event.source_id).maybeSingle()
      : { data: null };

    const factLayer = (facts || []).map((f) => `- ${f.label}: ${f.value}`).join("\n");
    const context = [
      `Titel: ${event.title}`,
      `Parlament: ${event.parliament}`,
      `Ebene: ${event.political_level}`,
      `Ereignistyp: ${event.event_type}`,
      `Datum: ${event.event_date}`,
      event.description ? `Beschreibung: ${event.description}` : "",
      source?.url ? `Quelle: ${source.url}` : "",
      "",
      "Fact Layer (die einzig erlaubten Fakten und Zahlen):",
      factLayer || "- keine strukturierten Fakten vorhanden",
    ]
      .filter(Boolean)
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
              "Du formulierst aus einem geprüften Fact Layer neutrale Social-Media-Slides über Schweizer Parlamentsgeschäfte. " +
              "Strikte Regeln: Erfinde keine Zahlen, Namen, Zitate oder Fakten. Verwende ausschliesslich Angaben aus dem Fact Layer. " +
              "Fehlt eine Information, lasse den Slide-Text allgemein oder schreibe, dass dazu keine Angaben vorliegen. " +
              "Schreibe neutral, ohne Wertung, in einfacher deutscher Sprache, kurze Sätze, keine Emojis. " +
              "Nenne immer das konkrete Parlament.",
          },
          {
            role: "user",
            content:
              `Erstelle die Slide-Texte nach dieser festen Struktur:\n` +
              OUTLINE.map((o, i) => `${i + 1}. ${o.label} (slide_type: ${o.slide_type})`).join("\n") +
              `\n\nGrundlage:\n\n${context}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_story",
              description: "Erstellt Headline, Zusammenfassung und Slide-Texte aus dem Fact Layer.",
              parameters: {
                type: "object",
                properties: {
                  headline: { type: "string" },
                  summary: { type: "string" },
                  slides: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        slide_type: { type: "string" },
                        headline: { type: "string" },
                        body: { type: "string" },
                      },
                      required: ["slide_type", "headline", "body"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["headline", "summary", "slides"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_story" } },
      }),
    });

    if (res.status === 429) return json({ error: "Rate-Limit erreicht, bitte später erneut versuchen." }, 429);
    if (res.status === 402) return json({ error: "AI-Guthaben aufgebraucht." }, 402);
    if (!res.ok) throw new Error(`AI Gateway: ${res.status} ${await res.text()}`);

    const payload = await res.json();
    const args = payload.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("Keine Story-Antwort erhalten");
    const generated = JSON.parse(args);

    const { data: story, error: storyErr } = await supabase
      .from("stories")
      .insert({
        event_id,
        status: "ai_generated",
        headline: generated.headline || event.title,
        summary: generated.summary || null,
        political_relevance: event.political_relevance,
        social_potential: event.social_potential,
        editorial_confidence: event.editorial_confidence,
      })
      .select("id")
      .single();
    if (storyErr || !story) throw storyErr || new Error("Story konnte nicht angelegt werden");

    const factMap = Object.fromEntries((facts || []).map((f) => [f.fact_type, f.value]));
    const slides = OUTLINE.map((o, i) => {
      const g = (generated.slides || []).find((s: { slide_type: string }) => s.slide_type === o.slide_type);
      let visualization: Record<string, unknown> = {};
      if (o.slide_type === "vote" && factMap.votes_yes) {
        visualization = {
          type: "vote",
          yes: Number(factMap.votes_yes || 0),
          no: Number(factMap.votes_no || 0),
          abstention: Number(factMap.votes_abstention || 0),
          result: factMap.result || "",
        };
      }
      if (o.slide_type === "sources") {
        visualization = { type: "sources", url: source?.url || null, label: source?.label || event.parliament };
      }
      return {
        story_id: story.id,
        position: i,
        slide_type: o.slide_type,
        headline: g?.headline || o.label,
        body: g?.body || "",
        visualization,
        source_id: event.source_id,
      };
    });

    await supabase.from("slides").insert(slides);
    await supabase.from("events").update({ selection_status: "selected" }).eq("id", event_id);

    return json({ story_id: story.id });
  } catch (e) {
    console.error("generate-story", e);
    return json({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }, 500);
  }
});
