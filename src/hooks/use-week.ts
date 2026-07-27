import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { getCurrentISOWeek } from "@/lib/api/openparldata";

/**
 * Appends year/week to a link target, but only when it differs from the
 * current ISO week — default links stay clean.
 */
export function weekQuery(year: number, week: number, base = ""): string {
  const current = getCurrentISOWeek();
  if (current.year === year && current.week === week) return base;
  const [path, existing] = base.split("?");
  const params = new URLSearchParams(existing || "");
  params.set("year", String(year));
  params.set("week", String(week));
  return `${path}?${params.toString()}`;
}

/**
 * Reads the selected calendar week from the URL (?year=&week=), falling back
 * to the current ISO week. Writing merges with existing params so `tab`,
 * `body` etc. survive.
 */
export function useWeekParam() {
  const [searchParams, setSearchParams] = useSearchParams();
  const current = getCurrentISOWeek();

  const { year, week } = useMemo(() => {
    const y = Number(searchParams.get("year"));
    const w = Number(searchParams.get("week"));
    const valid =
      Number.isInteger(y) &&
      Number.isInteger(w) &&
      y >= 2000 &&
      y <= current.year + 1 &&
      w >= 1 &&
      w <= 53;
    return valid ? { year: y, week: w } : { year: current.year, week: current.week };
  }, [searchParams, current.year, current.week]);

  const setWeek = useCallback(
    (nextYear: number, nextWeek: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (nextYear === current.year && nextWeek === current.week) {
            next.delete("year");
            next.delete("week");
          } else {
            next.set("year", String(nextYear));
            next.set("week", String(nextWeek));
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams, current.year, current.week]
  );

  const goToPreviousWeek = useCallback(() => {
    if (week <= 1) setWeek(year - 1, 52);
    else setWeek(year, week - 1);
  }, [year, week, setWeek]);

  const goToNextWeek = useCallback(() => {
    if (week >= 52) setWeek(year + 1, 1);
    else setWeek(year, week + 1);
  }, [year, week, setWeek]);

  const withWeek = useCallback(
    (base: string) => weekQuery(year, week, base),
    [year, week]
  );

  return {
    year,
    week,
    setWeek,
    goToPreviousWeek,
    goToNextWeek,
    withWeek,
    isCurrentWeek: year === current.year && week === current.week,
  };
}
