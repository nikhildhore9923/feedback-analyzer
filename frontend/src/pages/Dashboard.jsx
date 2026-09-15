import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

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
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [alertToast, setAlertToast] = useState(null);

  const fetchData = async () => {
    try {
      const [reviewsRes, statsRes] = await Promise.all([
        api.getReviews({ limit: 10 }),
        api.getStats()
      ]);
      setReviews(reviewsRes.data.data || []);
      setStats(statsRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const total = stats.reduce((acc, curr) => acc + curr.count, 0);
  const positive = stats.find(s => s.sentiment === 'Positive')?.count || 0;
  const negative = stats.find(s => s.sentiment === 'Negative')?.count || 0;
  const neutral = stats.find(s => s.sentiment === 'Neutral')?.count || 0;
  const chartData = [
    { name: 'Positive', value: positive },
    { name: 'Neutral', value: neutral },
    { name: 'Negative', value: negative },
  ].filter(d => d.value > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Toast Notification */}
      {alertToast && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 font-medium">
          {alertToast}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Overview</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track and analyze customer feedback sentiment in real-time.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Feedback" value={total.toLocaleString()} subtitle="All time" />
        <StatCard title="Positive" value={positive.toLocaleString()} subtitle={`${total ? Math.round((positive/total)*100) : 0}% of total`} />
        <StatCard title="Negative" value={negative.toLocaleString()} subtitle={`${total ? Math.round((negative/total)*100) : 0}% of total`} trendClass="text-rose-600 dark:text-rose-400" />
        <StatCard title="Neutral" value={neutral.toLocaleString()} subtitle={`${total ? Math.round((neutral/total)*100) : 0}% of total`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Analytics */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white dark:bg-[#111827] rounded-lg border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col h-[340px]">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-6 uppercase tracking-wider">Sentiment Distribution</h2>
            {total === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                No data available.
              </div>
            ) : (
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.name]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px' }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Add Data */}
          <div className="bg-white dark:bg-[#111827] rounded-lg border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Add Feedback</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste customer review here..."
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 p-3 text-sm min-h-[100px] resize-y transition-colors"
              />
              <div className="flex flex-col space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-2 px-4 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {loading ? 'Analyzing...' : 'Analyze Text'}
                </button>
                <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 dark:file:bg-gray-800 dark:file:text-gray-300 hover:file:bg-gray-200 dark:hover:file:bg-gray-700 transition-colors cursor-pointer"
                  />
                  <button
                    type="button"
                    disabled={!file || loading}
                    onClick={handleBulkUpload}
                    className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 text-sm font-medium transition-colors whitespace-nowrap"
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
            
            <div className="flex-1 overflow-y-auto p-0">
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
