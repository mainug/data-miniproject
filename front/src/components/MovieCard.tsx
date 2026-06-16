import { motion } from 'motion/react'
import type { Movie } from '../types/movie'

interface Props {
  movie: Movie
  rank: number
}

const TMDB_IMG = 'https://image.tmdb.org/t/p/w342'

export function MovieCard({ movie, rank }: Props) {
  const year = movie.release_date.slice(0, 4)
  const ratingPct = Math.round((movie.vote_average / 10) * 100)
  const posterUrl = movie.poster_path
    ? movie.poster_path.startsWith('http')
      ? movie.poster_path
      : `${TMDB_IMG}${movie.poster_path}`
    : null

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="relative group rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 cursor-pointer"
    >
      {/* Poster */}
      <div className="aspect-[2/3] w-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
            🎬
          </div>
        )}
        {/* Rank badge */}
        <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/70 text-white text-xs font-bold flex items-center justify-center">
          {rank}
        </div>
        {/* Rating badge */}
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-green-500/90 text-white text-xs font-bold">
          {ratingPct}%
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">
          {movie.title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {year} · {movie.genres.slice(0, 2).join(', ')}
        </p>
        <div className="mt-2 flex items-center gap-1">
          <span className="text-green-500 dark:text-green-400 text-sm font-bold">
            ★ {movie.vote_average.toFixed(1)}
          </span>
          <span className="text-gray-400 text-xs">/ 10</span>
        </div>
      </div>
    </motion.div>
  )
}
