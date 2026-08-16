import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  CheckCircle2,
  Database,
  FileText,
  Loader2,
  RotateCcw,
  Sparkles,
  Wand2,
} from "lucide-react";
import { DEFAULT_SCORING, FACTOR_INFO, weightShare } from "@/lib/scoring";

/* ---------------------------------------------------------------- demo data */

interface DemoEvent {
  id: string;
  parliament: string;
  date: string;
  title: string;
  description: string;
  relevance: number;
  social: number;
  factors: Record<string, number>;
}

const DEMO_EVENTS: DemoEvent[] = [
  {
    id: "e1",
    parliament: "Kanton Zürich",
    date: "2026-08-11",
    title: "Kantonsrat lehnt Erhöhung der Kita-Beiträge knapp ab",
    description:
      "Mit 88 zu 84 Stimmen scheitert die Vorlage zur Erhöhung der kantonalen Kita-Subventionen.",
    relevance: 82,
    social: 88,
    factors: {
      decision_impact: 85,
      scope: 80,
      controversy: 95,
      topic_salience: 78,
      process_stage: 70,
      emotional_hook: 92,
      clarity: 88,
      everyday_relevance: 95,
      conflict: 90,
      visual_potential: 75,
      novelty: 70,
    },
  },
  {
    id: "e2",
    parliament: "Bern (BE)",
    date: "2026-08-12",
    title: "Stadtrat bewilligt 24 Millionen für Velo-Schnellrouten",
    description:
      "Der Kredit für vier neue Velo-Achsen passiert das Parlament mit 42 zu 26 Stimmen.",
    relevance: 71,
    social: 74,
    factors: {
      decision_impact: 78,
      scope: 60,
      controversy: 68,
      topic_salience: 72,
      process_stage: 80,
      emotional_hook: 70,
      clarity: 82,
      everyday_relevance: 76,
      conflict: 66,
      visual_potential: 84,
      novelty: 58,
    },
  },
  {
    id: "e3",
    parliament: "Nationalrat",
    date: "2026-08-13",
    title: "Motion zur Offenlegung von Lobbymandaten überwiesen",
    description:
      "Der Nationalrat verlangt mit 112 zu 74 Stimmen ein öffentliches Register aller Mandate.",
    relevance: 76,
    social: 69,
    factors: {
      decision_impact: 65,
      scope: 90,
      controversy: 80,
      topic_salience: 74,
      process_stage: 60,
      emotional_hook: 68,
      clarity: 64,
      everyday_relevance: 55,
      conflict: 82,
      visual_potential: 60,
      novelty: 78,
    },
  },
  {
    id: "e4",
    parliament: "Kanton Aargau",
    date: "2026-08-10",
    title: "Redaktionelle Bereinigung des Gesetzestextes genehmigt",
    description: "Formelle Anpassung ohne inhaltliche Änderung, einstimmig angenommen.",
    relevance: 24,
    social: 12,
    factors: {
      decision_impact: 20,
      scope: 30,
      controversy: 8,
      topic_salience: 15,
      process_stage: 40,
      emotional_hook: 8,
      clarity: 30,
      everyday_relevance: 10,
      conflict: 5,
      visual_potential: 12,
      novelty: 10,
    },
  },
  {
    id: "e5",
    parliament: "Luzern (LU)",
    date: "2026-08-14",
    title: "Gemeinderat erhöht Parkgebühren in der Innenstadt um 40 Prozent",
    description: "Die neuen Tarife gelten ab Januar, der Widerstand aus dem Gewerbe ist gross.",
    relevance: 63,
    social: 81,
    factors: {
      decision_impact: 70,
      scope: 45,
      controversy: 76,
      topic_salience: 62,
      process_stage: 72,
      emotional_hook: 88,
      clarity: 90,
      everyday_relevance: 92,
      conflict: 74,
      visual_potential: 66,
      novelty: 52,
    },
  },
];

const DEMO_SLIDES = [
  {
    type: "Hook",
    headline: "88 zu 84.",
    body: "Vier Stimmen entscheiden, wie teuer die Kita in Zürich bleibt.",
  },
  {
    type: "Fakt",
    headline: "Was abgelehnt wurde",
    body: "Die Erhöhung der kantonalen Kita-Subventionen um 60 Mio. Franken pro Jahr.",
  },
  {
    type: "Kontext",
    headline: "Wen es trifft",
    body: "Rund 34'000 Familien im Kanton zahlen weiterhin die bisherigen Elternbeiträge.",
  },
  {
    type: "Quelle",
    headline: "Beleg",
    body: "Kantonsrat Zürich, Abstimmung vom 11.08.2026 – OpenParlData.",
  },
];

const STEPS = [
  { key: "import", label: "Daten laden", icon: Database },
  { key: "score", label: "Bewerten", icon: Sparkles },
  { key: "select", label: "Top Story wählen", icon: CheckCircle2 },
  { key: "story", label: "Story bauen", icon: Wand2 },
] as const;

/* -------------------------------------------------------------------- page */

const Demo = () => {
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [imported, setImported] = useState(0);
  const [scored, setScored] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [slides, setSlides] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const queue = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setStep(0);
    setRunning(false);
    setImported(0);
    setScored(0);
    setSelected(null);
    setSlides(0);
  };

  const runImport = () => {
    setRunning(true);
    let n = 0;
    const tick = () => {
      n += 1;
      setImported(n);
      if (n < DEMO_EVENTS.length) queue(tick, 260);
      else queue(() => { setRunning(false); setStep(1); }, 400);
    };
    queue(tick, 250);
  };

  const runScore = () => {
    setRunning(true);
    let n = 0;
    const tick = () => {
      n += 1;
      setScored(n);
      if (n < DEMO_EVENTS.length) queue(tick, 420);
      else queue(() => { setRunning(false); setStep(2); }, 500);
    };
    queue(tick, 400);
  };

  const runStory = () => {
    setRunning(true);
    let n = 0;
    const tick = () => {
      n += 1;
      setSlides(n);
      if (n < DEMO_SLIDES.length) queue(tick, 500);
      else queue(() => setRunning(false), 400);
    };
    queue(tick, 450);
  };

  const ranked = [...DEMO_EVENTS].sort(
    (a, b) => b.relevance + b.social - (a.relevance + a.social),
  );
  const selectedEvent = ranked.find((e) => e.id === selected) ?? null;

  return (
    <AppShell>
      <div className="space-y-8">
        <header className="space-y-2">
          <Badge variant="secondary" className="font-sans">Interaktive Demo</Badge>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground">
            Von der Recherche zur Top Story
          </h1>
          <p className="text-muted-foreground font-sans max-w-2xl">
            Vier Schritte, ein Klick pro Schritt: So verwandelt PolitikRadar rohe
            Parlamentsdaten in eine fertige Social-Media-Story. Alle Daten hier sind
            Beispieldaten.
          </p>
        </header>

        {/* Stepper */}
        <ol className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = i === step;
            const done = i < step;
            return (
              <li
                key={s.key}
                className={[
                  "flex items-center gap-2 border px-3 py-2 font-sans text-sm",
                  active
                    ? "border-foreground bg-ink text-paper"
                    : done
                      ? "border-border text-foreground"
                      : "border-border text-muted-foreground",
                ].join(" ")}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="font-semibold">{i + 1}. {s.label}</span>
              </li>
            );
          })}
        </ol>

        {/* Step 1 */}
        <section className="border border-border p-4 md:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl">1. OpenParl-Daten laden</h2>
              <p className="text-sm text-muted-foreground font-sans">
                Beschlüsse, Abstimmungen und Vorstösse aus Bund, Kantonen und Gemeinden –
                für den gewählten Zeitraum (10.–14. August 2026).
              </p>
            </div>
            <Button onClick={runImport} disabled={running || imported > 0} className="font-sans">
              {running && step === 0 ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              Daten laden
            </Button>
          </div>
          <Progress value={(imported / DEMO_EVENTS.length) * 100} />
          <div className="space-y-2">
            {DEMO_EVENTS.slice(0, imported).map((e) => (
              <div key={e.id} className="border border-border p-3 animate-fade-in">
                <div className="flex flex-wrap items-center gap-2 text-xs font-sans text-muted-foreground">
                  <span className="font-semibold text-foreground">{e.parliament}</span>
                  <span>{e.date}</span>
                </div>
                <p className="font-sans text-sm mt-1">{e.title}</p>
              </div>
            ))}
            {imported === 0 && (
              <p className="text-sm text-muted-foreground font-sans">
                Noch keine Ereignisse geladen.
              </p>
            )}
          </div>
          {imported === DEMO_EVENTS.length && (
            <p className="text-sm font-sans text-foreground">
              {DEMO_EVENTS.length} Ereignisse importiert – ohne Bewertung noch alle gleich
              gewichtet.
            </p>
          )}
        </section>

        {/* Step 2 */}
        <section
          className={`border border-border p-4 md:p-6 space-y-4 ${step < 1 ? "opacity-50 pointer-events-none" : ""}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl">2. Ereignisse bewerten</h2>
              <p className="text-sm text-muted-foreground font-sans">
                Die KI vergibt pro Ereignis Punkte auf 11 nachvollziehbaren Faktoren –
                gewichtet nach deinen Kriterien.
              </p>
            </div>
            <Button onClick={runScore} disabled={running || scored > 0} className="font-sans">
              {running && step === 1 ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Bewerten
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {DEMO_EVENTS.map((e, i) => {
              const isScored = i < scored;
              return (
                <div key={e.id} className="border border-border p-3 space-y-2">
                  <p className="font-sans text-sm">{e.title}</p>
                  {isScored ? (
                    <div className="flex gap-4 text-xs font-sans animate-fade-in">
                      <span>
                        Relevanz <strong className="text-foreground">{e.relevance}</strong>
                      </span>
                      <span>
                        Social <strong className="text-foreground">{e.social}</strong>
                      </span>
                      {e.relevance >= DEFAULT_SCORING.thresholds.top_story ||
                      e.social >= DEFAULT_SCORING.thresholds.top_story ? (
                        <Badge className="font-sans">Top Story</Badge>
                      ) : (
                        <Badge variant="secondary" className="font-sans">Beobachten</Badge>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground font-sans">
                      noch nicht bewertet
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Step 3 */}
        <section
          className={`border border-border p-4 md:p-6 space-y-4 ${step < 2 ? "opacity-50 pointer-events-none" : ""}`}
        >
          <div>
            <h2 className="font-serif text-xl">3. Top Story auswählen</h2>
            <p className="text-sm text-muted-foreground font-sans">
              Sortiert nach Gesamtpotenzial. Klick auf ein Ereignis zeigt, warum es oben steht.
            </p>
          </div>

          <div className="space-y-2">
            {ranked.map((e, i) => (
              <button
                key={e.id}
                onClick={() => { setSelected(e.id); setStep(3); }}
                className={[
                  "w-full text-left border p-3 transition-colors",
                  selected === e.id
                    ? "border-foreground bg-muted"
                    : "border-border hover:bg-muted/50",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="font-sans text-xs text-muted-foreground">
                      #{i + 1} · {e.parliament}
                    </span>
                    <p className="font-sans text-sm">{e.title}</p>
                  </div>
                  <div className="text-right font-sans text-xs shrink-0">
                    <div>R {e.relevance}</div>
                    <div>S {e.social}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selectedEvent && (
            <div className="border border-border p-4 space-y-3 animate-fade-in">
              <h3 className="font-serif text-lg">Warum diese Story?</h3>
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
                {Object.entries(selectedEvent.factors).map(([key, value]) => {
                  const info = FACTOR_INFO[key];
                  const inRelevance = key in DEFAULT_SCORING.relevance_weights;
                  const share = weightShare(
                    inRelevance
                      ? DEFAULT_SCORING.relevance_weights
                      : DEFAULT_SCORING.social_weights,
                    key,
                  );
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-sans">
                        <span title={info?.hint}>{info?.label ?? key}</span>
                        <span className="text-muted-foreground">
                          {value} · Gewicht {Math.round(share)}%
                        </span>
                      </div>
                      <Progress value={value} className="h-1.5" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Step 4 */}
        <section
          className={`border border-border p-4 md:p-6 space-y-4 ${step < 3 ? "opacity-50 pointer-events-none" : ""}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl">4. Story generieren</h2>
              <p className="text-sm text-muted-foreground font-sans">
                Aus den geprüften Fakten entstehen Slides – jede Zahl bleibt an ihre Quelle
                gebunden.
              </p>
            </div>
            <Button onClick={runStory} disabled={running || !selected || slides > 0} className="font-sans">
              {running && step === 3 ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              Slides bauen
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DEMO_SLIDES.map((s, i) => (
              <div
                key={s.type}
                className={[
                  "aspect-[9/16] border p-3 flex flex-col justify-between",
                  i < slides
                    ? "border-foreground bg-ink text-paper animate-fade-in"
                    : "border-dashed border-border text-muted-foreground",
                ].join(" ")}
              >
                <span className="font-sans text-[10px] uppercase tracking-wide">{s.type}</span>
                {i < slides ? (
                  <div className="space-y-2">
                    <p className="font-serif text-lg leading-tight">{s.headline}</p>
                    <p className="font-sans text-xs leading-snug">{s.body}</p>
                  </div>
                ) : (
                  <FileText className="h-5 w-5 self-center opacity-40" />
                )}
                <span className="font-sans text-[10px] opacity-60">Slide {i + 1}</span>
              </div>
            ))}
          </div>

          {slides === DEMO_SLIDES.length && (
            <div className="border border-border p-4 space-y-3 animate-fade-in">
              <p className="font-sans text-sm">
                Fertig: Aus {DEMO_EVENTS.length} Rohereignissen wurde in vier Schritten eine
                publikationsreife Story – statt stundenlanger Recherche.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild className="font-sans">
                  <Link to="/">
                    Mit echten Daten starten <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" onClick={reset} className="font-sans">
                  <RotateCcw className="h-4 w-4" /> Demo neu starten
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
};

export default Demo;
