import { useState } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { 
  X, 
  Send, 
  UploadCloud, 
  Sparkles, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Info,
  FileText,
  FileCheck
} from 'lucide-react';

const SAMPLE_REVIEWS = [
  "The checkout process was ultra smooth and shipping arrived two days early. Highly recommended!",
  "Customer service was slow to respond and the mobile application keeps crashing upon login.",
  "Decent performance overall, but the pricing tier is slightly higher than comparable market solutions."
];

export default function IngestModal({ isOpen, onClose, onFeedbackAdded }) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('single'); // 'single' | 'bulk'
  const [singleText, setSingleText] = useState('');
  const [bulkFile, setBulkFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleInsertSample = () => {
    const randomSample = SAMPLE_REVIEWS[Math.floor(Math.random() * SAMPLE_REVIEWS.length)];
    setSingleText(randomSample);
    setErrorMessage('');
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    if (!singleText.trim()) return;

    setSubmitting(true);
    setErrorMessage('');
    try {
      const res = await api.submitReview(singleText.trim());
      const data = res.data;
      setSingleText('');
      
      toast.success(
        'Feedback Ingested & Classified',
        `Classified as ${data?.sentiment || 'Neutral'} (${data?.aspect || 'General'}) • Priority ${data?.priorityScore || 0}/100.`
      );
      
      if (onFeedbackAdded) onFeedbackAdded(data);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Submission failed';
      setErrorMessage(msg);
      toast.error('Ingestion Failed', msg);
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
      const count = res.data?.processed || 0;
      setBulkFile(null);
      
      toast.success(
        'Batch Ingestion Complete',
        `Successfully ingested and classified ${count} customer feedback records.`
      );
      
      if (onFeedbackAdded) onFeedbackAdded();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'CSV upload failed';
      setErrorMessage(msg);
      toast.error('Upload Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#12151E] rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800/90 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
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
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 pt-4">
          <div className="flex gap-1 p-1 bg-slate-100/80 dark:bg-[#0B0D13] rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
            <button
              type="button"
              onClick={() => { setActiveTab('single'); setErrorMessage(''); }}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'single'
                  ? 'bg-white dark:bg-[#1E2330] text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Single Review Ingestion
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('bulk'); setErrorMessage(''); }}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'bulk'
                  ? 'bg-white dark:bg-[#1E2330] text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Bulk CSV Upload
            </button>
          </div>
        </div>

        {/* In-Modal Error Banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* Modal Form Body */}
        <div className="p-6">
          {activeTab === 'single' ? (
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Raw Customer Review
                  </label>
                  <button
                    type="button"
                    onClick={handleInsertSample}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    + Insert Sample Text
                  </button>
                </div>

                <textarea
                  value={singleText}
                  onChange={(e) => setSingleText(e.target.value)}
                  placeholder="e.g. The checkout experience is blazing fast, but customer service took two days to respond to my email."
                  rows={4}
                  required
                  className="w-full p-3.5 bg-slate-50 dark:bg-[#0B0D13] border border-slate-200 dark:border-slate-800/80 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none transition-colors"
                />

                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  <span>ML will extract polarity, aspect, confidence, and urgency.</span>
                  <span className="tabular-nums font-mono">{singleText.length} chars</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !singleText.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
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
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600/80 rounded-3xl p-6 text-center transition-colors bg-slate-50/50 dark:bg-[#0B0D13]/40">
                <input
                  type="file"
                  id="csvBulkUpload"
                  accept=".csv,text/csv"
                  onChange={(e) => setBulkFile(e.target.files[0] || null)}
                  className="hidden"
                />
                <label htmlFor="csvBulkUpload" className="cursor-pointer block">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-3">
                    {bulkFile ? <FileCheck className="w-6 h-6 text-emerald-500" /> : <UploadCloud className="w-6 h-6" />}
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {bulkFile ? bulkFile.name : 'Choose a CSV file or drag & drop'}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-1">
                    Maximum 200 rows per batch • File size up to 5 MB
                  </span>
                </label>
              </div>

              {bulkFile && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/50 text-xs">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold truncate">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{bulkFile.name}</span>
                    <span className="text-[10px] text-emerald-600/70 font-mono">
                      ({Math.round(bulkFile.size / 1024)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBulkFile(null)}
                    className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                    title="Remove file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0B0D13] border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                  <Info className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Accepted Column Headers:</span>
                </div>
                <p className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">
                  review, text, or feedback
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !bulkFile}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
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
