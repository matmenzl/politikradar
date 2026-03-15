import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Search, Vote, BarChart3, Calendar } from "lucide-react";
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
  fetchAffairsForWeek,
  fetchVotingsForWeek,
  isVotingAccepted,
  type Affair,
  type Voting,
} from "@/lib/api/openparldata";

interface AffairWithBody extends Affair {
  bodyName: string;
}
interface VotingWithBody extends Voting {
  bodyName: string;
}

type TabKey = "affairs" | "votings";

const MobileSearch = () => {
  const { year, week } = getCurrentISOWeek();
  const { from, to } = getWeekDateRange(year, week);
  const dateLabel = formatDateRange(from, to);

  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "votings" ? "votings" : "affairs";

  const [tab, setTab] = useState<TabKey>(initialTab);
  const [search, setSearch] = useState("");
  const [filterBody, setFilterBody] = useState(searchParams.get("body") || "");

  const [affairs, setAffairs] = useState<AffairWithBody[]>([]);
  const [votings, setVotings] = useState<VotingWithBody[]>([]);
  const [loadingAffairs, setLoadingAffairs] = useState(true);
  const [loadingVotings, setLoadingVotings] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const bodies = await fetchBodies();
        const allAffairs: AffairWithBody[] = [];
        const allVotings: VotingWithBody[] = [];
        const batchSize = 5;
        for (let i = 0; i < bodies.length; i += batchSize) {
          const batch = bodies.slice(i, i + batchSize);
          const [affairResults, votingResults] = await Promise.all([
            Promise.all(batch.map(async (b) => {
              const res = await fetchAffairsForWeek(from, to, b.key);
              return res.data.map((a) => ({ ...a, bodyName: b.name_de || b.key }));
            })),
            Promise.all(batch.map(async (b) => {
              const res = await fetchVotingsForWeek(from, to, b.key);
              return res.data.map((v) => ({ ...v, bodyName: b.name_de || b.key }));
            })),
          ]);
          affairResults.forEach((r) => allAffairs.push(...r));
          votingResults.forEach((r) => allVotings.push(...r));
        }
        allAffairs.sort((a, b) => new Date(b.begin_date || "").getTime() - new Date(a.begin_date || "").getTime());
        allVotings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setAffairs(allAffairs);
        setVotings(allVotings);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingAffairs(false);
        setLoadingVotings(false);
      }
    })();
  }, []);

  const bodyNames = useMemo(() => {
    const names = new Set<string>();
    affairs.forEach((a) => names.add(a.bodyName));
    votings.forEach((v) => names.add(v.bodyName));
    return [...names].sort();
  }, [affairs, votings]);

  const filteredAffairs = useMemo(() => {
    return affairs.filter((a) => {
      const matchesSearch = !search || (a.title_de || "").toLowerCase().includes(search.toLowerCase());
      const matchesBody = !filterBody || a.bodyName === filterBody || a.body_key === filterBody;
      return matchesSearch && matchesBody;
    });
  }, [affairs, search, filterBody]);

  const filteredVotings = useMemo(() => {
    return votings.filter((v) => {
      const matchesSearch = !search || (v.affair_title_de || v.title_de || "").toLowerCase().includes(search.toLowerCase());
      const matchesBody = !filterBody || v.bodyName === filterBody || v.body_key === filterBody;
      return matchesSearch && matchesBody;
    });
  }, [votings, search, filterBody]);

  const loading = tab === "affairs" ? loadingAffairs : loadingVotings;

  return (
    <div className="min-h-screen bg-background">
      {/* Compact sticky header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-serif text-base font-semibold text-foreground">Suche</span>
          </Link>
          <span className="text-[10px] text-muted-foreground">KW {week} · {dateLabel}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Tab toggle */}
        <div className="flex rounded-lg bg-secondary/50 p-1 gap-1">
          <button
            onClick={() => setTab("affairs")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "affairs"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Geschäfte
            {!loadingAffairs && (
              <span className="text-[10px] text-muted-foreground">({filteredAffairs.length})</span>
            )}
          </button>
          <button
            onClick={() => setTab("votings")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "votings"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Vote className="w-3.5 h-3.5" />
            Abstimmungen
            {!loadingVotings && (
              <span className="text-[10px] text-muted-foreground">({filteredVotings.length})</span>
            )}
          </button>
        </div>

        {/* Search + filter */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={tab === "affairs" ? "Geschäft suchen…" : "Abstimmung suchen…"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <select
            value={filterBody}
            onChange={(e) => setFilterBody(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="">Alle Parlamente</option>
            {bodyNames.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Laden…</span>
          </div>
        ) : tab === "affairs" ? (
          <div className="space-y-2">
            {filteredAffairs.map((a) => (
              <Link
                key={a.id}
                to={`/detail/${a.id}?type=affair&body=${encodeURIComponent(a.body_key)}`}
                className="block"
              >
                <Card className="hover:bg-secondary/30 active:bg-secondary/50 transition-colors">
                  <CardContent className="p-3">
                    <p className="text-sm font-medium text-foreground line-clamp-2">
                      {a.title_de || `#${a.id}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">{a.bodyName}</Badge>
                      {a.type_de && <Badge variant="secondary" className="text-[10px]">{a.type_de}</Badge>}
                      {a.begin_date && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {new Date(a.begin_date).toLocaleDateString("de-CH")}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {filteredAffairs.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">Keine Geschäfte gefunden.</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredVotings.map((v) => {
              const accepted = isVotingAccepted(v);
              return (
                <Link
                  key={v.id}
                  to={`/detail/${v.id}?type=voting&body=${encodeURIComponent(v.body_key)}`}
                  className="block"
                >
                  <Card className="hover:bg-secondary/30 active:bg-secondary/50 transition-colors">
                    <CardContent className="p-3">
                      <p className="text-sm font-medium text-foreground line-clamp-2">
                        {v.affair_title_de || v.title_de || `#${v.id}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">{v.bodyName}</Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(v.date).toLocaleDateString("de-CH")}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                            accepted
                              ? "bg-success/10 text-success"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {v.results_yes}:{v.results_no}
                        </span>
                      </div>
                      <div className="mt-2">
                        <VoteBar ja={v.results_yes} nein={v.results_no} enthaltungen={v.results_abstention} compact />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
            {filteredVotings.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">Keine Abstimmungen gefunden.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default MobileSearch;
