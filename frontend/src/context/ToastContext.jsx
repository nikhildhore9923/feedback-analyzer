import { createContext, useContext, useState, useCallback } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  X,
  ShieldAlert
} from 'lucide-react';

const ToastContext = createContext(null);

function ToastItem({ toast, onDismiss }) {
  const { type = 'info', title, message } = toast;

  const config = {
    success: {
      border: 'border-emerald-200/90 dark:border-emerald-800/60',
      bg: 'bg-white dark:bg-[#12151E]',
      accentBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      iconBox: 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400',
      badge: 'text-emerald-700 dark:text-emerald-400',
      icon: CheckCircle2,
      defaultTitle: 'Success'
    },
    error: {
      border: 'border-rose-200/90 dark:border-rose-800/60',
      bg: 'bg-white dark:bg-[#12151E]',
      accentBg: 'bg-rose-500/10 dark:bg-rose-500/15',
      iconBox: 'bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400',
      badge: 'text-rose-700 dark:text-rose-400',
      icon: AlertCircle,
      defaultTitle: 'Error'
    },
    warning: {
      border: 'border-amber-200/90 dark:border-amber-800/60',
      bg: 'bg-white dark:bg-[#12151E]',
      accentBg: 'bg-amber-500/10 dark:bg-amber-500/15',
      iconBox: 'bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400',
      badge: 'text-amber-700 dark:text-amber-400',
      icon: ShieldAlert,
      defaultTitle: 'Notice'
    },
    info: {
      border: 'border-indigo-200/90 dark:border-indigo-800/60',
      bg: 'bg-white dark:bg-[#12151E]',
      accentBg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
      iconBox: 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400',
      badge: 'text-indigo-700 dark:text-indigo-400',
      icon: Info,
      defaultTitle: 'Information'
    }
  }[type] || {
    border: 'border-slate-200 dark:border-slate-800',
    bg: 'bg-white dark:bg-[#12151E]',
    accentBg: '',
    iconBox: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
    badge: 'text-slate-600 dark:text-slate-400',
    icon: Info,
    defaultTitle: 'Notification'
  };

  const IconComponent = config.icon;

  return (
    <div 
      role="alert"
      className={`pointer-events-auto w-full p-4 rounded-2xl shadow-2xl border ${config.border} ${config.bg} backdrop-blur-md flex items-start gap-3 transition-all duration-300 animate-in slide-in-from-top-3 fade-in`}
    >
      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${config.iconBox}`}>
        <IconComponent className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
          {title || config.defaultTitle}
        </h4>
        {message && (
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
            {message}
          </p>
        )}
      </div>

      <button
        onClick={onDismiss}
        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors shrink-0"
        title="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ type = 'info', title, message, duration = 4500 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const toast = {
    success: (title, message, duration) => addToast({ type: 'success', title, message, duration }),
    error: (title, message, duration) => addToast({ type: 'error', title, message, duration }),
    warning: (title, message, duration) => addToast({ type: 'warning', title, message, duration }),
    info: (title, message, duration) => addToast({ type: 'info', title, message, duration }),
    dismiss: removeToast,
  };

  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast }}>
      {children}
      
      {/* Toast Viewport Container */}
      <div 
        aria-live="polite" 
        className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx.toast;
}
