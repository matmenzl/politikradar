import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, FileText } from "lucide-react";
import StorySlideCard from "@/components/story/StorySlideCard";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from "@/components/ui/carousel";
import { useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import type { StorySlide } from "@/components/StoryPreviewModal";

const StoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [slides, setSlides] = useState<StorySlide[]>([]);
  const [title, setTitle] = useState("");
  const [affairId, setAffairId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("story_posts")
      .select("title, slides")
      .eq("id", id)
      .eq("status", "published")
      .single()
      .then(({ data }) => {
        if (data) {
          setTitle(data.title);
          setSlides((data.slides as unknown as StorySlide[]) || []);
        }
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  const downloadSlide = useCallback(async (index: number) => {
    const el = slideRefs.current[index];
    if (!el) return;
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: null,
        width: 1080 / 2,
        height: 1920 / 2,
      });
      const link = document.createElement("a");
      link.download = `story-slide-${index + 1}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("Export error:", e);
    }
  }, []);

  const downloadAll = useCallback(async () => {
    for (let i = 0; i < slides.length; i++) {
      await downloadSlide(i);
    }
  }, [slides.length, downloadSlide]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Zurück</span>
        </button>
        <span className="font-serif text-base font-semibold text-foreground truncate max-w-[200px]">Story</span>
        <div className="w-16" />
      </header>

      <div className="flex-1 overflow-y-auto py-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-accent" />
            <span className="text-sm text-muted-foreground">Wird geladen…</span>
          </div>
        ) : slides.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Keine Slides verfügbar.</p>
        ) : (
          <div className="px-2 sm:px-8">
            <p className="text-xs text-muted-foreground text-center mb-3">
              {slides.length} Slides
            </p>

            <Carousel opts={{ align: "center" }} setApi={setApi}>
              <CarouselContent>
                {slides.map((slide, i) => (
                  <CarouselItem key={i} className="basis-full sm:basis-[280px]">
                    <div className="space-y-2">
                      <StorySlideCard
                        slide={slide}
                        index={i}
                        total={slides.length}
                        ref={(el) => { slideRefs.current[i] = el; }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-1.5 text-xs"
                        onClick={() => downloadSlide(i)}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Slide {i + 1} speichern
                      </Button>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex" />
              <CarouselNext className="hidden sm:flex" />
            </Carousel>

            <div className="flex items-center justify-center gap-1.5 mt-4">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => api?.scrollTo(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === current
                      ? "w-6 h-2 bg-accent"
                      : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                />
              ))}
            </div>

            {slides.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3 gap-1.5 text-xs text-muted-foreground"
                onClick={downloadAll}
              >
                <Download className="w-3.5 h-3.5" />
                Alle {slides.length} Slides speichern
              </Button>
            )}

            <p className="text-[10px] text-muted-foreground text-center mt-3 opacity-70">
              Erstellt mit KI · Inhalte prüfen vor Veröffentlichung
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryPage;
