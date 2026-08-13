import { Link } from "react-router-dom";
import { ArrowRight, Building2, Landmark, MapPin, Loader2, Search } from "lucide-react";
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

const ParliamentBrowser = () => {
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
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-serif text-2xl md:text-3xl font-normal text-foreground">
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
                className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-accent/40 transition-all group bg-card"
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
  );
};

export default ParliamentBrowser;
