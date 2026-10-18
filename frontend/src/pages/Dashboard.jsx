import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useTheme } from '../context/ThemeContext';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ShieldAlert, 
  UploadCloud, 
  Send, 
  ArrowUpRight,
  Clock,
  CheckCircle2,
  FileText,
  Activity,
  Plus,
  X,
  FileSpreadsheet,
  Layers,
  Inbox,
  Filter,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

const SENTIMENT_COLORS = {
  Positive: '#10B981', // emerald-500
  Neutral:  '#94A3B8', // slate-400
  Negative: '#F43F5E', // rose-500
};

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const d = new Date(label);
    const dateLabel = isNaN(d.getTime()) ? label : `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    return (
      <div className="bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md p-3.5 shadow-xl rounded-2xl border border-slate-200/90 dark:border-slate-800 text-xs">
        <p className="font-bold text-slate-900 dark:text-slate-100 mb-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">{dateLabel}</p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full shadow-2xs" style={{ backgroundColor: entry.color || entry.stroke || entry.fill }} />
                <span className="font-medium">{entry.name}</span>
              </span>
              <span className="font-bold text-slate-900 dark:text-white tabular-nums">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
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

export default function Dashboard() {
  const { isDark } = useTheme();
  const [reviews, setReviews] = useState([]);
  const [trends, setTrends] = useState([]);
  const [previousStats, setPreviousStats] = useState(null);
  const [timeRange, setTimeRange] = useState('30');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [alertToast, setAlertToast] = useState(null);

  // Ingestion Modal State
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [ingestTab, setIngestTab] = useState('single'); // 'single' | 'bulk'
  const [singleText, setSingleText] = useState('');
  const [bulkFile, setBulkFile] = useState(null);
  const [ingestSubmitting, setIngestSubmitting] = useState(false);

  const gridStroke = isDark ? '#1E293B' : '#F1F5F9';
  const axisStroke = isDark ? '#64748B' : '#94A3B8';

  const fetchData = async () => {
    try {
      const [reviewsRes, trendsRes] = await Promise.all([
        api.getReviews({ limit: 6 }),
        api.getAnalyticsTrends(timeRange).catch(() => ({ data: { trends: [], previousStats: null } }))
      ]);

      setReviews(reviewsRes.data?.data || []);

      const rawTrends = trendsRes.data?.trends || [];
      const cleanTrends = rawTrends.map(t => ({
        ...t,
        positive: Number(t.positive || 0),
        negative: Number(t.negative || 0),
        neutral: Number(t.neutral || 0),
        critical: Number(t.critical || 0),
        high: Number(t.high || 0),
        total: Number(t.total || 0)
      }));

      setTrends(cleanTrends);
      setPreviousStats(trendsRes.data?.previousStats || null);
    } catch (err) {
      console.error('Failed to load dashboard telemetry:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    setSummary('');
    try {
      const reviewTexts = reviews.map(r => r.review_text);
      const res = await api.generateSummary(reviewTexts);
      if (res.data.success) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      setSummary('Failed to generate summary. Ensure reviews are recorded and GROQ_API_KEY is configured.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    if (!singleText.trim()) return;
    setIngestSubmitting(true);
    try {
      const res = await api.submitReview(singleText.trim());
      setSingleText('');
      setIsIngestModalOpen(false);
      fetchData();
      if (res.data?.alertSent) {
        setAlertToast("High-priority negative review detected. Automated alert dispatched!");
        setTimeout(() => setAlertToast(null), 5000);
      }
    } catch (err) {
      alert(`Submission Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setIngestSubmitting(false);
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkFile) return;
    setIngestSubmitting(true);
    const formData = new FormData();
    formData.append('file', bulkFile);
    try {
      const res = await api.uploadCsv(formData);
      setBulkFile(null);
      setIsIngestModalOpen(false);
      fetchData();
      alert(`Successfully processed ${res.data.processed} reviews.`);
    } catch (err) {
      alert(`CSV Upload Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setIngestSubmitting(false);
    }
  };

  // Safe numerical calculations
  const pTotal = trends.reduce((acc, curr) => acc + Number(curr.total || 0), 0);
  const pPos = trends.reduce((acc, curr) => acc + Number(curr.positive || 0), 0);
  const pNeg = trends.reduce((acc, curr) => acc + Number(curr.negative || 0), 0);
  const pNeu = trends.reduce((acc, curr) => acc + Number(curr.neutral || 0), 0);
  const pCrit = trends.reduce((acc, curr) => acc + Number(curr.critical || 0), 0);
  const pHigh = trends.reduce((acc, curr) => acc + Number(curr.high || 0), 0);

  const posRate = pTotal > 0 ? Math.round((pPos / pTotal) * 100) : 0;
  const negRate = pTotal > 0 ? Math.round((pNeg / pTotal) * 100) : 0;
  const netScore = posRate - negRate; // Net Sentiment Index (-100 to +100)

  // Distribution chart data
  const chartData = [
    { name: 'Positive', value: pPos },
    { name: 'Neutral', value: pNeu },
    { name: 'Negative', value: pNeg },
  ].filter(d => d.value > 0);

  const formatXAxis = (tickItem) => {
    const d = new Date(tickItem);
    return isNaN(d.getTime()) ? tickItem : `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
      
      {/* Toast Notification */}
      {alertToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-rose-600 text-white px-5 py-3 rounded-2xl shadow-xl shadow-rose-600/30 animate-in fade-in slide-in-from-top-4">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-semibold">{alertToast}</span>
        </div>
      )}

      {/* Hero Header & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Live Telemetry Stream
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Customer Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time sentiment trajectory, aspect diagnostics, and automated incident triage.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Segmented Time Range Controller */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs font-semibold">
            {[
              { id: '7', label: '7D' },
              { id: '30', label: '30D' },
              { id: '90', label: '90D' },
              { id: 'all', label: 'All' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setTimeRange(item.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  timeRange === item.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Quick Ingest Modal Trigger */}
          <button
            onClick={() => setIsIngestModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Plus className="w-4 h-4" />
            <span>Ingest Feedback</span>
          </button>
        </div>
      </div>

      {/* AI Synthesis Brief Card */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-200/90 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50/40 via-white to-violet-50/20 dark:from-indigo-950/20 dark:via-[#0F172A] dark:to-slate-900 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100/80 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wider border border-indigo-200 dark:border-indigo-800/60">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>Executive Synthesis</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              AI Sentiment Summary
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
              Instant thematic abstraction powered by Llama-3 across recent customer feedback.
            </p>
          </div>

          <button
            onClick={handleGenerateSummary}
            disabled={summaryLoading || reviews.length === 0}
            className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-2xs hover:shadow-xs transition-all disabled:opacity-50"
          >
            {summaryLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                <span>Analyzing Patterns...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>{summary ? 'Regenerate Brief' : 'Generate Brief'}</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800/80">
          {summaryLoading ? (
            <div className="space-y-2.5 animate-pulse py-2">
              <div className="h-3.5 bg-indigo-200/60 dark:bg-indigo-900/40 rounded-full w-full" />
              <div className="h-3.5 bg-indigo-200/60 dark:bg-indigo-900/40 rounded-full w-4/5" />
            </div>
          ) : summary ? (
            <div className="bg-white/80 dark:bg-slate-900/60 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900/30">
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal whitespace-pre-line">
                {summary}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic flex items-center gap-1.5">
              <span>Click &quot;Generate Brief&quot; above to summarize emerging issues and positive feedback drivers.</span>
            </p>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Total Ingestion */}
        <div className="saas-card saas-card-hover rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Ingested</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">{pTotal}</span>
            <span className="text-xs text-slate-400">records</span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Window: {timeRange === 'all' ? 'All records' : `Past ${timeRange} days`}</span>
          </div>
        </div>

        {/* Positive Sentiment */}
        <div className="saas-card saas-card-hover rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Positive Signals</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/50 dark:border-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">{pPos}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
              {posRate}% of volume
            </span>
          </div>
          <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">Satisfied customer expressions</p>
        </div>

        {/* Negative Sentiment */}
        <div className="saas-card saas-card-hover rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Negative Signals</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/50 dark:border-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400 tabular-nums">{pNeg}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300">
              {negRate}% of volume
            </span>
          </div>
          <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">Detractors needing resolution</p>
        </div>

        {/* Net Sentiment Index */}
        <div className="saas-card saas-card-hover rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Net Sentiment Score</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold tracking-tight tabular-nums ${netScore >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {netScore > 0 ? `+${netScore}` : netScore}
            </span>
            <span className="text-xs text-slate-400">scale (-100 to +100)</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${netScore >= 0 ? 'bg-indigo-600' : 'bg-rose-500'}`}
              style={{ width: `${Math.min(Math.max((netScore + 100) / 2, 5), 100)}%` }}
            />
          </div>
        </div>

      </div>

      {/* Triage Priority Strip */}
      <div className="saas-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Triage Queue Urgency
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Categorized by severity and priority scoring for customer retention.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs font-bold text-red-700 dark:text-red-300">Critical Priority:</span>
            <span className="text-xs font-extrabold text-red-900 dark:text-red-200 tabular-nums">{pCrit}</span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">High Priority:</span>
            <span className="text-xs font-extrabold text-amber-900 dark:text-amber-200 tabular-nums">{pHigh}</span>
          </div>
        </div>
      </div>

      {/* Analytical Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sentiment Trajectory Area Chart */}
        <div className="saas-card rounded-2xl p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Sentiment Trajectory
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Daily polarity distribution</p>
            </div>
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-full">
              Trend Telemetry
            </span>
          </div>

          {trends.length < 2 ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[260px] text-xs text-slate-400 text-center px-4">
              <Activity className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
              <span>Insufficient daily data points to chart trajectory. Ingest reviews across multiple days to view curve.</span>
            </div>
          ) : (
            <div className="w-full h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={SENTIMENT_COLORS.Positive} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={SENTIMENT_COLORS.Positive} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={SENTIMENT_COLORS.Negative} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={SENTIMENT_COLORS.Negative} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                  <XAxis dataKey="date" tickFormatter={formatXAxis} stroke={axisStroke} fontSize={11} tickMargin={8} minTickGap={20} />
                  <YAxis stroke={axisStroke} fontSize={11} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="positive" name="Positive" stroke={SENTIMENT_COLORS.Positive} strokeWidth={2.5} fillOpacity={1} fill="url(#colorPositive)" />
                  <Area type="monotone" dataKey="negative" name="Negative" stroke={SENTIMENT_COLORS.Negative} strokeWidth={2.5} fillOpacity={1} fill="url(#colorNegative)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Daily Feedback Volume */}
        <div className="saas-card rounded-2xl p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Feedback Volume
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Total customer submissions per day</p>
            </div>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
              Daily Count
            </span>
          </div>

          {trends.length < 2 ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[260px] text-xs text-slate-400 text-center px-4">
              <FileSpreadsheet className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
              <span>Not enough distinct day entries to plot volume histogram.</span>
            </div>
          ) : (
            <div className="w-full h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                  <XAxis dataKey="date" tickFormatter={formatXAxis} stroke={axisStroke} fontSize={11} tickMargin={8} minTickGap={20} />
                  <YAxis stroke={axisStroke} fontSize={11} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? '#1E293B' : '#F1F5F9', opacity: 0.5 }} />
                  <Bar dataKey="total" name="Total Ingested" fill="#6366F1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      {/* Bottom Grid: Live Stream & Sentiment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Sentiment Ratio Doughnut */}
        <div className="saas-card rounded-2xl p-5 sm:p-6 flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-1">
            Polarity Distribution
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">Breakdown of customer sentiment</p>

          {pTotal === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400 min-h-[220px]">
              No records in this time window.
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[220px]">
              <div className="w-full h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.name]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? '#0F172A' : '#FFFFFF', 
                        border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`, 
                        borderRadius: '12px', 
                        fontSize: '12px' 
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Custom Clean Legend */}
              <div className="flex items-center justify-center gap-4 mt-2 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-600 dark:text-slate-400">Pos ({posRate}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">Neu ({100 - posRate - negRate}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-slate-600 dark:text-slate-400">Neg ({negRate}%)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 2 Columns: Real-Time Feedback Stream */}
        <div className="lg:col-span-2 saas-card rounded-2xl p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Recent Customer Telemetry
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Latest analyzed feedback entries</p>
            </div>
            <Link 
              to="/reviews"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <span>View Data Grid</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {reviews.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-xs text-slate-400">
              <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
              <span>No feedback entries found. Click &quot;Ingest Feedback&quot; to add your first customer review.</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {reviews.map((r) => {
                const isPos = r.sentiment === 'Positive';
                const isNeg = r.sentiment === 'Negative';
                return (
                  <div key={r.id} className="py-3.5 flex flex-col gap-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 px-2 rounded-xl transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          isPos
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                            : isNeg
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isPos ? 'bg-emerald-500' : isNeg ? 'bg-rose-500' : 'bg-slate-400'}`} />
                          {r.sentiment}
                        </span>

                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                          {r.aspect || 'General'}
                        </span>

                        {r.priority_score >= 80 && (
                          <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/80 px-2 py-0.5 rounded-md border border-red-200 dark:border-red-900/60">
                            Critical ({r.priority_score})
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] text-slate-400 font-mono">
                        {timeAgo(r.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">
                      &quot;{r.review_text}&quot;
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Modern Ingest Slide-over Modal */}
      {isIngestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Ingest Customer Feedback
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Process raw customer feedback with real-time NLP classification.
                </p>
              </div>
              <button
                onClick={() => setIsIngestModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ingestion Tabs */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl mb-5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setIngestTab('single')}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  ingestTab === 'single'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Single Review Text
              </button>
              <button
                type="button"
                onClick={() => setIngestTab('bulk')}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  ingestTab === 'bulk'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                CSV Batch Upload
              </button>
            </div>

            {/* Single Feedback Form */}
            {ingestTab === 'single' ? (
              <form onSubmit={handleSingleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Customer Comment / Review
                  </label>
                  <textarea
                    rows={4}
                    value={singleText}
                    onChange={(e) => setSingleText(e.target.value)}
                    placeholder="e.g., The order arrived 3 days late and customer support didn't reply to my ticket..."
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {singleText.length} / 5000 characters
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsIngestModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={ingestSubmitting || !singleText.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm"
                  >
                    {ingestSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Classifying...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Analyze & Store</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Bulk CSV Form */
              <form onSubmit={handleBulkUpload} className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-indigo-500 transition-colors">
                  <UploadCloud className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Select a CSV dataset
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    CSV file containing customer reviews (up to 200 rows per batch)
                  </p>
                  
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setBulkFile(e.target.files[0])}
                    className="mt-4 text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-950 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsIngestModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={ingestSubmitting || !bulkFile}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm"
                  >
                    {ingestSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing CSV...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload & Classify</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
