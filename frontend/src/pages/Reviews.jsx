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
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  RotateCcw,
  Tag,
  Inbox,
  AlertTriangle,
  SlidersHorizontal,
  ChevronDown,
  X
} from 'lucide-react';

const SENTIMENT_STYLES = {
  Positive: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60 dot-emerald-500',
  Negative: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60 dot-rose-500',
  Neutral:  'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 dot-slate-400',
};

const STATUS_STYLES = {
  New: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/50',
  Reviewing: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
  Resolved: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
  Ignored: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
};

function ConfirmModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#0F172A] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden p-6 animate-in zoom-in-95">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
          <Trash2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">Delete Feedback Entry</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
          Are you sure you want to permanently delete this customer review? This will remove it from trend analysis.
        </p>
        <div className="flex items-center justify-end gap-2.5">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs"
          >
            Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
}

function timeAgo(timestamp) {
  if (!timestamp) return 'Recently';
  const utcDate = new Date(timestamp);
  if (isNaN(utcDate.getTime())) return 'Recently';
  
  const diff = Math.floor((Date.now() - utcDate.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return utcDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [selectedSentiment, setSelectedSentiment] = useState('ALL');
  const [selectedAspect, setSelectedAspect] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const fetchReviews = async (page = 1) => {
    setLoading(true);
    try {
      const filters = { page, limit: 10 };
      if (search.trim()) filters.search = search.trim();
      if (selectedSentiment !== 'ALL') filters.sentiment = selectedSentiment;
      if (selectedAspect !== 'ALL') filters.aspect = selectedAspect;
      if (selectedPriority !== 'ALL') filters.priority = selectedPriority;
      if (selectedStatus !== 'ALL') filters.status = selectedStatus;

      const res = await api.getReviews(filters);
      setReviews(res.data?.data || []);
      setMeta(res.data?.meta || { total: 0, page, limit: 10 });
    } catch (err) {
      console.error('Failed to load reviews data grid:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(1);
  }, [selectedSentiment, selectedAspect, selectedPriority, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReviews(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedSentiment('ALL');
    setSelectedAspect('ALL');
    setSelectedPriority('ALL');
    setSelectedStatus('ALL');
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.updateStatus(id, newStatus);
      setReviews(reviews.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await api.deleteReview(deleteId);
      setReviews(reviews.filter(r => r.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      setDeleteId(null);
      alert(err.response?.data?.error || `Delete failed: ${err.message}`);
    }
  };

  const handleExportView = () => {
    exportReviewsToCsv(reviews);
  };

  const handleExportAll = async () => {
    try {
      const res = await api.exportAllReviews();
      exportReviewsToCsv(res.data?.data || []);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    }
  };

  const hasActiveFilters = search.trim() !== '' || selectedSentiment !== 'ALL' || selectedAspect !== 'ALL' || selectedPriority !== 'ALL' || selectedStatus !== 'ALL';

  return (
    <div className="space-y-6 pb-16">
      
      {/* Delete Confirmation Modal */}
      <ConfirmModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={handleDeleteConfirm} 
      />

      {/* Page Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Customer Feedback Stream
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Feedback Telemetry Data Grid
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Search, filter, and triage real-time classified customer feedback across your product.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportView}
            disabled={reviews.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-2xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export View ({reviews.length})</span>
          </button>
          <button
            onClick={handleExportAll}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export All ({meta.total})</span>
          </button>
        </div>
      </div>

      {/* Unified Search & Filter Control Bar */}
      <div className="saas-card rounded-2xl p-4 sm:p-5 space-y-4">
        
        {/* Search Bar & Reset */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search feedback text, complaints, or keywords..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all"
          >
            Search
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </form>

        {/* Filter Chips Toolbar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          
          {/* Sentiment Filter */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 px-2">Sentiment:</span>
            {['ALL', 'Positive', 'Neutral', 'Negative'].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSentiment(s)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  selectedSentiment === s
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Aspect Filter */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 px-2">Aspect:</span>
            <select
              value={selectedAspect}
              onChange={(e) => setSelectedAspect(e.target.value)}
              className="bg-transparent text-[11px] font-semibold text-slate-800 dark:text-slate-200 focus:outline-none pr-2 cursor-pointer"
            >
              <option value="ALL">All Topics</option>
              <option value="Product Quality">Product Quality</option>
              <option value="Customer Service">Customer Service</option>
              <option value="Delivery">Delivery</option>
              <option value="Pricing">Pricing</option>
              <option value="App/Website">App / Website</option>
              <option value="General">General</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 px-2">Priority:</span>
            {['ALL', 'Critical', 'High', 'Medium', 'Low'].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPriority(p)}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  selectedPriority === p
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 px-2">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-[11px] font-semibold text-slate-800 dark:text-slate-200 focus:outline-none pr-2 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="New">New</option>
              <option value="Reviewing">Reviewing</option>
              <option value="Resolved">Resolved</option>
              <option value="Ignored">Ignored</option>
            </select>
          </div>

        </div>

      </div>

      {/* Main Data Grid Table */}
      <div className="saas-card rounded-2xl overflow-hidden shadow-xs">
        
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400">Filtering feedback telemetry...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <Inbox className="w-10 h-10 text-slate-300 dark:text-slate-700" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No matching customer feedback found.</p>
            <p className="text-[11px] text-slate-400">Try adjusting your keyword search or active filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              
              {/* Table Header */}
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 sm:px-6 w-14 text-center">#</th>
                  <th className="py-3.5 px-4">Tracking Ref / Origin</th>
                  <th className="py-3.5 px-4">Feedback Content</th>
                  <th className="py-3.5 px-4">ML Diagnostics</th>
                  <th className="py-3.5 px-4">Priority Score</th>
                  <th className="py-3.5 px-4">Workflow Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>

              {/* Table Rows */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {reviews.map((r, index) => {
                  const rowNumber = (meta.page - 1) * meta.limit + index + 1;
                  const isPos = r.sentiment === 'Positive';
                  const isNeg = r.sentiment === 'Negative';
                  const priorityClass = r.priority_score >= 80 
                    ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-900/40' 
                    : r.priority_score >= 60 
                    ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/40'
                    : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';

                  return (
                    <tr 
                      key={r.id} 
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Sequential Row Number */}
                      <td className="py-4 px-4 sm:px-6 align-top text-center whitespace-nowrap">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold font-mono text-slate-700 dark:text-slate-300">
                          {rowNumber}
                        </span>
                      </td>

                      {/* ID & Origin */}
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60">
                            REF #{r.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-400">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium text-[10px]">
                            {r.batch_type || 'Manual'}
                          </span>
                          <span>&bull;</span>
                          <span>{timeAgo(r.timestamp)}</span>
                        </div>
                      </td>

                      {/* Review Text */}
                      <td className="py-4 px-4 align-top max-w-md">
                        <p className="text-slate-800 dark:text-slate-200 font-normal leading-relaxed line-clamp-3">
                          {r.review_text}
                        </p>
                      </td>

                      {/* ML Diagnostics (Sentiment & Aspect) */}
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            isPos
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60'
                              : isNeg
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isPos ? 'bg-emerald-500' : isNeg ? 'bg-rose-500' : 'bg-slate-400'}`} />
                            {r.sentiment}
                          </span>

                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                            <Tag className="w-3 h-3 text-slate-400" />
                            {r.aspect || 'General'}
                          </span>
                        </div>
                      </td>

                      {/* Priority Score */}
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${priorityClass}`}>
                            {r.priority_score >= 80 ? 'Critical' : r.priority_score >= 60 ? 'High' : 'Normal'} ({r.priority_score})
                          </span>
                          <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-0.5">
                            <div 
                              className={`h-full ${r.priority_score >= 80 ? 'bg-red-500' : r.priority_score >= 60 ? 'bg-amber-500' : 'bg-slate-400'}`}
                              style={{ width: `${Math.min(r.priority_score, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Workflow Status Dropdown */}
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <select
                          value={r.status || 'New'}
                          onChange={(e) => handleStatusChange(r.id, e.target.value)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border focus:outline-none cursor-pointer transition-colors ${
                            STATUS_STYLES[r.status] || STATUS_STYLES.New
                          }`}
                        >
                          <option value="New">● New</option>
                          <option value="Reviewing">● Reviewing</option>
                          <option value="Resolved">● Resolved</option>
                          <option value="Ignored">● Ignored</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                        <button
                          onClick={() => setDeleteId(r.id)}
                          title="Delete review"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
        )}

        {/* Data Grid Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            Showing <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">{meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0}</span> to{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">{Math.min(meta.page * meta.limit, meta.total)}</span> of{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">{meta.total}</span> feedback items
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchReviews(meta.page - 1)}
              disabled={meta.page <= 1 || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-semibold"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <span className="px-2 text-xs font-bold text-slate-600 dark:text-slate-400">
              Page {meta.page} of {Math.max(Math.ceil(meta.total / meta.limit), 1)}
            </span>
            <button
              onClick={() => fetchReviews(meta.page + 1)}
              disabled={meta.page >= Math.ceil(meta.total / meta.limit) || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-semibold"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
