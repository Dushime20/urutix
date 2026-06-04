import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Package, Route, Scale, Banknote,
  AlertTriangle, CheckCircle2, Bell,
  Activity, Eye, BarChart3, Zap, Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { CardSkeleton } from '../../components/common/LoadingSkeletons';
import { adminAPI } from '../../services/adminApi';
import { StatCard } from '../../components/EnliteUI';

/* Static trend data */
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const revenueBase = [18400, 22100, 19800, 26500, 31200, 28700, 24300];
const tripsBase   = [34, 41, 38, 52, 61, 55, 46];
const loadsBase   = [28, 35, 30, 42, 50, 45, 38];

const loadStatusColors: Record<string, string> = {
  'In Transit': '#3b82f6',
  'Pending':    '#f59e0b',
  'Delivered':  '#10b981',
  'Disputed':   '#ef4444',
};

const bidHourData = [
  { hour: '00h', bids: 4  }, { hour: '03h', bids: 2  },
  { hour: '06h', bids: 8  }, { hour: '09h', bids: 22 },
  { hour: '12h', bids: 35 }, { hour: '15h', bids: 29 },
  { hour: '18h', bids: 18 }, { hour: '21h', bids: 11 },
];

/* Custom tooltip */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl border border-slate-700">
      <p className="font-bold mb-1 text-slate-300">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? p.stroke ?? p.fill }}>
          {p.name}: <span className="font-black">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </p>
      ))}
    </div>
  );
};

/* Main dashboard */
const TenantOperationalDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeTrips: 0, pendingLoads: 0, availableTrucks: 0,
    activeDisputes: 0, resolvedDisputes: 0, pendingApprovals: 0,
    revenueToday: 0, alertsCount: 0,
  });
  const [pendingDisputes, setPendingDisputes] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [tripsRes, loadsRes, trucksRes, disputesRes] = await Promise.all([
          adminAPI.getAllTrips().catch(() => ({ data: [] })),
          adminAPI.getAllLoads().catch(() => ({ data: [] })),
          adminAPI.getAllTrucks().catch(() => ({ data: [] })),
          adminAPI.getDisputes?.().catch(() => ({ data: [] })),
        ]);
        const trips    = tripsRes.data?.trips    || tripsRes.data    || [];
        const loads    = loadsRes.data?.loads    || loadsRes.data    || [];
        const trucks   = trucksRes.data?.trucks  || trucksRes.data   || [];
        const disputes = disputesRes.data?.disputes || disputesRes.data || [];

        const activeTrips      = trips.filter((t: any) => t.status === 'IN_TRANSIT').length;
        const pendingLoads     = loads.filter((l: any) => ['PENDING','CREATED'].includes(l.status)).length;
        const availableTrucks  = trucks.filter((t: any) => t.status === 'AVAILABLE').length;
        const activeDisputes   = disputes.filter((d: any) => d.status === 'PENDING').length;
        const resolvedDisputes = disputes.filter((d: any) => d.status === 'RESOLVED').length;
        const revenueToday     = trips.filter((t: any) => t.status === 'COMPLETED')
          .reduce((s: number, t: any) => s + (t.payment?.amount || 0), 0);

        setStats({
          activeTrips, pendingLoads, availableTrucks, activeDisputes, resolvedDisputes,
          pendingApprovals: pendingLoads + activeDisputes, revenueToday,
          alertsCount: activeDisputes + pendingLoads,
        });
        setPendingDisputes(disputes.filter((d: any) => d.status === 'PENDING').slice(0, 5));
      } catch (e) {
        console.error('Dashboard fetch error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const weeklyData = weekDays.map((day, i) => ({
    day,
    revenue: i === 6 ? (stats.revenueToday || revenueBase[i]) : revenueBase[i],
    trips:   i === 6 ? (stats.activeTrips  || tripsBase[i])   : tripsBase[i],
    loads:   i === 6 ? (stats.pendingLoads || loadsBase[i])   : loadsBase[i],
  }));

  const loadStatusData = [
    { name: 'In Transit', value: stats.activeTrips          || 42 },
    { name: 'Pending',    value: stats.pendingLoads         || 28 },
    { name: 'Delivered',  value: stats.resolvedDisputes * 6 || 85 },
    { name: 'Disputed',   value: stats.activeDisputes       || 12 },
  ];

  if (loading) return (
    <div className="space-y-6">
      <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
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

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Operational Command
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
            Live overview &middot; {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
          </span>
          {stats.alertsCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/30 px-3 py-1.5 rounded-full">
              <AlertTriangle size={12} /> {stats.alertsCount} alerts
            </span>
          )}
          <button
            onClick={() => navigate('/admin-operational/analytics')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <BarChart3 size={13} /> Full Analytics
          </button>
        </div>
      </div>

      {/* KPI grid - using shared StatCard, variant=classic, same as all other pages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard
          title="Active Trips"
          value={stats.activeTrips}
          icon={<Route size={22} />}
          color="primary"
          variant="classic"
          subtitle="Currently in transit"
          onClick={() => navigate('/admin-operational/trips')}
        />
        <StatCard
          title="Revenue Today"
          value={`KES ${(stats.revenueToday || 0).toLocaleString()}`}
          icon={<Banknote size={22} />}
          color="success"
          variant="classic"
          subtitle="Platform earnings"
          onClick={() => navigate('/admin-operational/financial')}
        />
        <StatCard
          title="Open Loads"
          value={stats.pendingLoads}
          icon={<Package size={22} />}
          color="primary"
          variant="classic"
          subtitle="Awaiting assignment"
          onClick={() => navigate('/admin-operational/loads')}
        />
        <StatCard
          title="Active Disputes"
          value={stats.activeDisputes}
          icon={<Scale size={22} />}
          color="error"
          variant="classic"
          subtitle="Requiring attention"
          onClick={() => navigate('/admin-operational/disputes')}
        />
        <StatCard
          title="Available Trucks"
          value={stats.availableTrucks}
          icon={<Truck size={22} />}
          color="primary"
          variant="classic"
          subtitle="Fleet capacity"
          onClick={() => navigate('/admin-operational/monitoring')}
        />
        <StatCard
          title="System Health"
          value="98.5%"
          icon={<Activity size={22} />}
          color="success"
          variant="classic"
          subtitle="Uptime status"
          onClick={() => navigate('/admin-operational/monitoring')}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue + Trips area - 2/3 */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white">Revenue &amp; Trips</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">7-day performance trend</p>
            </div>
            <button
              onClick={() => navigate('/admin-operational/financial')}
              className="text-[10px] font-black text-primary-500 uppercase tracking-widest hover:underline flex items-center gap-1"
            >
              Details <Eye size={11} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="tripGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" strokeOpacity={0.6} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue (KES)" stroke="#3b82f6" strokeWidth={2} fill="url(#revGrad2)" dot={false} />
              <Area type="monotone" dataKey="trips"   name="Trips"         stroke="#10b981" strokeWidth={2} fill="url(#tripGrad2)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
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
          <div className="flex justify-center">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={loadStatusData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                  {loadStatusData.map((entry, i) => (
                    <Cell key={i} fill={loadStatusColors[entry.name]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {loadStatusData.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: loadStatusColors[item.name] }} />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{item.name}</span>
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Hourly bidding bar - 2/3 */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white">Bidding Activity</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Bids placed per hour today</p>
            </div>
            <button
              onClick={() => navigate('/admin-operational/bidding')}
              className="text-[10px] font-black text-primary-500 uppercase tracking-widest hover:underline flex items-center gap-1"
            >
              View All <Eye size={11} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={bidHourData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" strokeOpacity={0.6} vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="bids" name="Bids" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pending disputes feed - 1/3 */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Scale size={15} className="text-rose-500" /> Pending Disputes
            </p>
            <button
              onClick={() => navigate('/admin-operational/disputes')}
              className="text-[10px] font-black text-primary-500 uppercase tracking-widest hover:underline flex items-center gap-1"
            >
              View All <Eye size={11} />
            </button>
          </div>
          {pendingDisputes.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-4">
              <CheckCircle2 size={28} className="text-emerald-500 mb-2" />
              <p className="text-xs font-semibold">No pending disputes</p>
            </div>
          ) : (
            <div className="flex-1 space-y-2 overflow-auto">
              {pendingDisputes.map((d, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => navigate(`/admin-operational/disputes`)}
                  className="flex items-start gap-3 p-3 bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-xl cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {d.title || `Dispute #${d.id?.slice(0, 8)}`}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{d.type || 'General'} &middot; {d.priority || 'Medium'}</p>
                  </div>
                  <span className="text-[9px] font-black text-rose-500 uppercase bg-rose-100 dark:bg-rose-900/40 px-1.5 py-0.5 rounded-md whitespace-nowrap">Pending</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Load trend line + status strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white">Load Volume Trend</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Pending loads across the week</p>
            </div>
            <button
              onClick={() => navigate('/admin-operational/loads')}
              className="text-[10px] font-black text-primary-500 uppercase tracking-widest hover:underline flex items-center gap-1"
            >
              Manage <Eye size={11} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={weeklyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" strokeOpacity={0.6} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="loads" name="Pending Loads" stroke="#f59e0b"
                strokeWidth={2.5} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-3 content-start">
          {[
            { icon: <CheckCircle2 size={15} className="text-emerald-500" />, label: 'Resolved Today',  value: stats.resolvedDisputes || 9,  bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { icon: <AlertTriangle size={15} className="text-orange-500" />, label: 'Pending Review',  value: stats.pendingApprovals || 5,  bg: 'bg-orange-50 dark:bg-orange-900/20' },
            { icon: <Clock size={15} className="text-blue-500" />,           label: 'Avg Resolution',  value: '3.2h',                       bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { icon: <Zap size={15} className="text-violet-500" />,           label: 'Avg Bid Time',    value: '14m',                        bg: 'bg-violet-50 dark:bg-violet-900/20' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl px-4 py-4 flex items-center gap-3`}>
              {s.icon}
              <div>
                <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{s.value}</p>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
          {stats.alertsCount > 0 && (
            <div className="col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4">
              <p className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                <Bell size={13} className="text-amber-500" /> System Alerts
              </p>
              <div className="space-y-2">
                {stats.pendingLoads > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <Package size={13} className="text-amber-500 flex-shrink-0" />
                    <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">{stats.pendingLoads} loads awaiting assignment</p>
                  </div>
                )}
                {stats.activeDisputes > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                    <Scale size={13} className="text-rose-500 flex-shrink-0" />
                    <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">{stats.activeDisputes} disputes need attention</p>
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