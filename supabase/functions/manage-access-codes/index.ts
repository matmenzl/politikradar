import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { corsHeaders, hashCode, json, normalizeCode, resolveCode } from "../_shared/access.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const identity = await resolveCode(supabase, body.code);
  if (!identity || !identity.isAdmin) {
    return json({ error: "Kein Zugriff" }, 403);
  }

  const action = body.action;

  if (action === "list") {
    const { data, error } = await supabase
      .from("access_codes")
      .select("id, label, is_admin, active, created_at, last_used_at")
      .order("created_at", { ascending: false });
    if (error) return json({ error: error.message }, 500);

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: events } = await supabase
      .from("access_code_events")
      .select("access_code_id, label, created_at")
      .order("created_at", { ascending: false })
      .limit(5000);

    const stats: Record<string, { total: number; last30: number; firstUsedAt: string | null }> = {};
    for (const ev of events ?? []) {
      const key = (ev.access_code_id as string | null) ?? `label:${ev.label}`;
      const entry = (stats[key] ??= { total: 0, last30: 0, firstUsedAt: null });
      entry.total += 1;
      if ((ev.created_at as string) >= since) entry.last30 += 1;
      entry.firstUsedAt = ev.created_at as string;
    }

    const codes = (data ?? []).map((c: Record<string, unknown>) => ({
      ...c,
      logins: stats[c.id as string]?.total ?? 0,
      logins30d: stats[c.id as string]?.last30 ?? 0,
      first_used_at: stats[c.id as string]?.firstUsedAt ?? null,
    }));

    const master = stats["label:Hauptzugang"];

    return json({
      codes,
      master: {
        label: "Hauptzugang",
        logins: master?.total ?? 0,
        logins30d: master?.last30 ?? 0,
      },
      recent: (events ?? []).slice(0, 20),
    });
  }

  if (action === "create") {
    const label = typeof body.label === "string" ? body.label.trim() : "";
    const newCode = typeof body.newCode === "string" ? normalizeCode(body.newCode) : "";
    if (!label || label.length > 80) return json({ error: "Bezeichnung fehlt" }, 400);
    if (newCode.length < 6 || newCode.length > 100) {
      return json({ error: "Passwort muss mindestens 6 Zeichen haben" }, 400);
    }
    const { error } = await supabase.from("access_codes").insert({
      label,
      code_hash: await hashCode(newCode),
      is_admin: Boolean(body.isAdmin),
    });
    if (error) {
      const msg = error.code === "23505" ? "Dieses Passwort ist bereits vergeben" : error.message;
      return json({ error: msg }, 400);
    }
    return json({ ok: true });
  }

  if (action === "toggle") {
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) return json({ error: "ID fehlt" }, 400);
    const { error } = await supabase
      .from("access_codes")
      .update({ active: Boolean(body.active) })
      .eq("id", id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  if (action === "delete") {
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) return json({ error: "ID fehlt" }, 400);
    const { error } = await supabase.from("access_codes").delete().eq("id", id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  return json({ error: "Unbekannte Aktion" }, 400);
});
