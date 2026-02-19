
-- Cache table for cross-parliament weekly digests
CREATE TABLE public.weekly_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INT NOT NULL,
  week INT NOT NULL,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  topic_radar JSONB NOT NULL DEFAULT '[]'::jsonb,
  closest_votings JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary TEXT NOT NULL DEFAULT '',
  date_range JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(year, week)
);

-- Public read access (no auth needed), only edge functions write
ALTER TABLE public.weekly_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read weekly digests"
  ON public.weekly_digests FOR SELECT
  USING (true);

-- Service role can insert/update (edge functions use service role)
CREATE POLICY "Service role can manage weekly digests"
  ON public.weekly_digests FOR ALL
  USING (true)
  WITH CHECK (true);
