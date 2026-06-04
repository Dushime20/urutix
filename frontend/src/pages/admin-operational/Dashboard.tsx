import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Gavel, DollarSign, TrendingUp, Activity,
  Route, Package,
  Clock, CheckCircle2, AlertCircle, Zap,
  BarChart3, Eye, RefreshCw,
} from 'lucide-react';
import { TranslatedText } from '../../components/translated-text';
import { StatCard } from '../../components/EnliteUI';
import { operationalAdminApi } from '../../services/operationalAdminApi';

/* ─── Types ─────────────────────────────────────────────────────── */

interface RevenuePoint { day: string; revenue: number; trips: number }
interface LoadStatusItem { name: string; value: number; color: string }
interface BidPoint { label: string; bids: number }
interface ActivityItem { dot: string; title: string; sub: string; time: string; type: string }
interface Kpi { activeTrips: number; openLoads: number; openDisputes: number; revenueToday: number }

interface DashboardCharts {
  revenueAndTrips: RevenuePoint[];
  loadStatus: LoadStatusItem[];
  bidActivity: BidPoint[];
  recentActivity: ActivityItem[];
  kpi: Kpi;
}

/* ─── Skeleton loader ───────────────────────────────────────────── */

const SkeletonBlock: React.FC<{ h?: string; rounded?: string }> = ({
  h = 'h-4',
  rounded = 'rounded',
}) => (
  <div className={`${h} ${rounded} bg-slate-100 dark:bg-slate-700 animate-pulse`} />
);

/* ─── Custom tooltip ────────────────────────────────────────────── */

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl">
      <p className="font-bold mb-1 text-slate-300">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <span className="font-black">{p.value?.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
};

/* ─── Main dashboard ────────────────────────────────────────────── */

const AdminOperationalDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [revenueRange, setRevenueRange] = useState<7 | 30>(7);
  const [data, setData] = useState<DashboardCharts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCharts = useCallback(async (days: 7 | 30) => {
    try {
      setLoading(true);
      setError(null);
      const result = await operationalAdminApi.getDashboardCharts(days);
      setData(result);
    } catch (err: any) {
      console.error('Dashboard charts fetch error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCharts(revenueRange);
  }, [revenueRange, fetchCharts]);

  const kpi = data?.kpi;
  const revenueAndTrips = data?.revenueAndTrips ?? [];
  const loadStatus = data?.loadStatus ?? [];
  const bidActivity = data?.bidActivity ?? [];
  const recentActivity = data?.recentActivity ?? [];

  const formatCurrency = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
      ? `$${(n / 1_000).toFixed(1)}K`
      : `$${n.toLocaleString()}`;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            <TranslatedText text="Operational Command" />
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
            <TranslatedText text="Live overview of platform activity" />
            {' — '}{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
          <button
            onClick={() => fetchCharts(revenueRange)}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <TranslatedText text="Refresh" />
          </button>
          <button
            onClick={() => navigate('/admin-operational/analytics')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <BarChart3 size={13} />
            <TranslatedText text="Full Analytics" />
          </button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* ── KPI grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Active Trips"
          value={loading ? '—' : (kpi?.activeTrips ?? 0)}
          icon={<Route size={18} />}
          color="info"
          variant="classic"
          subtitle="Currently in progress"
          onClick={() => navigate('/admin-operational/trips')}
        />
        <StatCard
          title="Revenue Today"
          value={loading ? '—' : formatCurrency(kpi?.revenueToday ?? 0)}
          icon={<DollarSign size={18} />}
          color="emerald"
          variant="classic"
          subtitle="Platform earnings"
          onClick={() => navigate('/admin-operational/financial')}
        />
        <StatCard
          title="Open Loads"
          value={loading ? '—' : (kpi?.openLoads ?? 0)}
          icon={<Package size={18} />}
          color="accent"
          variant="classic"
          subtitle="Awaiting assignment"
          onClick={() => navigate('/admin-operational/loads')}
        />
        <StatCard
          title="Active Disputes"
          value={loading ? '—' : (kpi?.openDisputes ?? 0)}
          icon={<Gavel size={18} />}
          color="warning"
          variant="classic"
          subtitle="Requiring attention"
          onClick={() => navigate('/admin-operational/disputes')}
        />
        <StatCard
          title="Active Bids"
          value={loading ? '—' : (bidActivity.reduce((s, d) => s + d.bids, 0))}
          icon={<TrendingUp size={18} />}
          color="pink"
          variant="classic"
          subtitle="Last 7 days"
          onClick={() => navigate('/admin-operational/bidding')}
        />
        <StatCard
          title="System Health"
          value="99.9%"
          icon={<Activity size={18} />}
          color="success"
          variant="classic"
          subtitle="Uptime status"
          onClick={() => navigate('/admin-operational/monitoring')}
        />
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Revenue & Trips area chart — 2/3 width */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white">
                <TranslatedText text="Revenue & Trips" />
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {revenueRange}-day performance trend
              </p>
            </div>
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
              {([7, 30] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setRevenueRange(r)}
                  className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md transition-all ${
                    revenueRange === r
                      ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >{r}d</button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              <SkeletonBlock h="h-[220px]" rounded="rounded-xl" />
            </div>
          ) : revenueAndTrips.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-sm text-slate-400">
              No data for this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueAndTrips} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="tripGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" strokeOpacity={0.6} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#3b82f6" strokeWidth={2} fill="url(#revGrad)" dot={false} />
                <Area type="monotone" dataKey="trips"   name="Trips"       stroke="#10b981" strokeWidth={2} fill="url(#tripGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}

          <div className="flex gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span className="w-3 h-0.5 rounded bg-blue-500" /> Revenue
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span className="w-3 h-0.5 rounded bg-emerald-500" /> Trips
            </span>
          </div>
        </div>

        {/* Load status donut — 1/3 width */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <p className="text-sm font-black text-slate-900 dark:text-white mb-0.5">
            <TranslatedText text="Load Status" />
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">
            <TranslatedText text="Current distribution" />
          </p>

          {loading ? (
            <div className="space-y-3">
              <SkeletonBlock h="h-[170px]" rounded="rounded-full mx-auto w-[170px]" />
              <SkeletonBlock h="h-3" />
              <SkeletonBlock h="h-3" />
              <SkeletonBlock h="h-3" />
            </div>
          ) : loadStatus.length === 0 ? (
            <div className="h-[170px] flex items-center justify-center text-sm text-slate-400">
              No load data
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <ResponsiveContainer width={170} height={170}>
                  <PieChart>
                    <Pie
                      data={loadStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {loadStatus.map((entry, i) => (
                        <Cell key={i} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {loadStatus.map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{item.name}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Bid activity bar + Recent activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Bid activity bar chart — last 7 days */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white">
                <TranslatedText text="Bidding Activity" />
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                <TranslatedText text="Bids placed — last 7 days" />
              </p>
            </div>
            <button
              onClick={() => navigate('/admin-operational/bidding')}
              className="text-[10px] font-black text-primary-500 uppercase tracking-widest hover:underline flex items-center gap-1"
            >
              <TranslatedText text="View All" />
              <Eye size={11} />
            </button>
          </div>

          {loading ? (
            <SkeletonBlock h="h-[180px]" rounded="rounded-xl" />
          ) : bidActivity.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-sm text-slate-400">
              No bid data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={bidActivity} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" strokeOpacity={0.6} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="bids" name="Bids" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent activity feed */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-black text-slate-900 dark:text-white">
              <TranslatedText text="Recent Activity" />
            </p>
            <button
              onClick={() => navigate('/admin-operational/activity-logs')}
              className="text-[10px] font-black text-primary-500 uppercase tracking-widest hover:underline flex items-center gap-1"
            >
              <TranslatedText text="All Logs" />
              <Eye size={11} />
            </button>
          </div>

          <div className="flex-1 space-y-0">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                  <div className="w-2 h-2 rounded-full mt-1.5 bg-slate-200 dark:bg-slate-700 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <SkeletonBlock h="h-3" />
                    <SkeletonBlock h="h-2" />
                  </div>
                </div>
              ))
            ) : recentActivity.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No recent activity</p>
            ) : (
              recentActivity.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 py-2.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0"
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${item.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.title}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{item.sub}</p>
                  </div>
                  <span className="text-[9px] font-semibold text-slate-300 dark:text-slate-600 whitespace-nowrap mt-0.5">
                    {item.time}
                  </span>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Quick status strip — from kpi data ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            icon: <CheckCircle2 size={15} className="text-emerald-500" />,
            label: 'Open Disputes',
            value: loading ? '—' : String(kpi?.openDisputes ?? 0),
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          },
          {
            icon: <AlertCircle size={15} className="text-orange-500" />,
            label: 'Open Loads',
            value: loading ? '—' : String(kpi?.openLoads ?? 0),
            bg: 'bg-orange-50 dark:bg-orange-900/20',
          },
          {
            icon: <Clock size={15} className="text-blue-500" />,
            label: 'Active Trips',
            value: loading ? '—' : String(kpi?.activeTrips ?? 0),
            bg: 'bg-blue-50 dark:bg-blue-900/20',
          },
          {
            icon: <Zap size={15} className="text-violet-500" />,
            label: 'Bids This Week',
            value: loading ? '—' : String(bidActivity.reduce((s, d) => s + d.bids, 0)),
            bg: 'bg-violet-50 dark:bg-violet-900/20',
          },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl px-4 py-3 flex items-center gap-3`}>
            {s.icon}
            <div>
              <p className="text-base font-black text-slate-900 dark:text-white leading-none">{s.value}</p>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                <TranslatedText text={s.label} />
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default AdminOperationalDashboard;
