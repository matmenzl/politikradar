import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Calendar, TrendingUp, Zap, Lightbulb } from "lucide-react";
import { getCurrentISOWeek, getWeekDateRange } from "@/lib/api/openparldata";
import { useRangeItems } from "@/hooks/use-range-items";
import { createStoryDraft, type SearchResult } from "@/components/admin/shared";

interface AISuggestion {
  index: number;
  score: number;
  reason: string;
  hook_idea: string;
}

interface SuggestableItem extends SearchResult {
  bodyName: string;
}

const AiAnalysisSection = () => {
  const defaultRange = useMemo(() => {
    const { year, week } = getCurrentISOWeek();
    const current = getWeekDateRange(year, week);
    const prevWeekNum = week > 1 ? week - 1 : 52;
    const prevYear = week > 1 ? year : year - 1;
    const prev = getWeekDateRange(prevYear, prevWeekNum);
    return { from: prev.from, to: current.to };
  }, []);

  const [dateFrom, setDateFrom] = useState(defaultRange.from);
  const [dateTo, setDateTo] = useState(defaultRange.to);
  const [range, setRange] = useState(defaultRange);

  const { affairs, votings, loading: loadingData } = useRangeItems(range.from, range.to);

  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [items, setItems] = useState<SuggestableItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const rangeDirty = dateFrom !== range.from || dateTo !== range.to;

  const generateSuggestions = async () => {
    const combined: SuggestableItem[] = [];
    for (const v of votings) {
      combined.push({
        id: v.id,
        title: v.affair_title_de || v.title_de || `#${v.id}`,
        bodyKey: v.body_key,
        bodyName: v.bodyName,
        type: "voting",
        date: v.date,
        results_yes: v.results_yes,
        results_no: v.results_no,
      });
    }
    for (const a of affairs) {
      combined.push({
        id: a.id,
        title: a.title_de || `#${a.id}`,
        bodyKey: a.body_key,
        bodyName: a.bodyName,
        type: "affair",
        date: a.begin_date,
        status: a.status_de,
      });
    }

    if (combined.length === 0) {
      toast.error("Keine Geschäfte oder Abstimmungen im gewählten Zeitraum. Passe den Datums-Bereich an.");
      return;
    }

    setLoading(true);
    setSuggestions([]);
    const subset = combined.slice(0, 50);
    setItems(subset);

    try {
      const { data, error } = await supabase.functions.invoke("suggest-stories", {
        body: { items: subset },
      });
      if (error) throw error;
      if (data?.suggestions) {
        const sorted = [...data.suggestions].sort(
          (a: AISuggestion, b: AISuggestion) => b.score - a.score
        );
        setSuggestions(sorted);
      }
    } catch (e: any) {
      toast.error(e.message || "Fehler bei KI-Analyse");
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  };

  const handleGenerate = async (item: SuggestableItem) => {
    const key = `${item.type}-${item.id}`;
    setGeneratingId(key);
    try {
      await createStoryDraft(item);
    } catch (e: any) {
      toast.error(e.message || "Fehler beim Generieren");
    } finally {
      setGeneratingId(null);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 8) return "bg-success/15 text-success border-success/30";
    if (score >= 6) return "bg-accent/15 text-accent border-accent/30";
    return "bg-muted text-muted-foreground border-border";
  };

  const totalItems = affairs.length + votings.length;
  const step1Done = !loadingData && !rangeDirty && totalItems > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-accent" />
          <CardTitle className="font-serif text-xl">KI-Vorschläge</CardTitle>
        </div>
        <CardDescription>
          In zwei Schritten: zuerst den Zeitraum laden, danach die KI analysieren lassen.
        </CardDescription>

        {/* Schritt 1 */}
        <div className="mt-4 rounded-lg border border-border/60 p-3">
          <div className="flex items-center gap-2 mb-3">
            <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold ${step1Done ? "bg-success/20 text-success" : "bg-accent/15 text-accent"}`}>
              {step1Done ? <Check className="w-3 h-3" /> : "1"}
            </span>
            <span className="text-sm font-medium">Zeitraum wählen & Daten laden</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end gap-2">
            <div className="flex-1 min-w-[130px]">
              <label className="text-xs text-muted-foreground mb-1 block">Von</label>
              <Input
                type="date"
                value={dateFrom}
                max={dateTo}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex-1 min-w-[130px]">
              <label className="text-xs text-muted-foreground mb-1 block">Bis</label>
              <Input
                type="date"
                value={dateTo}
                min={dateFrom}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={rangeDirty ? "default" : "secondary"}
                size="sm"
                className="h-9 gap-1.5"
                disabled={!rangeDirty || !dateFrom || !dateTo || dateFrom > dateTo}
                onClick={() => {
                  setRange({ from: dateFrom, to: dateTo });
                  setSuggestions([]);
                  setHasLoaded(false);
                }}
              >
                <Calendar className="w-3.5 h-3.5" />
                Zeitraum laden
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9"
                onClick={() => {
                  setDateFrom(defaultRange.from);
                  setDateTo(defaultRange.to);
                  setRange(defaultRange);
                  setSuggestions([]);
                  setHasLoaded(false);
                }}
              >
                Zurücksetzen
              </Button>
            </div>
          </div>

          {loadingData ? (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" /> Daten werden geladen…
            </p>
          ) : rangeDirty ? (
            <p className="text-xs text-accent mt-2">
              Zeitraum geändert – klicke «Zeitraum laden», um die Daten zu aktualisieren.
            </p>
          ) : totalItems === 0 ? (
            <p className="text-xs text-destructive mt-2">
              Keine Daten in diesem Zeitraum. Wähle einen anderen Bereich.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-2">
              Geladen: {affairs.length} Geschäfte · {votings.length} Abstimmungen
            </p>
          )}
        </div>

        {/* Schritt 2 */}
        <div className="mt-3 rounded-lg border border-border/60 p-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold ${step1Done ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}>
                2
              </span>
              <div>
                <span className={`text-sm font-medium ${step1Done ? "" : "text-muted-foreground"}`}>
                  KI-Analyse starten
                </span>
                <p className="text-xs text-muted-foreground">
                  {step1Done
                    ? `Analysiert ${Math.min(totalItems, 50)} Einträge nach Social-Media-Potenzial`
                    : "Zuerst Schritt 1 abschliessen"}
                </p>
              </div>
            </div>
            <Button onClick={generateSuggestions} disabled={loading || !step1Done} size="sm" className="gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {hasLoaded ? "Neu analysieren" : "Analysieren"}
            </Button>
          </div>
        </div>
      </CardHeader>


      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
            <span className="text-sm text-muted-foreground">KI analysiert {items.length} Geschäfte…</span>
          </div>
        ) : !hasLoaded ? (
          <div className="text-center py-8">
            <Lightbulb className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Klicke «Analysieren», um die besten Geschäfte für Social Media zu finden.
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Kriterien: Knappe Abstimmungen, kontroverse Themen, Alltagsrelevanz
            </p>
          </div>
        ) : suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Keine Vorschläge generiert.</p>
        ) : (
          <div className="space-y-3">
            {suggestions.map((s, idx) => {
              const item = items[s.index - 1];
              if (!item) return null;
              const key = `${item.type}-${item.id}`;
              return (
                <div key={idx} className="p-3 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border text-sm font-bold ${scoreColor(s.score)}`}>
                      {s.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-2">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">{item.bodyName}</Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {item.type === "voting" ? "Abstimmung" : "Geschäft"}
                        </Badge>
                        {item.results_yes != null && item.results_no != null && (
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {item.results_yes}:{item.results_no}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{s.reason}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Lightbulb className="w-3 h-3 text-accent shrink-0" />
                        <span className="text-xs text-accent font-medium italic">«{s.hook_idea}»</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="shrink-0 h-8 gap-1"
                      disabled={generatingId === key}
                      onClick={() => handleGenerate(item)}
                    >
                      {generatingId === key ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span className="hidden sm:inline">Story</span>
                    </Button>
                  </div>
                </div>
              );
            })}
            <p className="text-[10px] text-muted-foreground text-center opacity-70 mt-2">
              Erstellt mit KI · Vorschläge basieren auf Titel und Abstimmungsdaten
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AiAnalysisSection;
