// storyVariants.ts — Variations-System für Reel-/Story-Kacheln.
// Basiert auf dem Design-System "Story-Format" (SYS-1): eine Vollton-Farbe pro
// Slide, max. zwei Akzente, gestanzte Sprechblasen, keine runden Ecken.
// Ziel: Jede Story stellt ihre Kacheln neu zusammen (Farbduo, Layout, Bubble-
// Form, Deko) – deterministisch über einen Seed, aber garantiert abwechslungsreich.

import { BRAND, BUBBLE, BUBBLE_CHIP, BUBBLE_FRAME, BUBBLE_PLAIN, BUBBLE_PLAIN_ALT, BUBBLE_TAIL } from "./storyTheme";

export type SlideType = "hook" | "context" | "result" | "insight" | "cta" | "party";

export interface SlidePalette {
  bg: string;
  text: string;
  accent: string;
  accent2: string;
  pillBg: string;
  pillText: string;
  track: string;
}

/** Farbwelten pro Slide-Typ (SYS-1.5) — mehrere zulässige Duos je Typ. */
const PALETTES: Record<SlideType, SlidePalette[]> = {
  hook: [
    { bg: BRAND.red, text: BRAND.paper, accent: BRAND.yellow, accent2: BRAND.paper, pillBg: BRAND.redSoft, pillText: BRAND.redDeep, track: "rgba(244,242,236,0.25)" },
    { bg: BRAND.ink, text: BRAND.paper, accent: BRAND.red, accent2: BRAND.yellow, pillBg: BRAND.redSoft, pillText: BRAND.redDeep, track: "rgba(244,242,236,0.22)" },
    { bg: BRAND.yellow, text: BRAND.ink, accent: BRAND.red, accent2: BRAND.ink, pillBg: BRAND.redSoft, pillText: BRAND.redDeep, track: "rgba(26,26,26,0.15)" },
  ],
  context: [
    { bg: BRAND.blue, text: BRAND.paper, accent: BRAND.greenBright, accent2: BRAND.paper, pillBg: BRAND.blueSoft, pillText: BRAND.blue, track: "rgba(244,242,236,0.25)" },
    { bg: BRAND.paper, text: BRAND.ink, accent: BRAND.blue, accent2: BRAND.greenBright, pillBg: BRAND.blueSoft, pillText: BRAND.blue, track: "rgba(26,26,26,0.15)" },
    { bg: BRAND.blueSoft, text: BRAND.ink, accent: BRAND.blue, accent2: BRAND.purple, pillBg: BRAND.paper, pillText: BRAND.blue, track: "rgba(26,26,26,0.14)" },
  ],
  result: [
    { bg: BRAND.yellow, text: BRAND.ink, accent: BRAND.green, accent2: BRAND.red, pillBg: BRAND.greenSoft, pillText: BRAND.green, track: "rgba(26,26,26,0.15)" },
    { bg: BRAND.paper, text: BRAND.ink, accent: BRAND.green, accent2: BRAND.red, pillBg: BRAND.yellowSoft, pillText: BRAND.ink, track: "rgba(26,26,26,0.14)" },
    { bg: BRAND.green, text: BRAND.paper, accent: BRAND.yellow, accent2: BRAND.greenBright, pillBg: BRAND.greenSoft, pillText: BRAND.green, track: "rgba(244,242,236,0.22)" },
  ],
  insight: [
    { bg: BRAND.purple, text: BRAND.paper, accent: BRAND.pink, accent2: BRAND.yellow, pillBg: BRAND.purpleSoft, pillText: BRAND.purple, track: "rgba(244,242,236,0.25)" },
    { bg: BRAND.purpleSoft, text: BRAND.ink, accent: BRAND.purple, accent2: BRAND.pink, pillBg: BRAND.paper, pillText: BRAND.purple, track: "rgba(26,26,26,0.14)" },
    { bg: BRAND.ink, text: BRAND.paper, accent: BRAND.pink, accent2: BRAND.purple, pillBg: BRAND.purpleSoft, pillText: BRAND.purple, track: "rgba(244,242,236,0.2)" },
  ],
  cta: [
    { bg: BRAND.blue, text: BRAND.paper, accent: BRAND.greenBright, accent2: BRAND.yellow, pillBg: BRAND.greenSoft, pillText: BRAND.green, track: "rgba(244,242,236,0.25)" },
    { bg: BRAND.ink, text: BRAND.paper, accent: BRAND.greenBright, accent2: BRAND.blue, pillBg: BRAND.greenSoft, pillText: BRAND.green, track: "rgba(244,242,236,0.2)" },
    { bg: BRAND.paper, text: BRAND.ink, accent: BRAND.blue, accent2: BRAND.greenBright, pillBg: BRAND.blueSoft, pillText: BRAND.blue, track: "rgba(26,26,26,0.14)" },
  ],
  party: [
    { bg: BRAND.green, text: BRAND.paper, accent: BRAND.yellow, accent2: BRAND.greenBright, pillBg: BRAND.greenSoft, pillText: BRAND.green, track: "rgba(244,242,236,0.18)" },
    { bg: BRAND.paper, text: BRAND.ink, accent: BRAND.green, accent2: BRAND.red, pillBg: BRAND.greenSoft, pillText: BRAND.green, track: "rgba(26,26,26,0.14)" },
    { bg: BRAND.blue, text: BRAND.paper, accent: BRAND.yellow, accent2: BRAND.greenBright, pillBg: BRAND.blueSoft, pillText: BRAND.blue, track: "rgba(244,242,236,0.2)" },
  ],
};

/** Kompositionen (SYS-1.3 / SYS-1.6): wo sitzt Headline, Bild, Deko. */
export type CompositionId =
  | "classic"        // Headline mittig, Akzentbalken, Text darunter
  | "bubble-top"     // Headline in Sprechblase oben, Text unten
  | "bottom-anchor"  // Inhalt unten verankert, grosse Leerfläche oben
  | "frame"          // Rahmen-Variante, ruhig, zentriert
  | "band"           // Farbband hinter der Headline
  | "split";         // Kontrast-Block oben, Text auf Vollton unten

export const COMPOSITIONS: CompositionId[] = ["classic", "bubble-top", "bottom-anchor", "frame", "band", "split"];

/** Bubble-Zuschnitte für Headline/Bild — aus dem Formen-Katalog. */
export const SHAPES = [BUBBLE, BUBBLE_CHIP, BUBBLE_PLAIN, BUBBLE_PLAIN_ALT, BUBBLE_TAIL, BUBBLE_FRAME];

export type DividerId = "bar" | "dots" | "chevron" | "hairline" | "none";
const DIVIDERS: DividerId[] = ["bar", "dots", "chevron", "hairline", "none"];

export type ImageSpotId = "bottom-right" | "top-right" | "bottom-left" | "full-bleed";
const IMAGE_SPOTS: ImageSpotId[] = ["bottom-right", "top-right", "bottom-left", "full-bleed"];

export interface SlideVariant {
  palette: SlidePalette;
  composition: CompositionId;
  headlineShape: string;
  imageShape: string;
  imageSpot: ImageSpotId;
  divider: DividerId;
  /** Headline-Grösse in cqw (SYS: 84–112px auf 1080 ≈ 7.8–10.4cqw, +Bubble-Reserve) */
  headlineSize: number;
  /** true = Headline links, false = leicht eingerückt/zentriert */
  alignLeft: boolean;
}

/* ---------- deterministischer Zufall ---------- */

export const hashSeed = (input: string): number => {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Zieht ein Element und vermeidet dabei zuletzt benutzte Werte (Abwechslung). */
function pickFresh<T>(items: T[], rnd: () => number, used: T[], avoidLast = 2): T {
  const recent = used.slice(-avoidLast);
  const pool = items.filter((i) => !recent.includes(i));
  const list = pool.length ? pool : items;
  return list[Math.floor(rnd() * list.length)];
}

/* ---------- öffentliche API ---------- */

export interface VariantInput {
  slide_type: SlideType;
  /** Manuelle Sperre: fixiert Komposition trotz Neu-Würfeln */
  composition?: CompositionId;
  /** Manuelle Sperre: Index der Farbwelt */
  palette_index?: number;
}

/**
 * Stellt die Kacheln einer Story neu zusammen. Gleicher Seed = gleiches
 * Ergebnis (reproduzierbarer Export), unterschiedlicher Seed = neue Mischung.
 * Innerhalb einer Story wiederholen sich Komposition, Farbwelt und Bubble-Form
 * nicht direkt hintereinander.
 */
export function composeStoryVariants(slides: VariantInput[], seed: string | number): SlideVariant[] {
  const rnd = mulberry32(typeof seed === "number" ? seed : hashSeed(seed));

  const usedComp: CompositionId[] = [];
  const usedShape: string[] = [];
  const usedDiv: DividerId[] = [];
  const usedSpot: ImageSpotId[] = [];
  const usedPalette: string[] = [];

  return slides.map((slide) => {
    const palettes = PALETTES[slide.slide_type] ?? PALETTES.context;
    const palette =
      typeof slide.palette_index === "number"
        ? palettes[slide.palette_index % palettes.length]
        : (() => {
            const keys = palettes.map((p) => p.bg);
            const bg = pickFresh(keys, rnd, usedPalette, 1);
            usedPalette.push(bg);
            return palettes[keys.indexOf(bg)];
          })();

    // Party-Slides brauchen Platz für die Balken → ruhige Kompositionen
    const allowed: CompositionId[] =
      slide.slide_type === "party"
        ? ["classic", "band", "bottom-anchor"]
        : slide.slide_type === "cta"
          ? ["frame", "bubble-top", "band", "classic"]
          : COMPOSITIONS;

    const composition = slide.composition ?? pickFresh(allowed, rnd, usedComp, 2);
    usedComp.push(composition);

    const headlineShape = pickFresh([BUBBLE, BUBBLE_CHIP, BUBBLE_PLAIN, BUBBLE_PLAIN_ALT, BUBBLE_TAIL], rnd, usedShape, 2);
    usedShape.push(headlineShape);

    const imageShape = pickFresh([BUBBLE_TAIL, BUBBLE, BUBBLE_PLAIN, BUBBLE_PLAIN_ALT], rnd, usedShape, 1);

    const divider = pickFresh(DIVIDERS, rnd, usedDiv, 2);
    usedDiv.push(divider);

    const imageSpot = pickFresh(IMAGE_SPOTS, rnd, usedSpot, 1);
    usedSpot.push(imageSpot);

    const base = slide.slide_type === "party" ? 8.4 : 10.4;
    const headlineSize = Number((base + (rnd() * 2 - 0.8)).toFixed(2));

    return {
      palette,
      composition,
      headlineShape,
      imageShape,
      imageSpot,
      divider,
      headlineSize,
      alignLeft: rnd() > 0.35,
    };
  });
}

/** Einzelne Kachel (z. B. Vorschau ohne Story-Kontext). */
export const composeSlideVariant = (slide: VariantInput, seed: string | number): SlideVariant =>
  composeStoryVariants([slide], seed)[0];
