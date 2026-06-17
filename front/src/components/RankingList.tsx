import { motion } from 'motion/react'
import { MovieCard } from './MovieCard'
import type { Movie } from '../types/movie'

interface Props {
  movies: Movie[]
}

export function RankingList({ movies }: Props) {
  if (movies.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
        조건에 맞는 영화가 없습니다
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {movies.map((movie, i) => (
        <motion.div
          key={movie.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03, duration: 0.3 }}
        >
          <MovieCard movie={movie} rank={i + 1} />
        </motion.div>
      ))}
    </div>
  )
}
