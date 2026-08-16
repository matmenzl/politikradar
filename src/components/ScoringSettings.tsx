import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, RotateCcw, SlidersHorizontal } from "lucide-react";
import {
  DEFAULT_SCORING,
  FACTOR_INFO,
  loadScoringConfig,
  saveScoringConfig,
  weightShare,
  weightedScore,
  type ScoringConfig,
  type WeightMap,
} from "@/lib/scoring";

interface Props {
  onSaved?: (config: ScoringConfig) => void;
}

const ScoringSettings = ({ onSaved }: Props) => {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<ScoringConfig>(DEFAULT_SCORING);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) loadScoringConfig().then(setConfig);
  }, [open]);

  const setWeight = (group: "relevance_weights" | "social_weights", key: string, value: number) =>
    setConfig((c) => ({ ...c, [group]: { ...c[group], [key]: value } }));

  const save = async () => {
    setSaving(true);
    const { error } = await saveScoringConfig(config);
    if (error) {
      setSaving(false);
      return toast.error("Kriterien konnten nicht gespeichert werden.");
    }

    // Bereits bewertete Ereignisse mit den neuen Gewichten neu berechnen —
    // ohne erneuten KI-Aufruf, direkt aus den gespeicherten Faktoren.
    const { data } = await supabase
      .from("events")
      .select("id, score_factors")
      .not("political_relevance", "is", null)
      .neq("selection_status", "excluded")
      .limit(1000);

    let recalculated = 0;
    for (const row of data || []) {
      const factors = (row.score_factors || {}) as Record<string, unknown>;
      if (typeof factors.decision_impact !== "number") continue;
      await supabase
        .from("events")
        .update({
          political_relevance: weightedScore(factors, config.relevance_weights),
          social_potential: weightedScore(factors, config.social_weights),
        })
        .eq("id", row.id);
      recalculated++;
    }

    setSaving(false);
    setOpen(false);
    toast.success(`Kriterien gespeichert – ${recalculated} Ereignisse neu berechnet.`);
    onSaved?.(config);
  };

  const renderGroup = (
    group: "relevance_weights" | "social_weights",
    title: string,
    description: string,
  ) => {
    const weights: WeightMap = config[group];
    return (
      <div className="space-y-3">
        <div>
          <h3 className="font-serif text-lg text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="space-y-2">
          {Object.keys(weights).map((key) => (
            <div key={key} className="flex items-start gap-3 border-b border-border/60 pb-2">
              <div className="flex-1">
                <p className="text-sm text-foreground">{FACTOR_INFO[key]?.label ?? key}</p>
                <p className="text-xs text-muted-foreground">{FACTOR_INFO[key]?.hint}</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={weights[key]}
                  onChange={(e) => setWeight(group, key, Number(e.target.value))}
                  className="w-20 num"
                />
                <span className="w-12 text-right text-xs num text-muted-foreground">
                  {weightShare(weights, key)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <SlidersHorizontal className="w-4 h-4" />
          Kriterien
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">Bewertungskriterien</DialogTitle>
          <DialogDescription>
            Die KI bewertet jedes Ereignis pro Faktor mit 0–100. Aus diesen Faktoren werden mit den
            unten definierten Gewichten die Werte für Relevanz und Social-Potenzial berechnet. Beim
            Speichern werden bereits bewertete Ereignisse neu berechnet – ohne neuen KI-Aufruf.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {renderGroup(
            "relevance_weights",
            "Politische Relevanz",
            "Wie wichtig ist das Ereignis politisch?",
          )}
          {renderGroup(
            "social_weights",
            "Social-Potenzial",
            "Wie gut funktioniert das Ereignis als Social-Media-Story?",
          )}

          <div className="space-y-3">
            <div>
              <h3 className="font-serif text-lg text-foreground">Schwellenwerte</h3>
              <p className="text-xs text-muted-foreground">
                Ab wann gilt ein Ereignis als Top Story bzw. als prüfenswert?
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="text-xs kicker text-muted-foreground flex flex-col gap-1">
                Top Story ab (Relevanz und Social)
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={config.thresholds.top_story}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      thresholds: { ...c.thresholds, top_story: Number(e.target.value) },
                    }))
                  }
                  className="w-28 num"
                />
              </label>
              <label className="text-xs kicker text-muted-foreground flex flex-col gap-1">
                Prüfen ab (Relevanz oder Social)
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={config.thresholds.review}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      thresholds: { ...c.thresholds, review: Number(e.target.value) },
                    }))
                  }
                  className="w-28 num"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-wrap justify-between gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setConfig(DEFAULT_SCORING)}>
              <RotateCcw className="w-4 h-4" />
              Standardwerte
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Speichern & neu berechnen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScoringSettings;
