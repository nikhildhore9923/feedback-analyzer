import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useTheme } from '../context/ThemeContext';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Rectangle 
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
  FileText
} from 'lucide-react';

const SENTIMENT_COLORS = {
  Positive: '#10b981', // emerald-500
  Negative: '#f43f5e', // rose-500
  Neutral:  '#94a3b8', // slate-400
};

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const d = new Date(label);
    const dateLabel = isNaN(d.getTime()) ? label : `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    return (
      <div className="bg-white dark:bg-slate-900 p-3 shadow-xl rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1.5">{dateLabel}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }}></span>
                {entry.name}:
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
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

function StatCard({ title, value, subtitle, trendClass = '', icon: Icon, badge }) {
  return (
    <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</span>
        {badge && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
            {badge.text}
          </span>
        )}
        {Icon && !badge && <Icon className="w-4 h-4 text-slate-400" />}
      </div>
      <div className={`mt-2.5 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums ${trendClass}`}>
        {value}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>}
    </div>
  );
}

function Dashboard() {
  const { isDark } = useTheme();
  const [text, setText] = useState('');
  const [reviews, setReviews] = useState([]);
  const [trends, setTrends] = useState([]);
  const [previousStats, setPreviousStats] = useState(null);
  const [timeRange, setTimeRange] = useState('30');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [alertToast, setAlertToast] = useState(null);
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  const gridStroke = isDark ? '#1e293b' : '#e2e8f0';
  const axisStroke = isDark ? '#64748b' : '#94a3b8';

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
      setSummary('Failed to generate summary. Please ensure reviews exist and your Groq API key is configured.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [reviewsRes, trendsRes] = await Promise.all([
        api.getReviews({ limit: 8 }),
        api.getAnalyticsTrends(timeRange).catch(() => ({ data: { trends: [], previousStats: null } }))
      ]);

      setReviews(reviewsRes.data.data || []);

      // Critical numeric cast: convert MySQL string sums to clean JavaScript numbers
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
      console.error('Failed to load dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await api.submitReview(text.trim());
      setText('');
      fetchData();
      if (res.data.alertSent) {
        setAlertToast("Critical negative feedback detected. Alert notification dispatched!");
        setTimeout(() => setAlertToast(null), 5000);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || "Failed to submit review.";
      alert(`Error submitting feedback: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.uploadCsv(formData);
      setFile(null);
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      fetchData();
      alert(`Success: Processed ${res.data.processed} reviews from CSV.`);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || "Failed to upload CSV.";
      alert(`CSV Upload Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // Safe numerical calculations (guaranteed numbers, preventing string concatenation)
  const pTotal = trends.reduce((acc, curr) => acc + Number(curr.total || 0), 0);
  const pPos = trends.reduce((acc, curr) => acc + Number(curr.positive || 0), 0);
  const pNeg = trends.reduce((acc, curr) => acc + Number(curr.negative || 0), 0);
  const pNeu = trends.reduce((acc, curr) => acc + Number(curr.neutral || 0), 0);
  const pCrit = trends.reduce((acc, curr) => acc + Number(curr.critical || 0), 0);
  const pHigh = trends.reduce((acc, curr) => acc + Number(curr.high || 0), 0);

  const negativeRate = pTotal > 0 ? ((pNeg / pTotal) * 100).toFixed(1) : '0.0';
  
  let rateSubtitle = "Insufficient data";
  if (pTotal > 0) {
    if (previousStats && previousStats.negativeRate !== undefined) {
      const diff = parseFloat(negativeRate) - parseFloat(previousStats.negativeRate);
      if (Math.abs(diff) < 0.1) {
        rateSubtitle = "No change vs prior period";
      } else if (diff > 0) {
        rateSubtitle = `↑ +${Math.abs(diff).toFixed(1)}% vs prior period`;
      } else {
        rateSubtitle = `↓ -${Math.abs(diff).toFixed(1)}% vs prior period`;
      }
    } else {
      rateSubtitle = "Baseline rate for period";
    }
  }

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-12">
      
      {/* Toast Alert */}
      {alertToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-rose-600 text-white px-5 py-3 rounded-xl shadow-2xl animate-bounce">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">{alertToast}</span>
        </div>
      )}

      {/* Header & Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Customer Intelligence Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time sentiment telemetry, topic detection, and AI executive synthesis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Time Range:</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors shadow-xs"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time records</option>
          </select>
        </div>
      </div>

      {/* AI Executive Summary Card */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-200/80 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/30 dark:from-indigo-950/20 dark:via-[#111827] dark:to-slate-900 p-6 shadow-sm">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-600 via-indigo-500 to-violet-500" />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                <Sparkles className="w-3 h-3" /> GenAI Synthesis
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Executive Summary</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automated high-level themes extracted by Groq Cloud across your recent customer feedback.
            </p>
          </div>

          <button
            onClick={handleGenerateSummary}
            disabled={summaryLoading || reviews.length === 0}
            className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {summaryLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Synthesizing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Insights
              </>
            )}
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800">
          {summaryLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-indigo-200/50 dark:bg-indigo-900/40 rounded w-full" />
              <div className="h-4 bg-indigo-200/50 dark:bg-indigo-900/40 rounded w-4/5" />
            </div>
          ) : summary ? (
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
              {summary}
            </p>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic">
              Click &quot;Generate Insights&quot; above to synthesize an instant executive summary.
            </p>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Total Feedback" 
          value={pTotal} 
          subtitle={timeRange === 'all' ? 'All recorded data' : 'In selected window'} 
          icon={FileText}
        />
        <StatCard 
          title="Positive" 
          value={pPos} 
          subtitle={pTotal > 0 ? `${Math.round((pPos / pTotal) * 100)}% of volume` : '0%'} 
          trendClass="text-emerald-600 dark:text-emerald-400"
          icon={CheckCircle2}
        />
        <StatCard 
          title="Negative" 
          value={pNeg} 
          subtitle={pTotal > 0 ? `${Math.round((pNeg / pTotal) * 100)}% of volume` : '0%'} 
          trendClass="text-rose-600 dark:text-rose-400"
          icon={AlertTriangle}
        />
        <StatCard 
          title="Neutral" 
          value={pNeu} 
          subtitle={pTotal > 0 ? `${Math.round((pNeu / pTotal) * 100)}% of volume` : '0%'} 
          trendClass="text-slate-600 dark:text-slate-400"
          icon={Clock}
        />
        <StatCard 
          title="Negative Rate" 
          value={pTotal > 0 ? `${negativeRate}%` : 'N/A'} 
          subtitle={rateSubtitle} 
          trendClass={pTotal > 0 ? (parseFloat(negativeRate) < 20 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400') : ''}
          icon={parseFloat(negativeRate) < 20 ? TrendingDown : TrendingUp}
        />
      </div>

      {/* Priority Urgency Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-red-200 dark:border-red-950/60 bg-red-50/60 dark:bg-red-950/20 p-5 flex items-center justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-900 dark:text-red-400">Critical Priority</h3>
            </div>
            <p className="text-xs text-red-700/80 dark:text-red-400/70 mt-1">
              Urgent negative feedback requiring immediate triage
            </p>
          </div>
          <span className="text-3xl font-extrabold text-red-700 dark:text-red-400 tabular-nums">{pCrit}</span>
        </div>

        <div className="rounded-xl border border-amber-200 dark:border-amber-950/60 bg-amber-50/60 dark:bg-amber-950/20 p-5 flex items-center justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-400">High Priority</h3>
            </div>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/70 mt-1">
              Secondary issues recommended for review this sprint
            </p>
          </div>
          <span className="text-3xl font-extrabold text-amber-700 dark:text-amber-400 tabular-nums">{pHigh}</span>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sentiment Trends Line Chart */}
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Sentiment Trajectory
            </h3>
            <span className="text-xs text-slate-400">Daily Polarity</span>
          </div>

          {trends.length < 2 ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[240px] text-xs text-slate-400">
              <Activity className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
              Insufficient data points for trend chart. Add feedback across multiple days to visualize trends.
            </div>
          ) : (
            <div className="w-full h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                  <XAxis dataKey="date" tickFormatter={formatXAxis} stroke={axisStroke} fontSize={11} tickMargin={8} minTickGap={20} />
                  <YAxis stroke={axisStroke} fontSize={11} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}/>
                  <Line type="monotone" dataKey="positive" name="Positive" stroke={SENTIMENT_COLORS.Positive} strokeWidth={2.5} dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="negative" name="Negative" stroke={SENTIMENT_COLORS.Negative} strokeWidth={2.5} dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="neutral" name="Neutral" stroke={SENTIMENT_COLORS.Neutral} strokeWidth={2} dot={{ r: 2, strokeWidth: 0 }} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Feedback Volume Bar Chart */}
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Feedback Volume
            </h3>
            <span className="text-xs text-slate-400">Total Entries / Day</span>
          </div>

          {trends.length < 2 ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[240px] text-xs text-slate-400">
              <FileText className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
              Not enough daily activity to render volume distribution.
            </div>
          ) : (
            <div className="w-full h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                  <XAxis dataKey="date" tickFormatter={formatXAxis} stroke={axisStroke} fontSize={11} tickMargin={8} minTickGap={20} />
                  <YAxis stroke={axisStroke} fontSize={11} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? '#1e293b' : '#f1f5f9', opacity: 0.6 }} />
                  <Bar dataKey="total" name="Total Feedback" fill="#6366f1" radius={[4, 4, 0, 0]} activeBar={<Rectangle fill="#4f46e5" />} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      {/* Bottom Main Grid: Ingestion & Recent Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Sentiment Distribution & Input */}
        <div className="flex flex-col gap-6">
          
          {/* Sentiment Distribution Pie */}
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs h-[280px] flex flex-col">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">
              Sentiment Distribution
            </h3>
            {pTotal === 0 ? (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                No feedback data recorded.
              </div>
            ) : (
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.name]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, 
                        borderRadius: '10px', 
                        color: isDark ? '#fff' : '#0f172a', 
                        fontSize: '12px' 
                      }} 
                    />
                    <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{ fontSize: '11px' }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Ingest Feedback Card */}
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
              Ingest Feedback
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste customer comment, review, or ticket note..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 p-3 text-xs h-24 resize-y transition-colors"
                maxLength={5000}
              />
              
              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={loading || !text.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg transition-colors text-xs font-semibold shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  {loading ? 'Analyzing with ML...' : 'Analyze Single Feedback'}
                </button>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1.5 uppercase tracking-wider">
                    Bulk CSV Upload
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setFile(e.target.files[0])}
                      className="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 dark:file:bg-slate-800 dark:file:text-slate-300 hover:file:bg-slate-200 dark:hover:file:bg-slate-700 cursor-pointer"
                    />
                    <button
                      type="button"
                      disabled={!file || loading}
                      onClick={handleBulkUpload}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold disabled:opacity-40 transition-colors whitespace-nowrap flex items-center gap-1.5"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      Upload
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Supports up to 200 rows per batch (.csv)</p>
                </div>
              </div>
            </form>
          </div>

        </div>

        {/* Right Column: Recent Activity Feed */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col w-full h-[544px]">
            <div className="p-4 px-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/40 flex-shrink-0">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Recent Intelligence Stream
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Live classified customer reviews</p>
              </div>
              <Link 
                to="/reviews" 
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                View Full Stream <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto p-0 min-h-0 divide-y divide-slate-100 dark:divide-slate-800/80">
              {reviews.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  No feedback items recorded yet. Submit a review above to see the ML telemetry in action.
                </div>
              ) : (
                reviews.map(r => (
                  <div key={r.id} className="p-4 px-6 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed">
                          {r.review_text}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-2.5">
                          {/* Sentiment Tag */}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                            r.sentiment === 'Positive' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40' 
                              : r.sentiment === 'Negative' 
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40' 
                              : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                          }`}>
                            {r.sentiment}
                          </span>

                          {/* Aspect Category */}
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {r.aspect || 'General'}
                          </span>

                          {/* Priority Score */}
                          {r.priority_score > 0 && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                              r.priority_score >= 80 
                                ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800'
                                : r.priority_score >= 60 
                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                                : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                            }`}>
                              Priority: {r.priority_score}
                            </span>
                          )}

                          {/* Confidence */}
                          <span className="text-[11px] text-slate-400 tabular-nums">
                            {(Number(r.confidence || 0) * 100).toFixed(0)}% Conf.
                          </span>

                          {/* Alerted indicator */}
                          {!!r.alert_sent && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300">
                              Alert Dispatched
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
                          {timeAgo(r.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

export default Dashboard;
