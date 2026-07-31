CREATE TABLE public.access_code_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  access_code_id uuid REFERENCES public.access_codes(id) ON DELETE SET NULL,
  label text NOT NULL,
  event_type text NOT NULL DEFAULT 'login',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.access_code_events TO service_role;

ALTER TABLE public.access_code_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX access_code_events_code_idx ON public.access_code_events (access_code_id, created_at DESC);
CREATE INDEX access_code_events_created_idx ON public.access_code_events (created_at DESC);