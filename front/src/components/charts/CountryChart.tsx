import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { CountryItem } from '../../hooks/useAnalysis'

interface Props {
  countries: CountryItem[]
}

const COLORS = ['#60a5fa','#4ade80','#f472b6','#fb923c','#a78bfa','#34d399','#38bdf8','#fbbf24','#f87171','#818cf8','#2dd4bf','#c084fc']

const COUNTRY_KO: Record<string, string> = {
  'United States of America': '미국',
  'United Kingdom': '영국',
  'South Korea': '한국',
  'France': '프랑스',
  'Japan': '일본',
  'Germany': '독일',
  'Canada': '캐나다',
  'Australia': '호주',
  'India': '인도',
  'China': '중국',
  'Spain': '스페인',
  'Italy': '이탈리아',
  'Brazil': '브라질',
  'Mexico': '멕시코',
  'New Zealand': '뉴질랜드',
  'Sweden': '스웨덴',
  'Denmark': '덴마크',
  'Norway': '노르웨이',
  'Belgium': '벨기에',
  'Ireland': '아일랜드',
  'Netherlands': '네덜란드',
  'Switzerland': '스위스',
  'Czech Republic': '체코',
  'Hungary': '헝가리',
  'Poland': '폴란드',
  'Taiwan': '대만',
  'Thailand': '태국',
  'Hong Kong': '홍콩',
}

export function CountryChart({ countries }: Props) {
  const data = countries.slice(0, 12).map((c) => ({
    name: COUNTRY_KO[c.country] ?? c.country,
    영화수: c.count,
    평균평점: c.avg_rating,
  }))

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">제작국가별 영화 수</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Top 12 국가</p>
      </div>
      <ResponsiveContainer width="100%" height={380}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} angle={-30} textAnchor="end" interval={0} />
          <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
          <Tooltip
            contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb' }}
            formatter={(v: number, name: string) =>
              name === '영화수' ? [`${v}편`, '영화 수'] : [`★ ${v}`, '평균 평점']
            }
          />
          <Bar dataKey="영화수" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
