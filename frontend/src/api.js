import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'

// Generate or retrieve tenant ID for isolation
let tenantId = localStorage.getItem('pulse_tenant_id');
if (!tenantId) {
  tenantId = crypto.randomUUID ? crypto.randomUUID() : 'tenant_' + Math.random().toString(36).substring(2, 15);
  localStorage.setItem('pulse_tenant_id', tenantId);
}

// Add interceptor
axios.interceptors.request.use((config) => {
  if (config.headers && typeof config.headers.set === 'function') {
    config.headers.set('X-Tenant-ID', tenantId);
  } else {
    config.headers['X-Tenant-ID'] = tenantId;
  }
  return config;
});

export const api = {
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
