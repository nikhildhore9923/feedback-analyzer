import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Sun, Moon, LogOut, LogIn } from 'lucide-react'

function Nav() {
  const location = useLocation()
  const navigate = useNavigate()
  
  // Basic dark mode state
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark'
  })

  // Auth state
  const token = localStorage.getItem('pulse_jwt_token')

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.body.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])
  
  const handleLogout = () => {
    localStorage.removeItem('pulse_jwt_token')
    // We don't remove pulse_tenant_id here so the demo can still work unauthenticated if needed,
    // or you could remove it to force a full reset.
    navigate('/login')
  }

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
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsDark(!isDark)}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
            title="Toggle Dark Mode"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          {token ? (
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20 transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          ) : (
            <Link 
              to="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20 transition-colors"
            >
              <LogIn size={16} />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Nav
