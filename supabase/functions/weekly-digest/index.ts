import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const API_BASE = "https://api.openparldata.ch/v1";

interface Body {
  id: number;
  body_key?: string;
  key?: string;
  name_de?: string;
  indexed?: boolean;
  type?: string;
}

interface Voting {
  id: number;
  body_key: string;
  date: string;
  affair_id: number;
  results_yes: number;
  results_no: number;
  results_abstention: number;
  results_absent: number;
  decision: string;
  title_de?: string;
  affair_title_de?: string;
}

interface Affair {
  id: number;
  body_key: string;
  title_de?: string;
  begin_date?: string;
  type_de?: string;
}

async function apiFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<{ data: T[]; meta: any }> {
  const allParams = { lang: "de", lang_format: "flat", ...params };
  const qs = new URLSearchParams(allParams).toString();
  const res = await fetch(`${API_BASE}${endpoint}?${qs}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

function getWeekDateRange(year: number, week: number): { from: string; to: string } {
  const jan4 = new Date(year, 0, 4);
  const dow = jan4.getDay() || 7;
  const mon1 = new Date(jan4);
  mon1.setDate(jan4.getDate() - dow + 1);
  const monday = new Date(mon1);
  monday.setDate(mon1.getDate() + (week - 1) * 7);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { from: fmt(monday), to: fmt(friday) };
}

async function fetchAllBodies(): Promise<Body[]> {
  let all: Body[] = [];
  let offset = 0;
  let hasMore = true;
  while (hasMore) {
    const res = await apiFetch<Body>("/bodies", { limit: "200", offset: String(offset) });
    all = all.concat(res.data.map((b: any) => ({ ...b, key: b.body_key || b.key })));
    hasMore = res.meta.has_more;
    offset += 200;
  }
  return all.filter((b) => b.indexed === true);
}

async function fetchBodyWeekData(bodyKey: string, from: string, to: string) {
  const fromDate = new Date(from + "T00:00:00");
  const toDate = new Date(to + "T23:59:59");

  try {
    const [votingsRes, affairsRes, meetingsRes] = await Promise.all([
      apiFetch<Voting>("/votings", { body_key: bodyKey, sort_by: "-date", limit: "500" }),
      apiFetch<Affair>("/affairs", { body_key: bodyKey, sort_by: "-begin_date", limit: "500", exclude_null: "begin_date" }),
      apiFetch<any>("/meetings", { body_key: bodyKey, sort_by: "-begin_date", limit: "200", exclude_null: "begin_date" }),
    ]);

    const votings = votingsRes.data.filter((v) => {
      const d = new Date(v.date);
      return d >= fromDate && d <= toDate;
    });
    const affairs = affairsRes.data.filter((a: any) => {
      if (!a.begin_date) return false;
      const d = new Date(a.begin_date);
      return d >= fromDate && d <= toDate;
    });
    const meetings = meetingsRes.data.filter((m: any) => {
      if (!m.begin_date) return false;
      const d = new Date(m.begin_date);
      return d >= fromDate && d <= toDate;
    });

    return { bodyKey, votings, affairs, meetings: meetings.length };
  } catch (e) {
    console.error(`Error fetching ${bodyKey}:`, e);
    return { bodyKey, votings: [], affairs: [], meetings: 0 };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { year, week } = await req.json();
    if (!year || !week) throw new Error("year and week required");

    // Check cache first
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    const { data: cached } = await sb
      .from("weekly_digests")
      .select("*")
      .eq("year", year)
      .eq("week", week)
      .maybeSingle();

    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { from, to } = getWeekDateRange(year, week);

    // Fetch all bodies
    const bodies = await fetchAllBodies();

    // Fetch data for all bodies in batches of 10
    const allResults: Awaited<ReturnType<typeof fetchBodyWeekData>>[] = [];
    const batchSize = 10;
    for (let i = 0; i < bodies.length; i += batchSize) {
      const batch = bodies.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map((b) => fetchBodyWeekData(b.key!, from, to))
      );
      allResults.push(...results);
    }

    // Aggregate
    let totalVotings = 0;
    let totalAffairs = 0;
    let totalMeetings = 0;
    const activeBodies: { key: string; name: string; votings: number; affairs: number }[] = [];
    const allVotings: (Voting & { bodyName: string })[] = [];
    const allAffairTitles: { id: number; title: string; bodyKey: string }[] = [];

    for (const r of allResults) {
      const body = bodies.find((b) => b.key === r.bodyKey);
      const bodyName = body?.name_de || r.bodyKey;
      totalVotings += r.votings.length;
      totalAffairs += r.affairs.length;
      totalMeetings += r.meetings;

      if (r.votings.length > 0 || r.affairs.length > 0) {
        activeBodies.push({
          key: r.bodyKey,
          name: bodyName,
          votings: r.votings.length,
          affairs: r.affairs.length,
        });
      }

      for (const v of r.votings) {
        allVotings.push({ ...v, bodyName });
      }
      for (const a of r.affairs) {
        if (a.title_de) {
          allAffairTitles.push({ id: a.id, title: a.title_de, bodyKey: r.bodyKey });
        }
      }
    }

    // Sort active bodies by total activity
    activeBodies.sort((a, b) => (b.votings + b.affairs) - (a.votings + a.affairs));

    // Find closest votings (smallest margin)
    const closestVotings = allVotings
      .map((v) => ({ voting: v, bodyName: v.bodyName, margin: Math.abs(v.results_yes - v.results_no) }))
      .sort((a, b) => a.margin - b.margin)
      .slice(0, 5);

    // AI tagging for topic radar (top 30 affairs)
    let topicRadar: { tag: string; count: number; bodies: string[]; affairs: { id: number; title: string; bodyKey: string }[] }[] = [];
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (LOVABLE_API_KEY && allAffairTitles.length > 0) {
      const topAffairs = allAffairTitles.slice(0, 30);
      const titleList = topAffairs
        .map((a, i) => `${i + 1}. [ID:${a.id}] ${a.title}`)
        .join("\n");

      try {
        const tagRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                content: `Du bist ein Experte für Schweizer Parlamentspolitik. Verschlagworte Geschäfte mit 1-2 kurzen deutschen Schlagworten. Antworte NUR mit dem tool call.`,
              },
              {
                role: "user",
                content: `Verschlagworte:\n\n${titleList}`,
              },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "tag_affairs",
                  description: "Return tags for each affair.",
                  parameters: {
                    type: "object",
                    properties: {
                      results: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "number" },
                            tags: { type: "array", items: { type: "string" } },
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
            tool_choice: { type: "function", function: { name: "tag_affairs" } },
          }),
        });

        if (tagRes.ok) {
          const tagData = await tagRes.json();
          const toolCall = tagData.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall?.function?.arguments) {
            const parsed = JSON.parse(toolCall.function.arguments);
            const tagCounts = new Map<string, { count: number; bodies: Set<string>; affairs: { id: number; title: string; bodyKey: string }[] }>();
            for (const r of parsed.results || []) {
              const affair = topAffairs.find((a) => a.id === r.id);
              for (const tag of r.tags || []) {
                if (!tagCounts.has(tag)) tagCounts.set(tag, { count: 0, bodies: new Set(), affairs: [] });
                const entry = tagCounts.get(tag)!;
                entry.count++;
                if (affair) {
                  entry.bodies.add(affair.bodyKey);
                  entry.affairs.push({ id: affair.id, title: affair.title, bodyKey: affair.bodyKey });
                }
              }
            }
            topicRadar = Array.from(tagCounts.entries())
              .map(([tag, { count, bodies: bs, affairs }]) => ({ tag, count, bodies: Array.from(bs), affairs }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 10);
          }
        }
      } catch (e) {
        console.error("Tagging error:", e);
      }
    }

    // AI weekly summary
    let summary = "";
    if (LOVABLE_API_KEY && (totalVotings > 0 || totalAffairs > 0)) {
      const summaryContext = [
        `Kalenderwoche ${week}/${year}, ${from} bis ${to}`,
        `${activeBodies.length} aktive Parlamente, ${totalVotings} Abstimmungen, ${totalAffairs} Geschäfte, ${totalMeetings} Sitzungen.`,
        closestVotings.length > 0
          ? `Knappste Abstimmungen: ${closestVotings.slice(0, 3).map((c) => `"${c.voting.affair_title_de || c.voting.title_de}" in ${c.bodyName} (${c.voting.results_yes}:${c.voting.results_no})`).join("; ")}`
          : "",
        topicRadar.length > 0
          ? `Hauptthemen: ${topicRadar.slice(0, 5).map((t) => `${t.tag} (${t.count}x)`).join(", ")}`
          : "",
        activeBodies.length > 0
          ? `Aktivste Parlamente: ${activeBodies.slice(0, 3).map((b) => `${b.name} (${b.affairs} Geschäfte, ${b.votings} Abstimmungen)`).join("; ")}`
          : "",
      ].filter(Boolean).join("\n");

      try {
        const sumRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                content: `Du bist ein Schweizer Politik-Journalist. Fasse die parlamentarische Woche über alle Ebenen (national, kantonal, kommunal) in 5-8 Sätzen zusammen. Schreibe allgemeinverständlich, neutral und informativ. Erwähne die wichtigsten Themen, knappe Abstimmungen und besonders aktive Parlamente.`,
              },
              {
                role: "user",
                content: `Fasse diese Parlamentswoche zusammen:\n\n${summaryContext}`,
              },
            ],
          }),
        });

        if (sumRes.ok) {
          const sumData = await sumRes.json();
          summary = sumData.choices?.[0]?.message?.content || "";
        }
      } catch (e) {
        console.error("Summary error:", e);
      }
    }

    const result = {
      year,
      week,
      stats: {
        totalBodies: activeBodies.length,
        totalVotings,
        totalAffairs,
        totalMeetings,
        activeBodies: activeBodies.slice(0, 15),
      },
      topic_radar: topicRadar,
      closest_votings: closestVotings.map((c) => ({
        voting: {
          id: c.voting.id,
          body_key: c.voting.body_key,
          affair_title_de: c.voting.affair_title_de,
          title_de: c.voting.title_de,
          results_yes: c.voting.results_yes,
          results_no: c.voting.results_no,
          results_abstention: c.voting.results_abstention,
          decision: c.voting.decision,
          date: c.voting.date,
        },
        bodyName: c.bodyName,
        margin: c.margin,
      })),
      summary,
      date_range: { from, to },
    };

    // Cache in DB
    await sb.from("weekly_digests").upsert({
      year,
      week,
      stats: result.stats,
      topic_radar: result.topic_radar,
      closest_votings: result.closest_votings,
      summary: result.summary,
      date_range: result.date_range,
    }, { onConflict: "year,week" });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("weekly-digest error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
