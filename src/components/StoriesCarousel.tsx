import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ExternalLink } from "lucide-react";
import StoryPreviewModal, { type StorySlide } from "@/components/StoryPreviewModal";
import StorySlideCard from "@/components/story/StorySlideCard";
import { fetchBodies, getBodyLabel, fetchAffairById, getWeekInstantRange } from "@/lib/api/openparldata";
import { useIsMobile } from "@/hooks/use-mobile";

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

  const range = year && week ? getWeekInstantRange(year, week) : null;
  const rangeStart = range?.start;
  const rangeEnd = range?.end;

  useEffect(() => {
    let query = supabase
      .from("story_posts")
      .select("id, title, body_key, affair_id, voting_id, slides, published_at")
      .eq("status", "published");

    if (rangeStart) query = query.gte("published_at", rangeStart);
    if (rangeEnd) query = query.lte("published_at", rangeEnd);


    query
      .order("published_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) {
          const mapped = data.map((d) => ({
            id: d.id,
            title: d.title,
            body_key: d.body_key,
            affair_id: d.affair_id,
            voting_id: d.voting_id,
            slides: (d.slides as unknown as StorySlide[]) || [],
            published_at: d.published_at || "",
          }));
          setStories(mapped);

          // Fetch external URLs for affairs
          const affairIds = [...new Set(mapped.map((s) => s.affair_id).filter(Boolean))] as string[];
          Promise.all(
            affairIds.map(async (aid) => {
              const affair = await fetchAffairById(aid);
              if (affair?.url_external_de) return [aid, affair.url_external_de] as const;
              return null;
            })
          ).then((results) => {
            const links: Record<string, string> = {};
            for (const r of results) {
              if (r) links[r[0]] = r[1];
            }
            setAffairLinks(links);
          });
        }
      });

    fetchBodies().then((bodies) => {
      const map: Record<string, string> = {};
      for (const b of bodies) {
        map[b.key] = getBodyLabel(b);
      }
      setBodyNames(map);
    });
  }, [rangeStart, rangeEnd]);

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
        <p className="text-sm text-muted-foreground text-center py-8">
          Noch keine Stories für diese Woche verfügbar.
        </p>
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
