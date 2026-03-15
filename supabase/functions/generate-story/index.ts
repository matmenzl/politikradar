import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, type, status, votingResults, date, beginDate, endDate, summary } = await req.json();

    if (!title) {
      return new Response(JSON.stringify({ error: "title is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context
    const parts: string[] = [`Titel: ${title}`];
    if (type) parts.push(`Geschäftstyp: ${type}`);
    if (status) parts.push(`Status: ${status}`);
    if (beginDate) parts.push(`Eingereicht: ${beginDate}`);
    if (endDate) parts.push(`Abgeschlossen: ${endDate}`);
    if (date) parts.push(`Datum: ${date}`);
    if (votingResults) {
      parts.push(
        `Abstimmungsergebnisse: Ja ${votingResults.yes}, Nein ${votingResults.no}, Enthaltungen ${votingResults.abstention}, Entscheid: ${votingResults.decision === "ja" ? "Angenommen" : "Abgelehnt"}`
      );
    }
    if (summary) parts.push(`Zusammenfassung: ${summary}`);

    const context = parts.join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "Du erstellst Instagram-Story-Inhalte über Schweizer Parlamentsgeschäfte. Erstelle 4–5 Story-Slides, die das Geschäft als Storytelling aufbereiten. Jeder Slide soll einen klaren Zweck haben. Verwende einfache Sprache, kurze Sätze, und passende Emojis. Die Slides sollen für ein breites Publikum verständlich sein.",
          },
          {
            role: "user",
            content: `Erstelle Instagram-Story-Slides für dieses parlamentarische Geschäft:\n\n${context}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_story_slides",
              description: "Erstellt eine Reihe von Instagram-Story-Slides für ein parlamentarisches Geschäft.",
              parameters: {
                type: "object",
                properties: {
                  slides: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        headline: { type: "string", description: "Kurze, aufmerksamkeitsstarke Überschrift (max 60 Zeichen)" },
                        body: { type: "string", description: "Erklärender Text (max 150 Zeichen)" },
                        emoji: { type: "string", description: "Ein passendes Emoji für den Slide" },
                        slide_type: {
                          type: "string",
                          enum: ["hook", "context", "result", "insight", "cta"],
                          description: "Art des Slides: hook (Aufmacher), context (Hintergrund), result (Ergebnis), insight (Einordnung), cta (Handlungsaufforderung)",
                        },
                      },
                      required: ["headline", "body", "emoji", "slide_type"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["slides"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_story_slides" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Zu viele Anfragen. Bitte versuche es später erneut." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI-Kontingent aufgebraucht." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI-Fehler" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(result));
      return new Response(JSON.stringify({ error: "Keine Story-Slides generiert." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ slides: parsed.slides }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-story error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
