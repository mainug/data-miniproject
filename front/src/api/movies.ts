import type { Movie } from '../types/movie'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function fetchMovies(): Promise<Movie[]> {
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/api/movies`)
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
  }
  // fallback to mock data
  const res = await fetch('/mockMovies.json')
  return res.json()
}
