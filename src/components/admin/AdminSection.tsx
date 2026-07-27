import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Sparkles, Trash2, Eye, EyeOff, Lock, Vote, BarChart3, Calendar, TrendingUp, Zap, Lightbulb, Share2 } from "lucide-react";
import { toast } from "sonner";
import VoteBar from "@/components/VoteBar";
import type { StorySlide } from "@/components/StoryPreviewModal";
import StoryPreviewModal from "@/components/StoryPreviewModal";
import {
  getCurrentISOWeek,
  getWeekDateRange,
  fetchBodies,
  fetchAffairsForWeek,
  fetchVotingsForWeek,
  isVotingAccepted,
  type Affair,
  type Voting,
} from "@/lib/api/openparldata";

export interface StoryPost {
  id: string;
  title: string;
  body_key: string | null;
  affair_id: string | null;
  voting_id: string | null;
  slides: StorySlide[];
  status: string;
  created_at: string;
  published_at: string | null;
}

interface SearchResult {
  id: number;
  title: string;
  bodyKey: string;
  bodyName?: string;
  type: "affair" | "voting";
  date?: string;
  status?: string;
  results_yes?: number;
  results_no?: number;
}

interface AffairWithBody extends Affair {
  bodyName: string;
}
interface VotingWithBody extends Voting {
  bodyName: string;
}

const BASE_URL = "https://api.openparldata.ch/v1";

/* ─── PIN gate + dashboard ─── */

const AdminSection = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("admin_auth") === "true") {
      setAuthenticated(true);
    }
  }, []);

  const verifyPin = async () => {
    setPinLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-admin-pin", {
        body: { pin },
      });
      if (error) throw error;
      if (data?.valid) {
        sessionStorage.setItem("admin_auth", "true");
        setAuthenticated(true);
        toast.success("Zugang gewährt");
      } else {
        toast.error("Falsches Passwort");
      }
    } catch {
      toast.error("Fehler bei der Überprüfung");
    } finally {
      setPinLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="flex justify-center py-8">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <CardTitle className="font-serif">Admin-Bereich</CardTitle>
            <CardDescription>Bitte Passwort eingeben</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                verifyPin();
              }}
              className="space-y-3"
            >
              <Input
                type="password"
                placeholder="Passwort"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
              <Button type="submit" className="w-full" disabled={pinLoading || !pin}>
                {pinLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Anmelden
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Share2 className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Admin</span>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
            Social-Media-Redaktion
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            sessionStorage.removeItem("admin_auth");
            setAuthenticated(false);
          }}
        >
          Abmelden
        </Button>
      </div>
      <AdminDashboard />
    </div>
  );
};

/* ─── Browse Section: affairs & votings with tabs ─── */

function BrowseSection({
  onSelectItem,
  generatingId,
  affairs,
  votings,
  loadingAffairs,
  loadingVotings,
}: {
  onSelectItem: (item: SearchResult) => void;
  generatingId: string | null;
  affairs: AffairWithBody[];
  votings: VotingWithBody[];
  loadingAffairs: boolean;
  loadingVotings: boolean;
}) {
  type TabKey = "affairs" | "votings";
  const [tab, setTab] = useState<TabKey>("affairs");
  const [search, setSearch] = useState("");
  const [filterBody, setFilterBody] = useState("");

  const bodyNames = useMemo(() => {
    const names = new Set<string>();
    affairs.forEach((a) => names.add(a.bodyName));
    votings.forEach((v) => names.add(v.bodyName));
    return [...names].sort();
  }, [affairs, votings]);

  const filteredAffairs = useMemo(() => {
    return affairs.filter((a) => {
      const ms = !search || (a.title_de || "").toLowerCase().includes(search.toLowerCase());
      const mb = !filterBody || a.bodyName === filterBody;
      return ms && mb;
    });
  }, [affairs, search, filterBody]);

  const filteredVotings = useMemo(() => {
    return votings.filter((v) => {
      const ms = !search || (v.affair_title_de || v.title_de || "").toLowerCase().includes(search.toLowerCase());
      const mb = !filterBody || v.bodyName === filterBody;
      return ms && mb;
    });
  }, [votings, search, filterBody]);

  const loading = tab === "affairs" ? loadingAffairs : loadingVotings;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-xl">Geschäfte & Abstimmungen durchsuchen</CardTitle>
        <CardDescription>
          Aktuelle Woche – wähle ein Element, um eine Story zu generieren oder Details anzusehen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tabs */}
        <div className="flex rounded-lg bg-secondary/50 p-1 gap-1">
          <button
            onClick={() => setTab("affairs")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "affairs" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Geschäfte
            {!loadingAffairs && <span className="text-[10px] text-muted-foreground">({filteredAffairs.length})</span>}
          </button>
          <button
            onClick={() => setTab("votings")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "votings" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Vote className="w-3.5 h-3.5" />
            Abstimmungen
            {!loadingVotings && <span className="text-[10px] text-muted-foreground">({filteredVotings.length})</span>}
          </button>
        </div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={tab === "affairs" ? "Geschäft suchen…" : "Abstimmung suchen…"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <select
            value={filterBody}
            onChange={(e) => setFilterBody(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="">Alle Parlamente</option>
            {bodyNames.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Laden…</span>
          </div>
        ) : tab === "affairs" ? (
          <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
            {filteredAffairs.map((a) => {
              const key = `affair-${a.id}`;
              return (
                <div key={a.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors">
                  <Link to={`/detail/${a.id}?type=affair&body=${encodeURIComponent(a.body_key)}`} className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-2">{a.title_de || `#${a.id}`}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">{a.bodyName}</Badge>
                      {a.type_de && <Badge variant="secondary" className="text-[10px]">{a.type_de}</Badge>}
                      {a.begin_date && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {new Date(a.begin_date).toLocaleDateString("de-CH")}
                        </span>
                      )}
                    </div>
                  </Link>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="shrink-0 h-8"
                    disabled={generatingId === key}
                    onClick={() =>
                      onSelectItem({
                        id: a.id,
                        title: a.title_de || `Geschäft #${a.id}`,
                        bodyKey: a.body_key,
                        bodyName: a.bodyName,
                        type: "affair",
                        date: a.begin_date,
                        status: a.status_de,
                      })
                    }
                  >
                    {generatingId === key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              );
            })}
            {filteredAffairs.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-6">Keine Geschäfte gefunden.</p>
            )}
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
            {filteredVotings.map((v) => {
              const accepted = isVotingAccepted(v);
              const key = `voting-${v.id}`;
              return (
                <div key={v.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors">
                  <Link to={`/detail/${v.id}?type=voting&body=${encodeURIComponent(v.body_key)}`} className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-2">
                      {v.affair_title_de || v.title_de || `#${v.id}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">{v.bodyName}</Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(v.date).toLocaleDateString("de-CH")}
                      </span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${accepted ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                        {v.results_yes}:{v.results_no}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <VoteBar ja={v.results_yes} nein={v.results_no} enthaltungen={v.results_abstention} compact />
                    </div>
                  </Link>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="shrink-0 h-8"
                    disabled={generatingId === key}
                    onClick={() =>
                      onSelectItem({
                        id: v.id,
                        title: v.affair_title_de || v.title_de || `Abstimmung #${v.id}`,
                        bodyKey: v.body_key,
                        bodyName: v.bodyName,
                        type: "voting",
                        date: v.date,
                        results_yes: v.results_yes,
                        results_no: v.results_no,
                      })
                    }
                  >
                    {generatingId === key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              );
            })}
            {filteredVotings.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-6">Keine Abstimmungen gefunden.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── AI Suggestions Section ─── */

interface AISuggestion {
  index: number;
  score: number;
  reason: string;
  hook_idea: string;
}

interface SuggestableItem {
  id: number;
  title: string;
  bodyKey: string;
  bodyName: string;
  type: "affair" | "voting";
  date?: string;
  status?: string;
  results_yes?: number;
  results_no?: number;
}

function AISuggestionsSection({
  affairs,
  votings,
  loadingData,
  onSelectItem,
  generatingId,
}: {
  affairs: AffairWithBody[];
  votings: VotingWithBody[];
  loadingData: boolean;
  onSelectItem: (item: SearchResult) => void;
  generatingId: string | null;
}) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [items, setItems] = useState<SuggestableItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const generateSuggestions = async () => {
    const combined: SuggestableItem[] = [];
    for (const v of votings) {
      combined.push({
        id: v.id,
        title: v.affair_title_de || v.title_de || `#${v.id}`,
        bodyKey: v.body_key,
        bodyName: v.bodyName,
        type: "voting",
        date: v.date,
        results_yes: v.results_yes,
        results_no: v.results_no,
      });
    }
    for (const a of affairs) {
      combined.push({
        id: a.id,
        title: a.title_de || `#${a.id}`,
        bodyKey: a.body_key,
        bodyName: a.bodyName,
        type: "affair",
        date: a.begin_date,
        status: a.status_de,
      });
    }

    if (combined.length === 0) {
      toast.error("Keine Geschäfte oder Abstimmungen in dieser Woche geladen. Bitte warte, bis die Daten geladen sind, oder wechsle die Woche.");
      return;
    }

    setLoading(true);
    setSuggestions([]);

    const subset = combined.slice(0, 50);
    setItems(subset);

    try {
      const { data, error } = await supabase.functions.invoke("suggest-stories", {
        body: { items: subset },
      });
      if (error) throw error;
      if (data?.suggestions) {
        const sorted = [...data.suggestions].sort((a: AISuggestion, b: AISuggestion) => b.score - a.score);
        setSuggestions(sorted);
      }
    } catch (e: any) {
      toast.error(e.message || "Fehler bei KI-Analyse");
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 8) return "bg-success/15 text-success border-success/30";
    if (score >= 6) return "bg-accent/15 text-accent border-accent/30";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-accent" />
              <CardTitle className="font-serif text-xl">KI-Vorschläge</CardTitle>
            </div>
            <CardDescription>
              KI analysiert Geschäfte & Abstimmungen nach Social-Media-Potenzial
            </CardDescription>
          </div>
          <Button
            onClick={generateSuggestions}
            disabled={loading || loadingData}
            size="sm"
            className="gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {hasLoaded ? "Neu analysieren" : "Analysieren"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
            <span className="text-sm text-muted-foreground">KI analysiert {items.length} Geschäfte…</span>
          </div>
        ) : !hasLoaded ? (
          <div className="text-center py-8">
            <Lightbulb className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Klicke «Analysieren», um die besten Geschäfte für Social Media zu finden.
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Kriterien: Knappe Abstimmungen, kontroverse Themen, Alltagsrelevanz
            </p>
          </div>
        ) : suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Keine Vorschläge generiert.</p>
        ) : (
          <div className="space-y-3">
            {suggestions.map((s, idx) => {
              const item = items[s.index - 1];
              if (!item) return null;
              const key = `${item.type}-${item.id}`;
              return (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border text-sm font-bold ${scoreColor(s.score)}`}>
                      {s.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-2">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">{item.bodyName}</Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {item.type === "voting" ? "Abstimmung" : "Geschäft"}
                        </Badge>
                        {item.results_yes != null && item.results_no != null && (
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {item.results_yes}:{item.results_no}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{s.reason}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Lightbulb className="w-3 h-3 text-accent shrink-0" />
                        <span className="text-xs text-accent font-medium italic">«{s.hook_idea}»</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="shrink-0 h-8 gap-1"
                      disabled={generatingId === key}
                      onClick={() =>
                        onSelectItem({
                          id: item.id,
                          title: item.title,
                          bodyKey: item.bodyKey,
                          bodyName: item.bodyName,
                          type: item.type,
                          date: item.date,
                          status: item.status,
                          results_yes: item.results_yes,
                          results_no: item.results_no,
                        })
                      }
                    >
                      {generatingId === key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">Story</span>
                    </Button>
                  </div>
                </div>
              );
            })}
            <p className="text-[10px] text-muted-foreground text-center opacity-70 mt-2">
              Erstellt mit KI · Vorschläge basieren auf Titel und Abstimmungsdaten
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Story list row ─── */

function StoryRow({
  story,
  onPreview,
  onTogglePublish,
  onDelete,
}: {
  story: StoryPost;
  onPreview: (s: StoryPost) => void;
  onTogglePublish: (s: StoryPost) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
      <div className="flex-1 min-w-0 mr-3">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant={story.status === "published" ? "default" : "secondary"} className="text-[10px]">
            {story.status === "published" ? "Live" : "Entwurf"}
          </Badge>
          {story.body_key && <span className="text-xs text-muted-foreground">{story.body_key}</span>}
          <span className="text-xs text-muted-foreground">{story.slides.length} Slides</span>
        </div>
        <p className="text-sm font-medium text-foreground truncate">{story.title}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onPreview(story)} title="Vorschau">
          <Eye className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onTogglePublish(story)}
          title={story.status === "published" ? "Zurückziehen" : "Veröffentlichen"}
        >
          {story.status === "published" ? <EyeOff className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(story.id)}
          title="Löschen"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Admin Dashboard ─── */

function AdminDashboard() {
  const [stories, setStories] = useState<StoryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [previewStory, setPreviewStory] = useState<StoryPost | null>(null);

  const [affairs, setAffairs] = useState<AffairWithBody[]>([]);
  const [votings, setVotings] = useState<VotingWithBody[]>([]);
  const [loadingAffairs, setLoadingAffairs] = useState(true);
  const [loadingVotings, setLoadingVotings] = useState(true);

  useEffect(() => {
    const { year, week } = getCurrentISOWeek();
    const current = getWeekDateRange(year, week);
    // Extend window: include previous week so Monday/early-week views still have data
    const prevWeekNum = week > 1 ? week - 1 : 52;
    const prevYear = week > 1 ? year : year - 1;
    const prev = getWeekDateRange(prevYear, prevWeekNum);
    const from = prev.from;
    const to = current.to;
    (async () => {
      try {
        const bodies = await fetchBodies();
        const allA: AffairWithBody[] = [];
        const allV: VotingWithBody[] = [];
        const batchSize = 5;
        for (let i = 0; i < bodies.length; i += batchSize) {
          const batch = bodies.slice(i, i + batchSize);
          const [aRes, vRes] = await Promise.all([
            Promise.all(batch.map(async (b) => {
              const res = await fetchAffairsForWeek(from, to, b.key);
              return res.data.map((a) => ({ ...a, bodyName: b.name_de || b.key }));
            })),
            Promise.all(batch.map(async (b) => {
              const res = await fetchVotingsForWeek(from, to, b.key);
              return res.data.map((v) => ({ ...v, bodyName: b.name_de || b.key }));
            })),
          ]);
          aRes.forEach((r) => allA.push(...r));
          vRes.forEach((r) => allV.push(...r));
        }
        allA.sort((a, b) => new Date(b.begin_date || "").getTime() - new Date(a.begin_date || "").getTime());
        allV.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setAffairs(allA);
        setVotings(allV);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingAffairs(false);
        setLoadingVotings(false);
      }
    })();
  }, []);

  const loadStories = useCallback(async () => {
    const { data } = await supabase
      .from("story_posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setStories(
        data.map((d) => ({
          ...d,
          slides: (d.slides as unknown as StorySlide[]) || [],
        })) as StoryPost[]
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  // Split stories into current week vs. older
  const { weekStories, olderStories } = useMemo(() => {
    const { year, week } = getCurrentISOWeek();
    const { from, to } = getWeekDateRange(year, week);
    const fromTs = new Date(from).getTime();
    const toTs = new Date(to).getTime() + 24 * 60 * 60 * 1000;
    const inWeek: StoryPost[] = [];
    const older: StoryPost[] = [];
    for (const s of stories) {
      const ts = new Date(s.published_at || s.created_at).getTime();
      if (ts >= fromTs && ts < toTs) inWeek.push(s);
      else older.push(s);
    }
    return { weekStories: inWeek, olderStories: older };
  }, [stories]);

  const searchOpenParlData = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const [affairsRes, votingsRes] = await Promise.all([
        fetch(`${BASE_URL}/affairs?lang=de&lang_format=flat&limit=10&search=${encodeURIComponent(searchQuery)}`).then((r) => r.json()),
        fetch(`${BASE_URL}/votings?lang=de&lang_format=flat&limit=10&search=${encodeURIComponent(searchQuery)}`).then((r) => r.json()),
      ]);

      const results: SearchResult[] = [];
      for (const a of affairsRes.data || []) {
        results.push({
          id: a.id,
          title: a.title_de || a.title_fr || `Geschäft #${a.id}`,
          bodyKey: a.body_key,
          type: "affair",
          date: a.begin_date,
          status: a.status_de,
        });
      }
      for (const v of votingsRes.data || []) {
        results.push({
          id: v.id,
          title: v.affair_title_de || v.title_de || `Abstimmung #${v.id}`,
          bodyKey: v.body_key,
          type: "voting",
          date: v.date,
          results_yes: v.results_yes,
          results_no: v.results_no,
        });
      }
      setSearchResults(results);
    } catch {
      toast.error("Suche fehlgeschlagen");
    } finally {
      setSearching(false);
    }
  };

  const generateStory = async (result: SearchResult) => {
    const key = `${result.type}-${result.id}`;
    setGeneratingId(key);
    try {
      let parliamentName = result.bodyName;
      if (!parliamentName && result.bodyKey) {
        try {
          const bodies = await fetchBodies();
          const body = bodies.find((b) => b.key === result.bodyKey);
          parliamentName = body ? (body.name_de || body.key) : result.bodyKey;
        } catch {
          parliamentName = result.bodyKey;
        }
      }

      const body: Record<string, unknown> = { title: result.title, parliament: parliamentName };
      if (result.type === "voting" && result.results_yes != null) {
        body.votingResults = {
          yes: result.results_yes,
          no: result.results_no,
        };
      }

      const { data, error } = await supabase.functions.invoke("generate-story", { body });
      if (error) throw error;
      if (!data?.slides) throw new Error("Keine Slides generiert");

      const { error: insertErr } = await supabase.from("story_posts").insert({
        title: result.title,
        body_key: result.bodyKey,
        affair_id: result.type === "affair" ? String(result.id) : null,
        voting_id: result.type === "voting" ? String(result.id) : null,
        slides: data.slides,
        status: "draft",
      });
      if (insertErr) throw insertErr;

      toast.success("Story erstellt (Entwurf)");
      loadStories();
    } catch (e: any) {
      toast.error(e.message || "Fehler beim Generieren");
    } finally {
      setGeneratingId(null);
    }
  };

  const togglePublish = async (story: StoryPost) => {
    const newStatus = story.status === "published" ? "draft" : "published";
    const { error } = await supabase
      .from("story_posts")
      .update({
        status: newStatus,
        published_at: newStatus === "published" ? new Date().toISOString() : null,
      })
      .eq("id", story.id);
    if (error) {
      toast.error("Fehler beim Aktualisieren");
      return;
    }
    toast.success(newStatus === "published" ? "Veröffentlicht" : "Zurückgezogen");
    loadStories();
  };

  const deleteStory = async (id: string) => {
    const { error } = await supabase.from("story_posts").delete().eq("id", id);
    if (error) {
      toast.error("Fehler beim Löschen");
      return;
    }
    toast.success("Story gelöscht");
    loadStories();
  };

  return (
    <div className="space-y-8">
      {/* Social media posts of the current week */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-xl">Social-Media-Posts dieser Woche</CardTitle>
          <CardDescription>
            {loading
              ? "Wird geladen…"
              : `${weekStories.length} Post${weekStories.length === 1 ? "" : "s"} · ${weekStories.filter((s) => s.status === "published").length} veröffentlicht`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : weekStories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Diese Woche wurden noch keine Posts erstellt.
            </p>
          ) : (
            <div className="space-y-3">
              {weekStories.map((story) => (
                <StoryRow
                  key={story.id}
                  story={story}
                  onPreview={setPreviewStory}
                  onTogglePublish={togglePublish}
                  onDelete={deleteStory}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI suggestions */}
      <AISuggestionsSection
        affairs={affairs}
        votings={votings}
        loadingData={loadingAffairs || loadingVotings}
        onSelectItem={generateStory}
        generatingId={generatingId}
      />

      {/* Browse affairs & votings */}
      <BrowseSection
        onSelectItem={generateStory}
        generatingId={generatingId}
        affairs={affairs}
        votings={votings}
        loadingAffairs={loadingAffairs}
        loadingVotings={loadingVotings}
      />

      {/* Quick search (API-wide) */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">API-Suche</CardTitle>
          <CardDescription>
            Suche über alle Zeiträume nach Geschäften oder Abstimmungen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              searchOpenParlData();
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="Geschäft oder Abstimmung suchen…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" disabled={searching || !searchQuery.trim()}>
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </form>

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {searchResults.map((r) => {
                const key = `${r.type}-${r.id}`;
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px]">
                          {r.type === "affair" ? "Geschäft" : "Abstimmung"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{r.bodyKey}</span>
                        {r.date && <span className="text-xs text-muted-foreground">{r.date}</span>}
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={generatingId === key}
                      onClick={() => generateStory(r)}
                    >
                      {generatingId === key ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      <span className="ml-1">Story</span>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Older stories */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">Ältere Stories</CardTitle>
          <CardDescription>{olderStories.length} Stories aus früheren Wochen</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : olderStories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Keine älteren Stories.</p>
          ) : (
            <div className="space-y-3">
              {olderStories.map((story) => (
                <StoryRow
                  key={story.id}
                  story={story}
                  onPreview={setPreviewStory}
                  onTogglePublish={togglePublish}
                  onDelete={deleteStory}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {previewStory && (
        <StoryPreviewModal
          open={!!previewStory}
          onOpenChange={(open) => !open && setPreviewStory(null)}
          slides={previewStory.slides}
        />
      )}
    </div>
  );
}

export default AdminSection;
