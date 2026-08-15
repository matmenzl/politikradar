import { forwardRef } from "react";
import { BRAND, SERIF, SANS } from "@/lib/storyTheme";
import type { SlideRow } from "@/lib/mvp";

interface VoteViz {
  type?: string;
  yes?: number;
  no?: number;
  abstention?: number;
  result?: string;
  url?: string | null;
  label?: string;
}

/** Fixed 9:16 MVP slide layout — plain, source-bound, no variants. */
const SlideCard = forwardRef<HTMLDivElement, { slide: SlideRow; index: number; total: number }>(
  ({ slide, index, total }, ref) => {
    const viz = (slide.visualization || {}) as VoteViz;
    const isVote = viz.type === "vote";
    const isSources = viz.type === "sources";
    const accent = index === 0 ? BRAND.red : BRAND.blue;

    return (
      <div
        ref={ref}
        style={{
          position: "relative",
          aspectRatio: "9 / 16",
          width: "100%",
          background: BRAND.paperLight,
          color: BRAND.ink,
          padding: "7% 7% 9%",
          display: "flex",
          flexDirection: "column",
          gap: "4%",
          containerType: "inline-size",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: "3.4cqw",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: accent,
          }}
        >
          politikradar · {index + 1}/{total}
        </div>

        <h2 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "9cqw", lineHeight: 1.05, margin: 0 }}>
          {slide.headline}
        </h2>

        {slide.body && (
          <p style={{ fontFamily: SANS, fontWeight: 500, fontSize: "4.6cqw", lineHeight: 1.4, margin: 0 }}>
            {slide.body}
          </p>
        )}

        {isVote && (
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "2.5cqw" }}>
            {[
              { label: "Ja", value: viz.yes ?? 0, color: BRAND.green },
              { label: "Nein", value: viz.no ?? 0, color: BRAND.red },
              { label: "Enthaltungen", value: viz.abstention ?? 0, color: BRAND.hairline },
            ].map((row) => {
              const max = Math.max(viz.yes ?? 0, viz.no ?? 0, viz.abstention ?? 0, 1);
              return (
                <div key={row.label}>
                  <div
                    style={{
                      fontFamily: SANS,
                      fontWeight: 700,
                      fontSize: "3.8cqw",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{row.label}</span>
                    <span>{row.value}</span>
                  </div>
                  <div style={{ height: "3cqw", background: BRAND.hairline }}>
                    <div style={{ height: "100%", width: `${(row.value / max) * 100}%`, background: row.color }} />
                  </div>
                </div>
              );
            })}
            {viz.result && (
              <div
                style={{
                  fontFamily: SANS,
                  fontWeight: 800,
                  fontSize: "4.4cqw",
                  background: BRAND.ink,
                  color: BRAND.paperLight,
                  padding: "2.5cqw 4cqw",
                  alignSelf: "flex-start",
                }}
              >
                {viz.result}
              </div>
            )}
          </div>
        )}

        {isSources && viz.url && (
          <div style={{ marginTop: "auto", fontFamily: SANS, fontWeight: 600, fontSize: "3.4cqw", wordBreak: "break-all" }}>
            {viz.label}
            <br />
            {viz.url}
          </div>
        )}

        <div
          style={{
            marginTop: isVote || isSources ? "4cqw" : "auto",
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: "3.2cqw",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: BRAND.ink,
            opacity: 0.6,
          }}
        >
          Quelle: offizielle Parlamentsdaten
        </div>
      </div>
    );
  },
);

SlideCard.displayName = "SlideCard";

export default SlideCard;
