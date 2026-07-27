import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STYLE_PREFIX =
  "Swiss editorial layout, clean graphic design, minimalist corporate style, muted desaturated colors, no text, no letters, no logos, no watermark, high quality";

const BUCKET = "story-images";
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

function buildUrl(prompt: string, seed: number) {
  const full = encodeURIComponent(`${STYLE_PREFIX}: ${prompt}`);
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
        const res = await fetch(buildUrl(prompt, seed));
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
