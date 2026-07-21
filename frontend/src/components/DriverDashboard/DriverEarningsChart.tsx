import React from 'react';
import { Line } from 'react-chartjs-2';
import { TrendingUp, Zap, BarChart3, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DriverEarningsChartProps {
  data?: {
    labels: string[];
    earnings: number[];
    trips: number[];
    totalEarnings?: number;
    totalTrips?: number;
    avgPerTrip?: number;
    performanceGrade?: string;
  } | null;
  isLoading?: boolean;
  timeRange?: string;
}

export const DriverEarningsChart: React.FC<DriverEarningsChartProps> = ({ data, isLoading }) => {
  const { tSync: t } = useTranslation();
  const { format: formatCurrency } = useCurrencyFormat();
  if (isLoading) {
    return <div className="bg-transparent p-6 sm:p-8 h-full min-h-[350px]" />;
  }

  if (!data) {
    return (
      <div className="bg-transparent p-6 sm:p-8 h-full min-h-[350px] flex flex-col items-center justify-center gap-3">
        <Zap size={32} className="text-slate-300" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest"><TranslatedText text="No earnings data yet" /></p>
        <p className="text-xs text-slate-300"><TranslatedText text="Complete trips to see your revenue chart" /></p>
      </div>
    );
  }

  const totalEarnings = data.totalEarnings ?? data.earnings.reduce((s, v) => s + v, 0);
  const totalTrips = data.totalTrips ?? data.trips.reduce((s, v) => s + v, 0);
  const avgPerTrip = data.avgPerTrip ?? (totalTrips > 0 ? Math.round(totalEarnings / totalTrips) : 0);

  const chartConfig = {
    labels: data.labels,
    datasets: [
      {
        label: t('Earnings'),
        data: data.earnings,
        borderColor: '#2b5271',
        backgroundColor: 'transparent',
        borderWidth: 4,
        fill: false,
        tension: 0,
        pointBackgroundColor: '#2b5271',
        pointBorderColor: '#2b5271',
        pointBorderWidth: 0,
        pointRadius: 0,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: '#2b5271',
        pointHoverBorderColor: 'white',
        pointHoverBorderWidth: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { family: 'Inter', size: 10, weight: 'bold' as const },
        bodyFont: { family: 'Inter', size: 12, weight: 'bold' as const },
        padding: 16,
        displayColors: false,
        callbacks: { label: (ctx: any) => formatCurrency(ctx.parsed.y) },
      },
    },
    scales: {
      y: { display: false, beginAtZero: true },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 9, weight: 'bold' as const }, padding: 10 },
      },
    },
  };

  const stats = [
    { label: 'Total Trips', value: totalTrips, icon: BarChart3 },
    { label: 'Avg. Per Trip', value: formatCurrency(avgPerTrip), icon: Activity },
    { label: 'Performance Grade', value: data.performanceGrade ?? '-', icon: Zap },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-transparent p-6 sm:p-8 relative h-full flex flex-col"
    >
      <div className="flex items-start justify-between mb-10">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-[#2b5271] flex items-center justify-center text-white">
            <Zap size={24} />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1"><TranslatedText text="Financial Analytics" /></h3>
            <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight"><TranslatedText text="Revenue Over Time" /></p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-2xl font-black text-[#0f172a] tracking-tight">
            {formatCurrency(totalEarnings)}
          </span>
          <div className="flex items-center justify-end gap-2 mt-1">
            <div className="flex items-center gap-1 text-[#2b5271] text-[9px] font-black uppercase tracking-widest">
              <TrendingUp size={10} />
              <TranslatedText text="Live Data" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[150px] relative mt-6">
        <Line data={chartConfig} options={options as any} />
      </div>

      <div className="grid grid-cols-3 gap-4 sm:gap-6 mt-8">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2 text-[#2b5271]">
              <stat.icon size={12} />
              <p className="text-[8px] font-black uppercase tracking-widest text-[#2b5271]"><TranslatedText text={stat.label} /></p>
            </div>
            <p className="text-lg font-black text-[#0f172a] tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
