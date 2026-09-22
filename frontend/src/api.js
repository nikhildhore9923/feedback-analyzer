import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'

// No longer generating static UUID, relying entirely on JWT auth

// Add interceptor
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('pulse_jwt_token');
  if (token) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

export const api = {
  signup: (email, password) => axios.post(`${API_BASE}/signup`, { email, password }),
  login: (email, password) => axios.post(`${API_BASE}/login`, { email, password }),
  getReviews: (filters = {}) => axios.get(`${API_BASE}/reviews`, { params: filters }),
  exportAllReviews: () => axios.get(`${API_BASE}/reviews`, { params: { limit: 10000 } }),
  getStats: () => axios.get(`${API_BASE}/stats`),
  getBatches: () => axios.get(`${API_BASE}/batches`),
  submitReview: (text) => axios.post(`${API_BASE}/reviews`, { text }),
  deleteReview: (id) => axios.delete(`${API_BASE}/reviews/${id}`),
  uploadCsv: (formData) => axios.post(`${API_BASE}/reviews/bulk`, formData),
  getSettings: () => axios.get(`${API_BASE}/settings`),
  updateSettings: (settings) => axios.post(`${API_BASE}/settings`, settings),
  updateStatus: (id, status) => axios.patch(`${API_BASE}/reviews/${id}/status`, { status }),
  clearDemoData: () => axios.delete(`${API_BASE}/settings/clear`),
  getAnalyticsTrends: (days) => axios.get(`${API_BASE}/analytics/trends`, { params: { days } }),
  generateSummary: (reviews) => axios.post(`${API_BASE}/analytics/summary`, { reviews }),
}

export function exportReviewsToCsv(reviews) {
  const header = 'id,review_text,sentiment,confidence,severity,aspect,status,upload_type,batch_label,alert_sent,timestamp\n'
  const rows = reviews
    .map((r) =>
      [r.id, `"${r.review_text.replace(/"/g, '""')}"`, r.sentiment, r.confidence, r.severity, r.aspect, r.status, r.batch_type, `"${r.batch_label || ''}"`, r.alert_sent, r.timestamp].join(',')
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
