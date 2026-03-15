import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, ExternalLink, Calendar, FileText, Vote, Tag, Sparkles, Code2, Instagram } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import VoteBar from "@/components/VoteBar";
import VotingPartyBreakdown from "@/components/VotingPartyBreakdown";
import EmbedCodeModal from "@/components/EmbedCodeModal";
import StoryPreviewModal, { type StorySlide, type PartyVoteData } from "@/components/StoryPreviewModal";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type Voting, type Affair, isVotingAccepted, fetchVotesForVoting, fetchBodies } from "@/lib/api/openparldata";

interface AffairDetail extends Affair {
  type_name_de?: string;
  state_name_de?: string;
  number?: string;
  type_harmonized_de?: string;
  url_external_de?: string;
}

const BASE_URL = "https://api.openparldata.ch/v1";

async function fetchDetail<T>(endpoint: string, id: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}/${id}?lang=de&lang_format=flat&hide_null=true`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || json;
  } catch {
    return null;
  }
}


const DetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "voting";
  const bodyParam = searchParams.get("body") || "";
  const backUrl = bodyParam ? `/weekly?body=${encodeURIComponent(bodyParam)}` : "/weekly";

  const [voting, setVoting] = useState<Voting | null>(null);
  const [affair, setAffair] = useState<AffairDetail | null>(null);
  const [relatedVotings, setRelatedVotings] = useState<Voting[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [embedModalOpen, setEmbedModalOpen] = useState(false);
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [storySlides, setStorySlides] = useState<StorySlide[]>([]);
  const [storyLoading, setStoryLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setSummary("");
    setSummaryLoading(false);
    setVoting(null);
    setAffair(null);
    setRelatedVotings([]);
    setTags([]);

    if (type === "voting") {
      fetchDetail<Voting>("/votings", id)
        .then(async (v) => {
          setVoting(v);
          // Also fetch the linked affair for context
          if (v?.affair_id) {
            try {
              const a = await fetchDetail<AffairDetail>("/affairs", String(v.affair_id));
              if (a) setAffair(a);
              // Fetch other votings on the same affair
              const res = await fetch(`${BASE_URL}/affairs/${v.affair_id}/votings?lang=de&lang_format=flat&hide_null=true`);
              if (res.ok) {
                const json = await res.json();
                const others = (json.data || []).filter((rv: Voting) => rv.id !== v.id);
                setRelatedVotings(others);
              }
            } catch {}
          }
        })
        .finally(() => setLoading(false));
    } else if (type === "affair") {
      fetchDetail<Affair>("/affairs", id)
        .then(async (a) => {
          setAffair(a);
          // Fetch related votings for this affair
          if (a) {
            try {
              const res = await fetch(`${BASE_URL}/affairs/${id}/votings?lang=de&lang_format=flat&hide_null=true`);
              if (res.ok) {
                const json = await res.json();
                setRelatedVotings(json.data || []);
              }
            } catch {}
            // Get AI tags
            if (a.title_de) {
              supabase.functions
                .invoke("tag-affairs", { body: { affairs: [{ id: a.id, title: a.title_de }] } })
                .then(({ data }) => {
                  if (data?.tagMap?.[a.id]) setTags(data.tagMap[a.id]);
                })
                .catch(() => {});
            }
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id, type]);

  // Check cache on load when affair is available
  useEffect(() => {
    if (!affair?.id) return;
    supabase
      .from("affair_summaries")
      .select("summary")
      .eq("affair_id", String(affair.id))
      .maybeSingle()
      .then(({ data }) => {
        if (data?.summary) setSummary(data.summary);
      });
  }, [affair?.id]);

  const resolveParliamentName = async (): Promise<string | undefined> => {
    const key = bodyParam || affair?.body_key || voting?.body_key;
    if (!key) return undefined;
    if (key === "CHE") {
      const groupId = voting?.group_external_id;
      if (groupId === "Council_1") return "Nationalrat";
      if (groupId === "Council_2") return "Ständerat";
      return "Bundesversammlung (Schweizer Parlament)";
    }
    try {
      const bodies = await fetchBodies();
      const body = bodies.find((b) => b.key.toLowerCase() === key.toLowerCase());
      if (body?.name_de) return `Kantons-/Stadtparlament ${body.name_de}`;
    } catch {}
    return key;
  };

  const generateSummary = async () => {
    if (!affair) return;
    setSummaryLoading(true);
    try {
      const body: Record<string, unknown> = { title: affair.title_de };
      if (affair.type_de || affair.type_name_de || affair.type_harmonized_de) {
        body.type = affair.type_de || affair.type_name_de || affair.type_harmonized_de;
      }
      if (affair.status_de || affair.state_name_de) {
        body.status = affair.status_de || affair.state_name_de;
      }
      if (affair.begin_date) body.beginDate = affair.begin_date;
      if (affair.end_date) body.endDate = affair.end_date;
      const parliamentName = await resolveParliamentName();
      if (parliamentName) body.parliament = parliamentName;
      if (voting) {
        body.votingResults = {
          yes: voting.results_yes,
          no: voting.results_no,
          abstention: voting.results_abstention,
          accepted: isVotingAccepted(voting),
        };
        if (voting.date) body.date = voting.date;
      }
      const { data, error } = await supabase.functions.invoke("summarize-affair", { body });
      if (error) throw error;
      const summaryText = data?.summary || "Keine Zusammenfassung verfügbar.";
      setSummary(summaryText);
      // Cache in database
      if (summaryText && summaryText !== "Keine Zusammenfassung verfügbar.") {
        supabase
          .from("affair_summaries")
          .upsert({ affair_id: String(affair.id), summary: summaryText }, { onConflict: "affair_id" })
          .then(() => {});
      }
    } catch (e) {
      console.error("Summary error:", e);
      setSummary("Zusammenfassung konnte nicht erstellt werden.");
    } finally {
      setSummaryLoading(false);
    }
  };
  const generateStory = async () => {
    if (!affair) return;
    setStoryLoading(true);
    setStoryModalOpen(true);
    try {
      const body: Record<string, unknown> = { title: affair.title_de };
      if (affair.type_de || affair.type_name_de || affair.type_harmonized_de) {
        body.type = affair.type_de || affair.type_name_de || affair.type_harmonized_de;
      }
      if (affair.status_de || affair.state_name_de) {
        body.status = affair.status_de || affair.state_name_de;
      }
      if (affair.begin_date) body.beginDate = affair.begin_date;
      if (affair.end_date) body.endDate = affair.end_date;
      const parliamentName = await resolveParliamentName();
      if (parliamentName) body.parliament = parliamentName;
      if (voting) {
        body.votingResults = {
          yes: voting.results_yes,
          no: voting.results_no,
          abstention: voting.results_abstention,
          accepted: isVotingAccepted(voting),
        };
        if (voting.date) body.date = voting.date;
      }
      if (summary) body.summary = summary;
      const { data, error } = await supabase.functions.invoke("generate-story", { body });
      if (error) throw error;
      let slides: StorySlide[] = data?.slides || [];

      // Fetch party breakdown and insert as a data-driven slide
      if (voting) {
        try {
          const votes = await fetchVotesForVoting(voting.id);
          const partyMap = new Map<string, { yes: number; no: number; total: number }>();
          for (const v of votes) {
            const party = shortenPartyName(v.person_party_de || v.person_parliamentary_group_name_de || "Unbekannt");
            if (!partyMap.has(party)) partyMap.set(party, { yes: 0, no: 0, total: 0 });
            const entry = partyMap.get(party)!;
            if (v.vote === "yes") { entry.yes++; entry.total++; }
            else if (v.vote === "no") { entry.no++; entry.total++; }
            else if (v.vote === "abstention") { entry.total++; }
          }
          const partyData: PartyVoteData[] = Array.from(partyMap.entries())
            .map(([party, d]) => ({ party, ...d }))
            .sort((a, b) => b.total - a.total);

          if (partyData.length > 0) {
            const partySlide: StorySlide = {
              headline: "So haben die Parteien gestimmt",
              body: "",
              emoji: "🏛️",
              slide_type: "party",
              partyData,
            };
            // Insert after "result" slide, or before last slide
            const resultIdx = slides.findIndex(s => s.slide_type === "result");
            const insertIdx = resultIdx >= 0 ? resultIdx + 1 : Math.max(slides.length - 1, 0);
            slides.splice(insertIdx, 0, partySlide);
          }
        } catch (e) {
          console.error("Party data fetch error:", e);
        }
      }

      setStorySlides(slides);
    } catch (e) {
      console.error("Story generation error:", e);
      setStorySlides([]);
    } finally {
      setStoryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const item = voting || affair;
  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Daten nicht gefunden.</p>
          <Link to={backUrl} className="text-accent hover:underline">← Zurück zur Übersicht</Link>
        </div>
      </div>
    );
  }

  const embedUrl = `${window.location.origin}/embed/${id}?type=${type}`;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to={backUrl} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Zurück zur Übersicht</span>
          </Link>
          <div className="flex items-center gap-1">
            {affair && (
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8" onClick={generateStory}>
                <Instagram className="w-3.5 h-3.5" />
                Stories
              </Button>
            )}
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8" onClick={() => setEmbedModalOpen(true)}>
              <Code2 className="w-3.5 h-3.5" />
              Einbetten
            </Button>
          </div>
        </div>
      </header>

      <EmbedCodeModal open={embedModalOpen} onOpenChange={setEmbedModalOpen} embedUrl={embedUrl} />
      <StoryPreviewModal open={storyModalOpen} onOpenChange={setStoryModalOpen} slides={storySlides} loading={storyLoading} />

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* Title section */}
        <div className="space-y-3 opacity-0 animate-fade-in" style={{ animationDelay: "0ms" }}>
          <div className="flex items-center gap-2">
            {type === "voting" ? (
              <Vote className="w-4 h-4 text-muted-foreground" />
            ) : (
              <FileText className="w-4 h-4 text-muted-foreground" />
            )}
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {type === "voting" ? "Abstimmung" : "Parlamentarisches Geschäft"}
            </p>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
            {voting
              ? voting.affair_title_de || voting.title_de || `Abstimmung #${voting.id}`
              : affair?.title_de || `Geschäft #${affair?.id}`}
          </h1>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* AI Summary */}
        {affair && (
          <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "50ms" }}>
            <CardContent className="p-6 space-y-3">
              {!summary && !summaryLoading && (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={generateSummary}
                  >
                    <Sparkles className="w-4 h-4" />
                    Zusammenfassung generieren
                  </Button>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Diese Funktion erstellt mithilfe von Künstlicher Intelligenz eine kurze, allgemeinverständliche Zusammenfassung des parlamentarischen Geschäfts. Die Zusammenfassung basiert auf den verfügbaren Daten wie Titel, Geschäftstyp, Status und Abstimmungsergebnissen. Angaben ohne Gewähr.
                  </p>
                </div>
              )}
              {summaryLoading && (
                <div className="flex items-center gap-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Zusammenfassung wird erstellt…</span>
                </div>
              )}
              {summary && !summaryLoading && (
                <>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-muted-foreground" />
                    <h2 className="font-serif text-lg font-semibold">Zusammenfassung</h2>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{summary}</p>
                  <p className="text-xs text-muted-foreground pt-1">Erstellt mit KI · Angaben ohne Gewähr</p>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Voting detail */}
        {voting && (
          <>
            <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
              <CardContent className="p-6 space-y-4">
                <h2 className="font-serif text-lg font-semibold">Ergebnis</h2>
                {voting.meaning_of_yes_de && (
                  <p className="text-sm text-muted-foreground">
                    Ja = {voting.meaning_of_yes_de}
                    {voting.meaning_of_no_de && ` · Nein = ${voting.meaning_of_no_de}`}
                  </p>
                )}
                <VoteBar
                  ja={voting.results_yes}
                  nein={voting.results_no}
                  enthaltungen={voting.results_abstention}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailRow label="Entscheid">
                    <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${isVotingAccepted(voting) ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                      {isVotingAccepted(voting) ? "Angenommen" : "Abgelehnt"}
                    </span>
                  </DetailRow>
                  <DetailRow label="Datum">
                    {voting.date ? new Date(voting.date).toLocaleDateString("de-CH") : "–"}
                  </DetailRow>
                  <DetailRow label="Ja / Nein / Enthaltung">
                    {voting.results_yes} / {voting.results_no} / {voting.results_abstention}
                  </DetailRow>
                  <DetailRow label="Abwesend">
                    {voting.results_absent}
                  </DetailRow>
                  <DetailRow label="Rat">
                    {voting.group_external_id === "Council_1"
                      ? "Nationalrat"
                      : voting.group_external_id === "Council_2"
                        ? "Ständerat"
                        : voting.group_external_id || "–"}
                  </DetailRow>
                  {voting.title_de && (
                    <DetailRow label="Abstimmungstyp">
                      {voting.title_de}
                    </DetailRow>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Linked affair context */}
            {affair && (
              <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "120ms" }}>
                <CardContent className="p-6 space-y-4">
                  <h2 className="font-serif text-lg font-semibold">Zugehöriges Geschäft</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DetailRow label="Geschäftstitel">
                      <span className="text-right">{affair.title_de || "–"}</span>
                    </DetailRow>
                    {affair.number && (
                      <DetailRow label="Geschäftsnummer">{affair.number}</DetailRow>
                    )}
                    {(affair.type_name_de || affair.type_harmonized_de) && (
                      <DetailRow label="Geschäftstyp">{affair.type_name_de || affair.type_harmonized_de}</DetailRow>
                    )}
                    {affair.state_name_de && (
                      <DetailRow label="Status">
                        <Badge variant="secondary" className="text-xs">{affair.state_name_de}</Badge>
                      </DetailRow>
                    )}
                    {affair.begin_date && (
                      <DetailRow label="Eingereicht">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          {new Date(affair.begin_date).toLocaleDateString("de-CH")}
                        </div>
                      </DetailRow>
                    )}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Link to={`/detail/${affair.id}?type=affair${bodyParam ? `&body=${encodeURIComponent(bodyParam)}` : ""}`}>
                      <Button variant="outline" size="sm" className="gap-2 text-xs">
                        <FileText className="w-3.5 h-3.5" />
                        Geschäft ansehen
                      </Button>
                    </Link>
                    {affair.url_external_de && (
                      <a href={affair.url_external_de} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-2 text-xs">
                          <ExternalLink className="w-3.5 h-3.5" />
                          parlament.ch
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related votings on same affair */}
            {relatedVotings.length > 0 && (
              <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "130ms" }}>
                <CardContent className="p-6 space-y-4">
                  <h2 className="font-serif text-lg font-semibold">
                    Weitere Abstimmungen zum selben Geschäft ({relatedVotings.length})
                  </h2>
                  <div className="space-y-2">
                    {relatedVotings.map((v) => (
                      <Link
                        key={v.id}
                        to={`/detail/${v.id}?type=voting${bodyParam ? `&body=${encodeURIComponent(bodyParam)}` : ""}`}
                        className="flex items-center justify-between py-2 px-3 -mx-3 rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="text-sm text-foreground truncate">
                            {v.title_de || `Abstimmung #${v.id}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {v.date ? new Date(v.date).toLocaleDateString("de-CH") : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <VoteBar ja={v.results_yes} nein={v.results_no} enthaltungen={v.results_abstention} compact />
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isVotingAccepted(v) ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                            {v.results_yes}:{v.results_no}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Party breakdown */}
            <VotingPartyBreakdown votingId={voting.id} />

            {voting.url_external_de && (
              <a href={voting.url_external_de} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Abstimmungsprotokoll auf parlament.ch
                </Button>
              </a>
            )}
          </>
        )}

        {/* Affair detail */}
        {affair && (
          <>
            <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
              <CardContent className="p-6 space-y-4">
                <h2 className="font-serif text-lg font-semibold">Details</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {affair.type_de && (
                    <DetailRow label="Typ">{affair.type_de}</DetailRow>
                  )}
                  {affair.status_de && (
                    <DetailRow label="Status">{affair.status_de}</DetailRow>
                  )}
                  {affair.begin_date && (
                    <DetailRow label="Eingereicht">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {new Date(affair.begin_date).toLocaleDateString("de-CH")}
                      </div>
                    </DetailRow>
                  )}
                  {affair.end_date && (
                    <DetailRow label="Abgeschlossen">
                      {new Date(affair.end_date).toLocaleDateString("de-CH")}
                    </DetailRow>
                  )}
                  {affair.external_id && (
                    <DetailRow label="Nummer">{affair.external_id}</DetailRow>
                  )}
                  {affair.type_harmonized && (
                    <DetailRow label="Kategorie">{affair.type_harmonized}</DetailRow>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Related votings */}
            {relatedVotings.length > 0 && (
              <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
                <CardContent className="p-6 space-y-4">
                  <h2 className="font-serif text-lg font-semibold">
                    Abstimmungen zu diesem Geschäft ({relatedVotings.length})
                  </h2>
                  <div className="space-y-2">
                    {relatedVotings.map((v) => (
                      <Link
                        key={v.id}
                        to={`/detail/${v.id}?type=voting${bodyParam ? `&body=${encodeURIComponent(bodyParam)}` : ""}`}
                        className="flex items-center justify-between py-2 px-3 -mx-3 rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="text-sm text-foreground truncate">
                            {v.title_de || `Abstimmung #${v.id}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {v.date ? new Date(v.date).toLocaleDateString("de-CH") : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <VoteBar ja={v.results_yes} nein={v.results_no} enthaltungen={v.results_abstention} compact />
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isVotingAccepted(v) ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                            {v.results_yes}:{v.results_no}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {affair.url_external_de && (
              <a href={affair.url_external_de} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Auf {(() => { try { return new URL(affair.url_external_de!).hostname.replace(/^www\./, ''); } catch { return 'Website'; } })()} ansehen
                </Button>
              </a>
            )}
          </>
        )}

        {/* Source */}
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

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/50">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{children}</span>
    </div>
  );
}

export default DetailPage;
