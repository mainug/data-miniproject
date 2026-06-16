import { useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Header } from './components/Header'
import { StatBanner } from './components/StatBanner'
import { FilterBar } from './components/FilterBar'
import { RankingList } from './components/RankingList'
import { GenreChart } from './components/charts/GenreChart'
import { YearTrendChart } from './components/charts/YearTrendChart'
import { RatingScatter } from './components/charts/RatingScatter'
import { TopNChart } from './components/charts/TopNChart'
import { AudienceBarChart } from './components/charts/AudienceBarChart'
import { BoxOfficeTable } from './components/charts/BoxOfficeTable'
import { BoxOfficeTimeline } from './components/charts/BoxOfficeTimeline'
import { useMovieData } from './hooks/useMovieData'
import { useBoxOffice } from './hooks/useBoxOffice'
import type { SortKey, TabId } from './types/movie'

const TABS: { id: TabId; label: string }[] = [
  { id: 'ranking', label: '🏆 랭킹' },
  { id: 'genre', label: '🎭 장르' },
  { id: 'trend', label: '📈 트렌드' },
  { id: 'analysis', label: '🔬 분석' },
  { id: 'kobis', label: '🇰🇷 한국' },
]

export default function App() {
  const { movies, loading, error } = useMovieData()
  const [tab, setTab] = useState<TabId>('ranking')
  const [yearRange, setYearRange] = useState<[number, number]>([1957, 2023])
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [sortKey, setSortKey] = useState<SortKey>('vote_average')
  const [topN, setTopN] = useState(20)
  const [boxOfficeDate, setBoxOfficeDate] = useState('')

  const { entries: boxOfficeEntries, loading: boLoading } = useBoxOffice(boxOfficeDate || undefined)

  const filtered = useMemo(() => {
    let ms = movies.filter((m) => {
      const y = parseInt(m.release_date.slice(0, 4))
      return y >= yearRange[0] && y <= yearRange[1]
    })
    if (selectedGenres.length > 0) {
      ms = ms.filter((m) => m.genres.some((g) => selectedGenres.includes(g)))
    }
    return ms
  }, [movies, yearRange, selectedGenres])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortKey === 'release_date') return b.release_date.localeCompare(a.release_date)
      if (sortKey === 'audi_acc') return (b.audi_acc ?? 0) - (a.audi_acc ?? 0)
      return (b[sortKey] as number) - (a[sortKey] as number)
    })
  }, [filtered, sortKey])

  const boDate = boxOfficeEntries[0]?.date ?? '(샘플)'

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white">
      <Header />

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400 dark:text-gray-500 text-sm animate-pulse">
            영화 데이터를 불러오는 중...
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center h-64">
          <div className="text-red-400 text-sm">데이터 로딩 실패: {error}</div>
        </div>
      )}

      {!loading && !error && (
        <>
          <StatBanner movies={filtered} />

          <FilterBar
            movies={movies}
            yearRange={yearRange}
            selectedGenres={selectedGenres}
            sortKey={sortKey}
            topN={topN}
            onYearRange={setYearRange}
            onGenres={setSelectedGenres}
            onSort={setSortKey}
            onTopN={setTopN}
          />

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
                    tab === t.id
                      ? 'text-green-500'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {t.label}
                  {tab === t.id && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {tab === 'ranking' && <RankingList movies={sorted.slice(0, topN)} />}
                {tab === 'genre' && <GenreChart movies={filtered} />}
                {tab === 'trend' && <YearTrendChart movies={filtered} />}
                {tab === 'analysis' && (
                  <div className="space-y-12">
                    <RatingScatter movies={filtered} />
                    <div className="border-t border-gray-200 dark:border-gray-800 pt-10">
                      <TopNChart movies={filtered} topN={topN} sortKey={sortKey} />
                    </div>
                  </div>
                )}
                {tab === 'kobis' && (
                  <div className="space-y-12">
                    {/* 날짜 선택 */}
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-500 dark:text-gray-400">조회 날짜</label>
                      <input
                        type="date"
                        value={boxOfficeDate}
                        onChange={(e) => setBoxOfficeDate(e.target.value)}
                        className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                      />
                      {boxOfficeDate && (
                        <button
                          onClick={() => setBoxOfficeDate('')}
                          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          초기화
                        </button>
                      )}
                    </div>

                    {boLoading ? (
                      <div className="text-gray-400 text-sm animate-pulse">박스오피스 데이터 로딩 중...</div>
                    ) : (
                      <>
                        <BoxOfficeTable entries={boxOfficeEntries} date={boDate} />
                        <div className="border-t border-gray-200 dark:border-gray-800 pt-10">
                          <BoxOfficeTimeline entries={boxOfficeEntries} />
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-800 pt-10">
                          <AudienceBarChart movies={filtered} topN={topN} />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  )
}
