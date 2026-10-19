import { useState } from 'react';
import { api } from '../api';
import { 
  X, 
  Send, 
  UploadCloud, 
  Sparkles, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Info
} from 'lucide-react';

export default function IngestModal({ isOpen, onClose, onFeedbackAdded }) {
  const [activeTab, setActiveTab] = useState('single'); // 'single' | 'bulk'
  const [singleText, setSingleText] = useState('');
  const [bulkFile, setBulkFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    if (!singleText.trim()) return;

    setSubmitting(true);
    setErrorMessage('');
    try {
      const res = await api.submitReview(singleText.trim());
      setSingleText('');
      setSuccessToast(`Feedback classified as "${res.data?.sentiment}" (${res.data?.aspect || 'General'}) with priority score ${res.data?.priorityScore}/100.`);
      if (onFeedbackAdded) onFeedbackAdded(res.data);
      setTimeout(() => {
        setSuccessToast(null);
        onClose();
      }, 1800);
    } catch (err) {
      setErrorMessage(err.response?.data?.error || err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkFile) return;

    setSubmitting(true);
    setErrorMessage('');
    const formData = new FormData();
    formData.append('file', bulkFile);

    try {
      const res = await api.uploadCsv(formData);
      setBulkFile(null);
      setSuccessToast(`Successfully ingested and classified ${res.data?.processed} customer reviews!`);
      if (onFeedbackAdded) onFeedbackAdded();
      setTimeout(() => {
        setSuccessToast(null);
        onClose();
      }, 2000);
    } catch (err) {
      setErrorMessage(err.response?.data?.error || err.message || 'CSV upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#0F172A] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Ingest Customer Feedback
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Process real-time reviews through the NLP inference pipeline.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 pt-4 flex gap-2 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => { setActiveTab('single'); setErrorMessage(''); }}
            className={`pb-3 text-xs font-bold transition-all relative ${
              activeTab === 'single'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <span>Single Review Ingestion</span>
            {activeTab === 'single' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => { setActiveTab('bulk'); setErrorMessage(''); }}
            className={`pb-3 text-xs font-bold transition-all relative ${
              activeTab === 'bulk'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <span>Bulk CSV Upload</span>
            {activeTab === 'bulk' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
            )}
          </button>
        </div>

        {/* Feedback / Alert Banners */}
        {successToast && (
          <div className="m-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successToast}</span>
          </div>
        )}

        {errorMessage && (
          <div className="m-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Form Body */}
        <div className="p-6">
          {activeTab === 'single' ? (
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Raw Feedback Text
                </label>
                <textarea
                  value={singleText}
                  onChange={(e) => setSingleText(e.target.value)}
                  placeholder="e.g., The updated mobile checkout experience is blazing fast, but customer service took two days to respond to my email."
                  rows={4}
                  required
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                  The ML pipeline will instantly extract sentiment polarity, confidence score, aspect driver, and incident priority.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !singleText.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Classifying...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Analyze & Save</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleBulkUpload} className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-3xl p-6 text-center transition-colors">
                <input
                  type="file"
                  id="csvBulkUpload"
                  accept=".csv,text/csv"
                  onChange={(e) => setBulkFile(e.target.files[0] || null)}
                  className="hidden"
                />
                <label htmlFor="csvBulkUpload" className="cursor-pointer block">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-3">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {bulkFile ? bulkFile.name : 'Choose a CSV file or drag & drop'}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-1">
                    Maximum 200 rows per batch • File size up to 5 MB
                  </span>
                </label>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                  <Info className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Expected CSV Headers:</span>
                </div>
                <p className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">
                  review, text, or feedback
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !bulkFile}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing Batch...</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Upload & Ingest</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
