-- events
DROP POLICY IF EXISTS "Public can read events" ON public.events;
CREATE POLICY "Authenticated can read events" ON public.events
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon can read events with published story" ON public.events
  FOR SELECT TO anon USING (
    EXISTS (SELECT 1 FROM public.stories s WHERE s.event_id = events.id AND s.status = 'published')
  );

-- facts
DROP POLICY IF EXISTS "Public can read facts" ON public.facts;
CREATE POLICY "Authenticated can read facts" ON public.facts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon can read facts of published stories" ON public.facts
  FOR SELECT TO anon USING (
    EXISTS (SELECT 1 FROM public.stories s WHERE s.event_id = facts.event_id AND s.status = 'published')
  );

-- slides
DROP POLICY IF EXISTS "Public can read slides" ON public.slides;
CREATE POLICY "Anon can read slides of published stories" ON public.slides
  FOR SELECT TO anon USING (
    EXISTS (SELECT 1 FROM public.stories s WHERE s.id = slides.story_id AND s.status = 'published')
  );
CREATE POLICY "Authenticated can read published or editor slides" ON public.slides
  FOR SELECT TO authenticated USING (
    public.is_editor(auth.uid())
    OR EXISTS (SELECT 1 FROM public.stories s WHERE s.id = slides.story_id AND s.status = 'published')
  );

-- sources
DROP POLICY IF EXISTS "Public can read sources" ON public.sources;
CREATE POLICY "Authenticated can read sources" ON public.sources
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon can read sources of published content" ON public.sources
  FOR SELECT TO anon USING (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.stories s ON s.event_id = e.id AND s.status = 'published'
      WHERE e.source_id = sources.id
    )
    OR EXISTS (
      SELECT 1 FROM public.slides sl
      JOIN public.stories s2 ON s2.id = sl.story_id AND s2.status = 'published'
      WHERE sl.source_id = sources.id
    )
    OR EXISTS (
      SELECT 1 FROM public.facts f
      JOIN public.stories s3 ON s3.event_id = f.event_id AND s3.status = 'published'
      WHERE f.source_id = sources.id
    )
  );

-- scoring_config
DROP POLICY IF EXISTS "Public can read scoring config" ON public.scoring_config;
CREATE POLICY "Authenticated can read scoring config" ON public.scoring_config
  FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.scoring_config FROM anon;
REVOKE SELECT ON public.events FROM anon;
GRANT SELECT ON public.events TO anon;

-- security definer functions must not be callable through the API
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.is_editor(uuid) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.touch_subscriber_profiles() FROM anon, authenticated, public;