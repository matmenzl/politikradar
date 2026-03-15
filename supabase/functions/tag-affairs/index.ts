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
    const { affairs } = await req.json();

    if (!affairs || !Array.isArray(affairs) || affairs.length === 0) {
      return new Response(JSON.stringify({ tagged: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build a numbered list of affair titles for the AI
    const titleList = affairs
      .map((a: { id: number; title: string }, i: number) => `${i + 1}. [ID:${a.id}] ${a.title}`)
      .join("\n");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
              content: `Du bist ein Experte für Schweizer Parlamentspolitik. Deine Aufgabe ist es, parlamentarische Geschäfte mit 1-3 kurzen, prägnanten Schlagworten auf Deutsch zu versehen.

Verwende konsistente Kategorien wie: Bildung, Gesundheit, Finanzen, Verkehr, Umwelt, Energie, Sicherheit, Soziales, Wirtschaft, Justiz, Digitalisierung, Landwirtschaft, Aussenpolitik, Migration, Verteidigung, Kultur, Medien, Arbeit, Wohnen, Steuern, etc.

Antworte NUR mit dem tool call, nichts anderes.`,
            },
            {
              role: "user",
              content: `Verschlagworte folgende parlamentarische Geschäfte:\n\n${titleList}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "tag_affairs",
                description:
                  "Return tags for each affair identified by its ID.",
                parameters: {
                  type: "object",
                  properties: {
                    results: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "number", description: "The affair ID" },
                          tags: {
                            type: "array",
                            items: { type: "string" },
                            description:
                              "1-3 short German tags/keywords for this affair",
                          },
                        },
                        required: ["id", "tags"],
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
          tool_choice: {
            type: "function",
            function: { name: "tag_affairs" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Bitte versuche es später erneut." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI-Credits aufgebraucht. Bitte Credits aufladen." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    let results: { id: number; tags: string[] }[] = [];

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      results = parsed.results || [];
    } else {
      // Fallback: try to parse from message content
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        try {
          const parsed = JSON.parse(content);
          results = parsed.results || [];
        } catch {
          console.error("Could not parse AI content as JSON, returning empty tags. Content:", content);
        }
      } else {
        console.error("No tool call and no content in AI response:", JSON.stringify(data));
      }
    }

    // Build a map of id -> tags
    const tagMap: Record<number, string[]> = {};
    for (const r of results) {
      tagMap[r.id] = r.tags;
    }

    return new Response(JSON.stringify({ tagMap }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("tag-affairs error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
