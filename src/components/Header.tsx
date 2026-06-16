import { useState, useEffect } from 'react'

export function Header() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            🎬 CineStats
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
            영화 데이터 대시보드
          </span>
        </div>
        <button
          onClick={() => setDark((d) => !d)}
          className="w-9 h-9 flex items-center justify-center rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="테마 전환"
        >
          {dark ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  )
}
