import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAccess } from "@/components/SiteGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, UserPlus } from "lucide-react";

interface AccessCode {
  id: string;
  label: string;
  is_admin: boolean;
  active: boolean;
  created_at: string;
  last_used_at: string | null;
  logins: number;
  logins30d: number;
  first_used_at: string | null;
}

interface AccessEvent {
  access_code_id: string | null;
  label: string;
  created_at: string;
}

interface MasterStats {
  label: string;
  logins: number;
  logins30d: number;
}

/** Admin-only management of personal access codes. */
const AccessCodesPanel = () => {
  const access = useAccess();
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [master, setMaster] = useState<MasterStats | null>(null);
  const [recent, setRecent] = useState<AccessEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState("");
  const [newCode, setNewCode] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [saving, setSaving] = useState(false);

  const call = useCallback(
    async (body: Record<string, unknown>) => {
      const { data, error } = await supabase.functions.invoke("manage-access-codes", {
        body: { code: access?.code, ...body },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    [access?.code],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await call({ action: "list" });
      setCodes(data.codes ?? []);
      setMaster(data.master ?? null);
      setRecent(data.recent ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Laden fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }, [call]);

  useEffect(() => {
    if (access?.isAdmin) load();
  }, [access?.isAdmin, load]);

  if (!access?.isAdmin) return null;

  const create = async () => {
    setSaving(true);
    try {
      await call({ action: "create", label, newCode, isAdmin });
      toast.success("Zugang erstellt");
      setLabel("");
      setNewCode("");
      setIsAdmin(false);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erstellen fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  const mutate = async (body: Record<string, unknown>, msg: string) => {
    try {
      await call(body);
      toast.success(msg);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Aktion fehlgeschlagen");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg">Zugänge verwalten</CardTitle>
        <CardDescription>
          Persönliche Passwörter für die ganze Seite. Passwörter werden verschlüsselt gespeichert und
          sind später nicht mehr einsehbar – notiere sie beim Erstellen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create();
          }}
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <div className="space-y-1.5">
            <Label htmlFor="ac-label">Person / Bezeichnung</Label>
            <Input
              id="ac-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="z. B. Anna Muster"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ac-code">Passwort (min. 6 Zeichen)</Label>
            <Input
              id="ac-code"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="Passwort festlegen"
            />
          </div>
          <Button type="submit" disabled={saving || !label || newCode.length < 6}>
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <UserPlus className="w-4 h-4 mr-2" />
            )}
            Anlegen
          </Button>
          <div className="flex items-center gap-2 sm:col-span-3">
            <Switch id="ac-admin" checked={isAdmin} onCheckedChange={setIsAdmin} />
            <Label htmlFor="ac-admin" className="text-sm font-normal text-muted-foreground">
              Darf selbst Zugänge verwalten (Admin)
            </Label>
          </div>
        </form>

        <div className="space-y-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          {!loading && codes.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Noch keine persönlichen Zugänge – aktuell gilt nur das Hauptpasswort.
            </p>
          )}
          {codes.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{c.label}</span>
                  {c.is_admin && <Badge variant="secondary">Admin</Badge>}
                  {!c.active && <Badge variant="outline">Deaktiviert</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {c.last_used_at
                    ? `Zuletzt aktiv: ${new Date(c.last_used_at).toLocaleString("de-CH")}`
                    : "Noch nie verwendet"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {c.logins} Anmeldung{c.logins === 1 ? "" : "en"} gesamt · {c.logins30d} in den
                  letzten 30 Tagen
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={c.active}
                  onCheckedChange={(v) =>
                    mutate(
                      { action: "toggle", id: c.id, active: v },
                      v ? "Zugang aktiviert" : "Zugang deaktiviert",
                    )
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => mutate({ action: "delete", id: c.id }, "Zugang gelöscht")}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <div>
            <h4 className="text-sm font-medium">Nutzung</h4>
            <p className="text-xs text-muted-foreground">
              Jede Anmeldung wird pro Passwort protokolliert.
            </p>
          </div>
          {master && (
            <p className="text-xs text-muted-foreground">
              Hauptpasswort: {master.logins} Anmeldung{master.logins === 1 ? "" : "en"} gesamt ·{" "}
              {master.logins30d} in den letzten 30 Tagen
            </p>
          )}
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Anmeldungen erfasst.</p>
          ) : (
            <ul className="space-y-1">
              {recent.map((ev, i) => (
                <li key={`${ev.created_at}-${i}`} className="flex justify-between gap-3 text-xs">
                  <span className="truncate font-medium text-foreground">{ev.label}</span>
                  <span className="text-muted-foreground whitespace-nowrap">
                    {new Date(ev.created_at).toLocaleString("de-CH")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AccessCodesPanel;
