import type { Movie } from '../types/movie'

interface Props {
  movies: Movie[]
}

export function StatBanner({ movies }: Props) {
  if (movies.length === 0) return null

  const avgRating = (movies.reduce((s, m) => s + m.vote_average, 0) / movies.length).toFixed(1)
  const topGross = movies.reduce((a, b) => (a.revenue > b.revenue ? a : b))
  const totalRevenue = movies.reduce((s, m) => s + m.revenue, 0)

  const kobisMovies = movies.filter((m) => m.audi_acc != null)
  const topAudience = kobisMovies.length
    ? kobisMovies.reduce((a, b) => ((a.audi_acc ?? 0) > (b.audi_acc ?? 0) ? a : b))
    : null

  const stats = [
    { label: '총 영화', value: `${movies.length}편` },
    { label: '평균 평점', value: `★ ${avgRating}` },
    {
      label: '최고 흥행 (글로벌)',
      value: topGross.title.length > 16 ? topGross.title.slice(0, 14) + '…' : topGross.title,
    },
    {
      label: '누적 수익',
      value: `$${(totalRevenue / 1e9).toFixed(1)}B`,
    },
    ...(topAudience
      ? [{
          label: '최다 관객 (한국)',
          value: `${((topAudience.audi_acc ?? 0) / 1e4).toFixed(0)}만 명`,
        }]
      : []),
  ]

  const cols = stats.length >= 5 ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'

  return (
    <div className={`grid ${cols} gap-3 py-6 px-4 sm:px-6 max-w-7xl mx-auto w-full`}>
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4"
        >
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{s.label}</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white truncate">{s.value}</p>
        </div>
      ))}
    </div>
  )
}
