import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const SENTIMENT_COLORS = {
  Positive: '#14b8a6', // indigo-500
  Negative: '#ef4444', // red-500
  Neutral: '#9ca3af',  // gray-400
};

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const utcDate = new Date(timestamp);
  if (isNaN(utcDate.getTime())) return 'Invalid Date';
  
  const diff = Math.floor((Date.now() - utcDate.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return utcDate.toLocaleDateString();
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
      await fetchData();
      
      if (res.data.sentiment === 'Negative') {
        setAlertToast("Critical negative feedback detected. An email alert has been sent to your team.");
        setTimeout(() => setAlertToast(null), 5000);
      }
    } catch (err) {
      alert('Could not reach the analysis service. Is it running?');
    }
    setLoading(false);
  };

  const handleBulkUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setLoading(true);
    try {
      await api.uploadCsv(formData);
      setFile(null);
      await fetchData();
    } catch (err) {
      alert('Bulk upload failed. Check the CSV format.');
    }
    setLoading(false);
  };

  const total = stats.reduce((acc, curr) => acc + curr.count, 0);
  const countFor = (label) => stats.find((s) => s.sentiment === label)?.count || 0;
  const positive = countFor('Positive');
  const negative = countFor('Negative');
  const netScore = total > 0 ? Math.round(((positive - negative) / total) * 100) : 0;
  const urgentCount = reviews.filter((r) => r.alert_sent).length;

  const chartData = stats.map(s => ({
    name: s.sentiment,
    value: s.count
  }));

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 relative">
      
      {/* Toast Notification */}
      {alertToast && (
        <div className="fixed top-4 right-4 z-50 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg animate-bounce duration-300 transition-all flex items-center gap-3">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          <span className="font-medium text-sm">{alertToast}</span>
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Feedback Intelligence</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Analyze, categorize, and act on customer feedback.</p>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-900/20 dark:bg-[#111827] dark:border-gray-800">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Analyzed</div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{total}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-900/20 dark:bg-[#111827] dark:border-gray-800">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Sentiment Score</div>
          <div className={`mt-2 text-3xl font-bold ${netScore > 0 ? 'text-indigo-600 dark:text-indigo-400' : netScore < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
            {netScore > 0 ? '+' : ''}{netScore}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-900/20 dark:bg-[#111827] dark:border-gray-800">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Critical Alerts</div>
          <div className={`mt-2 text-3xl font-bold ${urgentCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
            {urgentCount}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-900/20 dark:bg-[#111827] dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Submit Feedback</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste a customer review..."
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-3 min-h-[100px]"
              />
              <div className="flex flex-col space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-all duration-300 active:scale-95 shadow-md shadow-indigo-500/20 font-medium"
                >
                  {loading ? 'Analyzing...' : 'Analyze'}
                </button>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t dark:border-gray-700">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-gray-700 dark:file:text-indigo-400 hover:file:bg-indigo-100 flex-1 w-full"
                  />
                  <button
                    type="button"
                    disabled={!file || loading}
                    onClick={handleBulkUpload}
                    className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 text-sm font-medium w-full sm:w-auto shadow-sm transition-all duration-300 active:scale-95"
                  >
                    Upload CSV
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-900/20 dark:bg-[#111827] dark:border-gray-800 h-[300px] flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Overall Distribution</h2>
            {total === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No data available.</p>
            ) : (
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.name]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', border: 'none', borderRadius: '8px', color: '#fff' }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-900/20 dark:bg-[#111827] dark:border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Feedback</h2>
              <Link to="/reviews" className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">
                View all →
              </Link>
            </div>
            
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No feedback yet.</p>
              ) : (
                reviews.map(r => (
                  <div key={r.id} className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <p className="text-gray-800 dark:text-gray-200 text-sm">{r.review_text}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <span className={`px-2 py-1 text-xs rounded-md font-medium ${
                            r.sentiment === 'Positive' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                            r.sentiment === 'Negative' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {r.sentiment} ({(r.confidence * 100).toFixed(0)}%)
                          </span>
                          <span className="px-2 py-1 text-xs rounded-md font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            {r.aspect}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-md font-medium ${
                            r.status === 'New' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                            r.status === 'Resolved' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {r.status}
                          </span>
                          {!!r.alert_sent && (
                            <span className="px-2 py-1 text-xs rounded-md font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
                              Alert Sent
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {timeAgo(r.timestamp)}
                      </span>
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
