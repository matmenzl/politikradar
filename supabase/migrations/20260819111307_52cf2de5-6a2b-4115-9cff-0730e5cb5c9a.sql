-- Roles infrastructure
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_editor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','editor')
  );
$$;

-- Backfill: existing accounts keep editorial access
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'editor'::public.app_role FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;

-- events
DROP POLICY IF EXISTS "Authenticated can write events" ON public.events;
DROP POLICY IF EXISTS "Authenticated can update events" ON public.events;
DROP POLICY IF EXISTS "Authenticated can delete events" ON public.events;
CREATE POLICY "Editors can insert events" ON public.events FOR INSERT TO authenticated WITH CHECK (public.is_editor(auth.uid()));
CREATE POLICY "Editors can update events" ON public.events FOR UPDATE TO authenticated USING (public.is_editor(auth.uid())) WITH CHECK (public.is_editor(auth.uid()));
CREATE POLICY "Editors can delete events" ON public.events FOR DELETE TO authenticated USING (public.is_editor(auth.uid()));

-- facts
DROP POLICY IF EXISTS "Authenticated can insert facts" ON public.facts;
DROP POLICY IF EXISTS "Authenticated can update facts" ON public.facts;
DROP POLICY IF EXISTS "Authenticated can delete facts" ON public.facts;
CREATE POLICY "Editors can insert facts" ON public.facts FOR INSERT TO authenticated WITH CHECK (public.is_editor(auth.uid()));
CREATE POLICY "Editors can update facts" ON public.facts FOR UPDATE TO authenticated USING (public.is_editor(auth.uid())) WITH CHECK (public.is_editor(auth.uid()));
CREATE POLICY "Editors can delete facts" ON public.facts FOR DELETE TO authenticated USING (public.is_editor(auth.uid()));

-- sources
DROP POLICY IF EXISTS "Authenticated can insert sources" ON public.sources;
DROP POLICY IF EXISTS "Authenticated can update sources" ON public.sources;
DROP POLICY IF EXISTS "Authenticated can delete sources" ON public.sources;
CREATE POLICY "Editors can insert sources" ON public.sources FOR INSERT TO authenticated WITH CHECK (public.is_editor(auth.uid()));
CREATE POLICY "Editors can update sources" ON public.sources FOR UPDATE TO authenticated USING (public.is_editor(auth.uid())) WITH CHECK (public.is_editor(auth.uid()));
CREATE POLICY "Editors can delete sources" ON public.sources FOR DELETE TO authenticated USING (public.is_editor(auth.uid()));

-- slides
DROP POLICY IF EXISTS "Authenticated can insert slides" ON public.slides;
DROP POLICY IF EXISTS "Authenticated can update slides" ON public.slides;
DROP POLICY IF EXISTS "Authenticated can delete slides" ON public.slides;
CREATE POLICY "Editors can insert slides" ON public.slides FOR INSERT TO authenticated WITH CHECK (public.is_editor(auth.uid()));
CREATE POLICY "Editors can update slides" ON public.slides FOR UPDATE TO authenticated USING (public.is_editor(auth.uid())) WITH CHECK (public.is_editor(auth.uid()));
CREATE POLICY "Editors can delete slides" ON public.slides FOR DELETE TO authenticated USING (public.is_editor(auth.uid()));

-- scoring_config
DROP POLICY IF EXISTS "Authenticated can insert scoring config" ON public.scoring_config;
DROP POLICY IF EXISTS "Authenticated can update scoring config" ON public.scoring_config;
CREATE POLICY "Editors can insert scoring config" ON public.scoring_config FOR INSERT TO authenticated WITH CHECK (public.is_editor(auth.uid()));
CREATE POLICY "Editors can update scoring config" ON public.scoring_config FOR UPDATE TO authenticated USING (public.is_editor(auth.uid())) WITH CHECK (public.is_editor(auth.uid()));

-- stories: only editors see drafts
DROP POLICY IF EXISTS "Authenticated can read stories" ON public.stories;
DROP POLICY IF EXISTS "Authenticated can insert stories" ON public.stories;
DROP POLICY IF EXISTS "Authenticated can update stories" ON public.stories;
DROP POLICY IF EXISTS "Authenticated can delete stories" ON public.stories;
CREATE POLICY "Authenticated can read published or own-role stories" ON public.stories
  FOR SELECT TO authenticated USING (status = 'published' OR public.is_editor(auth.uid()));
CREATE POLICY "Editors can insert stories" ON public.stories FOR INSERT TO authenticated WITH CHECK (public.is_editor(auth.uid()));
CREATE POLICY "Editors can update stories" ON public.stories FOR UPDATE TO authenticated USING (public.is_editor(auth.uid())) WITH CHECK (public.is_editor(auth.uid()));
CREATE POLICY "Editors can delete stories" ON public.stories FOR DELETE TO authenticated USING (public.is_editor(auth.uid()));

-- storage: editors may manage story images
DROP POLICY IF EXISTS "Editors can upload story images" ON storage.objects;
DROP POLICY IF EXISTS "Editors can update story images" ON storage.objects;
DROP POLICY IF EXISTS "Editors can delete story images" ON storage.objects;
CREATE POLICY "Editors can upload story images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'story-images' AND public.is_editor(auth.uid()));
CREATE POLICY "Editors can update story images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'story-images' AND public.is_editor(auth.uid()))
  WITH CHECK (bucket_id = 'story-images' AND public.is_editor(auth.uid()));
CREATE POLICY "Editors can delete story images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'story-images' AND public.is_editor(auth.uid()));