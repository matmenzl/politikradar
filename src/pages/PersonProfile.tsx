import { useParams, useSearchParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  ArrowLeft, Loader2, ExternalLink, User, Briefcase, Vote, FileText,
  MapPin, Mail, Building2, ChevronDown, ChevronUp
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  fetchPerson, fetchPersonInterests, fetchPersonAffairs, fetchPersonVotes,
  groupInterestsByType,
  type Person, type Interest, type PersonAffair, type PersonVote
} from "@/lib/api/persons";

const PersonProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const bodyParam = searchParams.get("body") || "";
  const backUrl = bodyParam ? `/weekly?body=${encodeURIComponent(bodyParam)}` : "/";

  const [person, setPerson] = useState<Person | null>(null);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [affairs, setAffairs] = useState<PersonAffair[]>([]);
  const [votes, setVotes] = useState<PersonVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedType, setExpandedType] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const personId = Number(id);
    setLoading(true);

    fetchPerson(personId).then((p) => {
      setPerson(p);
      setLoading(false);
    });

    // Fetch sub-resources in parallel
    Promise.all([
      fetchPersonInterests(personId),
      fetchPersonAffairs(personId),
      fetchPersonVotes(personId),
    ]).then(([i, a, v]) => {
      setInterests(i);
      setAffairs(a);
      setVotes(v);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Person nicht gefunden.</p>
          <Link to={backUrl} className="text-accent hover:underline">← Zurück</Link>
        </div>
      </div>
    );
  }

  const interestGroups = groupInterestsByType(interests);
  const imageUrl = person.image_url_oparl || person.image_url_external;
  const initials = `${person.firstname?.[0] || ""}${person.lastname?.[0] || ""}`;
  const party = person.party_harmonized_de || person.party_de || person.parliamentary_group_name_de;

  // Voting statistics
  const voteStats = votes.reduce(
    (acc, v) => {
      if (v.vote === "yes") acc.yes++;
      else if (v.vote === "no") acc.no++;
      else if (v.vote === "abstention") acc.abstention++;
      else acc.absent++;
      return acc;
    },
    { yes: 0, no: 0, abstention: 0, absent: 0 }
  );
  const totalCastVotes = voteStats.yes + voteStats.no + voteStats.abstention;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <Link to={backUrl} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Zurück</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* Profile header */}
        <div className="flex items-start gap-5 opacity-0 animate-fade-in">
          <Avatar className="w-20 h-20 border-2 border-border">
            {imageUrl ? (
              <AvatarImage src={imageUrl} alt={person.fullname} />
            ) : null}
            <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-2">
            <h1 className="font-serif text-3xl font-normal text-foreground">{person.fullname}</h1>
            <div className="flex flex-wrap items-center gap-2">
              {party && <Badge variant="secondary">{party}</Badge>}
              {person.active && <Badge className="bg-brand-green-soft text-brand-green border-success/20">Aktiv</Badge>}
              {person.active === false && <Badge variant="outline" className="text-muted-foreground">Inaktiv</Badge>}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {person.occupation_de && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  {person.occupation_de}
                </span>
              )}
              {person.electoral_district_de && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {person.electoral_district_de}
                </span>
              )}
              {person.email && (
                <a href={`mailto:${person.email}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  <Mail className="w-3.5 h-3.5" />
                  {person.email}
                </a>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              {person.website_parliament_url_de && (
                <a href={person.website_parliament_url_de} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-2 text-xs">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Parlamentsprofil
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="interests" className="opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <TabsList className="w-full">
            <TabsTrigger value="interests" className="flex-1 gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Interessen ({interests.length})
            </TabsTrigger>
            <TabsTrigger value="affairs" className="flex-1 gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Vorstösse ({affairs.length})
            </TabsTrigger>
            <TabsTrigger value="votes" className="flex-1 gap-1.5">
              <Vote className="w-3.5 h-3.5" />
              Abstimmungen ({votes.length})
            </TabsTrigger>
          </TabsList>

          {/* Interests tab */}
          <TabsContent value="interests" className="space-y-4 mt-4">
            {interests.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Keine Interessenbindungen erfasst.</p>
            ) : (
              Object.entries(interestGroups).map(([type, items]) => (
                <Card key={type}>
                  <button
                    className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors text-left"
                    onClick={() => setExpandedType(expandedType === type ? null : type)}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{type}</span>
                      <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                    </div>
                    {expandedType === type ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  {expandedType === type && (
                    <CardContent className="pt-0 pb-4 px-4 space-y-2">
                      {items.map((interest) => (
                        <div key={interest.id} className="flex items-start gap-3 py-2 border-t border-border/30">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground">{interest.name_de || "–"}</p>
                            {interest.role_name_de && (
                              <p className="text-xs text-muted-foreground mt-0.5">{interest.role_name_de}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </TabsContent>

          {/* Affairs tab */}
          <TabsContent value="affairs" className="space-y-2 mt-4">
            {affairs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Keine Vorstösse gefunden.</p>
            ) : (
              affairs.map((a) => (
                <Link
                  key={a.id}
                  to={`/detail/${a.id}?type=affair${bodyParam ? `&body=${encodeURIComponent(bodyParam)}` : ""}`}
                  className="block"
                >
                  <Card className="hover:bg-secondary/30 transition-colors">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-foreground line-clamp-2">
                        {a.title_de || `Geschäft #${a.id}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {(a.type_de || a.type_harmonized) && (
                          <Badge variant="secondary" className="text-xs">
                            {a.type_de || a.type_harmonized}
                          </Badge>
                        )}
                        {a.begin_date && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(a.begin_date).toLocaleDateString("de-CH")}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </TabsContent>

          {/* Votes tab */}
          <TabsContent value="votes" className="space-y-4 mt-4">
            {totalCastVotes > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-serif text-sm font-semibold mb-3">Abstimmungsverhalten (letzte {votes.length})</h3>
                  <div className="flex h-3 rounded-full overflow-hidden bg-secondary mb-2">
                    <div
                      className="bg-success transition-all"
                      style={{ width: `${(voteStats.yes / totalCastVotes) * 100}%` }}
                    />
                    <div
                      className="bg-destructive transition-all"
                      style={{ width: `${(voteStats.no / totalCastVotes) * 100}%` }}
                    />
                    <div
                      className="bg-muted-foreground/30 transition-all"
                      style={{ width: `${(voteStats.abstention / totalCastVotes) * 100}%` }}
                    />
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="text-success">{voteStats.yes} Ja</span>
                    <span className="text-destructive">{voteStats.no} Nein</span>
                    <span>{voteStats.abstention} Enthaltung</span>
                    <span>{voteStats.absent} Abwesend</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {votes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Keine Abstimmungen gefunden.</p>
            ) : (
              <div className="space-y-1">
                {votes.map((v) => (
                  <Link
                    key={v.id}
                    to={`/detail/${v.voting_id}?type=voting${bodyParam ? `&body=${encodeURIComponent(bodyParam)}` : ""}`}
                    className="flex items-center justify-between py-2 px-3 -mx-3 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <p className="text-sm text-foreground truncate flex-1 mr-3">
                      {v.voting_affair_title_de || v.voting_title_de || `Abstimmung #${v.voting_id}`}
                    </p>
                    <Badge
                      variant="outline"
                      className={
                        v.vote === "yes"
                          ? "text-success border-success/30"
                          : v.vote === "no"
                            ? "text-destructive border-destructive/30"
                            : "text-muted-foreground"
                      }
                    >
                      {v.vote_display_de || v.vote}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PersonProfile;
