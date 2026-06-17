import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import type { Movie } from '../types/movie'

interface Props {
  movie: Movie
  rank: number
}

const TMDB_IMG = 'https://image.tmdb.org/t/p/w342'

export function MovieCard({ movie, rank }: Props) {
  const navigate = useNavigate()
  const year = movie.release_date.slice(0, 4)
  const ratingPct = Math.round((movie.vote_average / 10) * 100)
  const posterUrl = movie.poster_path
    ? movie.poster_path.startsWith('http')
      ? movie.poster_path
      : `${TMDB_IMG}${movie.poster_path}`
    : null

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      onClick={() => navigate(`/movie/${movie.id}`)}
      className="relative group rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 cursor-pointer shadow-sm hover:shadow-lg dark:hover:shadow-black/40 transition-shadow"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] w-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
            🎬
          </div>
        )}

        {/* 상단 배지들 */}
        <div className="absolute top-2.5 left-2.5">
          <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-bold">
            {rank}
          </span>
        </div>
        <div className="absolute top-2.5 right-2.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-500/90 backdrop-blur-sm text-white text-[11px] font-bold">
            {ratingPct}%
          </span>
        </div>

        {/* 하단 그라디언트 + 평점 오버레이 */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-2.5 left-3 flex items-baseline gap-1">
          <span className="text-green-400 text-sm font-bold">★ {movie.vote_average.toFixed(1)}</span>
          <span className="text-white/50 text-xs">/ 10</span>
        </div>
      </div>

      {/* Info */}
      <div className="px-3 py-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-snug">
          {movie.title}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {year} · {movie.genres.slice(0, 2).join(', ')}
        </p>
      </div>
    </motion.div>
  )
}
