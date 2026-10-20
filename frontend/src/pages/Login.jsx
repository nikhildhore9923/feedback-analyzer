import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { api } from '../api';
import { useTheme } from '../context/ThemeContext';
import { isTokenValid, clearAuth } from '../utils/auth';
import { 
  Sparkles, 
  Sun, 
  Moon, 
  ArrowRight, 
  Lock, 
  Mail, 
  ShieldCheck, 
  AlertCircle, 
  X,
  Activity,
  CheckCircle2,
  Eye,
  EyeOff,
  Zap,
  ShieldAlert,
  BarChart3,
  Cpu
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('admin@pulse.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
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
      if (res.data?.success) {
        localStorage.setItem('pulse_jwt_token', res.data.token);
        localStorage.setItem('pulse_tenant_id', res.data.user.tenant_id);
        localStorage.setItem('pulse_user_email', res.data.user.email);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setEmail('admin@pulse.com');
    setPassword('password123');
    setLoading(true);
    setError('');
    setSessionExpiredNotice(false);

    try {
      const res = await api.login('admin@pulse.com', 'password123');
      if (res.data?.success) {
        localStorage.setItem('pulse_jwt_token', res.data.token);
        localStorage.setItem('pulse_tenant_id', res.data.user.tenant_id);
        localStorage.setItem('pulse_user_email', res.data.user.email);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Demo login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-[#070A12] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Left Column: Product Showcase & Brand Hero (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-7/12 relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#0B132B] to-slate-950 p-12 xl:p-16 flex-col justify-between border-r border-slate-800/60">
        
        {/* Subtle Ambient Glow Mesh */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <Activity className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-xl font-bold tracking-tight text-white">
              Pulse
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-400/30">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Customer Intelligence
            </span>
          </div>
        </div>

        {/* Narrative & Value Proposition */}
        <div className="relative z-10 my-auto max-w-xl space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
              Turn customer feedback into{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-300 to-teal-300">
                product clarity.
              </span>
            </h1>
            <p className="text-sm xl:text-base text-slate-300/90 leading-relaxed max-w-lg font-normal">
              Real-time sentiment scoring, automated incident triage, and executive summaries — purpose-built for engineering, product, and leadership teams.
            </p>
          </div>

          {/* Feature Highlight Cards */}
          <div className="space-y-3.5">
            
            {/* Feature 1: Sentiment Engine */}
            <div className="group flex items-start gap-3.5 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all duration-200 backdrop-blur-sm shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-indigo-500/25 transition-colors">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-semibold text-white tracking-wide">
                    Live Sentiment & Aspect Telemetry
                  </h4>
                  <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Active Pipeline
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time polarity classification across Positive, Neutral, and Negative with calibrated confidence and category tagging.
                </p>
              </div>
            </div>

            {/* Feature 2: Automated Incident Escalation */}
            <div className="group flex items-start gap-3.5 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all duration-200 backdrop-blur-sm shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-rose-500/25 transition-colors">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-semibold text-white tracking-wide">
                    Automated Priority & Incident Triage
                  </h4>
                  <span className="text-[10px] font-medium text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    Threshold Alerts
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Severity scoring algorithm automatically flags critical negative reviews and dispatches instant email alerts.
                </p>
              </div>
            </div>

            {/* Feature 3: Executive AI Synthesis */}
            <div className="group flex items-start gap-3.5 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all duration-200 backdrop-blur-sm shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-cyan-500/25 transition-colors">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-semibold text-white tracking-wide">
                    Executive AI Synthesis
                  </h4>
                  <span className="text-[10px] font-medium text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    &lt;300ms Groq LPU
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Generative summaries synthesize raw customer feedback streams into high-level thematic briefings for leadership.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Trust Badges Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">Multi-Tenant Workspace Isolation</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Cryptographic JWT Security</span>
          </div>
        </div>

      </div>

      {/* Right Column: Authentication Card & Form */}
      <div className="w-full lg:w-5/12 flex flex-col items-center justify-center p-6 sm:p-12 relative bg-slate-50 dark:bg-[#070A12]">
        
        {/* Floating Theme Toggle (Top-Right) */}
        <div className="absolute top-6 right-6 z-20">
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-xs backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>

        {/* Main Card */}
        <div className="w-full max-w-[420px] bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-7 sm:p-9 shadow-xl shadow-slate-200/40 dark:shadow-2xl dark:shadow-black/50 backdrop-blur-xl">
          
          {/* Header & Logo Badge */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 shadow-sm mx-auto flex items-center justify-center mb-3.5">
              <Activity className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome back
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Sign in to your Pulse workspace to view feedback analytics
            </p>
          </div>

          {/* Session Expired Notice */}
          {sessionExpiredNotice && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 px-3.5 py-2.5 rounded-xl text-xs font-medium mb-4 flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Your session expired. Please sign in again.</span>
              </div>
              <button 
                type="button" 
                onClick={() => setSessionExpiredNotice(false)} 
                className="text-amber-600 hover:text-amber-800 dark:text-amber-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Error Notice */}
          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 px-3.5 py-2.5 rounded-xl text-xs font-medium mb-4 text-center animate-in fade-in">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                    setSessionExpiredNotice(false);
                  }}
                  placeholder="admin@pulse.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-600 dark:focus:border-indigo-400 transition-all font-normal"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                    setSessionExpiredNotice(false);
                  }}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-600 dark:focus:border-indigo-400 transition-all font-normal"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-indigo-600/25 hover:shadow-indigo-600/35 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Recruiter & Evaluator Access */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 text-center">
            <div className="flex items-center justify-center gap-2 mb-2.5">
              <span className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Recruiter Demo Access
              </span>
              <span className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
            </div>

            <button
              type="button"
              onClick={handleQuickDemoLogin}
              disabled={loading}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-100/90 dark:bg-slate-800/80 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 dark:hover:bg-slate-800 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-750 transition-all flex items-center justify-center gap-2 cursor-pointer group"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20 group-hover:scale-110 transition-transform" />
              <span>Instant Recruiter Demo</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 ml-auto font-mono">
                1-Click
              </span>
            </button>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
              Preloaded with random sample feedback, sentiment charts &amp; summaries
            </p>
          </div>

          {/* Footer Signup Link */}
          <div className="mt-5 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Need a separate organization?{' '}
              <Link to="/signup" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
                Create workspace
              </Link>
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
