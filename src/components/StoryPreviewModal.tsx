import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { Download, Loader2 } from "lucide-react";
import { useRef, useCallback } from "react";
import html2canvas from "html2canvas";

export interface StorySlide {
  headline: string;
  body: string;
  emoji: string;
  slide_type: "hook" | "context" | "result" | "insight" | "cta";
}

interface StoryPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slides: StorySlide[];
  loading?: boolean;
}

const slideStyles: Record<StorySlide["slide_type"], { bg: string; accent: string }> = {
  hook: { bg: "from-[hsl(220,20%,10%)] to-[hsl(200,80%,20%)]", accent: "text-[hsl(200,80%,70%)]" },
  context: { bg: "from-[hsl(220,14%,16%)] to-[hsl(220,20%,10%)]", accent: "text-[hsl(200,80%,60%)]" },
  result: { bg: "from-[hsl(152,60%,20%)] to-[hsl(220,20%,10%)]", accent: "text-[hsl(152,60%,60%)]" },
  insight: { bg: "from-[hsl(38,92%,25%)] to-[hsl(220,20%,10%)]", accent: "text-[hsl(38,92%,70%)]" },
  cta: { bg: "from-[hsl(200,80%,30%)] to-[hsl(220,20%,10%)]", accent: "text-[hsl(200,80%,80%)]" },
};

const slideTypeLabel: Record<StorySlide["slide_type"], string> = {
  hook: "AUFMACHER",
  context: "HINTERGRUND",
  result: "ERGEBNIS",
  insight: "EINORDNUNG",
  cta: "MEHR ERFAHREN",
};

const StoryPreviewModal = ({ open, onOpenChange, slides, loading }: StoryPreviewModalProps) => {
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">Instagram Stories</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-16 gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Stories werden generiert…</span>
          </div>
        )}

        {!loading && slides.length > 0 && (
          <div className="px-8">
            <Carousel opts={{ align: "center" }}>
              <CarouselContent>
                {slides.map((slide, i) => {
                  const style = slideStyles[slide.slide_type];
                  return (
                    <CarouselItem key={i} className="basis-full sm:basis-[280px]">
                      <div className="space-y-2">
                        {/* 9:16 slide card */}
                        <div
                          ref={(el) => { slideRefs.current[i] = el; }}
                          className={`relative aspect-[9/16] rounded-2xl bg-gradient-to-b ${style.bg} flex flex-col items-center justify-center p-6 text-center overflow-hidden`}
                        >
                          {/* Type label */}
                          <span className={`absolute top-5 left-0 right-0 text-[10px] font-bold tracking-[0.2em] uppercase ${style.accent} opacity-80`}>
                            {slideTypeLabel[slide.slide_type]}
                          </span>

                          {/* Emoji */}
                          <span className="text-5xl mb-4 drop-shadow-lg">{slide.emoji}</span>

                          {/* Headline */}
                          <h3 className="text-white font-bold text-lg leading-tight mb-3 px-2" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                            {slide.headline}
                          </h3>

                          {/* Body */}
                          <p className="text-white/80 text-sm leading-relaxed px-2">
                            {slide.body}
                          </p>

                          {/* Branding */}
                          <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-0.5">
                            <span className="text-white/40 text-[9px] font-medium tracking-wider uppercase">politikradar.ch</span>
                          </div>
                        </div>

                        {/* Download button */}
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
                  );
                })}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Erstellt mit KI · Inhalte prüfen vor Veröffentlichung
            </p>
          </div>
        )}

        {!loading && slides.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Keine Slides verfügbar.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StoryPreviewModal;
