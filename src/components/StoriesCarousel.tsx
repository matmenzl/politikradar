import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ExternalLink, Shield } from "lucide-react";
import StoryPreviewModal, { type StorySlide } from "@/components/StoryPreviewModal";
import StorySlideCard from "@/components/story/StorySlideCard";
import { fetchBodies, getBodyLabel, fetchAffairById, fetchVotingById, getWeekFullDateRange } from "@/lib/api/openparldata";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { weekQuery } from "@/hooks/use-week";

interface StoryPost {
  id: string;
  title: string;
  body_key: string | null;
  affair_id: string | null;
  voting_id: string | null;
  slides: StorySlide[];
  published_at: string;
}

interface StoriesCarouselProps {
  /** ISO year of the displayed calendar week */
  year?: number;
  /** ISO week number of the displayed calendar week */
  week?: number;
}

const StoriesCarousel = ({ year, week }: StoriesCarouselProps) => {
  const [stories, setStories] = useState<StoryPost[]>([]);
  const [selectedStory, setSelectedStory] = useState<StoryPost | null>(null);
  const [bodyNames, setBodyNames] = useState<Record<string, string>>({});
  const [affairLinks, setAffairLinks] = useState<Record<string, string>>({});
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const range = year && week ? getWeekFullDateRange(year, week) : null;
  const rangeFrom = range?.from;
  const rangeTo = range?.to;

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("story_posts")
      .select("id, title, body_key, affair_id, voting_id, slides, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(100)
      .then(async ({ data }) => {
        if (!data || cancelled) return;

        const mapped: StoryPost[] = data.map((d) => ({
          id: d.id,
          title: d.title,
          body_key: d.body_key,
          affair_id: d.affair_id,
          voting_id: d.voting_id,
          slides: (d.slides as unknown as StorySlide[]) || [],
          published_at: d.published_at || "",
        }));

        // Resolve the underlying business date (voting date / affair date)
        // for each story – that is what the week filter applies to.
        const affairIds = [...new Set(mapped.map((s) => s.affair_id).filter(Boolean))] as string[];
        const votingIds = [...new Set(mapped.map((s) => s.voting_id).filter(Boolean))] as string[];

        const [affairEntries, votingEntries] = await Promise.all([
          Promise.all(affairIds.map(async (aid) => [aid, await fetchAffairById(aid)] as const)),
          Promise.all(votingIds.map(async (vid) => [vid, await fetchVotingById(vid)] as const)),
        ]);
        if (cancelled) return;

        const affairs = Object.fromEntries(affairEntries);
        const votings = Object.fromEntries(votingEntries);

        const businessDate = (s: StoryPost): string => {
          const voting = s.voting_id ? votings[s.voting_id] : null;
          if (voting?.date) return voting.date.slice(0, 10);
          const affair = s.affair_id ? affairs[s.affair_id] : null;
          const affairDate = affair?.end_date || affair?.begin_date;
          if (affairDate) return affairDate.slice(0, 10);
          return s.published_at.slice(0, 10);
        };

        const filtered = (
          rangeFrom && rangeTo
            ? mapped.filter((s) => {
                const d = businessDate(s);
                return d >= rangeFrom && d <= rangeTo;
              })
            : mapped
        )
          .sort((a, b) => businessDate(b).localeCompare(businessDate(a)))
          .slice(0, 10);

        setStories(filtered);

        const links: Record<string, string> = {};
        for (const [aid, affair] of affairEntries) {
          if (affair?.url_external_de) links[aid] = affair.url_external_de;
        }
        setAffairLinks(links);
      });

    fetchBodies().then((bodies) => {
      if (cancelled) return;
      const map: Record<string, string> = {};
      for (const b of bodies) {
        map[b.key] = getBodyLabel(b);
      }
      setBodyNames(map);
    });

    return () => {
      cancelled = true;
    };
  }, [rangeFrom, rangeTo]);

  if (stories.length === 0) {
    return (
      <div>
        <div className="mb-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Stories</span>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
            Stories der Woche
          </h2>
        </div>
        <div className="text-center py-8 space-y-3">
          <p className="text-sm text-muted-foreground">
            Es gibt noch keine Social-Media-Posts in dieser Woche.
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate(weekQuery(year, week, "/?tab=admin"))}>
            <Shield className="w-4 h-4" />
            Ersten Post im Admin-Bereich erstellen
          </Button>
        </div>
      </div>
    );
  }


  return (
    <>
      <div>
        <div className="mb-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Stories</span>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
            Stories der Woche
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Politische Entscheide, einfach erklärt
          </p>
        </div>
        <div className="flex gap-4 md:gap-5 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory">
          {stories.map((story) => {
            const firstSlide = story.slides[0];
            if (!firstSlide) return null;
            const extUrl = story.affair_id ? affairLinks[story.affair_id] : null;
            return (
              <div key={story.id} className="flex-shrink-0 w-[220px] md:w-[280px] snap-start">
                <button
                  onClick={() => isMobile ? navigate(`/story/${story.id}`) : setSelectedStory(story)}
                  className="w-full group focus:outline-none"
                >
                  <div className="w-full rounded-xl overflow-hidden ring-2 ring-transparent group-hover:ring-accent/50 transition-all shadow-lg">
                    <StorySlideCard
                      slide={firstSlide}
                      index={0}
                      total={story.slides.length}
                    />
                  </div>
                  <div className="mt-2.5 text-center">
                    <p className="text-sm font-medium text-foreground line-clamp-3 text-center group-hover:text-accent transition-colors">
                      {story.title}
                    </p>
                    {story.body_key && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {bodyNames[story.body_key] || story.body_key}
                      </p>
                    )}
                  </div>
                </button>
                {extUrl && (
                  <a
                    href={extUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 flex items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-accent transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>
                      {(() => { try { return new URL(extUrl).hostname.replace(/^www\./, ''); } catch { return 'Parlamentsseite'; } })()}
                    </span>
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedStory && (
        <StoryPreviewModal
          open={!!selectedStory}
          onOpenChange={(open) => !open && setSelectedStory(null)}
          slides={selectedStory.slides}
          affairId={selectedStory.affair_id}
          votingId={selectedStory.voting_id}
        />
      )}
    </>
  );
};

export default StoriesCarousel;
