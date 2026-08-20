ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS affair_state text,
  ADD COLUMN IF NOT EXISTS timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS timeline_synced_at timestamp with time zone;