export interface WeeklyHighlight {
  id: string;
  type: "dominant_topic" | "closest_vote" | "momentum" | "total_activity";
  title: string;
  subtitle: string;
  description: string;
  details: Record<string, string | number>;
}

export interface WeeklyData {
  week: string;
  weekLabel: string;
  dateRange: string;
  highlights: WeeklyHighlight[];
}

export const weeklyData: WeeklyData = {
  week: "2026-W08",
  weekLabel: "Kalenderwoche 8",
  dateRange: "16.–20. Februar 2026",
  highlights: [
    {
      id: "dominant",
      type: "dominant_topic",
      title: "Energieversorgungssicherheit",
      subtitle: "Dominierendes Thema der Woche",
      description:
        "Die Debatte um die langfristige Energieversorgung dominierte die parlamentarische Woche mit mehreren Vorstössen und einer kontroversen Abstimmung.",
      details: {
        geschaefte: 12,
        events: 5,
        dokumente: 23,
        abstimmungen: 3,
        kommissionen: "UREK-N, UREK-S",
      },
    },
    {
      id: "closest-vote",
      type: "closest_vote",
      title: "Mietrecht: Untermiete-Regelung",
      subtitle: "Knappste Abstimmung",
      description:
        "Die Revision der Untermiete-Bestimmungen wurde nur mit hauchdünner Mehrheit angenommen. Die Vorlage spaltet das Parlament quer durch die Fraktionen.",
      details: {
        ja: 97,
        nein: 95,
        enthaltungen: 4,
        thema: "Obligationenrecht – Untermiete",
        datum: "19. Februar 2026",
      },
    },
    {
      id: "momentum",
      type: "momentum",
      title: "Künstliche Intelligenz & Regulierung",
      subtitle: "Thema mit Momentum",
      description:
        "Die Aktivität rund um KI-Regulierung hat im Vergleich zur Vorwoche massiv zugenommen. Mehrere neue Vorstösse und eine Interpellation treiben das Thema.",
      details: {
        delta: 340,
        neueGeschaefte: 6,
        trend: "stark steigend",
        vorwoche: 2,
        dieseWoche: 9,
      },
    },
    {
      id: "activity",
      type: "total_activity",
      title: "Gesamtaktivität",
      subtitle: "Wochenüberblick in Zahlen",
      description:
        "Eine überdurchschnittlich aktive Parlamentswoche mit zahlreichen Geschäften und mehreren wichtigen Abstimmungen.",
      details: {
        totalGeschaefte: 48,
        totalAbstimmungen: 14,
        neueVorstoesse: 22,
        beantworteteVorstoesse: 11,
        kommissionsSitzungen: 8,
      },
    },
  ],
};
