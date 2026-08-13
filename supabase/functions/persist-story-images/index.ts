import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STYLE_PREFIXES: Record<string, string> = {
  editorial:
    "Swiss editorial layout, clean graphic design, minimalist corporate style, muted desaturated colors, generous negative space",
  documentary:
    "documentary photography, photojournalism, natural available light, 35mm lens, shallow depth of field, realistic textures, neutral color grading",
  data:
    "abstract data visualization, geometric bar and grid shapes, isometric infographic composition, flat vector look, limited color palette",
  collage:
    "paper cut-out collage, torn newsprint textures, layered shapes, matte print finish, editorial magazine collage",
  risograph:
    "risograph print, two-tone duotone ink, visible halftone grain, slight misregistration, poster art",
  cinematic:
    "cinematic still, dramatic directional lighting, high contrast, atmospheric haze, anamorphic framing",
};

const BASE_NEGATIVE =
  "no text, no letters, no typography, no captions, no logos, no watermark, no signature, no distorted faces, no extra limbs";

const BUCKET = "story-images";
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

function buildUrl(prompt: string, seed: number, style?: string, negative?: string) {
  const prefix = STYLE_PREFIXES[style ?? "editorial"] ?? STYLE_PREFIXES.editorial;
  const negatives = [BASE_NEGATIVE, negative?.trim()].filter(Boolean).join(", ");
  const full = encodeURIComponent(`${prefix}: ${prompt}. ${negatives}, high quality`);
  return `https://image.pollinations.ai/prompt/${full}?width=1080&height=1920&model=flux&seed=${seed}&nologo=true`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const storyId = typeof body?.story_id === "string" ? body.story_id : null;
    if (!storyId) {
      return new Response(JSON.stringify({ error: "story_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: story, error: loadError } = await supabase
      .from("story_posts")
      .select("id, slides")
      .eq("id", storyId)
      .single();

    if (loadError || !story) {
      return new Response(JSON.stringify({ error: "Story nicht gefunden" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const slides = (story.slides ?? []) as Array<Record<string, unknown>>;
    const persisted: Array<Record<string, unknown>> = [];

    for (let i = 0; i < slides.length; i++) {
      const slide = { ...slides[i] };

      if (typeof slide.image_url === "string" && slide.image_url) {
        persisted.push(slide);
        continue;
      }

      const prompt =
        (typeof slide.image_prompt === "string" && slide.image_prompt.trim()) ||
        `abstract political illustration, theme: ${slide.headline ?? ""}`;
      const seed = typeof slide.image_seed === "number"
        ? slide.image_seed
        : Math.floor(Math.random() * 1_000_000);

      try {
        const style = typeof slide.image_style === "string" ? slide.image_style : undefined;
        const negative = typeof slide.image_negative === "string" ? slide.image_negative : undefined;
        const res = await fetch(buildUrl(prompt, seed, style, negative));
        if (!res.ok) {
          console.error(`Pollinations failed [${res.status}] for slide ${i}`);
          persisted.push(slide);
          continue;
        }
        const bytes = new Uint8Array(await res.arrayBuffer());
        const path = `${storyId}/slide-${i + 1}-${seed}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, bytes, { contentType: "image/jpeg", upsert: true });

        if (uploadError) {
          console.error("Upload failed:", uploadError.message);
          persisted.push(slide);
          continue;
        }

        const { data: signed, error: signError } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(path, TEN_YEARS);

        if (signError || !signed?.signedUrl) {
          console.error("Sign failed:", signError?.message);
          persisted.push(slide);
          continue;
        }

        slide.image_seed = seed;
        slide.image_prompt = prompt;
        slide.image_url = signed.signedUrl;
        persisted.push(slide);
      } catch (e) {
        console.error(`Slide ${i} image error:`, e);
        persisted.push(slide);
      }
    }

    const { error: updateError } = await supabase
      .from("story_posts")
      .update({ slides: persisted })
      .eq("id", storyId);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        slides: persisted,
        persisted: persisted.filter((s) => typeof s.image_url === "string").length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("persist-story-images error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
