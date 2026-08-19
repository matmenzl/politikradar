import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Loader2, LogOut, X } from "lucide-react";
import { TOPICS } from "@/lib/topics";
import { isPreviewEnv } from "@/lib/preview";

interface ProfileState {
  parliaments: string[];
  topics: string[];
  keywords: string[];
  min_relevance: number;
  alerts_enabled: boolean;
}

const EMPTY: ProfileState = {
  parliaments: [],
  topics: [],
  keywords: [],
  min_relevance: 60,
  alerts_enabled: true,
};

/** Public profile page: parliaments, topics and keywords for e-mail alerts. */
const Profil = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<ProfileState>(EMPTY);
  const [parliaments, setParliaments] = useState<string[]>([]);
  const [keywordDraft, setKeywordDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      // In der Lovable-Preview ist die Seite auch ohne Login sichtbar.
      if (!session && !isPreviewEnv()) return navigate("/login", { replace: true });
      if (!active) return;
      setEmail(session?.user.email ?? "");

      const [{ data: row }, { data: events }] = await Promise.all([
        session
          ? supabase.from("subscriber_profiles").select("*").eq("user_id", session.user.id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from("events").select("parliament").limit(1000),
      ]);
      if (!active) return;
      if (row) {
        setProfile({
          parliaments: row.parliaments ?? [],
          topics: row.topics ?? [],
          keywords: row.keywords ?? [],
          min_relevance: row.min_relevance ?? 60,
          alerts_enabled: row.alerts_enabled ?? true,
        });
      }
      setParliaments([...new Set((events || []).map((e) => e.parliament).filter(Boolean))].sort());
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [navigate]);

  const toggle = (key: keyof ProfileState, value: string) =>
    setProfile((p) => {
      const list = p[key] as string[];
      return {
        ...p,
        [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      };
    });

  const addKeyword = () => {
    const kw = keywordDraft.trim().toLowerCase();
    if (!kw) return;
    setProfile((p) => (p.keywords.includes(kw) ? p : { ...p, keywords: [...p.keywords, kw] }));
    setKeywordDraft("");
  };

  const save = async () => {
    setSaving(true);
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return navigate("/login");
    const { error } = await supabase.from("subscriber_profiles").upsert(
      { user_id: user.id, email: user.email ?? email, ...profile },
      { onConflict: "user_id" },
    );
    setSaving(false);
    if (error) return toast.error("Profil konnte nicht gespeichert werden.");
    toast.success("Profil gespeichert. Alerts richten sich ab sofort danach.");
  };

  const summary = useMemo(
    () =>
      `${profile.topics.length} Themen · ${profile.parliaments.length || "alle"} Parlamente · ${profile.keywords.length} Stichwörter`,
    [profile],
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border px-4 md:px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <Link to="/" className="font-serif text-lg text-foreground hover:opacity-80">
            politikradar<span className="text-brand-red">.</span>
          </Link>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4" />
                Zum Radar
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/login");
              }}
            >
              <LogOut className="w-4 h-4" />
              Abmelden
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
        <div>
          <span className="text-xs kicker text-muted-foreground">Themen-Alert</span>
          <h1 className="font-serif text-3xl text-foreground">Mein Profil</h1>
          <p className="text-sm text-muted-foreground mt-1">{email} · {summary}</p>
        </div>

        <section className="border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-xl text-foreground">E-Mail-Alerts</h2>
              <p className="text-sm text-muted-foreground">
                Eine Nachricht pro Tag, sobald neue Geschäfte zu deinen Themen auftauchen.
              </p>
            </div>
            <Switch
              checked={profile.alerts_enabled}
              onCheckedChange={(v) => setProfile((p) => ({ ...p, alerts_enabled: v }))}
              aria-label="E-Mail-Alerts aktivieren"
            />
          </div>
        </section>

        <section className="border border-border bg-card p-4 space-y-3">
          <h2 className="font-serif text-xl text-foreground">Themen</h2>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((t) => {
              const active = profile.topics.includes(t.key);
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => toggle("topics", t.key)}
                  aria-pressed={active}
                  className={`min-h-[40px] px-3 text-sm font-sans border ${
                    active
                      ? "bg-ink text-paper border-ink"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">Ohne Auswahl gelten alle Themen.</p>
        </section>

        <section className="border border-border bg-card p-4 space-y-3">
          <h2 className="font-serif text-xl text-foreground">Parlamente</h2>
          {parliaments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Parlamente erfasst.</p>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
              {parliaments.map((p) => {
                const active = profile.parliaments.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggle("parliaments", p)}
                    aria-pressed={active}
                    className={`min-h-[40px] px-3 text-sm font-sans border ${
                      active
                        ? "bg-ink text-paper border-ink"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          )}
          <p className="text-xs text-muted-foreground">Ohne Auswahl gelten alle Parlamente.</p>
        </section>

        <section className="border border-border bg-card p-4 space-y-3">
          <h2 className="font-serif text-xl text-foreground">Eigene Stichwörter</h2>
          <div className="flex gap-2">
            <Input
              value={keywordDraft}
              onChange={(e) => setKeywordDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addKeyword();
                }
              }}
              placeholder="z. B. Velostreifen"
            />
            <Button type="button" variant="outline" onClick={addKeyword}>
              Hinzufügen
            </Button>
          </div>
          {profile.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.keywords.map((kw) => (
                <Badge key={kw} variant="secondary" className="gap-1">
                  {kw}
                  <button
                    type="button"
                    aria-label={`${kw} entfernen`}
                    onClick={() => setProfile((p) => ({ ...p, keywords: p.keywords.filter((k) => k !== kw) }))}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </section>

        <section className="border border-border bg-card p-4 space-y-3">
          <h2 className="font-serif text-xl text-foreground">
            Mindest-Relevanz <span className="num text-muted-foreground">{profile.min_relevance}</span>
          </h2>
          <Slider
            value={[profile.min_relevance]}
            min={0}
            max={100}
            step={5}
            onValueChange={([v]) => setProfile((p) => ({ ...p, min_relevance: v }))}
          />
          <p className="text-xs text-muted-foreground">
            Nur Ereignisse ab dieser politischen Relevanz lösen eine E-Mail aus.
          </p>
        </section>

        <Button onClick={save} disabled={saving} className="w-full md:w-auto">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Profil speichern
        </Button>

        <section className="border border-destructive/40 bg-card p-4 space-y-3">
          <h2 className="font-serif text-xl text-foreground">Profil löschen</h2>
          <p className="text-sm text-muted-foreground">
            Dein Konto sowie alle Einstellungen, Themen, Stichwörter und die Alert-Historie
            werden endgültig gelöscht. Du erhältst eine Bestätigung per E-Mail. Das lässt sich
            nicht rückgängig machen.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting} className="w-full md:w-auto">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Profil endgültig löschen
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Profil wirklich löschen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Alle Daten zu {email || "diesem Konto"} werden dauerhaft entfernt. Eine
                  Bestätigung geht an deine E-Mail-Adresse.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction onClick={deleteAccount}>Endgültig löschen</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      </main>
    </div>
  );
};

export default Profil;
