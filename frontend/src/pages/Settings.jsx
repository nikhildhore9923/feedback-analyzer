import { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { 
  Bell, 
  Mail, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  Info,
  ShieldAlert,
  Sliders,
  Check,
  RefreshCw,
  Building2,
  Lock
} from 'lucide-react';

function ConfirmModal({ isOpen, onClose, onConfirm, isDemo, clearing }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#12151E] rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800/90 w-full max-w-md overflow-hidden p-6 sm:p-7 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {isDemo ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-amber-100/80 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                Evaluation Sandbox
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Workspace Purge Restricted
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              This tenant is running under the shared benchmark demonstration account (<span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">admin@pulse.com</span>). Resetting workspace feedback data is disabled to ensure a stable testing environment for all reviewers.
            </p>

            <div className="p-3 mb-6 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/50 text-[11px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
              💡 <span className="font-semibold">Sandbox Tip:</span> To test complete data purges, custom incident webhooks, and private batch uploads, register your own personal workspace.
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors shadow-xs"
              >
                Understood
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
              Purge Workspace Data
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              This will permanently delete all customer feedback items, batches, and trend data for this tenant account. This action cannot be reversed.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button 
                onClick={onClose} 
                disabled={clearing}
                className="px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={onConfirm} 
                disabled={clearing}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs disabled:opacity-50"
              >
                {clearing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Purging Data...</span>
                  </>
                ) : (
                  <span>Confirm & Purge Data</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Settings() {
  const toast = useToast();
  const [settings, setSettings] = useState({
    alertThreshold: -0.5,
    alertTo: ''
  });
  const [saved, setSaved] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const tenantId = localStorage.getItem('pulse_tenant_id') || 'demo-tenant-123';
  const userEmail = localStorage.getItem('pulse_user_email') || 'admin@pulse.com';
  const isDemo = tenantId === 'demo-tenant-123' || tenantId === 'tenant_123' || userEmail === 'admin@pulse.com';

  useEffect(() => {
    api.getSettings().then((res) => {
      setSettings(res.data);
    }).catch(err => {
      console.error('Failed to load settings:', err);
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (isDemo) {
      toast.warning('Demo Mode Protected', 'Settings modification is disabled in demo mode to preserve shared evaluation configuration.');
      return;
    }
    setLoading(true);
    try {
      await api.updateSettings(settings);
      setSaved(true);
      toast.success('Configuration Saved', 'Automated incident alerts and sentiment thresholds successfully updated.');
      setTimeout(() => setSaved(false), 3500);
    } catch (err) {
      toast.error('Save Failed', err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    if (isDemo) {
      setShowClearModal(false);
      toast.warning('Workspace Reset Locked', 'Workspace reset is disabled in demo mode to protect sample data for evaluators.');
      return;
    }
    setClearing(true);
    try {
      await api.clearDemoData();
      setShowClearModal(false);
      toast.success('Workspace Cleared', 'Workspace data successfully purged. Reloading...');
      setTimeout(() => {
        window.location.href = '/';
      }, 1200);
    } catch (err) {
      setShowClearModal(false);
      toast.error('Clear Failed', err.response?.data?.error || err.message);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 pb-16">
      
      {/* Confirmation Modal */}
      <ConfirmModal 
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearData}
        isDemo={isDemo}
        clearing={clearing}
      />

      {/* Header */}
      <div className="border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Workspace Configuration
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Platform Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure real-time automated incident thresholds, email dispatch destinations, and tenant data.
        </p>
      </div>

      {/* Demo Notice Banner */}
      {isDemo && (
        <div className="flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm text-slate-900 dark:text-white">Public Demo Mode Active</p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Platform threshold modifications and workspace data resets are read-only in demo mode to protect shared sample data for all recruiters and evaluators. You can still test all parameters and view configurations safely.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: Urgency & Threshold Rules */}
        <div className="saas-card rounded-3xl p-6 sm:p-7">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Automated Incident Alerting
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Determine which negative customer experiences trigger instant email dispatch.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Sentiment Polarity Trigger Cutoff
                </label>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/60">
                  {settings.alertThreshold}
                </span>
              </div>

              {/* Slider for cleaner UX */}
              <input 
                type="range"
                min="-1.0"
                max="0.0"
                step="0.05"
                value={settings.alertThreshold}
                onChange={(e) => setSettings({ ...settings, alertThreshold: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />

              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 font-mono">
                <span>-1.0 (Critical only)</span>
                <span>Default: -0.50</span>
                <span>0.0 (All negatives)</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                <span>
                  Negative feedback is assigned a continuous polarity score from <code className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">0.0</code> down to <code className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">-1.0</code> by the Logistic Regression classifier. Customer reviews below your configured threshold automatically dispatch an instant notification to your incident response team.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Dispatch Recipient */}
        <div className="saas-card rounded-3xl p-6 sm:p-7">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800/40 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Notification Recipient
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Designate the operational inbox where critical customer alerts are delivered.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  name="alertTo"
                  value={settings.alertTo || ''}
                  onChange={(e) => setSettings({ ...settings, alertTo: e.target.value })}
                  placeholder="product-lead@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Pulse uses the Resend API for zero-latency transactional delivery.
              </p>
            </div>
          </div>

          {/* Save Action */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {saved ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Check className="w-4 h-4" />
                <span>Configuration saved successfully</span>
              </span>
            ) : (
              <span className="text-xs text-slate-400">Remember to save after making adjustments</span>
            )}

            <button
              type="submit"
              disabled={loading || isDemo}
              title={isDemo ? "Settings modification is disabled in demo mode" : "Save configuration"}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : isDemo ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Save Disabled (Demo Mode)</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>

      {/* Section 3: Workspace Info & Danger Zone */}
      <div className="saas-card rounded-3xl p-6 sm:p-7 border-rose-200/60 dark:border-rose-950/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Workspace Reset & Purge
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
              Permanently wipe all reviews, CSV batches, and trend data associated with your active tenant ({tenantId}).
            </p>
          </div>

          <button
            type="button"
            disabled={isDemo}
            title={isDemo ? "Workspace purge is disabled in demo mode" : "Clear workspace data"}
            onClick={() => setShowClearModal(true)}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDemo ? <Lock className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
            <span>{isDemo ? "Purge Disabled (Demo Mode)" : "Clear Workspace Data"}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
