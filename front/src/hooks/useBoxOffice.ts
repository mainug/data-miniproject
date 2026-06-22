import { useState, useEffect } from "react";
import { fetchBoxOffice } from "../api/boxoffice";
import type { BoxOfficeEntry } from "../types/movie";

export function useBoxOffice(date?: string) {
  const [entries, setEntries] = useState<BoxOfficeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchBoxOffice(date);
        // 백엔드에 (date, rank) 중복 행이 있을 수 있어 rank 기준으로 중복 제거
        const seen = new Set<number>();
        const deduped = data.filter((e) =>
          seen.has(e.rank) ? false : seen.add(e.rank),
        );
        if (!cancelled) setEntries(deduped);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [date]);

  return { entries, loading, error };
}
