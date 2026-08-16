/** Fixed topic taxonomy shared by scoring and alert functions. */

export const TOPIC_KEYS = [
  "verkehr",
  "gesundheit",
  "bildung",
  "umwelt",
  "energie",
  "wirtschaft",
  "finanzen",
  "migration",
  "sicherheit",
  "justiz",
  "soziales",
  "wohnen",
  "landwirtschaft",
  "digitalisierung",
  "kultur",
  "aussenpolitik",
  "institutionen",
] as const;

export const TOPIC_LABELS: Record<string, string> = {
  verkehr: "Verkehr & Mobilität",
  gesundheit: "Gesundheit",
  bildung: "Bildung",
  umwelt: "Umwelt & Klima",
  energie: "Energie",
  wirtschaft: "Wirtschaft & Arbeit",
  finanzen: "Finanzen & Steuern",
  migration: "Migration & Asyl",
  sicherheit: "Sicherheit & Polizei",
  justiz: "Justiz & Recht",
  soziales: "Sozialpolitik",
  wohnen: "Wohnen & Raumplanung",
  landwirtschaft: "Landwirtschaft",
  digitalisierung: "Digitalisierung",
  kultur: "Kultur & Sport",
  aussenpolitik: "Aussenpolitik",
  institutionen: "Verwaltung & Institutionen",
};

export const normalizeTopics = (input: unknown): string[] => {
  if (!Array.isArray(input)) return [];
  const allowed = new Set<string>(TOPIC_KEYS as readonly string[]);
  return [...new Set(input.map((t) => String(t).trim().toLowerCase()).filter((t) => allowed.has(t)))].slice(0, 3);
};
