import { useEffect, useState } from "react";
import {
  fetchBodies,
  fetchAffairsForWeek,
  fetchVotingsForWeek,
} from "@/lib/api/openparldata";
import type { AffairWithBody, VotingWithBody } from "@/components/admin/shared";

/**
 * Loads affairs and votings for a date range across all parliaments.
 * Shared by the public research view and the AI analysis section.
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
        const bodies = await fetchBodies();
        const allA: AffairWithBody[] = [];
        const allV: VotingWithBody[] = [];
        const batchSize = 5;
        for (let i = 0; i < bodies.length; i += batchSize) {
          const batch = bodies.slice(i, i + batchSize);
          const [aRes, vRes] = await Promise.all([
            Promise.all(
              batch.map(async (b) => {
                const res = await fetchAffairsForWeek(from, to, b.key);
                return res.data.map((a) => ({ ...a, bodyName: b.name_de || b.key }));
              })
            ),
            Promise.all(
              batch.map(async (b) => {
                const res = await fetchVotingsForWeek(from, to, b.key);
                return res.data.map((v) => ({ ...v, bodyName: b.name_de || b.key }));
              })
            ),
          ]);
          aRes.forEach((r) => allA.push(...r));
          vRes.forEach((r) => allV.push(...r));
        }
        if (cancelled) return;
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
