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
      .select("id, title, body_key, slides, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) {
          setStories(
            data.map((d) => ({
              id: d.id,
              title: d.title,
              body_key: d.body_key,
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
                  className="flex-shrink-0 w-[180px] group focus:outline-none"
                >
                  <div className="w-[180px] h-[320px] rounded-xl overflow-hidden ring-2 ring-transparent group-hover:ring-accent/50 transition-all shadow-md relative">
                    <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[540px] h-[960px] origin-center scale-[0.5] pointer-events-none">
                      <StorySlideCard
                        slide={firstSlide}
                        index={0}
                        total={story.slides.length}
                      />
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-xs font-medium text-foreground line-clamp-1 group-hover:text-accent transition-colors">
                      {story.title}
                    </p>
                    {story.body_key && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {story.body_key}
                      </p>
                    )}
                  </div>
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
