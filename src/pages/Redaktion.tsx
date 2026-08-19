import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, PenLine } from "lucide-react";
import { STORY_STATUS, statusLabel, type StoryRow } from "@/lib/mvp";
import LinkCheckPanel from "@/components/LinkCheckPanel";

const Redaktion = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error("Stories konnten nicht geladen werden.");
    setStories((data || []) as unknown as StoryRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (story: StoryRow, status: string) => {
    const patch: Record<string, unknown> = { status };
    if (status === "approved") patch.approved_at = new Date().toISOString();
    if (status === "published") patch.published_at = new Date().toISOString();
    const { error } = await supabase.from("stories").update(patch).eq("id", story.id);
    if (error) return toast.error("Status konnte nicht geändert werden.");
    setStories((prev) => prev.map((s) => (s.id === story.id ? { ...s, status } : s)));
  };

  const remove = async (story: StoryRow) => {
    const { error } = await supabase.from("stories").delete().eq("id", story.id);
    if (error) return toast.error("Story konnte nicht gelöscht werden.");
    setStories((prev) => prev.filter((s) => s.id !== story.id));
  };

  const visible = filter === "all" ? stories : stories.filter((s) => s.status === filter);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="text-xs kicker text-muted-foreground">Status</span>
            <h1 className="font-serif text-3xl text-foreground">Redaktion</h1>
            <p className="text-sm text-muted-foreground mt-1">Was ist der Status?</p>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              {STORY_STATUS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <LinkCheckPanel />

        {loading && <p className="text-sm text-muted-foreground">Lade Stories…</p>}
        {!loading && visible.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Noch keine Stories. Erstelle im Radar eine Story aus einem Ereignis.
          </p>
        )}

        <div className="space-y-2">
          {visible.map((s) => (
            <div key={s.id} className="border border-border bg-card p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[220px]">
                <p className="font-serif text-base text-foreground">{s.headline}</p>
                <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                  <Badge variant="secondary">{statusLabel(s.status)}</Badge>
                  {s.political_relevance !== null && <span>Relevanz {s.political_relevance}</span>}
                  {s.social_potential !== null && <span>· Social {s.social_potential}</span>}
                  <span>· {new Date(s.created_at).toLocaleDateString("de-CH")}</span>
                </div>
              </div>
              <Select value={s.status} onValueChange={(v) => setStatus(s, v)}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STORY_STATUS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => navigate(`/story/${s.id}`)}>
                <PenLine className="w-4 h-4" /> Studio
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(s)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
};

export default Redaktion;
