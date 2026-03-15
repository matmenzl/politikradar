import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from "@/components/ui/carousel";
import { Download, Loader2, ArrowLeft, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRef, useCallback, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import StorySlideCard from "./story/StorySlideCard";
import { useIsMobile } from "@/hooks/use-mobile";

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
  affairId?: string | null;
  votingId?: string | null;
}

function StoryContent({
  slides,
  loading,
}: {
  slides: StorySlide[];
  loading?: boolean;
}) {
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
      // Browser blocks rapid sequential downloads; add delay between each
      if (i < slides.length - 1) {
        await new Promise((r) => setTimeout(r, 800));
      }
    }
  }, [slides.length, downloadSlide]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-2 border-muted animate-ping absolute inset-0" />
          <Loader2 className="w-10 h-10 animate-spin text-accent" />
        </div>
        <span className="text-sm text-muted-foreground mt-2">Stories werden generiert…</span>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">Keine Slides verfügbar.</p>
    );
  }

  return (
    <div className="px-2 sm:px-8">
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
  );
}

const StoryPreviewModal = ({ open, onOpenChange, slides, loading, affairId, votingId }: StoryPreviewModalProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const detailLink = affairId
    ? `/detail/${affairId}?type=affair`
    : votingId
      ? `/detail/${votingId}?type=voting`
      : null;

  // Full-page view on mobile
  if (isMobile && open) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Zurück</span>
          </button>
          <span className="font-serif text-base font-semibold text-foreground">Stories</span>
          <div className="w-16" /> {/* spacer */}
        </header>
        <div className="flex-1 overflow-y-auto py-4">
          {!loading && slides.length > 0 && (
            <p className="text-xs text-muted-foreground text-center mb-3">
              {slides.length} Slides
            </p>
          )}
          <StoryContent slides={slides} loading={loading} />
        </div>
      </div>
    );
  }

  // Dialog on desktop
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">Instagram Stories</DialogTitle>
          {!loading && slides.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {slides.length} Slides
            </p>
          )}
        </DialogHeader>
        <StoryContent slides={slides} loading={loading} />
        {detailLink && (
          <div className="px-6 pb-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-sm"
              onClick={() => { onOpenChange(false); navigate(detailLink); }}
            >
              <FileText className="w-4 h-4" />
              Zum Geschäft
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StoryPreviewModal;
