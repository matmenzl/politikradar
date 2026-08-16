import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Sparkles, Star, Search, ArrowRight, ArrowLeft, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "radar-onboarding-seen-v2";

const steps = [
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
      "Tippe auf 'Ereignisse bewerten'. Die App lädt Geschäfte und Abstimmungen aus OpenParlData und bewertet sie per KI anhand 11 Faktoren. Das dauert einen Moment.",
  },
  {
    icon: Star,
    title: "Top Storys finden",
    description:
      "Die besten Ergebnisse landen unter 'Top Story'. Tippe eine Karte an, um Details zu sehen und mit 'Story erstellen' in den Story Studio zu überführen.",
  },
];

interface RadarOnboardingProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const RadarOnboarding = ({ open: controlledOpen, onOpenChange }: RadarOnboardingProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [step, setStep] = useState(0);

  const open = controlledOpen ?? internalOpen;
  const setOpen = (value: boolean) => {
    setInternalOpen(value);
    onOpenChange?.(value);
  };

  useEffect(() => {
    if (controlledOpen !== undefined) return;
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      setInternalOpen(true);
    }
  }, [controlledOpen]);

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  const next = () => {
    if (step < steps.length - 1) setStep((s) => s + 1);
    else finish();
  };

  const prev = () => setStep((s) => Math.max(0, s - 1));

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(value) => {
          if (!value) finish();
          setOpen(value);
        }}
      >
        <SheetContent side="bottom" className="h-auto max-h-[85vh] sm:max-h-[32rem] px-6 pb-8 pt-6">
          <SheetHeader className="text-left sm:text-left space-y-1">
            <SheetTitle className="font-serif text-2xl">Radar kennenlernen</SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              So funktioniert die Ereignis-Bewertung auf mobilen Geräten.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 inline-flex items-center justify-center w-12 h-12 bg-ink text-paper">
                {(() => {
                  const Icon = steps[step].icon;
                  return <Icon className="w-6 h-6" aria-hidden="true" />;
                })()}
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-xl">{steps[step].title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {steps[step].description}
                </p>
              </div>
            </div>

            <div className="flex justify-center gap-2">
              {steps.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Schritt ${i + 1}`}
                  aria-current={i === step ? "step" : undefined}
                  onClick={() => setStep(i)}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-colors min-h-[28px] min-w-[28px]",
                    i === step ? "bg-ink" : "bg-muted hover:bg-muted-foreground/30",
                  )}
                />
              ))}
            </div>

            <div className="flex gap-3 pt-2">
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
                {step === steps.length - 1 ? "Loslegen" : "Weiter"}
                {step === steps.length - 1 ? null : <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>

            {step === steps.length - 1 && (
              <p className="text-xs text-center text-muted-foreground">
                Du kannst diese Einführung jederzeit über das Hilfe-Icon oben wieder öffnen.
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <button
        type="button"
        aria-label="Radar-Einführung öffnen"
        onClick={() => {
          setStep(0);
          setOpen(true);
        }}
        className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] -m-2.5 p-2.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <HelpCircle className="w-5 h-5" aria-hidden="true" />
      </button>
    </>
  );
};

export default RadarOnboarding;
export { STORAGE_KEY };
