import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import StoryPreviewModal, { type StorySlide } from "@/components/StoryPreviewModal";
import StorySlideCard from "@/components/story/StorySlideCard";

interface StoryPost {
  id: string;
  title: string;
  body_key: string | null;
  slides: StorySlide[];
  published_at: string;
}

const StoriesCarousel = () => {
  const [stories, setStories] = useState<StoryPost[]>([]);
  const [selectedStory, setSelectedStory] = useState<StoryPost | null>(null);

  useEffect(() => {
    supabase
      .from("story_posts")
      .select("id, title, slides, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) {
          setStories(
            data.map((d) => ({
              id: d.id,
              title: d.title,
              slides: (d.slides as unknown as StorySlide[]) || [],
              published_at: d.published_at || "",
            }))
          );
        }
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
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 snap-x snap-mandatory">
            {stories.map((story) => {
              const firstSlide = story.slides[0];
              if (!firstSlide) return null;
              return (
                <button
                  key={story.id}
                  onClick={() => setSelectedStory(story)}
                  className="flex-shrink-0 w-[120px] group focus:outline-none"
                >
                  <div className="w-[120px] h-[213px] rounded-xl overflow-hidden ring-2 ring-transparent group-hover:ring-accent/50 transition-all shadow-md relative">
                    <div className="absolute top-0 left-0 w-[540px] h-[960px] origin-top-left scale-[0.222] pointer-events-none">
                      <StorySlideCard
                        slide={firstSlide}
                        index={0}
                        total={story.slides.length}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2 text-center group-hover:text-foreground transition-colors">
                    {story.title}
                  </p>
                </button>
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
