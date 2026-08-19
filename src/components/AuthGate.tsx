import { useEffect, useState, type ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { isPreviewEnv } from "@/lib/preview";
import { Button } from "@/components/ui/button";

/** Requires a logged-in editorial account. Skipped in the Lovable preview. */
const AuthGate = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const bypass = isPreviewEnv();
  const [status, setStatus] = useState<"loading" | "in" | "out" | "forbidden">(
    bypass ? "in" : "loading",
  );

  useEffect(() => {
    if (bypass) return;
    let active = true;

    const check = async (hasSession: boolean) => {
      if (!hasSession) {
        if (active) setStatus("out");
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .in("role", ["admin", "editor"])
        .limit(1);
      if (active) setStatus(data && data.length > 0 ? "in" : "forbidden");
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => check(!!session), 0);
    });
    supabase.auth.getSession().then(({ data }) => check(!!data.session));
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [bypass]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="text-xs kicker text-muted-foreground">Lädt…</span>
      </div>
    );
  }

  if (status === "out") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (status === "forbidden") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-sm space-y-3 border border-border bg-card p-6 text-center">
          <h1 className="font-serif text-2xl text-foreground">Kein Redaktionszugang</h1>
          <p className="text-sm text-muted-foreground">
            Dieses Konto hat keine Redaktionsrechte. Das Themen-Profil steht dir weiterhin offen.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/profil">Zum Profil</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGate;

