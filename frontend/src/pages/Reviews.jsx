import { useState, useEffect } from 'react';
import { api, exportReviewsToCsv } from '../api';
import { 
  Search, 
  Download, 
  Trash2, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

function ConfirmModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden">
        <div className="p-6">
          <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">Delete Feedback Entry</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Are you sure you want to permanently delete this review? This action cannot be reversed.
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/60 px-6 py-3.5 flex justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={onClose} 
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs"
          >
            Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
}

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const utcDate = new Date(timestamp);
  if (isNaN(utcDate.getTime())) return 'Recently';
  
  const diff = Math.floor((Date.now() - utcDate.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return utcDate.toLocaleDateString();
}

function getPriorityInfo(score) {
  if (score >= 80) return { label: 'Critical', colors: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50' };
  if (score >= 60) return { label: 'High', colors: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50' };
  if (score >= 40) return { label: 'Medium', colors: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-900/50' };
  return { label: 'Low', colors: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' };
}

function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedSentiments, setSelectedSentiments] = useState([]);
  const [selectedAspects, setSelectedAspects] = useState([]);
  const [status, setStatus] = useState('');
  const [batchType, setBatchType] = useState('');
  const [priority, setPriority] = useState('');

  const fetchReviews = async (page = 1) => {
    setLoading(true);
    try {
      const filters = { page, limit: 10 };
      if (search.trim()) filters.search = search.trim();
      if (selectedSentiments.length > 0) filters.sentiments = selectedSentiments.join(',');
      if (selectedAspects.length > 0) filters.aspects = selectedAspects.join(',');
      if (status) filters.status = status;
      if (batchType) filters.batch_type = batchType;
      if (priority) filters.priority = priority;

      const res = await api.getReviews(filters);
      setReviews(res.data.data || []);
      setMeta(res.data.meta || { total: 0, page, limit: 10 });
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(1);
  }, [selectedSentiments, selectedAspects, status, batchType, priority]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReviews(1);
  };

  const toggleArrayItem = (array, setArray, item) => {
    if (array.includes(item)) {
      setArray(array.filter(i => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.updateStatus(id, newStatus);
      setReviews(reviews.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update review status.');
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    
    const idToDelete = deleteId;
    const previousReviews = [...reviews];
    setReviews(reviews.filter(r => r.id !== idToDelete));
    setDeleteId(null);
    
    try {
      await api.deleteReview(idToDelete);
      fetchReviews(meta.page);
    } catch (err) {
      console.error(err);
      setReviews(previousReviews);
      alert("Failed to delete review.");
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchReviews(newPage);
    }
  };

  const handleExportAll = async () => {
    try {
      const res = await api.exportAllReviews();
      exportReviewsToCsv(res.data.data);
    } catch (err) {
      console.error(err);
      alert("Failed to export all reviews.");
    }
  };

  const handleExportFiltered = () => {
    if (reviews.length === 0) return alert("No reviews match current filter view.");
    exportReviewsToCsv(reviews);
  };

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-12 flex flex-col">
      <ConfirmModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={confirmDelete} 
      />

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Feedback Stream
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Filter, triage, and manage customer sentiment and resolution statuses.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            onClick={handleExportFiltered}
            className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            Export View (.csv)
          </button>
          <button 
            onClick={handleExportAll}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export All Data
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col flex-1">
        
        {/* Search & Select Filters */}
        <form onSubmit={handleSearchSubmit} className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
          <div className="flex flex-wrap gap-2.5 items-center">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search feedback text..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
              />
            </div>

            {/* Upload Type Filter */}
            <select
              value={batchType}
              onChange={(e) => setBatchType(e.target.value)}
              className="h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
            >
              <option value="">All Ingestion Types</option>
              <option value="csv">CSV Batch</option>
              <option value="manual">Manual Entry</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
            >
              <option value="">All Priorities</option>
              <option value="Critical">Critical (&ge; 80)</option>
              <option value="High">High (60-79)</option>
              <option value="Medium">Medium (40-59)</option>
              <option value="Low">Low (&lt; 40)</option>
            </select>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
            >
              <option value="">All Ticket Statuses</option>
              <option value="New">New</option>
              <option value="Reviewing">Reviewing</option>
              <option value="Resolved">Resolved</option>
              <option value="Ignored">Ignored</option>
            </select>

            <button 
              type="submit" 
              className="h-9 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-xs"
            >
              Apply Filter
            </button>
          </div>

          {/* Sentiment & Aspect Pills */}
          <div className="flex flex-wrap gap-4 items-center pt-3 border-t border-slate-200/60 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-slate-500 dark:text-slate-400 mr-1">Sentiment:</span>
              {['Positive', 'Neutral', 'Negative'].map(s => {
                const isSelected = selectedSentiments.includes(s);
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => toggleArrayItem(selectedSentiments, setSelectedSentiments, s)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-slate-500 dark:text-slate-400 mr-1 sm:ml-3">Aspect:</span>
              {['Product Quality', 'Customer Service', 'Delivery', 'Pricing', 'App/Website', 'General'].map(a => {
                const isSelected = selectedAspects.includes(a);
                return (
                  <button
                    type="button"
                    key={a}
                    onClick={() => toggleArrayItem(selectedAspects, setSelectedAspects, a)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                    }`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        {/* Data Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-3.5">ID / Origin</th>
                <th className="px-5 py-3.5 w-full min-w-[320px]">Review Feedback</th>
                <th className="px-5 py-3.5">ML Classification</th>
                <th className="px-5 py-3.5">Triage Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium">Retrieving feedback records...</span>
                    </div>
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center text-slate-400">
                    <Filter className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                    No customer feedback found matching the active filters.
                  </td>
                </tr>
              ) : (
                reviews.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                    
                    {/* ID / Origin */}
                    <td className="px-5 py-4 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">#{r.id}</span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700 w-fit">
                          {r.batch_type === 'csv' ? 'CSV' : 'Manual'}
                        </span>
                      </div>
                    </td>

                    {/* Feedback Text */}
                    <td className="px-5 py-4 align-top max-w-md whitespace-normal min-w-[320px]">
                      <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                        {r.review_text}
                      </p>
                      <span className="text-[11px] text-slate-400 mt-1.5 block">
                        {timeAgo(r.timestamp)}
                      </span>
                    </td>

                    {/* Classification */}
                    <td className="px-5 py-4 align-top">
                      <div className="flex flex-col gap-1.5 items-start">
                        {/* Priority Badge */}
                        {r.priority_score > 0 && (() => {
                          const pInfo = getPriorityInfo(r.priority_score);
                          return (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${pInfo.colors}`}>
                              {pInfo.label} ({r.priority_score})
                            </span>
                          );
                        })()}

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Sentiment */}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                            r.sentiment === 'Positive' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40' 
                              : r.sentiment === 'Negative' 
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40' 
                              : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                          }`}>
                            {r.sentiment}
                          </span>

                          {/* Aspect */}
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {r.aspect}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status Select */}
                    <td className="px-5 py-4 align-top">
                      <select 
                        value={r.status}
                        onChange={(e) => handleStatusChange(r.id, e.target.value)}
                        className={`text-xs font-semibold rounded-lg py-1 px-2.5 border cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          r.status === 'New' 
                            ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800/60 dark:bg-indigo-950/30 dark:text-indigo-400' 
                            : r.status === 'Resolved' 
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-400' 
                            : r.status === 'Reviewing'
                            ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-400'
                            : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        <option value="New">New</option>
                        <option value="Reviewing">Reviewing</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Ignored">Ignored</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right align-top">
                      <button 
                        onClick={() => handleDeleteClick(r.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Delete review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 mt-auto text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            Showing <strong className="text-slate-900 dark:text-white tabular-nums">{reviews.length > 0 ? (meta.page - 1) * meta.limit + 1 : 0}</strong> to <strong className="text-slate-900 dark:text-white tabular-nums">{Math.min(meta.page * meta.limit, meta.total)}</strong> of <strong className="text-slate-900 dark:text-white tabular-nums">{meta.total}</strong> feedback items
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(meta.page - 1)}
              disabled={meta.page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            
            <span className="px-2 font-medium text-slate-500 tabular-nums">
              Page {meta.page} of {totalPages}
            </span>

            <button
              onClick={() => handlePageChange(meta.page + 1)}
              disabled={meta.page >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-xs"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Reviews;
