import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { corsHeaders, json, resolveCode } from "../_shared/access.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { code } = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const identity = await resolveCode(supabase, code);
    if (!identity) return json({ valid: false });

    return json({ valid: true, label: identity.label, isAdmin: identity.isAdmin });
  } catch {
    return json({ error: "Invalid request" }, 400);
  }
});
