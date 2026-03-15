import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from "@/components/ui/carousel";
import { Download, Loader2 } from "lucide-react";
import { useRef, useCallback, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import StorySlideCard from "./story/StorySlideCard";

export interface PartyVoteData {
  party: string;
  yes: number;
  no: number;
  total: number;
}

export interface StorySlide {
  headline: string;
  body: string;
  emoji: string;
  slide_type: "hook" | "context" | "result" | "insight" | "cta" | "party";
  partyData?: PartyVoteData[];
}

interface StoryPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slides: StorySlide[];
  loading?: boolean;
}

const StoryPreviewModal = ({ open, onOpenChange, slides, loading }: StoryPreviewModalProps) => {
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">Instagram Stories</DialogTitle>
          {!loading && slides.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {slides.length} Slides · Slide {current + 1} von {slides.length}
            </p>
          )}
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-2 border-muted animate-ping absolute inset-0" />
              <Loader2 className="w-10 h-10 animate-spin text-accent" />
            </div>
            <span className="text-sm text-muted-foreground mt-2">Stories werden generiert…</span>
          </div>
        )}

        {!loading && slides.length > 0 && (
          <div className="px-4 sm:px-8">
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
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>

            {/* Dot indicators */}
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

            {/* Batch download */}
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
