import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock } from "lucide-react";

interface AccessSession {
  code: string;
  label: string;
  isAdmin: boolean;
}

interface AccessContextValue extends AccessSession {
  signOut: () => void;
}

const AccessContext = createContext<AccessContextValue | null>(null);

/** Access to the current site session (personal code holder). */
export const useAccess = () => useContext(AccessContext);

const STORAGE_KEY = "site_access";

/** Site-wide password gate with personal access codes. */
const SiteGate = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AccessSession | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as AccessSession;
      if (parsed?.code) setSession(parsed);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const submit = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-access-code", {
        body: { code },
      });
      if (error) throw error;
      if (data?.valid) {
        const next: AccessSession = { code, label: data.label, isAdmin: !!data.isAdmin };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setSession(next);
        setCode("");
        toast.success(`Willkommen, ${next.label}`);
      } else {
        toast.error("Falsches Passwort");
      }
    } catch {
      toast.error("Fehler bei der Überprüfung");
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <CardTitle className="font-serif">PolitikRadar</CardTitle>
            <CardDescription>Bitte persönliches Passwort eingeben</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              className="space-y-3"
            >
              <Input
                type="password"
                placeholder="Passwort"
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <Button type="submit" className="w-full" disabled={loading || !code}>
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Anmelden
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AccessContext.Provider
      value={{
        ...session,
        signOut: () => {
          localStorage.removeItem(STORAGE_KEY);
          setSession(null);
        },
      }}
    >
      {children}
    </AccessContext.Provider>
  );
};

export default SiteGate;
