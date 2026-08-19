import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, ExternalLink, Link2, RefreshCw } from "lucide-react";

interface BrokenLink {
  kind: "event" | "story";
  id: string;
  eventId: string;
  url: string;
  reason: string;
  label: string;
  title: string | null;
}

interface CheckResult {
  days: number;
  checked: number;
  valid_events: number;
  valid_stories: number;
  broken: BrokenLink[];
  checked_at: string;
}

/** Redaktion panel: validates all newsletter deeplinks and lists broken ids. */
const LinkCheckPanel = () => {
  const [days, setDays] = useState("30");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("check-deeplinks", {
      body: { days: Number(days) },
    });
    setLoading(false);
    if (error || data?.error) {
      toast.error(data?.error || "Link-Check fehlgeschlagen.");
      return;
    }
    setResult(data as CheckResult);
    const broken = (data as CheckResult).broken.length;
    if (broken === 0) toast.success("Alle Deeplinks funktionieren.");
    else toast.warning(`${broken} fehlerhafte Deeplinks gefunden.`);
  };

  return (
    <section className="border border-border bg-card p-4 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="text-xs kicker text-muted-foreground">Newsletter</span>
          <h2 className="font-serif text-xl text-foreground flex items-center gap-2">
            <Link2 className="w-4 h-4" /> Link-Check
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Prüft serverseitig, ob alle Deeplinks im Versand eine gültige Seite treffen.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Letzte 7 Tage</SelectItem>
              <SelectItem value="30">Letzte 30 Tage</SelectItem>
              <SelectItem value="90">Letzte 90 Tage</SelectItem>
              <SelectItem value="365">Letztes Jahr</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={run} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Prüfe…" : "Prüfen"}
          </Button>
        </div>
      </div>

      {result && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary">{result.checked} Links geprüft</Badge>
            <Badge variant="outline">{result.valid_events} Geschäfte ok</Badge>
            <Badge variant="outline">{result.valid_stories} Stories ok</Badge>
            <Badge variant={result.broken.length ? "destructive" : "secondary"}>
              {result.broken.length} fehlerhaft
            </Badge>
          </div>

          {result.broken.length === 0 ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" /> Keine fehlerhaften IDs im Zeitraum.
            </p>
          ) : (
            <ul className="space-y-2">
              {result.broken.map((b) => (
                <li key={`${b.kind}-${b.id}`} className="border border-border p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="destructive">{b.label}</Badge>
                    <span className="text-xs kicker text-muted-foreground">
                      {b.kind === "story" ? "Story" : "Geschäft"}
                    </span>
                  </div>
                  {b.title && <p className="text-foreground mt-1">{b.title}</p>}
                  <p className="text-xs text-muted-foreground font-mono break-all mt-1">{b.id}</p>
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs underline underline-offset-4 mt-1"
                  >
                    {b.url} <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
};

export default LinkCheckPanel;
