import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useTheme } from '../context/ThemeContext';
import { Sparkles, Sun, Moon, ArrowRight, Lock, Mail, ShieldAlert } from 'lucide-react';

import { isTokenValid, clearAuth } from '../utils/auth';

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
      if (res.data.success) {
        localStorage.setItem('pulse_jwt_token', res.data.token);
        localStorage.setItem('pulse_tenant_id', res.data.user.tenant_id);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-[#0B0F19] transition-colors duration-200">
      
      {/* Top Floating Theme Switch */}
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

      {/* Signup Card */}
      <div className="w-full max-w-md bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 shadow-md shadow-indigo-500/25 mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Create Your Workspace
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Spin up a dedicated Pulse analytics tenant in seconds.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-xl text-xs font-semibold mb-6 text-center animate-in fade-in flex items-center gap-2 justify-center">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@company.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors shadow-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Password (min 6 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors shadow-xs"
                minLength={6}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors shadow-xs"
                minLength={6}
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
                Registering Workspace...
              </>
            ) : (
              <>
                <span>Create Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
              Sign in here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

export default Signup;
