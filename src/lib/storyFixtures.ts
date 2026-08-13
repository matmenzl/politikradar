// Deterministische Fixtures für die visuelle Regression der Social-Media-Templates.
// Keine Zufallswerte, keine externen Bilder — damit Screenshots pixelstabil bleiben.
import type { StorySlide } from "@/components/StoryPreviewModal";
import type { CarouselSlide } from "@/components/story/CarouselSlideCard";

export const STORY_FIXTURES: StorySlide[] = [
  {
    slide_type: "hook",
    emoji: "",
    headline: "Wer geht da im Bundeshaus **ein und aus?**",
    body: "Der Nationalrat hat über ein öffentliches Lobby-Register abgestimmt. Das Resultat war knapper als gedacht.",
  },
  {
    slide_type: "context",
    emoji: "",
    headline: "Heute reicht ein Badge – **ohne Namen, ohne Auftrag.**",
    body: "Jedes Ratsmitglied darf zwei Zutrittsbadges vergeben. An wen? Das steht nirgends öffentlich.",
  },
  {
    slide_type: "result",
    emoji: "",
    headline: "Der Nationalrat sagt **Ja.**",
    body: "98 Ja zu 87 Nein bei 12 Enthaltungen.",
  },
  {
    slide_type: "insight",
    emoji: "",
    headline: "Die Mitte gab den Ausschlag.",
    body: "«11 Stimmen Unterschied – bei 246 Badges.»",
  },
  {
    slide_type: "party",
    emoji: "",
    headline: "So haben die **Fraktionen** gestimmt.",
    body: "",
    partyData: [
      { party: "SVP", yes: 9, no: 53, total: 62 },
      { party: "SP", yes: 39, no: 0, total: 39 },
      { party: "Mitte", yes: 14, no: 12, total: 26 },
      { party: "FDP", yes: 5, no: 22, total: 27 },
      { party: "Grüne", yes: 23, no: 0, total: 23 },
      { party: "GLP", yes: 10, no: 0, total: 10 },
    ],
  },
  {
    slide_type: "cta",
    emoji: "",
    headline: "Das war erst die **grosse Kammer.**",
    body: "Als Nächstes entscheidet der Ständerat. Wir bleiben dran — jede Woche, alle Parlamente, ohne Polit-Blabla.",
  },
];

export const CAROUSEL_FIXTURES: CarouselSlide[] = [
  {
    slide_type: "cover",
    kicker: "Herbstsession · Woche 2",
    headline: "Was lief diese Woche im **Bundeshaus?**",
  },
  {
    slide_type: "detail",
    kicker: "Motion 24.3012 · Nationalrat",
    headline: "Wer lobbyiert da eigentlich **im Bundeshaus?**",
    body: "Eine Motion verlangt ein öffentliches Register für alle Lobby-Badges. Wer im Bundeshaus ein- und ausgeht, soll künftig für alle sichtbar sein.",
    hashtags: ["Nationalrat", "Transparenz", "Lobbying"],
  },
  {
    slide_type: "result",
    kicker: "Abstimmung · Nationalrat",
    headline: "Öffentliches Lobby-Register: **So hat der Rat entschieden.**",
    votes: { yes: 98, no: 87, abstain: 12 },
    status: "angenommen",
  },
  {
    slide_type: "cta",
    headline: "Mehr davon?",
    body: "Jede Woche das Wichtigste aus den Schweizer Parlamenten. Kurz, verständlich, ohne Polit-Blabla.",
    cta_label: "@politikradar folgen",
  },
];
