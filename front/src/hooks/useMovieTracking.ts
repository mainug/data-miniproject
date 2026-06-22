import { useState, useEffect } from "react";
import { fetchMovieTracking, fetchTrackableMovies } from "../api/analysis";
import type { MovieTracking } from "../types/movie";

export function useMovieTracking(movieNm: string) {
  const [data, setData] = useState<MovieTracking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!movieNm) {
        setData([]);
        return;
      }
      setLoading(true);
      try {
        const result = await fetchMovieTracking(movieNm);
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
  }, [movieNm]);

  return { data, loading };
}

export function useTrackableMovies() {
  const [movies, setMovies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrackableMovies()
      .then(setMovies)
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, []);

  return { movies, loading };
}
