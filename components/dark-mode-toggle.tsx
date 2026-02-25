import { useEffect, useState } from 'react'

const DarkModeToggle = () => {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    } else {
      setIsDark(false)
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const nextIsDark = !isDark

    if (nextIsDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }

    setIsDark(nextIsDark)
  }

  return (
    <button
      type="button"
      onClick={toggleDarkMode}
      className="fixed right-3 top-3 z-50 rounded-full border border-black/10 bg-white/70 px-2 py-1 text-xs text-gray-700 shadow-sm backdrop-blur transition hover:bg-white/90 dark:border-white/10 dark:bg-black/30 dark:text-gray-200 dark:hover:bg-black/40"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? '☾' : '☀'}
    </button>
  )
}

export default DarkModeToggle
