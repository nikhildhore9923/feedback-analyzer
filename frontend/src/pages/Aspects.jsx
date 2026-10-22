import { useState, useEffect } from 'react';
import { api } from '../api';
import { formatFeedback } from '../utils/textFormat';
import { 
  BarChart3, 
  Truck, 
  Smartphone, 
  Headphones, 
  CreditCard, 
  Sparkles, 
  Star, 
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Layers,
  Activity
} from 'lucide-react';

const ASPECT_CONFIG = {
  'Delivery': {
    icon: Truck,
    color: 'indigo',
    bg: 'bg-indigo-50 dark:bg-indigo-950/60',
    border: 'border-indigo-200 dark:border-indigo-800/60',
    text: 'text-indigo-600 dark:text-indigo-400',
    description: 'Shipping speed, packaging condition, carrier reliability, and order tracking.'
  },
  'App/Website': {
    icon: Smartphone,
    color: 'sky',
    bg: 'bg-sky-50 dark:bg-sky-950/60',
    border: 'border-sky-200 dark:border-sky-800/60',
    text: 'text-sky-600 dark:text-sky-400',
    description: 'Mobile responsiveness, checkout stability, crash logs, and navigation flow.'
  },
  'Customer Service': {
    icon: Headphones,
    color: 'violet',
    bg: 'bg-violet-50 dark:bg-violet-950/60',
    border: 'border-violet-200 dark:border-violet-800/60',
    text: 'text-violet-600 dark:text-violet-400',
    description: 'Support response latency, ticket resolution quality, and refund handling.'
  },
  'Pricing': {
    icon: CreditCard,
    color: 'amber',
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    border: 'border-amber-200 dark:border-amber-800/60',
    text: 'text-amber-600 dark:text-amber-400',
    description: 'Value perception, subscription tiers, transparent billing, and invoice clarity.'
  },
  'Product Quality': {
    icon: Star,
    color: 'emerald',
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    text: 'text-emerald-600 dark:text-emerald-400',
    description: 'Durability, design craftsmanship, feature completeness, and expectations met.'
  }
};

export default function Aspects() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAspect, setSelectedAspect] = useState('ALL');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await api.getReviews({ limit: 100 });
        setReviews(res.data?.data || []);
      } catch (err) {
        console.error('Failed to load aspect reviews:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute aspect-level telemetry
  const aspectStats = Object.keys(ASPECT_CONFIG).map((aspectName) => {
    const matching = reviews.filter((r) => (r.aspect || 'General') === aspectName);
    const total = matching.length;
    const pos = matching.filter((r) => r.sentiment === 'Positive').length;
    const neg = matching.filter((r) => r.sentiment === 'Negative').length;
    const neu = matching.filter((r) => r.sentiment === 'Neutral').length;
    const posRate = total > 0 ? Math.round((pos / total) * 100) : 0;
    const negRate = total > 0 ? Math.round((neg / total) * 100) : 0;
    const neuRate = total > 0 ? Math.round((neu / total) * 100) : 0;
    const csat = total > 0 ? Math.round(((pos + neu * 0.5) / total) * 100) : 75;

    return {
      name: aspectName,
      total,
      pos,
      neg,
      neu,
      posRate,
      negRate,
      neuRate,
      csat,
      reviews: matching
    };
  });

  const filteredReviews = selectedAspect === 'ALL' 
    ? reviews 
    : reviews.filter((r) => (r.aspect || 'General') === selectedAspect);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Operational Intelligence
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Aspect Driver Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Granular sentiment segmentation across core customer touchpoints and operational drivers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" />
            <span>5 Core Touchpoints Mapped</span>
          </span>
        </div>
      </div>

      {/* Aspect Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {aspectStats.map((stat) => {
          const cfg = ASPECT_CONFIG[stat.name] || ASPECT_CONFIG['Product Quality'];
          const Icon = cfg.icon;
          const isSelected = selectedAspect === stat.name;

          return (
            <button
              key={stat.name}
              type="button"
              onClick={() => setSelectedAspect(isSelected ? 'ALL' : stat.name)}
              className={`p-5 rounded-3xl border text-left transition-all duration-200 cursor-pointer ${
                isSelected 
                  ? 'bg-indigo-50/40 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md' 
                  : 'bg-white dark:bg-[#0E131F] border-slate-200/90 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-2xl ${cfg.bg} border ${cfg.border} ${cfg.text} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {stat.total} items
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                {stat.name}
              </h3>

              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-2xl font-black tabular-nums text-slate-900 dark:text-white tracking-tight">
                  {stat.csat}%
                </span>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                  CSAT Index
                </span>
              </div>

              {/* Mini Segmented Sentiment Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                <div style={{ width: `${stat.posRate}%` }} className="bg-emerald-500 transition-all duration-500" title={`Positive: ${stat.posRate}%`} />
                <div style={{ width: `${stat.neuRate}%` }} className="bg-slate-400 transition-all duration-500" title={`Neutral: ${stat.neuRate}%`} />
                <div style={{ width: `${stat.negRate}%` }} className="bg-rose-500 transition-all duration-500" title={`Negative: ${stat.negRate}%`} />
              </div>

              <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-slate-400">
                <span className="text-emerald-600 dark:text-emerald-400">{stat.posRate}% pos</span>
                <span className="text-rose-600 dark:text-rose-400">{stat.negRate}% neg</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Content Area: Aspect Comparative Benchmark & Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Aspect Benchmark Diagnostic Matrix */}
        <div className="saas-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Operational Touchpoint Matrix
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Comparative satisfaction & friction distribution
                </p>
              </div>
              <BarChart3 className="w-4 h-4 text-indigo-500" />
            </div>

            <div className="space-y-4 mt-6">
              {aspectStats.map((aspect) => {
                const cfg = ASPECT_CONFIG[aspect.name];
                return (
                  <div key={aspect.name} className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-[#080C14] border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${aspect.negRate > 35 ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {aspect.name}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                        {aspect.csat}% CSAT
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden flex">
                      <div style={{ width: `${aspect.posRate}%` }} className="bg-emerald-500 transition-all duration-500" />
                      <div style={{ width: `${aspect.neuRate}%` }} className="bg-slate-400 transition-all duration-500" />
                      <div style={{ width: `${aspect.negRate}%` }} className="bg-rose-500 transition-all duration-500" />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{aspect.total} reviews recorded</span>
                      <span className={aspect.negRate > 30 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-emerald-600 dark:text-emerald-400 font-semibold'}>
                        {aspect.negRate > 30 ? '⚠️ High Friction' : '✓ Healthy Flow'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            💡 Touchpoint classifications are generated in real-time by the multi-class NLP inference engine.
          </div>
        </div>

        {/* Right Column (2/3 width): Filtered Aspect Customer Feedback Stream */}
        <div className="lg:col-span-2 saas-card rounded-3xl p-6 sm:p-7">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Aspect Feedback Explorer
                </h3>
                {selectedAspect !== 'ALL' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                    Filtered: {selectedAspect}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {selectedAspect === 'ALL' 
                  ? 'Showing all incoming classified reviews across all aspects.' 
                  : `Focusing exclusively on customer feedback tagged with ${selectedAspect}.`}
              </p>
            </div>

            {selectedAspect !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedAspect('ALL')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Clear Filter
              </button>
            )}
          </div>

          {filteredReviews.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              No feedback records found for this aspect category.
            </div>
          ) : (
            <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
              {filteredReviews.map((r, idx) => {
                const isPos = r.sentiment === 'Positive';
                const isNeg = r.sentiment === 'Negative';
                const formatted = formatFeedback(r.review_text);

                return (
                  <div
                    key={r.id}
                    className={`p-4 rounded-2xl border transition-all duration-200 bg-white dark:bg-[#080C14] ${
                      isPos
                        ? 'border-l-4 border-l-emerald-500 border-slate-200/90 dark:border-slate-800/80'
                        : isNeg
                        ? 'border-l-4 border-l-rose-500 border-slate-200/90 dark:border-slate-800/80'
                        : 'border-l-4 border-l-slate-400 border-slate-200/90 dark:border-slate-800/80'
                    } shadow-xs hover:shadow-md`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
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

                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                          {r.aspect || 'General'}
                        </span>

                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-50 dark:bg-[#0B0D13] text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800">
                          REF #{r.id}
                        </span>

                        {r.priority_score >= 80 && (
                          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/60">
                            Critical ({r.priority_score})
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[13px] text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                      {formatted.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
