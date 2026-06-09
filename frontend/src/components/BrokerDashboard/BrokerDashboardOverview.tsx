import React, { useEffect, useState } from 'react';
import {
  TrendingUp, CheckCircle,
  DollarSign, FileText, Scale,
  Clock, ShieldCheck, Banknote, BarChart2, Activity, Package, Navigation,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { brokerAPI } from '../../services/brokerApi';
import { useAuth } from '../../contexts/AuthContext';
import { StatCard } from '../EnliteUI/Cards/StatCard';

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `$${(n / 1_000).toFixed(1)}K`
    : `$${n.toFixed(0)}`;

const pct = (a: number, b: number) =>
  b === 0 ? 0 : Math.round(((a - b) / b) * 100);

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

// ─── main component ────────────────────────────────────────────────────────────
interface BrokerDashboardOverviewProps {
  stats: {
    totalAssigned: number;
    activeAuctions: number;
    inTransit: number;
    delivered: number;
  };
}

export const BrokerDashboardOverview: React.FC<BrokerDashboardOverviewProps> = ({ stats }) => {
  const { user } = useAuth();

  // ── extended stats from API ──────────────────────────────────────────────────
  const [brokerStats, setBrokerStats] = useState<any>(null);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [escrows, setEscrows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    Promise.allSettled([
      brokerAPI.getBrokerStatistics(user.id),
      brokerAPI.getBrokerCommissions(user.id),
      brokerAPI.getContracts(),
      brokerAPI.getDisputes(),
      brokerAPI.getEscrows(),
    ]).then(([statsRes, comRes, conRes, disRes, escRes]) => {
      if (statsRes.status === 'fulfilled') {
        const d = statsRes.value?.data;
        setBrokerStats(d?.data ?? d ?? null);
      }
      if (comRes.status === 'fulfilled') {
        const d = comRes.value?.data;
        setCommissions(Array.isArray(d?.data?.commissions) ? d.data.commissions : Array.isArray(d?.commissions) ? d.commissions : []);
      }
      if (conRes.status === 'fulfilled') {
        const d = conRes.value?.data;
        setContracts(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []);
      }
      if (disRes.status === 'fulfilled') {
        const d = disRes.value?.data;
        setDisputes(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []);
      }
      if (escRes.status === 'fulfilled') {
        const d = escRes.value?.data;
        setEscrows(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []);
      }
    }).finally(() => setLoading(false));
  }, [user?.id]);

  // ── derived values ──────────────────────────────────────────────────────────
  const totalEarned    = brokerStats?.totalEarned    ?? 0;
  const totalPending   = brokerStats?.totalPending   ?? 0;
  const totalApproved  = brokerStats?.totalApproved  ?? 0;
  const avgCommRate    = brokerStats?.averageCommissionRate ?? 0;
  const totalLoads     = brokerStats?.totalLoads     ?? stats.totalAssigned;

  const escrowFunded   = escrows.filter(e => e.status === 'FUNDED').reduce((s, e) => s + (e.totalAmount || 0), 0);
  const escrowReleased = escrows.filter(e => e.status === 'RELEASED').reduce((s, e) => s + (e.totalAmount || 0), 0);

  const openDisputes   = disputes.filter(d => ['OPEN', 'UNDER_REVIEW', 'MEDIATION'].includes(d.status)).length;
  const resolvedDisputes = disputes.filter(d => d.status === 'RESOLVED').length;

  const activeContracts   = contracts.filter(c => ['ACTIVE', 'SIGNED'].includes(c.status)).length;
  const pendingContracts  = contracts.filter(c => ['PENDING_SIGNATURE', 'PARTIALLY_SIGNED', 'PENDING_BROKER_ACCEPTANCE'].includes(c.status)).length;
  const draftContracts    = contracts.filter(c => c.status === 'DRAFT').length;

  // ── commission trend chart data (last 6 months from commissions) ─────────────
  const trendData = React.useMemo(() => {
    const months: Record<string, { month: string; earned: number; pending: number; approved: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      months[key] = { month: key, earned: 0, pending: 0, approved: 0 };
    }
    commissions.forEach(c => {
      const d = new Date(c.createdAt);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!months[key]) return;
      if (c.status === 'PAID')     months[key].earned   += c.commissionAmount || 0;
      if (c.status === 'PENDING')  months[key].pending  += c.commissionAmount || 0;
      if (c.status === 'APPROVED') months[key].approved += c.commissionAmount || 0;
    });
    return Object.values(months);
  }, [commissions]);

  // ── cargo status distribution ────────────────────────────────────────────────
  const cargoPieData = [
    { name: 'In Transit', value: stats.inTransit },
    { name: 'Delivered',  value: stats.delivered  },
    { name: 'Assigned',   value: Math.max(0, stats.totalAssigned - stats.inTransit - stats.delivered) },
    { name: 'Auctions',   value: stats.activeAuctions },
  ].filter(d => d.value > 0);

  // ── commission status bar ────────────────────────────────────────────────────
  const commBarData = [
    { name: 'Paid',     value: totalEarned,   fill: '#10B981' },
    { name: 'Approved', value: totalApproved, fill: '#3B82F6' },
    { name: 'Pending',  value: totalPending,  fill: '#F59E0B' },
  ];

  // ── dispute bar chart ─────────────────────────────────────────────────────────
  const disputeCategories = ['DAMAGE', 'DELAY', 'PAYMENT', 'QUALITY', 'ROUTE', 'OTHER'];
  const disputeBarData = disputeCategories.map(cat => ({
    name: cat.charAt(0) + cat.slice(1).toLowerCase(),
    count: disputes.filter(d => d.category === cat).length,
  })).filter(d => d.count > 0);

  return (
    <div className="space-y-6">

      {/* ── Row 1: 6 KPI cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Assigned Cargo"
          value={totalLoads}
          subtitle={`${stats.inTransit} in transit`}
          icon={<Package className="w-5 h-5" />}
          color="primary"
          variant="premium"
        />
        <StatCard
          title="Total Earned"
          value={fmt(totalEarned)}
          subtitle="commissions paid"
          icon={<DollarSign className="w-5 h-5" />}
          color="success"
          variant="premium"
          trend={loading ? undefined : `${Math.abs(pct(totalEarned, totalEarned * 0.85))}%`}
          trendDirection={pct(totalEarned, totalEarned * 0.85) >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Pending Income"
          value={fmt(totalPending + totalApproved)}
          subtitle={`avg rate ${Number(avgCommRate).toFixed(1)}%`}
          icon={<Clock className="w-5 h-5" />}
          color="warning"
          variant="premium"
        />
        <StatCard
          title="Active Contracts"
          value={activeContracts}
          subtitle={`${pendingContracts} pending sig.`}
          icon={<FileText className="w-5 h-5" />}
          color="purple"
          variant="premium"
        />
        <StatCard
          title="Open Disputes"
          value={openDisputes}
          subtitle={`${resolvedDisputes} resolved`}
          icon={<Scale className="w-5 h-5" />}
          color="error"
          variant="premium"
        />
        <StatCard
          title="Escrow Held"
          value={fmt(escrowFunded)}
          subtitle={`${fmt(escrowReleased)} released`}
          icon={<ShieldCheck className="w-5 h-5" />}
          color="info"
          variant="premium"
        />
      </div>

      {/* ── Row 2: Commission trend area chart + Cargo pie ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Commission trend — 2/3 width */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Commission Trend</h3>
              <p className="text-xs text-gray-400 mt-0.5">Last 6 months — earned / approved / pending</p>
            </div>
            <Activity className="w-4 h-4 text-gray-300" />
          </div>
          {trendData.every(d => d.earned === 0 && d.pending === 0 && d.approved === 0) ? (
            <div className="flex items-center justify-center h-48 text-gray-300 text-xs">No commission data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="earnedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="approvedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={v => fmt(v)} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="earned"   name="Paid"     stroke="#10B981" fill="url(#earnedGrad)"   strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="approved" name="Approved" stroke="#3B82F6" fill="url(#approvedGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="pending"  name="Pending"  stroke="#F59E0B" fill="url(#pendingGrad)"  strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Cargo status pie — 1/3 width */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Cargo Status</h3>
              <p className="text-xs text-gray-400 mt-0.5">Distribution by current state</p>
            </div>
            <Navigation className="w-4 h-4 text-gray-300" />
          </div>
          {cargoPieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-300 text-xs">No cargo data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={cargoPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    dataKey="value" paddingAngle={3}>
                    {cargoPieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {cargoPieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-[10px] text-gray-500 truncate">{d.name} <span className="font-bold text-gray-700 dark:text-gray-300">{d.value}</span></span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Row 3: Commission breakdown bar + Dispute categories ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Commission breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Commission Breakdown</h3>
              <p className="text-xs text-gray-400 mt-0.5">Paid · Approved · Pending</p>
            </div>
            <Banknote className="w-4 h-4 text-gray-300" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={commBarData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={v => fmt(v)} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Bar dataKey="value" name="Amount" radius={[6, 6, 0, 0]}>
                {commBarData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* summary row */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            {[
              { label: 'Paid', value: fmt(totalEarned), color: 'text-emerald-600' },
              { label: 'Approved', value: fmt(totalApproved), color: 'text-blue-600' },
              { label: 'Pending', value: fmt(totalPending), color: 'text-amber-600' },
            ].map(item => (
              <div key={item.label} className="text-center">
                <p className={`text-sm font-black ${item.color}`}>{item.value}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dispute categories */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Dispute Categories</h3>
              <p className="text-xs text-gray-400 mt-0.5">{disputes.length} total · {openDisputes} open</p>
            </div>
            <BarChart2 className="w-4 h-4 text-gray-300" />
          </div>
          {disputeBarData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <CheckCircle className="w-10 h-10 text-emerald-300" />
              <p className="text-xs text-gray-400 font-medium">No disputes — great work!</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={disputeBarData} layout="vertical" margin={{ top: 0, right: 16, left: 4, bottom: 0 }} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={56} />
                <Tooltip />
                <Bar dataKey="count" name="Disputes" fill="#EF4444" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          {/* dispute status pills */}
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            {[
              { label: 'Open',     count: disputes.filter(d => d.status === 'OPEN').length,          color: 'bg-red-50 text-red-700' },
              { label: 'Mediation', count: disputes.filter(d => d.status === 'MEDIATION').length,    color: 'bg-amber-50 text-amber-700' },
              { label: 'Resolved', count: resolvedDisputes,                                           color: 'bg-emerald-50 text-emerald-700' },
              { label: 'Escalated', count: disputes.filter(d => d.status === 'ESCALATED').length,   color: 'bg-purple-50 text-purple-700' },
            ].map(s => (
              <span key={s.label} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.color}`}>
                {s.label} {s.count}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 4: Contract status + Escrow summary ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Contract status pills */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Contract Pipeline</h3>
              <p className="text-xs text-gray-400 mt-0.5">{contracts.length} contracts total</p>
            </div>
            <FileText className="w-4 h-4 text-gray-300" />
          </div>
          {contracts.length === 0 ? (
            <p className="text-xs text-gray-400 py-8 text-center">No contracts yet</p>
          ) : (
            <div className="space-y-2.5">
              {[
                { label: 'Active / Signed',     count: activeContracts,  color: 'bg-emerald-500', max: contracts.length },
                { label: 'Pending Signature',   count: pendingContracts, color: 'bg-amber-400',   max: contracts.length },
                { label: 'Draft',               count: draftContracts,   color: 'bg-gray-300',    max: contracts.length },
                { label: 'Completed',           count: contracts.filter(c => c.status === 'COMPLETED').length, color: 'bg-blue-500', max: contracts.length },
                { label: 'Cancelled / Expired', count: contracts.filter(c => ['CANCELLED','EXPIRED'].includes(c.status)).length, color: 'bg-red-400', max: contracts.length },
              ].filter(r => r.count > 0).map(row => (
                <div key={row.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600 dark:text-gray-300">{row.label}</span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{row.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${row.color}`}
                      style={{ width: `${Math.max(4, (row.count / row.max) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Escrow summary */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Escrow Accounts</h3>
              <p className="text-xs text-gray-400 mt-0.5">{escrows.length} accounts managed</p>
            </div>
            <ShieldCheck className="w-4 h-4 text-gray-300" />
          </div>
          {escrows.length === 0 ? (
            <p className="text-xs text-gray-400 py-8 text-center">No escrow accounts yet</p>
          ) : (
            <div className="space-y-3">
              {/* totals */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Funded',   value: fmt(escrowFunded),   color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
                  { label: 'Released', value: fmt(escrowReleased), color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                  { label: 'Disputed', value: escrows.filter(e => e.status === 'DISPUTED').length.toString(), color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
                ].map(item => (
                  <div key={item.label} className={`rounded-xl p-3 text-center ${item.bg}`}>
                    <p className={`text-sm font-black ${item.color}`}>{item.value}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
              {/* status rows */}
              {[
                { status: 'PENDING',            label: 'Pending funding' },
                { status: 'FUNDED',             label: 'Currently funded' },
                { status: 'PARTIALLY_RELEASED', label: 'Partially released' },
                { status: 'RELEASED',           label: 'Fully released' },
                { status: 'DISPUTED',           label: 'Under dispute' },
              ].map(s => {
                const n = escrows.filter(e => e.status === s.status).length;
                if (n === 0) return null;
                return (
                  <div key={s.status} className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{s.label}</span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{n}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 5: Recent commissions activity table ─────────────────────────── */}
      {commissions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Recent Commissions</h3>
              <p className="text-xs text-gray-400 mt-0.5">Latest 8 commission records</p>
            </div>
            <TrendingUp className="w-4 h-4 text-gray-300" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  {['Load', 'Load Value', 'Rate', 'Commission', 'Status', 'Date'].map(h => (
                    <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-2 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {commissions.slice(0, 8).map((c: any) => {
                  const statusColors: Record<string, string> = {
                    PAID: 'bg-emerald-50 text-emerald-700',
                    APPROVED: 'bg-blue-50 text-blue-700',
                    PENDING: 'bg-amber-50 text-amber-700',
                    CANCELLED: 'bg-gray-100 text-gray-500',
                  };
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="py-2.5 pr-4 font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                        {c.load?.title || `Load ${(c.loadId || '').slice(0, 8)}`}
                      </td>
                      <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400">{fmt(c.loadAmount || 0)}</td>
                      <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400">{Number(c.commissionRate || 0).toFixed(1)}%</td>
                      <td className="py-2.5 pr-4 font-bold text-gray-900 dark:text-white">{fmt(c.commissionAmount || 0)}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[c.status] || 'bg-gray-100 text-gray-500'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-gray-400">
                        {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
