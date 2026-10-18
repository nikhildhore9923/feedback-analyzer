import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { 
  Sun, 
  Moon, 
  LogOut, 
  LogIn, 
  Activity, 
  ListFilter, 
  Settings as SettingsIcon, 
  Menu, 
  X,
  Sparkles
} from 'lucide-react';

function Nav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const token = localStorage.getItem('pulse_jwt_token');

  const handleLogout = () => {
    localStorage.removeItem('pulse_jwt_token');
    localStorage.removeItem('pulse_tenant_id');
    navigate('/login');
  };

  const navLinks = [
    { path: '/', label: 'Dashboard', icon: Activity },
    { path: '/reviews', label: 'Feedback Stream', icon: ListFilter },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-[#0B0F19]/85 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left Brand & Desktop Links */}
          <div className="flex items-center gap-8">
            <Link 
              to="/" 
              className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg p-1"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:shadow-indigo-500/30 transition-shadow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  Pulse <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40">AI</span>
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1.5">
              {navLinks.map(({ path, label, icon: Icon }) => {
                const active = isActive(path);
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Actions (Theme Switcher, Auth) */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {token ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/40 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F19] px-4 pt-2 pb-4 space-y-2">
          {navLinks.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                isActive(path)
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            {token ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 text-white"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Nav;
