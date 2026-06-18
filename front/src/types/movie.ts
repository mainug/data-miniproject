export interface Movie {
  id: number
  title: string
  release_date: string // 'YYYY-MM-DD'
  vote_average: number // 0~10
  popularity: number
  genres: string[]
  poster_path: string | null

  // TMDB 상세 필드 (상세 페이지용)
  overview?: string
  vote_count?: number
  backdrop_path?: string | null
  original_title?: string
}

export interface BoxOfficeEntry {
  rank: number
  rankInten: number       // 전일 대비 순위 증감
  rankOldAndNew: string   // "OLD" | "NEW"
  movieNm: string
  openDt: string
  salesAmt: number        // 당일 매출액
  salesShare: number      // 매출 비율 (%)
  salesInten: number      // 전일 대비 매출 증감
  salesChange: number     // 전일 대비 매출 증감비율 (%)
  salesAcc: number        // 누적 매출액
  audiCnt: number         // 당일 관객수
  audiInten: number       // 전일 대비 관객수 증감
  audiChange: number      // 전일 대비 관객수 증감비율 (%)
  audiAcc: number         // 누적 관객수
  scrnCnt: number         // 스크린수
  showCnt: number         // 상영횟수
  date: string
}

export type SortKey = 'vote_average' | 'popularity' | 'release_date'
export type TmdbTabId = 'ranking' | 'genre' | 'trend' | 'analysis' | 'search'
export type KoficTabId = 'ranking' | 'sales' | 'audience'
export type SourceTab = 'tmdb' | 'kofic'
