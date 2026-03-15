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
    const { items } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build a numbered list for the AI
    const itemList = items
      .map((item: any, i: number) => {
        const parts = [`${i + 1}. "${item.title}"`];
        if (item.type) parts.push(`(${item.type})`);
        if (item.bodyName) parts.push(`[${item.bodyName}]`);
        if (item.results_yes != null && item.results_no != null) {
          const total = item.results_yes + item.results_no;
          const margin = total > 0 ? Math.abs(item.results_yes - item.results_no) / total : 0;
          parts.push(`Ja: ${item.results_yes}, Nein: ${item.results_no}, Marge: ${(margin * 100).toFixed(1)}%`);
        }
        if (item.status) parts.push(`Status: ${item.status}`);
        return parts.join(" ");
      })
      .join("\n");

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
            content: `Du bist ein Social-Media-Stratege für Schweizer Politik. Deine Aufgabe: Bewerte parlamentarische Geschäfte und Abstimmungen nach ihrem Potenzial für virale Social-Media-Inhalte (Instagram Stories).

Kriterien für hohes Potenzial:
1. **Knappes Abstimmungsergebnis** (Marge < 10% = sehr spannend)
2. **Kontroverse/polarisierende Themen** (Umwelt vs. Wirtschaft, Freiheit vs. Sicherheit, etc.)
3. **Alltagsrelevanz** (betrifft viele Menschen direkt: Miete, Steuern, Gesundheit, Verkehr)
4. **Emotionales Potenzial** (Themen die Empörung, Überraschung oder Freude auslösen)
5. **Aktualität** (passt zu aktuellen gesellschaftlichen Debatten)

Wähle die Top 10 aus und erkläre kurz warum. Antworte NUR mit dem tool call.`,
          },
          {
            role: "user",
            content: `Bewerte folgende parlamentarische Geschäfte/Abstimmungen nach Social-Media-Potenzial:\n\n${itemList}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "rank_suggestions",
              description: "Ranked list of items by social media potential",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        index: { type: "number", description: "1-based index from the input list" },
                        score: { type: "number", description: "Score 1-10 for social media potential" },
                        reason: { type: "string", description: "1-2 Sätze warum dieses Geschäft Social-Media-Potenzial hat" },
                        hook_idea: { type: "string", description: "Kurze Story-Hook-Idee (max 60 Zeichen)" },
                      },
                      required: ["index", "score", "reason", "hook_idea"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["suggestions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "rank_suggestions" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Zu viele Anfragen. Bitte später erneut versuchen." }), {
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
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    let suggestions: any[] = [];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      suggestions = parsed.suggestions || [];
    } else {
      console.error("No tool call in response:", JSON.stringify(data));
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-stories error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
