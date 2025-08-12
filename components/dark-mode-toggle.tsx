import { useState, useEffect } from 'react'

const DarkModeToggle = () => {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check for saved theme preference or default to system preference
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
    if (isDark) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setIsDark(false)
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setIsDark(true)
    }
  }

  return (
    <button
      onClick={toggleDarkMode}
      className="fixed top-4 right-4 z-50 flex items-center space-x-1 bg-gray-200 dark:bg-gray-700 rounded-full p-2 transition-colors duration-200 hover:bg-gray-300 dark:hover:bg-gray-600"
      aria-label="Toggle dark mode"
    >
      <span 
        className={`text-lg transition-opacity duration-200 ${isDark ? 'opacity-50' : 'opacity-100'}`}
      >
        ☀️
      </span>
      <div className="relative w-8 h-4">
        <div 
          className={`absolute top-0 left-0 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
            isDark ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </div>
      <span 
        className={`text-lg transition-opacity duration-200 ${isDark ? 'opacity-100' : 'opacity-50'}`}
      >
        🌙
      </span>
    </button>
  )
}

export default DarkModeToggle