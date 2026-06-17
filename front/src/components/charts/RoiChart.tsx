import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import type { RoiItem } from '../../hooks/useAnalysis'

interface Props {
  items: RoiItem[]
}

export function RoiChart({ items }: Props) {
  const top = items.slice(0, 15)
  const bottom = [...items].sort((a, b) => a.roi - b.roi).slice(0, 5)
  const combined = [...top, ...bottom.filter((b) => !top.find((t) => t.title === b.title))]
    .sort((a, b) => b.roi - a.roi)

  const data = combined.map((r) => ({
    name: r.title.length > 16 ? r.title.slice(0, 15) + '…' : r.title,
    ROI: r.roi,
    budget: `$${Math.round(r.budget / 1e6)}M`,
    revenue: `$${Math.round(r.revenue / 1e6)}M`,
  }))

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">수익성(ROI) 분석</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          ROI = (수익 - 제작비) / 제작비 × 100%
        </p>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(350, data.length * 30)}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 60, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} unit="%" />
          <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: '#9ca3af' }} />
          <ReferenceLine x={0} stroke="#6b7280" strokeDasharray="3 3" />
          <Tooltip
            contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb' }}
            formatter={(v: number) => [`${v.toFixed(1)}%`, 'ROI']}
            labelFormatter={(name) => {
              const item = data.find((d) => d.name === name)
              return item ? `${name} (제작비: ${item.budget}, 수익: ${item.revenue})` : name
            }}
          />
          <Bar dataKey="ROI" radius={[0, 4, 4, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.ROI >= 0 ? '#4ade80' : '#f87171'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
