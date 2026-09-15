import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const SENTIMENT_COLORS = {
  Positive: '#10b981', // emerald-500
  Negative: '#f43f5e', // rose-500
  Neutral:  '#94a3b8', // slate-400
};

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

function StatCard({ title, value, subtitle, trendClass = "" }) {
  return (
    <div className="bg-white dark:bg-[#111827] rounded-lg border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</div>
      <div className={`mt-2 text-3xl font-bold text-gray-900 dark:text-white ${trendClass}`}>
        {value}
      </div>
      {subtitle && <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</div>}
    </div>
  );
}

function Dashboard() {
  const [text, setText] = useState('');
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState([]);
  const [trends, setTrends] = useState([]);
  const [previousStats, setPreviousStats] = useState(null);
  const [timeRange, setTimeRange] = useState('30');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [alertToast, setAlertToast] = useState(null);

  const fetchData = async () => {
    try {
      const [reviewsRes, statsRes, trendsRes] = await Promise.all([
        api.getReviews({ limit: 10 }),
        api.getStats(),
        api.getAnalyticsTrends(timeRange).catch(e => ({ data: { trends: [], previousStats: null } }))
      ]);
      setReviews(reviewsRes.data.data || []);
      setStats(statsRes.data || []);
      setTrends(trendsRes.data?.trends || []);
      setPreviousStats(trendsRes.data?.previousStats || null);
    } catch (err) {
      console.error(err);
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
      const res = await api.submitReview(text);
      setText('');
      fetchData();
      if (res.data.alert_sent) {
        setAlertToast("Critical negative feedback detected. Alert email dispatched!");
        setTimeout(() => setAlertToast(null), 5000);
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting feedback");
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
      await api.uploadCsv(formData);
      setFile(null);
      document.querySelector('input[type="file"]').value = '';
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Error uploading CSV");
    } finally {
      setLoading(false);
    }
  };

  // Basic stats logic
  // For the stat cards, we use the period trends so they reflect the selected time range.
  // If we wanted global stats, we'd use `stats` from api.getStats(), but dynamic cards are better.
  const periodTotal = trends.reduce((acc, curr) => acc + curr.total, 0);
  const periodPositive = trends.reduce((acc, curr) => acc + curr.positive, 0);
  const periodNegative = trends.reduce((acc, curr) => acc + Number(curr.negative), 0); // Handle string sums if MySQL returned strings
  const periodNeutral = trends.reduce((acc, curr) => acc + Number(curr.neutral), 0);
  
  // Need to parse string sum from SQL just in case
  const pTotal = parseInt(periodTotal, 10) || 0;
  const pPos = parseInt(periodPositive, 10) || 0;
  const pNeg = parseInt(periodNegative, 10) || 0;
  const pNeu = parseInt(periodNeutral, 10) || 0;

  const negativeRate = pTotal > 0 ? ((pNeg / pTotal) * 100).toFixed(1) : 0;
  
  let rateSubtitle = "Not enough data";
  if (pTotal > 0) {
    if (previousStats && previousStats.negativeRate !== undefined) {
      const diff = negativeRate - previousStats.negativeRate;
      if (Math.abs(diff) < 0.1) {
        rateSubtitle = "No change vs previous period";
      } else if (diff > 0) {
        rateSubtitle = `↑ ${Math.abs(diff).toFixed(1)}% vs previous period`;
      } else {
        rateSubtitle = `↓ ${Math.abs(diff).toFixed(1)}% vs previous period`;
      }
    } else {
      rateSubtitle = "Negative feedback %";
    }
  }

  // Sentiment Distribution Pie Chart (using the period trends data)
  const chartData = [
    { name: 'Positive', value: pPos },
    { name: 'Neutral', value: pNeu },
    { name: 'Negative', value: pNeg },
  ].filter(d => d.value > 0);

  // Format dates for the line charts
  const formatXAxis = (tickItem) => {
    const d = new Date(tickItem);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-12">
      {alertToast && (
        <div className="fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-top-5 fade-in duration-300 font-medium">
          {alertToast}
        </div>
      )}

      {/* Header and Time Range Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Overview</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track and analyze customer feedback sentiment in real-time.</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="h-9 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title="Total Feedback" value={pTotal} subtitle={timeRange === 'all' ? 'All time' : 'Selected period'} />
        <StatCard title="Positive" value={pPos} subtitle={pTotal > 0 ? `${Math.round((pPos/pTotal)*100)}% of total` : ''} />
        <StatCard title="Negative" value={pNeg} subtitle={pTotal > 0 ? `${Math.round((pNeg/pTotal)*100)}% of total` : ''} trendClass="text-rose-600 dark:text-rose-400" />
        <StatCard title="Neutral" value={pNeu} subtitle={pTotal > 0 ? `${Math.round((pNeu/pTotal)*100)}% of total` : ''} />
        <StatCard 
          title="Negative Rate" 
          value={pTotal > 0 ? `${negativeRate}%` : 'N/A'} 
          subtitle={rateSubtitle} 
          trendClass={pTotal > 0 ? (parseFloat(negativeRate) < 15 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400') : ''}
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Trends */}
        <div className="bg-white dark:bg-[#111827] rounded-lg border border-gray-200 dark:border-gray-800 p-5 shadow-sm flex flex-col">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Sentiment Trends</h2>
          {trends.length < 2 ? (
            <div className="flex-1 flex items-center justify-center min-h-[240px] text-sm text-gray-500 dark:text-gray-400">
              Not enough feedback data to show a trend yet.
            </div>
          ) : (
            <div className="w-full h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="date" tickFormatter={formatXAxis} stroke="#6b7280" fontSize={12} tickMargin={10} minTickGap={20} />
                  <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px', padding: '8px 12px' }}
                    itemStyle={{ color: '#fff' }}
                    labelFormatter={formatXAxis}
                  />
                  <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                  <Line type="monotone" dataKey="positive" name="Positive" stroke={SENTIMENT_COLORS.Positive} strokeWidth={2} dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="negative" name="Negative" stroke={SENTIMENT_COLORS.Negative} strokeWidth={2} dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="neutral" name="Neutral" stroke={SENTIMENT_COLORS.Neutral} strokeWidth={2} dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Feedback Volume */}
        <div className="bg-white dark:bg-[#111827] rounded-lg border border-gray-200 dark:border-gray-800 p-5 shadow-sm flex flex-col">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Feedback Volume</h2>
          {trends.length < 2 ? (
            <div className="flex-1 flex items-center justify-center min-h-[240px] text-sm text-gray-500 dark:text-gray-400">
              Not enough feedback data to show volume trends.
            </div>
          ) : (
            <div className="w-full h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="date" tickFormatter={formatXAxis} stroke="#6b7280" fontSize={12} tickMargin={10} minTickGap={20} />
                  <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px', padding: '8px 12px' }}
                    itemStyle={{ color: '#fff' }}
                    labelFormatter={formatXAxis}
                    cursor={{ fill: '#374151', opacity: 0.1 }}
                  />
                  <Bar dataKey="total" name="Total Feedback" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Pie Chart & Add form */}
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-[#111827] rounded-lg border border-gray-200 dark:border-gray-800 p-5 shadow-sm h-[280px] flex flex-col">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 uppercase tracking-wider">Sentiment Distribution</h2>
            {pTotal === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                No data available.
              </div>
            ) : (
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.name]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px', padding: '4px 8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Add Data */}
          <div className="bg-white dark:bg-[#111827] rounded-lg border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">Add Feedback</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste customer review here..."
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 p-2 text-sm h-20 resize-y transition-colors"
              />
              <div className="flex flex-col space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-1.5 px-4 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {loading ? 'Analyzing...' : 'Analyze Text'}
                </button>
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 dark:file:bg-gray-800 dark:file:text-gray-300 hover:file:bg-gray-200 dark:hover:file:bg-gray-700 transition-colors cursor-pointer"
                  />
                  <button
                    type="button"
                    disabled={!file || loading}
                    onClick={handleBulkUpload}
                    className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    Upload CSV
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-[#111827] rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-[#111827]">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Recent Activity</h2>
              <Link to="/reviews" className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">
                View all &rarr;
              </Link>
            </div>
            
            <div className="flex-1 overflow-y-auto p-0 min-h-[400px]">
              {reviews.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No feedback collected yet. Submit some feedback to see it here.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {reviews.map(r => (
                    <div key={r.id} className="p-5 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors group">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 dark:text-gray-100 text-sm leading-relaxed">{r.review_text}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              r.sentiment === 'Positive' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30' :
                              r.sentiment === 'Negative' ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/30' :
                              'bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                            }`}>
                              {r.sentiment}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
                              {r.aspect}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800/30">
                              {(r.confidence * 100).toFixed(0)}% Conf.
                            </span>
                            {!!r.alert_sent && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800/50">
                                Alerted
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                            {timeAgo(r.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
