import { useState, useEffect } from 'react'

// 날짜 문자열 → 해당 주 월요일 Date
function getMonday(dateStr: string): Date {
  const d = new Date(dateStr)
  const day = d.getDay() // 0=일
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function toCompact(d: Date): string {
  return toIso(d).replace(/-/g, '')
}

export function buildShowRange(dateStr: string): string {
  const monday = getMonday(dateStr)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return `${toCompact(monday)}~${toCompact(sunday)}`
}

export function getLastMonday(): string {
  const today = new Date()
  const monday = getMonday(toIso(today))
  // 오늘이 월요일이면 지난주 월요일로
  if (toIso(monday) >= toIso(today)) monday.setDate(monday.getDate() - 7)
  return toIso(monday)
}

function addWeeks(dateStr: string, n: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n * 7)
  return toIso(d)
}

function formatWeekLabel(showRange: string): string {
  const [s, e] = showRange.split('~')
  if (!s || !e) return showRange
  const fmt = (c: string) => `${c.slice(0, 4)}.${c.slice(4, 6)}.${c.slice(6, 8)}`
  return `${fmt(s)}(월) ~ ${fmt(e)}(일)`
}

interface Props {
  showRange: string
  onChange: (showRange: string) => void
}

const MIN_DATE = '2004-01-01'

export function KoficWeeklyNav({ showRange, onChange }: Props) {
  const lastMonday = getLastMonday()

  // pickerDate = 현재 showRange의 월요일 ISO 날짜
  const [pickerDate, setPickerDate] = useState<string>(() => {
    const s = showRange.split('~')[0]
    if (!s) return lastMonday
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
  })

  // showRange가 외부에서 바뀌면 pickerDate 동기화
  useEffect(() => {
    const s = showRange.split('~')[0]
    if (!s) return
    setPickerDate(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`)
  }, [showRange])

  const handleDateChange = (dateStr: string) => {
    setPickerDate(dateStr)
    onChange(buildShowRange(dateStr))
  }

  const movePrev = () => handleDateChange(addWeeks(pickerDate, -1))
  const moveNext = () => handleDateChange(addWeeks(pickerDate, 1))
  const moveLatest = () => handleDateChange(lastMonday)

  const isLatest = pickerDate >= lastMonday
  const isEarliest = pickerDate <= MIN_DATE

  return (
    <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-4 flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mr-2">기간</span>

        <button
          onClick={movePrev}
          disabled={isEarliest}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            isEarliest
              ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
              : 'text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          ← 이전 주
        </button>

        <input
          type="date"
          value={pickerDate}
          min={MIN_DATE}
          max={lastMonday}
          onChange={(e) => e.target.value && handleDateChange(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 cursor-pointer"
        />

        <span className="text-xs text-gray-500 dark:text-gray-300 whitespace-nowrap">
          → {formatWeekLabel(showRange)}
        </span>

        <button
          onClick={moveNext}
          disabled={isLatest}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            isLatest
              ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
              : 'text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          다음 주 →
        </button>

        {!isLatest && (
          <button
            onClick={moveLatest}
            className="ml-1 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 transition-colors"
          >
            최신
          </button>
        )}
      </div>
    </div>
  )
}
