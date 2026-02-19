import { Link } from "react-router-dom";
import { ArrowLeft, Share2, Vote, BarChart3, Activity, ChevronLeft, ChevronRight, FileText, Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import ShareModal from "@/components/ShareModal";
import VoteBar from "@/components/VoteBar";
import {
  fetchWeeklyData,
  fetchBodies,
  groupBodiesByLevel,
  getBodyLabel,
  LEVEL_LABELS,
  getCurrentISOWeek,
  getWeekDateRange,
  formatDateRange,
  type WeeklyStats,
  type Body,
} from "@/lib/api/openparldata";

const WeeklyOverview = () => {
  const [shareOpen, setShareOpen] = useState(false);
  const initial = getCurrentISOWeek();
  const [year, setYear] = useState(initial.year);
  const [week, setWeek] = useState(initial.week);
  const [bodyKey, setBodyKey] = useState("CHE");
  const [bodies, setBodies] = useState<Body[]>([]);
  const [data, setData] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available bodies once
  useEffect(() => {
    fetchBodies().then(setBodies).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchWeeklyData(year, week, bodyKey)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [year, week, bodyKey]);

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
  const grouped = groupBodiesByLevel(bodies);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 px-6 py-4">
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

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Parliament selector */}
        <div className="opacity-0 animate-fade-in" style={{ animationDelay: "0ms" }}>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Parlament</span>
            </div>
            <Select value={bodyKey} onValueChange={setBodyKey}>
              <SelectTrigger className="w-auto min-w-[220px] h-9 text-sm">
                <SelectValue placeholder="Parlament wählen…" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {Object.entries(grouped).sort(([a], [b]) => {
                  const order = ["national", "cantonal", "communal", "other"];
                  return order.indexOf(a) - order.indexOf(b);
                }).map(([level, levelBodies]) => (
                  <SelectGroup key={level}>
                    <SelectLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                      {LEVEL_LABELS[level] || level}
                    </SelectLabel>
                    {levelBodies.sort((a, b) => getBodyLabel(a).localeCompare(getBodyLabel(b))).map((body) => (
                      <SelectItem key={body.key} value={body.key}>
                        {getBodyLabel(body)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
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
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">{dateRangeLabel}</h1>
          <p className="text-xs text-muted-foreground">
            {selectedBody ? getBodyLabel(selectedBody) : bodyKey} · Quelle: <a href="https://openparldata.ch" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">OpenParlData.ch</a> · CC BY 4.0
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

        {!loading && !error && data && (
          <div className="grid gap-5 md:grid-cols-2">
            {/* Card 1: Gesamtaktivität */}
            <Card className="group hover:shadow-lg hover:border-accent/30 transition-all duration-300 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Wochenüberblick in Zahlen</span>
                </div>
                <CardTitle className="font-serif text-xl leading-snug">Gesamtaktivität</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {data.totalAffairs > 0 || data.totalVotings > 0
                    ? `${data.totalAffairs} Geschäfte, ${data.totalVotings} Abstimmungen und ${data.totalMeetings} Sitzungen in dieser Woche.`
                    : "Keine parlamentarische Aktivität in dieser Woche erfasst."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Geschäfte", value: data.totalAffairs },
                    { label: "Abstimmungen", value: data.totalVotings },
                    { label: "Sitzungen", value: data.totalMeetings },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-secondary/50 rounded-lg p-3">
                      <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Knappste Abstimmung */}
            <Card className="group hover:shadow-lg hover:border-accent/30 transition-all duration-300 opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Vote className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Knappste Abstimmung</span>
                </div>
                <CardTitle className="font-serif text-xl leading-snug">
                  {closestVoting ? closestVoting.affair_title_de || closestVoting.title_de || "Abstimmung" : "Keine Abstimmung"}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {closestVoting
                    ? `Entschied: ${closestVoting.decision === "ja" ? "Annahme" : "Ablehnung"} – Differenz von nur ${Math.abs(closestVoting.results_yes - closestVoting.results_no)} Stimmen.`
                    : "Keine Abstimmungen in dieser Woche erfasst."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {closestVoting && (
                  <>
                    <VoteBar
                      ja={closestVoting.results_yes}
                      nein={closestVoting.results_no}
                      enthaltungen={closestVoting.results_abstention}
                    />
                    {closestVoting.url_external_de && (
                      <a href={closestVoting.url_external_de} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="w-full mt-2 text-muted-foreground hover:text-foreground">
                          Auf parlament.ch ansehen →
                        </Button>
                      </a>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

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
                    ? `${data.votings.length} Abstimmungen – ${data.votings.filter(v => v.decision === "ja").length} angenommen, ${data.votings.filter(v => v.decision !== "ja").length} abgelehnt.`
                    : "Keine Abstimmungsdaten vorhanden."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {data.votings.slice(0, 8).map((v) => (
                    <div key={v.id} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                      <span className="text-sm text-foreground truncate mr-3 flex-1">
                        {v.affair_title_de || v.title_de || `Abstimmung #${v.id}`}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${v.decision === "ja" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                        {v.results_yes}:{v.results_no}
                      </span>
                    </div>
                  ))}
                  {data.votings.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Keine Daten</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Card 4: Neueste Geschäfte */}
            <Card className="group hover:shadow-lg hover:border-accent/30 transition-all duration-300 opacity-0 animate-fade-in" style={{ animationDelay: "400ms" }}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Geschäfte der Woche</span>
                </div>
                <CardTitle className="font-serif text-xl leading-snug">Parlamentarische Geschäfte</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {data.recentAffairs.length > 0
                    ? `${data.totalAffairs} Geschäfte in dieser Woche, darunter ${new Set(data.recentAffairs.map(a => a.type_de).filter(Boolean)).size} verschiedene Typen.`
                    : "Keine Geschäfte in dieser Woche erfasst."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {data.recentAffairs.map((a) => (
                    <div key={a.id} className="py-1.5 border-b border-border/30 last:border-0">
                      <p className="text-sm text-foreground truncate">{a.title_de || `Geschäft #${a.id}`}</p>
                      <div className="flex gap-2 mt-0.5">
                        {a.type_de && <span className="text-xs text-muted-foreground">{a.type_de}</span>}
                        {a.status_de && <span className="text-xs text-muted-foreground">· {a.status_de}</span>}
                      </div>
                    </div>
                  ))}
                  {data.recentAffairs.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Keine Daten</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <ShareModal open={shareOpen} onOpenChange={setShareOpen} />
    </div>
  );
};

export default WeeklyOverview;
