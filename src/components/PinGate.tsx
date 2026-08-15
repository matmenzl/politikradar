import { useState, type ReactNode, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";

const STORAGE_KEY = "politikradar_pin_ok";

/** Global PIN protection for the whole editorial tool. */
const PinGate = ({ children }: { children: ReactNode }) => {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(STORAGE_KEY) === "1");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("verify-admin-pin", {
        body: { pin: pin.trim() },
      });
      if (fnError) throw fnError;
      if (data?.valid) {
        sessionStorage.setItem(STORAGE_KEY, "1");
        setUnlocked(true);
      } else {
        setError("Falsches PIN.");
      }
    } catch {
      setError("Prüfung fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 border border-border bg-card p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Lock className="w-4 h-4" />
          <span className="text-xs kicker">Redaktionszugang</span>
        </div>
        <h1 className="font-serif text-2xl text-foreground">
          politikradar<span className="text-brand-red">.</span>
        </h1>
        <Input
          type="password"
          inputMode="numeric"
          autoFocus
          placeholder="PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Prüfe…" : "Anmelden"}
        </Button>
      </form>
    </div>
  );
};

export default PinGate;
