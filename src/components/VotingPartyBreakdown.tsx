import { useState, useEffect } from "react";
import { Users, AlertTriangle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchVotesForVoting, type Vote } from "@/lib/api/openparldata";

// Swiss party colors
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

interface PartyGroup {
  party: string;
  votes: Vote[];
  yes: number;
  no: number;
  abstention: number;
  absent: number;
}

interface Props {
  votingId: number;
}

const VotingPartyBreakdown = ({ votingId }: Props) => {
  const [groups, setGroups] = useState<PartyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedParty, setExpandedParty] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchVotesForVoting(votingId)
      .then((votes) => {
        const map = new Map<string, Vote[]>();
        for (const v of votes) {
          const party = v.person_party_de || v.person_parliamentary_group_name_de || "Unbekannt";
          if (!map.has(party)) map.set(party, []);
          map.get(party)!.push(v);
        }

        const result: PartyGroup[] = [];
        for (const [party, partyVotes] of map) {
          result.push({
            party,
            votes: partyVotes,
            yes: partyVotes.filter((v) => v.vote === "yes").length,
            no: partyVotes.filter((v) => v.vote === "no").length,
            abstention: partyVotes.filter((v) => v.vote === "abstention").length,
            absent: partyVotes.filter((v) => v.vote !== "yes" && v.vote !== "no" && v.vote !== "abstention").length,
          });
        }
        result.sort((a, b) => b.votes.length - a.votes.length);
        setGroups(result);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [votingId]);

  if (loading) {
    return (
      <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "150ms" }}>
        <CardContent className="p-6 flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Lade Einzelstimmen…</span>
        </CardContent>
      </Card>
    );
  }

  if (groups.length === 0) return null;

  return (
    <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "150ms" }}>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-serif text-lg font-semibold">Abstimmungsverhalten nach Partei</h2>
        </div>

        <div className="space-y-2">
          {groups.map((g) => {
            const isExpanded = expandedParty === g.party;
            const color = getPartyColor(g.party);
            const total = g.yes + g.no + g.abstention;
            const yesPercent = total > 0 ? Math.round((g.yes / total) * 100) : 0;
            const noPercent = total > 0 ? Math.round((g.no / total) * 100) : 0;

            // Find majority and deviators
            const majorityVote = g.yes >= g.no ? "yes" : "no";
            const castVotes = g.votes.filter((v) => v.vote === "yes" || v.vote === "no");
            const deviators = castVotes.filter((v) => v.vote !== majorityVote);

            return (
              <div key={g.party} className="border border-border/50 rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 p-3 hover:bg-secondary/30 transition-colors text-left"
                  onClick={() => setExpandedParty(isExpanded ? null : g.party)}
                >
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground truncate">{g.party}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                        <span className="text-success">{g.yes} Ja</span>
                        <span className="text-destructive">{g.no} Nein</span>
                        {g.abstention > 0 && <span>{g.abstention} Enth.</span>}
                      </div>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden bg-secondary">
                      <div className="bg-success transition-all" style={{ width: `${yesPercent}%` }} />
                      <div className="bg-destructive transition-all" style={{ width: `${noPercent}%` }} />
                    </div>
                  </div>

                  {deviators.length > 0 && (
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {deviators.length}
                    </Badge>
                  )}

                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-border/30">
                    {deviators.length > 0 && (
                      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3" />
                        {deviators.length} Abweichung{deviators.length > 1 ? "en" : ""} von der Fraktionsmehrheit ({majorityVote === "yes" ? "Ja" : "Nein"})
                      </p>
                    )}
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {g.votes
                        .filter((v) => v.vote === "yes" || v.vote === "no" || v.vote === "abstention")
                        .sort((a, b) => a.person_fullname.localeCompare(b.person_fullname))
                        .map((v) => {
                          const isDeviator = (v.vote === "yes" || v.vote === "no") && v.vote !== majorityVote;
                          return (
                            <div key={v.id} className={`flex items-center justify-between text-xs py-0.5 ${isDeviator ? "font-medium" : ""}`}>
                              <span className="text-foreground truncate mr-2">
                                {v.person_fullname}
                                {isDeviator && <span className="text-warning ml-1">⚡</span>}
                              </span>
                              <span className={
                                v.vote === "yes" ? "text-success" :
                                v.vote === "no" ? "text-destructive" :
                                "text-muted-foreground"
                              }>
                                {v.vote_display_de || v.vote}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default VotingPartyBreakdown;
