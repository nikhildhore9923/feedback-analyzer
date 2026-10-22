import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquareText, 
  BarChart3,
  BellRing,
  SlidersHorizontal, 
  Activity, 
  LogOut, 
  ShieldCheck, 
  Zap, 
  Radio, 
  Database,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
  Plus
} from 'lucide-react';
import { clearAuth } from '../utils/auth';

export default function Sidebar({ mobileOpen, setMobileOpen, onOpenIngest }) {
  const location = useLocation();
  const navigate = useNavigate();

  const userEmail = localStorage.getItem('pulse_user_email') || 'admin@pulse.com';
  const tenantId = localStorage.getItem('pulse_tenant_id') || 'demo-tenant-123';
  const isDemo = tenantId === 'demo-tenant-123' || tenantId === 'tenant_123' || userEmail === 'admin@pulse.com';
  const initials = (userEmail.slice(0, 2) || 'AD').toUpperCase();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const navGroups = [
    {
      group: 'INTELLIGENCE',
      items: [
        { path: '/', label: 'Overview & Telemetry', icon: LayoutDashboard },
        { path: '/reviews', label: 'Feedback Stream', icon: MessageSquareText, badge: 'Live' },
        { path: '/aspects', label: 'Aspect Analytics', icon: BarChart3, badge: '5 Topics' },
      ]
    },
    {
      group: 'AUTOMATIONS',
      items: [
        { path: '/alerts', label: 'Incident Alert Rules', icon: BellRing, badge: 'Active' },
      ]
    },
    {
      group: 'SYSTEM',
      items: [
        { path: '/settings', label: 'Platform Settings', icon: SlidersHorizontal },
      ]
    }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 flex flex-col
        bg-white dark:bg-[#080C14] 
        border-r border-slate-200/80 dark:border-slate-800/80
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800/70">
          <Link 
            to="/" 
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
              <Activity className="w-5 h-5 text-white stroke-[2.5]" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#080C14]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  Pulse
                </span>
                <span className="text-[10px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded-md bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-xs">
                  AI Pro
                </span>
              </div>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 -mt-0.5">
                Customer Intelligence
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          
          {/* Quick Action Ingest Button */}
          <button
            type="button"
            onClick={() => { setMobileOpen(false); if (onOpenIngest) onOpenIngest(); }}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs hover:shadow-indigo-500/20 transition-all active:scale-[0.985] cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ingest Customer Feedback</span>
          </button>

          {navGroups.map((group) => (
            <div key={group.group} className="space-y-1">
              <div className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                {group.group}
              </div>
              {group.items.map(({ path, label, icon: Icon, badge }) => {
                const active = isActive(path);
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold
                      transition-all duration-150 group
                      ${active 
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs border border-indigo-200/80 dark:border-indigo-800/60' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-900/60'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {active && (
                        <span className="absolute left-1 top-2.5 bottom-2.5 w-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                      )}
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                        active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                      }`} />
                      <span className="truncate">{label}</span>
                    </div>

                    {badge && (
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                        active
                          ? 'bg-indigo-200/60 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}

          {/* Real-Time ML Engine Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/40 dark:from-slate-900/60 dark:to-indigo-950/20 border border-slate-200/70 dark:border-slate-800/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                ML Inference Pipeline
              </span>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                ACTIVE
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Model:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Logistic Reg. (89.2%)</span>
              </div>
              <div className="flex justify-between">
                <span>Aspects:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Multi-class (5)</span>
              </div>
              <div className="flex justify-between">
                <span>LLM Engine:</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">Groq Qwen 2.5 70B</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Footer: User Card & Sign Out */}
        <div className="p-4 border-t border-slate-200/70 dark:border-slate-800/70 bg-slate-50/60 dark:bg-[#070A12]/60">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-xs">
                {initials}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate" title={userEmail}>
                  {userEmail}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isDemo ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {isDemo ? 'Demo Mode' : 'Enterprise'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 transition-all focus:outline-none cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </aside>
    </>
  );
}
