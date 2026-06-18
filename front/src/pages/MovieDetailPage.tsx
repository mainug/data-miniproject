import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Header } from '../components/Header'
import { MovieCard } from '../components/MovieCard'
import { RadarStatChart } from '../components/charts/RadarStatChart'
import { GenreRankBar } from '../components/charts/GenreRankBar'
import { YearPeerScatter } from '../components/charts/YearPeerScatter'
import { useMovieData } from '../hooks/useMovieData'

const TMDB_IMG_W500 = 'https://image.tmdb.org/t/p/w500'
const TMDB_IMG_ORIG = 'https://image.tmdb.org/t/p/original'

function fmtKobis(n: number) {
  if (n >= 1e4) return `${(n / 1e4).toFixed(0)}만명`
  return `${n.toLocaleString()}명`
}

function fmtSales(n: number) {
  if (n >= 1e8) return `${(n / 1e8).toFixed(0)}억원`
  return `${n.toLocaleString()}원`
}

export function MovieDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { movies, loading } = useMovieData()

  const movie = movies.find((m) => m.id === Number(id))
  const ratingPct = movie ? Math.round((movie.vote_average / 10) * 100) : 0

  const posterUrl = movie?.poster_path
    ? movie.poster_path.startsWith('http')
      ? movie.poster_path
      : `${TMDB_IMG_W500}${movie.poster_path}`
    : null

  const backdropUrl = movie?.backdrop_path
    ? movie.backdrop_path.startsWith('http')
      ? movie.backdrop_path
      : `${TMDB_IMG_ORIG}${movie.backdrop_path}`
    : null

  const related = movie
    ? movies
        .filter((m) => m.id !== movie.id && m.genres.some((g) => movie.genres.includes(g)))
        .sort((a, b) => b.vote_average - a.vote_average)
        .slice(0, 6)
    : []

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f0f0f]">
        <Header />
        <div className="flex items-center justify-center h-64 text-gray-400 animate-pulse text-sm">
          불러오는 중...
        </div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f0f0f]">
        <Header />
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <p className="text-gray-400 text-sm">영화를 찾을 수 없습니다.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-green-500 hover:text-green-400 text-sm font-semibold"
          >
            ← 대시보드로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white"
    >
      <Header />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gray-950">
        {/* backdrop blur */}
        {backdropUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${backdropUrl})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 py-14 flex flex-col sm:flex-row gap-10">
          {/* Poster */}
          <div className="flex-shrink-0 w-44 sm:w-52">
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={movie.title}
                className="w-full rounded-xl shadow-2xl shadow-black/60 ring-1 ring-white/10"
              />
            ) : (
              <div className="w-full aspect-[2/3] rounded-xl bg-gray-800 flex items-center justify-center text-4xl">
                🎬
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col justify-end gap-4">
            {movie.original_title && movie.original_title !== movie.title && (
              <p className="text-xs text-gray-500 uppercase tracking-widest">
                {movie.original_title}
              </p>
            )}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              {movie.title}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-400">
              <span>{movie.release_date.slice(0, 4)}</span>
            </div>

            {/* Genre badges */}
            <div className="flex flex-wrap gap-2">
              {movie.genres.map((g) => (
                <span
                  key={g}
                  className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-gray-300 border border-white/10"
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-4">
              <div>
                <span className="text-4xl font-extrabold text-white">{ratingPct}%</span>
                <span className="text-gray-500 text-sm ml-1.5">관람객 지수</span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <span className="text-2xl font-bold text-green-400">★ {movie.vote_average.toFixed(1)}</span>
                <span className="text-gray-500 text-sm ml-1">/ 10</span>
                {movie.vote_count && (
                  <span className="text-xs text-gray-600 ml-1.5">({movie.vote_count.toLocaleString()}표)</span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="text-gray-500 mr-1">👥 인기도</span>
                <span className="text-gray-200 font-semibold">{movie.popularity.toFixed(1)}</span>
              </div>
            </div>

            {/* KOBIS */}
            {movie.audi_acc != null && (
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm border-t border-white/10 pt-3">
                <div>
                  <span className="text-gray-500 mr-1">🇰🇷 누적 관객</span>
                  <span className="text-green-400 font-bold">{fmtKobis(movie.audi_acc)}</span>
                </div>
                {movie.sales_acc != null && (
                  <div>
                    <span className="text-gray-500 mr-1">매출</span>
                    <span className="text-gray-200 font-semibold">{fmtSales(movie.sales_acc)}</span>
                  </div>
                )}
                {movie.scrn_cnt != null && (
                  <div>
                    <span className="text-gray-500 mr-1">최대 스크린</span>
                    <span className="text-gray-200 font-semibold">{movie.scrn_cnt.toLocaleString()}개</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Overview ── */}
      {movie.overview && (
        <section className="border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-5xl mx-auto px-6 sm:px-10 py-10">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              줄거리
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base max-w-3xl">
              {movie.overview}
            </p>
          </div>
        </section>
      )}

      {/* ── Data Charts ── */}
      <section className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 py-12">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-10">
            데이터 분석
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <RadarStatChart movie={movie} allMovies={movies} />
            <GenreRankBar movie={movie} allMovies={movies} />
          </div>
          <div className="mt-12 border-t border-gray-200 dark:border-gray-800 pt-12">
            <YearPeerScatter movie={movie} allMovies={movies} />
          </div>
        </div>
      </section>

      {/* ── Related ── */}
      {related.length > 0 && (
        <section className="py-12">
          <div className="max-w-5xl mx-auto px-6 sm:px-10">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
              같은 장르 추천
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {related.map((m, i) => (
                <MovieCard key={m.id} movie={m} rank={i + 1} />
              ))}
            </div>
          </div>
        </section>
      )}
    </motion.div>
  )
}
