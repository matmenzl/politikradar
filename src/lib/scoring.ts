/** Explainable scoring configuration: weights + thresholds, editable at runtime. */
import { supabase } from "@/integrations/supabase/client";

export type WeightMap = Record<string, number>;

export interface ScoringConfig {
  relevance_weights: WeightMap;
  social_weights: WeightMap;
  thresholds: { top_story: number; review: number };
}

export const DEFAULT_SCORING: ScoringConfig = {
  relevance_weights: {
    decision_impact: 30,
    scope: 25,
    controversy: 20,
    topic_salience: 15,
    process_stage: 10,
  },
  social_weights: {
    emotional_hook: 20,
    clarity: 20,
    everyday_relevance: 20,
    conflict: 15,
    visual_potential: 15,
    novelty: 10,
  },
  thresholds: { top_story: 70, review: 60 },
};

/** Human labels and short explanations for every factor the KI returns. */
export const FACTOR_INFO: Record<string, { label: string; hint: string }> = {
  decision_impact: {
    label: "Entscheidwirkung",
    hint: "Wie stark verändert der Entscheid die Realität – bindend oder nur symbolisch?",
  },
  scope: {
    label: "Reichweite",
    hint: "Wie viele Menschen sind betroffen (Gemeinde, Kanton, ganze Schweiz)?",
  },
  controversy: {
    label: "Umstrittenheit",
    hint: "Wie knapp bzw. politisch umkämpft war das Geschäft?",
  },
  topic_salience: {
    label: "Themenaktualität",
    hint: "Wie präsent ist das Thema aktuell in der öffentlichen Debatte?",
  },
  process_stage: {
    label: "Verfahrensstand",
    hint: "Endgültiger Entscheid zählt mehr als ein früher Verfahrensschritt.",
  },
  emotional_hook: {
    label: "Emotionaler Aufhänger",
    hint: "Löst das Thema Betroffenheit, Ärger oder Freude aus?",
  },
  clarity: {
    label: "Verständlichkeit",
    hint: "Lässt sich der Kern in einem Satz erklären?",
  },
  everyday_relevance: {
    label: "Alltagsrelevanz",
    hint: "Spürt man die Folgen im eigenen Alltag (Geld, Wohnen, Verkehr, Gesundheit)?",
  },
  conflict: {
    label: "Konflikt",
    hint: "Gibt es klar erkennbare Lager oder Gegenpositionen?",
  },
  visual_potential: {
    label: "Visualisierbarkeit",
    hint: "Lässt sich das Ergebnis als Zahl, Diagramm oder Bild zeigen?",
  },
  novelty: {
    label: "Neuigkeitswert",
    hint: "Ist das neu oder überraschend – oder Routine?",
  },
};

export const RELEVANCE_FACTORS = Object.keys(DEFAULT_SCORING.relevance_weights);
export const SOCIAL_FACTORS = Object.keys(DEFAULT_SCORING.social_weights);

export function weightedScore(factors: Record<string, unknown>, weights: WeightMap): number {
  let total = 0;
  let weightSum = 0;
  for (const [key, weight] of Object.entries(weights)) {
    const value = Math.max(0, Math.min(100, Number(factors?.[key] ?? 0)));
    total += value * weight;
    weightSum += weight;
  }
  return weightSum === 0 ? 0 : Math.round(total / weightSum);
}

/** Share of a factor within its group, in percent. */
export function weightShare(weights: WeightMap, key: string): number {
  const sum = Object.values(weights).reduce((a, b) => a + (Number(b) || 0), 0);
  if (!sum) return 0;
  return Math.round(((Number(weights[key]) || 0) / sum) * 100);
}

export async function loadScoringConfig(): Promise<ScoringConfig> {
  const { data } = await supabase
    .from("scoring_config")
    .select("relevance_weights, social_weights, thresholds")
    .eq("id", "default")
    .maybeSingle();
  if (!data) return DEFAULT_SCORING;
  return {
    relevance_weights: (data.relevance_weights as WeightMap) || DEFAULT_SCORING.relevance_weights,
    social_weights: (data.social_weights as WeightMap) || DEFAULT_SCORING.social_weights,
    thresholds:
      (data.thresholds as ScoringConfig["thresholds"]) || DEFAULT_SCORING.thresholds,
  };
}

export async function saveScoringConfig(config: ScoringConfig) {
  return supabase.from("scoring_config").upsert({
    id: "default",
    relevance_weights: config.relevance_weights,
    social_weights: config.social_weights,
    thresholds: config.thresholds,
  });
}
