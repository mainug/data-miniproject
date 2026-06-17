import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { KobisTrendItem } from '../../hooks/useAnalysis'

interface Props {
  trend: KobisTrendItem[]
}

export function KobisTrendChart({ trend }: Props) {
  const data = trend.map((t) => ({
    date: t.date.slice(5),
    '총관객(만)': Math.round(t.total_audience / 10000),
    '총매출(억)': Math.round(t.total_sales / 1e8),
    top: t.top_movie,
  }))

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">30일 박스오피스 추세</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">일별 총 관객수 · 총 매출액</p>
      </div>
      <ResponsiveContainer width="100%" height={340}>
        <ComposedChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="audiGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} interval={2} />
          <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#6b7280' }} unit="만" />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#6b7280' }} unit="억" />
          <Tooltip
            contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb' }}
            labelFormatter={(label) => {
              const item = data.find((d) => d.date === label)
              return `${label} (1위: ${item?.top ?? ''})`
            }}
          />
          <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
          <Area yAxisId="left" type="monotone" dataKey="총관객(만)" stroke="#60a5fa" fill="url(#audiGrad)" strokeWidth={2} />
          <Line yAxisId="right" type="monotone" dataKey="총매출(억)" stroke="#4ade80" strokeWidth={2} dot={{ r: 2 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
