import { useState } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from 'recharts'
import type { CorrelationPoint, Coefficients } from '../../hooks/useAnalysis'

type Mode = 'revenue' | 'popularity' | 'budget'

interface Props {
  scatter: CorrelationPoint[]
  coefficients: Coefficients
  sampleSize: number
}

const MODE_CFG: Record<Mode, { label: string; yLabel: string; color: string; format: (v: number) => string; coefKey: keyof Coefficients }> = {
  revenue:    { label: '수익', yLabel: '수익 ($)', color: '#4ade80', format: (v) => `$${(v / 1e6).toFixed(0)}M`, coefKey: 'rating_vs_revenue' },
  popularity: { label: '인기도', yLabel: '인기도', color: '#60a5fa', format: (v) => v.toFixed(1), coefKey: 'rating_vs_popularity' },
  budget:     { label: '제작비', yLabel: '제작비 ($)', color: '#f472b6', format: (v) => `$${(v / 1e6).toFixed(0)}M`, coefKey: 'budget_vs_revenue' },
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: { title: string; x: number; y: number } }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white shadow-lg">
      <p className="font-semibold truncate max-w-[220px]">{d.title}</p>
      <p className="text-gray-300">평점: ★ {d.x}</p>
      <p className="text-gray-300">Y: {d.y.toLocaleString()}</p>
    </div>
  )
}

export function RatingScatter({ scatter, coefficients, sampleSize }: Props) {
  const [mode, setMode] = useState<Mode>('revenue')
  const cfg = MODE_CFG[mode]

  const data = scatter
    .filter((m) => {
      if (mode === 'budget') return m.budget > 0 && m.revenue > 0
      if (mode === 'revenue') return m.revenue > 0
      return true
    })
    .map((m) => ({
      x: m.vote_average,
      y: mode === 'revenue' ? m.revenue : mode === 'popularity' ? m.popularity : m.budget,
      title: m.title,
    }))

  const coef = mode === 'budget' ? coefficients.budget_vs_revenue : coefficients[cfg.coefKey]

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {mode === 'budget' ? '제작비 vs 수익' : `평점 vs ${cfg.label}`} 상관관계
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            상관계수(r) = <span className={`font-bold ${Math.abs(coef) > 0.5 ? 'text-green-400' : Math.abs(coef) > 0.2 ? 'text-yellow-400' : 'text-gray-400'}`}>{coef}</span>
            {' · '}표본 {mode === 'budget' ? data.length : sampleSize}편
            {' · '}
            {Math.abs(coef) > 0.7 ? '강한 상관' : Math.abs(coef) > 0.4 ? '보통 상관' : Math.abs(coef) > 0.2 ? '약한 상관' : '거의 무관'}
          </p>
        </div>
        <div className="flex gap-2">
          {(Object.keys(MODE_CFG) as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                mode === m
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {MODE_CFG[m].label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={420}>
        <ScatterChart margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey="x"
            type="number"
            name={mode === 'budget' ? '제작비' : '평점'}
            domain={mode === 'budget' ? ['auto', 'auto'] : [4, 10]}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickFormatter={mode === 'budget' ? (v: number) => `$${(v / 1e6).toFixed(0)}M` : undefined}
            label={{ value: mode === 'budget' ? '제작비' : '평점', position: 'insideBottom', offset: -5, fill: '#9ca3af', fontSize: 12 }}
          />
          <YAxis
            dataKey="y"
            type="number"
            name={mode === 'budget' ? '수익' : cfg.yLabel}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickFormatter={(v: number) => mode === 'popularity' ? `${v}` : `$${(v / 1e6).toFixed(0)}M`}
            label={{ value: mode === 'budget' ? '수익' : cfg.yLabel, angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 12 }}
          />
          <ZAxis range={[40, 40]} />
          <Tooltip content={<CustomTooltip />} />
          <Scatter data={data} fill={cfg.color} opacity={0.7} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
