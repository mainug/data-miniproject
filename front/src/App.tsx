import { useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Header } from './components/Header'
import { FilterBar } from './components/FilterBar'
import { RankingList } from './components/RankingList'
import { GenreChart } from './components/charts/GenreChart'
import { YearTrendChart } from './components/charts/YearTrendChart'
import { RatingScatter } from './components/charts/RatingScatter'
import { TopNChart } from './components/charts/TopNChart'
import { DirectorChart } from './components/charts/DirectorChart'
import { RoiChart } from './components/charts/RoiChart'
import { CountryChart } from './components/charts/CountryChart'
import { BoxOfficeTable } from './components/charts/BoxOfficeTable'
import { BoxOfficeTimeline } from './components/charts/BoxOfficeTimeline'
import { KobisTrendChart } from './components/charts/KobisTrendChart'
import { useMovieData } from './hooks/useMovieData'
import { useBoxOffice } from './hooks/useBoxOffice'
import { useAnalysis } from './hooks/useAnalysis'
import type { SortKey, TabId } from './types/movie'

const TABS: { id: TabId; label: string; desc: string }[] = [
  { id: 'tmdb', label: '🎬 TMDB', desc: '글로벌 영화 데이터' },
  { id: 'kobis', label: '🇰🇷 KOBIS', desc: '한국 박스오피스' },
]

export default function App() {
  const { movies, loading, error } = useMovieData()
  const { data: analysis } = useAnalysis()
  const [tab, setTab] = useState<TabId>('tmdb')

  // TMDB 필터 상태
  const [yearRange, setYearRange] = useState<[number, number]>([1950, 2026])
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [sortKey, setSortKey] = useState<SortKey>('vote_average')
  const [topN, setTopN] = useState(20)

  // KOBIS 상태
  const [boxOfficeDate, setBoxOfficeDate] = useState('')
  const { entries: boxOfficeEntries, loading: boLoading, availableDates } = useBoxOffice(boxOfficeDate || undefined)

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

  const boDate = boxOfficeEntries[0]?.date ?? (availableDates.length ? availableDates[availableDates.length - 1] : '(샘플)')

  // TMDB 통계
  const tmdbStats = useMemo(() => {
    if (filtered.length === 0) return null
    const avgRating = (filtered.reduce((s, m) => s + m.vote_average, 0) / filtered.length).toFixed(1)
    const totalRevenue = filtered.reduce((s, m) => s + m.revenue, 0)
    return { count: filtered.length, avgRating, totalRevenue }
  }, [filtered])

  // KOBIS 통계
  const kobisStats = useMemo(() => {
    if (!analysis) return null
    const trend = analysis.kobisTrend
    if (trend.length === 0) return null
    const totalAudi = trend.reduce((s, t) => s + t.total_audience, 0)
    const totalSales = trend.reduce((s, t) => s + t.total_sales, 0)
    const latest = trend[trend.length - 1]
    return {
      days: trend.length,
      totalAudi,
      totalSales,
      latestTop: latest.top_movie,
      movieCount: analysis.kobisRanking.length,
    }
  }, [analysis])

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white">
      <Header />

      {/* 탭 — 상단 고정 */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex gap-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors ${
                tab === t.id
                  ? 'text-green-500'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <span className="text-base">{t.label}</span>
              <span className="hidden sm:inline text-xs font-normal text-gray-400 dark:text-gray-500">
                {t.desc}
              </span>
              {tab === t.id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500 rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400 dark:text-gray-500 text-sm animate-pulse">
            데이터를 불러오는 중...
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center h-64">
          <div className="text-red-400 text-sm">데이터 로딩 실패: {error}</div>
        </div>
      )}

      {!loading && !error && (
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* ━━━━ TMDB 페이지 ━━━━ */}
            {tab === 'tmdb' && (
              <>
                {/* 통계 배너 */}
                {tmdbStats && (
                  <section className="border-b border-gray-200 dark:border-gray-800">
                    <div className="max-w-7xl mx-auto px-6 sm:px-10 py-8">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <StatCard label="총 영화" value={`${tmdbStats.count}편`} sub="수집된 TMDB 데이터" />
                        <StatCard label="평균 평점" value={tmdbStats.avgRating} sub="/ 10점 만점" accent />
                        <StatCard label="글로벌 수익 합계" value={`$${(tmdbStats.totalRevenue / 1e9).toFixed(1)}B`} sub="전체 기간" />
                        <StatCard label="수집 소스" value="4종" sub="popular·top_rated·now·trend" />
                      </div>
                    </div>
                  </section>
                )}

                {/* 필터 */}
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

                {/* 차트 섹션들 */}
                <div className="max-w-7xl mx-auto px-6 sm:px-10 py-10 space-y-16">
                  {/* 랭킹 */}
                  <section>
                    <SectionTitle title="영화 랭킹" sub={`Top ${topN} · 정렬: ${sortKey}`} />
                    <RankingList movies={sorted.slice(0, topN)} />
                  </section>

                  {/* 장르 + 국가 */}
                  {analysis && (
                    <section className="border-t border-gray-200 dark:border-gray-800 pt-12">
                      <SectionTitle title="장르 분석" sub={`${analysis.genreAnalysis.length}개 장르 · ${analysis.countryAnalysis.length}개국`} />
                      <div className="space-y-12 mt-6">
                        <GenreChart genres={analysis.genreAnalysis} />
                        <CountryChart countries={analysis.countryAnalysis} />
                      </div>
                    </section>
                  )}

                  {/* 트렌드 + 감독 */}
                  {analysis && (
                    <section className="border-t border-gray-200 dark:border-gray-800 pt-12">
                      <SectionTitle title="트렌드 분석" sub={`${analysis.yearTrend.length}개 연도 · ${analysis.directorAnalysis.length}명 감독`} />
                      <div className="space-y-12 mt-6">
                        <YearTrendChart trend={analysis.yearTrend} />
                        <DirectorChart directors={analysis.directorAnalysis} />
                      </div>
                    </section>
                  )}

                  {/* 상관관계 + ROI + Top N */}
                  {analysis && (
                    <section className="border-t border-gray-200 dark:border-gray-800 pt-12">
                      <SectionTitle title="흥행 분석" sub={`상관계수 · ROI · Top ${topN}`} />
                      <div className="space-y-12 mt-6">
                        <RatingScatter
                          scatter={analysis.correlation.scatter}
                          coefficients={analysis.correlation.coefficients}
                          sampleSize={analysis.correlation.sample_size}
                        />
                        <RoiChart items={analysis.roiAnalysis} />
                        <TopNChart movies={filtered} topN={topN} sortKey={sortKey} />
                      </div>
                    </section>
                  )}
                </div>
              </>
            )}

            {/* ━━━━ KOBIS 페이지 ━━━━ */}
            {tab === 'kobis' && (
              <>
                {/* 통계 배너 */}
                {kobisStats && (
                  <section className="border-b border-gray-200 dark:border-gray-800">
                    <div className="max-w-7xl mx-auto px-6 sm:px-10 py-8">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <StatCard label="수집 기간" value={`${kobisStats.days}일`} sub="일별 박스오피스" />
                        <StatCard label="총 관객수" value={`${Math.round(kobisStats.totalAudi / 10000).toLocaleString()}만`} sub={`${kobisStats.days}일 누적`} accent />
                        <StatCard label="총 매출" value={`${Math.round(kobisStats.totalSales / 1e8).toLocaleString()}억`} sub={`${kobisStats.days}일 누적`} />
                        <StatCard label="등장 영화" value={`${kobisStats.movieCount}편`} sub={`최신 1위: ${kobisStats.latestTop}`} accent />
                      </div>
                    </div>
                  </section>
                )}

                <div className="max-w-7xl mx-auto px-6 sm:px-10 py-10 space-y-16">
                  {/* 30일 추세 */}
                  {analysis && (
                    <section>
                      <SectionTitle title="30일 박스오피스 추세" sub="일별 총 관객수 · 총 매출액" />
                      <div className="mt-6">
                        <KobisTrendChart trend={analysis.kobisTrend} />
                      </div>
                    </section>
                  )}

                  {/* 일별 박스오피스 조회 */}
                  <section className="border-t border-gray-200 dark:border-gray-800 pt-12">
                    <SectionTitle title="일별 박스오피스 상세" sub={`${boDate} 기준 · 날짜를 선택하면 해당일 순위를 조회합니다`} />
                    <div className="mt-6">
                      <div className="flex items-center gap-3 mb-6">
                        <label className="text-sm text-gray-500 dark:text-gray-400">조회 날짜</label>
                        <select
                          value={boxOfficeDate}
                          onChange={(e) => setBoxOfficeDate(e.target.value)}
                          className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                        >
                          <option value="">최신 날짜</option>
                          {availableDates.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {boxOfficeEntries.length}편 표시
                        </span>
                      </div>

                      {boLoading ? (
                        <div className="text-gray-400 text-sm animate-pulse">박스오피스 데이터 로딩 중...</div>
                      ) : (
                        <>
                          <BoxOfficeTable entries={boxOfficeEntries} date={boDate} />
                          <div className="mt-10">
                            <BoxOfficeTimeline entries={boxOfficeEntries} />
                          </div>
                        </>
                      )}
                    </div>
                  </section>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}

/* ── 공통 서브 컴포넌트 ── */

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-6 py-5 flex flex-col gap-2">
      <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</p>
      <p className={`text-3xl font-bold tracking-tight ${accent ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>{value}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>
    </div>
  )
}

function SectionTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-2">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{sub}</p>
    </div>
  )
}
