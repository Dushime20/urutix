import React, { useState, useMemo } from 'react';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';
import {
  BarChart3,
  Download,
  Filter,
  Zap,
  ChevronDown,
  ChevronUp,
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { driverApi } from '../../services/driverApi';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { StandardDataTable, type Column } from '../EnliteUI/Tables';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler
);

interface EarningsOverviewProps {
  driverId: string;
}

export const EarningsOverview: React.FC<EarningsOverviewProps> = ({ driverId }) => {
  const { compact: formatCurrency } = useCurrencyFormat();
  const { tSync: t } = useTranslation();
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [showDetails, setShowDetails] = useState(false);

  const { data: earnings, isLoading } = useQuery({
    queryKey: ['driver-earnings', driverId, period],
    queryFn: () => driverApi.getEarnings(driverId, period),
    enabled: !!driverId,
  });

  // formatCurrency provided by useCurrencyFormat hook above

  const currentData = earnings ?? [];
  const hasData = currentData.length > 0 && currentData.some(d => d.netEarnings > 0 || d.trips > 0);

  const totalEarnings  = currentData.reduce((s, d) => s + d.netEarnings, 0);
  const totalDistance  = currentData.reduce((s, d) => s + d.distance, 0);
  const totalHours     = currentData.reduce((s, d) => s + d.hours, 0);
  const totalBase      = currentData.reduce((s, d) => s + d.earnings, 0);
  const totalBonuses   = currentData.reduce((s, d) => s + d.bonuses, 0);
  const totalDeductions = currentData.reduce((s, d) => s + d.deductions, 0);
  const avgPerHour     = totalHours > 0 ? totalEarnings / totalHours : 0;
  const avgPerKm       = totalDistance > 0 ? totalEarnings / totalDistance : 0;

  type LedgerRow = (typeof currentData)[number];

  const ledgerColumns: Column<LedgerRow>[] = useMemo(() => [
    {
      key: 'period',
      label: t('Period'),
      render: (_: unknown, item: LedgerRow) => (
        <span className="text-sm font-bold text-slate-700">{item.period}</span>
      ),
    },
    {
      key: 'trips',
      label: t('Trips'),
      align: 'right',
      render: (_: unknown, item: LedgerRow) => (
        <span className="text-sm font-medium text-slate-500">{item.trips}</span>
      ),
    },
    {
      key: 'hours',
      label: t('Hours'),
      align: 'right',
      render: (_: unknown, item: LedgerRow) => (
        <span className="text-sm font-medium text-slate-500">{item.hours.toFixed(1)}h</span>
      ),
    },
    {
      key: 'distance',
      label: t('Distance'),
      align: 'right',
      render: (_: unknown, item: LedgerRow) => (
        <span className="text-sm font-medium text-slate-500">{item.distance.toLocaleString()} km</span>
      ),
    },
    {
      key: 'earnings',
      label: t('Base'),
      align: 'right',
      render: (_: unknown, item: LedgerRow) => (
        <span className="text-sm font-bold text-slate-700">{formatCurrency(item.earnings)}</span>
      ),
    },
    {
      key: 'bonuses',
      label: t('Bonus'),
      align: 'right',
      render: (_: unknown, item: LedgerRow) => (
        <span className="text-sm font-bold text-emerald-600">+{formatCurrency(item.bonuses)}</span>
      ),
    },
    {
      key: 'deductions',
      label: t('Ded.'),
      align: 'right',
      render: (_: unknown, item: LedgerRow) => (
        <span className="text-sm font-bold text-rose-600">-{formatCurrency(item.deductions)}</span>
      ),
    },
    {
      key: 'netEarnings',
      label: t('Net Earned'),
      align: 'right',
      render: (_: unknown, item: LedgerRow) => (
        <span className="text-sm font-black text-slate-900">{formatCurrency(item.netEarnings)}</span>
      ),
    },
  ], [formatCurrency, t]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          usePointStyle: true, boxWidth: 8, padding: 20,
          font: { family: "'Inter', sans-serif", size: 11, weight: 600 },
          color: '#64748b',
        },
      },
      tooltip: {
        backgroundColor: '#1e293b', titleColor: '#f8fafc', bodyColor: '#f8fafc',
        padding: 12, cornerRadius: 12, displayColors: false,
        titleFont: { family: "'Inter', sans-serif", size: 13, weight: 700 },
        bodyFont: { family: "'Inter', sans-serif", size: 12, weight: 500 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: {
          font: { family: "'Inter', sans-serif", size: 10 },
          color: '#94a3b8', padding: 10,
          callback: (v: any) => formatCurrency(v),
        },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: { font: { family: "'Inter', sans-serif", size: 10 }, color: '#94a3b8', padding: 10 },
        border: { display: false },
      },
    },
  };

  const earningsChartData = useMemo(() => ({
    labels: currentData.map(d => d.period),
    datasets: [
      {
        label: t('Net Earnings'),
        data: currentData.map(d => d.netEarnings),
        borderColor: '#345E85',
        backgroundColor: (ctx: any) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(52,94,133,0.2)');
          gradient.addColorStop(1, 'rgba(52,94,133,0)');
          return gradient;
        },
        borderWidth: 3, fill: true, tension: 0.4,
        pointBackgroundColor: '#345E85', pointBorderColor: '#fff',
        pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6,
      },
      {
        label: t('Bonuses'),
        data: currentData.map(d => d.bonuses),
        borderColor: '#10b981', backgroundColor: 'transparent',
        borderWidth: 2, borderDash: [5, 5], tension: 0.4,
        pointBackgroundColor: '#10b981', pointBorderColor: '#fff',
        pointRadius: 0, pointHoverRadius: 4,
      },
    ],
  }), [currentData, t]);

  const breakdownChartData = useMemo(() => ({
    labels: currentData.map(d => d.period),
    datasets: [
      { label: t('Base'), data: currentData.map(d => d.earnings), backgroundColor: '#345E85', borderRadius: 6, barThickness: 12 },
      { label: t('Bonus'), data: currentData.map(d => d.bonuses), backgroundColor: '#10b981', borderRadius: 6, barThickness: 12 },
      { label: t('Deductions'), data: currentData.map(d => -d.deductions), backgroundColor: '#ef4444', borderRadius: 6, barThickness: 12 },
    ],
  }), [currentData, t]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#345E85] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border border-emerald-100">
              <TranslatedText text="Financials" />
            </span>
          </div>
          <h2 className="text-3xl font-black text-[#0f172a] uppercase tracking-tight"><TranslatedText text="Earnings Report" /></h2>
          <p className="text-slate-400 font-medium mt-1"><TranslatedText text="Your income from completed trips" /></p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="h-10 pl-4 pr-10 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#345E85] appearance-none cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
            >
              <option value="week">{t('This Week')}</option>
              <option value="month">{t('This Month')}</option>
              <option value="quarter">{t('This Quarter')}</option>
              <option value="year">{t('This Year')}</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>
          <button className="h-10 px-4 bg-[#345E85] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#2a4b6d] transition-all flex items-center gap-2 shadow-lg shadow-blue-900/10">
            <Download className="w-4 h-4" />
            <TranslatedText text="Export" />
          </button>
        </div>
      </div>

      {/* Empty state */}
      {!hasData && (
        <div className="bg-white rounded-[2rem] border border-slate-100 p-16 flex flex-col items-center justify-center gap-4 text-center">
          <DollarSign size={40} className="text-slate-200" />
          <p className="text-lg font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="No earnings data yet" /></p>
          <p className="text-sm text-slate-300"><TranslatedText text="Complete trips to see your earnings breakdown here" /></p>
        </div>
      )}

      {hasData && (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-black text-slate-800"><TranslatedText text="Income Trend" /></h3>
                  <p className="text-slate-400 text-sm font-medium"><TranslatedText text="Net earnings vs bonuses" /></p>
                </div>
                <div className="flex gap-2">
                  {['Net', 'Bonus'].map((l, i) => (
                    <div key={l} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-[#345E85]' : 'bg-emerald-500'}`} />
                      <span className="text-[10px] font-bold text-slate-500 uppercase"><TranslatedText text={l} /></span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-64 w-full">
                <Line data={earningsChartData} options={chartOptions} />
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-black text-slate-800"><TranslatedText text="Revenue Breakdown" /></h3>
                  <p className="text-slate-400 text-sm font-medium"><TranslatedText text="Base · Bonus · Deductions" /></p>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl">
                  <BarChart3 className="w-5 h-5 text-slate-400" />
                </div>
              </div>
              <div className="h-64 w-full">
                <Bar data={breakdownChartData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* Financial Summary + Efficiency */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm lg:col-span-2">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-6">
                <CreditCard className="w-5 h-5 text-[#345E85]" />
                <TranslatedText text="Financial Summary" />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Base Pay', value: formatCurrency(totalBase), icon: DollarSign, color: 'text-slate-800' },
                  { label: 'Bonuses', value: `+${formatCurrency(totalBonuses)}`, icon: TrendingUp, color: 'text-emerald-600' },
                  { label: 'Deductions', value: `-${formatCurrency(totalDeductions)}`, icon: TrendingDown, color: 'text-rose-600' },
                ].map((item) => (
                  <div key={item.label} className="bg-white rounded-[1.5rem] p-4 border border-slate-100 shadow-sm flex items-center gap-4 group hover:shadow-md hover:border-blue-100 transition-all">
                    <div className="w-10 h-10 rounded-full border-[1.5px] border-blue-100 flex items-center justify-center flex-shrink-0 bg-blue-50 group-hover:bg-[#345E85] group-hover:text-white transition-colors text-[#345E85]">
                      <item.icon className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <div>
                      <span className={`text-xl font-black block leading-none ${item.color}`}>{item.value}</span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1 block"><TranslatedText text={item.label} /></span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full py-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  {showDetails ? <TranslatedText text="Hide" /> : <TranslatedText text="View" />} <TranslatedText text="Detailed Ledger" />
                  {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-6">
                  <Zap className="w-5 h-5 text-[#345E85]" />
                  <TranslatedText text="Efficiency" />
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                    <span className="text-sm font-bold text-slate-500"><TranslatedText text="Hourly Rate" /></span>
                    <span className="text-base font-black text-slate-800">{formatCurrency(avgPerHour)}/hr</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                    <span className="text-sm font-bold text-slate-500"><TranslatedText text="Per KM" /></span>
                    <span className="text-base font-black text-slate-800">{formatCurrency(avgPerKm)}/km</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                    <span className="text-sm font-bold text-slate-500"><TranslatedText text="Total Distance" /></span>
                    <span className="text-base font-black text-slate-800">{totalDistance.toLocaleString()} km</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Ledger Table */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-lg shadow-slate-200/50 mt-4">
                  <h3 className="text-lg font-black text-slate-800 mb-6"><TranslatedText text="Ledger Details" /></h3>
                  <StandardDataTable<LedgerRow>
                    embedded
                    columns={ledgerColumns}
                    data={currentData}
                    getRowId={(row, index) => row.period || String(index)}
                    searchable={false}
                    pagination={false}
                    columnVisibility={false}
                    stickyHeader
                    striped
                    hoverable
                    emptyMessage="No ledger entries for this period"
                    ariaLabel="Ledger details"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};
