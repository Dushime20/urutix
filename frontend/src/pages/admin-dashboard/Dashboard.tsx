import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Package, Route, Scale, Banknote,
  AlertTriangle, CheckCircle2, Bell,
  Activity, Eye, BarChart3, Zap, Clock, RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { CardSkeleton } from '../../components/common/LoadingSkeletons';
import { operationalAdminApi } from '../../services/operationalAdminApi';
import { StatCard } from '../../components/EnliteUI';

/* ── Types ─────────────────────────────────────────────────────── */
interface RevenuePoint  { day: string; revenue: number; trips: number }
interface LoadStatusItem { name: string; value: number; color: string }
interface BidPoint       { label: string; bids: number }
interface ActivityItem   { dot: string; title: string; sub: string; time: string }
interface Kpi            { activeTrips: number; openLoads: number; openDisputes: number; revenueToday: number; currency: string }
interface Charts {
  revenueAndTrips: RevenuePoint[];
  loadStatus:      LoadStatusItem[];
  bidActivity:     BidPoint[];
  recentActivity:  ActivityItem[];
  kpi:             Kpi;
}

/* ── Skeleton block ─────────────────────────────────────────────── */
const Skel = ({ h = 'h-4', cls = '' }: { h?: string; cls?: string }) => (
  <div className={`${h} ${cls} bg-slate-100 dark:bg-slate-700 rounded animate-pulse`} />
);

/* ── Custom tooltip ─────────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl border border-slate-700">
      <p className="font-bold mb-1 text-slate-300">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? p.stroke ?? p.fill }}>
          {p.name}: <span className="font-black">
            {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
          </span>
        </p>
      ))}
    </div>
  );
};

/* ── Empty state ─────────────────────────────────────────────────── */
const Empty = ({ h = 'h-[180px]', msg = 'No data available' }: { h?: string; msg?: string }) => (
  <div className={`${h} flex items-center justify-center text-sm text-slate-400 dark:text-slate-500`}>
    {msg}
  </div>
);

/* ── Main dashboard ─────────────────────────────────────────────── */
const TenantOperationalDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [charts, setCharts]   = useState<Charts | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange]     = useState<7 | 30>(7);
  const [error, setError]     = useState<string | null>(null);

  const fetchAll = useCallback(async (days: 7 | 30) => {
    try {
      setLoading(true);
      setError(null);
      const data = await operationalAdminApi.getDashboardCharts(days);
      setCharts(data);
    } catch (e: any) {
      console.error('Dashboard fetch error:', e);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(range); }, [range, fetchAll]);

  const kpi             = charts?.kpi;
  const revenueAndTrips = charts?.revenueAndTrips ?? [];
  const loadStatus      = charts?.loadStatus      ?? [];
  const bidActivity     = charts?.bidActivity     ?? [];
  const recentActivity  = charts?.recentActivity  ?? [];

  const currency = charts?.kpi?.currency || 'USD';

  const fmtCurrency = (n: number) =>
    n >= 1_000_000 ? `${currency} ${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000   ? `${currency} ${(n / 1_000).toFixed(1)}K`
                   : `${currency} ${n.toLocaleString()}`;

  /* ── Loading skeleton ── */
  if (loading) return (
    <div className="space-y-6">
      <Skel h="h-8" cls="w-64" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
        {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Operational Command
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
            Live overview &middot;{' '}
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
          </span>
          {(kpi?.openDisputes ?? 0) > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/30 px-3 py-1.5 rounded-full">
              <AlertTriangle size={12} /> {kpi!.openDisputes} alerts
            </span>
          )}
          <button
            onClick={() => fetchAll(range)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw size={12} /> Refresh
          </button>
          <button
            onClick={() => navigate('/admin-operational/analytics')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <BarChart3 size={13} /> Full Analytics
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard
          title="Active Trips"
          value={kpi?.activeTrips ?? 0}
          icon={<Route size={22} />}
          color="primary"
          variant="classic"
          subtitle="Currently in transit"
          onClick={() => navigate('/admin-operational/trips')}
        />
        <StatCard
          title="Revenue Today"
          value={fmtCurrency(kpi?.revenueToday ?? 0)}
          icon={<Banknote size={22} />}
          color="success"
          variant="classic"
          subtitle="Platform earnings"
          onClick={() => navigate('/admin-operational/financial')}
        />
        <StatCard
          title="Open Loads"
          value={kpi?.openLoads ?? 0}
          icon={<Package size={22} />}
          color="primary"
          variant="classic"
          subtitle="Awaiting assignment"
          onClick={() => navigate('/admin-operational/loads')}
        />
        <StatCard
          title="Active Disputes"
          value={kpi?.openDisputes ?? 0}
          icon={<Scale size={22} />}
          color="error"
          variant="classic"
          subtitle="Requiring attention"
          onClick={() => navigate('/admin-operational/disputes')}
        />
        <StatCard
          title="Active Bids"
          value={bidActivity.reduce((s, d) => s + d.bids, 0)}
          icon={<Truck size={22} />}
          color="primary"
          variant="classic"
          subtitle="Last 7 days"
          onClick={() => navigate('/admin-operational/bidding')}
        />
        <StatCard
          title="System Health"
          value="99.9%"
          icon={<Activity size={22} />}
          color="success"
          variant="classic"
          subtitle="Uptime status"
          onClick={() => navigate('/admin-operational/monitoring')}
        />
      </div>

      {/* ── Charts row 1: Revenue+Trips & Load Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Revenue + Trips area - 2/3 */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white">Revenue &amp; Trips</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{range}-day performance trend</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
                {([7, 30] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md transition-all ${
                      range === r
                        ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >{r}d</button>
                ))}
              </div>
              <button
                onClick={() => navigate('/admin-operational/financial')}
                className="text-[10px] font-black text-primary-500 uppercase tracking-widest hover:underline flex items-center gap-1"
              >
                Details <Eye size={11} />
              </button>
            </div>
          </div>
          {revenueAndTrips.length === 0
            ? <Empty h="h-[220px]" msg="No revenue data for this period" />
            : (
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
                  <XAxis dataKey="day"     tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="revenue" name={`Revenue (${currency})`} stroke="#3b82f6" strokeWidth={2} fill="url(#revGrad)"  dot={false} />
                  <Area type="monotone" dataKey="trips"   name="Trips"         stroke="#10b981" strokeWidth={2} fill="url(#tripGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )
          }
          <div className="flex gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span className="w-3 h-0.5 rounded bg-blue-500" /> Revenue
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span className="w-3 h-0.5 rounded bg-emerald-500" /> Trips
            </span>
          </div>
        </div>

        {/* Load status donut - 1/3 */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <p className="text-sm font-black text-slate-900 dark:text-white mb-0.5">Load Status</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Current distribution</p>
          {loadStatus.length === 0
            ? <Empty h="h-[160px]" msg="No load data" />
            : (
              <>
                <div className="flex justify-center">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie data={loadStatus} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
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
            )
          }
        </div>
      </div>

      {/* ── Charts row 2: Bidding Activity & Recent Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Bid activity bar - 2/3 */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white">Bidding Activity</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Bids placed — last 7 days</p>
            </div>
            <button
              onClick={() => navigate('/admin-operational/bidding')}
              className="text-[10px] font-black text-primary-500 uppercase tracking-widest hover:underline flex items-center gap-1"
            >
              View All <Eye size={11} />
            </button>
          </div>
          {bidActivity.length === 0
            ? <Empty h="h-[180px]" msg="No bid data" />
            : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={bidActivity} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" strokeOpacity={0.6} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis                 tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="bids" name="Bids" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Recent activity feed - 1/3 */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Bell size={14} className="text-amber-500" /> Recent Activity
            </p>
            <button
              onClick={() => navigate('/admin-operational/activity-logs')}
              className="text-[10px] font-black text-primary-500 uppercase tracking-widest hover:underline flex items-center gap-1"
            >
              All Logs <Eye size={11} />
            </button>
          </div>
          {recentActivity.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-4">
              <CheckCircle2 size={28} className="text-emerald-500 mb-2" />
              <p className="text-xs font-semibold">No recent activity</p>
            </div>
          ) : (
            <div className="flex-1 space-y-0 overflow-auto">
              {recentActivity.map((item, i) => (
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
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.sub}</p>
                  </div>
                  <span className="text-[9px] font-semibold text-slate-300 dark:text-slate-600 whitespace-nowrap mt-0.5">{item.time}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Load Volume Trend & Quick Stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Load volume line chart - 2/3 */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white">Load Volume Trend</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Loads across the period</p>
            </div>
            <button
              onClick={() => navigate('/admin-operational/loads')}
              className="text-[10px] font-black text-primary-500 uppercase tracking-widest hover:underline flex items-center gap-1"
            >
              Manage <Eye size={11} />
            </button>
          </div>
          {revenueAndTrips.length === 0
            ? <Empty h="h-[160px]" msg="No load trend data" />
            : (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={revenueAndTrips} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" strokeOpacity={0.6} />
                  <XAxis dataKey="day"  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis               tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="trips" name="Trips"
                    stroke="#f59e0b" strokeWidth={2.5}
                    dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Quick stats - 1/3 */}
        <div className="grid grid-cols-2 gap-3 content-start">
          {[
            { icon: <CheckCircle2 size={15} className="text-emerald-500" />, label: 'Open Disputes', value: kpi?.openDisputes ?? 0, bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { icon: <AlertTriangle size={15} className="text-orange-500" />, label: 'Open Loads',    value: kpi?.openLoads    ?? 0, bg: 'bg-orange-50 dark:bg-orange-900/20'  },
            { icon: <Clock size={15} className="text-blue-500" />,           label: 'Active Trips',  value: kpi?.activeTrips  ?? 0, bg: 'bg-blue-50 dark:bg-blue-900/20'     },
            { icon: <Zap size={15} className="text-violet-500" />,           label: 'Bids This Week', value: bidActivity.reduce((s, d) => s + d.bids, 0), bg: 'bg-violet-50 dark:bg-violet-900/20' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl px-4 py-4 flex items-center gap-3`}>
              {s.icon}
              <div>
                <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{s.value}</p>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
          {(kpi?.openDisputes ?? 0) > 0 && (
            <div className="col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4">
              <p className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                <Bell size={13} className="text-amber-500" /> System Alerts
              </p>
              <div className="space-y-2">
                {(kpi?.openLoads ?? 0) > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <Package size={13} className="text-amber-500 flex-shrink-0" />
                    <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                      {kpi!.openLoads} loads awaiting assignment
                    </p>
                  </div>
                )}
                {(kpi?.openDisputes ?? 0) > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                    <Scale size={13} className="text-rose-500 flex-shrink-0" />
                    <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                      {kpi!.openDisputes} disputes need attention
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default TenantOperationalDashboard;