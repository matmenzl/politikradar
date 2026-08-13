// Statische Referenzseite für Screenshot-Regression der Social-Media-Templates.
// Route: /dev/templates — jedes Template hängt an einem stabilen data-shot-Selektor.
import StorySlideCard from "@/components/story/StorySlideCard";
import CarouselSlideCard from "@/components/story/CarouselSlideCard";
import { STORY_FIXTURES, CAROUSEL_FIXTURES } from "@/lib/storyFixtures";

const Shot = ({ id, width, children }: { id: string; width: number; children: React.ReactNode }) => (
  <div data-shot={id} style={{ width }}>
    {children}
  </div>
);

const TemplateGallery = () => (
  <div className="min-h-screen bg-background p-8 flex flex-wrap gap-8 items-start" data-gallery-ready="true">
    {STORY_FIXTURES.map((slide, i) => (
      <Shot key={`story-${slide.slide_type}`} id={`story-${slide.slide_type}`} width={360}>
        <StorySlideCard slide={slide} index={i} total={STORY_FIXTURES.length} />
      </Shot>
    ))}

    {CAROUSEL_FIXTURES.map((slide, i) => (
      <Shot key={`carousel-${slide.slide_type}`} id={`carousel-${slide.slide_type}`} width={420}>
        <CarouselSlideCard slide={slide} index={i} total={CAROUSEL_FIXTURES.length} />
      </Shot>
    ))}

    {CAROUSEL_FIXTURES.map((slide, i) => (
      <Shot key={`carousel-square-${slide.slide_type}`} id={`carousel-square-${slide.slide_type}`} width={420}>
        <CarouselSlideCard slide={slide} index={i} total={CAROUSEL_FIXTURES.length} format="square" />
      </Shot>
    ))}
  </div>
);

export default TemplateGallery;
