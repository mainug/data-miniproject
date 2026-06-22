import { useState, useEffect } from "react";
import { fetchAllTimeRankings } from "../api/analysis";
import type { AllTimeRanking } from "../types/movie";

export function useAllTimeRankings(sortBy: "audience" | "sales", limit = 20) {
  const [data, setData] = useState<AllTimeRanking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const result = await fetchAllTimeRankings(sortBy, limit);
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
  }, [sortBy, limit]);

  return { data, loading };
}
