/**
 * Pollinations.ai image generation (FLUX) – no API key required.
 * Images are generated on demand when the URL is fetched.
 */

export interface PollinationsOptions {
  width?: number;
  height?: number;
  model?: "flux" | "turbo";
  seed?: number;
}

/** Consistent visual language across all story slides. */
const STYLE_PREFIX =
  "Swiss editorial layout, clean graphic design, minimalist corporate style, muted desaturated colors, no text, no letters, no logos, no watermark, high quality";

export const randomSeed = () => Math.floor(Math.random() * 1_000_000);

export const buildPollinationsUrl = (
  userPrompt: string,
  options: PollinationsOptions = {}
): string => {
  const {
    width = 1080,
    height = 1920,
    model = "flux",
    seed = randomSeed(),
  } = options;

  const fullPrompt = `${STYLE_PREFIX}: ${userPrompt}`;
  const encodedPrompt = encodeURIComponent(fullPrompt);

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
