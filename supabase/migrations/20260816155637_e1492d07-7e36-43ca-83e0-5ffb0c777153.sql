CREATE TABLE public.scoring_config (
  id text PRIMARY KEY DEFAULT 'default',
  relevance_weights jsonb NOT NULL DEFAULT '{"decision_impact":30,"scope":25,"controversy":20,"topic_salience":15,"process_stage":10}'::jsonb,
  social_weights jsonb NOT NULL DEFAULT '{"emotional_hook":20,"clarity":20,"everyday_relevance":20,"conflict":15,"visual_potential":15,"novelty":10}'::jsonb,
  thresholds jsonb NOT NULL DEFAULT '{"top_story":70,"review":60}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scoring_config TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scoring_config TO authenticated;
GRANT ALL ON public.scoring_config TO service_role;

ALTER TABLE public.scoring_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "App can manage scoring config" ON public.scoring_config FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_scoring_config_updated_at BEFORE UPDATE ON public.scoring_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.scoring_config (id) VALUES ('default') ON CONFLICT DO NOTHING;