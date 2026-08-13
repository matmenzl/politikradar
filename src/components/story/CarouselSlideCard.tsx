// CarouselSlideCard.tsx — Feed-Karussell (4:5 oder 1:1) im Sprechblasen-Design
// Gleiches Muster wie StorySlideCard: cqw-Skalierung, flache Farbwelten, clip-path-Bubbles.
import { forwardRef } from "react";

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

const BUBBLE_TAIL = "polygon(2% 4%, 98% 0%, 100% 8%, 99% 90%, 24% 93%, 20% 100%, 15% 93%, 1% 95%)";
const BUBBLE_CHIP = "polygon(2% 8%, 98% 0%, 100% 86%, 40% 92%, 35% 100%, 31% 90%, 0% 94%)";
const BUBBLE_PLAIN = "polygon(3% 10%, 97% 0%, 100% 92%, 2% 100%)";
const FRAME = "polygon(3% 1%, 97% 0%, 100% 4%, 99% 96%, 96% 100%, 4% 99%, 0% 95%, 1% 3%)";
const SERIF = "'Newsreader', Georgia, serif";
const SANS = "'Hanken Grotesk', system-ui, sans-serif";

// **fett** → Semibold-Span
function Emph({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return <>{parts.map((p, i) => (i % 2 ? <span key={i} style={{ fontWeight: 600 }}>{p}</span> : p))}</>;
}

const CarouselSlideCard = forwardRef<HTMLDivElement, CarouselSlideCardProps>(
  ({ slide, index, total, format = "portrait" }, ref) => {
    const aspect = format === "square" ? "aspect-square" : "aspect-[4/5]";
    const base = { fontFamily: SANS, containerType: "inline-size" as const };

    if (slide.slide_type === "cover") {
      return (
        <div ref={ref} className={`relative ${aspect} rounded-2xl overflow-hidden select-none`} style={{ ...base, backgroundColor: "#F4F2EC" }}>
          {/* Deko-Bubbles */}
          <div className="absolute" style={{ top: "-6cqw", left: "-8cqw", width: "34cqw", height: "26cqw", backgroundColor: "#F7D344", clipPath: BUBBLE_PLAIN }} />
          <div className="absolute" style={{ top: "-4cqw", right: "-6cqw", width: "28cqw", height: "22cqw", backgroundColor: "#2E7D46", clipPath: BUBBLE_PLAIN }} />
          <div className="absolute" style={{ bottom: "-6cqw", left: "8cqw", width: "38cqw", height: "20cqw", backgroundColor: "#F2B8C6", clipPath: BUBBLE_PLAIN }} />
          <div className="absolute" style={{ bottom: "-5cqw", right: "-4cqw", width: "26cqw", height: "19cqw", backgroundColor: "#2151D1", clipPath: BUBBLE_PLAIN }} />
          {/* Headline-Bubble */}
          <div className="absolute flex items-center" style={{ left: "8cqw", right: "8cqw", top: format === "square" ? "22cqw" : "30cqw", height: format === "square" ? "56cqw" : "52cqw", backgroundColor: "#E8442E", clipPath: BUBBLE_TAIL }}>
            <h2 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: "8.5cqw", lineHeight: 1.08, color: "#F4F2EC", margin: 0, padding: "0 7cqw" }}>
              <Emph text={slide.headline} />
            </h2>
          </div>
          {slide.kicker && (
            <div className="absolute font-bold" style={{ left: "12cqw", top: format === "square" ? "84cqw" : "90cqw", fontSize: "2.8cqw", padding: "1.7cqw 3.2cqw", backgroundColor: "#2151D1", color: "#F4F2EC", clipPath: BUBBLE_CHIP }}>
              {slide.kicker}
            </div>
          )}
          <div className="absolute" style={{ bottom: "4.5cqw", right: "8.5cqw", fontFamily: SERIF, fontWeight: 600, fontSize: "3.7cqw", color: "#7A1E78" }}>politikradar.</div>
          <div className="absolute font-semibold" style={{ bottom: "5cqw", left: "12cqw", fontSize: "2.4cqw", color: "#7A1E78" }}>{total} Slides → wischen</div>
        </div>
      );
    }

    if (slide.slide_type === "detail") {
      return (
        <div ref={ref} className={`relative ${aspect} rounded-2xl overflow-hidden select-none`} style={{ ...base, backgroundColor: "#2151D1", color: "#63B348" }}>
          <div className="absolute pointer-events-none" style={{ inset: "2.6cqw", border: "1.3cqw solid #63B348", clipPath: FRAME }} />
          <div className="absolute text-center w-full" style={{ top: "7cqw", fontFamily: SERIF, fontWeight: 600, fontSize: "3.1cqw" }}>politikradar.</div>
          <div className="absolute" style={{ left: "10cqw", right: "10cqw", top: "17cqw" }}>
            {slide.kicker && <div className="font-bold uppercase" style={{ fontSize: "2.4cqw", letterSpacing: "0.1em", opacity: 0.85 }}>{slide.kicker}</div>}
            <h2 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: "7.8cqw", lineHeight: 1.1, margin: "2.6cqw 0 0" }}><Emph text={slide.headline} /></h2>
            <div style={{ width: "8.5cqw", height: "0.55cqw", backgroundColor: "#63B348", margin: "4cqw 0" }} />
            {slide.body && <p className="font-medium" style={{ fontSize: "3.1cqw", lineHeight: 1.45, maxWidth: "72cqw", margin: 0 }}>{slide.body}</p>}
          </div>
          {slide.hashtags?.length ? (
            <div className="absolute flex flex-wrap" style={{ left: "10cqw", bottom: "11cqw", gap: "1.7cqw" }}>
              {slide.hashtags.map((h) => (
                <span key={h} className="font-semibold" style={{ fontSize: "3cqw", padding: "1.3cqw 2.8cqw", borderRadius: "2cqw", backgroundColor: "#DFF0D8", color: "#4CA64C" }}>#{h.replace(/^#/, "")}</span>
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
        <div ref={ref} className={`relative ${aspect} rounded-2xl overflow-hidden select-none`} style={{ ...base, backgroundColor: "#F7D344", color: "#1A1A1A" }}>
          <div className="absolute" style={{ top: "7cqw", left: "9cqw", fontFamily: SERIF, fontWeight: 600, fontSize: "3.1cqw" }}>politikradar.</div>
          {slide.kicker && <div className="absolute font-bold uppercase" style={{ top: "7.3cqw", right: "9cqw", fontSize: "2.4cqw", letterSpacing: "0.1em" }}>{slide.kicker}</div>}
          <div className="absolute" style={{ left: "9cqw", right: "9cqw", top: "18cqw" }}>
            <h2 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: "6.1cqw", lineHeight: 1.12, margin: 0 }}><Emph text={slide.headline} /></h2>
          </div>
          <div className="absolute flex items-center justify-center" style={{ left: "9cqw", top: format === "square" ? "44cqw" : "52cqw", width: "42cqw", height: "18cqw", backgroundColor: accepted ? "#2E7D46" : "#E8442E", color: "#F4F2EC", clipPath: BUBBLE_CHIP }}>
            <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "5.9cqw", paddingBottom: "1.3cqw" }}>{accepted ? "Angenommen" : "Abgelehnt"}</span>
          </div>
          <div className="absolute flex flex-col" style={{ left: "9cqw", right: "9cqw", top: format === "square" ? "68cqw" : "78cqw", gap: "3.3cqw" }}>
            {([["Ja", v.yes, "#2E7D46"], ["Nein", v.no, "#E8442E"], ["Enthaltungen", v.abstain, "#7A1E78"]] as const).map(([label, n, color]) => (
              <div key={label}>
                <div className="flex justify-between font-bold" style={{ fontSize: "3.1cqw", marginBottom: "1.3cqw" }}><span>{label}</span><span>{n}</span></div>
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
      <div ref={ref} className={`relative ${aspect} rounded-2xl overflow-hidden select-none`} style={{ ...base, backgroundColor: "#7A1E78", color: "#F4F2EC" }}>
        <div className="absolute" style={{ top: "-6cqw", right: "-5cqw", width: "30cqw", height: "23cqw", backgroundColor: "#F7D344", clipPath: BUBBLE_PLAIN }} />
        <div className="absolute" style={{ bottom: "-7cqw", left: "-5cqw", width: "34cqw", height: "25cqw", backgroundColor: "#E8442E", clipPath: BUBBLE_PLAIN }} />
        <div className="absolute" style={{ bottom: "-5cqw", right: "11cqw", width: "26cqw", height: "19cqw", backgroundColor: "#63B348", clipPath: BUBBLE_PLAIN }} />
        <div className="absolute" style={{ left: "11cqw", right: "11cqw", top: format === "square" ? "22cqw" : "30cqw" }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: "9.2cqw", lineHeight: 1.08, margin: 0 }}><Emph text={slide.headline} /></h2>
          {slide.body && <p className="font-medium" style={{ fontSize: "3.5cqw", lineHeight: 1.4, maxWidth: "68cqw", margin: "3.3cqw 0 0" }}>{slide.body}</p>}
        </div>
        <div className="absolute font-extrabold" style={{ left: "11cqw", top: format === "square" ? "66cqw" : "78cqw", fontSize: "3.5cqw", padding: "2.4cqw 4cqw", backgroundColor: "#F4F2EC", color: "#7A1E78", clipPath: BUBBLE_CHIP }}>
          {slide.cta_label ?? "@politikradar folgen"}
        </div>
        <div className="absolute" style={{ bottom: "6cqw", left: "11cqw", fontFamily: SERIF, fontWeight: 600, fontSize: "3.7cqw" }}>politikradar.</div>
        <div className="absolute font-semibold" style={{ bottom: "6.6cqw", right: "11cqw", fontSize: "2.4cqw", opacity: 0.8 }}>politikradar.mathiasmenzl.ch</div>
      </div>
    );
  }
);

CarouselSlideCard.displayName = "CarouselSlideCard";
export default CarouselSlideCard;
