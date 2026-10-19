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
  TrendingUp,
  Eye,
  EyeOff,
  Zap,
  Radio,
  ShieldAlert
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
    <div className="min-h-screen w-full flex bg-[#F8FAFC] dark:bg-[#070A12] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Left Column: Brand Showcase (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#061826] via-[#081F38] to-[#040E1B] p-12 lg:p-16 flex-col justify-between border-r border-slate-800/80">
        
        {/* Ambient Glow Orbs */}
        <div className="absolute top-0 left-1/4 w-[450px] h-[450px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Activity className="w-6 h-6 text-white stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Pulse
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                AI Pro
              </span>
            </span>
          </div>
        </div>

        {/* Narrative & Feature Cards */}
        <div className="relative z-10 my-auto max-w-xl space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Customer Intelligence, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400">
                Automated.
              </span>
            </h1>
            <p className="text-sm text-slate-300/90 leading-relaxed max-w-lg">
              Pulse provides engineering, product, and leadership teams with continuous, biometric-grade customer feedback telemetry. Verifiable, real-time, and seamlessly integrated.
            </p>
          </div>

          {/* High-Concept Feature Highlights */}
          <div className="space-y-4">
            
            {/* Feature 1 */}
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white tracking-wide">
                  Live Sentiment Telemetry
                </h4>
                <p className="text-xs text-slate-300/80 leading-relaxed">
                  Real-time polarity scoring and aspect extraction powered by calibrated TF-IDF and Logistic Regression inference.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white tracking-wide">
                  Automated Incident Escalation
                </h4>
                <p className="text-xs text-slate-300/80 leading-relaxed">
                  Configurable threshold rules automatically trigger zero-latency transactional notifications via the Resend API.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white tracking-wide">
                  Executive AI Synthesis
                </h4>
                <p className="text-xs text-slate-300/80 leading-relaxed">
                  High-level thematic briefing generated by Groq LLM across high-velocity customer feedback streams.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Left Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-6 border-t border-white/10">
          <span>Enterprise Tenant Isolation</span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> End-to-End Cryptographic JWT
          </span>
        </div>

      </div>

      {/* Right Column: Authentication Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        
        {/* Floating Theme Toggle */}
        <div className="absolute top-6 right-6">
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-2xs transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>

        <div className="w-full max-w-md saas-card rounded-3xl p-8 sm:p-10 shadow-2xl">
          
          {/* Header Badge & Title */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 dark:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 mx-auto flex items-center justify-center mb-4">
              <Lock className="w-7 h-7 stroke-[2.2]" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Sign In
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Enter your credentials to access the intelligence portal
            </p>
          </div>

          {/* Expired Session Notice */}
          {sessionExpiredNotice && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 px-4 py-3 rounded-xl text-xs font-semibold mb-5 flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
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

          {/* Error Alert */}
          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-xl text-xs font-semibold mb-5 text-center animate-in fade-in">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Institutional / Work Email
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
                  placeholder="admin@pulse.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                    setSessionExpiredNotice(false);
                  }}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-emerald-600/25 hover:shadow-emerald-600/35 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Accessing Portal...</span>
                </>
              ) : (
                <>
                  <span>Access Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demonstration Access Section */}
          <div className="mt-7 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
              Demonstration Access
            </span>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                disabled={loading}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-900 hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 transition-all flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                <span>Admin Demo</span>
              </button>
            </div>
          </div>

          {/* Footer Link */}
          <div className="mt-5 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Need a separate organization?{' '}
              <Link to="/signup" className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">
                Create workspace
              </Link>
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
