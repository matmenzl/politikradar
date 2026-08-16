import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ExternalLink, Info, Loader2, RefreshCw, Sparkles } from "lucide-react";
import ScoringSettings from "@/components/ScoringSettings";
import {
  DEFAULT_SCORING,
  FACTOR_INFO,
  loadScoringConfig,
  weightShare,
  type ScoringConfig,
} from "@/lib/scoring";
import {
  LEVEL_LABELS,
  PRIORITY_LABELS,
  isoDate,
  priorityOf,
  type EventRow,
  type Priority,
} from "@/lib/mvp";

const Radar = () => {
  const navigate = useNavigate();
  const [from, setFrom] = useState(isoDate(-14));
  const [to, setTo] = useState(isoDate(0));
  const [events, setEvents] = useState<EventRow[]>([]);
  const [sources, setSources] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"idle" | "detecting" | "scoring">("idle");
  const busy = step !== "idle";
  const [scoring, setScoringConfig] = useState<ScoringConfig>(DEFAULT_SCORING);


  const [generating, setGenerating] = useState<string | null>(null);
  const [level, setLevel] = useState("all");
  const [parliament, setParliament] = useState("all");
  const [sort, setSort] = useState("relevance");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .gte("event_date", from)
      .lte("event_date", to)
      .neq("selection_status", "rejected")
      .order("event_date", { ascending: false })
      .limit(500);
    if (error) {
      toast.error("Ereignisse konnten nicht geladen werden.");
    } else {
      const rows = (data || []) as unknown as EventRow[];
      setEvents(rows);
      const ids = [...new Set(rows.map((e) => e.source_id).filter(Boolean))] as string[];
      if (ids.length) {
        const { data: srcs } = await supabase.from("sources").select("id, url").in("id", ids);
        setSources(Object.fromEntries((srcs || []).map((s) => [s.id, s.url || ""])));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadScoringConfig().then(setScoringConfig);
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const detect = async () => {
    setStep("detecting");
    const { data, error } = await supabase.functions.invoke("detect-events", { body: { from, to } });
    setStep("idle");
    if (error || data?.error) return toast.error(data?.error || "Ereignis-Erkennung fehlgeschlagen.");
    toast.success(`${data.inserted} neue Ereignisse erkannt (${data.skipped} bereits vorhanden).`);
    load();
  };

  const refreshAndScore = async () => {
    setStep("detecting");
    const detectRes = await supabase.functions.invoke("detect-events", { body: { from, to } });
    const detectFailed = detectRes.error || detectRes.data?.error;
    if (detectFailed) {
      toast.warning("OpenParl-Daten konnten nicht geladen werden – bewerte vorhandene Ereignisse.");
    }

    setStep("scoring");
    const { data, error } = await supabase.functions.invoke("score-events", { body: { from, to } });
    setStep("idle");
    if (error || data?.error) return toast.error(data?.error || "Bewertung fehlgeschlagen.");
    const inserted = detectFailed ? 0 : (detectRes.data?.inserted ?? 0);
    toast.success(
      `${inserted} neue Ereignisse geladen, ${data.scored} bewertet, ${data.excluded} ausgeschlossen.`,
    );
    load();
  };


  const createStory = async (event: EventRow) => {
    setGenerating(event.id);
    const { data, error } = await supabase.functions.invoke("generate-story", { body: { event_id: event.id } });
    setGenerating(null);
    if (error || data?.error) return toast.error(data?.error || "Story konnte nicht erstellt werden.");
    navigate(`/story/${data.story_id}`);
  };

  const reject = async (event: EventRow) => {
    await supabase.from("events").update({ selection_status: "rejected" }).eq("id", event.id);
    setEvents((prev) => prev.filter((e) => e.id !== event.id));
  };

  const parliaments = useMemo(
    () => [...new Set(events.map((e) => e.parliament))].sort(),
    [events],
  );


  const filtered = useMemo(() => {
    const list = events.filter(
      (e) =>
        (level === "all" || e.political_level === level) &&
        (parliament === "all" || e.parliament === parliament),
    );
    return list.sort((a, b) => {
      if (sort === "date") return b.event_date.localeCompare(a.event_date);
      if (sort === "social") return (b.social_potential ?? -1) - (a.social_potential ?? -1);
      return (b.political_relevance ?? -1) - (a.political_relevance ?? -1);
    });
  }, [events, level, parliament, sort]);

  const groups: Record<Priority | "excluded", EventRow[]> = {
    top: [],
    review: [],
    low: [],
    excluded: [],
  };
  for (const e of filtered) {
    if (e.selection_status === "excluded") groups.excluded.push(e);
    else if (e.political_relevance === null) groups.low.push(e);
    else groups[priorityOf(e, scoring.thresholds)].push(e);
  }

  const renderFactorGroup = (
    e: EventRow,
    group: "relevance_weights" | "social_weights",
    title: string,
  ) => {
    const weights = scoring[group];
    return (
      <div className="space-y-1">
        <p className="text-xs kicker text-muted-foreground">{title}</p>
        {Object.keys(weights).map((k) => {
          const value = e.score_factors?.[k];
          if (typeof value !== "number") return null;
          return (
            <div key={k} className="flex items-center gap-2 text-xs">
              <span className="flex-1 text-muted-foreground" title={FACTOR_INFO[k]?.hint}>
                {FACTOR_INFO[k]?.label ?? k}
              </span>
              <span className="w-10 text-right num text-muted-foreground">
                {weightShare(weights, k)}%
              </span>
              <div className="w-20 h-1.5 bg-muted">
                <div className="h-full bg-foreground" style={{ width: `${value}%` }} />
              </div>
              <span className="w-8 text-right num">{value}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderEvent = (e: EventRow) => (
    <AccordionItem key={e.id} value={e.id} className="border border-border bg-card px-4">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex-1 text-left space-y-1 pr-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="kicker">{e.parliament}</span>
            <span>· {LEVEL_LABELS[e.political_level] || e.political_level}</span>
            <span>· {e.event_date}</span>
            <span>· {e.event_type === "voting" ? "Abstimmung" : "Geschäft"}</span>
          </div>
          <p className="font-serif text-base text-foreground">{e.title}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            {e.political_relevance !== null ? (
              <>
                <Badge variant="secondary">Relevanz {e.political_relevance}</Badge>
                <Badge variant="secondary">Social {e.social_potential}</Badge>
                <Badge variant="outline">Confidence {e.editorial_confidence}</Badge>
              </>
            ) : (
              <Badge variant="outline">Noch nicht bewertet</Badge>
            )}
            {e.exclusion_reason && <Badge variant="destructive">{e.exclusion_reason}</Badge>}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pb-4">
        {e.description && <p className="text-sm text-muted-foreground">{e.description}</p>}
        {typeof e.score_factors?.rationale === "string" && (
          <p className="text-sm text-foreground">{e.score_factors.rationale as string}</p>
        )}
        {e.political_relevance !== null && (
          <div className="grid gap-4 md:grid-cols-2">
            {renderFactorGroup(e, "relevance_weights", `Politische Relevanz ${e.political_relevance}`)}
            {renderFactorGroup(e, "social_weights", `Social-Potenzial ${e.social_potential}`)}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => createStory(e)} disabled={generating === e.id}>
            {generating === e.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Story erstellen
          </Button>
          <Button size="sm" variant="outline" onClick={() => reject(e)}>
            Ablehnen
          </Button>
          {e.source_id && sources[e.source_id] && (
            <Button size="sm" variant="ghost" asChild>
              <a href={sources[e.source_id]} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Quelle öffnen
              </a>
            </Button>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <span className="text-xs kicker text-muted-foreground">Selection Engine</span>
          <h1 className="font-serif text-3xl text-foreground">Radar</h1>
          <p className="text-sm text-muted-foreground mt-1">Weniger Recherche, mehr relevante Politik-Storys.</p>
        </div>

        <div className="flex flex-wrap items-end gap-3 border border-border bg-card p-4">
          <label className="text-xs kicker text-muted-foreground flex flex-col gap-1">
            Von
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
          </label>
          <label className="text-xs kicker text-muted-foreground flex flex-col gap-1">
            Bis
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
          </label>
          <Button onClick={refreshAndScore} disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {step === "detecting"
              ? "Daten laden…"
              : step === "scoring"
                ? "Bewerten…"
                : "Ereignisse bewerten"}
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Mehr zur Bewertung">
                <Info className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" className="max-w-xs">
              <p>
                Lädt zuerst Geschäfte und Abstimmungen aus OpenParlData für den gewählten Zeitraum und bewertet sie danach per KI: 11 Faktoren (z. B. Entscheidwirkung, Reichweite, Emotionaler Aufhänger) ergeben Political Relevance, Social Potential und Editorial Confidence.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Die Kriterien können unter „Kriterien“ angepasst werden.
              </p>
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="sm" onClick={detect} disabled={busy}>
            <RefreshCw className="w-4 h-4" />
            Nur Daten laden
          </Button>
          <ScoringSettings onSaved={(c) => { setScoringConfig(c); load(); }} />

        </div>

        <div className="flex flex-wrap gap-3">
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Ebene" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Ebenen</SelectItem>
              {Object.entries(LEVEL_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={parliament} onValueChange={setParliament}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Parlament" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Parlamente</SelectItem>
              {parliaments.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Sortierung" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Nach Relevanz</SelectItem>
              <SelectItem value="social">Nach Social-Potenzial</SelectItem>
              <SelectItem value="date">Nach Datum</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Lade Ereignisse…</p>}
        {!loading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Keine Ereignisse im gewählten Zeitraum. Starte mit „OpenParl-Daten laden“.
          </p>
        )}

        {(["top", "review", "low"] as Priority[]).map((p) =>
          groups[p].length ? (
            <section key={p} className="space-y-2">
              {p === "top" ? (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h2 className="font-serif text-xl text-foreground cursor-help">
                        {PRIORITY_LABELS[p]} <span className="text-muted-foreground text-base">({groups[p].length})</span>
                      </h2>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-sm">
                      <p>
                        {events.some((e) => e.political_relevance !== null)
                          ? "Bewertete Ereignisse"
                          : "Unbewertete Ereignisse"}
                        {" — "}
                        {events.filter((e) => e.political_relevance !== null).length} von {events.length} für {from} bis {to} bereits bewertet. Die Kategorien basieren auf diesen gespeicherten Bewertungen. Klicke „Ereignisse bewerten“, um neue Daten zu laden und neu zu bewerten.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <h2 className="font-serif text-xl text-foreground">
                  {PRIORITY_LABELS[p]} <span className="text-muted-foreground text-base">({groups[p].length})</span>
                </h2>
              )}
              <Accordion type="multiple" className="space-y-2">{groups[p].map(renderEvent)}</Accordion>
            </section>
          ) : null,
        )}

        {groups.excluded.length > 0 && (
          <section className="space-y-2">
            <h2 className="font-serif text-xl text-foreground">
              Ausgeschlossen <span className="text-muted-foreground text-base">({groups.excluded.length})</span>
            </h2>
            <Accordion type="multiple" className="space-y-2">{groups.excluded.map(renderEvent)}</Accordion>
          </section>
        )}
      </div>
    </AppShell>
  );
};

export default Radar;
