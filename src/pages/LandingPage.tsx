import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="px-6 py-5 border-b border-border/50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="font-serif text-lg font-semibold tracking-tight text-foreground">
            PolitikRadar
          </span>
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Weekly
          </span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl mx-auto text-center space-y-8 py-20">
          <div
            className="inline-block px-3 py-1 rounded-full border border-border text-xs font-medium text-muted-foreground tracking-wide uppercase opacity-0 animate-fade-in"
            style={{ animationDelay: "0ms" }}
          >
            Nationale, kantonale & kommunale Parlamente
          </div>

          <h1
            className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground opacity-0 animate-fade-in"
            style={{ animationDelay: "100ms" }}
          >
            Was diese Woche im Parlament wirklich wichtig war
          </h1>

          <p
            className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg mx-auto opacity-0 animate-fade-in"
            style={{ animationDelay: "200ms" }}
          >
            Visuell und datenbasiert – die wichtigsten parlamentarischen
            Aktivitäten der Woche auf einen Blick.
          </p>

          <div
            className="opacity-0 animate-fade-in"
            style={{ animationDelay: "300ms" }}
          >
            <Button asChild size="lg" className="gap-2 px-8 rounded-full">
              <Link to="/weekly">
                Zur Wochenübersicht
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div
            className="pt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground opacity-0 animate-fade-in"
            style={{ animationDelay: "400ms" }}
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              Datenbasierte Analyse
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              Wöchentlich aktualisiert
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-warning" />
              Neutral & überparteilich
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-5 border-t border-border/50">
        <div className="max-w-4xl mx-auto text-center text-xs text-muted-foreground">
          PolitikRadar Weekly · Prototyp · Daten via OpenParlData.ch
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
