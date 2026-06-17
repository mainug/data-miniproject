import { useState, useEffect, useMemo } from 'react'
import { fetchBoxOffice } from '../api/boxoffice'
import type { BoxOfficeEntry } from '../types/movie'

export function useBoxOffice(date?: string) {
  const [allEntries, setAllEntries] = useState<BoxOfficeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchBoxOffice(date)
      .then(setAllEntries)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [date])

  const entries = useMemo(() => {
    if (allEntries.length === 0) return []

    const dates = [...new Set(allEntries.map((e) => e.date))].sort()
    const targetDate = date || dates[dates.length - 1]

    return allEntries
      .filter((e) => e.date === targetDate)
      .sort((a, b) => a.rank - b.rank)
  }, [allEntries, date])

  const availableDates = useMemo(() => {
    return [...new Set(allEntries.map((e) => e.date))].sort()
  }, [allEntries])

  return { entries, loading, error, availableDates }
}
