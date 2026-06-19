import { useState, useEffect } from 'react'
import { fetchDerivedStats } from '../api/analysis'
import type { DerivedStats } from '../types/movie'

export function useDerivedStats(date: string) {
  const [data, setData] = useState<DerivedStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchDerivedStats(date)
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [date])

  return { data, loading }
}
