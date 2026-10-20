import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useTheme } from '../context/ThemeContext';
import { formatFeedback } from '../utils/textFormat';
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
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Activity,
  Layers,
  Inbox,
  RefreshCw,
  Copy,
  Check,
  Radio,
  FileSpreadsheet,
  Zap,
  Sliders,
  Send
} from 'lucide-react';

const SENTIMENT_COLORS = {
  Positive: '#10B981', // emerald-500
  Neutral:  '#94A3B8', // slate-400
  Negative: '#F43F5E', // rose-500
};

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const d = new Date(label);
    const dateLabel = isNaN(d.getTime()) ? label : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return (
      <div className="bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md p-3.5 shadow-2xl rounded-2xl border border-slate-200/90 dark:border-slate-800 text-xs">
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
  const [copiedSummary, setCopiedSummary] = useState(false);

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

  // Listen for global ingestion events from AppLayout modal
  useEffect(() => {
    const handleGlobalAdd = () => fetchData();
    window.addEventListener('pulse_feedback_added', handleGlobalAdd);
    return () => window.removeEventListener('pulse_feedback_added', handleGlobalAdd);
  }, [timeRange]);

  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    setSummary('');
    try {
      const reviewTexts = reviews.map(r => r.review_text);
      const res = await api.generateSummary(reviewTexts);
      if (res.data?.success) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      setSummary('Failed to generate summary. Ensure feedback is recorded and GROQ_API_KEY is configured.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleCopySummary = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
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
  const neuRate = pTotal > 0 ? Math.round((pNeu / pTotal) * 100) : 0;
  const netScore = posRate - negRate; // Net Sentiment Index (-100 to +100)

  // Polarity distribution chart data
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
    <div className="space-y-8 pb-16">
      
      {/* Page Title & Time Range Controller Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Live Telemetry Stream
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Customer Intelligence Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time sentiment trajectory, aspect categorization, and automated incident triage.
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-900/90 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs font-semibold self-start sm:self-auto">
          {[
            { id: '7', label: '7-Day' },
            { id: '30', label: '30-Day' },
            { id: '90', label: '90-Day' },
            { id: 'all', label: 'All Time' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTimeRange(item.id)}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                timeRange === item.id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI 6-Metrics Cards Grid (SmartAttend Inspired Elegance) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        
        {/* Metric 1: Total Reviews */}
        <div className="saas-card saas-card-hover rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Ingested
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/60 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
              {pTotal}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Feedback items
            </div>
          </div>
        </div>

        {/* Metric 2: Positive Ratio */}
        <div className="saas-card saas-card-hover rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Positive Ratio
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
              {posRate}%
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              {pPos} satisfied users
            </div>
          </div>
        </div>

        {/* Metric 3: Negative Polarity */}
        <div className="saas-card saas-card-hover rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Negative Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200/60 dark:border-rose-800/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 tabular-nums tracking-tight">
              {negRate}%
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              {pNeg} friction points
            </div>
          </div>
        </div>

        {/* Metric 4: Critical Escalations */}
        <div className="saas-card saas-card-hover rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Critical Alerts
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200/60 dark:border-amber-800/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tabular-nums tracking-tight">
              {pCrit}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Score &ge; 80 / 100
            </div>
          </div>
        </div>

        {/* Metric 5: Neutral / Balanced */}
        <div className="saas-card saas-card-hover rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Neutral Reviews
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-center text-slate-600 dark:text-slate-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-700 dark:text-slate-300 tabular-nums tracking-tight">
              {pNeu}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              {neuRate}% balanced
            </div>
          </div>
        </div>

        {/* Metric 6: Net Sentiment Score */}
        <div className="saas-card saas-card-hover rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Net Score
            </span>
            <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/70 border border-violet-200/60 dark:border-violet-800/50 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className={`text-2xl sm:text-3xl font-black tabular-nums tracking-tight ${netScore >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'}`}>
              {netScore > 0 ? `+${netScore}` : netScore}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Range: -100 to +100
            </div>
          </div>
        </div>

      </div>

      {/* Main Analytics Section: Trajectory Velocity + AI Brief */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trajectory Velocity Chart (2/3 Width) */}
        <div className="lg:col-span-2 saas-card rounded-3xl p-5 sm:p-7 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Sentiment Telemetry Velocity
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                  Multi-Class Area
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Daily volume distribution across positive, neutral, and negative customer polarity.
              </p>
            </div>

            {/* Custom Legend */}
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600 dark:text-slate-400">Positive</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span className="text-slate-600 dark:text-slate-400">Neutral</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-600 dark:text-slate-400">Negative</span>
              </div>
            </div>
          </div>

          {trends.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-xs text-slate-400">
              <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
              <span>No feedback entries recorded in the selected time window.</span>
            </div>
          ) : (
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorNeg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorNeu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                  <XAxis dataKey="date" tickFormatter={formatXAxis} stroke={axisStroke} fontSize={11} tickMargin={8} minTickGap={20} />
                  <YAxis stroke={axisStroke} fontSize={11} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="positive" name="Positive" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorPos)" />
                  <Area type="monotone" dataKey="neutral" name="Neutral" stroke="#94A3B8" strokeWidth={1.5} fillOpacity={1} fill="url(#colorNeu)" />
                  <Area type="monotone" dataKey="negative" name="Negative" stroke="#F43F5E" strokeWidth={2} fillOpacity={1} fill="url(#colorNeg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Executive AI Synthesis Card (1/3 Width) */}
        <div className="saas-card rounded-3xl p-5 sm:p-7 flex flex-col justify-between border-indigo-200/80 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50/30 via-white to-violet-50/20 dark:from-indigo-950/30 dark:via-[#0F172A] dark:to-slate-900">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Executive AI Synthesis
                  </h3>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                    Groq Qwen Engine
                  </span>
                </div>
              </div>

              {summary && (
                <button
                  onClick={handleCopySummary}
                  title="Copy synthesis text"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              Synthesizes real-time customer sentiment into an actionable executive brief for product leads.
            </p>

            <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 text-xs min-h-[140px] flex items-center justify-center">
              {summaryLoading ? (
                <div className="space-y-2.5 w-full animate-pulse">
                  <div className="h-3 bg-indigo-200/60 dark:bg-indigo-900/40 rounded-full w-full" />
                  <div className="h-3 bg-indigo-200/60 dark:bg-indigo-900/40 rounded-full w-4/5" />
                  <div className="h-3 bg-indigo-200/60 dark:bg-indigo-900/40 rounded-full w-2/3" />
                </div>
              ) : summary ? (
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-normal whitespace-pre-line text-left">
                  &quot;{summary}&quot;
                </p>
              ) : (
                <span className="text-slate-400 dark:text-slate-500 italic text-center">
                  Click below to generate an AI executive summary across your recent feedback entries.
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-200/60 dark:border-slate-800/80">
            <button
              onClick={handleGenerateSummary}
              disabled={summaryLoading || reviews.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/25 transition-all disabled:opacity-50"
            >
              {summaryLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing Drivers...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{summary ? 'Regenerate AI Brief' : 'Generate Real-Time Brief'}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Lower Section: Polarity Doughnut + Live Feedback Telemetry Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Polarity Doughnut Chart */}
        <div className="saas-card rounded-3xl p-5 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Polarity Distribution
              </h3>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                {pTotal} items
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
              Continuous sentiment segmentation
            </p>

            {pTotal === 0 ? (
              <div className="h-52 flex items-center justify-center text-xs text-slate-400">
                No telemetry recorded in this range.
              </div>
            ) : (
              <div className="h-52 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={5}
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
                        borderRadius: '16px', 
                        fontSize: '12px' 
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Clean Segment Badges */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <div className="p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/40">
              <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block">Pos</span>
              <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{posRate}%</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50">
              <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">Neu</span>
              <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{neuRate}%</span>
            </div>
            <div className="p-2 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/50 dark:border-rose-800/40">
              <span className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400 block">Neg</span>
              <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{negRate}%</span>
            </div>
          </div>
        </div>

        {/* Live Customer Telemetry Stream (2/3 Width) */}
        <div className="lg:col-span-2 saas-card rounded-3xl p-5 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Real-Time Feedback Ingestion Stream
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Latest customer entries processed by the inference engine
                </p>
              </div>
              <Link 
                to="/reviews"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
              >
                <span>Full Telemetry Grid</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {reviews.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-xs text-slate-400">
                <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                <span>No feedback items recorded yet. Click &quot;Ingest&quot; to submit a test review.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((r, index) => {
                  const isPos = r.sentiment === 'Positive';
                  const isNeg = r.sentiment === 'Negative';
                  const formatted = formatFeedback(r.review_text);
                  return (
                    <div 
                      key={r.id} 
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 ${
                        isPos
                          ? 'bg-emerald-500/[0.02] dark:bg-emerald-500/[0.03] border-emerald-200/60 dark:border-emerald-800/40 hover:border-emerald-300 dark:hover:border-emerald-700/60'
                          : isNeg
                          ? 'bg-rose-500/[0.02] dark:bg-rose-500/[0.03] border-rose-200/60 dark:border-rose-800/40 hover:border-rose-300 dark:hover:border-rose-700/60'
                          : 'bg-slate-50/50 dark:bg-[#12151E] border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          
                          {/* Sequential Display Row # */}
                          <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500">
                            #{index + 1}
                          </span>

                          {/* Sentiment Pill */}
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            isPos
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                              : isNeg
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isPos ? 'bg-emerald-500' : isNeg ? 'bg-rose-500' : 'bg-slate-400'}`} />
                            {r.sentiment}
                          </span>

                          {/* Aspect Driver */}
                          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                            {r.aspect || 'General'}
                          </span>

                          {/* REF Tag */}
                          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80">
                            REF #{r.id}
                          </span>

                          {/* Priority Incident Badges */}
                          {r.priority_score >= 80 ? (
                            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/60">
                              Critical ({r.priority_score})
                            </span>
                          ) : r.priority_score >= 60 ? (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/60">
                              High ({r.priority_score})
                            </span>
                          ) : null}
                        </div>

                        <span className="text-[11px] font-mono text-slate-400">
                          {timeAgo(r.timestamp)}
                        </span>
                      </div>

                      {/* Enclosed Feedback Content Box with Sentiment Color Tint */}
                      <div className={`p-3 rounded-xl border text-[13px] leading-relaxed transition-all ${
                        isPos
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40 text-slate-800 dark:text-slate-200'
                          : isNeg
                          ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-800/40 text-slate-800 dark:text-slate-200'
                          : 'bg-white dark:bg-[#0E1017] border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        <div className="flex items-start gap-2">
                          {formatted.isAutomated && (
                            <span className="shrink-0 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300/60 dark:border-slate-700/60 mt-0.5">
                              Automated Test
                            </span>
                          )}
                          <p className="font-sans font-normal leading-relaxed line-clamp-3">
                            {formatted.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Showing top {reviews.length} real-time customer signals</span>
            <Link to="/reviews" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              Browse All Entries &rarr;
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
