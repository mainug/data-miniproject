import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { useMovieData } from '../hooks/useMovieData'

function useCountUp(target: number, delay = 0) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (target === 0) return
    const timeout = setTimeout(() => {
      let current = 0
      const duration = 1200
      const step = target / (duration / 16)
      const timer = setInterval(() => {
        current += step
        if (current >= target) {
          setCount(target)
          clearInterval(timer)
        } else {
          setCount(Math.floor(current))
        }
      }, 16)
      return () => clearInterval(timer)
    }, delay)
    return () => clearTimeout(timeout)
  }, [target, delay])
  return count
}

const FEATURES = [
  { icon: '🏆', title: '영화 랭킹', desc: '평점·인기·수익·관객수 기준 Top N 순위 비교' },
  { icon: '🎭', title: '장르 분석', desc: '장르별 영화 분포와 평균 평점 시각화' },
  { icon: '📈', title: '연도 트렌드', desc: '연도별 개봉작 수와 평점 변화 추이' },
  { icon: '🇰🇷', title: '한국 박스오피스', desc: 'KOBIS 누적 관객 통계 및 일별 순위' },
]

export function LandingPage() {
  const navigate = useNavigate()
  const { movies } = useMovieData()

  const totalMovies = movies.length
  const avgRating = movies.length
    ? parseFloat((movies.reduce((s, m) => s + m.vote_average, 0) / movies.length).toFixed(1))
    : 0
  const genreCount = new Set(movies.flatMap((m) => m.genres)).size

  const countMovies = useCountUp(totalMovies, 400)
  const countGenres = useCountUp(genreCount, 600)

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white">
      <Header />

      {/* ── Hero ── */}
      <section className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-black">
        {/* subtle grid lines */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        {/* green ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
          >
            <span className="inline-block text-green-400 text-xs font-bold tracking-[0.25em] uppercase mb-5">
              Movie Data Dashboard
            </span>
            <h1 className="text-6xl sm:text-8xl font-extrabold text-white tracking-tight leading-none mb-5">
              CineStats
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="text-lg sm:text-xl text-gray-400 mb-12 leading-relaxed"
          >
            영화 데이터를 한눈에 탐색하다
          </motion.p>

          {/* Stat numbers */}
          {movies.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex justify-center gap-10 sm:gap-16 mb-14"
            >
              {[
                { value: `${countMovies}편`, label: '영화 데이터' },
                { value: `★ ${avgRating}`, label: '평균 평점' },
                { value: `${countGenres}개`, label: '장르' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-3xl sm:text-4xl font-bold text-white tabular-nums">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1.5 uppercase tracking-widest">{s.label}</p>
                </div>
              ))}
            </motion.div>
          )}

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2.5 px-9 py-4 rounded-2xl bg-green-500 hover:bg-green-400 text-white font-bold text-base transition-colors shadow-lg shadow-green-500/25"
          >
            대시보드 탐색하기
            <span className="text-xl leading-none">→</span>
          </motion.button>
        </div>

        {/* scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-600 select-none"
        >
          <span className="text-[10px] tracking-[0.2em] uppercase">Scroll</span>
          <motion.span
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="text-sm"
          >
            ↓
          </motion.span>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl sm:text-3xl font-bold text-center mb-14"
          >
            무엇을 탐색할 수 있나요?
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.09 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-6 cursor-default hover:border-green-400 dark:hover:border-green-600 transition-colors"
              >
                <span className="text-4xl mb-5 block">{f.icon}</span>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1.5">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* second CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center mt-14"
          >
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-green-500 hover:text-green-400 font-semibold transition-colors"
            >
              지금 바로 탐색하기 →
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span>Data by</span>
            <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-xs">
              TMDB
            </span>
            <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-xs">
              KOBIS
            </span>
          </div>
          <a
            href="https://github.com/mainug/data-miniproject"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            GitHub ↗
          </a>
        </div>
      </footer>
    </div>
  )
}
