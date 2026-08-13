/**
 * Pollinations.ai image generation (FLUX) – no API key required.
 * Images are generated on demand when the URL is fetched.
 */

export type PollinationsStyleId =
  | "editorial"
  | "documentary"
  | "data"
  | "collage"
  | "risograph"
  | "cinematic";

export interface PollinationsOptions {
  width?: number;
  height?: number;
  model?: "flux" | "turbo";
  seed?: number;
  /** Visual style preset, defaults to "editorial" */
  style?: PollinationsStyleId;
  /** Extra things to avoid, appended to the default negative terms */
  negative?: string;
}

export interface PollinationsStyle {
  id: PollinationsStyleId;
  label: string;
  description: string;
  prefix: string;
}

/** Selectable visual languages for story slide images. */
export const POLLINATIONS_STYLES: PollinationsStyle[] = [
  {
    id: "editorial",
    label: "Editorial (Standard)",
    description: "Schweizer Grafik, reduziert, gedeckte Farben",
    prefix:
      "Swiss editorial layout, clean graphic design, minimalist corporate style, muted desaturated colors, generous negative space",
  },
  {
    id: "documentary",
    label: "Dokumentarfoto",
    description: "Reportage-Look, natürliches Licht",
    prefix:
      "documentary photography, photojournalism, natural available light, 35mm lens, shallow depth of field, realistic textures, neutral color grading",
  },
  {
    id: "data",
    label: "Datenvisualisierung",
    description: "Abstrakte Diagramme und Raster",
    prefix:
      "abstract data visualization, geometric bar and grid shapes, isometric infographic composition, flat vector look, limited color palette",
  },
  {
    id: "collage",
    label: "Papier-Collage",
    description: "Ausgeschnittene Formen, Zeitungsanmutung",
    prefix:
      "paper cut-out collage, torn newsprint textures, layered shapes, matte print finish, editorial magazine collage",
  },
  {
    id: "risograph",
    label: "Risograph",
    description: "Zweifarbdruck, sichtbares Raster",
    prefix:
      "risograph print, two-tone duotone ink, visible halftone grain, slight misregistration, poster art",
  },
  {
    id: "cinematic",
    label: "Kinematisch",
    description: "Dramatisches Licht, hoher Kontrast",
    prefix:
      "cinematic still, dramatic directional lighting, high contrast, atmospheric haze, anamorphic framing",
  },
];

const DEFAULT_STYLE: PollinationsStyleId = "editorial";

/** Always avoided – Pollinations tends to hallucinate text and logos. */
const BASE_NEGATIVE =
  "no text, no letters, no typography, no captions, no logos, no watermark, no signature, no distorted faces, no extra limbs";

/** Ready-to-use motif building blocks for the prompt editor. */
export const PROMPT_SNIPPETS: { label: string; value: string }[] = [
  { label: "Bundeshaus", value: "swiss federal parliament building, sandstone facade" },
  { label: "Ratssaal", value: "empty parliament chamber, rows of wooden desks" },
  { label: "Abstimmung", value: "raised hands voting in an assembly, from behind" },
  { label: "Dokumente", value: "stacked official documents and folders on a desk" },
  { label: "Landschaft", value: "swiss landscape, alpine horizon, soft light" },
  { label: "Stadt", value: "swiss city street, everyday urban scene" },
  { label: "Geld", value: "abstract coins and banknotes, financial motif" },
  { label: "Klima", value: "solar panels and wind turbines in a swiss valley" },
  { label: "Gesundheit", value: "hospital corridor, calm clinical atmosphere" },
  { label: "Verkehr", value: "train and highway infrastructure, aerial perspective" },
  { label: "Nahaufnahme", value: "extreme close-up detail, macro perspective" },
  { label: "Vogelperspektive", value: "top-down aerial view, symmetrical composition" },
];

export const randomSeed = () => Math.floor(Math.random() * 1_000_000);

export const getStyle = (id?: string): PollinationsStyle =>
  POLLINATIONS_STYLES.find((s) => s.id === id) ??
  POLLINATIONS_STYLES.find((s) => s.id === DEFAULT_STYLE)!;

/** Full prompt sent to Pollinations – useful for previewing what the model sees. */
export const composePrompt = (
  userPrompt: string,
  style?: string,
  negative?: string,
): string => {
  const negatives = [BASE_NEGATIVE, negative?.trim()].filter(Boolean).join(", ");
  return `${getStyle(style).prefix}: ${userPrompt.trim()}. ${negatives}, high quality`;
};

export const buildPollinationsUrl = (
  userPrompt: string,
  options: PollinationsOptions = {},
): string => {
  const {
    width = 1080,
    height = 1920,
    model = "flux",
    seed = randomSeed(),
    style,
    negative,
  } = options;

  const encodedPrompt = encodeURIComponent(composePrompt(userPrompt, style, negative));

  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true`;
};

/** Fallback prompt derived from slide content when the AI didn't provide one. */
export const fallbackImagePrompt = (headline: string, slideType: string): string => {
  const scene: Record<string, string> = {
    hook: "abstract swiss parliament architecture, dramatic light",
    context: "abstract paper documents and geometric shapes, calm tones",
    result: "abstract ballot box and rising geometric bars",
    insight: "abstract data landscape, subtle grid, warm light",
    cta: "abstract swiss landscape with soft light, open horizon",
    party: "abstract geometric bar chart shapes, neutral background",
  };
  return `${scene[slideType] ?? "abstract political illustration"}, theme: ${headline}`;
};
