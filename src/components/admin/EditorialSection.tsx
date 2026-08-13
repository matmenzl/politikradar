import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Sparkles, Trash2, Eye, EyeOff, Home, Pencil } from "lucide-react";
import StoryPreviewModal, { type StorySlide } from "@/components/StoryPreviewModal";
import type { CarouselSlide } from "@/components/story/CarouselSlideCard";
import { getWeekDateRange } from "@/lib/api/openparldata";
import {
  BASE_URL,
  createStoryDraft,
  type SearchResult,
  type StoryPost,
} from "@/components/admin/shared";

function StoryRow({
  story,
  onPreview,
  onTogglePublish,
  onToggleHome,
  onDelete,
  onEditFeed,
}: {
  story: StoryPost;
  onPreview: (s: StoryPost) => void;
  onTogglePublish: (s: StoryPost) => void;
  onToggleHome: (s: StoryPost, value: boolean) => void;
  onDelete: (id: string) => void;
  onEditFeed: (s: StoryPost) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/50 flex-wrap">
      <div className="flex-1 min-w-[180px]">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant={story.status === "published" ? "default" : "secondary"} className="text-[10px]">
            {story.status === "published" ? "Live" : "Entwurf"}
          </Badge>
          {story.body_key && <span className="text-xs text-muted-foreground">{story.body_key}</span>}
          <span className="text-xs text-muted-foreground">{story.slides.length} Slides</span>
        </div>
        <p className="text-sm font-medium text-foreground truncate">{story.title}</p>
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
          <Home className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Startseite</span>
          <Switch
            checked={story.show_on_home}
            disabled={story.status !== "published"}
            onCheckedChange={(v) => onToggleHome(story, v)}
          />
        </label>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditFeed(story)} title="Feed-Karussell">
            <Pencil className="w-4 h-4" />
          </Button>
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
    </div>
  );
}

interface EditorialSectionProps {
  year: number;
  week: number;
}

const EditorialSection = ({ year, week }: EditorialSectionProps) => {
  const [stories, setStories] = useState<StoryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewStory, setPreviewStory] = useState<StoryPost | null>(null);
  const [savingSlides, setSavingSlides] = useState(false);
  const [feedStory, setFeedStory] = useState<StoryPost | null>(null);
  const [feedJson, setFeedJson] = useState("");
  const [savingFeed, setSavingFeed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

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
          feed_slides: (d.feed_slides as unknown as CarouselSlide[]) || [],
        })) as StoryPost[]
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  const { weekStories, olderStories } = useMemo(() => {
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
  }, [stories, year, week]);

  const togglePublish = async (story: StoryPost) => {
    const newStatus = story.status === "published" ? "draft" : "published";
    const { error } = await supabase
      .from("story_posts")
      .update({
        status: newStatus,
        published_at: newStatus === "published" ? new Date().toISOString() : null,
        ...(newStatus === "draft" ? { show_on_home: false } : {}),
      })
      .eq("id", story.id);
    if (error) {
      toast.error("Fehler beim Aktualisieren");
      return;
    }
    toast.success(newStatus === "published" ? "Veröffentlicht" : "Zurückgezogen");

    if (newStatus === "published") {
      toast.info("Bilder werden dauerhaft gespeichert…");
      const { error: persistError } = await supabase.functions.invoke("persist-story-images", {
        body: { story_id: story.id },
      });
      if (persistError) {
        console.error("persist-story-images failed:", persistError);
        toast.error("Bilder konnten nicht dauerhaft gespeichert werden");
      } else {
        toast.success("Bilder gespeichert");
      }
    }

    loadStories();
  };

  const toggleHome = async (story: StoryPost, value: boolean) => {
    const { error } = await supabase
      .from("story_posts")
      .update({ show_on_home: value })
      .eq("id", story.id);
    if (error) {
      toast.error("Fehler beim Aktualisieren");
      return;
    }
    toast.success(value ? "Auf Startseite sichtbar" : "Von Startseite entfernt");
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

  const openFeedEditor = (story: StoryPost) => {
    setFeedStory(story);
    setFeedJson(JSON.stringify(story.feed_slides, null, 2));
  };

  const saveFeedSlides = async () => {
    if (!feedStory) return;
    let parsed: CarouselSlide[];
    try {
      parsed = JSON.parse(feedJson);
      if (!Array.isArray(parsed)) throw new Error("Feed-Slides müssen ein Array sein");
    } catch (e: any) {
      toast.error("Ungültiges JSON: " + e.message);
      return;
    }
    setSavingFeed(true);
    const { error } = await supabase
      .from("story_posts")
      .update({ feed_slides: parsed as unknown as never })
      .eq("id", feedStory.id);
    setSavingFeed(false);
    if (error) {
      toast.error("Speichern fehlgeschlagen");
      return;
    }
    toast.success("Feed-Karussell gespeichert");
    setFeedStory(null);
    loadStories();
  };

  const updatePreviewSlide = (index: number, patch: Partial<StorySlide>) => {
    setPreviewStory((prev) => {
      if (!prev) return prev;
      const slides = prev.slides.map((s, i) => (i === index ? { ...s, ...patch } : s));
      return { ...prev, slides };
    });
  };

  const savePreviewSlides = async () => {
    if (!previewStory) return;
    setSavingSlides(true);
    const { error } = await supabase
      .from("story_posts")
      .update({ slides: previewStory.slides as unknown as never })
      .eq("id", previewStory.id);
    setSavingSlides(false);
    if (error) {
      toast.error("Speichern fehlgeschlagen");
      return;
    }
    toast.success("Änderungen gespeichert");
    loadStories();
  };

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

  const handleGenerate = async (r: SearchResult) => {
    const key = `${r.type}-${r.id}`;
    setGeneratingId(key);
    try {
      await createStoryDraft(r);
      loadStories();
    } catch (e: any) {
      toast.error(e.message || "Fehler beim Generieren");
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stories of the selected week */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">Stories der Woche {week}</CardTitle>
          <CardDescription>
            {weekStories.length} Stories · «Startseite» steuert die öffentliche Anzeige
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : weekStories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Noch keine Stories in dieser Woche. Erstelle eine Story über die KI-Analyse oder die Suche unten.
            </p>
          ) : (
            <div className="space-y-3">
              {weekStories.map((story) => (
              <StoryRow
                  key={story.id}
                  story={story}
                  onPreview={setPreviewStory}
                  onTogglePublish={togglePublish}
                  onToggleHome={toggleHome}
                  onDelete={deleteStory}
                  onEditFeed={openFeedEditor}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual story creation via API search */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">Story manuell anlegen</CardTitle>
          <CardDescription>Suche über alle Zeiträume nach Geschäften oder Abstimmungen</CardDescription>
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
                      onClick={() => handleGenerate(r)}
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
          <CardDescription>{olderStories.length} Stories aus anderen Wochen</CardDescription>
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
                  onToggleHome={toggleHome}
                  onDelete={deleteStory}
                  onEditFeed={openFeedEditor}
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
          affairId={previewStory.affair_id}
          votingId={previewStory.voting_id}
          editable
          onSlideChange={updatePreviewSlide}
          onSaveSlides={savePreviewSlides}
          saving={savingSlides}
        />
      )}

      <Dialog open={!!feedStory} onOpenChange={(open) => !open && setFeedStory(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">Feed-Karussell bearbeiten</DialogTitle>
            <DialogDescription>
              JSON-Array mit CarouselSlide-Einträgen (cover, detail, result, cta). Format: portrait (4:5).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="feed-json" className="text-xs text-muted-foreground">JSON</Label>
            <Textarea
              id="feed-json"
              value={feedJson}
              onChange={(e) => setFeedJson(e.target.value)}
              rows={18}
              className="font-mono text-xs"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setFeedStory(null)}>Abbrechen</Button>
            <Button onClick={saveFeedSlides} disabled={savingFeed}>
              {savingFeed ? <Loader2 className="w-4 h-4 animate-spin" /> : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditorialSection;
