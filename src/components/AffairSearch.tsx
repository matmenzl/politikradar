import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { BASE_URL, type SearchResult } from "@/components/admin/shared";

/** Public research tool: search affairs and votings across all parliaments. */
const AffairSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      const [affairsRes, votingsRes] = await Promise.all([
        fetch(`${BASE_URL}/affairs?lang=de&lang_format=flat&limit=10&search=${encodeURIComponent(query)}`).then((r) => r.json()),
        fetch(`${BASE_URL}/votings?lang=de&lang_format=flat&limit=10&search=${encodeURIComponent(query)}`).then((r) => r.json()),
      ]);
      const list: SearchResult[] = [];
      for (const a of affairsRes.data || []) {
        list.push({
          id: a.id,
          title: a.title_de || a.title_fr || `Geschäft #${a.id}`,
          bodyKey: a.body_key,
          type: "affair",
          date: a.begin_date,
          status: a.status_de,
        });
      }
      for (const v of votingsRes.data || []) {
        list.push({
          id: v.id,
          title: v.affair_title_de || v.title_de || `Abstimmung #${v.id}`,
          bodyKey: v.body_key,
          type: "voting",
          date: v.date,
          results_yes: v.results_yes,
          results_no: v.results_no,
        });
      }
      setResults(list);
    } catch {
      toast.error("Suche fehlgeschlagen");
    } finally {
      setSearching(false);
      setSearched(true);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-xl">Geschäfte suchen</CardTitle>
        <CardDescription>
          Durchsuche alle Parlamente nach Geschäften und Abstimmungen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            search();
          }}
          className="flex gap-2"
        >
          <Input
            placeholder="Stichwort, z.B. Klima, Steuern, Velo…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" disabled={searching || !query.trim()}>
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span className="ml-1 hidden sm:inline">Suchen</span>
          </Button>
        </form>

        {searched && !searching && results.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Keine Treffer gefunden.
          </p>
        )}

        {results.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((r) => (
              <Link
                key={`${r.type}-${r.id}`}
                to={`/detail/${r.id}?type=${r.type}&body=${encodeURIComponent(r.bodyKey)}`}
                className="block p-3 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">
                    {r.type === "affair" ? "Geschäft" : "Abstimmung"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{r.bodyKey}</span>
                  {r.date && <span className="text-xs text-muted-foreground">{r.date}</span>}
                  {r.results_yes != null && r.results_no != null && (
                    <span className="text-xs font-medium text-muted-foreground">
                      {r.results_yes}:{r.results_no}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-foreground line-clamp-2">{r.title}</p>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AffairSearch;
