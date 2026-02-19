
-- Remove overly permissive policy; service role bypasses RLS anyway
DROP POLICY "Service role can manage weekly digests" ON public.weekly_digests;
