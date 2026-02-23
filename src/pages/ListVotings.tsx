import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Vote, Search, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import VoteBar from "@/components/VoteBar";
import { useState, useEffect, useMemo } from "react";
import {
  getCurrentISOWeek,
  getWeekDateRange,
  formatDateRange,
  fetchBodies,
  fetchVotingsForWeek,
  isVotingAccepted,
  type Voting,
  type Body,
} from "@/lib/api/openparldata";

interface VotingWithBody extends Voting {
  bodyName: string;
}

const ListVotings = () => {
  const { year, week } = getCurrentISOWeek();
  const { from, to } = getWeekDateRange(year, week);
  const dateLabel = formatDateRange(from, to);

  const [votings, setVotings] = useState<VotingWithBody[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterBody, setFilterBody] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const bodies = await fetchBodies();
        const allVotings: VotingWithBody[] = [];
        const batchSize = 5;
        for (let i = 0; i < bodies.length; i += batchSize) {
          const batch = bodies.slice(i, i + batchSize);
          const results = await Promise.all(
            batch.map(async (b) => {
              const res = await fetchVotingsForWeek(from, to, b.key);
              return res.data.map((v) => ({ ...v, bodyName: b.name_de || b.key }));
            })
          );
          results.forEach((r) => allVotings.push(...r));
        }
        allVotings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setVotings(allVotings);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const bodyNames = useMemo(() => [...new Set(votings.map((v) => v.bodyName))].sort(), [votings]);

  const filtered = useMemo(() => {
    return votings.filter((v) => {
      const matchesSearch =
        !search ||
        (v.affair_title_de || v.title_de || "").toLowerCase().includes(search.toLowerCase());
      const matchesBody = !filterBody || v.bodyName === filterBody;
      return matchesSearch && matchesBody;
    });
  }, [votings, search, filterBody]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Zurück</span>
          </Link>
          <span className="text-xs text-muted-foreground">KW {week} · {dateLabel}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Vote className="w-5 h-5 text-muted-foreground" />
            <h1 className="font-serif text-2xl font-bold">Abstimmungen</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {loading ? "Laden…" : `${filtered.length} von ${votings.length} Abstimmungen`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Suchen…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={filterBody}
            onChange={(e) => setFilterBody(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Alle Parlamente</option>
            {bodyNames.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Lade Abstimmungen aus allen Parlamenten…</span>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((v) => {
              const accepted = isVotingAccepted(v);
              return (
                <Link
                  key={v.id}
                  to={`/detail/${v.id}?type=voting&body=${encodeURIComponent(v.body_key)}`}
                  className="block"
                >
                  <Card className="hover:bg-secondary/30 transition-colors">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {v.affair_title_de || v.title_de || `#${v.id}`}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px]">{v.bodyName}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(v.date).toLocaleDateString("de-CH")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <VoteBar ja={v.results_yes} nein={v.results_no} enthaltungen={v.results_abstention} compact />
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${accepted ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                          {v.results_yes}:{v.results_no}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">Keine Abstimmungen gefunden.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ListVotings;
