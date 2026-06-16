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
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-black/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            CineStats
          </span>
          <span className="hidden sm:block h-4 w-px bg-gray-300 dark:bg-gray-700" />
          <span className="hidden sm:block text-xs text-gray-400 dark:text-gray-500">
            영화 데이터 대시보드
          </span>
        </div>
        <button
          onClick={() => setDark((d) => !d)}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-base"
          aria-label="테마 전환"
        >
          {dark ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  )
}
