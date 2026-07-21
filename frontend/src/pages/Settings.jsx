import { useState, useEffect } from 'react'
import { api } from '../api'

function Settings() {
  const [threshold, setThreshold] = useState(-0.5)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getSettings().then((res) => {
      setThreshold(res.data.alertThreshold)
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    await api.updateSettings(threshold)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="panel">
      <h2 className="panel-title">Alert settings</h2>
      <p className="settings-description">
        Reviews with a sentiment polarity below this threshold automatically trigger an
        email alert to the manager. Polarity ranges from -1 (extremely negative) to
        0 (neutral).
      </p>

      {loading ? (
        <p className="empty-state">Loading…</p>
      ) : (
        <>
          <div className="settings-row">
            <label htmlFor="threshold">Alert threshold</label>
            <input
              id="threshold"
              type="range"
              min="-1"
              max="0"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
            />
            <span className="threshold-value">{threshold.toFixed(2)}</span>
          </div>

          <p className="settings-hint">
            {threshold >= -0.2
              ? 'Very sensitive — most negative reviews will trigger alerts.'
              : threshold <= -0.8
              ? 'Very strict — only extremely negative reviews will trigger alerts.'
              : 'Balanced — clearly negative reviews will trigger alerts.'}
          </p>

          <button className="btn btn-primary" onClick={handleSave}>
            {saved ? 'Saved ✓' : 'Save threshold'}
          </button>
        </>
      )}
    </div>
  )
}

export default Settings
