import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Activity, Search, MapPin, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useMemo } from "react";
import {
  getWeekDateRange,
  formatDateRange,
  fetchBodies,
  fetchMeetingsForWeek,
  type Meeting,
} from "@/lib/api/openparldata";
import { useWeekParam } from "@/hooks/use-week";

interface MeetingWithBody extends Meeting {
  bodyName: string;
}

const ListMeetings = () => {
  const { year, week, withWeek } = useWeekParam();
  const { from, to } = getWeekDateRange(year, week);
  const dateLabel = formatDateRange(from, to);

  const [meetings, setMeetings] = useState<MeetingWithBody[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [filterBody, setFilterBody] = useState(searchParams.get("body") || "");

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const bodies = await fetchBodies();
        const all: MeetingWithBody[] = [];
        const batchSize = 5;
        for (let i = 0; i < bodies.length; i += batchSize) {
          const batch = bodies.slice(i, i + batchSize);
          const results = await Promise.all(
            batch.map(async (b) => {
              const res = await fetchMeetingsForWeek(from, to, b.key);
              return res.data.map((m) => ({ ...m, bodyName: b.name_de || b.key }));
            })
          );
          results.forEach((r) => all.push(...r));
        }
        all.sort((a, b) => new Date(b.begin_date || "").getTime() - new Date(a.begin_date || "").getTime());
        setMeetings(all);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [from, to]);

  const bodyNames = useMemo(() => [...new Set(meetings.map((m) => m.bodyName))].sort(), [meetings]);

  const filtered = useMemo(() => {
    return meetings.filter((m) => {
      const matchesSearch = !search || (m.name_de || "").toLowerCase().includes(search.toLowerCase());
      const matchesBody = !filterBody || m.bodyName === filterBody || m.body_key === filterBody;
      return matchesSearch && matchesBody;
    });
  }, [meetings, search, filterBody]);

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
            <Activity className="w-5 h-5 text-muted-foreground" />
            <h1 className="font-serif text-2xl font-normal">Sitzungen</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {loading ? "Laden…" : `${filtered.length} von ${meetings.length} Sitzungen`}
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
            <span className="ml-2 text-sm text-muted-foreground">Lade Sitzungen aus allen Parlamenten…</span>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((m) => (
              <Card key={m.id} className="hover:bg-secondary/30 transition-colors">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-foreground">{m.name_de || `Sitzung #${m.id}`}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">{m.bodyName}</Badge>
                    {m.begin_date && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(m.begin_date).toLocaleDateString("de-CH")}
                      </span>
                    )}
                    {m.location && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {m.location}
                      </span>
                    )}
                    {m.state && <Badge variant="secondary" className="text-[10px]">{m.state}</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">Keine Sitzungen gefunden.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ListMeetings;
