import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

/** Public login / signup for the topic alert newsletter. */
const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/profil", { replace: true });
    });
  }, [navigate]);

  const signIn = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error("Anmeldung fehlgeschlagen. E-Mail oder Passwort prüfen.");
    navigate("/profil");
  };

  const signUp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/profil` },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Konto erstellt. Bitte E-Mail bestätigen, falls eine Nachricht eintrifft.");
    navigate("/profil");
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

        <Tabs defaultValue="signin">
          <TabsList className="w-full">
            <TabsTrigger value="signin" className="flex-1">Anmelden</TabsTrigger>
            <TabsTrigger value="signup" className="flex-1">Konto erstellen</TabsTrigger>
          </TabsList>

          {(["signin", "signup"] as const).map((mode) => (
            <TabsContent key={mode} value={mode}>
              <form
                onSubmit={mode === "signin" ? signIn : signUp}
                className="space-y-3 border border-border bg-card p-5"
              >
                <label className="text-xs kicker text-muted-foreground flex flex-col gap-1">
                  E-Mail
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </label>
                <label className="text-xs kicker text-muted-foreground flex flex-col gap-1">
                  Passwort
                  <Input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  />
                </label>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Bitte warten…" : mode === "signin" ? "Anmelden" : "Konto erstellen"}
                </Button>
              </form>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Login;
