import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Share2, Vote, BarChart3, Activity, ChevronLeft, ChevronRight, FileText, Loader2, Tag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ParliamentPicker from "@/components/ParliamentPicker";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import ShareModal from "@/components/ShareModal";
import VoteBar from "@/components/VoteBar";
import PartyOverviewCard from "@/components/PartyOverviewCard";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchWeeklyData,
  fetchBodies,
  getBodyLabel,
  getCurrentISOWeek,
  getWeekDateRange,
  formatDateRange,
  type WeeklyStats,
  type Body,
  isVotingAccepted,
} from "@/lib/api/openparldata";

const WeeklyOverview = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shareOpen, setShareOpen] = useState(false);
  const initial = getCurrentISOWeek();
  const [year, setYear] = useState(initial.year);
  const [week, setWeek] = useState(initial.week);
  const urlBody = searchParams.get("body");
  const [bodyKey, setBodyKeyState] = useState(urlBody && urlBody !== "undefined" ? urlBody : "CHE");
  const [hasUserSelected, setHasUserSelected] = useState(!!urlBody && urlBody !== "undefined");
  const [bodies, setBodies] = useState<Body[]>([]);

  const setBodyKey = (key: string | undefined) => {
    if (!key) return;
    setBodyKeyState(key);
    setHasUserSelected(true);
    setSearchParams({ body: key }, { replace: true });
  };
  const [data, setData] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AI tagging state
  const [tagMap, setTagMap] = useState<Record<number, string[]>>({});
  const [taggingLoading, setTaggingLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Fetch available bodies once
  useEffect(() => {
    fetchBodies().then(setBodies).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setTagMap({});
    setSelectedTag(null);
    fetchWeeklyData(year, week, bodyKey)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [year, week, bodyKey]);

  // Auto-tag affairs when data loads
  useEffect(() => {
    if (!data || data.recentAffairs.length === 0) return;

    const affairs = data.recentAffairs
      .filter((a) => a.title_de)
      .map((a) => ({ id: a.id, title: a.title_de! }));

    if (affairs.length === 0) return;

    setTaggingLoading(true);
    supabase.functions
      .invoke("tag-affairs", { body: { affairs } })
      .then(({ data: result, error: fnError }) => {
        if (fnError) {
          console.error("Tagging error:", fnError);
          toast.error("Schlagwort-Generierung fehlgeschlagen");
          return;
        }
        if (result?.error) {
          console.error("Tagging error:", result.error);
          toast.error(result.error);
          return;
        }
        if (result?.tagMap) {
          setTagMap(result.tagMap);
        }
      })
      .catch((e) => {
        console.error("Tagging error:", e);
      })
      .finally(() => setTaggingLoading(false));
  }, [data]);

  // Collect all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    Object.values(tagMap).forEach((t) => t.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [tagMap]);

  // Filter affairs by selected tag
  const filteredAffairs = useMemo(() => {
    if (!data) return [];
    if (!selectedTag) return data.recentAffairs;
    return data.recentAffairs.filter((a) => tagMap[a.id]?.includes(selectedTag));
  }, [data, selectedTag, tagMap]);

  const goToPreviousWeek = () => {
    if (week <= 1) {
      setYear(year - 1);
      setWeek(52);
    } else {
      setWeek(week - 1);
    }
  };

  const goToNextWeek = () => {
    if (week >= 52) {
      setYear(year + 1);
      setWeek(1);
    } else {
      setWeek(week + 1);
    }
  };

  const { from, to } = getWeekDateRange(year, week);
  const dateRangeLabel = formatDateRange(from, to);
  const closestVoting = data?.closestVoting;
  const selectedBody = bodies.find((b) => b.key === bodyKey);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 md:px-6 py-3 md:py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-serif text-lg font-semibold text-foreground">PolitikRadar</span>
          </Link>
          <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={() => setShareOpen(true)}>
            <Share2 className="w-3.5 h-3.5" />
            Teilen
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-6 md:space-y-8">
        {/* Parliament selector */}
        <div className="opacity-0 animate-fade-in" style={{ animationDelay: "0ms" }}>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Parlament wechseln</span>
            <ParliamentPicker
              bodies={bodies}
              value={bodyKey}
              onValueChange={setBodyKey}
              loading={bodies.length === 0}
            />
          </div>
        </div>

        {/* Week header with navigation */}
        <div className="space-y-2 opacity-0 animate-fade-in" style={{ animationDelay: "50ms" }}>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPreviousWeek}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Kalenderwoche {week}
            </p>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextWeek}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <h1 className="font-serif text-2xl md:text-4xl font-bold text-foreground">{dateRangeLabel}</h1>
          <p className="text-lg font-medium text-foreground/80">
            {bodies.length === 0 ? "Lade Parlament…" : (selectedBody ? getBodyLabel(selectedBody) : bodyKey)}
          </p>
          {!hasUserSelected && (
            <p className="text-xs text-muted-foreground italic">
              Standardmässig: Nationales Parlament. Wähle ein anderes Parlament im Dropdown oben.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Quelle: <a href="https://openparldata.ch" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">OpenParlData.ch</a> · CC BY 4.0
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Lade parlamentarische Daten…</span>
          </div>
        )}

        {error && (
          <div className="text-center py-20 space-y-2">
            <p className="text-destructive font-medium">Fehler beim Laden der Daten</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}

        {!loading && !error && data && data.totalAffairs === 0 && data.totalVotings === 0 && data.totalMeetings === 0 && (
          <div className="text-center py-16 space-y-3 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted">
              <Activity className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-lg font-serif font-semibold text-foreground">Keine Daten für diese Woche</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Für «{selectedBody ? getBodyLabel(selectedBody) : bodyKey}» liegen in der Kalenderwoche {week} keine parlamentarischen Aktivitäten vor. Versuche eine andere Woche oder ein anderes Parlament.
            </p>
          </div>
        )}

        {!loading && !error && data && (data.totalAffairs > 0 || data.totalVotings > 0 || data.totalMeetings > 0) && (
          <div className="space-y-5 md:space-y-8">
            <div className="grid gap-4 md:gap-5 md:grid-cols-2">
              {/* Card 1: Gesamtaktivität */}
              <Card className="group hover:shadow-lg hover:border-accent/30 transition-all duration-300 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
                <CardHeader className="pb-2 md:pb-3 p-4 md:p-6">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Activity className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Wochenüberblick in Zahlen</span>
                  </div>
                  <CardTitle className="font-serif text-lg md:text-xl leading-snug">Gesamtaktivität</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {data.totalAffairs > 0 || data.totalVotings > 0
                      ? `${data.totalAffairs} Geschäfte, ${data.totalVotings} Abstimmungen und ${data.totalMeetings} Sitzungen in dieser Woche.`
                      : "Keine parlamentarische Aktivität in dieser Woche erfasst."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <div className="grid grid-cols-3 gap-2 md:gap-3">
                    {[
                      { label: "Geschäfte", value: data.totalAffairs, href: `/list/affairs?body=${encodeURIComponent(bodyKey)}` },
                      { label: "Abstimmungen", value: data.totalVotings, href: `/list/votings?body=${encodeURIComponent(bodyKey)}` },
                      { label: "Sitzungen", value: data.totalMeetings, href: `/list/meetings?body=${encodeURIComponent(bodyKey)}` },
                    ].map((stat) => (
                      <Link key={stat.label} to={stat.href} className="bg-secondary/50 rounded-lg p-2 md:p-3 hover:bg-secondary/80 transition-colors">
                        <p className="text-xl md:text-2xl font-semibold text-foreground">{stat.value}</p>
                        <p className="text-[10px] md:text-xs text-muted-foreground">{stat.label}</p>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Knappste Abstimmung */}
              <Link to={closestVoting ? `/detail/${closestVoting.id}?type=voting&body=${encodeURIComponent(bodyKey)}` : "#"} className="block">
              <Card className="group hover:shadow-lg hover:border-accent/30 transition-all duration-300 opacity-0 animate-fade-in cursor-pointer" style={{ animationDelay: "200ms" }}>
                <CardHeader className="pb-2 md:pb-3 p-4 md:p-6">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Vote className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Knappste Abstimmung</span>
                  </div>
                  <CardTitle className="font-serif text-lg md:text-xl leading-snug">
                    {closestVoting ? closestVoting.affair_title_de || closestVoting.title_de || "Abstimmung" : "Keine Abstimmung"}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {closestVoting
                      ? `Entschied: ${isVotingAccepted(closestVoting) ? "Annahme" : "Ablehnung"} – Differenz von nur ${Math.abs(closestVoting.results_yes - closestVoting.results_no)} Stimmen.`
                      : "Keine Abstimmungen in dieser Woche erfasst."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0 space-y-4">
                  {closestVoting && (
                    <VoteBar
                      ja={closestVoting.results_yes}
                      nein={closestVoting.results_no}
                      enthaltungen={closestVoting.results_abstention}
                    />
                  )}
                </CardContent>
              </Card>
              </Link>

              {/* Card 3: Alle Abstimmungen */}
              <Card className="group hover:shadow-lg hover:border-accent/30 transition-all duration-300 opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Abstimmungen der Woche</span>
                  </div>
                  <CardTitle className="font-serif text-xl leading-snug">Abstimmungsergebnisse</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {data.votings.length > 0
                      ? `${data.votings.length} Abstimmungen – ${data.votings.filter(v => isVotingAccepted(v)).length} angenommen, ${data.votings.filter(v => !isVotingAccepted(v)).length} abgelehnt.`
                      : "Keine Abstimmungsdaten vorhanden."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {data.votings.slice(0, 8).map((v) => (
                      <Link key={v.id} to={`/detail/${v.id}?type=voting&body=${encodeURIComponent(bodyKey)}`} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0 hover:bg-secondary/30 rounded px-1 -mx-1 transition-colors">
                        <span className="text-sm text-foreground truncate mr-3 flex-1">
                          {v.affair_title_de || v.title_de || `Abstimmung #${v.id}`}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isVotingAccepted(v) ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                          {v.results_yes}:{v.results_no}
                        </span>
                      </Link>
                    ))}
                    {data.votings.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">Keine Daten</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Card 4: Neueste Geschäfte with AI tags */}
              <Card className="group hover:shadow-lg hover:border-accent/30 transition-all duration-300 opacity-0 animate-fade-in" style={{ animationDelay: "400ms" }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">Geschäfte der Woche</span>
                    </div>
                    {taggingLoading && (
                      <div className="flex items-center gap-1.5 text-accent">
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        <span className="text-xs">AI taggt…</span>
                      </div>
                    )}
                  </div>
                  <CardTitle className="font-serif text-xl leading-snug">Parlamentarische Geschäfte</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {data.recentAffairs.length > 0
                      ? `${data.totalAffairs} Geschäfte in dieser Woche.${allTags.length > 0 ? ` ${allTags.length} Themen erkannt.` : ""}`
                      : "Keine Geschäfte in dieser Woche erfasst."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Tag filter chips */}
                  {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      <Badge
                        variant={selectedTag === null ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => setSelectedTag(null)}
                      >
                        Alle
                      </Badge>
                      {allTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant={selectedTag === tag ? "default" : "outline"}
                          className="cursor-pointer text-xs"
                          onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredAffairs.map((a) => (
                      <Link key={a.id} to={`/detail/${a.id}?type=affair&body=${encodeURIComponent(bodyKey)}`} className="block py-1.5 border-b border-border/30 last:border-0 hover:bg-secondary/30 rounded px-1 -mx-1 transition-colors">
                        <p className="text-sm text-foreground">{a.title_de || `Geschäft #${a.id}`}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {a.type_de && <span className="text-xs text-muted-foreground">{a.type_de}</span>}
                          {a.status_de && <span className="text-xs text-muted-foreground">· {a.status_de}</span>}
                          {tagMap[a.id]?.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 h-4 cursor-pointer hover:bg-accent hover:text-accent-foreground"
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedTag(selectedTag === tag ? null : tag);
                              }}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </Link>
                    ))}
                    {filteredAffairs.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {selectedTag ? `Keine Geschäfte mit Tag «${selectedTag}»` : "Keine Daten"}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Card 5: Party Overview */}
            <PartyOverviewCard votings={data.votings} />
          </div>
        )}
      </main>

      <ShareModal open={shareOpen} onOpenChange={setShareOpen} />
    </div>
  );
};

export default WeeklyOverview;
