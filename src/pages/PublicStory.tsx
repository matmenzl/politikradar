import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PublicShell from "@/components/PublicShell";
import { Button } from "@/components/ui/button";
import { ArrowRight, ExternalLink } from "lucide-react";
import { usePageMeta } from "@/lib/seo";
import { BRAND, SANS, SERIF } from "@/lib/storyTheme";
import type { SlideRow, StoryRow } from "@/lib/mvp";

/** Public, login-free reading view for a published story (newsletter target). */
const PublicStory = () => {
  const { id } = useParams<{ id: string }>();
  const [story, setStory] = useState<StoryRow | null>(null);
  const [slides, setSlides] = useState<SlideRow[]>([]);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data: s } = await supabase
        .from("stories")
        .select("*")
        .eq("id", id)
        .eq("status", "published")
        .maybeSingle();
      if (s) {
        setStory(s as unknown as StoryRow);
        const { data: sl } = await supabase.from("slides").select("*").eq("story_id", id).order("position");
        setSlides((sl || []) as unknown as SlideRow[]);
        if (s.event_id) {
          const { data: ev } = await supabase.from("events").select("source_id").eq("id", s.event_id).maybeSingle();
          if (ev?.source_id) {
            const { data: src } = await supabase.from("sources").select("url").eq("id", ev.source_id).maybeSingle();
            setSourceUrl(src?.url || null);
          }
        }
      }
      setLoading(false);
    })();
  }, [id]);

  usePageMeta(
    story ? `${story.headline} — politikradar` : "Story — politikradar",
    story?.summary || story?.headline,
    id ? `/s/${id}` : undefined,
  );

  if (loading) {
    return (
      <PublicShell>
        <p className="text-xs kicker text-muted-foreground">Lädt…</p>
      </PublicShell>
    );
  }

  if (!story) {
    return (
      <PublicShell>
        <h1 className="font-serif text-2xl text-foreground">Story nicht verfügbar</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Diese Story ist noch nicht veröffentlicht oder wurde zurückgezogen.
        </p>
        <Button asChild variant="outline" className="mt-5">
          <Link to="/profil">Zum Profil</Link>
        </Button>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <article className="space-y-6">
        <div>
          <p className="text-xs kicker text-muted-foreground">politikradar · Story</p>
          <h1 className="font-serif text-3xl leading-tight text-foreground mt-2">{story.headline}</h1>
          {story.summary && (
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{story.summary}</p>
          )}
        </div>

        <div className="space-y-4">
          {slides.map((slide, i) => (
            <section
              key={slide.id}
              className="border border-border p-5"
              style={{ background: BRAND.paperLight }}
            >
              <span
                style={{
                  fontFamily: SANS,
                  fontWeight: 800,
                  fontSize: "11px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: i === 0 ? BRAND.red : BRAND.blue,
                }}
              >
                {i + 1}/{slides.length}
              </span>
              {slide.headline && (
                <h2
                  className="mt-2"
                  style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "22px", lineHeight: 1.15, color: BRAND.ink }}
                >
                  {slide.headline}
                </h2>
              )}
              {slide.body && (
                <p
                  className="mt-2"
                  style={{ fontFamily: SANS, fontWeight: 500, fontSize: "15px", lineHeight: 1.5, color: BRAND.ink }}
                >
                  {slide.body}
                </p>
              )}
            </section>
          ))}
        </div>

        <div className="space-y-3 border-t border-border pt-5">
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-foreground underline underline-offset-4"
            >
              Originalquelle im Parlament <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          {story.event_id && (
            <div>
              <Button asChild variant="outline">
                <Link to={`/g/${story.event_id}`}>Zum Geschäft</Link>
              </Button>
            </div>
          )}
          <Button asChild variant="ghost" className="px-0">
            <Link to="/profil">
              Themen im Profil anpassen <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </article>
    </PublicShell>
  );
};

export default PublicStory;
