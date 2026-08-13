import { useEffect, useState } from "react";
import {
  fetchBodies,
  fetchAllAffairsInRange,
  fetchAllVotingsInRange,
} from "@/lib/api/openparldata";
import type { AffairWithBody, VotingWithBody } from "@/components/admin/shared";

/**
 * Loads affairs and votings for a date range across all parliaments.
 * Uses the global, date-sorted API endpoints (few requests) instead of
 * querying every parliament individually.
 */
export function useRangeItems(from: string, to: string) {
  const [affairs, setAffairs] = useState<AffairWithBody[]>([]);
  const [votings, setVotings] = useState<VotingWithBody[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!from || !to) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const [bodies, rawAffairs, rawVotings] = await Promise.all([
          fetchBodies(),
          fetchAllAffairsInRange(from, to),
          fetchAllVotingsInRange(from, to),
        ]);
        if (cancelled) return;

        const nameByKey = new Map(bodies.map((b) => [b.key, b.name_de || b.key]));
        const allA: AffairWithBody[] = rawAffairs
          .filter((a) => nameByKey.has(a.body_key))
          .map((a) => ({ ...a, bodyName: nameByKey.get(a.body_key)! }));
        const allV: VotingWithBody[] = rawVotings
          .filter((v) => nameByKey.has(v.body_key))
          .map((v) => ({ ...v, bodyName: nameByKey.get(v.body_key)! }));

        allA.sort(
          (a, b) => new Date(b.begin_date || "").getTime() - new Date(a.begin_date || "").getTime()
        );
        allV.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setAffairs(allA);
        setVotings(allV);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [from, to]);

  return { affairs, votings, loading };
}
