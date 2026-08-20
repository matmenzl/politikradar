/** Canonical procedural stages per business type + mapping of real OpenParlData steps. */

export interface TimelineStep {
  date: string | null;
  title: string;
  actor: string | null;
  position: number;
  last: boolean;
  url?: string | null;
}

export interface DisplayStep {
  title: string;
  date: string | null;
  actor: string | null;
  state: "done" | "current" | "upcoming";
}

/** Ordered canonical stages. Keys are matched loosely against the business type. */
const STAGE_MODELS: { match: RegExp; stages: string[] }[] = [
  {
    match: /motion|parlamentarische initiative|standesinitiative/i,
    stages: [
      "Eingereicht",
      "Stellungnahme Regierung",
      "Behandlung im Parlament",
      "Entscheid",
      "Umsetzung",
    ],
  },
  {
    match: /postulat/i,
    stages: ["Eingereicht", "Stellungnahme Regierung", "Behandlung im Parlament", "Entscheid", "Bericht"],
  },
  {
    match: /interpellation|anfrage|fragestunde|frage/i,
    stages: ["Eingereicht", "Antwort Regierung", "Behandlung im Parlament", "Erledigt"],
  },
  {
    match: /regierungsgesch|botschaft|vorlage|gesetz|dekret|beschluss/i,
    stages: [
      "Eingereicht",
      "Kommissionsberatung",
      "Behandlung im Parlament",
      "Schlussabstimmung",
      "Inkrafttreten",
    ],
  },
  {
    match: /vernehmlassung/i,
    stages: ["Eröffnung", "Vernehmlassung läuft", "Auswertung", "Abschluss"],
  },
  {
    match: /wahl/i,
    stages: ["Ausgeschrieben", "Kandidaturen", "Wahlgeschäft im Parlament", "Gewählt"],
  },
];

/** Words that indicate a step already closes the procedure. */
const FINAL_STEP = /erledigt|abgeschrieben|beschlossen|abgelehnt|zur[üu]ckgezogen|gew[äa]hlt|in kraft|abgeschlossen/i;

const NORM = (s: string) => s.toLowerCase().replace(/[^a-zäöüß ]/g, "").trim();

/** Maps a real step title onto a canonical stage index, or -1. */
function stageIndexFor(title: string, stages: string[]): number {
  const t = NORM(title);
  let best = -1;
  stages.forEach((stage, i) => {
    const s = NORM(stage);
    const head = s.split(" ")[0];
    if (t.includes(s) || (head.length > 4 && t.includes(head))) best = i;
  });
  if (best === -1) {
    if (/eingereicht|einreichung|eingang/.test(t)) best = 0;
    else if (/antwort|stellungnahme/.test(t)) best = stages.findIndex((s) => /antwort|stellungnahme/i.test(s));
    else if (/kommission/.test(t)) best = stages.findIndex((s) => /kommission/i.test(s));
    else if (/behandl|beratung|plenum|sitzung|traktand/.test(t))
      best = stages.findIndex((s) => /behandlung|parlament/i.test(s));
    else if (FINAL_STEP.test(t)) best = stages.length - 1;
  }
  return best;
}

function stagesFor(businessType: string | null | undefined): string[] | null {
  if (!businessType) return null;
  return STAGE_MODELS.find((m) => m.match.test(businessType))?.stages ?? null;
}

/**
 * Builds the display timeline: real steps (done/current) plus the remaining
 * canonical stages of the business type, flagged as upcoming.
 */
export function buildTimeline(
  steps: TimelineStep[],
  businessType?: string | null,
): { steps: DisplayStep[]; hasForecast: boolean } {
  const sorted = [...steps].sort((a, b) => {
    if (a.date && b.date && a.date !== b.date) return a.date.localeCompare(b.date);
    return a.position - b.position;
  });

  const currentIndex = sorted.length - 1;
  const display: DisplayStep[] = sorted.map((s, i) => ({
    title: s.title,
    date: s.date,
    actor: s.actor,
    state: i === currentIndex ? "current" : "done",
  }));

  const stages = stagesFor(businessType);
  const lastTitle = sorted[currentIndex]?.title ?? "";
  const closed = FINAL_STEP.test(lastTitle);

  if (!stages || closed) return { steps: display, hasForecast: false };

  const reached = Math.max(
    -1,
    ...sorted.map((s) => stageIndexFor(s.title, stages)),
  );
  const upcoming = stages.slice(reached + 1).map<DisplayStep>((title) => ({
    title,
    date: null,
    actor: null,
    state: "upcoming",
  }));

  return { steps: [...display, ...upcoming], hasForecast: upcoming.length > 0 };
}

export function formatStepDate(date: string | null): string | null {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("de-CH", { day: "2-digit", month: "short", year: "numeric" });
}
