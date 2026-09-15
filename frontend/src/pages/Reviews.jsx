import { useState, useEffect } from 'react'
import { api, exportReviewsToCsv } from '../api'

function ConfirmModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-[#111827] rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Feedback</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Are you sure you want to delete this feedback? This action cannot be undone.</p>
        </div>
        <div className="bg-gray-50 dark:bg-[#0B0F19] px-6 py-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md transition-colors">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors shadow-sm">Delete</button>
        </div>
      </div>
    </div>
  );
}

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const utcDate = new Date(timestamp);
  if (isNaN(utcDate.getTime())) return 'Invalid Date';
  
  const diff = Math.floor((Date.now() - utcDate.getTime()) / 1000);
  if (diff < 60) return `Just now`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return utcDate.toLocaleDateString();
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
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

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
    }
  }

  const handleDeleteClick = (id) => {
    setDeleteId(id)
  }

  const confirmDelete = async () => {
    if (!deleteId) return;
    
    // Optimistic UI Update
    const idToDelete = deleteId;
    const previousReviews = [...reviews];
    setReviews(reviews.filter(r => r.id !== idToDelete));
    setDeleteId(null);
    
    try {
      await api.deleteReview(idToDelete);
      setTimeout(() => fetchReviews(meta.page), 1000);
    } catch(err) {
      console.error(err)
      setReviews(previousReviews);
      alert("Failed to delete review");
    }
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchReviews(newPage)
    }
  }

  const handleExportAll = async () => {
    try {
      const res = await api.exportAllReviews();
      exportReviewsToCsv(res.data.data);
    } catch (err) {
      console.error(err);
      alert("Failed to export data");
    }
  }

  const totalPages = Math.ceil(meta.total / meta.limit)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <ConfirmModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={confirmDelete} 
      />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Feedback List</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Browse, filter, and manage all ingested customer feedback.</p>
        </div>
        <button 
          onClick={handleExportAll}
          className="px-4 py-2 bg-white dark:bg-[#111827] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
        >
          Export All CSV
        </button>
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
        {/* Filters */}
        <form onSubmit={handleSearchSubmit} className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#111827] flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] h-9 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <select
            value={batchType}
            onChange={(e) => setBatchType(e.target.value)}
            className="h-9 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Upload Types</option>
            <option value="csv">CSV Upload</option>
            <option value="manual">Manual Entry</option>
          </select>
          <select
            value={sentiment}
            onChange={(e) => setSentiment(e.target.value)}
            className="h-9 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Sentiments</option>
            <option value="Positive">Positive</option>
            <option value="Neutral">Neutral</option>
            <option value="Negative">Negative</option>
          </select>
          <select
            value={aspect}
            onChange={(e) => setAspect(e.target.value)}
            className="h-9 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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
            className="h-9 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Reviewing">Reviewing</option>
            <option value="Resolved">Resolved</option>
            <option value="Ignored">Ignored</option>
          </select>
          <button type="submit" className="h-9 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
            Filter
          </button>
        </form>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111827]">
                <th className="px-6 py-3 font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider w-full">Review Text</th>
                <th className="px-6 py-3 font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Intelligence</th>
                <th className="px-6 py-3 font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex justify-center items-center gap-2">
                       <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
                       Loading feedback...
                    </div>
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">No feedback found matching your criteria.</td>
                </tr>
              ) : (
                reviews.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 align-top">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-medium text-gray-700 dark:text-gray-300">#{r.id}</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" title={r.batch_label}>
                          {r.batch_type === 'csv' ? 'CSV' : 'Manual'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top max-w-sm whitespace-normal">
                      <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed line-clamp-3" title={r.review_text}>{r.review_text}</p>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">{timeAgo(r.timestamp)}</div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-col gap-2 items-start">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          r.sentiment === 'Positive' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30' :
                          r.sentiment === 'Negative' ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/30' :
                          'bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                        }`}>
                          {r.sentiment} ({(r.confidence * 100).toFixed(0)}%)
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
                          {r.aspect}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <select 
                        value={r.status}
                        onChange={(e) => handleStatusChange(r.id, e.target.value)}
                        className={`text-xs font-medium rounded-md py-1 pl-2 pr-6 border cursor-pointer focus:ring-0 ${
                          r.status === 'New' ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800/50 dark:bg-indigo-900/20 dark:text-indigo-400' :
                          r.status === 'Resolved' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-400' :
                          'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-400'
                        }`}
                      >
                        <option value="New">New</option>
                        <option value="Reviewing">Reviewing</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Ignored">Ignored</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right align-top">
                      <button 
                        onClick={() => handleDeleteClick(r.id)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium transition-colors"
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
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#111827]">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing <span className="font-medium text-gray-900 dark:text-white">{reviews.length > 0 ? (meta.page - 1) * meta.limit + 1 : 0}</span> to <span className="font-medium text-gray-900 dark:text-white">{Math.min(meta.page * meta.limit, meta.total)}</span> of <span className="font-medium text-gray-900 dark:text-white">{meta.total}</span> results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(meta.page - 1)}
              disabled={meta.page <= 1}
              className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(meta.page + 1)}
              disabled={meta.page >= totalPages}
              className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
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
