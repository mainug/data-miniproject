import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { DirectorItem } from '../../hooks/useAnalysis'

interface Props {
  directors: DirectorItem[]
}

const COLORS = ['#4ade80','#60a5fa','#f472b6','#fb923c','#a78bfa','#34d399','#38bdf8','#fbbf24','#f87171','#818cf8']

export function DirectorChart({ directors }: Props) {
  const data = directors.slice(0, 15).map((d) => ({
    name: d.director.length > 12 ? d.director.slice(0, 11) + '…' : d.director,
    평균평점: d.avg_rating,
    작품수: d.count,
    movies: d.movies.join(', '),
  }))

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">감독별 평균 평점</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">2편 이상 연출 감독 (평점순 Top 15)</p>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(300, data.length * 32)}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 60, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} horizontal={false} />
          <XAxis type="number" domain={[5, 10]} tick={{ fontSize: 11, fill: '#6b7280' }} />
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: '#9ca3af' }} />
          <Tooltip
            contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb' }}
            formatter={(v: number) => [`★ ${v}`, '평균 평점']}
            labelFormatter={(name) => {
              const item = data.find((d) => d.name === name)
              return item ? `${name} (${item.작품수}편: ${item.movies})` : name
            }}
          />
          <Bar dataKey="평균평점" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
