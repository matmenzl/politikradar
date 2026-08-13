// Formular-Editor für das Feed-Karussell (4:5) statt rohem JSON.
// Links: Felder pro Slide, rechts: Live-Vorschau der Kachel.
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, Plus, Trash2, Wand2 } from "lucide-react";
import CarouselSlideCard, { type CarouselSlide } from "@/components/story/CarouselSlideCard";
import type { StorySlide } from "@/components/StoryPreviewModal";

const SLIDE_TYPES: { value: CarouselSlide["slide_type"]; label: string; hint: string }[] = [
  { value: "cover", label: "Cover", hint: "Auftakt-Kachel mit grosser Headline" },
  { value: "detail", label: "Detail", hint: "Erklärtext, optional mit Hashtags" },
  { value: "result", label: "Resultat", hint: "Abstimmungsergebnis mit Ja/Nein/Enthaltung" },
  { value: "cta", label: "Call-to-Action", hint: "Abschluss mit Handlungsaufruf" },
];

function emptySlide(type: CarouselSlide["slide_type"]): CarouselSlide {
  switch (type) {
    case "result":
      return { slide_type: "result", headline: "", votes: { yes: 0, no: 0, abstain: 0 }, status: "angenommen" };
    case "cta":
      return { slide_type: "cta", headline: "", cta_label: "politikradar.ch → Story lesen" };
    case "detail":
      return { slide_type: "detail", headline: "", body: "", hashtags: [] };
    default:
      return { slide_type: "cover", headline: "", kicker: "" };
  }
}

/** Erzeugt aus den Story-Slides einen sinnvollen Karussell-Vorschlag. */
export function buildFeedFromStory(title: string, slides: StorySlide[]): CarouselSlide[] {
  const out: CarouselSlide[] = [];
  const hook = slides.find((s) => s.slide_type === "hook");
  out.push({ slide_type: "cover", headline: hook?.headline || title, kicker: hook?.body ? undefined : "politikradar" });
  const context = slides.filter((s) => s.slide_type === "context" || s.slide_type === "insight").slice(0, 2);
  context.forEach((s) => out.push({ slide_type: "detail", headline: s.headline, body: s.body }));
  const result = slides.find((s) => s.slide_type === "result");
  if (result) out.push({ slide_type: "result", headline: result.headline, body: result.body });
  const cta = slides.find((s) => s.slide_type === "cta");
  out.push({
    slide_type: "cta",
    headline: cta?.headline || "Jede Woche, alle Parlamente.",
    body: cta?.body,
    cta_label: "politikradar.ch → Story lesen",
  });
  return out;
}

interface Props {
  slides: CarouselSlide[];
  onChange: (slides: CarouselSlide[]) => void;
  storyTitle: string;
  storySlides: StorySlide[];
}

const FeedCarouselEditor = ({ slides, onChange, storyTitle, storySlides }: Props) => {
  const [active, setActive] = useState(0);
  const current = slides[active];
  const typeHint = useMemo(
    () => SLIDE_TYPES.find((t) => t.value === current?.slide_type)?.hint ?? "",
    [current],
  );

  const patch = (p: Partial<CarouselSlide>) =>
    onChange(slides.map((s, i) => (i === active ? { ...s, ...p } : s)));

  const addSlide = () => {
    onChange([...slides, emptySlide("detail")]);
    setActive(slides.length);
  };

  const removeSlide = (i: number) => {
    onChange(slides.filter((_, j) => j !== i));
    setActive((a) => Math.max(0, Math.min(a, slides.length - 2)));
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= slides.length) return;
    const next = [...slides];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    setActive(j);
  };

  if (slides.length === 0) {
    return (
      <div className="text-center py-10 space-y-4">
        <p className="text-sm text-muted-foreground">
          Für diese Story gibt es noch keine Feed-Kacheln (Instagram-Karussell, Format 4:5).
        </p>
        <div className="flex justify-center gap-2">
          <Button onClick={() => onChange(buildFeedFromStory(storyTitle, storySlides))} className="gap-1.5">
            <Wand2 className="w-4 h-4" />
            Aus Story erzeugen
          </Button>
          <Button variant="outline" onClick={() => onChange([emptySlide("cover")])} className="gap-1.5">
            <Plus className="w-4 h-4" />
            Leere Kachel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-[1fr_220px]">
      <div className="space-y-4">
        {/* Kachel-Auswahl */}
        <div className="flex flex-wrap gap-1.5">
          {slides.map((s, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`px-2.5 py-1 text-xs border transition-colors ${
                i === active
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {i + 1} · {SLIDE_TYPES.find((t) => t.value === s.slide_type)?.label ?? s.slide_type}
            </button>
          ))}
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={addSlide}>
            <Plus className="w-3.5 h-3.5" />
            Kachel
          </Button>
        </div>

        {current && (
          <div className="space-y-3 border border-border/60 p-3">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Typ</Label>
                <Select
                  value={current.slide_type}
                  onValueChange={(v) =>
                    patch({ ...emptySlide(v as CarouselSlide["slide_type"]), headline: current.headline })
                  }
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SLIDE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-1 pb-0.5">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(active, -1)} title="Nach vorne">
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(active, 1)} title="Nach hinten">
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => removeSlide(active)}
                  title="Kachel löschen"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{typeHint}</p>

            <div>
              <Label className="text-xs text-muted-foreground">Kicker (kleine Zeile oben)</Label>
              <Input
                value={current.kicker ?? ""}
                onChange={(e) => patch({ kicker: e.target.value })}
                placeholder="Motion 24.3012 · Nationalrat"
                className="h-9 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">
                Headline · <span className="font-mono">**Text**</span> hebt Wörter hervor
              </Label>
              <Textarea
                value={current.headline}
                onChange={(e) => patch({ headline: e.target.value })}
                rows={2}
                placeholder="Wer lobbyiert da eigentlich im **Bundeshaus**?"
                className="text-sm"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">
                Fliesstext (in «Anführungszeichen» wird daraus ein Zitat)
              </Label>
              <Textarea
                value={current.body ?? ""}
                onChange={(e) => patch({ body: e.target.value })}
                rows={3}
                className="text-sm"
              />
            </div>

            {current.slide_type === "detail" && (
              <div>
                <Label className="text-xs text-muted-foreground">Hashtags (Komma-getrennt, ohne #)</Label>
                <Input
                  value={(current.hashtags ?? []).join(", ")}
                  onChange={(e) =>
                    patch({
                      hashtags: e.target.value
                        .split(",")
                        .map((h) => h.trim().replace(/^#/, ""))
                        .filter(Boolean),
                    })
                  }
                  placeholder="lobbying, transparenz"
                  className="h-9 text-sm"
                />
              </div>
            )}

            {current.slide_type === "result" && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {(["yes", "no", "abstain"] as const).map((k) => (
                    <div key={k}>
                      <Label className="text-xs text-muted-foreground">
                        {k === "yes" ? "Ja" : k === "no" ? "Nein" : "Enthaltung"}
                      </Label>
                      <Input
                        type="number"
                        value={current.votes?.[k] ?? 0}
                        onChange={(e) =>
                          patch({
                            votes: {
                              yes: current.votes?.yes ?? 0,
                              no: current.votes?.no ?? 0,
                              abstain: current.votes?.abstain ?? 0,
                              [k]: Number(e.target.value) || 0,
                            },
                          })
                        }
                        className="h-9 text-sm"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Ergebnis</Label>
                  <Select
                    value={current.status ?? "angenommen"}
                    onValueChange={(v) => patch({ status: v as CarouselSlide["status"] })}
                  >
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="angenommen">angenommen</SelectItem>
                      <SelectItem value="abgelehnt">abgelehnt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {current.slide_type === "cta" && (
              <div>
                <Label className="text-xs text-muted-foreground">Button-Text</Label>
                <Input
                  value={current.cta_label ?? ""}
                  onChange={(e) => patch({ cta_label: e.target.value })}
                  placeholder="politikradar.ch → Story lesen"
                  className="h-9 text-sm"
                />
              </div>
            )}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => onChange(buildFeedFromStory(storyTitle, storySlides))}
        >
          <Wand2 className="w-3.5 h-3.5" />
          Neu aus Story erzeugen (überschreibt)
        </Button>
      </div>

      {/* Live-Vorschau */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Vorschau (4:5)</p>
        {current && (
          <CarouselSlideCard slide={current} index={active} total={slides.length} />
        )}
      </div>
    </div>
  );
};

export default FeedCarouselEditor;
