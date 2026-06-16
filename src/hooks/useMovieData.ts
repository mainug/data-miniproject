import { useState, useEffect } from 'react'
import { fetchMovies } from '../api/movies'
import type { Movie } from '../types/movie'

export function useMovieData() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const CACHE_KEY = 'movie_data_cache'
    const CACHE_TTL = 1000 * 60 * 60 * 24 // 24h

    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < CACHE_TTL) {
          setMovies(data)
          setLoading(false)
          return
        }
      } catch {
        // ignore bad cache
      }
    }

    fetchMovies()
      .then((data) => {
        setMovies(data)
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }))
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return { movies, loading, error }
}
