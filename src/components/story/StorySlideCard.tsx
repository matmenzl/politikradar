// StorySlideCard.tsx — Redesign "Sprechblasen" + Variations-System.
// Die Komposition (Farbwelt, Layout, Bubble-Form, Deko) kommt aus
// src/lib/storyVariants.ts und wird pro Story neu zusammengestellt.
import { forwardRef, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import type { StorySlide } from "../StoryPreviewModal";
import { buildPollinationsUrl, fallbackImagePrompt } from "@/lib/pollinations";
import {
  composeSlideVariant,
  type SlideVariant,
  type SlideType,
} from "@/lib/storyVariants";
import {
  BRAND,
  SERIF,
  SANS,
  BUBBLE_FRAME,
  headline as headlineStyle,
  kicker as kickerStyle,
  quote as quoteStyle,
  body as bodyStyle,
  cta as ctaStyle,
  isQuote,
} from "@/lib/storyTheme";

const slideTypeLabel: Record<SlideType, string> = {
  hook: "Aufmacher", context: "Hintergrund", result: "Ergebnis",
  insight: "Einordnung", cta: "Mehr erfahren", party: "Parteiverhalten",
};

/** **Betonung** → Newsreader 700, optional in Akzentfarbe (Styleguide: nie ganze Zeile) */
function Emph({ text, accent }: { text: string; accent?: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} style={{ fontWeight: 700, color: accent }}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function Divider({ variant }: { variant: SlideVariant }) {
  const { divider, palette } = variant;
  if (divider === "none") return <div style={{ height: "4cqw" }} />;
  if (divider === "dots") {
    return (
      <div className="flex" style={{ gap: "1.6cqw", margin: "4cqw 0" }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ width: "2cqw", height: "2cqw", backgroundColor: i === 1 ? palette.accent2 : palette.accent, display: "block" }} />
        ))}
      </div>
    );
  }
  if (divider === "chevron") {
    return (
      <div style={{ margin: "4cqw 0", width: "13cqw", height: "2.4cqw", backgroundColor: palette.accent, clipPath: "polygon(0 0, 78% 0, 100% 50%, 78% 100%, 0 100%)" }} />
    );
  }
  if (divider === "hairline") {
    return <div style={{ margin: "4cqw 0", width: "100%", height: "0.4cqw", backgroundColor: palette.accent, opacity: 0.7 }} />;
  }
  return <div style={{ width: "11cqw", height: "1cqw", backgroundColor: palette.accent, margin: "4cqw 0" }} />;
}

interface StorySlideCardProps {
  slide: StorySlide;
  index: number;
  total: number;
  /** Vorberechnete Komposition (aus composeStoryVariants) */
  variant?: SlideVariant;
  /** Fallback-Seed, wenn keine Variante übergeben wird */
  seed?: string | number;
}

const StorySlideCard = forwardRef<HTMLDivElement, StorySlideCardProps>(({ slide, index, total, variant, seed }, ref) => {
  const v = useMemo(
    () =>
      variant ??
      composeSlideVariant(
        { slide_type: slide.slide_type, composition: slide.composition, palette_index: slide.palette_index },
        `${seed ?? slide.headline}-${index}`,
      ),
    [variant, seed, slide.slide_type, slide.composition, slide.palette_index, slide.headline, index],
  );
  const p = v.palette;

  const showImage = slide.image_enabled ?? slide.slide_type === "hook";
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const imageSrc = useMemo(() => {
    if (!showImage) return "";
    if (slide.image_url) return slide.image_url;
    const prompt = slide.image_prompt || fallbackImagePrompt(slide.headline, slide.slide_type);
    return buildPollinationsUrl(prompt, {
      seed: slide.image_seed,
      width: 800,
      height: 760,
      style: slide.image_style,
      negative: slide.image_negative,
    });
  }, [showImage, slide.image_url, slide.image_prompt, slide.image_seed, slide.image_style, slide.image_negative, slide.headline, slide.slide_type]);

  useEffect(() => { setImgLoaded(false); setImgFailed(false); }, [imageSrc]);

  const bodyIsQuote = isQuote(slide.body);
  const comp = v.composition;

  const justify =
    comp === "bottom-anchor" ? "flex-end" : comp === "bubble-top" || comp === "split" ? "flex-start" : "center";

  const imageBox: Record<string, React.CSSProperties> = {
    "bottom-right": { bottom: "12cqw", right: "-5cqw", width: "48cqw", height: "44cqw" },
    "top-right": { top: "22cqw", right: "-6cqw", width: "46cqw", height: "42cqw" },
    "bottom-left": { bottom: "10cqw", left: "-6cqw", width: "50cqw", height: "44cqw" },
    "full-bleed": { bottom: "0", left: "0", width: "100%", height: "42cqw" },
  };

  const headlineNode = (
    <h3 style={headlineStyle(`${v.headlineSize}cqw`)}>
      <Emph text={slide.headline} accent={p.accent} />
    </h3>
  );

  return (
    <div
      ref={ref}
      className="relative aspect-[9/16] flex flex-col overflow-hidden select-none"
      style={{ backgroundColor: p.bg, color: p.text, fontFamily: SANS, containerType: "inline-size" }}
    >
      {/* Rahmen-Variante */}
      {comp === "frame" && (
        <div className="absolute pointer-events-none" style={{ inset: "2.5cqw", border: "1.2cqw solid " + p.accent, clipPath: BUBBLE_FRAME }} />
      )}

      {/* Split: Kontrastblock oben */}
      {comp === "split" && (
        <div className="absolute" style={{ top: 0, left: 0, right: 0, height: "46cqw", backgroundColor: p.accent, opacity: 0.16 }} />
      )}

      {/* Top bar: Kicker + Zähler */}
      <div className="relative z-10 flex items-center justify-between" style={{ padding: "8cqw 9cqw 0" }}>
        <span style={kickerStyle("3.1cqw", p.accent)}>{slideTypeLabel[slide.slide_type]}</span>
        <span className="tabular-nums" style={{ fontFamily: SANS, fontWeight: 700, fontSize: "3cqw", opacity: 0.6 }}>
          {index + 1}/{total}
        </span>
      </div>

      {/* Progress-Segmente */}
      <div className="relative z-10 flex" style={{ gap: "1cqw", padding: "1.6cqw 9cqw 0" }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="flex-1" style={{ height: "0.8cqw", backgroundColor: i <= index ? p.text : p.track }} />
        ))}
      </div>

      {/* Inhalt */}
      <div
        className="relative z-10 flex-1 flex flex-col"
        style={{
          padding: comp === "bottom-anchor" ? "0 9cqw 8cqw" : comp === "bubble-top" || comp === "split" ? "6cqw 9cqw 0" : "0 9cqw",
          justifyContent: justify,
          alignItems: v.alignLeft ? "flex-start" : "stretch",
          textAlign: "left",
        }}
      >
        {slide.slide_type === "party" && slide.partyData ? (
          <PartyContent slide={slide} v={v} />
        ) : (
          <>
            {comp === "bubble-top" ? (
              <div
                style={{
                  backgroundColor: p.text,
                  color: p.bg,
                  clipPath: v.headlineShape,
                  padding: "6cqw 7cqw 7cqw",
                  marginBottom: "5cqw",
                  maxWidth: "96%",
                }}
              >
                <h3 style={headlineStyle(`${Math.max(8, v.headlineSize - 1.2)}cqw`)}>
                  <Emph text={slide.headline} accent={p.accent} />
                </h3>
              </div>
            ) : comp === "band" ? (
              <div style={{ position: "relative", marginBottom: "2cqw" }}>
                <div style={{ position: "absolute", left: "-9cqw", right: "-9cqw", top: "8%", height: "38%", backgroundColor: p.accent, opacity: 0.85 }} />
                <div style={{ position: "relative" }}>{headlineNode}</div>
              </div>
            ) : (
              headlineNode
            )}

            {comp !== "bubble-top" && <Divider variant={v} />}

            <p style={{
              ...(bodyIsQuote ? quoteStyle("5.2cqw", 1.28) : bodyStyle("4.5cqw", 1.4)),
              opacity: 0.95,
              maxWidth: "88%",
            }}>
              {slide.body}
            </p>

            {slide.slide_type === "cta" && (
              <div
                className="self-start"
                style={{ ...ctaStyle("4.4cqw", p.accent, BRAND.ink), marginTop: "6cqw", padding: "2.4cqw 4.2cqw" }}
              >
                politikradar.ch → Story lesen
              </div>
            )}
          </>
        )}
      </div>

      {/* Bild-Bubble */}
      {showImage && !imgFailed && (
        <div
          className="absolute z-0"
          style={{
            ...imageBox[v.imageSpot],
            backgroundColor: p.accent,
            clipPath: v.imageSpot === "full-bleed" ? v.imageShape : v.imageShape,
            overflow: "hidden",
          }}
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
        <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: "3.8cqw" }}>politikradar.ch</span>
      </div>
    </div>
  );
});

StorySlideCard.displayName = "StorySlideCard";

function PartyContent({ slide, v }: { slide: StorySlide; v: SlideVariant }) {
  const p = v.palette;
  return (
    <>
      <h3 style={{ ...headlineStyle(`${v.headlineSize}cqw`, 1.06), margin: "0 0 5cqw" }}><Emph text={slide.headline} accent={p.accent} /></h3>
      <div className="flex flex-col w-full" style={{ gap: "2.6cqw" }}>
        {slide.partyData?.map((party) => {
          const yesP = party.total > 0 ? Math.round((party.yes / party.total) * 100) : 0;
          const noP = party.total > 0 ? Math.round((party.no / party.total) * 100) : 0;
          return (
            <div key={party.party} className="flex items-center" style={{ gap: "2.4cqw" }}>
              <span className="text-right truncate" style={{ fontFamily: SANS, fontWeight: 800, width: "14cqw", fontSize: "3.5cqw" }}>{party.party}</span>
              <div className="flex-1 flex overflow-hidden" style={{ height: "4.4cqw", backgroundColor: p.track }}>
                <div style={{ width: `${yesP}%`, backgroundColor: BRAND.green }} />
                <div style={{ width: `${noP}%`, backgroundColor: BRAND.red }} />
              </div>
              <span
                className="tabular-nums text-right"
                style={{ fontFamily: SANS, fontWeight: 700, width: "13cqw", fontSize: "3.1cqw", opacity: 0.95 }}
              >
                {party.yes}/{party.no}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex" style={{ fontFamily: SANS, fontWeight: 700, gap: "4cqw", marginTop: "3.4cqw", fontSize: "3cqw", opacity: 0.9 }}>
        <span className="flex items-center" style={{ gap: "1.2cqw" }}>
          <span style={{ width: "2.2cqw", height: "2.2cqw", backgroundColor: BRAND.green, display: "inline-block" }} /> Ja
        </span>
        <span className="flex items-center" style={{ gap: "1.2cqw" }}>
          <span style={{ width: "2.2cqw", height: "2.2cqw", backgroundColor: BRAND.red, display: "inline-block" }} /> Nein
        </span>
      </div>
    </>
  );
}

export default StorySlideCard;
