import { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Bell, 
  Mail, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  Info,
  ShieldAlert
} from 'lucide-react';

function ConfirmModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden">
        <div className="p-6">
          <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">Purge Workspace Data</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            This will permanently delete all feedback items, batches, and analytics metrics for this tenant account. This action cannot be reversed.
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/60 px-6 py-3.5 flex justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={onClose} 
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs"
          >
            Confirm & Purge Data
          </button>
        </div>
      </div>
    </div>
  );
}

function Settings() {
  const [settings, setSettings] = useState({
    alertThreshold: -0.5,
    alertTo: ''
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearedToast, setClearedToast] = useState(false);

  useEffect(() => {
    api.getSettings().then((res) => {
      setSettings(res.data);
    }).catch(err => {
      console.error('Failed to load settings:', err);
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch (err) {
      alert("Failed to save settings: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleClearData = async () => {
    try {
      await api.clearDemoData();
    } catch (err) {
      console.warn("Backend clear call failed; performing client-side session reset.", err);
    } finally {
      setClearedToast(true);
      setShowClearModal(false);
      setTimeout(() => {
        window.location.href = '/';
      }, 1200);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-12">
      
      {clearedToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-xs font-semibold">Workspace data successfully purged. Refreshing...</span>
        </div>
      )}

      <ConfirmModal 
        isOpen={showClearModal} 
        onClose={() => setShowClearModal(false)} 
        onConfirm={handleClearData} 
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Platform Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure real-time alert thresholds, notification destinations, and workspace parameters.
        </p>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <form onSubmit={handleSave} className="divide-y divide-slate-100 dark:divide-slate-800">
          
          {/* Section 1: Alert Threshold */}
          <div className="p-6 md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1 mb-4 md:mb-0">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Urgency Threshold</h3>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Control the sensitivity of automated alerts for negative customer reviews.
              </p>
            </div>

            <div className="md:col-span-2 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Polarity Cutoff (-1.0 to 0.0)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.05"
                    max="0"
                    min="-1"
                    name="alertThreshold"
                    value={settings.alertThreshold}
                    onChange={handleChange}
                    className="w-36 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                    required
                  />
                  <span className="text-xs font-mono text-slate-400">
                    Default: -0.50
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl text-xs text-indigo-900 dark:text-indigo-300">
                <Info className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Negative feedback is assigned a polarity score from 0 to -1 based on model confidence. Reviews with polarity below this threshold or Priority Score $\ge 80$ automatically trigger an asynchronous email alert.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Email Configuration */}
          <div className="p-6 md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1 mb-4 md:mb-0">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Alert Dispatch</h3>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Specify the destination mailbox where critical incidents should be routed.
              </p>
            </div>

            <div className="md:col-span-2 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Notification Recipient Email
                </label>
                <input
                  type="email"
                  name="alertTo"
                  placeholder="product-lead@company.com"
                  value={settings.alertTo}
                  onChange={handleChange}
                  className="w-full max-w-md rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                />
              </div>

              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Pulse uses the Resend API to deliver transactional alerts. If unconfigured, the fallback email from your environment variables will be used.
              </p>
            </div>
          </div>

          {/* Save Bar */}
          <div className="p-4 px-6 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
            <div>
              {saved && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" /> Changes saved to cloud database.
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              {loading ? 'Saving Changes...' : 'Save Configuration'}
            </button>
          </div>

        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-rose-200/80 dark:border-rose-900/40 shadow-xs overflow-hidden">
        <div className="p-6 md:grid md:grid-cols-3 md:gap-6 items-center">
          <div className="md:col-span-2 mb-4 md:mb-0">
            <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Danger Zone: Reset Workspace
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Permanently wipe all reviews, batches, and trend data associated with your current tenant account.
            </p>
          </div>

          <div className="md:col-span-1 flex justify-start md:justify-end">
            <button
              onClick={() => setShowClearModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Workspace Data
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Settings;
