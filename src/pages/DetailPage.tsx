import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import VoteBar from "@/components/VoteBar";
import { useState, useEffect } from "react";
import type { Voting } from "@/lib/api/openparldata";

const BASE_URL = "https://api.openparldata.ch/v1";

const DetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "voting";
  const [voting, setVoting] = useState<Voting | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (type === "voting" && id) {
      fetch(`${BASE_URL}/votings/${id}?lang=de&lang_format=flat&hide_null=true`)
        .then((r) => r.json())
        .then((d) => setVoting(d.data || d))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id, type]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!voting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Daten nicht gefunden.</p>
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
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Abstimmung</p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
            {voting.affair_title_de || voting.title_de || `Abstimmung #${voting.id}`}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {voting.meaning_of_yes_de && `Ja = ${voting.meaning_of_yes_de}`}
            {voting.meaning_of_no_de && ` · Nein = ${voting.meaning_of_no_de}`}
          </p>
        </div>

        <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "150ms" }}>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-serif text-lg font-semibold">Ergebnis</h2>
            <VoteBar
              ja={voting.results_yes}
              nein={voting.results_no}
              enthaltungen={voting.results_abstention}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Entscheid</span>
                <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${voting.decision === "ja" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                  {voting.decision === "ja" ? "Angenommen" : "Abgelehnt"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Datum</span>
                <span className="text-sm font-medium text-foreground">
                  {voting.date ? new Date(voting.date).toLocaleDateString("de-CH") : "–"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Abwesend</span>
                <span className="text-sm font-medium text-foreground">{voting.results_absent}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Rat</span>
                <span className="text-sm font-medium text-foreground">
                  {voting.group_external_id === "Council_1" ? "Nationalrat" : voting.group_external_id === "Council_2" ? "Ständerat" : voting.group_external_id || "–"}
                </span>
              </div>
            </div>
            {voting.url_external_de && (
              <a href={voting.url_external_de} target="_blank" rel="noopener noreferrer" className="block">
                <button className="w-full mt-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
                  Auf parlament.ch ansehen →
                </button>
              </a>
            )}
          </CardContent>
        </Card>

        <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <CardContent className="p-6 space-y-3">
            <h2 className="font-serif text-lg font-semibold">Quelle</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Daten bereitgestellt von <a href="https://openparldata.ch" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">OpenParlData.ch</a> unter CC BY 4.0 Lizenz.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DetailPage;
