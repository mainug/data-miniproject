import type { Movie } from '../types/movie'

interface Props {
  movies: Movie[]
}

export function StatBanner({ movies }: Props) {
  if (movies.length === 0) return null

  const avgRating = (movies.reduce((s, m) => s + m.vote_average, 0) / movies.length).toFixed(1)
  const genres = new Set(movies.flatMap((m) => m.genres))

  return (
    <section className="w-full border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: '총 영화', value: `${movies.length}편`, sub: '데이터셋 규모' },
            { label: '평균 평점', value: avgRating, sub: '/ 10점 만점', accent: true },
            { label: '장르 수', value: `${genres.size}개`, sub: '분류된 장르' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-6 py-5 flex flex-col gap-2"
            >
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-300 uppercase tracking-widest">
                {s.label}
              </p>
              <p className={`text-3xl font-bold tracking-tight ${s.accent ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>
                {s.value}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-300">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
