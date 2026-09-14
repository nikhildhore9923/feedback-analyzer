import { useState, useEffect } from 'react'
import { api } from '../api'

function Settings() {
  const [settings, setSettings] = useState({
    alertThreshold: -0.5,
    emailUser: '',
    emailPass: '',
    alertTo: ''
  })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

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

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Configure your feedback intelligence platform.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <form onSubmit={handleSave} className="space-y-8">
          
          {/* Threshold config */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Smart Alerts Configuration</h2>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Negative Polarity Alert Threshold (0 to -1)
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              When a negative review's confidence/severity implies a polarity score below this threshold, an urgent email alert will be sent.
            </p>
            <input
              type="number"
              step="0.01"
              max="0"
              min="-1"
              name="alertThreshold"
              value={settings.alertThreshold}
              onChange={handleChange}
              className="w-full md:w-1/2 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
            />
          </div>

          <hr className="border-gray-100 dark:border-gray-700" />

          {/* Email config */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Email Notifications (SMTP)</h2>
            <div className="space-y-4 md:w-2/3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sender Gmail Address</label>
                <input
                  type="email"
                  name="emailUser"
                  placeholder="your-email@gmail.com"
                  value={settings.emailUser}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gmail App Password</label>
                <input
                  type="password"
                  name="emailPass"
                  placeholder="16-character-app-password"
                  value={settings.emailPass}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Requires 2-Factor Auth enabled on your Google Account.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alert Recipient Address</label>
                <input
                  type="email"
                  name="alertTo"
                  placeholder="manager@company.com"
                  value={settings.alertTo}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-all duration-300 active:scale-95 shadow-md shadow-purple-500/20 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
            {saved && <span className="text-sm font-medium text-green-600 dark:text-green-400">Settings saved successfully!</span>}
          </div>
        </form>
      </div>
    </div>
  )
}

export default Settings
