import type { BoxOfficeEntry } from '../types/movie'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function fetchBoxOffice(date?: string): Promise<BoxOfficeEntry[]> {
  if (!BASE_URL) throw new Error('VITE_API_BASE_URL이 설정되지 않았습니다')
  const params = date ? `?date=${date}` : ''
  const res = await fetch(`${BASE_URL}/api/boxoffice${params}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
