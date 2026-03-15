CREATE TABLE public.affair_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affair_id text NOT NULL UNIQUE,
  summary text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.affair_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read summaries"
  ON public.affair_summaries
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert summaries"
  ON public.affair_summaries
  FOR INSERT
  TO public
  WITH CHECK (true);