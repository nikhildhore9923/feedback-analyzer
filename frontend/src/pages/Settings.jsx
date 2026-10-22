import { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { 
  Building2, 
  Cpu, 
  Database, 
  Trash2, 
  CheckCircle2, 
  ShieldAlert, 
  Lock, 
  RefreshCw, 
  Sparkles, 
  Layers,
  Radio,
  Server,
  Activity,
  HardDrive
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
  const [clearing, setClearing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const tenantId = localStorage.getItem('pulse_tenant_id') || 'demo-tenant-123';
  const userEmail = localStorage.getItem('pulse_user_email') || 'admin@pulse.com';
  const isDemo = tenantId === 'demo-tenant-123' || tenantId === 'tenant_123' || userEmail === 'admin@pulse.com';

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
            System Architecture
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Platform Architecture & Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review tenant environment specifications, production ML models, database telemetry, and workspace controls.
        </p>
      </div>

      {/* Demo Notice Banner */}
      {isDemo && (
        <div className="flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm text-slate-900 dark:text-white">Shared Evaluator Sandbox Active</p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              You are signed in under the shared benchmark demonstration account. Core ML configurations, database connections, and evaluation telemetry are read-only to preserve consistent benchmarking for all reviewers.
            </p>
          </div>
        </div>
      )}

      {/* Section 1: Tenant & Organization Profile */}
      <div className="saas-card rounded-3xl p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Active Workspace Profile
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Identity, isolation boundaries, and security credentials.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-[#080C14] border border-slate-200/80 dark:border-slate-800/80 space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Active User Email
            </span>
            <div className="text-xs font-bold text-slate-900 dark:text-white font-mono">
              {userEmail}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-[#080C14] border border-slate-200/80 dark:border-slate-800/80 space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Tenant Isolation ID
            </span>
            <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
              {tenantId}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-[#080C14] border border-slate-200/80 dark:border-slate-800/80 space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Authorization Role
            </span>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Workspace Administrator
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-[#080C14] border border-slate-200/80 dark:border-slate-800/80 space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Deployment Tier
            </span>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Production (Vercel Serverless)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Machine Learning & NLP Pipeline Diagnostics */}
      <div className="saas-card rounded-3xl p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800/40 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              ML Inference Pipeline Architecture
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Specifications of the real-time sentiment classifier and generative synthesis engine.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-[#080C14] border border-slate-200/80 dark:border-slate-800/80 space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Primary NLP Model
              </span>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                TF-IDF + Logistic Reg.
              </div>
              <p className="text-[10px] text-slate-400">5,000 sublinear TF n-grams</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-[#080C14] border border-slate-200/80 dark:border-slate-800/80 space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Validated Benchmark
              </span>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                89.2% Accuracy
              </div>
              <p className="text-[10px] text-slate-400">14,133 verified deduplicated records</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-[#080C14] border border-slate-200/80 dark:border-slate-800/80 space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Generative Brief Engine
              </span>
              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                Groq Qwen 2.5 70B
              </div>
              <p className="text-[10px] text-slate-400">Ultra low-latency LPU synthesis</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Database & Cloud Infrastructure */}
      <div className="saas-card rounded-3xl p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Cloud Storage & Relational Infrastructure
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aiven Cloud MySQL managed instance details and connection pooling.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 dark:bg-[#080C14] border border-slate-200/80 dark:border-slate-800/80">
            <span>Database Engine:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">MySQL 8.0 (Aiven Cloud)</span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 dark:bg-[#080C14] border border-slate-200/80 dark:border-slate-800/80">
            <span>Timezone Synchronization:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">+00:00 (Strict UTC)</span>
          </div>
        </div>
      </div>

      {/* Section 4: Workspace Danger Zone */}
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
