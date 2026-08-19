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

/**
 * Deterministische Themen-Zuordnung anhand von Stichwörtern.
 * Wird beim Laden der Daten angewendet, damit der Themenfilter sofort greift.
 * Die KI-Bewertung darf die Themen später präzisieren.
 */
const TOPIC_PATTERNS: Array<[string, RegExp]> = [
  ["verkehr", /\b(verkehr|mobilit|strasse|straße|autobahn|bahn|zug|öv|velo|fahrrad|fussgäng|flughafen|luftfahrt|tram|bus|parkplatz|tempo\s?30)/i],
  ["gesundheit", /\b(gesundheit|spital|spitäl|krankenkasse|krankenversicherung|pflege|arzt|ärzt|medizin|patient|prämien|epidemi|pandemi|sucht|psychi)/i],
  ["bildung", /\b(bildung|schule|schul|volksschul|gymnasi|universit|hochschul|fachhochschul|lehrer|lehrpersonen|berufsbildung|lehrstell|kita|kinderbetreuung|forschung)/i],
  ["umwelt", /\b(umwelt|klima|co2|biodivers|natur|gewässer|luftreinhalt|lärm|abfall|recycling|wald|artenschutz|nachhaltig)/i],
  ["energie", /\b(energie|strom|elektrizit|solar|photovolta|windkraft|wasserkraft|kernkraft|atomkraft|gas|netzentgelt|stromnetz|heizung)/i],
  ["wirtschaft", /\b(wirtschaft|arbeit|arbeitsmarkt|gewerbe|kmu|unternehmen|tourismus|handel|lohn|gesamtarbeitsvertrag|standortförder|innovation|arbeitslos)/i],
  ["finanzen", /\b(finanz|budget|steuer|mwst|mehrwertsteuer|abgabe|gebühr|staatsrechnung|jahresrechnung|kredit|subvention|schulden|voranschlag|nachtragskredit|beitrag)/i],
  ["migration", /\b(migration|asyl|flüchtling|ausländer|einbürger|integration|aufenthaltsbewilligung|sans-papiers)/i],
  ["sicherheit", /\b(sicherheit|polizei|feuerwehr|zivilschutz|bevölkerungsschutz|armee|militär|waffen|kriminalit|gewaltschutz|notruf)/i],
  ["justiz", /\b(justiz|recht|gericht|staatsanwalt|strafrecht|zivilrecht|verfassung|gesetzesrevision|strafvollzug|haft|datenschutzrecht)/i],
  ["soziales", /\b(sozial|sozialhilfe|ahv|iv|invaliden|ergänzungsleistung|altersvorsorge|pensionskasse|rente|familienzulage|armut|kinderzulage|behinder)/i],
  ["wohnen", /\b(wohn|miete|mietzins|raumplanung|zonenplan|nutzungsplan|bauordnung|baugesuch|siedlung|quartier|bodenrecht|leerstand)/i],
  ["landwirtschaft", /\b(landwirtschaft|bauern|bäuerin|agrar|direktzahlung|nutztier|tierschutz|lebensmittelproduktion|ernte|hof)/i],
  ["digitalisierung", /\b(digital|informatik|it-|software|e-government|cyber|künstliche intelligenz|\bki\b|daten(schutz|bank)|breitband|glasfaser|plattform)/i],
  ["kultur", /\b(kultur|sport|museum|theater|bibliothek|festival|denkmal|musik|film|sportanlage|verein)/i],
  ["aussenpolitik", /\b(aussenpolitik|außenpolitik|europa|eu-|bilateral|uno|international|entwicklungszusammenarbeit|sanktion|aussenwirtschaft|neutralit)/i],
  ["institutionen", /\b(verwaltung|organisation|reglement|geschäftsordnung|wahl|parlament|regierungsrat|gemeinderat|behörde|amtsdauer|revision des gesetzes über die organisation|kommission|petition|motion|interpellation|postulat)/i],
];

export const guessTopics = (title: string, description?: string | null): string[] => {
  const text = `${title} ${description ?? ""}`;
  const hits: string[] = [];
  for (const [key, re] of TOPIC_PATTERNS) if (re.test(text)) hits.push(key);
  return hits.slice(0, 3);
};
