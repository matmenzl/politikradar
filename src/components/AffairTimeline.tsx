import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import InfoHint from "@/components/InfoHint";
import { Info } from "lucide-react";
import { buildTimeline, formatStepDate, type TimelineStep } from "@/lib/affairStages";

interface Props {
  eventId: string;
  /** Business type (e.g. "Motion") — drives the forecast of upcoming stages. */
  businessType?: string | null;
  /** Fallback date if the API knows no steps at all. */
  fallbackDate?: string | null;
  fallbackState?: string | null;
}

/** Vertical procedural timeline for a parliamentary item. */
const AffairTimeline = ({ eventId, businessType, fallbackDate, fallbackState }: Props) => {
  const [steps, setSteps] = useState<TimelineStep[] | null>(null);
  const [state, setState] = useState<string | null>(fallbackState ?? null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const { data } = await supabase.functions.invoke("affair-timeline", {
        body: { event_id: eventId },
      });
      if (!active) return;
      setSteps((data?.timeline as TimelineStep[]) ?? []);
      if (data?.affair_state) setState(data.affair_state as string);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [eventId]);

  if (loading) {
    return (
      <section className="border border-border bg-card p-5">
        <h2 className="text-xs kicker text-muted-foreground">Verfahrensstand</h2>
        <p className="text-sm text-muted-foreground mt-2">Lade Verfahrensschritte…</p>
      </section>
    );
  }

  const real: TimelineStep[] =
    steps && steps.length
      ? steps
      : fallbackDate
        ? [
            {
              date: fallbackDate,
              title: fallbackState || "Eingereicht",
              actor: null,
              position: 1,
              last: true,
            },
          ]
        : [];

  if (real.length === 0) {
    return (
      <section className="border border-border bg-card p-5">
        <h2 className="text-xs kicker text-muted-foreground">Verfahrensstand</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Für dieses Geschäft sind keine Verfahrensschritte hinterlegt.
        </p>
      </section>
    );
  }

  const { steps: display, hasForecast } = buildTimeline(real, businessType);

  return (
    <section className="border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <h2 className="text-xs kicker text-muted-foreground">Verfahrensstand</h2>
        {hasForecast && (
          <InfoHint
            label="Erklärung: geplante Schritte"
            className="min-h-[36px] min-w-[36px] -m-1.5 p-1.5"
            trigger={<Info className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />}
          >
            <p className="font-semibold">Voraussichtliche Schritte</p>
            <p className="mt-1 text-muted-foreground">
              Künftige Etappen zeigen den typischen Ablauf für diesen Geschäftstyp. Sie sind keine
              Terminzusage – Reihenfolge und Zeitpunkt können abweichen.
            </p>
          </InfoHint>
        )}
      </div>

      {state && (
        <p className="text-sm text-foreground mt-2">
          Aktueller Status: <span className="font-medium">{state}</span>
        </p>
      )}

      <ol className="mt-4 space-y-0">
        {display.map((s, i) => {
          const isLast = i === display.length - 1;
          const upcoming = s.state === "upcoming";
          const current = s.state === "current";
          return (
            <li key={`${s.title}-${i}`} className="grid grid-cols-[16px_1fr] gap-3">
              <div className="flex flex-col items-center">
                <span
                  aria-hidden="true"
                  className={[
                    "mt-1.5 h-2.5 w-2.5 rounded-full border",
                    upcoming
                      ? "border-border bg-transparent"
                      : current
                        ? "border-foreground bg-foreground ring-4 ring-muted"
                        : "border-foreground bg-foreground",
                  ].join(" ")}
                />
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className={["w-px flex-1 my-1", upcoming ? "bg-border" : "bg-foreground/40"].join(" ")}
                  />
                )}
              </div>
              <div className={["pb-5", isLast ? "pb-0" : ""].join(" ")}>
                <p
                  className={[
                    "text-sm",
                    upcoming ? "text-muted-foreground" : "text-foreground",
                    current ? "font-semibold" : "",
                  ].join(" ")}
                >
                  {s.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {[
                    current ? "Aktueller Stand" : upcoming ? "voraussichtlich" : null,
                    s.untilDate && s.untilDate !== s.date
                      ? `${formatStepDate(s.date)} – ${formatStepDate(s.untilDate)}`
                      : formatStepDate(s.date),
                    s.actor,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

export default AffairTimeline;
