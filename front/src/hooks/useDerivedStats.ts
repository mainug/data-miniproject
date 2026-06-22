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
        if (!cancelled) setData(result);
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
