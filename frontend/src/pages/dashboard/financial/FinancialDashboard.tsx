import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import {
  Download,
  PieChart as PieChartIcon,
  BarChart3,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
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
import { useCurrencyFormat } from '@/hooks/useCurrencyFormat';
import { useAuth } from '@/contexts/AuthContext';
import { formatLocation } from '@/utils/formatLocation';

const CARD = 'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm';
const SECTION_LABEL = 'text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide';

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
      )}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(CARD, 'p-6')}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="text-[#2c5173] opacity-40">{icon}</div>
      </div>
      {children}
    </div>
  );
}

const FinancialDashboard: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isFleet = location.pathname.includes('/fleet');
  const isCargoOwner =
    user?.role === 'CARGO_OWNER' || location.pathname.includes('/cargo-owner');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const { data: advanceStats } = useQuery({
    queryKey: ['fleet-advance-stats-overview'],
    queryFn: () => fuelApi.getAdvanceStats(),
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

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['financial-overview-summary', timeRange],
    queryFn: async () => {
      const response = await financialAPI.getOverviewSummary({ period: timeRange });
      const payload = response.data?.data ?? response.data;
      return payload?.summary ?? payload ?? null;
    },
  });

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
      { name: 'Pending', value: advanceStats.pendingAmount || 0, color: '#F59E0B' },
      { name: 'Approved', value: advanceStats.approvedAmount || 0, color: '#10B981' },
      { name: 'Reconciled', value: advanceStats.reconciledAmount || 0, color: '#2c5173' },
      { name: 'Rejected', value: advanceStats.rejectedAmount || 0, color: '#EF4444' },
    ].filter((d) => d.value > 0);
  }, [advanceStats]);

  const periodLabel = { week: 'This week', month: 'This month', quarter: 'This quarter', year: 'This year' }[timeRange];

  const advanceStatusStyles: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800',
    RECONCILED: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  };

  const invoiceStatusStyles = (status: string) =>
    status === 'paid' || status === 'completed'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
      : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700" />
          <div className="h-72 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Period controls */}
      <div className={cn(CARD, 'p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4')}>
        <div>
          <p className={SECTION_LABEL}>Reporting period</p>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">{periodLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all',
                  timeRange === range
                    ? 'bg-white dark:bg-slate-700 text-[#2c5173] dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
                )}
              >
                {range}
              </button>
            ))}
          </div>
          <button className="h-10 px-4 bg-[#2c5173] text-white rounded-xl text-xs font-semibold hover:bg-[#1e3850] transition-colors flex items-center gap-2">
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      {/* Charts — fleet breakdown + expense analytics */}
      <section>
        <SectionHeader title="Analytics" description="Trends and breakdowns for the selected period" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isFleet && (
            <>
              <ChartCard
                title="Credit Breakdown"
                subtitle="Subscription, purchased, and bonus credits"
                icon={<CreditCard className="w-5 h-5" />}
              >
                <div className="space-y-4">
                  {[
                    {
                      label: 'Subscription Credits',
                      value: creditBalance?.subscriptionCredits ?? 0,
                      color: 'bg-violet-500',
                      max: Math.max(1, creditBalance?.currentBalance ?? 1),
                    },
                    {
                      label: 'Purchased Credits',
                      value: creditBalance?.purchasedCredits ?? 0,
                      color: 'bg-[#2c5173]',
                      max: Math.max(1, creditBalance?.currentBalance ?? 1),
                    },
                    {
                      label: 'Bonus Credits',
                      value: creditBalance?.bonusCredits ?? 0,
                      color: 'bg-emerald-500',
                      max: Math.max(1, creditBalance?.currentBalance ?? 1),
                    },
                  ].map(({ label, value, color, max }) => (
                    <div key={label}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">{value.toLocaleString()}</span>
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
              </ChartCard>

              <ChartCard
                title="Advance Distribution"
                subtitle="Driver advances by approval status"
                icon={<PieChartIcon className="w-5 h-5" />}
              >
                {advanceChartData.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="50%" height={180}>
                      <PieChart>
                        <Pie
                          data={advanceChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {advanceChartData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: number) => formatCurrency(v)}
                          contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2.5">
                      {advanceChartData.map(({ name, value, color }) => (
                        <div key={name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                            <span className="text-xs text-slate-600 dark:text-slate-400">{name}</span>
                          </div>
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">{formatCurrency(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[180px] text-sm text-slate-400">No advance data yet</div>
                )}
              </ChartCard>
            </>
          )}

          <ChartCard
            title="Expense Trend"
            subtitle="Monthly expense totals"
            icon={<BarChart3 className="w-5 h-5" />}
          >
            <div className="h-[260px] w-full">
              {expenditureSeries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={expenditureSeries}>
                    <defs>
                      <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2c5173" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#2c5173" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `$${value / 1000}k`}
                    />
                    <Tooltip
                      formatter={(v: number) => formatCurrency(v)}
                      contentStyle={{
                        borderRadius: '0.75rem',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                        backgroundColor: '#fff',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#2c5173"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#expenseGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-400">
                  No expense data for this period
                </div>
              )}
            </div>
          </ChartCard>

          <ChartCard
            title="Expenses by Category"
            subtitle="Where your spending goes"
            icon={<PieChartIcon className="w-5 h-5" />}
          >
            {categoryBreakdown.length > 0 ? (
              <div className="flex items-center h-[260px]">
                <ResponsiveContainer width="55%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2.5 max-h-[220px] overflow-y-auto pr-2">
                  {categoryBreakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-slate-600 dark:text-slate-400 truncate">{item.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white flex-shrink-0">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-sm text-slate-400">
                No category data for this period
              </div>
            )}
          </ChartCard>
        </div>
      </section>

      {/* Recent activity */}
      <section>
        <SectionHeader title="Recent Activity" description="Latest advances and invoices" />
        <div className={cn('grid gap-6', isFleet ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1')}>
          {isFleet && (
            <div className={cn(CARD, 'overflow-hidden')}>
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Driver Advances</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Latest requests from your drivers</p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {(recentAdvances || []).slice(0, 5).length > 0 ? (
                  (recentAdvances || []).slice(0, 5).map((adv: any) => {
                    const driverName = adv.driver
                      ? `${adv.driver.firstName} ${adv.driver.lastName}`
                      : 'Driver';
                    const StatusIcon =
                      adv.status === 'APPROVED' ? CheckCircle : adv.status === 'REJECTED' ? XCircle : Clock;
                    const routeLabel = adv.trip
                      ? `${formatLocation(adv.trip.origin, '?')} → ${formatLocation(adv.trip.destination, '?')}`
                      : 'No trip assigned';
                    return (
                      <div
                        key={adv.id}
                        className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                            <StatusIcon size={16} className="text-slate-500 dark:text-slate-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{driverName}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {routeLabel} · {new Date(adv.advanceDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {formatCurrency(Number(adv.advanceAmount))}
                          </p>
                          <span
                            className={cn(
                              'inline-flex items-center h-6 px-2.5 rounded-md text-[10px] font-semibold uppercase border',
                              advanceStatusStyles[adv.status] || advanceStatusStyles.PENDING,
                            )}
                          >
                            {adv.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-6 py-12 text-center text-sm text-slate-400">No advances recorded yet</div>
                )}
              </div>
            </div>
          )}

          <div className={cn(CARD, 'overflow-hidden')}>
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Invoices</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Latest billing records</p>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction: any) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                        <CreditCard size={16} className="text-slate-500 dark:text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatCurrency(transaction.amount)}
                      </p>
                      <span
                        className={cn(
                          'inline-flex items-center h-6 px-2.5 rounded-md text-[10px] font-semibold uppercase border mt-1',
                          invoiceStatusStyles(transaction.status),
                        )}
                      >
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center text-sm text-slate-400">No recent invoices</div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FinancialDashboard;
