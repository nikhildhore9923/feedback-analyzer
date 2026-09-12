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
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-bold text-xl tracking-tight text-teal-600 dark:text-teal-400">
            Pulse
          </Link>
          <div className="flex gap-1">
            {links.map(link => (
              <Link 
                key={link.path} 
                to={link.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  location.pathname === link.path 
                    ? 'bg-teal-50 text-teal-700 dark:bg-gray-700 dark:text-teal-400' 
                    : 'text-gray-500 dark:text-gray-300 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-700 dark:hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        
        <button 
          onClick={() => setIsDark(!isDark)}
          className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </nav>
  )
}

export default Nav
