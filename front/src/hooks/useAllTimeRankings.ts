import { useState, useEffect } from 'react'
import { fetchAllTimeRankings } from '../api/analysis'
import type { AllTimeRanking } from '../types/movie'

export function useAllTimeRankings(sortBy: 'audience' | 'sales', limit = 20) {
  const [data, setData] = useState<AllTimeRanking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchAllTimeRankings(sortBy, limit)
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [sortBy, limit])

  return { data, loading }
}
