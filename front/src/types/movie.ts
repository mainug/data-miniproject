export interface Movie {
  id: number;
  title: string;
  release_date: string; // 'YYYY-MM-DD'
  vote_average: number; // 0~10
  popularity: number;
  revenue: number;
  genres: string[];
  poster_path: string | null;

  // KOBIS 필드 (한국 개봉작만 존재)
  kobis_movie_cd?: string;
  audi_acc?: number; // 누적 관객수
  sales_acc?: number; // 누적 매출액 (원)
  scrn_cnt?: number; // 최대 스크린수

  // TMDB 상세 필드 (상세 페이지용)
  overview?: string;
  runtime?: number;
  vote_count?: number;
  budget?: number;
  backdrop_path?: string | null;
  original_title?: string;
}

export interface BoxOfficeEntry {
  rank: number;
  movieNm: string;
  openDt: string;
  salesAmt: number; // 당일 매출액
  salesShare: number; // 매출 비율 (%)
  audiCnt: number; // 당일 관객수
  audiAcc: number; // 누적 관객수
  scrnCnt: number; // 스크린수
  showCnt: number; // 상영횟수
  date: string; // 조회 날짜 'YYYY-MM-DD'
}

export type SortKey =
  | "vote_average"
  | "popularity"
  | "revenue"
  | "release_date"
  | "audi_acc";
export type TabId = "ranking" | "genre" | "trend" | "analysis" | "kobis";
