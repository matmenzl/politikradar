-- Neue MVP-Tabellen

CREATE TABLE public.sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT,
  label TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'primary',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sources TO anon, authenticated;
GRANT ALL ON public.sources TO service_role;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "App can manage sources" ON public.sources FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parliament TEXT NOT NULL,
  parliament_key TEXT,
  political_level TEXT NOT NULL DEFAULT 'unknown',
  canton TEXT,
  municipality TEXT,
  business_id TEXT,
  affair_id TEXT,
  voting_id TEXT,
  event_type TEXT NOT NULL,
  event_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  source_id UUID REFERENCES public.sources(id) ON DELETE SET NULL,
  political_relevance INTEGER,
  social_potential INTEGER,
  editorial_confidence INTEGER,
  score_factors JSONB NOT NULL DEFAULT '{}'::jsonb,
  selection_status TEXT NOT NULL DEFAULT 'new',
  exclusion_reason TEXT,
  dedupe_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO anon, authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "App can manage events" ON public.events FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX events_event_date_idx ON public.events (event_date DESC);
CREATE INDEX events_selection_status_idx ON public.events (selection_status);

CREATE TABLE public.facts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  fact_type TEXT NOT NULL,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  source_id UUID REFERENCES public.sources(id) ON DELETE SET NULL,
  verified BOOLEAN NOT NULL DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.facts TO anon, authenticated;
GRANT ALL ON public.facts TO service_role;
ALTER TABLE public.facts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "App can manage facts" ON public.facts FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX facts_event_id_idx ON public.facts (event_id);

CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  headline TEXT NOT NULL,
  summary TEXT,
  political_relevance INTEGER,
  social_potential INTEGER,
  editorial_confidence INTEGER,
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stories TO anon, authenticated;
GRANT ALL ON public.stories TO service_role;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "App can manage stories" ON public.stories FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  slide_type TEXT NOT NULL DEFAULT 'context',
  headline TEXT,
  body TEXT,
  visualization JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_id UUID REFERENCES public.sources(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.slides TO anon, authenticated;
GRANT ALL ON public.slides TO service_role;
ALTER TABLE public.slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "App can manage slides" ON public.slides FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX slides_story_id_idx ON public.slides (story_id, position);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON public.stories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_slides_updated_at BEFORE UPDATE ON public.slides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Alte Tabellen entfernen
DROP TABLE IF EXISTS public.access_code_events;
DROP TABLE IF EXISTS public.access_codes;
DROP TABLE IF EXISTS public.story_posts;
DROP TABLE IF EXISTS public.weekly_digests;
DROP TABLE IF EXISTS public.affair_summaries;