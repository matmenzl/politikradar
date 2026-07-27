import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Building2, Search, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import {
  getWeekDateRange,
  formatDateRange,
  fetchBodies,
  fetchVotingsForWeek,
  fetchAffairsForWeek,
  fetchMeetingsForWeek,
  groupBodiesByLevel,
  LEVEL_LABELS,
  type Body,
} from "@/lib/api/openparldata";
import { useWeekParam } from "@/hooks/use-week";

interface BodyWithStats extends Body {
  votings: number;
  affairs: number;
  meetings: number;
}

const ListBodies = () => {
  const { year, week, withWeek } = useWeekParam();
  const { from, to } = getWeekDateRange(year, week);
  const dateLabel = formatDateRange(from, to);

  const [bodies, setBodies] = useState<BodyWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("");

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const allBodies = await fetchBodies();
        const withStats: BodyWithStats[] = [];
        const batchSize = 5;

        for (let i = 0; i < allBodies.length; i += batchSize) {
          const batch = allBodies.slice(i, i + batchSize);
          const results = await Promise.all(
            batch.map(async (b) => {
              const [v, a, m] = await Promise.all([
                fetchVotingsForWeek(from, to, b.key),
                fetchAffairsForWeek(from, to, b.key),
                fetchMeetingsForWeek(from, to, b.key),
              ]);
              return { ...b, votings: v.total, affairs: a.total, meetings: m.total };
            })
          );
          withStats.push(...results);
        }

        // Only show bodies with activity
        const active = withStats.filter((b) => b.votings > 0 || b.affairs > 0 || b.meetings > 0);
        active.sort((a, b) => (b.votings + b.affairs + b.meetings) - (a.votings + a.affairs + a.meetings));
        setBodies(active);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [from, to]);

  const levels = useMemo(() => {
    const s = new Set(bodies.map((b) => {
      if (b.type === "country") return "national";
      if (b.type === "canton") return "cantonal";
      if (b.type === "city" || b.type === "municipality") return "communal";
      return "other";
    }));
    return [...s];
  }, [bodies]);

  const filtered = useMemo(() => {
    return bodies.filter((b) => {
      const matchesSearch = !search || (b.name_de || b.key).toLowerCase().includes(search.toLowerCase());
      const level = b.type === "country" ? "national" : b.type === "canton" ? "cantonal" : (b.type === "city" || b.type === "municipality") ? "communal" : "other";
      const matchesLevel = !filterLevel || level === filterLevel;
      return matchesSearch && matchesLevel;
    });
  }, [bodies, search, filterLevel]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to={withWeek("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Zurück</span>
          </Link>
          <span className="text-xs text-muted-foreground">KW {week} · {dateLabel}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            <h1 className="font-serif text-2xl font-bold">Aktive Parlamente</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {loading ? "Laden…" : `${filtered.length} Parlamente mit Aktivität diese Woche`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Suchen…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Alle Ebenen</option>
            {levels.map((l) => <option key={l} value={l}>{LEVEL_LABELS[l] || l}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Prüfe Aktivität aller Parlamente…</span>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((b) => (
              <Link key={b.key} to={withWeek(`/weekly?body=${encodeURIComponent(b.key)}`)} className="block">
                <Card className="hover:bg-secondary/30 transition-colors">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{b.name_de || b.key}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {b.canton && <Badge variant="outline" className="text-[10px]">{b.canton}</Badge>}
                        <Badge variant="secondary" className="text-[10px]">
                          {LEVEL_LABELS[b.type === "country" ? "national" : b.type === "canton" ? "cantonal" : "communal"] || b.type}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-4 text-center shrink-0">
                      <div>
                        <p className="text-lg font-bold text-foreground">{b.votings}</p>
                        <p className="text-[10px] text-muted-foreground">Abstimmungen</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{b.affairs}</p>
                        <p className="text-[10px] text-muted-foreground">Geschäfte</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{b.meetings}</p>
                        <p className="text-[10px] text-muted-foreground">Sitzungen</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">Keine aktiven Parlamente gefunden.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ListBodies;
