/** Shared scoring configuration for the PolitikRadar MVP. */

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/** Weights for political relevance (sum = 100). */
export const RELEVANCE_WEIGHTS = {
  decision_impact: 30,
  scope: 25,
  controversy: 20,
  topic_salience: 15,
  process_stage: 10,
} as const;

/** Weights for social potential (sum = 100). */
export const SOCIAL_WEIGHTS = {
  emotional_hook: 20,
  clarity: 20,
  everyday_relevance: 20,
  conflict: 15,
  visual_potential: 15,
  novelty: 10,
} as const;

export const THRESHOLDS = {
  top_story: 70,
  review: 60,
};

export type ScoreFactors = Record<string, number>;

export function weightedScore(factors: ScoreFactors, weights: Record<string, number>): number {
  let total = 0;
  let weightSum = 0;
  for (const [key, weight] of Object.entries(weights)) {
    const value = Math.max(0, Math.min(100, Number(factors[key] ?? 0)));
    total += value * weight;
    weightSum += weight;
  }
  return weightSum === 0 ? 0 : Math.round(total / weightSum);
}

export interface HardFilterInput {
  title?: string | null;
  event_type?: string | null;
  source_url?: string | null;
  has_event?: boolean;
}

/** Returns an exclusion reason, or null when the event passes the hard filters. */
export function hardFilter(input: HardFilterInput): string | null {
  const title = (input.title || "").trim();
  if (!title) return "Kein Ereignis erkennbar";
  if (input.has_event === false) return "Kein Ereignis, nur Dokument";
  if (!input.source_url) return "Keine belastbare Quelle";
  const administrative = [
    "protokoll",
    "traktandenliste",
    "sitzungsplan",
    "wahl des büros",
    "mitteilungen",
    "entschuldigungen",
    "genehmigung des protokolls",
  ];
  const lower = title.toLowerCase();
  if (administrative.some((a) => lower.includes(a))) return "Rein administrativ";
  return null;
}

export interface ScoringConfig {
  relevance_weights: Record<string, number>;
  social_weights: Record<string, number>;
  thresholds: { top_story: number; review: number };
}

export const DEFAULT_CONFIG: ScoringConfig = {
  relevance_weights: { ...RELEVANCE_WEIGHTS },
  social_weights: { ...SOCIAL_WEIGHTS },
  thresholds: { ...THRESHOLDS },
};

/** Loads the editable scoring config, falling back to the defaults. */
export async function loadScoringConfig(
  supabase: { from: (t: string) => any },
): Promise<ScoringConfig> {
  try {
    const { data } = await supabase
      .from("scoring_config")
      .select("relevance_weights, social_weights, thresholds")
      .eq("id", "default")
      .maybeSingle();
    if (!data) return DEFAULT_CONFIG;
    return {
      relevance_weights: data.relevance_weights || DEFAULT_CONFIG.relevance_weights,
      social_weights: data.social_weights || DEFAULT_CONFIG.social_weights,
      thresholds: data.thresholds || DEFAULT_CONFIG.thresholds,
    };
  } catch (_e) {
    return DEFAULT_CONFIG;
  }
}
