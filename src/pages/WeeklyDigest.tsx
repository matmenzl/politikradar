import { Link, useSearchParams } from "react-router-dom";
import { Loader2, ChevronLeft, ChevronRight, Sparkles, BarChart3, Vote, Building2, Activity, TrendingUp, Newspaper, Shield } from "lucide-react";
import ParliamentBrowser from "@/components/ParliamentBrowser";
import AccessCodesPanel from "@/components/admin/AccessCodesPanel";
import AiAnalysisSection from "@/components/admin/AiAnalysisSection";
import EditorialSection from "@/components/admin/EditorialSection";
import AffairSearch from "@/components/AffairSearch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import {
  getWeekDateRange,
  formatDateRange } from
"@/lib/api/openparldata";
import { useWeekParam } from "@/hooks/use-week";

import VoteBar from "@/components/VoteBar";
import StoriesCarousel from "@/components/StoriesCarousel";
import WeekContextBar from "@/components/WeekContextBar";
import logoImg from "@/assets/politikradar_logo.png";
// Logo imported above

interface DigestData {
  year: number;
  week: number;
  stats: {
    totalBodies: number;
    totalVotings: number;
    totalAffairs: number;
    totalMeetings: number;
    activeBodies: {key: string;name: string;votings: number;affairs: number;}[];
  };
  topic_radar: {tag: string;count: number;bodies: string[];affairs?: {id: number;title: string;bodyKey: string;}[];}[];
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
  date_range: {from: string;to: string;};
}

const WeeklyDigest = () => {
  const { year, week, goToPreviousWeek, goToNextWeek, withWeek } = useWeekParam();
  const [data, setData] = useState<DigestData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const tab = rawTab === "ki" || rawTab === "redaktion" ? rawTab : rawTab === "admin" ? "redaktion" : "woche";
  const [aiLoaded, setAiLoaded] = useState(tab === "ki");
  const [editorialLoaded, setEditorialLoaded] = useState(tab === "redaktion");

  const setTab = (value: string) => {
    if (value === "ki") setAiLoaded(true);
    if (value === "redaktion") setEditorialLoaded(true);
    const next = new URLSearchParams(searchParams);
    if (value === "woche") next.delete("tab");
    else next.set("tab", value);
    setSearchParams(next, { replace: true });
  };



  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);

    supabase.functions.
    invoke("weekly-digest", { body: { year, week } }).
    then(({ data: result, error: fnError }) => {
      if (fnError) throw fnError;
      if (result?.error) throw new Error(result.error);
      setData(result);
    }).
    catch((e) => {
      console.error("Digest error:", e);
      setError(e.message || "Fehler beim Laden");
      toast.error("Wochenübersicht konnte nicht geladen werden");
    }).
    finally(() => setLoading(false));
  }, [year, week]);




  const { from, to } = getWeekDateRange(year, week);
  const dateRangeLabel = formatDateRange(from, to);

  const maxTopicCount = data?.topic_radar?.[0]?.count || 1;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b-2 border-ink px-3 sm:px-4 md:px-6 py-3 md:py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img src={logoImg} alt="PolitikRadar Logo" className="h-7 w-7 object-contain flex-shrink-0" />
            <span className="font-serif text-base sm:text-lg font-normal text-foreground truncate">politikradar<span className="text-brand-red">.</span></span>
          </div>
          <Link to={withWeek("/weekly")}>
            <Button variant="bubble" size="sm" className="text-xs sm:text-sm">Alle Parlamente</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-10 space-y-6 md:space-y-10">
        {/* Week header */}
        <div className="space-y-1.5 sm:space-y-2 opacity-0 animate-fade-in" style={{ animationDelay: "0ms" }}>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={goToPreviousWeek}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <p className="kicker text-[10px] sm:text-xs text-brand-blue">
              Kalenderwoche {week} · {year}
            </p>
            <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={goToNextWeek}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-5xl font-normal leading-[1.05] text-foreground">
            {dateRangeLabel}
          </h1>
          <p className="text-base sm:text-lg font-medium text-foreground/80">Politikwoche · alle Parlamente</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Diese Kalenderwoche gilt für alle drei Bereiche: Politikwoche, KI-Analyse und Redaktion.
          </p>
        </div>



        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-11">
            <TabsTrigger value="woche" className="gap-2">
              <Newspaper className="w-4 h-4" />
              Politikwoche
            </TabsTrigger>
            <TabsTrigger value="ki" className="gap-2">
              <Sparkles className="w-4 h-4" />
              KI-Analyse
            </TabsTrigger>
            <TabsTrigger value="redaktion" className="gap-2">
              <Shield className="w-4 h-4" />
              Redaktion
            </TabsTrigger>
          </TabsList>

          <TabsContent value="woche" className="mt-8 space-y-8 md:space-y-12 focus-visible:outline-none">
        <WeekContextBar note="Alle Zahlen, Themen und Stories unten beziehen sich auf diese Kalenderwoche." />
        {/* Research: search affairs & votings */}

        <div className="opacity-0 animate-fade-in" style={{ animationDelay: "50ms" }}>
          <AffairSearch />
        </div>





        {loading &&
        <div className="space-y-6">
            <div className="flex items-center gap-3 py-8 justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground text-sm">Daten werden über alle Parlamente aggregiert… Dies kann einen Moment dauern.</span>
            </div>
            <div className="grid gap-5 md:grid-cols-4">
              {[1, 2, 3, 4].map((i) =>
            <Skeleton key={i} className="h-24 rounded-lg" />
            )}
            </div>
          </div>
        }

        {error &&
        <div className="text-center py-16 space-y-2">
            <p className="text-destructive font-medium">Fehler beim Laden</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        }

        {!loading && !error && data &&
        <div className="space-y-8">
            {/* Stats cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
              {[
            { label: "Aktive Parlamente", value: data.stats.totalBodies, tone: "bg-brand-blue-soft text-brand-blue", labelTone: "text-brand-blue", shape: "bubble-plain", href: "/list/bodies" },
            { label: "Abstimmungen", value: data.stats.totalVotings, tone: "bg-brand-red-soft text-brand-red", labelTone: "text-brand-red-deep", shape: "bubble-plain-alt", href: "/list/votings" },
            { label: "Geschäfte", value: data.stats.totalAffairs, tone: "bg-brand-green-soft text-brand-green", labelTone: "text-brand-green", shape: "bubble-plain", href: "/list/affairs" },
            { label: "Sitzungen", value: data.stats.totalMeetings, tone: "bg-secondary text-foreground", labelTone: "text-muted-foreground", shape: "bubble-plain-alt", href: "/list/meetings" }].
            map((stat) =>
            <Link key={stat.label} to={withWeek(stat.href)} className={`${stat.tone} ${stat.shape} p-3 md:p-4 transition-opacity hover:opacity-80`}>
                  <p className="font-serif text-xl sm:text-2xl md:text-3xl font-semibold tabular-nums">{stat.value}</p>
                  <p className={`text-[10px] md:text-xs font-semibold ${stat.labelTone}`}>{stat.label}</p>
                </Link>
            )}
            </div>



            {/* AI Summary */}
            {data.summary &&
          <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs kicker">Wochenzusammenfassung</span>
                  </div>
                  <CardTitle className="font-serif text-xl">Das Wichtigste der Woche</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-foreground leading-relaxed">{data.summary}</p>
                  <p className="text-xs text-muted-foreground">Erstellt mit KI · Angaben ohne Gewähr</p>
                </CardContent>
              </Card>
          }

            {/* Topic Radar */}
            {data.topic_radar.length > 0 &&
          <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs kicker">Themen-Radar</span>
                  </div>
                  <CardTitle className="font-serif text-xl">Meistdiskutierte Themen</CardTitle>
                  <CardDescription className="text-sm">
                    Welche Themen diese Woche in den Parlamenten behandelt wurden
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="w-full">
                    {data.topic_radar.map((topic) =>
                <AccordionItem key={topic.tag} value={topic.tag} className="border-b-0">
                        <AccordionTrigger className="py-3 hover:no-underline">
                          <div className="flex-1 space-y-1.5 text-left mr-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-foreground">{topic.tag}</span>
                              <span className="text-xs text-muted-foreground mr-2">
                                {topic.count}× in {topic.bodies.length} {topic.bodies.length === 1 ? "Parlament" : "Parlamenten"}
                              </span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                          className="h-full bg-accent rounded-full transition-all"
                          style={{ width: `${topic.count / maxTopicCount * 100}%` }} />

                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          {topic.affairs && topic.affairs.length > 0 ?
                    <ul className="space-y-1.5 pl-1">
                              {topic.affairs.map((affair, i) =>
                      <li key={`${affair.id}-${i}`}>
                                  <Link
                          to={`/detail/${affair.id}?type=affair&body=${encodeURIComponent(affair.bodyKey)}`}
                          className="flex items-start gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1 group">

                                    <span className="text-xs mt-0.5">›</span>
                                    <span className="group-hover:underline">{affair.title}</span>
                                  </Link>
                                </li>
                      )}
                            </ul> :

                    <p className="text-xs text-muted-foreground">Keine Geschäftsdetails verfügbar.</p>
                    }
                        </AccordionContent>
                      </AccordionItem>
                )}
                  </Accordion>
                </CardContent>
              </Card>
          }

            {/* Closest Votings */}
            {data.closest_votings.length > 0 &&
          <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "400ms" }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Vote className="w-4 h-4" />
                    <span className="text-xs kicker">Knappste Abstimmungen</span>
                  </div>
                  <CardTitle className="font-serif text-xl">Haarscharf entschieden</CardTitle>
                  <CardDescription className="text-sm">
                    Die Abstimmungen mit dem kleinsten Unterschied zwischen Ja und Nein
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.closest_votings.map((cv) =>
              <Link
                key={cv.voting.id}
                to={`/detail/${cv.voting.id}?type=voting&body=${encodeURIComponent(cv.voting.body_key)}`}
                className="block p-3 -mx-3 rounded-lg hover:bg-secondary/50 transition-colors">

                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="text-sm font-medium text-foreground truncate">
                            {cv.voting.affair_title_de || cv.voting.title_de || `#${cv.voting.id}`}
                          </p>
                          <p className="text-xs text-muted-foreground">{cv.bodyName}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${(cv.voting.decision ? ["ja","accepted","angenommen"].includes(cv.voting.decision.toLowerCase()) : cv.voting.results_yes > cv.voting.results_no) ? "bg-brand-green-soft text-brand-green" : "bg-brand-red-soft text-brand-red"}`}>
                            {cv.voting.results_yes}:{cv.voting.results_no}
                          </span>
                          <Badge variant="outline" className="text-xs">Δ{cv.margin}</Badge>
                        </div>
                      </div>
                      <VoteBar
                  ja={cv.voting.results_yes}
                  nein={cv.voting.results_no}
                  enthaltungen={cv.voting.results_abstention}
                  compact />

                    </Link>
              )}
                </CardContent>
              </Card>
          }

            {/* Active Parliaments */}
            {data.stats.activeBodies.length > 0 &&
          <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "500ms" }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="w-4 h-4" />
                    <span className="text-xs kicker">Aktivste Parlamente</span>
                  </div>
                  <CardTitle className="font-serif text-xl">Parlamentarische Aktivität</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.stats.activeBodies.slice(0, 10).map((body, i) =>
                <Link
                  key={body.key}
                  to={withWeek(`/weekly?body=${encodeURIComponent(body.key)}`)}
                  className="flex items-center justify-between py-2 px-3 -mx-3 rounded-lg hover:bg-secondary/50 transition-colors">

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-muted-foreground w-5">{i + 1}.</span>
                          <span className="text-sm font-medium text-foreground">{body.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{body.affairs} Geschäfte</span>
                          <span>{body.votings} Abstimmungen</span>
                        </div>
                      </Link>
                )}
                  </div>
                </CardContent>
              </Card>
          }

            {/* No data state */}
            {data.stats.totalBodies === 0 &&
          <div className="text-center py-16 space-y-3">
                <Activity className="w-10 h-10 mx-auto text-muted-foreground" />
                <p className="text-lg font-serif font-normal">Keine Daten für diese Woche</p>
                <p className="text-sm text-muted-foreground">
                  In der Kalenderwoche {week} wurden keine parlamentarischen Aktivitäten erfasst.
                </p>
              </div>
          }
          </div>
        }

        {/* Stories der Woche */}
        <div className="opacity-0 animate-fade-in" style={{ animationDelay: "600ms" }}>
          <StoriesCarousel year={year} week={week} />
        </div>

        {/* Parliament Browser */}
        <div className="opacity-0 animate-fade-in" style={{ animationDelay: "650ms" }}>
          <ParliamentBrowser />
        </div>
          </TabsContent>


          <TabsContent value="ki" className="mt-8 space-y-4 focus-visible:outline-none">
            <WeekContextBar note="Die KI-Analyse startet standardmässig mit dieser Kalenderwoche – der Zeitraum lässt sich unten erweitern." />
            {aiLoaded && <AiAnalysisSection year={year} week={week} />}
          </TabsContent>

          <TabsContent value="redaktion" className="mt-8 space-y-4 focus-visible:outline-none">
            <WeekContextBar note="Redaktion zeigt und verwaltet die Stories dieser Kalenderwoche." />
            {editorialLoaded && (
              <>
                <EditorialSection year={year} week={week} />
                <AccessCodesPanel />
              </>
            )}
          </TabsContent>

        </Tabs>
      </main>


      <footer className="px-4 md:px-6 py-5 border-t border-border/50">
        <div className="max-w-4xl mx-auto text-center text-xs text-muted-foreground">
          PolitikRadar · Daten via <a href="https://openparldata.ch" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">OpenParlData.ch</a> · CC BY 4.0
        </div>
      </footer>
    </div>);

};

export default WeeklyDigest;