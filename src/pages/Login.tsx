import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Public passwordless login / signup (magic link) for the topic alert newsletter. */
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/profil";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate(from, { replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate(from, { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const sendLink = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}${from}`,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Link verschickt. Bitte E-Mail-Postfach prüfen.");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <span className="text-xs kicker text-muted-foreground">Themen-Alert</span>
          <h1 className="font-serif text-3xl text-foreground">
            politikradar<span className="text-brand-red">.</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Parlamente und Themen hinterlegen — und per E-Mail erfahren, sobald etwas Neues passiert.
          </p>
        </div>

        {sent ? (
          <div className="space-y-3 border border-border bg-card p-5">
            <h2 className="font-serif text-xl text-foreground">E-Mail unterwegs</h2>
            <p className="text-sm text-muted-foreground">
              Wir haben einen Anmelde-Link an <strong className="text-foreground">{email}</strong> geschickt.
              Der Link öffnet das Profil direkt — kein Passwort nötig.
            </p>
            <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
              Andere E-Mail verwenden
            </Button>
          </div>
        ) : (
          <form onSubmit={sendLink} className="space-y-3 border border-border bg-card p-5">
            <label className="text-xs kicker text-muted-foreground flex flex-col gap-1">
              E-Mail
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="name@beispiel.ch"
              />
            </label>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Wird gesendet…" : "Anmelde-Link senden"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Anmelden und Registrieren laufen gleich: Wir schicken einen einmaligen Link per E-Mail.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
