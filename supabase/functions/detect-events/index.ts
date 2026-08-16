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
  body_key: string;
  name_de?: string;
  name?: string;
  type?: string;
  canton_key?: string;
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
    CHE: { body_key: "CHE", name_de: "Schweiz (Bundesparlament)", type: "country" },
  };
  let offset = 0;
  for (let i = 0; i < 12; i++) {
    const res = await api<Body>("/bodies", { limit: "200", offset: String(offset) });
    for (const b of res.data || []) if (b.body_key) map[String(b.body_key)] = b;
    if (!res.meta?.has_more) break;
    offset += 200;
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

/** Cantons missing from the German /bodies listing. */
const CANTON_FALLBACK: Record<string, string> = {
  TI: "Tessin", GE: "Genf", VD: "Waadt", NE: "Neuenburg", JU: "Jura",
};

/** Human readable parliament label, e.g. "Kanton Zürich" or "Adliswil (ZH)". */
const nameOf = (b: Body | undefined, key: string) => {
  const base = b?.name_de || b?.name;
  if (!base) return CANTON_FALLBACK[key] ? `Kanton ${CANTON_FALLBACK[key]}` : key;
  if (b?.type === "canton") return `Kanton ${base}`;
  if ((b?.type === "city" || b?.type === "municipality") && b?.canton_key) {
    return base.includes("(") ? base : `${base} (${b.canton_key})`;
  }
  return base;
};

interface CandidateEvent {
  parliament_key: string;
  event_type: string;
  event_date: string;
  title: string;
  description?: string;
  business_id?: string;
  affair_id?: string;
  voting_id?: string;
  url?: string;
  facts: { fact_type: string; label: string; value: string }[];
}

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

    const candidates: CandidateEvent[] = [];

    for (const v of votings) {
      const title = v.title_de || v.affair_title_de || "Abstimmung";
      const total = (v.results_yes || 0) + (v.results_no || 0) + (v.results_abstention || 0);
      const accepted = v.decision
        ? ["ja", "yes", "accepted", "angenommen"].includes(v.decision.toLowerCase())
        : (v.results_yes || 0) > (v.results_no || 0);
      candidates.push({
        parliament_key: v.body_key,
        event_type: "voting",
        event_date: String(v.date).slice(0, 10),
        title,
        description: v.affair_title_de,
        business_id: v.affair_id ? String(v.affair_id) : String(v.id),
        affair_id: v.affair_id ? String(v.affair_id) : undefined,
        voting_id: String(v.id),
        url: v.url_external_de,
        facts: [
          { fact_type: "date", label: "Datum", value: String(v.date).slice(0, 10) },
          { fact_type: "result", label: "Ergebnis", value: accepted ? "Angenommen" : "Abgelehnt" },
          { fact_type: "votes_yes", label: "Ja-Stimmen", value: String(v.results_yes ?? 0) },
          { fact_type: "votes_no", label: "Nein-Stimmen", value: String(v.results_no ?? 0) },
          { fact_type: "votes_abstention", label: "Enthaltungen", value: String(v.results_abstention ?? 0) },
          { fact_type: "votes_total", label: "Abgegebene Stimmen", value: String(total) },
        ],
      });
    }

    for (const a of affairs) {
      if (!a.title_de) continue;
      candidates.push({
        parliament_key: a.body_key,
        event_type: "affair",
        event_date: String(a.end_date || a.begin_date).slice(0, 10),
        title: a.title_de,
        description: a.status_de,
        business_id: a.external_id || String(a.id),
        affair_id: String(a.id),
        url: a.url_external_de,
        facts: [
          { fact_type: "date", label: "Datum", value: String(a.begin_date || "").slice(0, 10) },
          ...(a.type_de ? [{ fact_type: "affair_type", label: "Geschäftstyp", value: a.type_de }] : []),
          ...(a.status_de ? [{ fact_type: "status", label: "Status", value: a.status_de }] : []),
        ],
      });
    }

    let inserted = 0;
    let skipped = 0;

    if (candidates.length === 0) {
      return json({ inserted, skipped, scanned: 0 });
    }

    const keyOf = (c: CandidateEvent) =>
      [c.parliament_key, c.business_id || "", c.event_type, c.event_date].join("|");

    const chunk = <T,>(arr: T[], size: number): T[][] => {
      const out: T[][] = [];
      for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
      return out;
    };

    // Existing events (chunked .in() to keep the URL small).
    const existingKeys = new Set<string>();
    for (const part of chunk([...new Set(candidates.map(keyOf))], 300)) {
      const { data } = await supabase.from("events").select("dedupe_key").in("dedupe_key", part);
      for (const r of data || []) existingKeys.add(r.dedupe_key as string);
    }

    // Filter out already-known events AND duplicates within this batch.
    const seen = new Set<string>();
    const newCandidates = candidates.filter((c) => {
      const key = keyOf(c);
      if (existingKeys.has(key) || seen.has(key)) { skipped++; return false; }
      seen.add(key);
      return true;
    });

    if (newCandidates.length === 0) {
      return json({ inserted: 0, skipped, scanned: candidates.length });
    }

    // Sources: reuse existing rows, insert only missing URLs.
    const urls = [...new Set(newCandidates.map((c) => c.url).filter(Boolean))] as string[];
    const urlToSourceId: Record<string, string> = {};
    for (const part of chunk(urls, 200)) {
      const { data: found } = await supabase.from("sources").select("id, url").in("url", part);
      for (const s of found || []) urlToSourceId[s.url as string] = s.id as string;
      const missing = part.filter((u) => !urlToSourceId[u]);
      if (missing.length) {
        const { data: created, error } = await supabase
          .from("sources")
          .insert(missing.map((url) => ({ url, label: "Parlamentsseite", source_type: "primary" })))
          .select("id, url");
        if (error) console.error("sources insert", error);
        for (const s of created || []) urlToSourceId[s.url as string] = s.id as string;
      }
    }

    // Batch insert events.
    const eventRows = newCandidates.map((c) => {
      const body = bodies[c.parliament_key];
      return {
        parliament: nameOf(body, c.parliament_key),
        parliament_key: c.parliament_key,
        political_level: levelOf(body),
        canton: body?.canton_key ?? (body?.type === "canton" ? c.parliament_key : null),
        business_id: c.business_id ?? null,
        affair_id: c.affair_id ?? null,
        voting_id: c.voting_id ?? null,
        event_type: c.event_type,
        event_date: c.event_date,
        title: c.title,
        description: c.description ?? null,
        source_id: c.url ? urlToSourceId[c.url] ?? null : null,
        dedupe_key: keyOf(c),
      };
    });

    const dedupeKeyToEventId: Record<string, string> = {};
    let lastError: unknown = null;
    for (const part of chunk(eventRows, 200)) {
      const { data, error } = await supabase
        .from("events")
        .upsert(part, { onConflict: "dedupe_key", ignoreDuplicates: true })
        .select("id, dedupe_key");
      if (error) { console.error("events insert", error); lastError = error; continue; }
      for (const e of data || []) dedupeKeyToEventId[e.dedupe_key as string] = e.id as string;
    }
    inserted = Object.keys(dedupeKeyToEventId).length;

    if (inserted === 0 && lastError) {
      return json({
        error: `Ereignisse konnten nicht gespeichert werden: ${
          (lastError as { message?: string }).message ?? "unbekannt"
        }`,
      }, 500);
    }

    // Batch insert facts.
    const factRows = newCandidates.flatMap((c) => {
      const eventId = dedupeKeyToEventId[keyOf(c)];
      if (!eventId) return [];
      const sourceId = c.url ? urlToSourceId[c.url] ?? null : null;
      return c.facts.map((f, i) => ({ ...f, event_id: eventId, source_id: sourceId, position: i }));
    });

    for (const part of chunk(factRows, 500)) {
      const { error } = await supabase.from("facts").insert(part);
      if (error) console.error("facts insert", error);
    }

    return json({ inserted, skipped, scanned: candidates.length });
  } catch (e) {
    console.error("detect-events", e);
    return json({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }, 500);
  }
});
