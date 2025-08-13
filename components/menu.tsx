import { useState } from 'react'

export default function Menu() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className="relative">
      {/* Hamburger Icon for Desktop */}
      <div className="hidden md:block">
        <button
          onClick={toggleMenu}
          className="p-2 text-gray-700 dark:text-gray-300"
          aria-label="Toggle Menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}
            />
          </svg>
        </button>
      </div>

      {/* Mobile Menu (always visible) */}
      <div className="md:hidden mt-8">
        <nav className="flex flex-col space-y-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Menu</h2>
          <a href="/README" className="text-gray-700 dark:text-gray-300 hover:underline">README</a>
          <a href="/quotes" className="text-gray-700 dark:text-gray-300 hover:underline">Quotes</a>
        </nav>
      </div>

      {/* Desktop Menu (slides out from the left) */}
      <div
        className={`
          hidden md:block fixed top-0 left-0 h-full bg-white dark:bg-olive-900 p-10 transition-transform duration-300 ease-in-out z-20
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ width: '250px' }}
      >
        <button
            onClick={toggleMenu}
            className="absolute top-4 right-4 p-2 text-gray-700 dark:text-gray-300"
            aria-label="Close Menu"
        >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
        <nav className="flex flex-col space-y-4 mt-12">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Menu</h2>
          <a href="/README" className="text-gray-700 dark:text-gray-300 hover:underline text-lg">README</a>
          <a href="/quotes" className="text-gray-700 dark:text-gray-300 hover:underline text-lg">Quotes</a>
        </nav>
      </div>
       {/* Overlay for when menu is open on desktop */}
       {isOpen && (
        <div
          className="hidden md:block fixed inset-0 bg-black opacity-50 z-10"
          onClick={toggleMenu}
        ></div>
      )}
    </div>
  )
}
