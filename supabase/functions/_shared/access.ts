export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

export const normalizeCode = (code: string) => code.trim();

export async function hashCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(normalizeCode(code));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface AccessIdentity {
  label: string;
  isAdmin: boolean;
}

/** Resolves a raw code to an identity, or null when invalid. */
export async function resolveCode(
  supabase: { from: (t: string) => any },
  code: unknown,
): Promise<AccessIdentity | null> {
  if (typeof code !== "string" || !normalizeCode(code)) return null;

  const masterPin = Deno.env.get("ADMIN_PIN");
  if (masterPin && normalizeCode(code) === masterPin) {
    return { label: "Hauptzugang", isAdmin: true };
  }

  const hash = await hashCode(code);
  const { data, error } = await supabase
    .from("access_codes")
    .select("id, label, is_admin, active")
    .eq("code_hash", hash)
    .maybeSingle();

  if (error || !data || !data.active) return null;

  await supabase
    .from("access_codes")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return { label: data.label as string, isAdmin: Boolean(data.is_admin) };
}
