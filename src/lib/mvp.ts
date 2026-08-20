/** Shared types and labels for the PolitikRadar MVP. */

export interface EventRow {
  id: string;
  parliament: string;
  parliament_key: string | null;
  political_level: string;
  canton: string | null;
  business_id: string | null;
  affair_id: string | null;
  voting_id: string | null;
  event_type: string;
  event_date: string;
  title: string;
  description: string | null;
  source_id: string | null;
  political_relevance: number | null;
  social_potential: number | null;
  editorial_confidence: number | null;
  score_factors: Record<string, unknown>;
  selection_status: string;
  topics: string[] | null;
  exclusion_reason: string | null;
  affair_state?: string | null;
}

export interface FactRow {
  id: string;
  event_id: string;
  fact_type: string;
  label: string;
  value: string;
  verified: boolean;
  position: number;
  source_id: string | null;
}

export interface StoryRow {
  id: string;
  event_id: string | null;
  status: string;
  headline: string;
  summary: string | null;
  political_relevance: number | null;
  social_potential: number | null;
  editorial_confidence: number | null;
  created_at: string;
}

export interface SlideRow {
  id: string;
  story_id: string;
  position: number;
  slide_type: string;
  headline: string | null;
  body: string | null;
  visualization: Record<string, unknown>;
  source_id: string | null;
}

export const TOP_STORY_THRESHOLD = 70;
export const REVIEW_THRESHOLD = 60;

export const STORY_STATUS: { value: string; label: string }[] = [
  { value: "draft", label: "Entwurf" },
  { value: "ai_generated", label: "KI erstellt" },
  { value: "in_review", label: "In Prüfung" },
  { value: "approved", label: "Freigegeben" },
  { value: "published", label: "Publiziert" },
];

export const statusLabel = (value: string) =>
  STORY_STATUS.find((s) => s.value === value)?.label ?? value;

export const LEVEL_LABELS: Record<string, string> = {
  bund: "Bund",
  kanton: "Kanton",
  gemeinde: "Gemeinde",
  unknown: "Unbekannt",
};

export const SLIDE_TYPE_LABELS: Record<string, string> = {
  hook: "Was ist passiert",
  context: "Worum geht es",
  decision: "Was wurde beschlossen",
  vote: "Wie wurde abgestimmt",
  positions: "Wer war dafür, wer dagegen",
  outlook: "Was passiert jetzt",
  sources: "Quellen",
};

export const FACTOR_LABELS: Record<string, string> = {
  decision_impact: "Entscheidwirkung (30%)",
  scope: "Reichweite (25%)",
  controversy: "Umstrittenheit (20%)",
  topic_salience: "Themenaktualität (15%)",
  process_stage: "Verfahrensstand (10%)",
  emotional_hook: "Emotionaler Aufhänger (20%)",
  clarity: "Verständlichkeit (20%)",
  everyday_relevance: "Alltagsrelevanz (20%)",
  conflict: "Konflikt (15%)",
  visual_potential: "Visualisierbarkeit (15%)",
  novelty: "Neuigkeitswert (10%)",
};

export type Priority = "top" | "review" | "low";

export function priorityOf(
  e: Pick<EventRow, "political_relevance" | "social_potential">,
  thresholds: { top_story: number; review: number } = {
    top_story: TOP_STORY_THRESHOLD,
    review: REVIEW_THRESHOLD,
  },
): Priority {
  const pr = e.political_relevance ?? 0;
  const sp = e.social_potential ?? 0;
  if (pr >= thresholds.top_story && sp >= thresholds.top_story) return "top";
  if (pr >= thresholds.review || sp >= thresholds.review) return "review";
  return "low";
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  top: "Top Story",
  review: "Prüfen",
  low: "Niedrige Priorität",
};

/** ISO date string for today shifted by a number of days. */
export function isoDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
