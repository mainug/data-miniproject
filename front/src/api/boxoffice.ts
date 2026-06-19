import type { BoxOfficeEntry, WeeklyEntry } from '../types/movie'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function fetchBoxOffice(date?: string): Promise<BoxOfficeEntry[]> {
  if (BASE_URL) {
    const params = date ? `?date=${date}` : ''
    const res = await fetch(`${BASE_URL}/api/boxoffice${params}`)
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
  }
  const res = await fetch('/mockBoxOffice.json')
  return res.json()
}

export async function fetchWeeklyRanges(weekGb: '0' | '1'): Promise<string[]> {
  if (!BASE_URL) throw new Error('VITE_API_BASE_URL이 설정되지 않았습니다')
  const res = await fetch(`${BASE_URL}/api/boxoffice/weekly/ranges?weekGb=${weekGb}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function fetchWeeklyBoxOffice(range: string, weekGb: '0' | '1'): Promise<WeeklyEntry[]> {
  if (!BASE_URL) throw new Error('VITE_API_BASE_URL이 설정되지 않았습니다')
  const res = await fetch(`${BASE_URL}/api/boxoffice/weekly?range=${encodeURIComponent(range)}&weekGb=${weekGb}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `API error: ${res.status}`)
  }
  return res.json()
}
