import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import {
  Download,
  Filter,
  ArrowUpRight,
  PieChart as PieChartIcon,
  BarChart3,
  Wallet,
  Shield,
  TrendingUp,
  CreditCard,
  Banknote,
  CheckCircle,
  Clock,
  XCircle,
  Coins,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { cn } from '@/utils/cn';
import { financialAPI } from '@/services/api';
import { fuelApi } from '@/services/fuelApi';
import { tenantApi } from '@/services/tenantApi';
import { StatCard } from '@/components/EnliteUI/Cards/StatCard';
import { useCurrencyFormat } from '@/hooks/useCurrencyFormat';
import { useAuth } from '@/contexts/AuthContext';
import { formatLocation } from '@/utils/formatLocation';

const FinancialDashboard: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isFleet = location.pathname.includes('/fleet');
  const isCargoOwner =
    user?.role === 'CARGO_OWNER' || location.pathname.includes('/cargo-owner');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Fleet-specific data
  const { data: advanceStats } = useQuery({
    queryKey: ['fleet-advance-stats-overview'],
    queryFn: () => fuelApi.getAdvanceStats(),
    enabled: isFleet,
    refetchInterval: 60000,
  });

  const { data: walletStats } = useQuery({
    queryKey: ['fleet-wallet-stats-overview'],
    queryFn: () => fuelApi.getWalletStats(),
    enabled: isFleet,
    refetchInterval: 60000,
  });

  const { data: creditBalance } = useQuery({
    queryKey: ['fleet-credit-balance-overview'],
    queryFn: () => tenantApi.getCreditBalance(),
    enabled: isFleet,
    refetchInterval: 60000,
  });

  const { data: recentAdvances } = useQuery({
    queryKey: ['fleet-recent-advances-overview'],
    queryFn: () => fuelApi.getAllAdvancesForMyDrivers(),
    enabled: isFleet,
    refetchInterval: 60000,
  });

  // Live overview for selected period (does not depend on saved report rows)
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['financial-overview-summary', timeRange],
    queryFn: async () => {
      const response = await financialAPI.getOverviewSummary({ period: timeRange });
      const payload = response.data?.data ?? response.data;
      return payload?.summary ?? payload ?? null;
    },
  });

  // Recent invoices (API returns { invoices: [...] })
  const { data: recentInvoices } = useQuery({
    queryKey: ['recent-invoices'],
    queryFn: async () => {
      const response = await financialAPI.getInvoices({ limit: 5 });
      const payload = response.data?.data ?? response.data;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.invoices)) return payload.invoices;
      return [];
    },
  });

  const stats = useMemo(() => {
    if (!reportData) return { revenue: 0, expenses: 0, profit: 0, margin: 0 };
    return {
      revenue: Number(reportData.revenue?.total || 0),
      expenses: Number(reportData.expenses?.total || 0),
      profit: Number(reportData.profit?.total || 0),
      margin: Number(reportData.profit?.margin || 0),
    };
  }, [reportData]);

  const categoryBreakdown = useMemo(() => {
    if (!reportData?.expenses?.byCategory) return [];
    const colors = ['#2c5173', '#EC4899', '#F59E0B', '#4a7fa5', '#10B981', '#8B5CF6'];
    return Object.entries(reportData.expenses.byCategory)
      .map(([name, value], i) => ({
        name,
        value: Number(value),
        color: colors[i % colors.length],
      }))
      .filter((d) => d.value > 0);
  }, [reportData]);

  const expenditureSeries = useMemo(() => {
    const byMonth = reportData?.expenses?.byMonth || {};
    return Object.entries(byMonth)
      .map(([month, total]) => ({ month, total: Number(total) }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [reportData]);

  const recentTransactions = useMemo(() => {
    const invoices = Array.isArray(recentInvoices) ? recentInvoices : [];
    return invoices.slice(0, 5).map((inv: any) => ({
      id: inv.id,
      description: `Invoice ${inv.invoiceNumber}`,
      amount: inv.totalAmount,
      date: inv.issueDate,
      status: inv.status,
      type: 'invoice',
    }));
  }, [recentInvoices]);

  const { compact: formatCurrency } = useCurrencyFormat();

  const advanceChartData = useMemo(() => {
    if (!advanceStats) return [];
    return [
      { name: 'Pending',    value: advanceStats.pendingAmount   || 0, color: '#F59E0B' },
      { name: 'Approved',   value: advanceStats.approvedAmount  || 0, color: '#10B981' },
      { name: 'Reconciled', value: advanceStats.reconciledAmount|| 0, color: '#2c5173' },
      { name: 'Rejected',   value: advanceStats.rejectedAmount  || 0, color: '#EF4444' },
    ].filter(d => d.value > 0);
  }, [advanceStats]);

  const primaryCards = isCargoOwner
    ? [
        {
          title: 'Freight Spend',
          value: formatCurrency(stats.expenses),
          trend: `${reportData?.meta?.tripCount ?? 0} trips`,
          trendDirection: 'neutral' as const,
          icon: <Wallet size={24} />,
        },
        {
          title: 'Contracted Value',
          value: formatCurrency(stats.revenue || stats.expenses),
          trend: `${reportData?.meta?.paymentCount ?? 0} payments`,
          trendDirection: 'up' as const,
          icon: <TrendingUp size={24} />,
        },
        {
          title: 'Net Outflow',
          value: formatCurrency(Math.abs(stats.profit || stats.expenses)),
          trend: 'Period spend',
          trendDirection: 'down' as const,
          icon: <ArrowUpRight size={24} />,
        },
        {
          title: 'Activity',
          value: `${(reportData?.meta?.tripCount ?? 0) + (reportData?.meta?.paymentCount ?? 0)}`,
          trend: 'Audit Ready',
          trendDirection: 'neutral' as const,
          icon: <PieChartIcon size={24} />,
        },
      ]
    : [
        {
          title: 'Total Revenue',
          value: formatCurrency(stats.revenue),
          trend: '+12%',
          trendDirection: 'up' as const,
          icon: <TrendingUp size={24} />,
        },
        {
          title: 'Total Expenses',
          value: formatCurrency(stats.expenses),
          trend: '+5%',
          trendDirection: 'down' as const,
          icon: <Wallet size={24} />,
        },
        {
          title: 'Net Profit',
          value: formatCurrency(stats.profit),
          trend: 'Peak',
          trendDirection: 'up' as const,
          icon: <ArrowUpRight size={24} />,
        },
        {
          title: 'Profit Margin',
          value: `${stats.margin.toFixed(1)}%`,
          trend: 'Audit Ready',
          trendDirection: 'neutral' as const,
          icon: <PieChartIcon size={24} />,
        },
      ];

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-[2rem]" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem]" />
          <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem]" />
        </div>
        <div className="h-80 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem]" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* ── FLEET FINANCIAL OVERVIEW ── */}
      {isFleet && (
        <div className="space-y-8">
          {/* Headline KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Credit Balance"
              value={(creditBalance?.currentBalance ?? 0).toLocaleString()}
              subtitle="Available credits"
              icon={<Coins size={20} />}
              color="primary"
              variant="classic"
            />
            <StatCard
              title="Total Advances Paid"
              value={formatCurrency(advanceStats?.totalAdvanced || 0)}
              subtitle={`${advanceStats?.totalAdvances ?? 0} advances`}
              icon={<Banknote size={20} />}
              color="primary"
              variant="classic"
            />
            <StatCard
              title="Pending Advances"
              value={formatCurrency(advanceStats?.pendingAmount || 0)}
              subtitle={`${advanceStats?.pendingCount ?? 0} awaiting approval`}
              icon={<Clock size={20} />}
              color="primary"
              variant="classic"
            />
            <StatCard
              title="Wallet Balance"
              value={formatCurrency(walletStats?.totalBalance || 0)}
              subtitle={`${walletStats?.activeWallets ?? 0} active wallets`}
              icon={<Wallet size={20} />}
              color="primary"
              variant="classic"
            />
          </div>

          {/* Credit breakdown + Advance distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Credit breakdown */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-7 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">Credit Breakdown</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Subscription · Purchased · Bonus</p>
                </div>
                <CreditCard className="text-[#2c5173] w-5 h-5 opacity-40" />
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Subscription Credits', value: creditBalance?.subscriptionCredits ?? 0, color: 'bg-violet-500', max: Math.max(1, creditBalance?.currentBalance ?? 1) },
                  { label: 'Purchased Credits',    value: creditBalance?.purchasedCredits    ?? 0, color: 'bg-[#2c5173]', max: Math.max(1, creditBalance?.currentBalance ?? 1) },
                  { label: 'Bonus Credits',        value: creditBalance?.bonusCredits        ?? 0, color: 'bg-emerald-500', max: Math.max(1, creditBalance?.currentBalance ?? 1) },
                ].map(({ label, value, color, max }) => (
                  <div key={label}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</span>
                      <span className="text-[10px] font-black text-slate-900 dark:text-white">{value.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-700', color)}
                        style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Advance distribution pie */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-7 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">Advance Distribution</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">By approval status</p>
                </div>
                <PieChartIcon className="text-[#2c5173] w-5 h-5 opacity-40" />
              </div>
              {advanceChartData.length > 0 ? (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="55%" height={180}>
                    <PieChart>
                      <Pie data={advanceChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={6} dataKey="value">
                        {advanceChartData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => formatCurrency(v)} contentStyle={{ borderRadius: '1rem', border: 'none', fontSize: '10px', fontWeight: 900 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-3">
                    {advanceChartData.map(({ name, value, color }) => (
                      <div key={name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                          <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{name}</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-900 dark:text-white">{formatCurrency(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[180px] text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">No advance data yet</div>
              )}
            </div>
          </div>

          {/* Recent advances feed */}
          <div className="bg-slate-900 dark:bg-gray-950 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-black uppercase tracking-tighter">Recent Driver Advances</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Latest advance requests from your drivers</p>
                </div>
              </div>
              <div className="space-y-3">
                {(recentAdvances || []).slice(0, 6).length > 0 ? (recentAdvances || []).slice(0, 6).map((adv: any) => {
                  const driverName = adv.driver ? `${adv.driver.firstName} ${adv.driver.lastName}` : 'Driver';
                  const statusStyles: Record<string, string> = {
                    PENDING:    'bg-amber-500/20 text-amber-400 border-amber-500/30',
                    APPROVED:   'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                    REJECTED:   'bg-rose-500/20 text-rose-400 border-rose-500/30',
                    RECONCILED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                  };
                  const StatusIcon = adv.status === 'APPROVED' ? CheckCircle : adv.status === 'REJECTED' ? XCircle : Clock;
                  const routeLabel = adv.trip
                    ? `${formatLocation(adv.trip.origin, '?')} → ${formatLocation(adv.trip.destination, '?')}`
                    : 'No trip';
                  return (
                    <div key={adv.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                          <StatusIcon size={16} className="text-white/60 group-hover:text-white transition-colors" />
                        </div>
                        <div>
                          <p className="text-sm font-black uppercase tracking-tight">{driverName}</p>
                          <div className="flex items-center gap-3 mt-0.5 opacity-40">
                            <span className="text-[9px] font-black uppercase tracking-widest">{routeLabel}</span>
                            <span className="w-1 h-1 bg-white rounded-full" />
                            <span className="text-[9px] font-black uppercase tracking-widest">{new Date(adv.advanceDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-lg font-black">{formatCurrency(Number(adv.advanceAmount))}</p>
                        <span className={cn('inline-flex items-center h-6 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest border', statusStyles[adv.status] || statusStyles.PENDING)}>
                          {adv.status}
                        </span>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-10 opacity-20 text-[10px] font-black uppercase tracking-widest">No advances recorded yet</div>
                )}
              </div>
            </div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none" />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
            <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.3em]">General Financial Analytics</span>
            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      )}
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50 dark:bg-gray-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-gray-700 shadow-sm transition-colors">
        <div className="flex gap-2 p-1 bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-inner overflow-x-auto scrollbar-hide">
          {['week', 'month', 'quarter', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                timeRange === range
                  ? 'bg-[#2c5173] text-white shadow-lg'
                  : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700'
              )}
            >
               {range}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button className="h-12 px-6 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2">
            <Filter size={14} /> Filter Node
          </button>
          <button className="h-12 px-6 bg-[#2c5173] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#1e3850] transition-all flex items-center gap-2 shadow-lg shadow-[#2c5173]/20 active:scale-95">
            <Download size={14} /> Export Audit
          </button>
        </div>
      </div>

      {/* Primary Metrics Vector Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 py-10 bg-white/40 dark:bg-gray-800/20 rounded-[3rem] border border-slate-100/50 dark:border-gray-700/50 transition-colors">
        {primaryCards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            trend={card.trend}
            trendDirection={card.trendDirection}
            icon={card.icon}
            color="primary"
            variant="classic"
          />
        ))}
      </div>

      {/* Analytics Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Expenditure Lifecycle Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 border border-slate-100 dark:border-gray-700 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">Expenditure Lifecycle</h3>
              <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Cross-category financial velocity</p>
            </div>
            <BarChart3 className="text-[#2c5173] w-6 h-6 opacity-40" />
          </div>
          <div className="h-[300px] w-full mt-4">
            {expenditureSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={expenditureSeries}>
                  <defs>
                    <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2c5173" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#2c5173" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-gray-700" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" className="dark:stroke-gray-500" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" className="dark:stroke-gray-500" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '1rem',
                      border: 'none',
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      fontSize: '10px',
                      backgroundColor: 'var(--tooltip-bg, #fff)',
                      color: 'var(--tooltip-color, #000)',
                    }}
                    itemStyle={{ color: 'inherit' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#2c5173" strokeWidth={3} fillOpacity={1} fill="url(#colorPrimary)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">
                No expenditure data for this period
              </div>
            )}
          </div>
        </div>

        {/* Capital OS Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 border border-slate-100 dark:border-gray-700 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">Capital Distribution</h3>
              <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Allocation across operational nodes</p>
            </div>
            <PieChartIcon className="text-[#2c5173] w-6 h-6 opacity-40" />
          </div>
          <div className="flex items-center h-[300px]">
            {categoryBreakdown.length > 0 ? (
              <>
                <ResponsiveContainer width="60%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-4 max-h-[250px] overflow-y-auto pr-4 scrollbar-hide">
                  {categoryBreakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between group cursor-default">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[9px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest group-hover:text-slate-900 dark:group-hover:text-white transition-colors truncate max-w-[100px]">{item.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-900 dark:text-white">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="w-full text-center py-10 opacity-30 text-[10px] font-black uppercase tracking-widest">
                No sector data for this period
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historic Logs Preview */}
      <div className="bg-slate-900 dark:bg-gray-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl transition-colors">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-lg font-black uppercase tracking-tighter">System Audit Logs</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Most recent capital movements across network</p>
            </div>
            <button className="h-12 px-6 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 flex items-center gap-2">
              Access Full Log History <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="space-y-4">
            {recentTransactions.length > 0 ? recentTransactions.map((transaction: any) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
              >
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white/50 group-hover:text-white transition-colors">
                    {transaction.type === 'invoice' ? <CreditCard size={20} /> : <Shield size={20} />}
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-tight">{transaction.description}</p>
                    <div className="flex items-center gap-4 mt-1.5 opacity-40">
                      <span className="text-[9px] font-black uppercase tracking-widest">{new Date(transaction.date).toLocaleDateString()}</span>
                      <span className="w-1 h-1 bg-white rounded-full" />
                      <span className="text-[9px] font-black uppercase tracking-widest">System Record</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black">{formatCurrency(transaction.amount)}</p>
                  <span className={cn(
                    "inline-flex items-center h-6 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest mt-2 border",
                    transaction.status === 'paid' || transaction.status === 'completed' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  )}>
                    {transaction.status}
                  </span>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 opacity-20 text-[10px] font-black uppercase tracking-widest">No recent movements detected</div>
            )}
          </div>
        </div>
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full -mr-64 -mt-64 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full -ml-32 -mb-32 blur-[100px] pointer-events-none" />
      </div>
    </div>
  );
};

export default FinancialDashboard;
