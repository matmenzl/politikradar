import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Copy, Eye, EyeOff, Wand2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import type { StorySlide } from "../StoryPreviewModal";
import {
  POLLINATIONS_STYLES,
  PROMPT_SNIPPETS,
  composePrompt,
  fallbackImagePrompt,
  getStyle,
  randomSeed,
} from "@/lib/pollinations";

interface Props {
  slide: StorySlide;
  index: number;
  onChange: (patch: Partial<StorySlide>) => void;
  onApplyStyleToAll?: (style: string) => void;
}

const ImagePromptEditor = ({ slide, index, onChange, onApplyStyleToAll }: Props) => {
  const [showFull, setShowFull] = useState(false);

  const effectivePrompt =
    slide.image_prompt?.trim() || fallbackImagePrompt(slide.headline, slide.slide_type);

  const fullPrompt = useMemo(
    () => composePrompt(effectivePrompt, slide.image_style, slide.image_negative),
    [effectivePrompt, slide.image_style, slide.image_negative],
  );

  const regenerate = () => {
    onChange({ image_seed: randomSeed(), image_url: undefined });
    toast.info(`Neues Bild für Slide ${index + 1} wird generiert…`);
  };

  const appendSnippet = (value: string) => {
    const base = slide.image_prompt?.trim() ?? "";
    onChange({
      image_prompt: base ? `${base}, ${value}` : value,
      image_url: undefined,
    });
  };

  return (
    <div className="space-y-2 rounded-lg border border-border/50 p-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] kicker text-muted-foreground">Bild-Prompt</label>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">Bild</span>
          <Switch
            checked={slide.image_enabled ?? slide.slide_type === "hook"}
            onCheckedChange={(v) => onChange({ image_enabled: v })}
          />
        </div>
      </div>

      <Textarea
        value={slide.image_prompt ?? ""}
        placeholder={fallbackImagePrompt(slide.headline, slide.slide_type)}
        onChange={(e) => onChange({ image_prompt: e.target.value, image_url: undefined })}
        className="text-xs min-h-[68px]"
      />

      {/* Motiv-Bausteine */}
      <div className="flex flex-wrap gap-1">
        {PROMPT_SNIPPETS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => appendSnippet(s.value)}
            className="text-[10px] px-1.5 py-0.5 border border-border/60 text-muted-foreground hover:bg-muted transition-colors"
          >
            + {s.label}
          </button>
        ))}
      </div>

      {/* Stil */}
      <div className="space-y-1">
        <label className="text-[10px] kicker text-muted-foreground">Stil</label>
        <Select
          value={getStyle(slide.image_style).id}
          onValueChange={(v) => onChange({ image_style: v, image_url: undefined })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {POLLINATIONS_STYLES.map((s) => (
              <SelectItem key={s.id} value={s.id} className="text-xs">
                {s.label} — {s.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {onApplyStyleToAll && (
          <button
            type="button"
            className="text-[10px] text-muted-foreground underline underline-offset-2"
            onClick={() => {
              onApplyStyleToAll(getStyle(slide.image_style).id);
              toast.success("Stil auf alle Slides übertragen");
            }}
          >
            Stil auf alle Slides anwenden
          </button>
        )}
      </div>

      {/* Negativ-Prompt + Seed */}
      <div className="grid grid-cols-2 gap-1.5">
        <div className="space-y-1">
          <label className="text-[10px] kicker text-muted-foreground">Vermeiden</label>
          <Input
            value={slide.image_negative ?? ""}
            placeholder="z. B. Personen"
            onChange={(e) => onChange({ image_negative: e.target.value, image_url: undefined })}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] kicker text-muted-foreground">Seed</label>
          <Input
            type="number"
            value={slide.image_seed ?? ""}
            placeholder="zufällig"
            onChange={(e) =>
              onChange({
                image_seed: e.target.value ? Number(e.target.value) : undefined,
                image_url: undefined,
              })
            }
            className="h-8 text-xs tabular-nums"
          />
        </div>
      </div>

      <div className="flex gap-1.5">
        <Button variant="secondary" size="sm" className="flex-1 gap-1.5 text-xs" onClick={regenerate}>
          <RefreshCw className="w-3.5 h-3.5" />
          Neues Bild
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          title="Prompt aus Slide-Inhalt vorschlagen"
          onClick={() => {
            onChange({
              image_prompt: fallbackImagePrompt(slide.headline, slide.slide_type),
              image_url: undefined,
            });
            toast.info("Prompt aus Slide-Inhalt erzeugt");
          }}
        >
          <Wand2 className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          title="Prompt zurücksetzen"
          onClick={() =>
            onChange({
              image_prompt: undefined,
              image_negative: undefined,
              image_style: undefined,
              image_seed: undefined,
              image_url: undefined,
            })
          }
        >
          <Undo2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Vollständiger Prompt */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-[10px] text-muted-foreground flex items-center gap-1"
            onClick={() => setShowFull((v) => !v)}
          >
            {showFull ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            Vollständiger Prompt
          </button>
          <button
            type="button"
            className="text-[10px] text-muted-foreground flex items-center gap-1"
            onClick={() => {
              navigator.clipboard.writeText(fullPrompt);
              toast.success("Prompt kopiert");
            }}
          >
            <Copy className="w-3 h-3" />
            Kopieren
          </button>
        </div>
        {showFull && (
          <p className="text-[10px] leading-snug text-muted-foreground break-words bg-muted/40 p-1.5">
            {fullPrompt}
          </p>
        )}
      </div>
    </div>
  );
};

export default ImagePromptEditor;
