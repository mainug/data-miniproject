import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Header } from '../components/Header'
import { useMovieData } from '../hooks/useMovieData'
import type { Movie } from '../types/movie'

const MAX_GUESSES = 6

function getDailyMovie(movies: Movie[]): Movie {
  const today = new Date().toISOString().slice(0, 10)
  const seed = today.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const sorted = [...movies].sort((a, b) => a.id - b.id)
  return sorted[seed % sorted.length]
}

type HintLevel = 'correct' | 'partial' | 'wrong'

interface GuessHint {
  movie: Movie
  genreHint: HintLevel
  sharedGenres: string[]
  yearHint: HintLevel
  yearDir: 'up' | 'down' | null
  guessYear: number
  ratingHint: HintLevel
  ratingDir: 'up' | 'down' | null
  popularityHint: HintLevel
  popularityDir: 'up' | 'down' | null
}

function getHints(guess: Movie, secret: Movie): GuessHint {
  const sharedGenres = guess.genres.filter((g) => secret.genres.includes(g))
  const genreHint: HintLevel =
    sharedGenres.length === secret.genres.length && guess.genres.length === secret.genres.length
      ? 'correct'
      : sharedGenres.length > 0
      ? 'partial'
      : 'wrong'

  const guessYear = parseInt(guess.release_date.slice(0, 4))
  const secretYear = parseInt(secret.release_date.slice(0, 4))
  const yearDiff = Math.abs(guessYear - secretYear)
  const yearHint: HintLevel = yearDiff === 0 ? 'correct' : yearDiff <= 3 ? 'partial' : 'wrong'
  const yearDir = guessYear < secretYear ? 'up' : guessYear > secretYear ? 'down' : null

  const ratingDiff = Math.abs(guess.vote_average - secret.vote_average)
  const ratingHint: HintLevel = ratingDiff <= 0.3 ? 'correct' : ratingDiff <= 1.0 ? 'partial' : 'wrong'
  const ratingDir = guess.vote_average < secret.vote_average ? 'up' : guess.vote_average > secret.vote_average ? 'down' : null

  const bucket = (p: number) => (p > 100 ? 2 : p > 30 ? 1 : 0)
  const popularityHint: HintLevel = bucket(guess.popularity) === bucket(secret.popularity) ? 'correct' : 'wrong'
  const popularityDir = guess.popularity < secret.popularity ? 'up' : guess.popularity > secret.popularity ? 'down' : null

  return { movie: guess, genreHint, sharedGenres, yearHint, yearDir, guessYear, ratingHint, ratingDir, popularityHint, popularityDir }
}

const hintBg: Record<HintLevel, string> = {
  correct: 'bg-green-500 text-white',
  partial: 'bg-yellow-400 text-gray-900',
  wrong: 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300',
}

const popularityLabel = (p: number) => (p > 100 ? '높음' : p > 30 ? '중간' : '낮음')

export function WordlePage() {
  const { movies, loading } = useMovieData()
  const secret = useMemo(() => (movies.length > 0 ? getDailyMovie(movies) : null), [movies.length > 0])

  const [guesses, setGuesses] = useState<GuessHint[]>([])
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Movie[]>([])
  const [won, setWon] = useState(false)
  const [lost, setLost] = useState(false)
  // 가장 최근에 추가된 행 인덱스 (stagger 애니메이션용)
  const [latestIdx, setLatestIdx] = useState(-1)
  // 정답 행 인덱스 (win wave용)
  const [wonRowIdx, setWonRowIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  const gameOver = won || lost
  const guessedIds = new Set(guesses.map((g) => g.movie.id))

  useEffect(() => {
    if (!query.trim() || !movies.length) { setSuggestions([]); return }
    const q = query.toLowerCase()
    setSuggestions(
      movies.filter((m) => !guessedIds.has(m.id) && m.title.toLowerCase().includes(q)).slice(0, 8)
    )
  }, [query, movies, guesses.length])

  const handleGuess = (movie: Movie) => {
    if (!secret || guessedIds.has(movie.id) || gameOver) return
    const hint = getHints(movie, secret)
    const next = [...guesses, hint]
    const newIdx = next.length - 1
    setGuesses(next)
    setLatestIdx(newIdx)
    setQuery('')
    setSuggestions([])
    if (movie.id === secret.id) {
      setWon(true)
      setWonRowIdx(newIdx)
    } else if (next.length >= MAX_GUESSES) {
      setLost(true)
    }
    inputRef.current?.focus()
  }

  if (loading || !secret) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f0f0f] flex items-center justify-center text-gray-400 animate-pulse">
        로딩 중...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 타이틀 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight mb-1">🎬 무비들</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            오늘의 영화를 {MAX_GUESSES}번 안에 맞춰보세요
          </p>
        </div>

        {/* 힌트 컬럼 헤더 */}
        <div className="grid grid-cols-[1fr_80px_64px_64px_72px] gap-2 mb-2 px-1">
          {['영화', '장르', '연도', '평점', '인기도'].map((h) => (
            <p key={h} className="text-[11px] font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-widest text-center">
              {h}
            </p>
          ))}
        </div>

        {/* 추측 행 */}
        <div className="flex flex-col gap-2 mb-6">
          {Array.from({ length: MAX_GUESSES }).map((_, i) => {
            const g = guesses[i]
            const isLatest = i === latestIdx
            const isWinRow = i === wonRowIdx
            const isCorrectGuess = g?.movie.id === secret.id

            return (
              <div key={i} className="grid grid-cols-[1fr_80px_64px_64px_72px] gap-2 items-center">
                {/* 영화명 */}
                <motion.div
                  animate={
                    isLatest && g && !isCorrectGuess
                      ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
                      : isWinRow
                      ? { y: [0, -14, 3, 0] }
                      : {}
                  }
                  transition={
                    isLatest && g && !isCorrectGuess
                      ? { duration: 0.45, delay: 0.6 }
                      : isWinRow
                      ? { duration: 0.4, delay: 0, type: 'spring' }
                      : {}
                  }
                  className={`h-12 rounded-xl flex items-center px-3 text-sm font-semibold truncate border ${
                    g
                      ? isCorrectGuess
                        ? 'border-green-500 bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                      : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50'
                  }`}
                >
                  {g ? g.movie.title : <span className="text-gray-300 dark:text-gray-700">?</span>}
                </motion.div>

                {/* 장르 */}
                <HintCell hint={g?.genreHint} empty={!g} isNew={isLatest && !!g} colIdx={0} isWinRow={isWinRow}>
                  {g && (
                    <span className="text-xs text-center leading-tight">
                      {g.sharedGenres.length > 0 ? g.sharedGenres.slice(0, 2).join(' ') : '없음'}
                    </span>
                  )}
                </HintCell>

                {/* 연도 */}
                <HintCell hint={g?.yearHint} empty={!g} isNew={isLatest && !!g} colIdx={1} isWinRow={isWinRow}>
                  {g && <>{g.guessYear}{g.yearDir && <Arrow dir={g.yearDir} />}</>}
                </HintCell>

                {/* 평점 */}
                <HintCell hint={g?.ratingHint} empty={!g} isNew={isLatest && !!g} colIdx={2} isWinRow={isWinRow}>
                  {g && <>{g.movie.vote_average.toFixed(1)}{g.ratingDir && <Arrow dir={g.ratingDir} />}</>}
                </HintCell>

                {/* 인기도 */}
                <HintCell hint={g?.popularityHint} empty={!g} isNew={isLatest && !!g} colIdx={3} isWinRow={isWinRow}>
                  {g && <>{popularityLabel(g.movie.popularity)}{g.popularityDir && <Arrow dir={g.popularityDir} />}</>}
                </HintCell>
              </div>
            )
          })}
        </div>

        {/* 검색 입력 */}
        {!gameOver && (
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="영화 제목을 입력하세요..."
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
            />
            <AnimatePresence>
              {suggestions.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute z-20 w-full mt-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg overflow-hidden"
                >
                  {suggestions.map((m) => (
                    <li key={m.id}>
                      <button
                        onMouseDown={() => handleGuess(m)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between"
                      >
                        <span className="font-medium">{m.title}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-400 ml-2">{m.release_date.slice(0, 4)}</span>
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* 결과 */}
        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 rounded-2xl p-6 text-center border ${
                won ? 'border-green-500 bg-green-500/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
              }`}
            >
              <p className="text-2xl font-extrabold mb-1">
                {won ? '🎉 정답!' : '😢 아쉽네요'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">정답은</p>
              <p className="text-xl font-bold text-green-500 dark:text-green-400">{secret.title}</p>
              <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">
                {secret.release_date.slice(0, 4)} · {secret.genres.slice(0, 3).join(', ')} · ★ {secret.vote_average.toFixed(1)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-400 mt-3">내일 새로운 영화가 나옵니다</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

interface HintCellProps {
  hint?: HintLevel
  empty: boolean
  isNew?: boolean
  colIdx?: number
  isWinRow?: boolean
  children?: React.ReactNode
}

function HintCell({ hint, empty, isNew, colIdx = 0, isWinRow, children }: HintCellProps) {
  return (
    <motion.div
      initial={isNew ? { opacity: 0, scale: 0.55 } : false}
      animate={
        isWinRow
          ? { y: [0, -14, 3, 0], opacity: 1, scale: 1 }
          : { opacity: 1, scale: 1 }
      }
      transition={
        isNew
          ? { delay: colIdx * 0.12, type: 'spring', stiffness: 260, damping: 18 }
          : isWinRow
          ? { delay: (colIdx + 1) * 0.09, duration: 0.4, type: 'spring' }
          : {}
      }
      className={`h-12 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-colors ${
        empty || !hint ? 'border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50' : hintBg[hint]
      }`}
    >
      {children}
    </motion.div>
  )
}

function Arrow({ dir }: { dir: 'up' | 'down' }) {
  return <span className="text-[10px] opacity-80">{dir === 'up' ? ' ↑' : ' ↓'}</span>
}
