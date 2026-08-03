import { useState, useEffect, useCallback } from 'react'
import { api, exportReviewsToCsv } from '../api'

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

function Reviews() {
  const [reviews, setReviews] = useState([])
  const [batches, setBatches] = useState([])
  const [search, setSearch] = useState('')
  const [sentimentFilter, setSentimentFilter] = useState('')
  const [aspectFilter, setAspectFilter] = useState('')
  const [batchFilter, setBatchFilter] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    const filters = {}
    if (search.trim()) filters.search = search.trim()
    if (sentimentFilter) filters.sentiment = sentimentFilter
    if (aspectFilter) filters.aspect = aspectFilter
    if (batchFilter) filters.batch_id = batchFilter

    const res = await api.getReviews(filters)
    setReviews(res.data)
    setLoading(false)
  }, [search, sentimentFilter, aspectFilter, batchFilter])

  useEffect(() => {
    api.getBatches().then((res) => setBatches(res.data))
  }, [])

  // Debounce search so we don't hit the API on every keystroke
  useEffect(() => {
    const timeout = setTimeout(fetchReviews, 300)
    return () => clearTimeout(timeout)
  }, [fetchReviews])

  const handleDelete = async (id) => {
    if (!confirm('Delete this review permanently?')) return
    await api.deleteReview(id)
    setReviews((prev) => prev.filter((r) => r.id !== id))
  }

  const aspects = [...new Set(reviews.map((r) => r.aspect))]
  const activeBatch = batches.find((b) => String(b.id) === String(batchFilter))

  return (
    <>
      {batches.length > 0 && (
        <div className="panel">
          <h2 className="panel-title">Upload history</h2>
          <div className="batch-pills">
            <button
              className={`batch-pill ${!batchFilter ? 'active' : ''}`}
              onClick={() => setBatchFilter('')}
            >
              All history
            </button>
            {batches.map((b) => (
              <button
                key={b.id}
                className={`batch-pill ${String(batchFilter) === String(b.id) ? 'active' : ''}`}
                onClick={() => setBatchFilter(String(b.id))}
                title={new Date(b.created_at.replace(' ', 'T') + 'Z').toLocaleString()}
              >
                {b.type === 'csv' ? '📄' : '✏️'} {b.label} · {b.review_count}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="panel">
        <h2 className="panel-title">
          {activeBatch ? `Filtering: ${activeBatch.label}` : 'All reviews'}
        </h2>
        <div className="filter-row">
          <input
            type="text"
            className="filter-input"
            placeholder="Search review text…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={sentimentFilter} onChange={(e) => setSentimentFilter(e.target.value)}>
            <option value="">All sentiments</option>
            <option value="Positive">Positive</option>
            <option value="Neutral">Neutral</option>
            <option value="Negative">Negative</option>
          </select>
          <select value={aspectFilter} onChange={(e) => setAspectFilter(e.target.value)}>
            <option value="">All categories</option>
            {aspects.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button
            className="btn btn-ghost"
            onClick={() => exportReviewsToCsv(reviews)}
            disabled={reviews.length === 0}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="panel">
        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : reviews.length === 0 ? (
          <p className="empty-state">No reviews match these filters.</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className={`log-entry sentiment-${r.sentiment}`}>
              <div>
                <div className="log-text">{r.review_text}</div>
                <div className="log-meta">
                  <span className={`tag sentiment-${r.sentiment}`}>{r.sentiment}</span>
                  <span>{r.aspect}</span>
                  {!!r.alert_sent && <span className="alert-badge">ALERT SENT</span>}
                </div>
              </div>
              <div className="log-actions">
                <span className="log-time">{timeAgo(r.timestamp)}</span>
                <button className="btn-icon" onClick={() => handleDelete(r.id)} title="Delete review">
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}

export default Reviews