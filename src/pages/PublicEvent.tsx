import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PublicShell from "@/components/PublicShell";
import AffairTimeline from "@/components/AffairTimeline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ExternalLink, Sparkles } from "lucide-react";
import { usePageMeta } from "@/lib/seo";
import { topicLabel } from "@/lib/topics";
import type { EventRow, FactRow, StoryRow } from "@/lib/mvp";


/** Public, login-free landing page for a single parliamentary item (newsletter target). */
const PublicEvent = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [facts, setFacts] = useState<FactRow[]>([]);
  const [story, setStory] = useState<StoryRow | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data: ev } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
      if (ev) {
        setEvent(ev as unknown as EventRow);
        if (ev.source_id) {
          const { data: src } = await supabase.from("sources").select("url").eq("id", ev.source_id).maybeSingle();
          setSourceUrl(src?.url || null);
        }
        const [{ data: f }, { data: st }] = await Promise.all([
          supabase.from("facts").select("*").eq("event_id", id).order("position"),
          supabase
            .from("stories")
            .select("*")
            .eq("event_id", id)
            .eq("status", "published")
            .order("published_at", { ascending: false })
            .limit(1),
        ]);
        setFacts((f || []) as unknown as FactRow[]);
        setStory(((st || [])[0] as unknown as StoryRow) ?? null);
      }
      setLoading(false);
    })();
  }, [id]);

  usePageMeta(
    event ? `${event.title} — politikradar` : "Geschäft — politikradar",
    event?.description || event?.title,
    id ? `/g/${id}` : undefined,
  );

  if (loading) {
    return (
      <PublicShell>
        <p className="text-xs kicker text-muted-foreground">Lädt…</p>
      </PublicShell>
    );
  }

  if (!event) {
    return (
      <PublicShell>
        <h1 className="font-serif text-2xl text-foreground">Geschäft nicht gefunden</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Dieser Eintrag existiert nicht mehr oder wurde entfernt.
        </p>
        <Button asChild variant="outline" className="mt-5">
          <Link to="/profil">Zum Profil</Link>
        </Button>
      </PublicShell>
    );
  }

  const dateLabel = new Date(event.event_date).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <PublicShell>
      <article className="space-y-6">
        <div>
          <p className="text-xs kicker text-muted-foreground">
            {[event.parliament, dateLabel, event.event_type].filter(Boolean).join(" · ")}
          </p>
          <h1 className="font-serif text-3xl leading-tight text-foreground mt-2">{event.title}</h1>
          {event.description && (
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          )}
        </div>

        {(event.topics?.length || typeof event.political_relevance === "number") && (
          <div className="flex flex-wrap items-center gap-2">
            {(event.topics || []).map((t) => (
              <Badge key={t} variant="secondary">
                {topicLabel(t)}
              </Badge>
            ))}
            {typeof event.political_relevance === "number" && (
              <Badge variant="outline">Politische Relevanz {event.political_relevance}</Badge>
            )}
            {typeof event.social_potential === "number" && (
              <Badge variant="outline">Social-Potenzial {event.social_potential}</Badge>
            )}
          </div>
        )}

        {facts.length > 0 && (
          <section className="border border-border bg-card p-5">
            <h2 className="text-xs kicker text-muted-foreground">Fakten</h2>
            <dl className="mt-3 space-y-3">
              {facts.map((f) => (
                <div key={f.id} className="flex justify-between gap-4 border-b border-border pb-2 last:border-0">
                  <dt className="text-sm text-muted-foreground">{f.label}</dt>
                  <dd className="text-sm font-medium text-foreground text-right">{f.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <AffairTimeline
          eventId={event.id}
          businessType={
            facts.find((f) => f.fact_type === "affair_type")?.value ?? event.event_type
          }
          fallbackDate={event.event_date}
          fallbackState={facts.find((f) => f.fact_type === "status")?.value ?? null}
        />



        {sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-foreground underline underline-offset-4"
          >
            Originalquelle im Parlament <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}

        {story ? (
          <section className="border border-border bg-card p-5 space-y-3">
            <span className="text-xs kicker text-muted-foreground">Story dazu</span>
            <h2 className="font-serif text-xl text-foreground">{story.headline}</h2>
            {story.summary && <p className="text-sm text-muted-foreground">{story.summary}</p>}
            <Button asChild className="w-full sm:w-auto">
              <Link to={`/s/${story.id}`}>
                Story lesen <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </section>
        ) : (
          <section className="border border-border bg-card p-5 space-y-3">
            <span className="text-xs kicker text-muted-foreground">Noch keine Story</span>
            <p className="text-sm text-muted-foreground">
              Zu diesem Geschäft gibt es noch keine veröffentlichte Story.
            </p>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link to={`/?event=${event.id}`}>
                <Sparkles className="w-4 h-4 mr-1" /> Story erstellen
              </Link>
            </Button>
          </section>
        )}

        <div className="border-t border-border pt-5">
          <p className="text-sm text-muted-foreground">
            Möchtest du solche Hinweise regelmässig erhalten?
          </p>
          <Button asChild variant="ghost" className="px-0 mt-1">
            <Link to="/profil">
              Themen im Profil anpassen <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </article>
    </PublicShell>
  );
};

export default PublicEvent;
