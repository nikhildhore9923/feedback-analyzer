import { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { formatFeedback } from '../utils/textFormat';
import { 
  BellRing, 
  Mail, 
  ShieldAlert, 
  Sliders, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Zap, 
  RefreshCw, 
  Info,
  Check,
  Radio,
  FileText
} from 'lucide-react';

export default function Alerts() {
  const toast = useToast();
  const [settings, setSettings] = useState({
    alertThreshold: -0.5,
    alertTo: ''
  });
  const [criticalReviews, setCriticalReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  const tenantId = localStorage.getItem('pulse_tenant_id') || 'demo-tenant-123';
  const userEmail = localStorage.getItem('pulse_user_email') || 'admin@pulse.com';
  const isDemo = tenantId === 'demo-tenant-123' || tenantId === 'tenant_123' || userEmail === 'admin@pulse.com';

  useEffect(() => {
    async function loadAlertsData() {
      setLoading(true);
      try {
        const [settingsRes, reviewsRes] = await Promise.all([
          api.getSettings(),
          api.getReviews({ priority: 'Critical', limit: 10 }).catch(() => ({ data: { data: [] } }))
        ]);
        setSettings(settingsRes.data || { alertThreshold: -0.5, alertTo: '' });
        setCriticalReviews(reviewsRes.data?.data || []);
      } catch (err) {
        console.error('Failed to load alert rules:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAlertsData();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (isDemo) {
      toast.warning(
        'Evaluation Sandbox Protected',
        'Alert rules and notification destinations are locked on the shared demo account.'
      );
      return;
    }

    setSaving(true);
    try {
      await api.updateSettings(settings);
      toast.success(
        'Alert Rules Updated',
        `Incident trigger threshold updated to ${settings.alertThreshold} with dispatch to ${settings.alertTo || 'incident team'}.`
      );
    } catch (err) {
      toast.error('Failed to Save Rules', err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSimulateAlert = async () => {
    setSendingTest(true);
    setTimeout(() => {
      setSendingTest(false);
      toast.success(
        'Simulated Alert Dispatched',
        `Test incident payload successfully routed to ${settings.alertTo || userEmail}.`
      );
    }, 1000);
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Automation Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Incident Alert Rules & Dispatch
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure automated real-time alerts, trigger sensitivities, and email dispatch routing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Emergency Dispatch Active</span>
          </span>
        </div>
      </div>

      {/* Main Grid: Left Config, Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Alert Policy Settings */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveSettings} className="saas-card rounded-3xl p-6 sm:p-7 space-y-6">
            
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Automated Trigger Threshold
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Reviews with negative polarity below this cutoff trigger instant incident emails.
                </p>
              </div>
            </div>

            {/* Slider Rule */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Continuous Polarity Cutoff Limit
                </label>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/60">
                  {settings.alertThreshold}
                </span>
              </div>

              <input 
                type="range"
                min="-1.0"
                max="0.0"
                step="0.05"
                value={settings.alertThreshold}
                onChange={(e) => setSettings({ ...settings, alertThreshold: parseFloat(e.target.value) })}
                className="w-full accent-rose-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
              />

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>-1.0 (Critical Outages Only)</span>
                <span>Default: -0.50</span>
                <span>0.0 (All Negative Reviews)</span>
              </div>
            </div>

            {/* Destination Email */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Incident Response Email Destination
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input 
                  type="email"
                  value={settings.alertTo || ''}
                  onChange={(e) => setSettings({ ...settings, alertTo: e.target.value })}
                  placeholder="incident-team@pulse.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 hover:bg-white focus:bg-white dark:bg-[#080C14] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Alerts are delivered in real-time via the verified Resend transactional mail infrastructure.
              </p>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleSimulateAlert}
                disabled={sendingTest}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {sendingTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-500" />}
                <span>Simulate Test Trigger</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Rules...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Alert Policy</span>
                  </>
                )}
              </button>
            </div>

          </form>

          {/* Active Policies Table */}
          <div className="saas-card rounded-3xl p-6 sm:p-7 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Active Automation Policies
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="py-3 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    Severe Customer Friction Notification
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Triggers when Logistic Regression polarity &le; {settings.alertThreshold}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                  REAL-TIME
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    High Priority Incident Triage (Score &ge; 80)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Automatically tags review status as Critical and flags incident response team.
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60">
                  AUTOMATED
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    Daily Operational Digest
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Aggregated trend report dispatched daily at 8:00 AM UTC via Vercel Cron.
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/60">
                  SCHEDULED
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Dispatch Preview Card */}
        <div className="saas-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Dispatch Email Preview
              </span>
              <Mail className="w-4 h-4 text-rose-500" />
            </div>

            {/* Email Container Simulation */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#080C14] border border-slate-200/80 dark:border-slate-800/80 space-y-3 text-xs">
              <div className="border-b border-slate-200/60 dark:border-slate-800/60 pb-2 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Subject:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">[PULSE URGENT] Negative Feedback Incident</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">To:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{settings.alertTo || 'alerts@pulse.com'}</span>
                </div>
              </div>

              <div className="space-y-2 text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed">
                <p className="font-semibold text-slate-900 dark:text-white">
                  A customer feedback event has breached your configured threshold:
                </p>

                <div className="p-3 rounded-xl bg-white dark:bg-[#12151E] border border-rose-200/60 dark:border-rose-900/60 border-l-4 border-l-rose-500 text-[11.5px] italic">
                  &ldquo;Package arrived with damaged outer packaging and one accessory missing. Frustrated with carrier handling.&rdquo;
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                  <div className="p-2 rounded bg-slate-100 dark:bg-slate-900">
                    <span className="text-slate-400 block text-[9px]">ASPECT</span>
                    <span className="font-bold">Delivery</span>
                  </div>
                  <div className="p-2 rounded bg-slate-100 dark:bg-slate-900">
                    <span className="text-slate-400 block text-[9px]">PRIORITY</span>
                    <span className="font-bold text-rose-600">Score 90/100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            Emails are rendered with branded responsive HTML and direct one-click triage links.
          </div>
        </div>

      </div>

    </div>
  );
}
