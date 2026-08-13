import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getWeekDateRange, formatDateRange } from "@/lib/api/openparldata";
import { useWeekParam } from "@/hooks/use-week";

interface WeekContextBarProps {
  /** Short note explaining what this section shows for the selected week */
  note?: string;
}

/**
 * Compact, repeated indicator that makes it obvious that the section
 * below is scoped to the globally selected calendar week.
 */
const WeekContextBar = ({ note }: WeekContextBarProps) => {
  const { year, week, goToPreviousWeek, goToNextWeek } = useWeekParam();
  const { from, to } = getWeekDateRange(year, week);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border border-ink/15 bg-secondary/40 px-3 py-2">
      <div className="flex items-center gap-2">
        <CalendarRange className="w-4 h-4 text-brand-blue shrink-0" />
        <span className="kicker text-[10px] text-brand-blue">
          KW {week} / {year}
        </span>
        <span className="text-xs text-muted-foreground">{formatDateRange(from, to)}</span>
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        <button
          onClick={goToPreviousWeek}
          aria-label="Vorherige Woche"
          className="h-[34px] w-[34px] flex items-center justify-center border border-ink/20 bg-background hover:bg-ink hover:text-background transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={goToNextWeek}
          aria-label="Nächste Woche"
          className="h-[34px] w-[34px] flex items-center justify-center border border-ink/20 bg-background hover:bg-ink hover:text-background transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {note && <p className="w-full text-xs text-muted-foreground">{note}</p>}
    </div>
  );
};

export default WeekContextBar;
