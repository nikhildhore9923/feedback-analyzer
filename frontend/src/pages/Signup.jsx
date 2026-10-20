import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Activity,
  CheckCircle2,
  Eye,
  EyeOff,
  UserPlus,
  ShieldAlert,
  BarChart3,
  Database,
  UploadCloud,
  Check
} from 'lucide-react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const token = localStorage.getItem('pulse_jwt_token');
    if (token) {
      if (isTokenValid(token)) {
        navigate('/');
      } else {
        clearAuth();
      }
    }
  }, [navigate]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await api.signup(email.trim(), password);
      if (res.data?.success) {
        localStorage.setItem('pulse_jwt_token', res.data.token);
        localStorage.setItem('pulse_tenant_id', res.data.user.tenant_id);
        localStorage.setItem('pulse_user_email', res.data.user.email);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-[#0B0D13] text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans">
      
      {/* Left Column: Visual Showcase (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-7/12 relative overflow-hidden bg-slate-50/70 dark:bg-[#0E1017] p-12 xl:p-16 flex-col justify-between border-r border-slate-200/80 dark:border-slate-800/80 transition-colors duration-200">
        
        {/* Subtle Architectural Grid Pattern (No gaudy neon blobs) */}
        <div className="absolute inset-0 bg-grid-pattern opacity-15 dark:opacity-25 pointer-events-none" />
        
        {/* Refined, Monochromatic Top Spotlight */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[280px] bg-indigo-500/[0.04] dark:bg-indigo-500/[0.07] rounded-full blur-[100px] pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center shadow-sm shadow-indigo-500/20 text-white">
              <Activity className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Pulse
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Workspace Setup
              </span>
            </div>
          </div>

          <div className="hidden xl:inline-flex items-center gap-2 px-3 py-1 rounded-md text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-white/80 dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Dedicated Tenant Provisioning</span>
          </div>
        </div>

        {/* Narrative & Benefits */}
        <div className="relative z-10 my-auto max-w-xl space-y-7">
          <div className="space-y-3.5">
            <h1 className="text-4xl xl:text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-[1.15]">
              Instant Workspace,{' '}
              <span className="text-indigo-600 dark:text-indigo-400">
                Guaranteed Isolation.
              </span>
            </h1>
            <p className="text-sm xl:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg font-normal">
              Create a dedicated customer feedback workspace with custom triage thresholds, automated alert routing, and real-time sentiment analytics.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                title: "Multi-Tenant Database Isolation",
                desc: "Dedicated workspace boundaries with cryptographically unique UUID tenancy.",
                tag: "Zero Leakage",
                icon: Database,
                color: "indigo"
              },
              {
                title: "Real-time Sentiment & Aspect Categorization",
                desc: "Live NLP scoring tagging polarity, confidence scores, and aspect buckets.",
                tag: "Active ML",
                icon: BarChart3,
                color: "emerald"
              },
              {
                title: "Automated Incident Escalation Engine",
                desc: "Configurable severity thresholds trigger instant email dispatch to on-call leads.",
                tag: "<5s Alerts",
                icon: ShieldAlert,
                color: "rose"
              },
              {
                title: "High-Throughput Batch Ingestion",
                desc: "Ingest CSV customer feedback datasets with automatic background schema parsing.",
                tag: "Instant Indexing",
                icon: UploadCloud,
                color: "cyan"
              }
            ].map((feature, i) => {
              const IconComponent = feature.icon;
              return (
                <div 
                  key={i} 
                  className="group flex items-start gap-3.5 p-3.5 rounded-xl bg-white/90 dark:bg-[#131620] border border-slate-200/90 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:dark:bg-[#161a26] hover:-translate-y-0.5 transition-all duration-200 shadow-2xs dark:shadow-none"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    feature.color === 'indigo' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-500/20' :
                    feature.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-500/20' :
                    feature.color === 'rose' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-500/20' :
                    'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200/80 dark:border-sky-500/20'
                  }`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-200 tracking-wide">
                        {feature.title}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/90 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {feature.tag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Left Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">Enterprise Tenant Security</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Multi-Tenant TLS 1.3 Encryption</span>
          </div>
        </div>

      </div>

      {/* Right Column: Signup Form */}
      <div className="w-full lg:w-5/12 flex flex-col items-center justify-center p-6 sm:p-12 relative bg-slate-50/50 dark:bg-[#0B0D13]">
        
        {/* Floating Theme Toggle */}
        <div className="absolute top-6 right-6 z-20">
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131620] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-2xs transition-all focus:outline-none cursor-pointer"
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-medium hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-[11px] font-medium hidden sm:inline">Dark</span>
              </>
            )}
          </button>
        </div>

        <div className="w-full max-w-[420px] bg-white dark:bg-[#12151E] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-7 sm:p-9 shadow-lg shadow-slate-200/50 dark:shadow-2xl dark:shadow-black/70">
          
          {/* Mobile Top Brand */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Activity className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Pulse</span>
          </div>

          <div className="text-center mb-6">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/80 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-3">
              <UserPlus className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Create Organization
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Initialize your private intelligence workspace
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 px-3.5 py-2.5 rounded-xl text-xs font-medium mb-4 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="lead@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 hover:bg-white focus:bg-white dark:bg-[#0B0D13] dark:hover:bg-[#0E1018] dark:focus:bg-[#0E1018] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-500 transition-all font-normal"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50/70 hover:bg-white focus:bg-white dark:bg-[#0B0D13] dark:hover:bg-[#0E1018] dark:focus:bg-[#0E1018] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-500 transition-all font-normal"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 hover:bg-white focus:bg-white dark:bg-[#0B0D13] dark:hover:bg-[#0E1018] dark:focus:bg-[#0E1018] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-500 transition-all font-normal"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-sm hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.985] cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Provisioning Workspace...</span>
                </>
              ) : (
                <>
                  <span>Create Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
                Sign In
              </Link>
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
