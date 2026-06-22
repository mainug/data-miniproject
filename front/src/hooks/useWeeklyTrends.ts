import { useState, useEffect } from "react";
import { fetchWeeklyTrends } from "../api/trends";
import type { TrendAnalysis } from "../types/movie";

export function useWeeklyTrends() {
  const [data, setData] = useState<TrendAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeeklyTrends()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
