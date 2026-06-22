import { useState, useEffect } from "react";
import { fetchMovies } from "../api/movies";
import type { Movie } from "../types/movie";

export function useMovieData() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const CACHE_KEY = "movie_data_cache";
    const CACHE_TTL = 1000 * 60 * 60 * 24; // 24h
    let cancelled = false;

    const load = async () => {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) {
            if (!cancelled) {
              setMovies(data);
              setLoading(false);
            }
            return;
          }
        } catch {
          // ignore bad cache
        }
      }

      try {
        const data = await fetchMovies();
        if (!cancelled) setMovies(data);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ data, timestamp: Date.now() }),
        );
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
  }, []);

  return { movies, loading, error };
}
