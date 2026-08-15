import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Radar", end: true },
  { to: "/redaktion", label: "Redaktion", end: false },
];

const AppShell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-background">
    <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border px-4 md:px-6 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <span className="font-serif text-lg text-foreground">
          politikradar<span className="text-brand-red">.</span>
        </span>
        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  "px-3 py-1.5 text-sm font-sans font-semibold border border-transparent",
                  isActive ? "bg-ink text-paper" : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
    <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">{children}</main>
  </div>
);

export default AppShell;
