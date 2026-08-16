/** Fixed topic taxonomy used for AI classification, profile interests and filters. */

export interface Topic {
  key: string;
  label: string;
}

export const TOPICS: Topic[] = [
  { key: "verkehr", label: "Verkehr & Mobilität" },
  { key: "gesundheit", label: "Gesundheit" },
  { key: "bildung", label: "Bildung" },
  { key: "umwelt", label: "Umwelt & Klima" },
  { key: "energie", label: "Energie" },
  { key: "wirtschaft", label: "Wirtschaft & Arbeit" },
  { key: "finanzen", label: "Finanzen & Steuern" },
  { key: "migration", label: "Migration & Asyl" },
  { key: "sicherheit", label: "Sicherheit & Polizei" },
  { key: "justiz", label: "Justiz & Recht" },
  { key: "soziales", label: "Sozialpolitik" },
  { key: "wohnen", label: "Wohnen & Raumplanung" },
  { key: "landwirtschaft", label: "Landwirtschaft" },
  { key: "digitalisierung", label: "Digitalisierung" },
  { key: "kultur", label: "Kultur & Sport" },
  { key: "aussenpolitik", label: "Aussenpolitik" },
  { key: "institutionen", label: "Verwaltung & Institutionen" },
];

export const topicLabel = (key: string) =>
  TOPICS.find((t) => t.key === key)?.label ?? key;
