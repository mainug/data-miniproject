import { useState, useEffect } from 'react'
import { fetchWeeklyBoxOffice } from '../api/boxoffice'
import type { WeeklyEntry } from '../types/movie'

export function useWeeklyBoxOffice(showRange: string, weekGb: '0' | '1') {
  const [entries, setEntries] = useState<WeeklyEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!showRange) return
    setLoading(true)
    setError(null)
    fetchWeeklyBoxOffice(showRange, weekGb)
      .then(setEntries)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [showRange, weekGb])

  return { entries, loading, error }
}
