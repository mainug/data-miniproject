import { useState } from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { YearTrendItem } from '../../hooks/useAnalysis'

type Metric = 'rating' | 'revenue'

interface Props {
  trend: YearTrendItem[]
}

export function YearTrendChart({ trend }: Props) {
  const [metric, setMetric] = useState<Metric>('rating')

  const data = trend.map((t) => ({
    year: t.year,
    개봉작수: t.count,
    평균평점: t.avg_rating,
    '평균수익($M)': Math.round(t.avg_revenue / 1e6),
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">연도별 트렌드</h2>
        <div className="flex gap-2">
          {([['rating', '평점'], ['revenue', '수익']] as const).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                metric === m
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={420}>
        <ComposedChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#6b7280' }} />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            label={{ value: '개봉작 수', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 12 }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={metric === 'rating' ? [4, 10] : ['auto', 'auto']}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            label={{
              value: metric === 'rating' ? '평균 평점' : '평균 수익($M)',
              angle: 90,
              position: 'insideRight',
              fill: '#9ca3af',
              fontSize: 12,
            }}
          />
          <Tooltip
            contentStyle={{
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: 8,
              color: '#f9fafb',
            }}
          />
          <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 13 }} />
          <Bar yAxisId="left" dataKey="개봉작수" fill="#60a5fa" radius={[3, 3, 0, 0]} opacity={0.8} />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey={metric === 'rating' ? '평균평점' : '평균수익($M)'}
            stroke="#4ade80"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#4ade80' }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
