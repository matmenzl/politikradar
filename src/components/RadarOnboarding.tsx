import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  forwardRef,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Star, Search, ArrowRight, ArrowLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "radar-onboarding-seen-v2";

type Step = {
  icon: typeof Search;
  title: string;
  description: string;
  target?: string;
};

const steps: Step[] = [
  {
    icon: Search,
    title: "Radar im Überblick",
    description:
      "Radar zeigt dir politische Ereignisse aus OpenParlData für deinen gewählten Zeitraum und bereitet sie als Story-Vorschläge auf.",
  },
  {
    icon: Sparkles,
    title: "Ereignisse bewerten",
    description:
      "Tippe auf „Ereignisse bewerten“. Die App lädt Geschäfte und Abstimmungen aus OpenParlData und bewertet sie per KI anhand 11 Faktoren. Das dauert einen Moment.",
    target: '[data-tour="score-button"]',
  },
  {
    icon: Star,
    title: "Top Storys finden",
    description:
      "Die besten Ergebnisse landen unter „Top Story“. Tippe eine Karte an, um Details zu sehen und mit „Story erstellen“ in den Story Studio zu überführen.",
    target: '[data-tour="top-stories"]',
  },
];

export interface RadarOnboardingRef {
  open: () => void;
  reset: () => void;
}

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 8;

const RadarOnboarding = forwardRef<RadarOnboardingRef>((_, ref) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const didAutoOpen = useRef(false);

  const doOpen = useCallback(() => {
    setStep(0);
    setOpen(true);
  }, []);

  useImperativeHandle(ref, () => ({
    open: doOpen,
    reset: () => {
      localStorage.removeItem(STORAGE_KEY);
      doOpen();
    },
  }));

  useEffect(() => {
    if (didAutoOpen.current) return;
    if (!localStorage.getItem(STORAGE_KEY)) {
      didAutoOpen.current = true;
      setOpen(true);
    }
  }, []);

  const measure = useCallback(() => {
    const selector = steps[step].target;
    if (!selector) return setRect(null);
    const el = document.querySelector(selector);
    if (!el) return setRect(null);
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  useLayoutEffect(() => {
    if (!open) return;
    const selector = steps[step].target;
    const el = selector ? document.querySelector(selector) : null;
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    measure();
    const t = window.setTimeout(measure, 350);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, step, measure]);

  const finish = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  }, []);

  const next = () => (step < steps.length - 1 ? setStep((s) => s + 1) : finish());
  const prev = () => setStep((s) => Math.max(0, s - 1));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step]);

  if (!open) return null;

  const Icon = steps[step].icon;
  const isLast = step === steps.length - 1;

  const placeBelow = rect ? rect.top + rect.height + 16 + 220 < window.innerHeight : true;
  const cardStyle: React.CSSProperties = rect
    ? placeBelow
      ? { top: rect.top + rect.height + PAD + 12, left: 16, right: 16 }
      : { bottom: window.innerHeight - rect.top + PAD + 12, left: 16, right: 16 }
    : { left: 16, right: 16, bottom: 24 };

  return createPortal(
    <div
      className="fixed inset-0 z-[60]"
      role="dialog"
      aria-modal="true"
      aria-label="Radar-Einführung"
    >
      {rect ? (
        <>
          <div className="absolute inset-0" onClick={finish} />
          <div
            className="absolute pointer-events-none border-2 border-brand-red transition-all duration-300"
            style={{
              top: rect.top - PAD,
              left: rect.left - PAD,
              width: rect.width + PAD * 2,
              height: rect.height + PAD * 2,
              boxShadow: "0 0 0 9999px hsl(var(--foreground) / 0.7)",
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-foreground/70" onClick={finish} />
      )}

      <div
        className="absolute mx-auto max-w-md bg-card text-card-foreground border border-border shadow-xl p-5 space-y-4"
        style={cardStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Einführung schliessen"
          onClick={finish}
          className="absolute top-2 right-2 inline-flex items-center justify-center min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        <div className="flex items-start gap-4 pr-8">
          <div className="shrink-0 inline-flex items-center justify-center w-11 h-11 bg-ink text-paper">
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs kicker text-muted-foreground">
              Schritt {step + 1} von {steps.length}
            </p>
            <h3 className="font-serif text-xl">{steps[step].title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {steps[step].description}
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-1">
          {steps.map((s, i) => (
            <button
              key={s.title}
              type="button"
              aria-label={`Schritt ${i + 1}`}
              aria-current={i === step ? "step" : undefined}
              onClick={() => setStep(i)}
              className="inline-flex items-center justify-center min-h-[36px] min-w-[36px]"
            >
              <span
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-colors",
                  i === step ? "bg-ink" : "bg-muted",
                )}
              />
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            className="min-h-[48px]"
            onClick={prev}
            disabled={step === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <Button size="lg" className="flex-1 min-h-[48px]" onClick={next}>
            {isLast ? "Loslegen" : "Weiter"}
            {isLast ? null : <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
});

RadarOnboarding.displayName = "RadarOnboarding";

export default RadarOnboarding;
export { STORAGE_KEY };
