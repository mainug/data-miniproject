import { useState, useEffect } from 'react'
import { fetchMovieTracking, fetchTrackableMovies } from '../api/analysis'
import type { MovieTracking } from '../types/movie'

export function useMovieTracking(movieNm: string) {
  const [data, setData] = useState<MovieTracking[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!movieNm) { setData([]); return }
    setLoading(true)
    fetchMovieTracking(movieNm)
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [movieNm])

  return { data, loading }
}

export function useTrackableMovies() {
  const [movies, setMovies] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrackableMovies()
      .then(setMovies)
      .catch(() => setMovies([]))
      .finally(() => setLoading(false))
  }, [])

  return { movies, loading }
}
