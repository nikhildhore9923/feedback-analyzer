import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { api } from '../api';
import { useTheme } from '../context/ThemeContext';
import { isTokenValid, clearAuth } from '../utils/auth';
import { Sparkles, Sun, Moon, ArrowRight, Lock, Mail, ShieldCheck, AlertCircle, X } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('admin@pulse.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    // Only show session expired notice if redirected with explicit query param
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('expired') === '1' || searchParams.get('session_expired') === 'true') {
      clearAuth();
      setSessionExpiredNotice(true);
      return;
    }

    const token = localStorage.getItem('pulse_jwt_token');
    if (token) {
      if (isTokenValid(token)) {
        navigate('/');
      } else {
        // Silently clear stale token without showing an alarming expired banner
        clearAuth();
      }
    }
  }, [navigate, location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.login(email.trim(), password);
      if (res.data.success) {
        localStorage.setItem('pulse_jwt_token', res.data.token);
        localStorage.setItem('pulse_tenant_id', res.data.user.tenant_id);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemo = () => {
    setEmail('admin@pulse.com');
    setPassword('password123');
    setError('');
    setSessionExpiredNotice(false);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-[#0B0F19] transition-colors duration-200">
      
      {/* Top Floating Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 shadow-md shadow-indigo-500/25 mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Pulse Intelligence
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Sign in to access your real-time customer sentiment telemetry.
          </p>
        </div>

        {/* Session Expired Notice */}
        {sessionExpiredNotice && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 px-4 py-3 rounded-xl text-xs font-semibold mb-6 animate-in fade-in flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Your session has expired. Please sign in again.</span>
            </div>
            <button 
              type="button" 
              onClick={() => setSessionExpiredNotice(false)} 
              className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 p-0.5 rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors"
              aria-label="Dismiss notice"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-xl text-xs font-semibold mb-6 text-center animate-in fade-in">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                  setSessionExpiredNotice(false);
                }}
                placeholder="you@company.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors shadow-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                  setSessionExpiredNotice(false);
                }}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors shadow-xs"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Callout */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-left mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> Demo Credentials
              </span>
              <button 
                type="button" 
                onClick={handleUseDemo}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Auto-fill
              </button>
            </div>
            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              admin@pulse.com &bull; password123
            </p>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
              Create a workspace
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

export default Login;
