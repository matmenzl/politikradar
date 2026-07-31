import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Lock } from "lucide-react";

interface AdminGateProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/** PIN protection shared by the AI analysis and editorial areas. */
const AdminGate = ({ title, description, children }: AdminGateProps) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("admin_auth") === "true") setAuthenticated(true);
  }, []);

  const verifyPin = async () => {
    setPinLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-admin-pin", {
        body: { pin },
      });
      if (error) throw error;
      if (data?.valid) {
        sessionStorage.setItem("admin_auth", "true");
        setAuthenticated(true);
        toast.success("Zugang gewährt");
      } else {
        toast.error("Falsches Passwort");
      }
    } catch {
      toast.error("Fehler bei der Überprüfung");
    } finally {
      setPinLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="flex justify-center py-8">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <CardTitle className="font-serif">{title}</CardTitle>
            <CardDescription>{description || "Bitte Passwort eingeben"}</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                verifyPin();
              }}
              className="space-y-3"
            >
              <Input
                type="password"
                placeholder="Passwort"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
              <Button type="submit" className="w-full" disabled={pinLoading || !pin}>
                {pinLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Anmelden
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">{title}</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            sessionStorage.removeItem("admin_auth");
            setAuthenticated(false);
          }}
        >
          Abmelden
        </Button>
      </div>
      {children}
    </div>
  );
};

export default AdminGate;
