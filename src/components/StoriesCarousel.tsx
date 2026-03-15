import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ExternalLink } from "lucide-react";
import StoryPreviewModal, { type StorySlide } from "@/components/StoryPreviewModal";
import StorySlideCard from "@/components/story/StorySlideCard";
import { fetchBodies, getBodyLabel, fetchAffairById } from "@/lib/api/openparldata";
import { useIsMobile } from "@/hooks/use-mobile";

interface StoryPost {
  id: string;
  title: string;
  body_key: string | null;
  affair_id: string | null;
  slides: StorySlide[];
  published_at: string;
}

const StoriesCarousel = () => {
  const [stories, setStories] = useState<StoryPost[]>([]);
  const [selectedStory, setSelectedStory] = useState<StoryPost | null>(null);
  const [bodyNames, setBodyNames] = useState<Record<string, string>>({});
  const [affairLinks, setAffairLinks] = useState<Record<string, string>>({});
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from("story_posts")
      .select("id, title, body_key, affair_id, slides, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) {
          const mapped = data.map((d) => ({
            id: d.id,
            title: d.title,
            body_key: d.body_key,
            affair_id: d.affair_id,
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
  }, []);

  if (stories.length === 0) return null;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Stories</span>
          </div>
          <CardTitle className="font-serif text-xl">Stories der Woche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 -mx-2 px-2 snap-x snap-mandatory">
            {stories.map((story) => {
              const firstSlide = story.slides[0];
              if (!firstSlide) return null;
              const extUrl = story.affair_id ? affairLinks[story.affair_id] : null;
              return (
                <div key={story.id} className="flex-shrink-0 w-[160px] md:w-[200px] snap-start">
                  <button
                    onClick={() => isMobile ? navigate(`/story/${story.id}`) : setSelectedStory(story)}
                    className="w-full group focus:outline-none"
                  >
                    <div className="w-full rounded-xl overflow-hidden ring-2 ring-transparent group-hover:ring-accent/50 transition-all shadow-md">
                      <StorySlideCard
                        slide={firstSlide}
                        index={0}
                        total={story.slides.length}
                      />
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-xs font-medium text-foreground line-clamp-3 text-center group-hover:text-accent transition-colors">
                        {story.title}
                      </p>
                      {story.body_key && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
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
        </CardContent>
      </Card>

      {selectedStory && (
        <StoryPreviewModal
          open={!!selectedStory}
          onOpenChange={(open) => !open && setSelectedStory(null)}
          slides={selectedStory.slides}
        />
      )}
    </>
  );
};

export default StoriesCarousel;
