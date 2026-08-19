import { type ReactNode } from "react";
import { Link } from "react-router-dom";

/** Minimal chrome for public, login-free landing pages (newsletter targets). */
const PublicShell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-background flex flex-col">
    <header className="border-b border-border">
      <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="font-serif text-xl text-foreground">
          politikradar<span className="text-brand-red">.</span>
        </Link>
        <Link to="/profil" className="text-xs kicker text-muted-foreground hover:text-foreground">
          Profil
        </Link>
      </div>
    </header>

    <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8">{children}</main>

    <footer className="border-t border-border">
      <div className="max-w-2xl mx-auto px-4 py-6 text-xs text-muted-foreground">
        politikradar — Parlamentsdaten aus der Schweiz, journalistisch aufbereitet.
      </div>
    </footer>
  </div>
);

export default PublicShell;
