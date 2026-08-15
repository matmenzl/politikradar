import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, json } from "../_shared/scoring.ts";

const BASE_URL = "https://api.openparldata.ch/v1";

interface Voting {
  id: number;
  body_key: string;
  date: string;
  affair_id: number;
  results_yes: number;
  results_no: number;
  results_abstention: number;
  results_absent: number;
  decision?: string;
  title_de?: string;
  affair_title_de?: string;
  url_external_de?: string;
}

interface Affair {
  id: number;
  body_key: string;
  external_id?: string;
  title_de?: string;
  begin_date?: string;
  end_date?: string;
  status_de?: string;
  type_de?: string;
  url_external_de?: string;
}

interface Body {
  key: string;
  name_de?: string;
  type?: string;
  canton?: string;
}

async function api<T>(endpoint: string, params: Record<string, string>): Promise<{ data: T[]; meta: { has_more: boolean } }> {
  const qs = new URLSearchParams({ lang: "de", lang_format: "flat", ...params }).toString();
  const res = await fetch(`${BASE_URL}${endpoint}?${qs}`);
  if (!res.ok) throw new Error(`OpenParlData ${endpoint}: ${res.status}`);
  return res.json();
}

/** Pages a date-sorted endpoint until the range is covered (bounded). */
async function fetchRange<T extends Record<string, unknown>>(
  endpoint: string,
  params: Record<string, string>,
  dateField: string,
  from: string,
  to: string,
): Promise<T[]> {
  const out: T[] = [];
  const limit = 100;
  let offset = 0;
  const fromDate = new Date(from);
  const toDate = new Date(`${to}T23:59:59`);
  for (let page = 0; page < 400; page++) {
    const res = await api<T>(endpoint, { ...params, limit: String(limit), offset: String(offset) });
    if (!res.data?.length) break;
    let done = false;
    for (const row of res.data) {
      const raw = row[dateField] as string | undefined;
      if (!raw) continue;
      const d = new Date(raw);
      if (d > toDate) continue;
      if (d < fromDate) { done = true; break; }
      out.push(row);
    }
    if (done || !res.meta?.has_more) break;
    offset += limit;
  }
  return out;
}

async function fetchBodies(): Promise<Record<string, Body>> {
  const map: Record<string, Body> = {
    CHE: { key: "CHE", name_de: "Schweiz (Bundesparlament)", type: "country" },
  };
  let offset = 0;
  for (let i = 0; i < 10; i++) {
    const res = await api<Body>("/bodies", { limit: "100", offset: String(offset) });
    for (const b of res.data || []) map[b.key] = b;
    if (!res.meta?.has_more) break;
    offset += 100;
  }
  return map;
}

const levelOf = (b?: Body) => {
  if (!b) return "unknown";
  if (b.type === "country") return "bund";
  if (b.type === "canton") return "kanton";
  if (b.type === "city" || b.type === "municipality") return "gemeinde";
  return "unknown";
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { from, to } = await req.json();
    if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      return json({ error: "from und to (YYYY-MM-DD) sind erforderlich" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const [bodies, votings, affairs] = await Promise.all([
      fetchBodies(),
      fetchRange<Voting & Record<string, unknown>>("/votings", { sort_by: "-date" }, "date", from, to),
      fetchRange<Affair & Record<string, unknown>>(
        "/affairs",
        { sort_by: "-begin_date", exclude_null: "begin_date" },
        "begin_date",
        from,
        to,
      ),
    ]);

    let inserted = 0;
    let skipped = 0;

    const upsertEvent = async (
      e: {
        parliament_key: string;
        event_type: string;
        event_date: string;
        title: string;
        description?: string;
        business_id?: string;
        affair_id?: string;
        voting_id?: string;
        url?: string;
      },
      facts: { fact_type: string; label: string; value: string }[],
    ) => {
      const dedupe_key = [e.parliament_key, e.business_id || "", e.event_type, e.event_date].join("|");
      const { data: existing } = await supabase.from("events").select("id").eq("dedupe_key", dedupe_key).maybeSingle();
      if (existing) { skipped++; return; }

      let source_id: string | null = null;
      if (e.url) {
        const { data: src } = await supabase
          .from("sources")
          .insert({ url: e.url, label: "Parlamentsseite", source_type: "primary" })
          .select("id")
          .single();
        source_id = src?.id ?? null;
      }

      const body = bodies[e.parliament_key];
      const { data: ev, error } = await supabase
        .from("events")
        .insert({
          parliament: body?.name_de || e.parliament_key,
          parliament_key: e.parliament_key,
          political_level: levelOf(body),
          canton: body?.canton ?? null,
          business_id: e.business_id ?? null,
          affair_id: e.affair_id ?? null,
          voting_id: e.voting_id ?? null,
          event_type: e.event_type,
          event_date: e.event_date,
          title: e.title,
          description: e.description ?? null,
          source_id,
          dedupe_key,
        })
        .select("id")
        .single();
      if (error) { skipped++; return; }
      inserted++;

      if (facts.length && ev) {
        await supabase.from("facts").insert(
          facts.map((f, i) => ({ ...f, event_id: ev.id, source_id, position: i })),
        );
      }
    };

    for (const v of votings) {
      const title = v.title_de || v.affair_title_de || "Abstimmung";
      const total = (v.results_yes || 0) + (v.results_no || 0) + (v.results_abstention || 0);
      const accepted = v.decision
        ? ["ja", "yes", "accepted", "angenommen"].includes(v.decision.toLowerCase())
        : (v.results_yes || 0) > (v.results_no || 0);
      await upsertEvent(
        {
          parliament_key: v.body_key,
          event_type: "voting",
          event_date: String(v.date).slice(0, 10),
          title,
          description: v.affair_title_de,
          business_id: v.affair_id ? String(v.affair_id) : String(v.id),
          affair_id: v.affair_id ? String(v.affair_id) : undefined,
          voting_id: String(v.id),
          url: v.url_external_de,
        },
        [
          { fact_type: "date", label: "Datum", value: String(v.date).slice(0, 10) },
          { fact_type: "result", label: "Ergebnis", value: accepted ? "Angenommen" : "Abgelehnt" },
          { fact_type: "votes_yes", label: "Ja-Stimmen", value: String(v.results_yes ?? 0) },
          { fact_type: "votes_no", label: "Nein-Stimmen", value: String(v.results_no ?? 0) },
          { fact_type: "votes_abstention", label: "Enthaltungen", value: String(v.results_abstention ?? 0) },
          { fact_type: "votes_total", label: "Abgegebene Stimmen", value: String(total) },
        ],
      );
    }

    for (const a of affairs) {
      if (!a.title_de) continue;
      await upsertEvent(
        {
          parliament_key: a.body_key,
          event_type: "affair",
          event_date: String(a.end_date || a.begin_date).slice(0, 10),
          title: a.title_de,
          description: a.status_de,
          business_id: a.external_id || String(a.id),
          affair_id: String(a.id),
          url: a.url_external_de,
        },
        [
          { fact_type: "date", label: "Datum", value: String(a.begin_date || "").slice(0, 10) },
          ...(a.type_de ? [{ fact_type: "affair_type", label: "Geschäftstyp", value: a.type_de }] : []),
          ...(a.status_de ? [{ fact_type: "status", label: "Status", value: a.status_de }] : []),
        ],
      );
    }

    return json({ inserted, skipped, scanned: votings.length + affairs.length });
  } catch (e) {
    console.error("detect-events", e);
    return json({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }, 500);
  }
});
