import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { 
  Menu, 
  Sun, 
  Moon, 
  Plus, 
  Radio, 
  ChevronRight, 
  Sparkles, 
  Clock, 
  Activity,
  Layers,
  Database
} from 'lucide-react';

export default function Header({ onToggleSidebar, onOpenIngest }) {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState('');

  // Live real-time clock updating every second
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).toLowerCase();
      
      const dateStr = now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      
      setCurrentTime(`${timeStr} • ${dateStr}`);
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const getBreadcrumbs = () => {
    switch (location.pathname) {
      case '/reviews':
        return { section: 'Intelligence', title: 'Feedback Stream' };
      case '/settings':
        return { section: 'Configuration', title: 'Platform Settings' };
      default:
        return { section: 'Intelligence', title: 'Overview & Telemetry' };
    }
  };

  const breadcrumb = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-white/85 dark:bg-[#090D16]/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-200">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        
        {/* Left: Hamburger & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb Path */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
              <Activity className="w-3.5 h-3.5 text-indigo-500" />
              <span>Pulse AI</span>
            </span>
            <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
            <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">
              {breadcrumb.section}
            </span>
            <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 hidden sm:inline" />
            <span className="text-slate-900 dark:text-white font-bold">
              {breadcrumb.title}
            </span>
          </nav>
        </div>

        {/* Right: Operational Telemetry, Live Clock, Ingest Action & Theme */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          
          {/* Active Context / Model Pill (Hidden on Mobile) */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300">
            <Database className="w-3.5 h-3.5 text-indigo-500" />
            <span className="truncate max-w-[200px]">NLP Engine: TF-IDF + Logistic Reg.</span>
          </div>

          {/* Real-Time Live Clock Display */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentTime || 'Loading clock...'}</span>
          </div>

          {/* Live Stream Telemetry Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline uppercase">LIVE SYNC</span>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          {/* Quick Action: Ingest Feedback */}
          <button
            onClick={onOpenIngest}
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Ingest</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

        </div>

      </div>
    </header>
  );
}
