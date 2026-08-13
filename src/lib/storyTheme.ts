// storyTheme.ts — Styleguide-Tokens für Social-Media-Templates.
// Die Templates werden zu Bildern gerendert (html2canvas / server-side),
// deshalb müssen alle Werte als Inline-Styles verfügbar sein. Die Hex-Werte
// entsprechen exakt den HSL-Tokens aus src/index.css.

export const BRAND = {
  ink: "#1A1A1A",
  paper: "#F4F2EC", // --background
  paperLight: "#FCFBF7", // --paper
  red: "#E84930",
  redDeep: "#B7331F",
  blue: "#204FCF",
  yellow: "#F7D445",
  green: "#2F7F47",
  greenBright: "#66B545",
  purple: "#7B1E7A",
  pink: "#F2BAC9",
  redSoft: "#F5DCD6",
  blueSoft: "#DEE6F7",
  greenSoft: "#E2ECDF",
  purpleSoft: "#EAD7E9",
  yellowSoft: "#F9EFC8",
  hairline: "#E4E1D7",
} as const;

export const SERIF = "'Newsreader', Georgia, serif";
export const SANS = "'Hanken Grotesk', system-ui, sans-serif";

/** Sprechblasen-Formen — identisch zu den .bubble* Utilities in index.css */
export const BUBBLE = "polygon(1% 1.5%, 99% 0%, 100% 97%, 55% 98.5%, 53% 100%, 51% 98.5%, 0% 99%)";
export const BUBBLE_CHIP = "polygon(2% 8%, 98% 0%, 100% 86%, 40% 92%, 36% 100%, 32% 90%, 0% 94%)";
export const BUBBLE_PLAIN = "polygon(2% 4%, 98% 0%, 100% 94%, 3% 100%)";
export const BUBBLE_PLAIN_ALT = "polygon(2% 0%, 98% 4%, 100% 100%, 3% 96%)";
export const BUBBLE_FRAME = "polygon(3% 1%, 97% 0%, 100% 4%, 99% 96%, 96% 100%, 4% 99%, 0% 95%, 1% 3%)";
/** Grosse Sprechblase mit Schwanz (Headline-Bubble im Feed-Cover) */
export const BUBBLE_TAIL = "polygon(2% 4%, 98% 0%, 100% 8%, 99% 90%, 24% 93%, 20% 100%, 15% 93%, 1% 95%)";

/** Headline: Newsreader 400, Betonung 600 (siehe .headline-em) */
export const headline = (fontSize: string, lineHeight = 1.08) => ({
  fontFamily: SERIF,
  fontWeight: 400 as const,
  fontSize,
  lineHeight,
  margin: 0,
});

/** Kicker: Hanken Grotesk 700, uppercase, 0.14em */
export const kicker = (fontSize: string, color?: string) => ({
  fontFamily: SANS,
  fontWeight: 700 as const,
  fontSize,
  textTransform: "uppercase" as const,
  letterSpacing: "0.14em",
  ...(color ? { color } : {}),
});

/** Zitat: Newsreader 400 italic */
export const quote = (fontSize: string, lineHeight = 1.35) => ({
  fontFamily: SERIF,
  fontWeight: 400 as const,
  fontStyle: "italic" as const,
  fontSize,
  lineHeight,
  margin: 0,
});

/** Fliesstext: Hanken Grotesk 500 */
export const body = (fontSize: string, lineHeight = 1.45) => ({
  fontFamily: SANS,
  fontWeight: 500 as const,
  fontSize,
  lineHeight,
  margin: 0,
});

/** Pill / Badge: Hanken Grotesk 600 in Sprechblasen-Chipform */
export const pill = (fontSize: string, bg: string, color: string) => ({
  fontFamily: SANS,
  fontWeight: 600 as const,
  fontSize,
  backgroundColor: bg,
  color,
  clipPath: BUBBLE_CHIP,
});

/** Ergebnis-Label: Sprechblase mit Zacken-Tail, Newsreader 600 (keine runden Ecken) */
export const resultBubble = (fontSize: string, bg: string, color: string) => ({
  fontFamily: SERIF,
  fontWeight: 600 as const,
  fontSize,
  backgroundColor: bg,
  color,
  clipPath: BUBBLE_CHIP,
});

/** Hashtag-Pill: einzige runde Form im System (Radius 22px), tonal + Akzenttext */
export const hashtagPill = (fontSize: string, bg: string, color: string) => ({
  fontFamily: SANS,
  fontWeight: 600 as const,
  fontSize,
  backgroundColor: bg,
  color,
  borderRadius: "22px",
});

/** CTA: Hanken Grotesk 800 */
export const cta = (fontSize: string, bg: string, color: string) => ({
  fontFamily: SANS,
  fontWeight: 800 as const,
  fontSize,
  backgroundColor: bg,
  color,
  clipPath: BUBBLE_CHIP,
});

/** Erkennt Zitate: „…", "…", «…» — dann Newsreader italic statt Sans */
export const isQuote = (text?: string) => {
  const t = (text ?? "").trim();
  return /^[„"«"'].*[""»"']$/.test(t);
};
