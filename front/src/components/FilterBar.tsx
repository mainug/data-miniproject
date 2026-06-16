import type { Movie, SortKey } from '../types/movie'

interface Props {
  movies: Movie[]
  yearRange: [number, number]
  selectedGenres: string[]
  sortKey: SortKey
  topN: number
  onYearRange: (r: [number, number]) => void
  onGenres: (g: string[]) => void
  onSort: (k: SortKey) => void
  onTopN: (n: number) => void
}

export function FilterBar({
  movies,
  yearRange,
  selectedGenres,
  sortKey,
  topN,
  onYearRange,
  onGenres,
  onSort,
  onTopN,
}: Props) {
  const allGenres = Array.from(new Set(movies.flatMap((m) => m.genres))).sort()
  const allYears = movies.map((m) => parseInt(m.release_date.slice(0, 4))).filter(Boolean)
  const minYear = allYears.length ? Math.min(...allYears) : 1990
  const maxYear = allYears.length ? Math.max(...allYears) : 2024

  const toggleGenre = (g: string) => {
    if (selectedGenres.includes(g)) {
      onGenres(selectedGenres.filter((x) => x !== g))
    } else {
      onGenres([...selectedGenres, g])
    }
  }

  return (
    <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black py-4 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-wrap gap-4 items-start">
        {/* Year range */}
        <div className="flex flex-col gap-1 min-w-[180px]">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">연도 범위</span>
          <div className="flex items-center gap-2 text-sm">
            <input
              type="number"
              min={minYear}
              max={yearRange[1]}
              value={yearRange[0]}
              onChange={(e) => onYearRange([parseInt(e.target.value) || minYear, yearRange[1]])}
              className="w-20 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-center"
            />
            <span className="text-gray-400">~</span>
            <input
              type="number"
              min={yearRange[0]}
              max={maxYear}
              value={yearRange[1]}
              onChange={(e) => onYearRange([yearRange[0], parseInt(e.target.value) || maxYear])}
              className="w-20 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-center"
            />
          </div>
        </div>

        {/* Sort */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">정렬 기준</span>
          <select
            value={sortKey}
            onChange={(e) => onSort(e.target.value as SortKey)}
            className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
          >
            <option value="vote_average">평점</option>
            <option value="popularity">인기도</option>
            <option value="revenue">흥행 수익</option>
            <option value="release_date">최신순</option>
          </select>
        </div>

        {/* Top N */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Top N</span>
          <input
            type="number"
            min={5}
            max={100}
            value={topN}
            onChange={(e) => onTopN(Math.max(5, Math.min(100, parseInt(e.target.value) || 20)))}
            className="w-20 px-2 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-center text-sm"
          />
        </div>

        {/* Genres */}
        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            장르 필터 {selectedGenres.length > 0 && `(${selectedGenres.length}개 선택)`}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {allGenres.map((g) => (
              <button
                key={g}
                onClick={() => toggleGenre(g)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedGenres.includes(g)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
