import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { MovieCard } from '../MovieCard'
import type { Movie } from '../../types/movie'

export function SearchTab() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Movie[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResults([])
      setSearched(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`http://localhost:8080/api/movies/search?query=${encodeURIComponent(q)}`)
        const data: Movie[] = await res.json()
        setResults(data)
        setSearched(true)
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [query])

  return (
    <div>
      {/* 검색 입력 */}
      <div className="relative mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="영화 제목을 입력하세요..."
          autoFocus
          className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          {loading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          )}
        </span>
      </div>

      {!query.trim() && (
        <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-500 text-sm">
          영화 제목을 입력하면 바로 검색됩니다
        </div>
      )}

      {searched && !loading && results.length === 0 && (
        <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-500 text-sm">
          "{query}"에 대한 결과가 없습니다
        </div>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {results.map((movie, i) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
            >
              <MovieCard movie={movie} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
