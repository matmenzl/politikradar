import { forwardRef } from "react";
import type { SlideRow } from "@/lib/mvp";
import {
  BUBBLE_FRAME,
  BUBBLE_SMALL,
  SLIDE_KICKERS,
  STORY_PALETTE,
  STORY_SANS,
  STORY_SERIF,
  slideStyleOf,
  splitEmphasis,
} from "@/lib/storySlideDesign";

interface VoteViz {
  type?: string;
  yes?: number;
  no?: number;
  abstention?: number;
  result?: string;
  url?: string | null;
  label?: string;
}

/** Headline mit Wortgruppen-Betonung (**…** → Semibold). */
function Headline({ text, size }: { text: string; size: string }) {
  return (
    <h2 style={{ fontFamily: STORY_SERIF, fontWeight: 400, fontSize: size, lineHeight: 1.06, letterSpacing: "-0.015em", margin: 0 }}>
      {splitEmphasis(text).map((p, i) => (
        <span key={i} style={{ fontWeight: p.strong ? 600 : 400 }}>
          {p.text}
        </span>
      ))}
    </h2>
  );
}

/**
 * Story-Slide im Politikradar-Design-System (9:16, Sprechblasen-Sprache).
 * Skaliert über Container-Queries — Preview und Bild-Export sind identisch.
 */
const SlideCard = forwardRef<HTMLDivElement, { slide: SlideRow; index: number; total: number }>(
  ({ slide, index, total }, ref) => {
    const viz = (slide.visualization || {}) as VoteViz;
    const s = slideStyleOf(slide.slide_type);
    const isVote = viz.type === "vote";
    const isSources = viz.type === "sources";
    const votes = [
      { label: "Ja", value: viz.yes ?? 0, color: STORY_PALETTE.green },
      { label: "Nein", value: viz.no ?? 0, color: STORY_PALETTE.red },
      { label: "Enthaltungen", value: viz.abstention ?? 0, color: "rgba(26,26,26,0.35)" },
    ];
    const maxVote = Math.max(...votes.map((v) => v.value), 1);

    return (
      <div
        ref={ref}
        style={{
          position: "relative",
          aspectRatio: "9 / 16",
          width: "100%",
          background: s.bg,
          color: s.text,
          fontFamily: STORY_SANS,
          display: "flex",
          flexDirection: "column",
          containerType: "inline-size",
          overflow: "hidden",
          userSelect: "none",
        }}
      >
        {s.framed && (
          <div
            style={{
              position: "absolute",
              inset: "2.5cqw",
              border: `1.2cqw solid ${s.accent}`,
              clipPath: BUBBLE_FRAME,
              pointerEvents: "none",
            }}
          />
        )}

        {/* Kopf: Kicker + Zähler */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8cqw 9cqw 0" }}>
          <span style={{ fontWeight: 700, fontSize: "2.8cqw", letterSpacing: "0.18em", textTransform: "uppercase", color: s.accent }}>
            {SLIDE_KICKERS[slide.slide_type] ?? slide.slide_type}
          </span>
          <span style={{ fontWeight: 600, fontSize: "2.8cqw", opacity: 0.6, fontVariantNumeric: "tabular-nums" }}>
            {index + 1}/{total}
          </span>
        </div>

        {/* Fortschritts-Segmente */}
        <div style={{ display: "flex", gap: "1cqw", padding: "1.8cqw 9cqw 0" }}>
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: "0.6cqw", background: i <= index ? s.text : s.track }} />
          ))}
        </div>

        {/* Inhalt */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 9cqw", gap: "4cqw" }}>
          <Headline text={slide.headline ?? ""} size={isVote ? "7.4cqw" : "9cqw"} />

          <div style={{ width: "9cqw", height: "0.7cqw", background: s.accent }} />

          {slide.body && (
            <p style={{ fontFamily: STORY_SANS, fontWeight: 500, fontSize: "3.8cqw", lineHeight: 1.45, margin: 0, maxWidth: "90%" }}>
              {slide.body}
            </p>
          )}

          {isVote && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2.6cqw", marginTop: "2cqw" }}>
              {votes.map((row) => (
                <div key={row.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "3.4cqw", marginBottom: "1cqw" }}>
                    <span>{row.label}</span>
                    <span style={{ fontVariantNumeric: "tabular-nums" }}>{row.value}</span>
                  </div>
                  <div style={{ height: "4cqw", background: s.track }}>
                    <div style={{ height: "100%", width: `${(row.value / maxVote) * 100}%`, background: row.color }} />
                  </div>
                </div>
              ))}
              {viz.result && (
                <div
                  style={{
                    alignSelf: "flex-start",
                    marginTop: "2cqw",
                    fontFamily: STORY_SERIF,
                    fontWeight: 600,
                    fontSize: "4.4cqw",
                    background: STORY_PALETTE.ink,
                    color: STORY_PALETTE.cream,
                    padding: "3cqw 5cqw 3.6cqw",
                    clipPath: BUBBLE_SMALL,
                  }}
                >
                  {viz.result}
                </div>
              )}
            </div>
          )}

          {isSources && viz.url && (
            <div style={{ fontWeight: 600, fontSize: "3.2cqw", lineHeight: 1.5, wordBreak: "break-word" }}>
              <div style={{ color: s.accent }}>{viz.label}</div>
              <div style={{ opacity: 0.85 }}>{viz.url}</div>
            </div>
          )}
        </div>

        {/* Wortmarke */}
        <div style={{ textAlign: "center", paddingBottom: "5cqw" }}>
          <span style={{ fontFamily: STORY_SERIF, fontWeight: 600, fontSize: "3.2cqw" }}>
            politikradar
            <span style={{ color: s.accent }}>.</span>
          </span>
        </div>
      </div>
    );
  },
);

SlideCard.displayName = "SlideCard";

export default SlideCard;
