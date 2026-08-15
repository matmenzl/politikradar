import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import SlideCard from "@/components/story/SlideCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDown, ArrowUp, Download, ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import { downloadAllSlidesAsZip } from "@/lib/exportSlides";
import { SLIDE_TYPE_LABELS, STORY_STATUS, type EventRow, type FactRow, type SlideRow, type StoryRow } from "@/lib/mvp";

const StoryStudio = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [story, setStory] = useState<StoryRow | null>(null);
  const [event, setEvent] = useState<EventRow | null>(null);
  const [facts, setFacts] = useState<FactRow[]>([]);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [slides, setSlides] = useState<SlideRow[]>([]);
  const [saving, setSaving] = useState(false);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: s } = await supabase.from("stories").select("*").eq("id", id).maybeSingle();
      if (!s) {
        toast.error("Story nicht gefunden.");
        return;
      }
      setStory(s as unknown as StoryRow);

      const { data: sl } = await supabase.from("slides").select("*").eq("story_id", id).order("position");
      setSlides((sl || []) as unknown as SlideRow[]);

      if (s.event_id) {
        const { data: ev } = await supabase.from("events").select("*").eq("id", s.event_id).maybeSingle();
        if (ev) {
          setEvent(ev as unknown as EventRow);
          if (ev.source_id) {
            const { data: src } = await supabase.from("sources").select("url").eq("id", ev.source_id).maybeSingle();
            setSourceUrl(src?.url || null);
          }
        }
        const { data: f } = await supabase.from("facts").select("*").eq("event_id", s.event_id).order("position");
        setFacts((f || []) as unknown as FactRow[]);
      }
    })();
  }, [id]);

  const updateSlide = (index: number, patch: Partial<SlideRow>) =>
    setSlides((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= slides.length) return;
    const next = [...slides];
    [next[index], next[target]] = [next[target], next[index]];
    setSlides(next.map((s, i) => ({ ...s, position: i })));
  };

  const addSlide = () => {
    if (!story) return;
    setSlides((prev) => [
      ...prev,
      {
        id: `new-${crypto.randomUUID()}`,
        story_id: story.id,
        position: prev.length,
        slide_type: "context",
        headline: "Neue Folie",
        body: "",
        visualization: {},
        source_id: event?.source_id ?? null,
      },
    ]);
  };

  const removeSlide = async (index: number) => {
    const slide = slides[index];
    if (!slide.id.startsWith("new-")) await supabase.from("slides").delete().eq("id", slide.id);
    setSlides((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, position: i })));
  };

  const save = async () => {
    if (!story) return;
    setSaving(true);
    await supabase
      .from("stories")
      .update({ headline: story.headline, summary: story.summary, status: story.status })
      .eq("id", story.id);

    for (const [i, s] of slides.entries()) {
      const payload = {
        story_id: story.id,
        position: i,
        slide_type: s.slide_type,
        headline: s.headline,
        body: s.body,
        visualization: s.visualization as never,
        source_id: s.source_id,
      };
      if (s.id.startsWith("new-")) await supabase.from("slides").insert([payload]);
      else await supabase.from("slides").update(payload).eq("id", s.id);
    }
    setSaving(false);
    toast.success("Gespeichert.");
  };

  const exportSlides = () => downloadAllSlidesAsZip(slideRefs.current, `story-${story?.id.slice(0, 8)}.zip`);

  if (!story) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">Lade Story…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="text-xs kicker text-muted-foreground">Production Engine</span>
            <h1 className="font-serif text-3xl text-foreground">Story Studio</h1>
            {event && (
              <p className="text-sm text-muted-foreground mt-1">
                {event.parliament} · {event.event_date}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={story.status} onValueChange={(v) => setStory({ ...story, status: v })}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STORY_STATUS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={save} disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? "Speichere…" : "Speichern"}
            </Button>
            <Button variant="outline" onClick={exportSlides}>
              <Download className="w-4 h-4" />
              PNG-Export
            </Button>
            <Button variant="ghost" onClick={() => navigate("/redaktion")}>Zur Redaktion</Button>
          </div>
        </div>

        <section className="border border-border bg-card p-4 space-y-3">
          <h2 className="font-serif text-xl text-foreground">Fact Layer</h2>
          <p className="text-xs text-muted-foreground">
            Geprüfte Fakten aus den Parlamentsdaten. Die KI formuliert ausschliesslich auf dieser Basis.
          </p>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
            {event && (
              <>
                <div className="flex justify-between border-b border-border/60 py-1">
                  <span className="text-muted-foreground">Ereignis</span>
                  <span className="text-right">{event.title}</span>
                </div>
                <div className="flex justify-between border-b border-border/60 py-1">
                  <span className="text-muted-foreground">Parlament</span>
                  <span>{event.parliament}</span>
                </div>
              </>
            )}
            {facts.map((f) => (
              <div key={f.id} className="flex justify-between border-b border-border/60 py-1">
                <span className="text-muted-foreground">{f.label}</span>
                <span className="num">{f.value}</span>
              </div>
            ))}
          </div>
          {sourceUrl && (
            <Button size="sm" variant="ghost" asChild>
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" /> Quelle öffnen
              </a>
            </Button>
          )}
        </section>

        <section className="space-y-3">
          <div className="space-y-2">
            <label className="text-xs kicker text-muted-foreground">Headline</label>
            <Input value={story.headline} onChange={(e) => setStory({ ...story, headline: e.target.value })} />
            <label className="text-xs kicker text-muted-foreground">Zusammenfassung</label>
            <Textarea
              value={story.summary || ""}
              onChange={(e) => setStory({ ...story, summary: e.target.value })}
              rows={3}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-foreground">Slides</h2>
            <Button size="sm" variant="outline" onClick={addSlide}>
              <Plus className="w-4 h-4" /> Folie hinzufügen
            </Button>
          </div>

          {slides.map((slide, i) => (
            <div key={slide.id} className="grid md:grid-cols-[1fr_200px] gap-4 border border-border bg-card p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary">
                    {i + 1}. {SLIDE_TYPE_LABELS[slide.slide_type] || slide.slide_type}
                  </Badge>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => move(i, -1)}><ArrowUp className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => move(i, 1)}><ArrowDown className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => removeSlide(i)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
                <Input
                  value={slide.headline || ""}
                  onChange={(e) => updateSlide(i, { headline: e.target.value })}
                  placeholder="Headline"
                />
                <Textarea
                  value={slide.body || ""}
                  onChange={(e) => updateSlide(i, { body: e.target.value })}
                  rows={4}
                  placeholder="Text"
                />
              </div>
              <div>
                <SlideCard
                  ref={(el) => (slideRefs.current[i] = el)}
                  slide={slide}
                  index={i}
                  total={slides.length}
                />
              </div>
            </div>
          ))}
        </section>
      </div>
    </AppShell>
  );
};

export default StoryStudio;
