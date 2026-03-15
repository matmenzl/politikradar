import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Sparkles, Trash2, Eye, EyeOff, Lock, Vote, BarChart3, Calendar } from "lucide-react";
import { toast } from "sonner";
import VoteBar from "@/components/VoteBar";
import type { StorySlide } from "@/components/StoryPreviewModal";
import StoryPreviewModal from "@/components/StoryPreviewModal";
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

interface StoryPost {
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
  type: "affair" | "voting";
  date?: string;
  status?: string;
  results_yes?: number;
  results_no?: number;
}

const BASE_URL = "https://api.openparldata.ch/v1";

const AdminPage = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);

  // Check session
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
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
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
                autoFocus
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

  return <AdminDashboard />;
};

function AdminDashboard() {
  const [stories, setStories] = useState<StoryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [previewStory, setPreviewStory] = useState<StoryPost | null>(null);

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
      const body: Record<string, unknown> = { title: result.title };
      if (result.type === "voting" && result.results_yes != null) {
        body.votingResults = {
          yes: result.results_yes,
          no: result.results_no,
        };
      }

      const { data, error } = await supabase.functions.invoke("generate-story", { body });
      if (error) throw error;
      if (!data?.slides) throw new Error("Keine Slides generiert");

      // Save to DB
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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="font-serif text-lg font-semibold text-foreground">PolitikRadar Admin</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              sessionStorage.removeItem("admin_auth");
              window.location.reload();
            }}
          >
            Abmelden
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Story erstellen</CardTitle>
            <CardDescription>
              Suche nach Geschäften oder Abstimmungen, um eine Story zu generieren
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

        {/* Story list */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Stories verwalten</CardTitle>
            <CardDescription>{stories.length} Stories insgesamt</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : stories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Noch keine Stories erstellt.
              </p>
            ) : (
              <div className="space-y-3">
                {stories.map((story) => (
                  <div
                    key={story.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50"
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={story.status === "published" ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {story.status === "published" ? "Live" : "Entwurf"}
                        </Badge>
                        {story.body_key && (
                          <span className="text-xs text-muted-foreground">{story.body_key}</span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {story.slides.length} Slides
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">{story.title}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPreviewStory(story)}
                        title="Vorschau"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => togglePublish(story)}
                        title={story.status === "published" ? "Zurückziehen" : "Veröffentlichen"}
                      >
                        {story.status === "published" ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteStory(story.id)}
                        title="Löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

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

export default AdminPage;
