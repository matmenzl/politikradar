import { useParams, useSearchParams } from "react-router-dom";
import { Loader2, ExternalLink, Calendar, FileText, Vote, Tag, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import VoteBar from "@/components/VoteBar";
import VotingPartyBreakdown from "@/components/VotingPartyBreakdown";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type Voting, type Affair, isVotingAccepted } from "@/lib/api/openparldata";

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

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/50">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{children}</span>
    </div>
  );
}

const EmbedDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "voting";

  const [voting, setVoting] = useState<Voting | null>(null);
  const [affair, setAffair] = useState<AffairDetail | null>(null);
  const [relatedVotings, setRelatedVotings] = useState<Voting[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    if (type === "voting") {
      fetchDetail<Voting>("/votings", id)
        .then(async (v) => {
          setVoting(v);
          if (v?.affair_id) {
            try {
              const a = await fetchDetail<AffairDetail>("/affairs", String(v.affair_id));
              if (a) setAffair(a);
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
          if (a) {
            try {
              const res = await fetch(`${BASE_URL}/affairs/${id}/votings?lang=de&lang_format=flat&hide_null=true`);
              if (res.ok) {
                const json = await res.json();
                setRelatedVotings(json.data || []);
              }
            } catch {}
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

  // Load cached summary
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-background">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const item = voting || affair;
  if (!item) {
    return (
      <div className="flex items-center justify-center p-8 bg-background">
        <p className="text-sm text-muted-foreground">Daten nicht gefunden.</p>
      </div>
    );
  }

  const fullUrl = `${window.location.origin}/detail/${id}?type=${type}`;

  return (
    <div className="bg-background text-foreground p-4 space-y-4" style={{ fontFamily: "'Source Serif 4', 'Inter', sans-serif" }}>
      {/* Title */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {type === "voting" ? (
            <Vote className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          <p className="text-xs kicker text-muted-foreground">
            {type === "voting" ? "Abstimmung" : "Parlamentarisches Geschäft"}
          </p>
        </div>
        <h1 className="font-serif text-xl md:text-2xl font-normal text-foreground leading-tight">
          {voting
            ? voting.affair_title_de || voting.title_de || `Abstimmung #${voting.id}`
            : affair?.title_de || `Geschäft #${affair?.id}`}
        </h1>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* AI Summary (cached only) */}
      {summary && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
              <h2 className="font-serif text-sm font-normal">Zusammenfassung</h2>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{summary}</p>
            <p className="text-xs text-muted-foreground">Erstellt mit KI · Angaben ohne Gewähr</p>
          </CardContent>
        </Card>
      )}

      {/* Voting result */}
      {voting && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="font-serif text-sm font-normal">Ergebnis</h2>
            {voting.meaning_of_yes_de && (
              <p className="text-xs text-muted-foreground">
                Ja = {voting.meaning_of_yes_de}
                {voting.meaning_of_no_de && ` · Nein = ${voting.meaning_of_no_de}`}
              </p>
            )}
            <VoteBar ja={voting.results_yes} nein={voting.results_no} enthaltungen={voting.results_abstention} />
            <div className="grid gap-2 sm:grid-cols-2">
              <DetailRow label="Entscheid">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isVotingAccepted(voting) ? "bg-brand-green-soft text-brand-green" : "bg-brand-red-soft text-brand-red"}`}>
                  {isVotingAccepted(voting) ? "Angenommen" : "Abgelehnt"}
                </span>
              </DetailRow>
              <DetailRow label="Datum">
                {voting.date ? new Date(voting.date).toLocaleDateString("de-CH") : "–"}
              </DetailRow>
              <DetailRow label="Ja / Nein / Enthaltung">
                {voting.results_yes} / {voting.results_no} / {voting.results_abstention}
              </DetailRow>
              <DetailRow label="Rat">
                {voting.group_external_id === "Council_1"
                  ? "Nationalrat"
                  : voting.group_external_id === "Council_2"
                    ? "Ständerat"
                    : voting.group_external_id || "–"}
              </DetailRow>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related votings (compact) */}
      {relatedVotings.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <h2 className="font-serif text-sm font-normal">
              {type === "voting" ? "Weitere Abstimmungen" : "Abstimmungen"} ({relatedVotings.length})
            </h2>
            <div className="space-y-1">
              {relatedVotings.slice(0, 5).map((v) => (
                <div key={v.id} className="flex items-center justify-between py-1.5">
                  <p className="text-xs text-foreground truncate flex-1 mr-2">
                    {v.title_de || `Abstimmung #${v.id}`}
                  </p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <VoteBar ja={v.results_yes} nein={v.results_no} enthaltungen={v.results_abstention} compact />
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${isVotingAccepted(v) ? "bg-brand-green-soft text-brand-green" : "bg-brand-red-soft text-brand-red"}`}>
                      {v.results_yes}:{v.results_no}
                    </span>
                  </div>
                </div>
              ))}
              {relatedVotings.length > 5 && (
                <p className="text-xs text-muted-foreground pt-1">
                  + {relatedVotings.length - 5} weitere
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Party breakdown */}
      {voting && <VotingPartyBreakdown votingId={voting.id} />}

      {/* Footer with link to full page */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          Daten: <a href="https://openparldata.ch" target="_blank" rel="noopener noreferrer" className="underline">OpenParlData.ch</a>
        </p>
        <a href={fullUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7">
            <ExternalLink className="w-3 h-3" />
            Auf Politikradar ansehen
          </Button>
        </a>
      </div>
    </div>
  );
};

export default EmbedDetailPage;
