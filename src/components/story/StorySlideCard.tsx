// StorySlideCard.tsx — Redesign "Sprechblasen" (Drop-in-Ersatz)
// Gleiche Props/API wie bisher: { slide, index, total } + forwardRef.
// Skaliert über Container-Queries (cqw) — funktioniert in Preview UND beim Bild-Export.
import { forwardRef, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import type { StorySlide } from "../StoryPreviewModal";
import { buildPollinationsUrl, fallbackImagePrompt } from "@/lib/pollinations";

// Farbwelt pro Slide-Typ (statt dunkler Gradients)
const slideStyles: Record<StorySlide["slide_type"], { bg: string; text: string; accent: string; pillBg: string; track: string }> = {
  hook:    { bg: "#E8442E", text: "#F4F2EC", accent: "#F7D344", pillBg: "#F8D9D3", track: "rgba(244,242,236,0.25)" },
  context: { bg: "#F4F2EC", text: "#1A1A1A", accent: "#2151D1", pillBg: "#DCE4F7", track: "rgba(26,26,26,0.15)" },
  result:  { bg: "#F7D344", text: "#1A1A1A", accent: "#2E7D46", pillBg: "#E3EDDD", track: "rgba(26,26,26,0.15)" },
  insight: { bg: "#7A1E78", text: "#F4F2EC", accent: "#F2B8C6", pillBg: "#EBD6EA", track: "rgba(244,242,236,0.25)" },
  cta:     { bg: "#2151D1", text: "#F4F2EC", accent: "#63B348", pillBg: "#DFF0D8", track: "rgba(244,242,236,0.25)" },
  party:   { bg: "#2E7D46", text: "#F4F2EC", accent: "#F7D344", pillBg: "#E3EDDD", track: "rgba(244,242,236,0.18)" },
};

const slideTypeLabel: Record<StorySlide["slide_type"], string> = {
  hook: "AUFMACHER", context: "HINTERGRUND", result: "ERGEBNIS",
  insight: "EINORDNUNG", cta: "MEHR ERFAHREN", party: "PARTEIVERHALTEN",
};

// Sprechblasen-Formen (unregelmässig geschnittene Ecken)
const BUBBLE_TAIL = "polygon(3% 5%, 97% 0%, 100% 92%, 24% 95%, 19% 100%, 15% 93%, 0% 96%)";
const FRAME = "polygon(3% 1%, 97% 0%, 100% 3%, 99% 97%, 96% 100%, 4% 99%, 0% 96%, 1% 2%)";

const SERIF = "'Newsreader', Georgia, serif";
const SANS = "'Hanken Grotesk', system-ui, sans-serif";

interface StorySlideCardProps { slide: StorySlide; index: number; total: number; }

const StorySlideCard = forwardRef<HTMLDivElement, StorySlideCardProps>(({ slide, index, total }, ref) => {
  const s = slideStyles[slide.slide_type];
  const showImage = slide.slide_type === "hook"; // Bild nur als Bubble auf dem Hook-Slide
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const imageSrc = useMemo(() => {
    if (!showImage) return "";
    if (slide.image_url) return slide.image_url;
    const prompt = slide.image_prompt || fallbackImagePrompt(slide.headline, slide.slide_type);
    return buildPollinationsUrl(prompt, { seed: slide.image_seed, width: 800, height: 760 });
  }, [showImage, slide.image_url, slide.image_prompt, slide.image_seed, slide.headline, slide.slide_type]);

  useEffect(() => { setImgLoaded(false); setImgFailed(false); }, [imageSrc]);

  return (
    <div
      ref={ref}
      className="relative aspect-[9/16] flex flex-col overflow-hidden select-none"
      style={{ backgroundColor: s.bg, color: s.text, fontFamily: SANS, containerType: "inline-size" }}
    >
      {/* CTA: Rahmen-Variante */}
      {slide.slide_type === "cta" && (
        <div className="absolute pointer-events-none" style={{ inset: "2.5cqw", border: "1.2cqw solid " + s.accent, clipPath: FRAME }} />
      )}

      {/* Top bar: Typ-Label + Zähler */}
      <div className="relative z-10 flex items-center justify-between" style={{ padding: "8cqw 9cqw 0" }}>
        <span className="font-bold uppercase" style={{ fontSize: "2.6cqw", letterSpacing: "0.22em", color: s.accent }}>
          {slideTypeLabel[slide.slide_type]}
        </span>
        <span className="font-semibold tabular-nums" style={{ fontSize: "2.6cqw", opacity: 0.5 }}>
          {index + 1}/{total}
        </span>
      </div>

      {/* Progress-Segmente */}
      <div className="relative z-10 flex" style={{ gap: "1cqw", padding: "1.6cqw 9cqw 0" }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="flex-1" style={{ height: "0.55cqw", backgroundColor: i <= index ? s.text : s.track }} />
        ))}
      </div>

      {/* Inhalt */}
      <div className="relative z-10 flex-1 flex flex-col justify-center" style={{ padding: "0 9cqw" }}>
        {slide.slide_type === "party" && slide.partyData ? (
          <PartyContent slide={slide} s={s} />
        ) : (
          <>
            <h3 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: "9.5cqw", lineHeight: 1.08, margin: 0 }}>
              {slide.headline}
            </h3>
            <div style={{ width: "9cqw", height: "0.7cqw", backgroundColor: s.accent, margin: "4cqw 0" }} />
            <p style={{ fontSize: "3.7cqw", lineHeight: 1.5, fontWeight: 500, margin: 0, opacity: 0.95, maxWidth: "88%" }}>
              {slide.body}
            </p>
            {slide.slide_type === "cta" && (
              <div
                className="self-start font-extrabold"
                style={{ marginTop: "6cqw", fontSize: "3.7cqw", padding: "2.4cqw 4.2cqw", backgroundColor: s.accent, color: "#1A1A1A", clipPath: BUBBLE_TAIL }}
              >
                politikradar.ch → Story lesen
              </div>
            )}
          </>
        )}
      </div>

      {/* Bild-Bubble (nur Hook) */}
      {showImage && !imgFailed && (
        <div
          className="absolute z-0"
          style={{ bottom: "12cqw", right: "-5cqw", width: "48cqw", height: "44cqw", backgroundColor: "#7A1E78", clipPath: BUBBLE_TAIL, overflow: "hidden" }}
        >
          <img
            key={imageSrc} src={imageSrc} alt="" crossOrigin="anonymous"
            onLoad={() => setImgLoaded(true)} onError={() => setImgFailed(true)}
            className={`w-full h-full object-cover transition-opacity duration-700 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          />
          {!imgLoaded && (
            <span className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#F4F2EC" }} />
            </span>
          )}
        </div>
      )}

      {/* Branding-Footer */}
      <div className="relative z-10 text-center" style={{ paddingBottom: "4.5cqw" }}>
        <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "3.1cqw" }}>politikradar.ch</span>
      </div>
    </div>
  );
});

StorySlideCard.displayName = "StorySlideCard";

function PartyContent({ slide, s }: { slide: StorySlide; s: { accent: string; track: string } }) {
  return (
    <>
      <h3 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: "7.5cqw", lineHeight: 1.1, margin: "0 0 5cqw" }}>
        {slide.headline}
      </h3>
      <div className="flex flex-col" style={{ gap: "2.6cqw" }}>
        {slide.partyData?.map((p) => {
          const yesP = p.total > 0 ? Math.round((p.yes / p.total) * 100) : 0;
          const noP = p.total > 0 ? Math.round((p.no / p.total) * 100) : 0;
          return (
            <div key={p.party} className="flex items-center" style={{ gap: "2.4cqw" }}>
              <span className="font-bold text-right truncate" style={{ width: "13cqw", fontSize: "3cqw" }}>{p.party}</span>
              <div className="flex-1 flex overflow-hidden" style={{ height: "4.4cqw", backgroundColor: s.track }}>
                <div style={{ width: `${yesP}%`, backgroundColor: "#63B348" }} />
                <div style={{ width: `${noP}%`, backgroundColor: "#E8442E" }} />
              </div>
              <span className="font-semibold tabular-nums" style={{ width: "10cqw", fontSize: "2.6cqw", opacity: 0.7 }}>
                {p.yes}/{p.no}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex font-semibold" style={{ gap: "4cqw", marginTop: "3cqw", fontSize: "2.6cqw", opacity: 0.85 }}>
        <span className="flex items-center" style={{ gap: "1.2cqw" }}>
          <span style={{ width: "2.2cqw", height: "2.2cqw", backgroundColor: "#63B348", display: "inline-block" }} /> Ja
        </span>
        <span className="flex items-center" style={{ gap: "1.2cqw" }}>
          <span style={{ width: "2.2cqw", height: "2.2cqw", backgroundColor: "#E8442E", display: "inline-block" }} /> Nein
        </span>
      </div>
    </>
  );
}

export default StorySlideCard;
