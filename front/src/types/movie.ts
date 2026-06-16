export interface Movie {
  id: number
  title: string
  release_date: string // 'YYYY-MM-DD'
  vote_average: number // 0~10
  popularity: number
  revenue: number
  genres: string[]
  poster_path: string | null
}

export type SortKey = 'vote_average' | 'popularity' | 'revenue' | 'release_date'
export type TabId = 'ranking' | 'genre' | 'trend' | 'analysis'
