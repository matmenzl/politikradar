import { Link } from "react-router-dom";
import { ArrowRight, Building2, Landmark, MapPin, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useMemo } from "react";
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

const LEVEL_FILTERS = [
  { key: "all", label: "Alle" },
  { key: "national", label: "National" },
  { key: "cantonal", label: "Kantonal" },
  { key: "communal", label: "Kommunal" },
] as const;

const LandingPage = () => {
  const [bodies, setBodies] = useState<Body[]>([]);
  const [loadingBodies, setLoadingBodies] = useState(true);
  const [activeLevel, setActiveLevel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchBodies()
      .then(setBodies)
      .catch(console.error)
      .finally(() => setLoadingBodies(false));
  }, []);

  const grouped = groupBodiesByLevel(bodies);

  const filteredBodies = useMemo(() => {
    let result: Body[] = [];

    if (activeLevel === "all") {
      result = bodies;
    } else {
      result = grouped[activeLevel] || [];
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((b) =>
        getBodyLabel(b).toLowerCase().includes(q) ||
        (b.canton_key && b.canton_key.toLowerCase().includes(q)) ||
        (b.canton && b.canton.toLowerCase().includes(q))
      );
    }

    return result.sort((a, b) => getBodyLabel(a).localeCompare(getBodyLabel(b)));
  }, [bodies, grouped, activeLevel, searchQuery]);

  const levelCounts = useMemo(() => ({
    all: bodies.length,
    national: grouped["national"]?.length || 0,
    cantonal: grouped["cantonal"]?.length || 0,
    communal: grouped["communal"]?.length || 0,
  }), [bodies, grouped]);

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

            {/* Filter Tabs */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50">
                {LEVEL_FILTERS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveLevel(key)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      activeLevel === key
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      {levelCounts[key as keyof typeof levelCounts] || 0}
                    </span>
                  </button>
                ))}
              </div>

              <div className="relative flex-1 w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Parlament suchen…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>

            {loadingBodies ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Lade Parlamente…</span>
              </div>
            ) : filteredBodies.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchQuery ? `Keine Parlamente gefunden für «${searchQuery}»` : "Keine Parlamente in dieser Kategorie."}
                </p>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {filteredBodies.map((body) => {
                  const level = body.level || (body.type === "country" ? "national" : body.type === "canton" ? "cantonal" : body.type === "city" || body.type === "municipality" ? "communal" : "other");
                  return (
                    <Link
                      key={body.id}
                      to={`/weekly?body=${body.key}`}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-accent/40 hover:shadow-md transition-all group bg-card"
                    >
                      <div className="text-accent flex-shrink-0">
                        {LEVEL_ICONS[level] || <Building2 className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{getBodyLabel(body)}</p>
                        <p className="text-xs text-muted-foreground">
                          {LEVEL_LABELS[level] || level}
                          {body.canton_key && ` · ${body.canton_key}`}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}

            {!loadingBodies && filteredBodies.length > 0 && (
              <p className="text-center text-xs text-muted-foreground">
                {filteredBodies.length} {filteredBodies.length === 1 ? "Parlament" : "Parlamente"} angezeigt
              </p>
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
