import { Link } from "react-router-dom";
import { ArrowLeft, Share2, TrendingUp, Vote, BarChart3, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { weeklyData } from "@/data/mockData";
import { useState } from "react";
import ShareModal from "@/components/ShareModal";
import VoteBar from "@/components/VoteBar";

const iconMap = {
  dominant_topic: BarChart3,
  closest_vote: Vote,
  momentum: TrendingUp,
  total_activity: Activity,
};

const WeeklyOverview = () => {
  const [shareOpen, setShareOpen] = useState(false);
  const data = weeklyData;

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
        {/* Week header */}
        <div className="space-y-2 opacity-0 animate-fade-in" style={{ animationDelay: "0ms" }}>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{data.weekLabel}</p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">{data.dateRange}</h1>
        </div>

        {/* Cards grid */}
        <div className="grid gap-5 md:grid-cols-2">
          {data.highlights.map((highlight, i) => {
            const Icon = iconMap[highlight.type];
            return (
              <Card
                key={highlight.id}
                className="group hover:shadow-lg hover:border-accent/30 transition-all duration-300 opacity-0 animate-fade-in"
                style={{ animationDelay: `${(i + 1) * 100}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">{highlight.subtitle}</span>
                    </div>
                  </div>
                  <CardTitle className="font-serif text-xl leading-snug">{highlight.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{highlight.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {highlight.type === "closest_vote" && (
                    <VoteBar ja={highlight.details.ja as number} nein={highlight.details.nein as number} enthaltungen={highlight.details.enthaltungen as number} />
                  )}

                  {highlight.type === "dominant_topic" && (
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Geschäfte", value: highlight.details.geschaefte },
                        { label: "Events", value: highlight.details.events },
                        { label: "Dokumente", value: highlight.details.dokumente },
                        { label: "Abstimmungen", value: highlight.details.abstimmungen },
                      ].map((stat) => (
                        <div key={stat.label} className="bg-secondary/50 rounded-lg p-3">
                          <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {highlight.type === "momentum" && (
                    <div className="flex items-center gap-4">
                      <div className="bg-accent/10 text-accent rounded-lg px-4 py-3 text-center">
                        <p className="text-2xl font-bold">+{highlight.details.delta}%</p>
                        <p className="text-xs">vs. Vorwoche</p>
                      </div>
                      <div className="flex-1 space-y-1 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Vorwoche</span>
                          <span className="font-medium text-foreground">{highlight.details.vorwoche}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Diese Woche</span>
                          <span className="font-medium text-foreground">{highlight.details.dieseWoche}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {highlight.type === "total_activity" && (
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Geschäfte total", value: highlight.details.totalGeschaefte },
                        { label: "Abstimmungen", value: highlight.details.totalAbstimmungen },
                        { label: "Neue Vorstösse", value: highlight.details.neueVorstoesse },
                        { label: "Kommissionssitzungen", value: highlight.details.kommissionsSitzungen },
                      ].map((stat) => (
                        <div key={stat.label} className="bg-secondary/50 rounded-lg p-3">
                          <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <Link to={`/detail/${highlight.id}`}>
                    <Button variant="ghost" size="sm" className="w-full mt-2 text-muted-foreground hover:text-foreground group-hover:text-accent transition-colors">
                      Details ansehen →
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      <ShareModal open={shareOpen} onOpenChange={setShareOpen} />
    </div>
  );
};

export default WeeklyOverview;
