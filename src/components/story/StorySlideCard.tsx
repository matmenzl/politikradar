import { forwardRef, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import type { StorySlide } from "../StoryPreviewModal";
import { buildPollinationsUrl, fallbackImagePrompt } from "@/lib/pollinations";


const slideStyles: Record<StorySlide["slide_type"], { bg: string; accent: string; glow: string }> = {
  hook: {
    bg: "from-[hsl(220,25%,8%)] via-[hsl(210,40%,14%)] to-[hsl(200,60%,18%)]",
    accent: "text-[hsl(200,80%,70%)]",
    glow: "hsl(200,80%,50%)",
  },
  context: {
    bg: "from-[hsl(220,20%,8%)] via-[hsl(220,18%,12%)] to-[hsl(230,25%,16%)]",
    accent: "text-[hsl(220,60%,70%)]",
    glow: "hsl(220,60%,50%)",
  },
  result: {
    bg: "from-[hsl(160,30%,8%)] via-[hsl(152,40%,12%)] to-[hsl(152,50%,16%)]",
    accent: "text-[hsl(152,60%,60%)]",
    glow: "hsl(152,60%,40%)",
  },
  insight: {
    bg: "from-[hsl(30,30%,8%)] via-[hsl(35,50%,12%)] to-[hsl(38,60%,16%)]",
    accent: "text-[hsl(38,80%,65%)]",
    glow: "hsl(38,80%,45%)",
  },
  cta: {
    bg: "from-[hsl(200,50%,10%)] via-[hsl(200,60%,16%)] to-[hsl(200,70%,22%)]",
    accent: "text-[hsl(200,80%,75%)]",
    glow: "hsl(200,80%,55%)",
  },
  party: {
    bg: "from-[hsl(260,25%,8%)] via-[hsl(260,30%,12%)] to-[hsl(260,35%,18%)]",
    accent: "text-[hsl(260,60%,75%)]",
    glow: "hsl(260,60%,50%)",
  },
};

const slideTypeLabel: Record<StorySlide["slide_type"], string> = {
  hook: "AUFMACHER",
  context: "HINTERGRUND",
  result: "ERGEBNIS",
  insight: "EINORDNUNG",
  cta: "MEHR ERFAHREN",
  party: "PARTEIVERHALTEN",
};

interface StorySlideCardProps {
  slide: StorySlide;
  index: number;
  total: number;
}

const StorySlideCard = forwardRef<HTMLDivElement, StorySlideCardProps>(
  ({ slide, index, total }, ref) => {
    const style = slideStyles[slide.slide_type];
    const [imgLoaded, setImgLoaded] = useState(false);
    const [imgFailed, setImgFailed] = useState(false);

    const imageSrc = useMemo(() => {
      if (slide.image_url) return slide.image_url;
      const prompt = slide.image_prompt || fallbackImagePrompt(slide.headline, slide.slide_type);
      return buildPollinationsUrl(prompt, { seed: slide.image_seed });
      // Re-derive only when the relevant fields change
    }, [slide.image_url, slide.image_prompt, slide.image_seed, slide.headline, slide.slide_type]);

    // Reset load/error state whenever a new image is requested (e.g. new seed)
    useEffect(() => {
      setImgLoaded(false);
      setImgFailed(false);
    }, [imageSrc]);

    return (
      <div
        ref={ref}
        className={`relative aspect-[9/16] rounded-2xl bg-gradient-to-b ${style.bg} flex flex-col overflow-hidden select-none`}
      >
        {/* AI background image */}
        {!imgFailed && (
          <img
            key={imageSrc}
            src={imageSrc}
            alt=""
            crossOrigin="anonymous"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgFailed(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
              imgLoaded ? "opacity-60" : "opacity-0"
            }`}
          />
        )}
        {/* Readability overlay */}
        {!imgFailed && imgLoaded && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black/85 pointer-events-none" />
        )}
        {/* Loading state */}
        {!imgFailed && !imgLoaded && (
          <div className="absolute inset-0 z-20 flex items-end justify-center pb-4 pointer-events-none">
            <div className="absolute inset-0 animate-pulse bg-white/[0.04]" />
            <span className="relative flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[10px] text-white/80 backdrop-blur-sm">
              <Loader2 className="w-3 h-3 animate-spin" />
              Bild wird generiert…
            </span>
          </div>
        )}


        {/* Ambient glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/3 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: style.glow }}
        />


        {/* Top bar: type label + counter */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-5">
          <span className={`text-[9px] font-bold tracking-[0.25em] uppercase ${style.accent} opacity-70`}>
            {slideTypeLabel[slide.slide_type]}
          </span>
          <span className="text-white/30 text-[9px] font-medium tabular-nums">
            {index + 1}/{total}
          </span>
        </div>

        {/* Progress dots */}
        <div className="relative z-10 flex gap-1 px-5 mt-3">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-[2px] rounded-full transition-colors ${
                i <= index ? "bg-white/60" : "bg-white/15"
              }`}
            />
          ))}
        </div>

        {/* Content area */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
          {slide.slide_type === "party" && slide.partyData ? (
            <PartySlideContent slide={slide} style={style} />
          ) : (
            <DefaultSlideContent slide={slide} />
          )}
        </div>

        {/* Branding */}
        <div className="relative z-10 pb-5 flex flex-col items-center gap-1">
          <div className="w-8 h-[1px] bg-white/10 mb-1" />
          <span className="text-white/25 text-[8px] font-semibold tracking-[0.3em] uppercase">
            politikradar.ch
          </span>
        </div>
      </div>
    );
  }
);

StorySlideCard.displayName = "StorySlideCard";

function DefaultSlideContent({ slide }: { slide: StorySlide }) {
  return (
    <>
      <span className="text-4xl mb-5 drop-shadow-lg">{slide.emoji}</span>
      <h3
        className="text-white font-bold text-lg leading-snug mb-3 px-1"
        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
      >
        {slide.headline}
      </h3>
      <p className="text-white/70 text-[13px] leading-relaxed px-2 max-w-[90%]">
        {slide.body}
      </p>
    </>
  );
}

function PartySlideContent({ slide, style }: { slide: StorySlide; style: { accent: string } }) {
  return (
    <>
      <span className="text-3xl mb-2 drop-shadow-lg">🏛️</span>
      <h3
        className="text-white font-bold text-[15px] leading-tight mb-4 px-2"
        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
      >
        {slide.headline}
      </h3>
      <div className="w-full px-3 space-y-1.5">
        {slide.partyData?.map((p) => {
          const yesP = p.total > 0 ? Math.round((p.yes / p.total) * 100) : 0;
          const noP = p.total > 0 ? Math.round((p.no / p.total) * 100) : 0;
          return (
            <div key={p.party} className="flex items-center gap-2">
              <span className="text-white/80 text-[10px] font-semibold w-[72px] text-right truncate">
                {p.party}
              </span>
              <div
                className="flex-1 flex h-3 rounded-full overflow-hidden"
                style={{ backgroundColor: "hsla(220,20%,30%,0.4)" }}
              >
                <div
                  className="rounded-l-full transition-all duration-500"
                  style={{ width: `${yesP}%`, backgroundColor: "hsl(152, 60%, 50%)" }}
                />
                <div
                  className="rounded-r-full transition-all duration-500"
                  style={{ width: `${noP}%`, backgroundColor: "hsl(0, 72%, 55%)" }}
                />
              </div>
              <span className="text-white/50 text-[9px] font-mono w-[36px]">
                {p.yes}/{p.no}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[9px] text-white/40">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(152, 60%, 50%)" }} /> Ja
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(0, 72%, 55%)" }} /> Nein
        </span>
      </div>
    </>
  );
}

export default StorySlideCard;
