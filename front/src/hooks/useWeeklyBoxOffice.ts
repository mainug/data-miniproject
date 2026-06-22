import { useState, useEffect } from "react";
import { fetchWeeklyBoxOffice } from "../api/boxoffice";
import type { WeeklyEntry } from "../types/movie";

export function useWeeklyBoxOffice(showRange: string, weekGb: "0" | "1") {
  const [entries, setEntries] = useState<WeeklyEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!showRange) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchWeeklyBoxOffice(showRange, weekGb);
        if (!cancelled) setEntries(data);
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
  }, [showRange, weekGb]);

  return { entries, loading, error };
}
