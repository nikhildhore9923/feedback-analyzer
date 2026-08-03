import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

const SENTIMENT_COLORS = {
  Positive: 'var(--positive)',
  Negative: 'var(--negative)',
  Neutral: 'var(--neutral)',
}

function timeAgo(timestamp) {
  // SQLite's CURRENT_TIMESTAMP returns UTC time but without a timezone marker
  // (e.g. "2026-08-03 06:48:52"). Without the "Z", JavaScript wrongly assumes
  // it's already local time, causing wildly wrong "time ago" values. Adding
  // the "Z" tells JS this is UTC, so it converts to the viewer's local time correctly.
  const utcTimestamp = timestamp.replace(' ', 'T') + 'Z'
  const diff = Math.floor((Date.now() - new Date(utcTimestamp)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(utcTimestamp).toLocaleDateString()
}

function Dashboard() {
  const [text, setText] = useState('')
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState(null)

  const fetchData = async () => {
    const [reviewsRes, statsRes] = await Promise.all([api.getReviews(), api.getStats()])
    setReviews(reviewsRes.data)
    setStats(statsRes.data)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setLoading(true)
    try {
      await api.submitReview(text)
      setText('')
      await fetchData()
    } catch (err) {
      alert('Could not reach the analysis service. Is the Python server running on port 5001?')
    }
    setLoading(false)
  }

  const handleBulkUpload = async () => {
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    setLoading(true)
    try {
      await api.uploadCsv(formData)
      setFile(null)
      await fetchData()
    } catch (err) {
      alert('Bulk upload failed. Check the CSV has a "review" column.')
    }
    setLoading(false)
  }

  const total = reviews.length
  const countFor = (label) => stats.find((s) => s.sentiment === label)?.count || 0
  const positive = countFor('Positive')
  const negative = countFor('Negative')
  const neutral = countFor('Neutral')
  const netScore = total > 0 ? Math.round(((positive - negative) / total) * 100) : 0
  const urgentCount = reviews.filter((r) => r.alert_sent).length

  const aspectCounts = reviews.reduce((acc, r) => {
    acc[r.aspect] = (acc[r.aspect] || 0) + 1
    return acc
  }, {})
  const maxAspectCount = Math.max(1, ...Object.values(aspectCounts))
  const recentReviews = reviews.slice(0, 5)

  return (
    <>
      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-label">Reviews analyzed</div>
          <div className="stat-value">{total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Net sentiment score</div>
          <div className={`stat-value ${netScore < 0 ? 'negative' : 'positive'}`}>
            {netScore > 0 ? '+' : ''}{netScore}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Urgent alerts sent</div>
          <div className={`stat-value ${urgentCount > 0 ? 'negative' : ''}`}>{urgentCount}</div>
        </div>
      </div>

      <div className="panel console">
        <h2 className="panel-title">Submit a review</h2>
        <form onSubmit={handleSubmit}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste a customer review here..."
            rows={3}
          />
          <div className="console-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Analyzing…' : 'Analyze review'}
            </button>
            <div className="file-row">
              <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} />
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleBulkUpload}
                disabled={!file || loading}
              >
                Upload CSV
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="panel">
        <h2 className="panel-title">Sentiment signal</h2>
        {total === 0 ? (
          <p className="empty-state">No reviews yet — submit one above to see the signal.</p>
        ) : (
          <>
            <div className="signal-bar">
              <div
                className="signal-segment"
                style={{ width: `${(positive / total) * 100}%`, background: SENTIMENT_COLORS.Positive }}
              />
              <div
                className="signal-segment"
                style={{ width: `${(neutral / total) * 100}%`, background: SENTIMENT_COLORS.Neutral }}
              />
              <div
                className="signal-segment"
                style={{ width: `${(negative / total) * 100}%`, background: SENTIMENT_COLORS.Negative }}
              />
            </div>
            <div className="signal-legend">
              <span className="legend-item">
                <span className="legend-swatch" style={{ background: SENTIMENT_COLORS.Positive }} />
                Positive {positive} ({total ? Math.round((positive / total) * 100) : 0}%)
              </span>
              <span className="legend-item">
                <span className="legend-swatch" style={{ background: SENTIMENT_COLORS.Neutral }} />
                Neutral {neutral} ({total ? Math.round((neutral / total) * 100) : 0}%)
              </span>
              <span className="legend-item">
                <span className="legend-swatch" style={{ background: SENTIMENT_COLORS.Negative }} />
                Negative {negative} ({total ? Math.round((negative / total) * 100) : 0}%)
              </span>
            </div>
          </>
        )}
      </div>

      {Object.keys(aspectCounts).length > 0 && (
        <div className="panel">
          <h2 className="panel-title">Breakdown by category</h2>
          {Object.entries(aspectCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([aspect, count]) => (
              <div className="aspect-row" key={aspect}>
                <span>{aspect}</span>
                <div className="aspect-track">
                  <div className="aspect-fill" style={{ width: `${(count / maxAspectCount) * 100}%` }} />
                </div>
                <span className="aspect-count">{count}</span>
              </div>
            ))}
        </div>
      )}

      <div className="panel">
        <div className="panel-header-row">
          <h2 className="panel-title">Recent activity</h2>
          {reviews.length > 5 && <Link to="/reviews" className="link-quiet">View all {reviews.length} →</Link>}
        </div>
        {recentReviews.length === 0 ? (
          <p className="empty-state">Nothing here yet.</p>
        ) : (
          recentReviews.map((r) => (
            <div key={r.id} className={`log-entry sentiment-${r.sentiment}`}>
              <div>
                <div className="log-text">{r.review_text}</div>
                <div className="log-meta">
                  <span className={`tag sentiment-${r.sentiment}`}>{r.sentiment}</span>
                  <span>{r.aspect}</span>
                  {!!r.alert_sent && <span className="alert-badge">ALERT SENT</span>}
                </div>
              </div>
              <span className="log-time">{timeAgo(r.timestamp)}</span>
            </div>
          ))
        )}
      </div>
    </>
  )
}

export default Dashboard