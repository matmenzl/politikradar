import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, ChevronLeft, ChevronRight, Sparkles, BarChart3, Vote, Building2, Activity, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  getCurrentISOWeek,
  getWeekDateRange,
  formatDateRange,
} from "@/lib/api/openparldata";
import VoteBar from "@/components/VoteBar";

interface DigestData {
  year: number;
  week: number;
  stats: {
    totalBodies: number;
    totalVotings: number;
    totalAffairs: number;
    totalMeetings: number;
    activeBodies: { key: string; name: string; votings: number; affairs: number }[];
  };
  topic_radar: { tag: string; count: number; bodies: string[] }[];
  closest_votings: {
    voting: {
      id: number;
      body_key: string;
      affair_title_de?: string;
      title_de?: string;
      results_yes: number;
      results_no: number;
      results_abstention: number;
      decision: string;
      date: string;
    };
    bodyName: string;
    margin: number;
  }[];
  summary: string;
  date_range: { from: string; to: string };
}

const WeeklyDigest = () => {
  const initial = getCurrentISOWeek();
  const [year, setYear] = useState(initial.year);
  const [week, setWeek] = useState(initial.week);
  const [data, setData] = useState<DigestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);

    supabase.functions
      .invoke("weekly-digest", { body: { year, week } })
      .then(({ data: result, error: fnError }) => {
        if (fnError) throw fnError;
        if (result?.error) throw new Error(result.error);
        setData(result);
      })
      .catch((e) => {
        console.error("Digest error:", e);
        setError(e.message || "Fehler beim Laden");
        toast.error("Wochenübersicht konnte nicht geladen werden");
      })
      .finally(() => setLoading(false));
  }, [year, week]);

  const goToPreviousWeek = () => {
    if (week <= 1) { setYear(year - 1); setWeek(52); }
    else setWeek(week - 1);
  };
  const goToNextWeek = () => {
    if (week >= 52) { setYear(year + 1); setWeek(1); }
    else setWeek(week + 1);
  };

  const { from, to } = getWeekDateRange(year, week);
  const dateRangeLabel = formatDateRange(from, to);

  const maxTopicCount = data?.topic_radar?.[0]?.count || 1;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-serif text-lg font-semibold text-foreground">PolitikRadar</span>
          </Link>
          <Badge variant="secondary" className="text-xs">Alle Parlamente</Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Week header */}
        <div className="space-y-2 opacity-0 animate-fade-in" style={{ animationDelay: "0ms" }}>
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
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
            🇨🇭 Politikwoche
          </h1>
          <p className="text-lg text-foreground/80">{dateRangeLabel}</p>
          <p className="text-xs text-muted-foreground">
            Aggregierte Übersicht über alle indexierten Schweizer Parlamente
          </p>
        </div>

        {loading && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 py-8 justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground text-sm">Daten werden über alle Parlamente aggregiert… Dies kann einen Moment dauern.</span>
            </div>
            <div className="grid gap-5 md:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-16 space-y-2">
            <p className="text-destructive font-medium">Fehler beim Laden</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}

        {!loading && !error && data && (
          <div className="space-y-8">
            {/* Stats cards */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
              {[
                { icon: Building2, label: "Aktive Parlamente", value: data.stats.totalBodies },
                { icon: Vote, label: "Abstimmungen", value: data.stats.totalVotings },
                { icon: BarChart3, label: "Geschäfte", value: data.stats.totalAffairs },
                { icon: Activity, label: "Sitzungen", value: data.stats.totalMeetings },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="p-4 text-center">
                    <stat.icon className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* AI Summary */}
            {data.summary && (
              <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Wochenzusammenfassung</span>
                  </div>
                  <CardTitle className="font-serif text-xl">Das Wichtigste der Woche</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-foreground leading-relaxed">{data.summary}</p>
                  <p className="text-xs text-muted-foreground">Erstellt mit KI · Angaben ohne Gewähr</p>
                </CardContent>
              </Card>
            )}

            {/* Topic Radar */}
            {data.topic_radar.length > 0 && (
              <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Themen-Radar</span>
                  </div>
                  <CardTitle className="font-serif text-xl">Meistdiskutierte Themen</CardTitle>
                  <CardDescription className="text-sm">
                    Welche Themen diese Woche in den Parlamenten behandelt wurden
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.topic_radar.map((topic) => (
                    <div key={topic.tag} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{topic.tag}</span>
                        <span className="text-xs text-muted-foreground">
                          {topic.count}× in {topic.bodies.length} {topic.bodies.length === 1 ? "Parlament" : "Parlamenten"}
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all"
                          style={{ width: `${(topic.count / maxTopicCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Closest Votings */}
            {data.closest_votings.length > 0 && (
              <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "400ms" }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Vote className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Knappste Abstimmungen</span>
                  </div>
                  <CardTitle className="font-serif text-xl">Haarscharf entschieden</CardTitle>
                  <CardDescription className="text-sm">
                    Die Abstimmungen mit dem kleinsten Unterschied zwischen Ja und Nein
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.closest_votings.map((cv) => (
                    <Link
                      key={cv.voting.id}
                      to={`/detail/${cv.voting.id}?type=voting&body=${encodeURIComponent(cv.voting.body_key)}`}
                      className="block p-3 -mx-3 rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="text-sm font-medium text-foreground truncate">
                            {cv.voting.affair_title_de || cv.voting.title_de || `#${cv.voting.id}`}
                          </p>
                          <p className="text-xs text-muted-foreground">{cv.bodyName}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cv.voting.decision === "ja" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                            {cv.voting.results_yes}:{cv.voting.results_no}
                          </span>
                          <Badge variant="outline" className="text-xs">Δ{cv.margin}</Badge>
                        </div>
                      </div>
                      <VoteBar
                        ja={cv.voting.results_yes}
                        nein={cv.voting.results_no}
                        enthaltungen={cv.voting.results_abstention}
                        compact
                      />
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Active Parliaments */}
            {data.stats.activeBodies.length > 0 && (
              <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "500ms" }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Aktivste Parlamente</span>
                  </div>
                  <CardTitle className="font-serif text-xl">Parlamentarische Aktivität</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.stats.activeBodies.slice(0, 10).map((body, i) => (
                      <Link
                        key={body.key}
                        to={`/weekly?body=${encodeURIComponent(body.key)}`}
                        className="flex items-center justify-between py-2 px-3 -mx-3 rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-muted-foreground w-5">{i + 1}.</span>
                          <span className="text-sm font-medium text-foreground">{body.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{body.affairs} Geschäfte</span>
                          <span>{body.votings} Abstimmungen</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No data state */}
            {data.stats.totalBodies === 0 && (
              <div className="text-center py-16 space-y-3">
                <Activity className="w-10 h-10 mx-auto text-muted-foreground" />
                <p className="text-lg font-serif font-semibold">Keine Daten für diese Woche</p>
                <p className="text-sm text-muted-foreground">
                  In der Kalenderwoche {week} wurden keine parlamentarischen Aktivitäten erfasst.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="px-6 py-5 border-t border-border/50">
        <div className="max-w-4xl mx-auto text-center text-xs text-muted-foreground">
          PolitikRadar · Daten via <a href="https://openparldata.ch" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">OpenParlData.ch</a> · CC BY 4.0
        </div>
      </footer>
    </div>
  );
};

export default WeeklyDigest;
