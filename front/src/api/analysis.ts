import type { DerivedStats, MovieTracking, AllTimeRanking } from '../types/movie'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function fetchDerivedStats(date?: string): Promise<DerivedStats[]> {
  if (!BASE_URL) throw new Error('VITE_API_BASE_URL이 설정되지 않았습니다')
  const params = date ? `?date=${date}` : ''
  const res = await fetch(`${BASE_URL}/api/boxoffice/derived${params}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function fetchMovieTracking(movieNm: string): Promise<MovieTracking[]> {
  if (!BASE_URL) throw new Error('VITE_API_BASE_URL이 설정되지 않았습니다')
  const res = await fetch(`${BASE_URL}/api/boxoffice/tracking?movieNm=${encodeURIComponent(movieNm)}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function fetchTrackableMovies(): Promise<string[]> {
  if (!BASE_URL) throw new Error('VITE_API_BASE_URL이 설정되지 않았습니다')
  const res = await fetch(`${BASE_URL}/api/boxoffice/tracking/movies`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function fetchAllTimeRankings(sortBy: 'audience' | 'sales' = 'audience', limit = 20): Promise<AllTimeRanking[]> {
  if (!BASE_URL) throw new Error('VITE_API_BASE_URL이 설정되지 않았습니다')
  const res = await fetch(`${BASE_URL}/api/boxoffice/alltime?sortBy=${sortBy}&limit=${limit}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
