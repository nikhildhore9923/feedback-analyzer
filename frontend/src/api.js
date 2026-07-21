import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'

export const api = {
  getReviews: (filters = {}) => axios.get(`${API_BASE}/reviews`, { params: filters }),
  getStats: () => axios.get(`${API_BASE}/stats`),
  getBatches: () => axios.get(`${API_BASE}/batches`),
  submitReview: (text) => axios.post(`${API_BASE}/reviews`, { text }),
  deleteReview: (id) => axios.delete(`${API_BASE}/reviews/${id}`),
  uploadCsv: (formData) => axios.post(`${API_BASE}/reviews/bulk`, formData),
  getSettings: () => axios.get(`${API_BASE}/settings`),
  updateSettings: (alertThreshold) => axios.post(`${API_BASE}/settings`, { alertThreshold }),
}

export function exportReviewsToCsv(reviews) {
  const header = 'id,review_text,sentiment,polarity,aspect,alert_sent,timestamp\n'
  const rows = reviews
    .map((r) =>
      [r.id, `"${r.review_text.replace(/"/g, '""')}"`, r.sentiment, r.polarity, r.aspect, r.alert_sent, r.timestamp].join(',')
    )
    .join('\n')

  const blob = new Blob([header + rows], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `feedback-export-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
