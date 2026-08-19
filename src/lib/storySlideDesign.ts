// storySlideDesign.ts — Story-Design-System für Slides aus Parlamentsdaten.
// 1080 × 1920 (9:16), Sprechblasen-Sprache, eine Vollton-Farbe pro Slide-Typ.
// Gilt ausschliesslich für generierte Story-Slides, nicht für die App-Oberfläche.

export const STORY_SERIF = "'Newsreader', Georgia, serif";
export const STORY_SANS = "'Hanken Grotesk', system-ui, sans-serif";

export const STORY_PALETTE = {
  red: "#E8442E",
  yellow: "#F7D344",
  green: "#2E7D46",
  greenBright: "#63B348",
  blue: "#2151D1",
  purple: "#7A1E78",
  pink: "#E93A7D",
  pinkSoft: "#F2B8C6",
  cream: "#F4F2EC",
  ink: "#1A1A1A",
} as const;

/** Sprechblasen-Geometrie — «gestanzt», keine runden Ecken. */
export const BUBBLE_TAIL = "polygon(3% 5%, 97% 0%, 100% 92%, 24% 95%, 19% 100%, 15% 93%, 0% 96%)";
export const BUBBLE_SMALL = "polygon(2% 8%, 98% 0%, 100% 86%, 40% 92%, 36% 100%, 32% 90%, 0% 94%)";
export const BUBBLE_FRAME = "polygon(3% 1%, 97% 0%, 100% 3%, 99% 97%, 96% 100%, 4% 99%, 0% 96%, 1% 2%)";

export interface SlideStyle {
  bg: string;
  text: string;
  accent: string;
  track: string;
  framed?: boolean;
}

/** Farbwelt je Slide-Typ des Parlamentsdaten-Outlines. */
export const SLIDE_STYLES: Record<string, SlideStyle> = {
  hook: { bg: STORY_PALETTE.red, text: STORY_PALETTE.cream, accent: STORY_PALETTE.yellow, track: "rgba(244,242,236,0.25)" },
  context: { bg: STORY_PALETTE.blue, text: STORY_PALETTE.cream, accent: STORY_PALETTE.greenBright, track: "rgba(244,242,236,0.25)" },
  decision: { bg: STORY_PALETTE.yellow, text: STORY_PALETTE.ink, accent: STORY_PALETTE.green, track: "rgba(26,26,26,0.15)" },
  vote: { bg: STORY_PALETTE.cream, text: STORY_PALETTE.ink, accent: STORY_PALETTE.red, track: "rgba(26,26,26,0.12)" },
  positions: { bg: STORY_PALETTE.green, text: STORY_PALETTE.cream, accent: STORY_PALETTE.yellow, track: "rgba(244,242,236,0.2)" },
  outlook: { bg: STORY_PALETTE.purple, text: STORY_PALETTE.cream, accent: STORY_PALETTE.pinkSoft, track: "rgba(244,242,236,0.25)" },
  sources: { bg: STORY_PALETTE.ink, text: STORY_PALETTE.cream, accent: STORY_PALETTE.yellow, track: "rgba(244,242,236,0.2)", framed: true },
};

export const slideStyleOf = (type: string): SlideStyle => SLIDE_STYLES[type] ?? SLIDE_STYLES.context;

export const SLIDE_KICKERS: Record<string, string> = {
  hook: "Aufmacher",
  context: "Hintergrund",
  decision: "Entscheid",
  vote: "Abstimmung",
  positions: "Positionen",
  outlook: "Ausblick",
  sources: "Quellen",
};

/**
 * Headline-Regel: nie eine ganze Zeile fett, sondern Wortgruppen.
 * `**Wortgruppe**` wird als Newsreader Semibold gerendert.
 */
export function splitEmphasis(text: string): { text: string; strong: boolean }[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part) =>
      part.startsWith("**") && part.endsWith("**")
        ? { text: part.slice(2, -2), strong: true }
        : { text: part, strong: false },
    );
}
