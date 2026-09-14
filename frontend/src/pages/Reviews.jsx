import { useState, useEffect } from 'react'
import { api, exportReviewsToCsv } from '../api'

function ConfirmModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Feedback</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Are you sure you want to delete this feedback? This action cannot be undone.</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-sm">Delete</button>
        </div>
      </div>
    </div>
  );
}

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const utcDate = new Date(timestamp);
  if (isNaN(utcDate.getTime())) return 'Invalid Date';
  return utcDate.toLocaleString();
}

function Reviews() {
  const [reviews, setReviews] = useState([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10 })
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  // Filters
  const [search, setSearch] = useState('')
  const [sentiment, setSentiment] = useState('')
  const [aspect, setAspect] = useState('')
  const [status, setStatus] = useState('')
  const [batchType, setBatchType] = useState('')

  const fetchReviews = async (page = 1) => {
    setLoading(true)
    try {
      const filters = { page, limit: 10 }
      if (search) filters.search = search
      if (sentiment) filters.sentiment = sentiment
      if (aspect) filters.aspect = aspect
      if (status) filters.status = status
      if (batchType) filters.batch_type = batchType

      const res = await api.getReviews(filters)
      setReviews(res.data.data)
      setMeta(res.data.meta)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchReviews()
  }, [sentiment, aspect, status, batchType])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchReviews(1)
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.updateStatus(id, newStatus)
      setReviews(reviews.map(r => r.id === id ? { ...r, status: newStatus } : r))
    } catch (err) {
      console.error(err)
      alert("Failed to update status")
    }
  }

  const handleDeleteClick = (id) => {
    setDeleteId(id)
  }

  const confirmDelete = async () => {
    if (!deleteId) return;
    
    // Optimistic UI Update - instantly remove from screen
    const idToDelete = deleteId;
    const previousReviews = [...reviews];
    setReviews(reviews.filter(r => r.id !== idToDelete));
    setDeleteId(null);
    
    try {
      await api.deleteReview(idToDelete);
      // Wait a moment and quietly sync meta in background
      setTimeout(() => fetchReviews(meta.page), 1000);
    } catch(err) {
      console.error(err)
      // Revert if failed
      setReviews(previousReviews);
      alert("Failed to delete review");
    }
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= Math.ceil(meta.total / meta.limit)) {
      fetchReviews(newPage)
    }
  }

  const handleExport = () => {
    exportReviewsToCsv(reviews)
  }

  const handleExportAll = async () => {
    try {
      const res = await api.exportAllReviews();
      exportReviewsToCsv(res.data.data);
    } catch (err) {
      console.error(err);
      alert("Failed to export all reviews");
    }
  }

  const totalPages = Math.ceil(meta.total / meta.limit)

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <ConfirmModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={confirmDelete} 
      />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Feedback List</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage and respond to customer reviews.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Export Page
          </button>
          <button
            onClick={handleExportAll}
            className="px-4 py-2 bg-indigo-600 text-white border border-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm"
          >
            Export All
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-all duration-300 dark:bg-[#111827] dark:border-gray-800">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search feedback..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 text-sm"
            />
          </div>
          <select
            value={batchType}
            onChange={(e) => setBatchType(e.target.value)}
            className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 border p-2 text-sm"
          >
            <option value="">All Upload Types</option>
            <option value="manual">Manual Entry</option>
            <option value="csv">Bulk CSV Upload</option>
          </select>
          <select
            value={sentiment}
            onChange={(e) => setSentiment(e.target.value)}
            className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 border p-2 text-sm"
          >
            <option value="">All Sentiments</option>
            <option value="Positive">Positive</option>
            <option value="Neutral">Neutral</option>
            <option value="Negative">Negative</option>
          </select>
          <select
            value={aspect}
            onChange={(e) => setAspect(e.target.value)}
            className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 border p-2 text-sm"
          >
            <option value="">All Categories</option>
            <option value="Product Quality">Product Quality</option>
            <option value="Customer Service">Customer Service</option>
            <option value="Delivery">Delivery</option>
            <option value="Pricing">Pricing</option>
            <option value="App/Website">App/Website</option>
            <option value="General">General</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 border p-2 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Reviewing">Reviewing</option>
            <option value="Resolved">Resolved</option>
            <option value="Ignored">Ignored</option>
          </select>
          <button type="submit" className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600">
            Search
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-sm">
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 rounded-tl-lg">Source</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Review Text</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Intelligence</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500 dark:text-gray-400">No feedback found.</td>
                </tr>
              ) : (
                reviews.map(r => (
                  <tr key={r.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                    <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-gray-700 dark:text-gray-300">#{r.id}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 w-max" title={r.batch_label}>
                          {r.batch_type === 'csv' ? '📄 CSV' : '✍️ Manual'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-800 dark:text-gray-200 max-w-md">
                      <p className="line-clamp-3" title={r.review_text}>{r.review_text}</p>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">{timeAgo(r.timestamp)}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-block px-2 py-1 text-xs rounded-md font-medium w-max ${
                          r.sentiment === 'Positive' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                          r.sentiment === 'Negative' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {r.sentiment} ({(r.confidence * 100).toFixed(0)}%)
                        </span>
                        <span className="inline-block px-2 py-1 text-xs rounded-md font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 w-max">
                          {r.aspect}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <select 
                        value={r.status}
                        onChange={(e) => handleStatusChange(r.id, e.target.value)}
                        className={`text-xs font-medium rounded-md p-1 border cursor-pointer ${
                          r.status === 'New' ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' :
                          r.status === 'Resolved' ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}
                      >
                        <option value="New">New</option>
                        <option value="Reviewing">Reviewing</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Ignored">Ignored</option>
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDeleteClick(r.id)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing <span className="font-medium text-gray-900 dark:text-white">{reviews.length > 0 ? (meta.page - 1) * meta.limit + 1 : 0}</span> to <span className="font-medium text-gray-900 dark:text-white">{Math.min(meta.page * meta.limit, meta.total)}</span> of <span className="font-medium text-gray-900 dark:text-white">{meta.total}</span> results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(meta.page - 1)}
              disabled={meta.page <= 1}
              className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(meta.page + 1)}
              disabled={meta.page >= totalPages}
              className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reviews
