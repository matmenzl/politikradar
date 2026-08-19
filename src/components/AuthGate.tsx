import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { isPreviewEnv } from "@/lib/preview";

/** Requires a logged-in account for the editorial tool. Skipped in the Lovable preview. */
const AuthGate = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const bypass = isPreviewEnv();
  const [status, setStatus] = useState<"loading" | "in" | "out">(bypass ? "in" : "loading");

  useEffect(() => {
    if (bypass) return;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setStatus(session ? "in" : "out");
    });
    supabase.auth.getSession().then(({ data }) => {
      setStatus(data.session ? "in" : "out");
    });
    return () => sub.subscription.unsubscribe();
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

  return <>{children}</>;
};

export default AuthGate;
