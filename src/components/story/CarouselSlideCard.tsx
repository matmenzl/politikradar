// CarouselSlideCard.tsx — Feed-Karussell (4:5 oder 1:1) im Sprechblasen-Design
// Gleiches Muster wie StorySlideCard: cqw-Skalierung, flache Farbwelten, clip-path-Bubbles.
import { forwardRef } from "react";
import {
  BRAND,
  SERIF,
  SANS,
  BUBBLE_TAIL,
  BUBBLE_CHIP,
  BUBBLE_PLAIN,
  BUBBLE_FRAME,
  headline as headlineStyle,
  kicker as kickerStyle,
  quote as quoteStyle,
  body as bodyStyle,
  pill as pillStyle,
  cta as ctaStyle,
  resultBubble,
  hashtagPill,
  isQuote,
} from "@/lib/storyTheme";

export interface CarouselSlide {
  slide_type: "cover" | "detail" | "result" | "cta";
  kicker?: string;      // z.B. "Motion 24.3012 · Nationalrat" oder "Herbstsession · Woche 2"
  headline: string;     // Betonung: **fett** wird als Semibold gerendert
  body?: string;
  hashtags?: string[];  // detail-Slide
  votes?: { yes: number; no: number; abstain: number }; // result-Slide
  status?: "angenommen" | "abgelehnt";                  // result-Slide
  cta_label?: string;   // cta-Slide, z.B. "@politikradar folgen"
}

interface CarouselSlideCardProps {
  slide: CarouselSlide;
  index: number;
  total: number;
  format?: "portrait" | "square"; // 4:5 (Standard) oder 1:1
}

// **fett** → Semibold-Span (.headline-em)
function Emph({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return <>{parts.map((p, i) => (i % 2 ? <span key={i} style={{ fontWeight: 600 }}>{p}</span> : p))}</>;
}

const CarouselSlideCard = forwardRef<HTMLDivElement, CarouselSlideCardProps>(
  ({ slide, index, total, format = "portrait" }, ref) => {
    const aspect = format === "square" ? "aspect-square" : "aspect-[4/5]";
    const base = { fontFamily: SANS, containerType: "inline-size" as const };
    const bodyIsQuote = isQuote(slide.body);

    if (slide.slide_type === "cover") {
      return (
        <div ref={ref} className={`relative ${aspect} overflow-hidden select-none`} style={{ ...base, backgroundColor: BRAND.paper }}>
          {/* Deko-Bubbles */}
          <div className="absolute" style={{ top: "-6cqw", left: "-8cqw", width: "34cqw", height: "26cqw", backgroundColor: BRAND.yellow, clipPath: BUBBLE_PLAIN }} />
          <div className="absolute" style={{ top: "-4cqw", right: "-6cqw", width: "28cqw", height: "22cqw", backgroundColor: BRAND.green, clipPath: BUBBLE_PLAIN }} />
          <div className="absolute" style={{ bottom: "-6cqw", left: "8cqw", width: "38cqw", height: "20cqw", backgroundColor: BRAND.pink, clipPath: BUBBLE_PLAIN }} />
          <div className="absolute" style={{ bottom: "-5cqw", right: "-4cqw", width: "26cqw", height: "19cqw", backgroundColor: BRAND.blue, clipPath: BUBBLE_PLAIN }} />
          {/* Headline-Bubble */}
          <div className="absolute flex items-center" style={{ left: "8cqw", right: "8cqw", top: format === "square" ? "22cqw" : "30cqw", height: format === "square" ? "56cqw" : "52cqw", backgroundColor: BRAND.red, clipPath: BUBBLE_TAIL }}>
            <h2 style={{ ...headlineStyle("8.5cqw"), color: BRAND.paper, padding: "0 7cqw" }}>
              <Emph text={slide.headline} />
            </h2>
          </div>
          {slide.kicker && (
            <div
              className="absolute"
              style={{ ...kickerStyle("2.8cqw", BRAND.paper), left: "12cqw", top: format === "square" ? "84cqw" : "90cqw", padding: "1.7cqw 3.2cqw", backgroundColor: BRAND.blue, clipPath: BUBBLE_CHIP }}
            >
              {slide.kicker}
            </div>
          )}
          <div className="absolute" style={{ bottom: "4.5cqw", right: "8.5cqw", fontFamily: SERIF, fontWeight: 600, fontSize: "3.7cqw", color: BRAND.purple }}>politikradar.</div>
          <div className="absolute" style={{ bottom: "5cqw", left: "12cqw", fontFamily: SANS, fontWeight: 600, fontSize: "2.4cqw", color: BRAND.purple }}>{total} Slides → wischen</div>
        </div>
      );
    }

    if (slide.slide_type === "detail") {
      return (
        <div ref={ref} className={`relative ${aspect} overflow-hidden select-none`} style={{ ...base, backgroundColor: BRAND.blue, color: BRAND.greenBright }}>
          <div className="absolute pointer-events-none" style={{ inset: "2.6cqw", border: "1.3cqw solid " + BRAND.greenBright, clipPath: BUBBLE_FRAME }} />
          <div className="absolute text-center w-full" style={{ top: "7cqw", fontFamily: SERIF, fontWeight: 600, fontSize: "3.1cqw" }}>politikradar.</div>
          <div className="absolute" style={{ left: "10cqw", right: "10cqw", top: "17cqw" }}>
            {slide.kicker && <div style={{ ...kickerStyle("2.4cqw"), opacity: 0.85 }}>{slide.kicker}</div>}
            <h2 style={{ ...headlineStyle("7.8cqw", 1.1), margin: "2.6cqw 0 0" }}><Emph text={slide.headline} /></h2>
            <div style={{ width: "8.5cqw", height: "0.55cqw", backgroundColor: BRAND.greenBright, margin: "4cqw 0" }} />
            {slide.body && (
              <p style={{ ...(bodyIsQuote ? quoteStyle("3.5cqw") : bodyStyle("3.1cqw")), maxWidth: "72cqw" }}>{slide.body}</p>
            )}
          </div>
          {slide.hashtags?.length ? (
            <div className="absolute flex flex-wrap" style={{ left: "10cqw", bottom: "11cqw", gap: "1.7cqw" }}>
              {slide.hashtags.map((h) => (
                <span key={h} style={{ ...hashtagPill("3cqw", BRAND.greenSoft, BRAND.green), padding: "1.6cqw 3cqw" }}>#{h.replace(/^#/, "")}</span>
              ))}
            </div>
          ) : null}
        </div>
      );
    }

    if (slide.slide_type === "result") {
      const v = slide.votes ?? { yes: 0, no: 0, abstain: 0 };
      const t = Math.max(v.yes + v.no + v.abstain, 1);
      const accepted = slide.status !== "abgelehnt";
      return (
        <div ref={ref} className={`relative ${aspect} overflow-hidden select-none`} style={{ ...base, backgroundColor: BRAND.yellow, color: BRAND.ink }}>
          <div className="absolute" style={{ top: "7cqw", left: "9cqw", fontFamily: SERIF, fontWeight: 600, fontSize: "3.1cqw" }}>politikradar.</div>
          {slide.kicker && <div className="absolute" style={{ ...kickerStyle("2.4cqw", BRAND.redDeep), top: "7.3cqw", right: "9cqw" }}>{slide.kicker}</div>}
          <div className="absolute" style={{ left: "9cqw", right: "9cqw", top: "18cqw" }}>
            <h2 style={headlineStyle("6.1cqw", 1.12)}><Emph text={slide.headline} /></h2>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              ...resultBubble("4.4cqw", accepted ? BRAND.green : BRAND.redDeep, BRAND.paper),
              left: "9cqw",
              top: format === "square" ? "44cqw" : "52cqw",
              width: "42cqw",
              height: "13cqw",
            }}
          >
            <span>{accepted ? "Angenommen" : "Abgelehnt"}</span>
          </div>
          <div className="absolute flex flex-col" style={{ left: "9cqw", right: "9cqw", top: format === "square" ? "68cqw" : "78cqw", gap: "3.3cqw" }}>
            {([["Ja", v.yes, BRAND.green], ["Nein", v.no, BRAND.red], ["Enthaltungen", v.abstain, BRAND.purple]] as const).map(([label, n, color]) => (
              <div key={label}>
                <div className="flex justify-between" style={{ fontFamily: SANS, fontWeight: 700, fontSize: "3.1cqw", marginBottom: "1.3cqw" }}><span>{label}</span><span className="tabular-nums">{n}</span></div>
                <div style={{ height: "4cqw", backgroundColor: "rgba(26,26,26,0.12)" }}>
                  <div style={{ height: "100%", width: `${Math.round((n / t) * 100)}%`, backgroundColor: color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // cta
    return (
      <div ref={ref} className={`relative ${aspect} overflow-hidden select-none`} style={{ ...base, backgroundColor: BRAND.purple, color: BRAND.paper }}>
        <div className="absolute" style={{ top: "-6cqw", right: "-5cqw", width: "30cqw", height: "23cqw", backgroundColor: BRAND.yellow, clipPath: BUBBLE_PLAIN }} />
        <div className="absolute" style={{ bottom: "-7cqw", left: "-5cqw", width: "34cqw", height: "25cqw", backgroundColor: BRAND.red, clipPath: BUBBLE_PLAIN }} />
        <div className="absolute" style={{ bottom: "-5cqw", right: "11cqw", width: "26cqw", height: "19cqw", backgroundColor: BRAND.greenBright, clipPath: BUBBLE_PLAIN }} />
        <div className="absolute" style={{ left: "11cqw", right: "11cqw", top: format === "square" ? "22cqw" : "30cqw" }}>
          <h2 style={headlineStyle("9.2cqw")}><Emph text={slide.headline} /></h2>
          {slide.body && (
            <p style={{ ...(bodyIsQuote ? quoteStyle("3.9cqw") : bodyStyle("3.5cqw", 1.4)), maxWidth: "68cqw", marginTop: "3.3cqw" }}>{slide.body}</p>
          )}
        </div>
        <div
          className="absolute"
          style={{ ...ctaStyle("3.5cqw", BRAND.paper, BRAND.purple), left: "11cqw", top: format === "square" ? "66cqw" : "78cqw", padding: "2.4cqw 4cqw" }}
        >
          {slide.cta_label ?? "@politikradar folgen"}
        </div>
        <div className="absolute" style={{ bottom: "6cqw", left: "11cqw", fontFamily: SERIF, fontWeight: 600, fontSize: "3.7cqw" }}>politikradar.</div>
        <div className="absolute" style={{ bottom: "6.6cqw", right: "11cqw", fontFamily: SANS, fontWeight: 600, fontSize: "2.4cqw", opacity: 0.8 }}>politikradar.mathiasmenzl.ch</div>
      </div>
    );
  }
);

CarouselSlideCard.displayName = "CarouselSlideCard";
export default CarouselSlideCard;
