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
    const { title, type, status, votingResults, date, beginDate, endDate, parliament } = await req.json();

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

    // Build context string from available data
    const parts: string[] = [`Titel: ${title}`];
    if (parliament) parts.push(`Parlament: ${parliament}`);
    if (type) parts.push(`Geschäftstyp: ${type}`);
    if (status) parts.push(`Status: ${status}`);
    if (beginDate) parts.push(`Eingereicht: ${beginDate}`);
    if (endDate) parts.push(`Abgeschlossen: ${endDate}`);
    if (date) parts.push(`Datum: ${date}`);
    if (votingResults) {
      const accepted = votingResults.accepted ?? (votingResults.yes > votingResults.no);
      parts.push(
        `Abstimmungsergebnisse: Ja ${votingResults.yes}, Nein ${votingResults.no}, Enthaltungen ${votingResults.abstention}, Entscheid: ${accepted ? "Angenommen" : "Abgelehnt"}`
      );
    }

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
              "Du bist ein Experte für Schweizer Politik und erklärst parlamentarische Geschäfte in einfacher, allgemeinverständlicher Sprache. Schreibe eine Zusammenfassung in 3–5 Sätzen auf Deutsch. Vermeide Fachjargon. Erkläre, worum es bei dem Geschäft geht, was der aktuelle Stand ist, und was das Ergebnis bedeutet (falls Abstimmungsergebnisse vorhanden). Antworte nur mit der Zusammenfassung, ohne Überschrift oder Einleitung.",
          },
          {
            role: "user",
            content: `Fasse dieses parlamentarische Geschäft zusammen:\n\n${context}`,
          },
        ],
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
    const summary = result.choices?.[0]?.message?.content || "Keine Zusammenfassung verfügbar.";

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("summarize-affair error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
