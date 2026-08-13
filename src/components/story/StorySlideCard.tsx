// StorySlideCard.tsx — Redesign "Sprechblasen" (Drop-in-Ersatz)
// Gleiche Props/API wie bisher: { slide, index, total } + forwardRef.
// Skaliert über Container-Queries (cqw) — funktioniert in Preview UND beim Bild-Export.
import { forwardRef, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import type { StorySlide } from "../StoryPreviewModal";
import { buildPollinationsUrl, fallbackImagePrompt } from "@/lib/pollinations";
import {
  BRAND,
  SERIF,
  SANS,
  BUBBLE_TAIL,
  BUBBLE_FRAME,
  headline as headlineStyle,
  kicker as kickerStyle,
  quote as quoteStyle,
  body as bodyStyle,
  cta as ctaStyle,
  resultPill,
  isQuote,
} from "@/lib/storyTheme";

// Farbwelt pro Slide-Typ (Styleguide-Tokens)
const slideStyles: Record<StorySlide["slide_type"], { bg: string; text: string; accent: string; pillBg: string; track: string }> = {
  hook:    { bg: BRAND.red,    text: BRAND.paper, accent: BRAND.yellow,      pillBg: BRAND.redSoft,    track: "rgba(244,242,236,0.25)" },
  context: { bg: BRAND.paper,  text: BRAND.ink,   accent: BRAND.blue,        pillBg: BRAND.blueSoft,   track: "rgba(26,26,26,0.15)" },
  result:  { bg: BRAND.yellow, text: BRAND.ink,   accent: BRAND.green,       pillBg: BRAND.greenSoft,  track: "rgba(26,26,26,0.15)" },
  insight: { bg: BRAND.purple, text: BRAND.paper, accent: BRAND.pink,        pillBg: BRAND.purpleSoft, track: "rgba(244,242,236,0.25)" },
  cta:     { bg: BRAND.blue,   text: BRAND.paper, accent: BRAND.greenBright, pillBg: BRAND.greenSoft,  track: "rgba(244,242,236,0.25)" },
  party:   { bg: BRAND.green,  text: BRAND.paper, accent: BRAND.yellow,      pillBg: BRAND.greenSoft,  track: "rgba(244,242,236,0.18)" },
};

const slideTypeLabel: Record<StorySlide["slide_type"], string> = {
  hook: "Aufmacher", context: "Hintergrund", result: "Ergebnis",
  insight: "Einordnung", cta: "Mehr erfahren", party: "Parteiverhalten",
};

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

  const bodyIsQuote = isQuote(slide.body);

  return (
    <div
      ref={ref}
      className="relative aspect-[9/16] flex flex-col overflow-hidden select-none"
      style={{ backgroundColor: s.bg, color: s.text, fontFamily: SANS, containerType: "inline-size" }}
    >
      {/* CTA: Rahmen-Variante */}
      {slide.slide_type === "cta" && (
        <div className="absolute pointer-events-none" style={{ inset: "2.5cqw", border: "1.2cqw solid " + s.accent, clipPath: BUBBLE_FRAME }} />
      )}

      {/* Top bar: Kicker + Zähler */}
      <div className="relative z-10 flex items-center justify-between" style={{ padding: "8cqw 9cqw 0" }}>
        <span style={kickerStyle("2.6cqw", s.accent)}>
          {slideTypeLabel[slide.slide_type]}
        </span>
        <span className="tabular-nums" style={{ fontFamily: SANS, fontWeight: 600, fontSize: "2.6cqw", opacity: 0.5 }}>
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
            <h3 style={headlineStyle("9.5cqw")}>{slide.headline}</h3>
            <div style={{ width: "9cqw", height: "0.7cqw", backgroundColor: s.accent, margin: "4cqw 0" }} />
            <p style={{
              ...(bodyIsQuote ? quoteStyle("4cqw", 1.35) : bodyStyle("3.7cqw", 1.5)),
              opacity: 0.95,
              maxWidth: "88%",
            }}>
              {slide.body}
            </p>
            {slide.slide_type === "cta" && (
              <div
                className="self-start"
                style={{ ...ctaStyle("3.7cqw", s.accent, BRAND.ink), marginTop: "6cqw", padding: "2.4cqw 4.2cqw" }}
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
          style={{ bottom: "12cqw", right: "-5cqw", width: "48cqw", height: "44cqw", backgroundColor: BRAND.purple, clipPath: BUBBLE_TAIL, overflow: "hidden" }}
        >
          <img
            key={imageSrc} src={imageSrc} alt="" crossOrigin="anonymous"
            onLoad={() => setImgLoaded(true)} onError={() => setImgFailed(true)}
            className={`w-full h-full object-cover transition-opacity duration-700 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          />
          {!imgLoaded && (
            <span className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: BRAND.paper }} />
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
      <h3 style={{ ...headlineStyle("7.5cqw", 1.1), margin: "0 0 5cqw" }}>{slide.headline}</h3>
      <div className="flex flex-col" style={{ gap: "2.6cqw" }}>
        {slide.partyData?.map((p) => {
          const yesP = p.total > 0 ? Math.round((p.yes / p.total) * 100) : 0;
          const noP = p.total > 0 ? Math.round((p.no / p.total) * 100) : 0;
          return (
            <div key={p.party} className="flex items-center" style={{ gap: "2.4cqw" }}>
              <span className="text-right truncate" style={{ fontFamily: SANS, fontWeight: 700, width: "13cqw", fontSize: "3cqw" }}>{p.party}</span>
              <div className="flex-1 flex overflow-hidden" style={{ height: "4.4cqw", backgroundColor: s.track }}>
                <div style={{ width: `${yesP}%`, backgroundColor: BRAND.greenBright }} />
                <div style={{ width: `${noP}%`, backgroundColor: BRAND.red }} />
              </div>
              <span
                className="tabular-nums text-center"
                style={{ ...resultPill("2.6cqw", "rgba(244,242,236,0.9)", BRAND.ink), width: "12cqw", padding: "0.6cqw 0" }}
              >
                {p.yes}:{p.no}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex" style={{ fontFamily: SANS, fontWeight: 600, gap: "4cqw", marginTop: "3cqw", fontSize: "2.6cqw", opacity: 0.85 }}>
        <span className="flex items-center" style={{ gap: "1.2cqw" }}>
          <span style={{ width: "2.2cqw", height: "2.2cqw", backgroundColor: BRAND.greenBright, display: "inline-block" }} /> Ja
        </span>
        <span className="flex items-center" style={{ gap: "1.2cqw" }}>
          <span style={{ width: "2.2cqw", height: "2.2cqw", backgroundColor: BRAND.red, display: "inline-block" }} /> Nein
        </span>
      </div>
    </>
  );
}

export default StorySlideCard;
