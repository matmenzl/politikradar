import { Link } from "react-router-dom";
import { ArrowRight, Building2, Landmark, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import {
  fetchBodies,
  groupBodiesByLevel,
  getBodyLabel,
  LEVEL_LABELS,
  type Body,
} from "@/lib/api/openparldata";

const LEVEL_ICONS: Record<string, React.ReactNode> = {
  national: <Landmark className="w-5 h-5" />,
  cantonal: <Building2 className="w-5 h-5" />,
  communal: <MapPin className="w-5 h-5" />,
};

const LEVEL_ORDER = ["national", "cantonal", "communal", "other"];

const LandingPage = () => {
  const [bodies, setBodies] = useState<Body[]>([]);
  const [loadingBodies, setLoadingBodies] = useState(true);

  useEffect(() => {
    fetchBodies()
      .then(setBodies)
      .catch(console.error)
      .finally(() => setLoadingBodies(false));
  }, []);

  const grouped = groupBodiesByLevel(bodies);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="px-6 py-5 border-b border-border/50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="font-serif text-lg font-semibold tracking-tight text-foreground">
            PolitikRadar
          </span>
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Weekly
          </span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-8 py-20">
            <div
              className="inline-block px-3 py-1 rounded-full border border-border text-xs font-medium text-muted-foreground tracking-wide uppercase opacity-0 animate-fade-in"
              style={{ animationDelay: "0ms" }}
            >
              Nationale, kantonale & kommunale Parlamente
            </div>

            <h1
              className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground opacity-0 animate-fade-in"
              style={{ animationDelay: "100ms" }}
            >
              Was diese Woche im Parlament wirklich wichtig war
            </h1>

            <p
              className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg mx-auto opacity-0 animate-fade-in"
              style={{ animationDelay: "200ms" }}
            >
              Visuell und datenbasiert – die wichtigsten parlamentarischen
              Aktivitäten der Woche auf einen Blick.
            </p>

            <div
              className="opacity-0 animate-fade-in"
              style={{ animationDelay: "300ms" }}
            >
              <Button asChild size="lg" className="gap-2 px-8 rounded-full">
                <Link to="/weekly">
                  Zur Wochenübersicht
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>

            <div
              className="pt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground opacity-0 animate-fade-in"
              style={{ animationDelay: "400ms" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                Datenbasierte Analyse
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                Wöchentlich aktualisiert
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-warning" />
                Neutral & überparteilich
              </div>
            </div>
          </div>

          {/* Parliament Overview */}
          <section className="pb-20 space-y-6 opacity-0 animate-fade-in" style={{ animationDelay: "500ms" }}>
            <div className="text-center space-y-2">
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
                Verfügbare Parlamente
              </h2>
              <p className="text-sm text-muted-foreground">
                {bodies.length > 0
                  ? `${bodies.length} Parlamente auf allen Ebenen verfügbar`
                  : "Parlamente werden geladen…"}
              </p>
            </div>

            {loadingBodies ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Lade Parlamente…</span>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {LEVEL_ORDER.filter((level) => grouped[level]?.length > 0).map((level) => {
                  const levelBodies = grouped[level].sort((a, b) =>
                    getBodyLabel(a).localeCompare(getBodyLabel(b))
                  );
                  const preview = levelBodies.slice(0, 5);
                  const remaining = levelBodies.length - preview.length;

                  return (
                    <Card key={level} className="hover:shadow-lg hover:border-accent/30 transition-all duration-300">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 text-accent">
                          {LEVEL_ICONS[level] || <Building2 className="w-5 h-5" />}
                          <CardTitle className="font-serif text-lg">
                            {LEVEL_LABELS[level] || level}
                          </CardTitle>
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                          {levelBodies.length}
                          <span className="text-sm font-normal text-muted-foreground ml-1.5">
                            {levelBodies.length === 1 ? "Parlament" : "Parlamente"}
                          </span>
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1.5">
                          {preview.map((body) => (
                            <Link
                              key={body.key}
                              to={`/weekly?body=${body.key}`}
                              className="flex items-center justify-between py-1 px-2 -mx-2 rounded-md text-sm hover:bg-secondary/50 transition-colors group"
                            >
                              <span className="text-foreground truncate">{getBodyLabel(body)}</span>
                              <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </Link>
                          ))}
                          {remaining > 0 && (
                            <p className="text-xs text-muted-foreground pt-1">
                              + {remaining} weitere
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-5 border-t border-border/50">
        <div className="max-w-4xl mx-auto text-center text-xs text-muted-foreground">
          PolitikRadar Weekly · Prototyp · Daten via <a href="https://openparldata.ch" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">OpenParlData.ch</a> · CC BY 4.0
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
