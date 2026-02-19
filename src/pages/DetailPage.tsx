import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { weeklyData } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import VoteBar from "@/components/VoteBar";

const DetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const highlight = weeklyData.highlights.find((h) => h.id === id);

  if (!highlight) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Highlight nicht gefunden.</p>
          <Link to="/weekly" className="text-accent hover:underline">← Zurück zur Übersicht</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <Link to="/weekly" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Zurück zur Übersicht</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <div className="space-y-3 opacity-0 animate-fade-in" style={{ animationDelay: "0ms" }}>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{highlight.subtitle}</p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">{highlight.title}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">{highlight.description}</p>
        </div>

        <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "150ms" }}>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-serif text-lg font-semibold">Details</h2>

            {highlight.type === "closest_vote" && (
              <VoteBar
                ja={highlight.details.ja as number}
                nein={highlight.details.nein as number}
                enthaltungen={highlight.details.enthaltungen as number}
              />
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(highlight.details).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                  <span className="text-sm font-medium text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <CardContent className="p-6 space-y-3">
            <h2 className="font-serif text-lg font-semibold">Kontext</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Diese Daten basieren auf der parlamentarischen Aktivität der Kalenderwoche 8, 2026.
              Die Analyse umfasst Geschäfte des National- und Ständerats, Kommissionsberichte
              sowie öffentlich zugängliche Abstimmungsprotokolle.
            </p>
            <p className="text-xs text-muted-foreground/60 pt-2">
              Hinweis: Dies ist ein Prototyp mit Mock-Daten. Keine Echtzeitdaten.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DetailPage;
