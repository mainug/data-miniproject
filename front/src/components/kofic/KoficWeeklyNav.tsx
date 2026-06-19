import { useEffect, useState } from 'react'

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

// 주간: 월~일
export function buildShowRange(dateStr: string): string {
  const monday = getMonday(dateStr)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return `${toCompact(monday)}~${toCompact(sunday)}`
}

// 주말: 금~일 (KOBIS weekGb=1 형식)
export function buildWeekendRange(dateStr: string): string {
  const monday = getMonday(dateStr)
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return `${toCompact(friday)}~${toCompact(sunday)}`
}

export function getLastMonday(): string {
  // 가장 최근에 완전히 끝난 주(일요일이 지난 주)의 월요일을 반환
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const day = yesterday.getDay() // 0=일
  const lastSunday = new Date(yesterday)
  if (day !== 0) lastSunday.setDate(yesterday.getDate() - day)
  return toIso(getMonday(toIso(lastSunday)))
}

function addWeeks(dateStr: string, n: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n * 7)
  return toIso(d)
}

function formatRangeLabel(monday: string, weekGb: '0' | '1'): string {
  const mondayDate = getMonday(monday)
  const fmt = (d: Date) => {
    const s = toCompact(d)
    return `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}`
  }
  const sunday = new Date(mondayDate)
  sunday.setDate(mondayDate.getDate() + 6)

  if (weekGb === '0') {
    return `${fmt(mondayDate)}(월) ~ ${fmt(sunday)}(일)`
  } else {
    const friday = new Date(mondayDate)
    friday.setDate(mondayDate.getDate() + 4)
    return `${fmt(friday)}(금) ~ ${fmt(sunday)}(일)`
  }
}

interface Props {
  monday: string       // ISO 날짜 (월요일, e.g., "2026-03-30")
  weekGb: '0' | '1'
  onChange: (monday: string) => void
}

const MIN_DATE = '2004-01-01'

export function KoficWeeklyNav({ monday, weekGb, onChange }: Props) {
  const lastMonday = getLastMonday()
  const [pickerDate, setPickerDate] = useState(monday)

  useEffect(() => {
    setPickerDate(monday)
  }, [monday])

  const handleDateChange = (dateStr: string) => {
    const newMonday = toIso(getMonday(dateStr))
    setPickerDate(newMonday)
    onChange(newMonday)
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
          → {formatRangeLabel(monday, weekGb)}
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
