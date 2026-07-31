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
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border/60 bg-secondary/30 px-3 py-2">
      <div className="flex items-center gap-2">
        <CalendarRange className="w-4 h-4 text-accent shrink-0" />
        <span className="text-sm font-medium text-foreground">
          KW {week} / {year}
        </span>
        <span className="text-xs text-muted-foreground">{formatDateRange(from, to)}</span>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToPreviousWeek} aria-label="Vorherige Woche">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToNextWeek} aria-label="Nächste Woche">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {note && <p className="w-full text-xs text-muted-foreground">{note}</p>}
    </div>
  );
};

export default WeekContextBar;
