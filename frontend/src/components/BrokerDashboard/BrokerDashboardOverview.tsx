import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  DollarSign, FileText, Scale,
  Clock, ShieldCheck, Banknote, BarChart2, Activity, Package, Navigation,
  ChevronRight,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { brokerAPI, getPickupAddress, getDeliveryAddress, type BrokerLoad } from '../../services/brokerApi';
import { useAuth } from '../../contexts/AuthContext';
import { StatCard } from '../EnliteUI/Cards/StatCard';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { StandardDataTable, StatusBadge, type Column } from '../EnliteUI/Tables';

// ─── helpers ──────────────────────────────────────────────────────────────────

const pct = (a: number, b: number) =>
  b === 0 ? 0 : Math.round(((a - b) / b) * 100);

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const formatRelativeTime = (date: string | Date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const diff = Date.now() - dateObj.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

interface BrokerActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  icon: React.ReactNode;
  iconBg: string;
}

const formatRoute = (load: BrokerLoad) => {
  const origin = getPickupAddress(load) || load.origin?.city || 'Origin TBD';
  const destination = getDeliveryAddress(load) || load.destination?.city || 'Destination TBD';
  return `${origin} → ${destination}`;
};

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
  const navigate = useNavigate();
  const { compact: fmt } = useCurrencyFormat();

  // ── extended stats from API ──────────────────────────────────────────────────
  const [brokerStats, setBrokerStats] = useState<any>(null);
  const [assignments, setAssignments] = useState<BrokerLoad[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [escrows, setEscrows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    Promise.allSettled([
      brokerAPI.getBrokerStatistics(user.id),
      brokerAPI.getBrokerLoads(user.id),
      brokerAPI.getBrokerCommissions(user.id),
      brokerAPI.getContracts(),
      brokerAPI.getDisputes(),
      brokerAPI.getEscrows(),
    ]).then(([statsRes, loadsRes, comRes, conRes, disRes, escRes]) => {
      if (statsRes.status === 'fulfilled') {
        const d = statsRes.value?.data;
        setBrokerStats(d?.data ?? d ?? null);
      }
      if (loadsRes.status === 'fulfilled') {
        const d = loadsRes.value?.data;
        const loads = Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [];
        setAssignments(loads);
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

  const escrowFunded   = escrows.filter(e => e.status === 'FUNDED').reduce((s, e) => s + (Number(e.totalAmount) || 0), 0);
  const escrowReleased = escrows.filter(e => e.status === 'RELEASED').reduce((s, e) => s + (Number(e.totalAmount) || 0), 0);

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
      if (c.status === 'PAID')     months[key].earned   += Number(c.commissionAmount) || 0;
      if (c.status === 'PENDING')  months[key].pending  += Number(c.commissionAmount) || 0;
      if (c.status === 'APPROVED') months[key].approved += Number(c.commissionAmount) || 0;
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

  const recentAssignments = React.useMemo(
    () => [...assignments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [assignments],
  );

  const recentCommissions = React.useMemo(
    () => [...commissions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [commissions],
  );

  const recentActivities = React.useMemo(() => {
    const items: BrokerActivityItem[] = [];

    recentAssignments.forEach(load => {
      items.push({
        id: `assignment-${load.id}`,
        title: 'Cargo assigned',
        description: `${load.title || 'Shipment'} · ${formatRoute(load)}`,
        timestamp: load.createdAt,
        icon: <Package className="w-4 h-4" />,
        iconBg: 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400',
      });
    });

    recentCommissions.forEach(c => {
      const loadLabel = c.load?.title || `Load ${(c.loadId || '').slice(0, 8)}`;
      const statusLabel = c.status === 'PAID' ? 'paid' : c.status === 'APPROVED' ? 'approved' : 'recorded';
      items.push({
        id: `commission-${c.id}`,
        title: `Commission ${statusLabel}`,
        description: `${loadLabel} · ${fmt(c.commissionAmount)}`,
        timestamp: c.updatedAt || c.createdAt,
        icon: <DollarSign className="w-4 h-4" />,
        iconBg: c.status === 'PAID'
          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
          : c.status === 'APPROVED'
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
            : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
      });
    });

    contracts.forEach(c => {
      items.push({
        id: `contract-${c.id}`,
        title: `Contract ${String(c.status || 'updated').replace(/_/g, ' ').toLowerCase()}`,
        description: `Load ${(c.loadId || '').slice(0, 8)} · ${fmt(c.commissionAmount || c.agreedRate || 0)}`,
        timestamp: c.updatedAt || c.createdAt,
        icon: <FileText className="w-4 h-4" />,
        iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
      });
    });

    disputes.forEach(d => {
      items.push({
        id: `dispute-${d.id}`,
        title: `Dispute ${String(d.status || 'opened').replace(/_/g, ' ').toLowerCase()}`,
        description: `${String(d.category || 'General').toLowerCase()} · Load ${(d.loadId || '').slice(0, 8)}`,
        timestamp: d.resolvedAt || d.createdAt,
        icon: <Scale className="w-4 h-4" />,
        iconBg: ['OPEN', 'ESCALATED'].includes(d.status)
          ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
          : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
      });
    });

    escrows.forEach(e => {
      items.push({
        id: `escrow-${e.id}`,
        title: `Escrow ${String(e.status || 'updated').replace(/_/g, ' ').toLowerCase()}`,
        description: `Load ${(e.loadId || '').slice(0, 8)} · ${fmt(e.totalAmount || 0)}`,
        timestamp: e.fundedAt || e.createdAt,
        icon: <ShieldCheck className="w-4 h-4" />,
        iconBg: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400',
      });
    });

    return items
      .filter(item => item.timestamp)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6);
  }, [recentAssignments, recentCommissions, contracts, disputes, escrows, fmt]);

  return (
    <div className="space-y-6">

      {/* ── Row 1: KPI cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Assigned Cargo"
          value={totalLoads}
          subtitle={`${stats.inTransit} in transit`}
          icon={<Package className="w-5 h-5" />}
          color="primary"
          variant="classic"
        />
        <StatCard
          title="Total Earned"
          value={fmt(totalEarned)}
          subtitle="commissions paid"
          icon={<DollarSign className="w-5 h-5" />}
          color="success"
          variant="classic"
          trend={loading ? undefined : `${Math.abs(pct(totalEarned, totalEarned * 0.85))}%`}
          trendDirection={pct(totalEarned, totalEarned * 0.85) >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Pending Income"
          value={fmt(totalPending + totalApproved)}
          subtitle={`avg rate ${Number(avgCommRate).toFixed(1)}%`}
          icon={<Clock className="w-5 h-5" />}
          color="warning"
          variant="classic"
        />
        <StatCard
          title="Active Contracts"
          value={activeContracts}
          subtitle={`${pendingContracts} pending sig.`}
          icon={<FileText className="w-5 h-5" />}
          color="purple"
          variant="classic"
        />
        <StatCard
          title="Open Disputes"
          value={openDisputes}
          subtitle={`${resolvedDisputes} resolved`}
          icon={<Scale className="w-5 h-5" />}
          color="error"
          variant="classic"
        />
        <StatCard
          title="Escrow Held"
          value={fmt(escrowFunded)}
          subtitle={`${fmt(escrowReleased)} released`}
          icon={<ShieldCheck className="w-5 h-5" />}
          color="info"
          variant="classic"
        />
      </div>

      {/* ── Row 2: Recent assignments & activity (priority at top) ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent assignments — 2/3 width */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Recent Assignments</h3>
              <p className="text-xs text-gray-500 mt-0.5">Your latest assigned cargo loads</p>
            </div>
            <Link
              to="/dashboard/broker/loads"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              View all
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-xs">Loading assignments...</div>
          ) : recentAssignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
              <Package className="w-8 h-8 opacity-40" />
              <p className="text-xs font-medium">No assigned cargo yet</p>
            </div>
          ) : (
            <StandardDataTable
              embedded
              dense
              data={recentAssignments.slice(0, 6)}
              getRowId={(load) => load.id}
              searchable={false}
              pagination={false}
              emptyMessage="No assigned cargo yet"
              onRowClick={(load) => navigate(`/dashboard/broker/loads/${load.id}`)}
              columns={[
                {
                  key: 'title',
                  label: 'Cargo',
                  render: (_: any, load: BrokerLoad) => (
                    <span className="font-medium text-gray-800 dark:text-gray-200 max-w-[140px] truncate block">
                      {load.title || `Load ${load.id.slice(0, 8)}`}
                    </span>
                  ),
                },
                {
                  key: 'route',
                  label: 'Route',
                  render: (_: any, load: BrokerLoad) => (
                    <span className="text-gray-600 dark:text-gray-400 max-w-[180px] truncate block">{formatRoute(load)}</span>
                  ),
                },
                {
                  key: 'loadValue',
                  label: 'Value',
                  render: (v: number) => <span className="text-gray-600 dark:text-gray-400">{fmt(v ?? 0)}</span>,
                },
                {
                  key: 'brokerCommissionRate',
                  label: 'Commission',
                  render: (_: any, load: BrokerLoad) => (
                    <span className="text-gray-600 dark:text-gray-400">
                      {load.brokerCommissionRate
                        ? `${Number(load.brokerCommissionRate).toFixed(1)}%`
                        : load.brokerCommissionAmount
                          ? fmt(load.brokerCommissionAmount)
                          : '—'}
                    </span>
                  ),
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: (status: string) => <StatusBadge status={status || 'ASSIGNED'} />,
                },
                {
                  key: 'createdAt',
                  label: 'Assigned',
                  render: (d: string) => (
                    <span className="text-gray-500">
                      {new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </span>
                  ),
                },
              ] as Column<BrokerLoad>[]}
            />
          )}
        </div>

        {/* Recent activity — 1/3 width */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Recent Activity</h3>
              <p className="text-xs text-gray-500 mt-0.5">Assignments, contracts & disputes</p>
            </div>
            <Activity className="w-4 h-4 text-gray-400" />
          </div>
          {loading ? (
            <div className="flex items-center justify-center flex-1 min-h-[160px] text-gray-400 text-xs">Loading activity...</div>
          ) : recentActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 min-h-[160px] gap-2 text-gray-400">
              <Activity className="w-8 h-8 opacity-40" />
              <p className="text-xs font-medium text-center">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {recentActivities.map(item => (
                <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.iconBg}`}>
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{item.title}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{item.description}</p>
                    <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(item.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Commission Analytics ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Commission trend — 2/3 width */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Commission Trend</h3>
              <p className="text-xs text-gray-500 mt-0.5">Last 6 months — earned / approved / pending</p>
            </div>
            <Activity className="w-4 h-4 text-gray-400" />
          </div>
          {trendData.every(d => d.earned === 0 && d.pending === 0 && d.approved === 0) ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-xs">No commission data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={v => fmt(v)} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v) => fmt(v as number)} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="earned"   name="Paid"     stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="approved" name="Approved" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="pending"  name="Pending"  stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.1} strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Commission breakdown — 1/3 width */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Commission Breakdown</h3>
              <p className="text-xs text-gray-500 mt-0.5">Paid · Approved · Pending</p>
            </div>
            <Banknote className="w-4 h-4 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={commBarData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={v => fmt(v)} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v) => fmt(v as number)} cursor={{ fill: 'transparent' }} />
              <Bar dataKey="value" name="Amount" radius={[4, 4, 0, 0]}>
                {commBarData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* summary row */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            {[
              { label: 'Paid', value: fmt(totalEarned), color: 'text-emerald-600' },
              { label: 'Approved', value: fmt(totalApproved), color: 'text-blue-600' },
              { label: 'Pending', value: fmt(totalPending), color: 'text-amber-600' },
            ].map(item => (
              <div key={item.label} className="text-center">
                <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 4: Operations ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Cargo status pie — 1/2 width */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Cargo Status</h3>
              <p className="text-xs text-gray-500 mt-0.5">Distribution by current state</p>
            </div>
            <Navigation className="w-4 h-4 text-gray-400" />
          </div>
          {cargoPieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-xs">No cargo data yet</div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6 mt-4">
              <div className="w-full sm:w-1/2">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={cargoPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                      dataKey="value" paddingAngle={2}>
                      {cargoPieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full sm:w-1/2 flex flex-col gap-3">
                {cargoPieData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-xs text-gray-600 dark:text-gray-400">{d.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dispute categories — 1/2 width */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Dispute Categories</h3>
              <p className="text-xs text-gray-500 mt-0.5">{disputes.length} total · {openDisputes} open</p>
            </div>
            <BarChart2 className="w-4 h-4 text-gray-400" />
          </div>
          {disputeBarData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
              <p className="text-xs text-gray-500 font-medium">No disputes — great work!</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={disputeBarData} layout="vertical" margin={{ top: 0, right: 16, left: 4, bottom: 0 }} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={60} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="count" name="Disputes" fill="#EF4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          {/* dispute status pills */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            {[
              { label: 'Open',     count: disputes.filter(d => d.status === 'OPEN').length,          color: 'bg-red-50 text-red-700 border border-red-100' },
              { label: 'Mediation', count: disputes.filter(d => d.status === 'MEDIATION').length,    color: 'bg-amber-50 text-amber-700 border border-amber-100' },
              { label: 'Resolved', count: resolvedDisputes,                                           color: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
              { label: 'Escalated', count: disputes.filter(d => d.status === 'ESCALATED').length,   color: 'bg-purple-50 text-purple-700 border border-purple-100' },
            ].map(s => (
              <span key={s.label} className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${s.color}`}>
                {s.label} {s.count}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
