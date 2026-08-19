CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA private;
ALTER FUNCTION public.is_editor(uuid) SET SCHEMA private;

ALTER FUNCTION private.has_role(uuid, public.app_role) SET search_path = public;
ALTER FUNCTION private.is_editor(uuid) SET search_path = public;

GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_editor(uuid) TO authenticated, service_role;