CREATE TABLE public.story_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  affair_id text,
  voting_id text,
  title text NOT NULL,
  body_key text,
  slides jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz
);

ALTER TABLE public.story_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published stories"
  ON public.story_posts FOR SELECT TO public
  USING (status = 'published');

CREATE POLICY "Anyone can manage stories"
  ON public.story_posts FOR ALL TO public
  USING (true) WITH CHECK (true);