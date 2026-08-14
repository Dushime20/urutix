import React, { useMemo } from 'react';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import {
  BarChart3,
  Clock,
  TrendingUp,
  Activity,
  Target,
  Gavel,
  CheckCircle2,
  Hourglass,
  XCircle,
  Lightbulb,
  Package,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/utils/cn';
import { useBidAnalyticsQuery } from '../../hooks/useBiddingQueries';
import { StatusBadge } from '../EnliteUI/Tables';
import { Skeleton } from '../common/LoadingSkeletons';

interface LoadPerformance {
  title: string;
  totalBids: number;
  finalPrice: number;
  status: string;
}

interface BidAnalyticsProps {
  userRole: 'CARGO_OWNER' | 'TRUCK_OWNER' | 'BROKER' | 'ADMIN' | 'SUPER_ADMIN';
}

const BRAND = '#345E85';

function winRateTone(rate: number) {
  if (rate >= 40) return { stroke: '#10b981', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', label: 'Strong' };
  if (rate >= 20) return { stroke: '#f59e0b', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', label: 'Building' };
  return { stroke: '#f43f5e', text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30', label: 'Needs work' };
}

function WinRateRing({ value }: { value: number }) {
  const size = 148;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = c - (clamped / 100) * c;
  const tone = winRateTone(value);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-slate-100 dark:text-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone.stroke}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-3xl font-black tracking-tight tabular-nums', tone.text)}>
          {clamped}
          <span className="text-lg">%</span>
        </span>
        <span className={cn('mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold', tone.bg, tone.text)}>
          {tone.label}
        </span>
      </div>
    </div>
  );
}

function formatTime(minutes: number) {
  if (!minutes || minutes <= 0) return '—';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours <= 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function ChartTooltip({
  active,
  payload,
  label,
  isCargo,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  isCargo: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-slate-900 px-3 py-2 shadow-xl border border-slate-700">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-black text-white tabular-nums">
        {payload[0].value} {isCargo ? 'bids received' : 'bids placed'}
      </p>
    </div>
  );
}

const BidAnalytics: React.FC<BidAnalyticsProps> = ({ userRole }) => {
  const { format: fmtFull } = useCurrencyFormat();
  const { data: analyticsData, isLoading: loading, isError } = useBidAnalyticsQuery();

  const isCargo = userRole === 'CARGO_OWNER';
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  const analytics = analyticsData ?? {
    totalBids: 0,
    successfulBids: 0,
    pendingBids: 0,
    lostBids: 0,
    averageBidAmount: 0,
    totalValue: 0,
    successRate: 0,
    averageResponseTime: 0,
    topPerformingLoads: [] as LoadPerformance[],
    bidTrends: [] as Array<{ date: string; bids?: number; avgAmount?: number; avgBidsPerAuction?: number }>,
  };

  const pending = analytics.pendingBids ?? Math.max(0, analytics.totalBids - analytics.successfulBids - (analytics.lostBids ?? 0));
  const lost = analytics.lostBids ?? Math.max(0, analytics.totalBids - analytics.successfulBids - pending);
  const outcomeTotal = Math.max(analytics.successfulBids + pending + lost, 1);

  const chartData = useMemo(() => {
    return (analytics.bidTrends || []).map((trend) => {
      const date = trend.date ? new Date(trend.date) : null;
      const label = date && !Number.isNaN(date.getTime())
        ? date.toLocaleDateString('en-US', { weekday: 'short' })
        : '—';
      return {
        label,
        bids: trend.bids || 0,
        avg: isCargo ? (trend.avgBidsPerAuction || 0) : (trend.avgAmount || 0),
      };
    });
  }, [analytics.bidTrends, isCargo]);

  const weekTotal = chartData.reduce((sum, d) => sum + d.bids, 0);
  const weekAvg = chartData.length
    ? chartData.reduce((sum, d) => sum + d.avg, 0) / chartData.length
    : 0;

  const insight = useMemo(() => {
    if (analytics.totalBids === 0) {
      return isCargo
        ? { tone: 'info' as const, text: 'Create an auction to start seeing bidder activity and award rates here.' }
        : { tone: 'info' as const, text: 'Place your first bid on Available loads to start tracking win rate and value.' };
    }
    if (analytics.successRate < 20) {
      return isCargo
        ? { tone: 'warn' as const, text: 'Award rate is low. Consider adjusting reserve prices or extending auction windows.' }
        : { tone: 'warn' as const, text: 'Win rate is below 20%. Bid closer to reserve on loads that match your routes.' };
    }
    if (analytics.averageResponseTime > 60) {
      return { tone: 'warn' as const, text: 'Response time is slow. Faster bids tend to win more auctions.' };
    }
    if (analytics.successRate >= 40) {
      return { tone: 'good' as const, text: 'Strong conversion. Keep targeting similar cargo types and corridors.' };
    }
    return { tone: 'info' as const, text: 'Performance is building. Focus on loads you can pick up on time.' };
  }, [analytics.totalBids, analytics.successRate, analytics.averageResponseTime, isCargo]);

  const kpis = [
    {
      label: isCargo ? 'Bids received' : 'Bids placed',
      value: analytics.totalBids.toLocaleString(),
      hint: isCargo ? 'Across your auctions' : 'All-time activity',
      icon: Gavel,
    },
    {
      label: isCargo ? 'Awarded' : 'Won',
      value: analytics.successfulBids.toLocaleString(),
      hint: `${analytics.successRate}% conversion`,
      icon: CheckCircle2,
    },
    {
      label: isCargo ? 'Avg winning price' : 'Average bid',
      value: fmtFull(analytics.averageBidAmount),
      hint: isCargo ? 'Typical award' : 'Typical offer',
      icon: Target,
    },
    {
      label: isCargo ? 'Time to first bid' : 'Avg response',
      value: formatTime(analytics.averageResponseTime),
      hint: 'Speed to act',
      icon: Clock,
    },
  ];

  const outcomes = [
    { key: 'won', label: isCargo ? 'Awarded' : 'Won', value: analytics.successfulBids, color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
    { key: 'pending', label: 'Pending', value: pending, color: 'bg-amber-400', text: 'text-amber-600 dark:text-amber-400' },
    { key: 'lost', label: isCargo ? 'Unawarded' : 'Lost', value: lost, color: 'bg-rose-400', text: 'text-rose-600 dark:text-rose-400' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-36 w-full rounded-3xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <Skeleton className="h-72 rounded-3xl lg:col-span-3" />
          <Skeleton className="h-72 rounded-3xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8"
      >
        <div className="absolute -right-16 -top-16 size-56 rounded-full bg-[#345E85]/5 dark:bg-blue-500/10" />
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-8">
          <div className="flex items-center gap-6 sm:gap-8">
            <WinRateRing value={analytics.successRate} />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#345E85] dark:text-blue-400 mb-1">
                {isAdmin ? 'Platform' : 'Your'} performance
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {isCargo ? 'Award rate' : 'Win rate'}
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                {isCargo
                  ? 'How often your auctions close with an awarded bid.'
                  : 'How often your bids convert into awarded loads.'}
              </p>
              <p className="mt-3 text-lg font-black text-slate-900 dark:text-white tabular-nums">
                {fmtFull(analytics.totalValue)}
                <span className="ml-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {isCargo ? 'awarded value' : 'bid volume'}
                </span>
              </p>
            </div>
          </div>

          <div
            className={cn(
              'lg:ml-auto flex items-start gap-3 rounded-2xl border px-4 py-3.5 max-w-md',
              insight.tone === 'good' && 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40',
              insight.tone === 'warn' && 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40',
              insight.tone === 'info' && 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800',
            )}
          >
            <Lightbulb
              size={18}
              className={cn(
                'mt-0.5 shrink-0',
                insight.tone === 'good' && 'text-emerald-600',
                insight.tone === 'warn' && 'text-amber-600',
                insight.tone === 'info' && 'text-[#345E85]',
              )}
            />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
              {insight.text}
            </p>
          </div>
        </div>
      </motion.div>

      {isError && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-100 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 px-4 py-3">
          <AlertCircle size={18} className="text-rose-500 shrink-0" />
          <p className="text-sm font-medium text-rose-700 dark:text-rose-400">Could not refresh live stats. Showing the last available snapshot.</p>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{kpi.label}</span>
              <div className="size-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[#345E85] dark:text-blue-400">
                <kpi.icon size={15} />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums truncate">
              {kpi.value}
            </p>
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">{kpi.hint}</p>
          </motion.div>
        ))}
      </div>

      {/* Chart + outcomes */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-3 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6"
        >
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Bid activity</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isCargo ? 'Bids received over the recent period' : 'Bids you placed over the recent period'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">{weekTotal}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">period total</p>
            </div>
          </div>

          {chartData.length > 0 ? (
            <>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="bidActivityFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={BRAND} stopOpacity={0.18} />
                        <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-20" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }}
                      dy={8}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }}
                    />
                    <Tooltip content={<ChartTooltip isCargo={isCargo} />} />
                    <Area
                      type="monotone"
                      dataKey="bids"
                      stroke={BRAND}
                      strokeWidth={2.5}
                      fill="url(#bidActivityFill)"
                      activeDot={{ r: 5, fill: BRAND, stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {weekAvg > 0 && (
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                  {isCargo ? <TrendingUp size={14} className="text-emerald-500" /> : <Activity size={14} className="text-[#345E85]" />}
                  <span>
                    {isCargo
                      ? `Avg ${weekAvg.toFixed(1)} bids per auction`
                      : `Avg bid ${fmtFull(weekAvg)}`}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="h-52 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/30 flex flex-col items-center justify-center text-center px-6">
              <BarChart3 className="text-slate-300 dark:text-slate-600 mb-3" size={36} />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No activity yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                {isCargo ? 'Trends appear once auctions start receiving bids.' : 'Trends appear after you place bids.'}
              </p>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6"
        >
          <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Outcomes</h3>
          <p className="text-xs text-slate-400 mt-0.5 mb-5">How your {isCargo ? 'auctions' : 'bids'} resolved</p>

          <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 mb-6">
            {outcomes.map((o) => (
              <div
                key={o.key}
                className={cn(o.color, 'transition-all duration-500')}
                style={{ width: `${(o.value / outcomeTotal) * 100}%` }}
                title={`${o.label}: ${o.value}`}
              />
            ))}
          </div>

          <div className="space-y-3">
            {outcomes.map((o) => {
              const pct = Math.round((o.value / outcomeTotal) * 100);
              const Icon = o.key === 'won' ? CheckCircle2 : o.key === 'pending' ? Hourglass : XCircle;
              return (
                <div key={o.key} className="flex items-center gap-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 px-3 py-3">
                  <Icon size={16} className={o.text} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{o.label}</p>
                    <p className="text-[11px] text-slate-400">{pct}% of total</p>
                  </div>
                  <p className={cn('text-lg font-black tabular-nums', o.text)}>{o.value}</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Top loads */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6"
      >
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              {isCargo ? 'Most competitive loads' : 'Best converting loads'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isCargo ? 'Auctions that attracted the most bids' : 'Loads where your bids performed best'}
            </p>
          </div>
        </div>

        {analytics.topPerformingLoads?.length > 0 ? (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {analytics.topPerformingLoads.map((load, idx) => (
              <li key={`${load.title}-${idx}`} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                <span className="size-8 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-black flex items-center justify-center tabular-nums">
                  {idx + 1}
                </span>
                <div className="size-10 rounded-xl bg-[#345E85]/10 dark:bg-blue-500/15 text-[#345E85] dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Package size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{load.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{load.totalBids} {load.totalBids === 1 ? 'bid' : 'bids'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                    {load.finalPrice ? fmtFull(load.finalPrice) : '—'}
                  </p>
                  <div className="mt-1 flex justify-end">
                    <StatusBadge status={load.status} label={String(load.status || 'Open').replace(/_/g, ' ')} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 py-12 text-center">
            <Package className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={32} />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No load history yet</p>
            <p className="text-xs text-slate-400 mt-1">Winning bids will rank here so you can repeat what works.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default BidAnalytics;
