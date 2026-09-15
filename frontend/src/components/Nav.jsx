import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

function Nav() {
  const location = useLocation()
  
  // Basic dark mode state
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark'
  })

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.body.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])
  
  const links = [
    { path: '/', label: 'Dashboard' },
    { path: '/reviews', label: 'Feedback list' },
    { path: '/settings', label: 'Settings' },
  ]

  return (
    <nav className="bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-bold text-lg tracking-tight text-indigo-600 dark:text-indigo-400">
            Pulse.
          </Link>
          <div className="flex gap-1 sm:gap-2">
            {links.map(link => (
              <Link 
                key={link.path} 
                to={link.path}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  location.pathname === link.path 
                    ? 'bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-900/30 dark:text-indigo-400' 
                    : 'text-gray-600 font-medium hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        
        <button 
          onClick={() => setIsDark(!isDark)}
          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
          title="Toggle Dark Mode"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </nav>
  )
}

export default Nav
