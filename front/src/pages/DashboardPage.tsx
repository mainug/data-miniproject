import { useState, useMemo, useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Header } from '../components/Header'
import { FilterBar } from '../components/FilterBar'
import { RankingList } from '../components/RankingList'
import { GenreChart } from '../components/charts/GenreChart'
import { YearTrendChart } from '../components/charts/YearTrendChart'
import { RatingScatter } from '../components/charts/RatingScatter'
import { TopNChart } from '../components/charts/TopNChart'
import { useNavigate } from 'react-router-dom'
import { SearchTab } from '../components/tmdb/SearchTab'
import { KoficDateNav, getYesterday } from '../components/kofic/KoficDateNav'
import { KoficRankingTab } from '../components/kofic/KoficRankingTab'
import { KoficSalesTab } from '../components/kofic/KoficSalesTab'
import { KoficAudienceTab } from '../components/kofic/KoficAudienceTab'
import { KoficTrendTab } from '../components/kofic/KoficTrendTab'
import { KoficWeeklyNav, buildShowRange, getLastMonday } from '../components/kofic/KoficWeeklyNav'
import { KoficWeeklyRankingTab } from '../components/kofic/KoficWeeklyRankingTab'
import { KoficWeeklySalesTab } from '../components/kofic/KoficWeeklySalesTab'
import { KoficWeeklyAudienceTab } from '../components/kofic/KoficWeeklyAudienceTab'
import { KoficStatsTab } from '../components/kofic/KoficStatsTab'
import { KoficTrackingTab } from '../components/kofic/KoficTrackingTab'
import { KoficAllTimeTab } from '../components/kofic/KoficAllTimeTab'
import { useMovieData } from '../hooks/useMovieData'
import { useBoxOffice } from '../hooks/useBoxOffice'
import { useWeeklyBoxOffice } from '../hooks/useWeeklyBoxOffice'
import { useWeeklyTrends } from '../hooks/useWeeklyTrends'
import { useDerivedStats } from '../hooks/useDerivedStats'
import type { SortKey, TmdbTabId, KoficTabId, KoficPeriod, SourceTab } from '../types/movie'

const TMDB_TABS: { id: TmdbTabId; label: string }[] = [
  { id: 'ranking', label: '🏆 랭킹' },
  { id: 'genre', label: '🎭 장르' },
  { id: 'trend', label: '📈 트렌드' },
  { id: 'analysis', label: '🔬 분석' },
  { id: 'search', label: '🔍 검색' },
]

const KOFIC_TABS: { id: KoficTabId; label: string }[] = [
  { id: 'ranking', label: '📋 순위' },
  { id: 'sales', label: '💰 매출' },
  { id: 'audience', label: '👥 관객' },
  { id: 'trend', label: '📊 트렌드' },
  { id: 'stats', label: '📐 파생통계' },
  { id: 'tracking', label: '🔍 추적' },
  { id: 'alltime', label: '🏆 역대순위' },
]

export function DashboardPage() {
  const navigate = useNavigate()
  const [source, setSource] = useState<SourceTab>('tmdb')

  // TMDB
  const { movies, loading: tmdbLoading, error: tmdbError } = useMovieData()
  const [tmdbTab, setTmdbTab] = useState<TmdbTabId>('ranking')
  const currentYear = new Date().getFullYear()
  const [yearRange, setYearRange] = useState<[number, number]>([currentYear, currentYear])
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [sortKey, setSortKey] = useState<SortKey>('vote_average')
  const [topN, setTopN] = useState(20)

  // topN 또는 장르가 바뀌면 yearRange[0]을 확장해서 topN개를 채움
  useEffect(() => {
    if (movies.length === 0) return
    const allYears = movies.map((m) => parseInt(m.release_date.slice(0, 4))).filter(Boolean)
    const minDataYear = Math.min(...allYears)
    let startYear = yearRange[1]
    while (startYear > minDataYear) {
      const count = movies.filter((m) => {
        const y = parseInt(m.release_date.slice(0, 4))
        const inRange = y >= startYear && y <= yearRange[1]
        const inGenre = selectedGenres.length === 0 || m.genres.some((g) => selectedGenres.includes(g))
        return inRange && inGenre
      }).length
      if (count >= topN) break
      startYear--
    }
    setYearRange([startYear, yearRange[1]])
  }, [topN, movies, selectedGenres]) // yearRange는 deps 제외 (무한루프 방지)

  // KOFIC
  const [koficPeriod, setKoficPeriod] = useState<KoficPeriod>('daily')
  const [koficTab, setKoficTab] = useState<KoficTabId>('ranking')
  const [koficDate, setKoficDate] = useState(getYesterday())
  const { entries, loading: koficLoading } = useBoxOffice(koficDate)
  const { data: derivedData, loading: derivedLoading } = useDerivedStats(koficDate)
  const { data: trendData, loading: trendLoading } = useWeeklyTrends()
  const [weeklyShowRange, setWeeklyShowRange] = useState(() => buildShowRange(getLastMonday()))
  const weeklyGb = koficPeriod === 'weekend' ? '1' : '0'
  const { entries: weeklyEntries, loading: weeklyLoading, error: weeklyError } = useWeeklyBoxOffice(weeklyShowRange, weeklyGb)
  const isWeekly = koficPeriod !== 'daily'
  const periodLabel = koficPeriod === 'weekly' ? '주간' : '주말'

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
      return (b[sortKey] as number) - (a[sortKey] as number)
    })
  }, [filtered, sortKey])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white"
    >
      <Header />

      {/* ── 상단 소스 탭 (TMDB / KOFIC) ── */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="flex items-center justify-between py-3">
            <div className="flex gap-1">
            {(['tmdb', 'kofic'] as SourceTab[]).map((s) => (
              <button
                key={s}
                onClick={() => setSource(s)}
                className={`px-6 py-2 rounded-full text-sm font-bold tracking-wide transition-all ${
                  source === s
                    ? 'bg-green-500 text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-200 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {s === 'tmdb' ? 'TMDB' : 'KOFIC'}
              </button>
            ))}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => navigate('/wordle')}
                className="px-6 py-2 rounded-full text-sm font-bold tracking-wide transition-all text-gray-500 dark:text-gray-200 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                🎬 무비들
              </button>
              <button
                onClick={() => navigate('/battle')}
                className="px-6 py-2 rounded-full text-sm font-bold tracking-wide transition-all text-gray-500 dark:text-gray-200 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ⚔️ 배틀
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ══════════════ TMDB 섹션 ══════════════ */}
        {source === 'tmdb' && (
          <motion.div
            key="tmdb"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {tmdbLoading && (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-400 text-sm animate-pulse">영화 데이터를 불러오는 중...</p>
              </div>
            )}
            {tmdbError && (
              <div className="flex items-center justify-center h-64">
                <p className="text-red-400 text-sm">데이터 로딩 실패: {tmdbError}</p>
              </div>
            )}
            {!tmdbLoading && !tmdbError && (
              <>
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

                {/* TMDB 하위 탭 */}
                <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
                  <div className="max-w-7xl mx-auto px-6 sm:px-10 flex gap-0 overflow-x-auto">
                    {TMDB_TABS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTmdbTab(t.id)}
                        className={`relative whitespace-nowrap px-5 py-4 text-sm font-semibold transition-colors ${
                          tmdbTab === t.id
                            ? 'text-green-500'
                            : 'text-gray-400 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                      >
                        {t.label}
                        {tmdbTab === t.id && (
                          <motion.div
                            layoutId="tmdb-tab-indicator"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500 rounded-full"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 sm:px-10 py-10">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={tmdbTab}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      {tmdbTab === 'ranking' && <RankingList movies={sorted.slice(0, topN)} />}
                      {tmdbTab === 'genre' && <GenreChart movies={filtered} />}
                      {tmdbTab === 'trend' && <YearTrendChart movies={filtered} />}
                      {tmdbTab === 'analysis' && (
                        <div className="space-y-12">
                          <RatingScatter movies={filtered} />
                          <div className="border-t border-gray-200 dark:border-gray-800 pt-10">
                            <TopNChart movies={filtered} topN={topN} sortKey={sortKey} />
                          </div>
                        </div>
                      )}
                      {tmdbTab === 'search' && <SearchTab />}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ══════════════ KOFIC 섹션 ══════════════ */}
        {source === 'kofic' && (
          <motion.div
            key="kofic"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {/* 기간 선택기 (일별 / 주간 / 주말) */}
            <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
              <div className="max-w-7xl mx-auto px-6 sm:px-10 py-3 flex gap-1">
                {(['daily', 'weekly', 'weekend'] as KoficPeriod[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setKoficPeriod(p)}
                    className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                      koficPeriod === p
                        ? 'bg-green-500 text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {p === 'daily' ? '일별' : p === 'weekly' ? '주간' : '주말'}
                  </button>
                ))}
              </div>
            </div>

            {/* 날짜 / 기간 선택 */}
            {!isWeekly
              ? <KoficDateNav date={koficDate} onChange={setKoficDate} />
              : <KoficWeeklyNav showRange={weeklyShowRange} onChange={setWeeklyShowRange} />
            }

            {/* KOFIC 하위 탭 */}
            <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
              <div className="max-w-7xl mx-auto px-6 sm:px-10 flex gap-0 overflow-x-auto">
                {KOFIC_TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setKoficTab(t.id)}
                    className={`relative whitespace-nowrap px-5 py-4 text-sm font-semibold transition-colors ${
                      koficTab === t.id
                        ? 'text-green-500'
                        : 'text-gray-400 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    {t.label}
                    {koficTab === t.id && (
                      <motion.div
                        layoutId="kofic-tab-indicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500 rounded-full"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 sm:px-10 py-10">
              {(isWeekly ? weeklyLoading : koficLoading) ? (
                <div className="flex items-center justify-center h-48">
                  <p className="text-gray-400 text-sm animate-pulse">박스오피스 데이터 로딩 중...</p>
                </div>
              ) : (isWeekly && weeklyError) ? (
                <div className="flex items-center justify-center h-48">
                  <div className="text-center">
                    <p className="text-red-500 dark:text-red-400 text-sm font-medium mb-1">데이터를 불러올 수 없습니다</p>
                    <p className="text-gray-400 text-xs">{weeklyError}</p>
                  </div>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${koficPeriod}-${koficTab}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {!isWeekly && koficTab === 'ranking' && <KoficRankingTab entries={entries} />}
                    {!isWeekly && koficTab === 'sales' && <KoficSalesTab entries={entries} />}
                    {!isWeekly && koficTab === 'audience' && <KoficAudienceTab entries={entries} />}
                    {isWeekly && koficTab === 'ranking' && <KoficWeeklyRankingTab entries={weeklyEntries} periodLabel={periodLabel} />}
                    {isWeekly && koficTab === 'sales' && <KoficWeeklySalesTab entries={weeklyEntries} periodLabel={periodLabel} />}
                    {isWeekly && koficTab === 'audience' && <KoficWeeklyAudienceTab entries={weeklyEntries} periodLabel={periodLabel} />}
                    {koficTab === 'trend' && (
                      trendLoading
                        ? <div className="flex items-center justify-center h-48"><p className="text-gray-400 text-sm animate-pulse">트렌드 데이터 로딩 중...</p></div>
                        : trendData
                          ? <KoficTrendTab data={trendData} />
                          : <div className="text-center py-20 text-gray-400 text-sm">트렌드 데이터가 없습니다</div>
                    )}
                    {koficTab === 'stats' && (
                      derivedLoading
                        ? <div className="flex items-center justify-center h-48"><p className="text-gray-400 text-sm animate-pulse">파생통계 로딩 중...</p></div>
                        : <KoficStatsTab data={derivedData} />
                    )}
                    {koficTab === 'tracking' && <KoficTrackingTab />}
                    {koficTab === 'alltime' && <KoficAllTimeTab />}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
