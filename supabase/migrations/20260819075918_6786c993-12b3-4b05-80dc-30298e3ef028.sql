-- events
DROP POLICY IF EXISTS "App can manage events" ON public.events;
CREATE POLICY "Public can read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Authenticated can write events" ON public.events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update events" ON public.events FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete events" ON public.events FOR DELETE TO authenticated USING (true);
GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;

-- facts
DROP POLICY IF EXISTS "App can manage facts" ON public.facts;
CREATE POLICY "Public can read facts" ON public.facts FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert facts" ON public.facts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update facts" ON public.facts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete facts" ON public.facts FOR DELETE TO authenticated USING (true);
GRANT SELECT ON public.facts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.facts TO authenticated;
GRANT ALL ON public.facts TO service_role;

-- sources
DROP POLICY IF EXISTS "App can manage sources" ON public.sources;
CREATE POLICY "Public can read sources" ON public.sources FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert sources" ON public.sources FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update sources" ON public.sources FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete sources" ON public.sources FOR DELETE TO authenticated USING (true);
GRANT SELECT ON public.sources TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sources TO authenticated;
GRANT ALL ON public.sources TO service_role;

-- slides
DROP POLICY IF EXISTS "App can manage slides" ON public.slides;
CREATE POLICY "Public can read slides" ON public.slides FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert slides" ON public.slides FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update slides" ON public.slides FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete slides" ON public.slides FOR DELETE TO authenticated USING (true);
GRANT SELECT ON public.slides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.slides TO authenticated;
GRANT ALL ON public.slides TO service_role;

-- scoring_config
DROP POLICY IF EXISTS "App can manage scoring config" ON public.scoring_config;
CREATE POLICY "Public can read scoring config" ON public.scoring_config FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert scoring config" ON public.scoring_config FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update scoring config" ON public.scoring_config FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
GRANT SELECT ON public.scoring_config TO anon;
GRANT SELECT, INSERT, UPDATE ON public.scoring_config TO authenticated;
GRANT ALL ON public.scoring_config TO service_role;

-- stories
DROP POLICY IF EXISTS "App can manage stories" ON public.stories;
CREATE POLICY "Anon can read published stories" ON public.stories FOR SELECT TO anon USING (status = 'published');
CREATE POLICY "Authenticated can read stories" ON public.stories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert stories" ON public.stories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update stories" ON public.stories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete stories" ON public.stories FOR DELETE TO authenticated USING (true);
GRANT SELECT ON public.stories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stories TO authenticated;
GRANT ALL ON public.stories TO service_role;