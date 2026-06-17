import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { GenreItem } from '../../hooks/useAnalysis'

type Metric = 'count' | 'avg_rating' | 'avg_revenue'

interface Props {
  genres: GenreItem[]
}

const COLORS = [
  '#4ade80','#60a5fa','#f472b6','#fb923c','#a78bfa',
  '#34d399','#38bdf8','#fbbf24','#f87171','#818cf8',
  '#2dd4bf','#c084fc','#fb7185','#4ade80','#facc15',
  '#e879f9','#67e8f9','#fdba74','#86efac',
]

const METRIC_CFG: Record<Metric, { label: string; dataKey: string; format: (v: number) => string }> = {
  count:       { label: '영화 수', dataKey: 'count', format: (v) => `${v}편` },
  avg_rating:  { label: '평균 평점', dataKey: 'avg_rating', format: (v) => `★ ${v}` },
  avg_revenue: { label: '평균 수익', dataKey: 'avg_revenue_m', format: (v) => `$${v}M` },
}

export function GenreChart({ genres }: Props) {
  const [metric, setMetric] = useState<Metric>('count')
  const cfg = METRIC_CFG[metric]

  const data = genres
    .map((g) => ({
      name: g.genre,
      count: g.count,
      avg_rating: g.avg_rating,
      avg_revenue_m: Math.round(g.avg_revenue / 1e6),
      total_revenue_m: Math.round(g.total_revenue / 1e6),
      top_movie: g.top_movie,
      top_movie_rating: g.top_movie_rating,
    }))
    .sort((a, b) => {
      const key = cfg.dataKey as keyof typeof a
      return (b[key] as number) - (a[key] as number)
    })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">장르별 분석</h2>
        <div className="flex gap-2">
          {(Object.keys(METRIC_CFG) as Metric[]).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                metric === m
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {METRIC_CFG[m].label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={420}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            angle={-40}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
          <Tooltip
            contentStyle={{
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: 8,
              color: '#f9fafb',
            }}
            formatter={(v: number) => [cfg.format(v), cfg.label]}
            labelFormatter={(name) => {
              const item = data.find((d) => d.name === name)
              if (!item) return name
              return `${name} (최고: ${item.top_movie} ★${item.top_movie_rating})`
            }}
          />
          <Bar dataKey={cfg.dataKey} radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
