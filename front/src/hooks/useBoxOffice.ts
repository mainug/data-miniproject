import { useState, useEffect } from "react";
import { fetchBoxOffice } from "../api/boxoffice";
import type { BoxOfficeEntry } from "../types/movie";

export function useBoxOffice(date?: string) {
  const [entries, setEntries] = useState<BoxOfficeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchBoxOffice(date)
      .then(setEntries)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [date]);

  return { entries, loading, error };
}
