import { useState, useEffect } from 'react'
import { api } from '../api'

function ConfirmModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-[#111827] rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Clear Workspace Data</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Are you sure you want to delete all feedback and batches? This action cannot be undone.</p>
        </div>
        <div className="bg-gray-50 dark:bg-[#0B0F19] px-6 py-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md transition-colors">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors shadow-sm">Delete All Data</button>
        </div>
      </div>
    </div>
  );
}

function Settings() {
  const [settings, setSettings] = useState({
    alertThreshold: -0.5,
    alertTo: ''
  })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showClearModal, setShowClearModal] = useState(false)

  useEffect(() => {
    api.getSettings().then((res) => {
      setSettings(res.data)
    })
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.updateSettings(settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      alert("Failed to save settings")
    }
    setLoading(false)
  }

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value })
  }

  const handleClearData = async () => {
    try {
      await api.clearDemoData();
      alert("Workspace reset successfully!");
      window.location.reload();
    } catch (err) {
      alert("Failed to reset workspace");
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <ConfirmModal 
        isOpen={showClearModal} 
        onClose={() => setShowClearModal(false)} 
        onConfirm={handleClearData} 
      />
      
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure your feedback intelligence platform and alerts.</p>
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
        <form onSubmit={handleSave} className="divide-y divide-gray-100 dark:divide-gray-800">
          
          {/* Threshold config */}
          <div className="p-5 md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1 mb-3 md:mb-0">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Smart Alerts</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Configure the automated severity threshold for negative feedback alerts.
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Negative Polarity Threshold (0 to -1)
              </label>
              <input
                type="number"
                step="0.01"
                max="0"
                min="-1"
                name="alertThreshold"
                value={settings.alertThreshold}
                onChange={handleChange}
                className="w-full max-w-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-lg">
                When a negative review's confidence multiplier implies a severity score below this threshold (e.g. -0.80), an urgent email alert will be asynchronously dispatched via the Resend API.
              </p>
            </div>
          </div>

          {/* Email config */}
          <div className="p-5 md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1 mb-3 md:mb-0">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Email Notifications</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Set where critical alerts should be delivered.
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Recipient Email Address
              </label>
              <input
                type="email"
                name="alertTo"
                placeholder="manager@company.com"
                value={settings.alertTo}
                onChange={handleChange}
                className="w-full max-w-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 max-w-lg">
                Note: To send to an unverified email on the Resend free tier, you must use your signed-up developer email address.
              </p>
            </div>
          </div>

          <div className="p-5 bg-gray-50/50 dark:bg-[#0B0F19] flex items-center justify-end">
            <div className="flex items-center gap-3">
              {saved && <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Saved successfully!</span>}
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-lg border border-red-200 dark:border-red-900/50 shadow-sm overflow-hidden mt-8">
        <div className="p-5 md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1 mb-3 md:mb-0">
            <h2 className="text-base font-semibold text-red-700 dark:text-red-400">Danger Zone</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Irreversible actions for your workspace.
            </p>
          </div>
          <div className="md:col-span-2 flex items-center justify-end">
            <button
              onClick={() => setShowClearModal(true)}
              className="px-4 py-2 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-md text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              Clear Workspace Data
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Settings
