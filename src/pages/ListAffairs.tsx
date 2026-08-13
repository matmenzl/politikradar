import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, BarChart3, Search, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useMemo } from "react";
import {
  getWeekDateRange,
  formatDateRange,
  fetchBodies,
  fetchAllAffairsInRange,
  type Affair,
} from "@/lib/api/openparldata";

import { useWeekParam } from "@/hooks/use-week";

interface AffairWithBody extends Affair {
  bodyName: string;
}

const ListAffairs = () => {
  const { year, week, withWeek } = useWeekParam();
  const { from, to } = getWeekDateRange(year, week);
  const dateLabel = formatDateRange(from, to);

  const [affairs, setAffairs] = useState<AffairWithBody[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [filterBody, setFilterBody] = useState(searchParams.get("body") || "");

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const [bodies, rows] = await Promise.all([
          fetchBodies(),
          fetchAllAffairsInRange(from, to),
        ]);
        const nameByKey = new Map(bodies.map((b) => [b.key, b.name_de || b.key]));
        const all: AffairWithBody[] = rows
          .filter((a) => nameByKey.has(a.body_key))
          .map((a) => ({ ...a, bodyName: nameByKey.get(a.body_key)! }));

        all.sort((a, b) => new Date(b.begin_date || "").getTime() - new Date(a.begin_date || "").getTime());
        setAffairs(all);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [from, to]);

  const bodyNames = useMemo(() => [...new Set(affairs.map((a) => a.bodyName))].sort(), [affairs]);

  const filtered = useMemo(() => {
    return affairs.filter((a) => {
      const matchesSearch = !search || (a.title_de || "").toLowerCase().includes(search.toLowerCase());
      const matchesBody = !filterBody || a.bodyName === filterBody || a.body_key === filterBody;
      return matchesSearch && matchesBody;
    });
  }, [affairs, search, filterBody]);

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
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
            <h1 className="font-serif text-2xl font-normal">Geschäfte</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {loading ? "Laden…" : `${filtered.length} von ${affairs.length} Geschäften`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Suchen…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <select
            value={filterBody}
            onChange={(e) => setFilterBody(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Alle Parlamente</option>
            {bodyNames.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Lade Geschäfte aus allen Parlamenten…</span>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((a) => (
              <Link key={a.id} to={`/detail/${a.id}?type=affair&body=${encodeURIComponent(a.body_key)}`} className="block">
                <Card className="hover:bg-secondary/30 transition-colors">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-foreground truncate">{a.title_de || `#${a.id}`}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">{a.bodyName}</Badge>
                      {a.type_de && <Badge variant="secondary" className="text-[10px]">{a.type_de}</Badge>}
                      {a.begin_date && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(a.begin_date).toLocaleDateString("de-CH")}
                        </span>
                      )}
                      {a.status_de && <span className="text-xs text-muted-foreground">· {a.status_de}</span>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">Keine Geschäfte gefunden.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ListAffairs;
