import { useState, useEffect } from 'react'

export interface CorrelationPoint {
  title: string
  vote_average: number
  revenue: number
  popularity: number
  budget: number
}

export interface Coefficients {
  rating_vs_revenue: number
  rating_vs_popularity: number
  budget_vs_revenue: number
}

export interface YearTrendItem {
  year: number
  count: number
  avg_rating: number
  avg_revenue: number
  total_revenue: number
  avg_popularity: number
}

export interface GenreItem {
  genre: string
  count: number
  avg_rating: number
  avg_revenue: number
  total_revenue: number
  avg_popularity: number
  avg_budget: number
  top_movie: string
  top_movie_rating: number
}

export interface KobisTrendItem {
  date: string
  total_audience: number
  total_sales: number
  top_movie: string
}

export interface DirectorItem {
  director: string
  count: number
  avg_rating: number
  total_revenue: number
  avg_budget: number
  movies: string[]
}

export interface RoiItem {
  title: string
  budget: number
  revenue: number
  roi: number
  vote_average: number
  genres: string
}

export interface CountryItem {
  country: string
  count: number
  avg_rating: number
  total_revenue: number
}

export interface KobisRankingItem {
  movieNm: string
  audiAcc: number
  salesAmt: number
  openDt: string
  scrnCnt: number
}

export interface AnalysisData {
  correlation: {
    scatter: CorrelationPoint[]
    coefficients: Coefficients
    sample_size: number
  }
  yearTrend: YearTrendItem[]
  genreAnalysis: GenreItem[]
  kobisTrend: KobisTrendItem[]
  directorAnalysis: DirectorItem[]
  roiAnalysis: RoiItem[]
  countryAnalysis: CountryItem[]
  kobisRanking: KobisRankingItem[]
}

export function useAnalysis() {
  const [data, setData] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/analysis.json')
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading }
}
