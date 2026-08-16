ALTER TABLE public.events ADD COLUMN IF NOT EXISTS topics text[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS events_topics_idx ON public.events USING gin (topics);

CREATE TABLE IF NOT EXISTS public.subscriber_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  parliaments text[] NOT NULL DEFAULT '{}',
  topics text[] NOT NULL DEFAULT '{}',
  keywords text[] NOT NULL DEFAULT '{}',
  min_relevance integer NOT NULL DEFAULT 60,
  alerts_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriber_profiles TO authenticated;
GRANT ALL ON public.subscriber_profiles TO service_role;
ALTER TABLE public.subscriber_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own profile" ON public.subscriber_profiles;
CREATE POLICY "Users manage own profile" ON public.subscriber_profiles
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.alert_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id)
);

GRANT SELECT ON public.alert_deliveries TO authenticated;
GRANT ALL ON public.alert_deliveries TO service_role;
ALTER TABLE public.alert_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own deliveries" ON public.alert_deliveries;
CREATE POLICY "Users read own deliveries" ON public.alert_deliveries
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_subscriber_profiles()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS subscriber_profiles_touch ON public.subscriber_profiles;
CREATE TRIGGER subscriber_profiles_touch BEFORE UPDATE ON public.subscriber_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_subscriber_profiles();