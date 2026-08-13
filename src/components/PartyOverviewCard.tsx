import { useState, useEffect } from "react";
import { Users, AlertTriangle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { type Voting, type PartyWeeklyStats, fetchPartyWeeklyStats } from "@/lib/api/openparldata";

// Swiss party colors (approximate)
const PARTY_COLORS: Record<string, string> = {
  "SP": "hsl(0, 72%, 51%)",
  "GRÜNE": "hsl(142, 71%, 35%)",
  "Grüne": "hsl(142, 71%, 35%)",
  "GPS": "hsl(142, 71%, 35%)",
  "GLP": "hsl(142, 50%, 50%)",
  "Grünliberale": "hsl(142, 50%, 50%)",
  "M-E": "hsl(30, 80%, 50%)",
  "Mitte": "hsl(30, 80%, 50%)",
  "FDP-Liberale": "hsl(210, 70%, 50%)",
  "FDP": "hsl(210, 70%, 50%)",
  "SVP": "hsl(142, 50%, 25%)",
};

function getPartyColor(party: string): string {
  for (const [key, color] of Object.entries(PARTY_COLORS)) {
    if (party.includes(key)) return color;
  }
  return "hsl(var(--muted-foreground))";
}

interface Props {
  votings: Voting[];
}

const PartyOverviewCard = ({ votings }: Props) => {
  const [stats, setStats] = useState<PartyWeeklyStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedParty, setExpandedParty] = useState<string | null>(null);

  useEffect(() => {
    if (votings.length === 0) {
      setStats([]);
      return;
    }
    setLoading(true);
    fetchPartyWeeklyStats(votings)
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [votings]);

  if (votings.length === 0) {
    return null;
  }

  return (
    <Card className="group hover:border-accent/30 transition-all duration-300 opacity-0 animate-fade-in md:col-span-2" style={{ animationDelay: "500ms" }}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="w-4 h-4" />
          <span className="text-xs kicker">Parteien der Woche</span>
        </div>
        <CardTitle className="font-serif text-xl leading-snug">Abstimmungsverhalten nach Partei</CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          {loading
            ? "Lade Einzelstimmen…"
            : stats.length > 0
              ? `${stats.length} Parteien/Fraktionen über ${votings.length} Abstimmungen.`
              : "Keine Parteidaten verfügbar."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Lade Einzelstimmen für {votings.length} Abstimmungen…</span>
          </div>
        )}

        {!loading && stats.length > 0 && (
          <div className="space-y-3">
            {stats.map((party) => {
              const isExpanded = expandedParty === party.party;
              const color = getPartyColor(party.party);
              const yesPercent = party.totalVotes > 0 ? Math.round((party.totalYes / party.totalVotes) * 100) : 0;

              return (
                <div key={party.party} className="border border-border/50 rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center gap-3 p-3 hover:bg-secondary/30 transition-colors text-left"
                    onClick={() => setExpandedParty(isExpanded ? null : party.party)}
                  >
                    {/* Party color dot */}
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />

                    {/* Party name + vote bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground truncate">{party.party}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                          <span className="text-success">{party.totalYes} Ja</span>
                          <span className="text-destructive">{party.totalNo} Nein</span>
                          {party.totalAbstention > 0 && <span>{party.totalAbstention} Enth.</span>}
                        </div>
                      </div>
                      {/* Stacked bar */}
                      <div className="flex h-2 rounded-full overflow-hidden bg-secondary">
                        <div
                          className="bg-success transition-all"
                          style={{ width: `${yesPercent}%` }}
                        />
                        <div
                          className="bg-destructive transition-all"
                          style={{ width: `${party.totalVotes > 0 ? Math.round((party.totalNo / party.totalVotes) * 100) : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Cohesion badge */}
                    <Badge
                      variant={party.cohesion >= 90 ? "secondary" : "outline"}
                      className="text-[10px] shrink-0"
                    >
                      {party.cohesion}% Kohäsion
                    </Badge>

                    {/* Deviator indicator */}
                    {party.deviators.length > 0 && (
                      <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />
                    )}

                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </button>

                  {/* Expanded: deviators */}
                  {isExpanded && party.deviators.length > 0 && (
                    <div className="px-3 pb-3 pt-1 border-t border-border/30">
                      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3" />
                        {party.deviators.length} Abweichung{party.deviators.length > 1 ? "en" : ""} von der Fraktionsmehrheit
                      </p>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {party.deviators.map((d, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <span className="font-medium text-foreground shrink-0">{d.name}</span>
                            <span className="text-muted-foreground truncate flex-1">
                              stimmte <span className={d.vote === "Ja" ? "text-success font-medium" : "text-destructive font-medium"}>{d.vote}</span> statt {d.majorityVote} bei <span className="quote">«{d.votingTitle}»</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {isExpanded && party.deviators.length === 0 && (
                    <div className="px-3 pb-3 pt-1 border-t border-border/30">
                      <p className="text-xs text-muted-foreground">Keine Abweichungen – die Fraktion stimmte geschlossen.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PartyOverviewCard;
