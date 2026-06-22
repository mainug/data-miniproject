import { useState, useEffect } from "react";
import { fetchDerivedStats } from "../api/analysis";
import type { DerivedStats } from "../types/movie";

export function useDerivedStats(date: string) {
  const [data, setData] = useState<DerivedStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const result = await fetchDerivedStats(date);
        // 백엔드에 (date, rank) 중복 행이 있을 수 있어 rank 기준으로 중복 제거
        const seen = new Set<number>();
        const deduped = result.filter((e) =>
          seen.has(e.rank) ? false : seen.add(e.rank),
        );
        if (!cancelled) setData(deduped);
      } catch {
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [date]);

  return { data, loading };
}
