import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Award, Target, Shield, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface DriverPerformanceChartProps {
  data?: {
    onTimeDelivery: number;
    safetyScore: number;
    customerRating: number;
    fuelEfficiency: number;
    loadUtilization: number;
    responseTime: number;
  } | null;
  isLoading?: boolean;
}

export const DriverPerformanceChart: React.FC<DriverPerformanceChartProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 animate-pulse h-[550px]" />;
  }

  if (!data) {
    return (
      <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 p-5 sm:p-10 h-[550px] flex flex-col items-center justify-center gap-3">
        <Activity size={32} className="text-slate-200" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No performance data yet</p>
        <p className="text-xs text-slate-300">Complete trips to build your score</p>
      </div>
    );
  }

  // Real average — only include metrics that have actual data (> 0)
  const metrics = [
    data.onTimeDelivery,
    data.safetyScore,
    data.customerRating,
    data.fuelEfficiency,
    data.loadUtilization,
    data.responseTime,
  ];
  const populated = metrics.filter(m => m > 0);
  const overallScore = populated.length > 0
    ? Math.round(populated.reduce((s, m) => s + m, 0) / populated.length)
    : 0;

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { label: 'Elite',   color: 'text-emerald-600', bgColor: 'bg-emerald-50' };
    if (score >= 80) return { label: 'Good',    color: 'text-[#345E85]',  bgColor: 'bg-blue-50'    };
    if (score >= 70) return { label: 'Average', color: 'text-amber-600',  bgColor: 'bg-amber-50'   };
    if (score > 0)   return { label: 'Low',     color: 'text-rose-600',   bgColor: 'bg-rose-50'    };
    return               { label: 'No Data',  color: 'text-slate-400',  bgColor: 'bg-slate-50'   };
  };

  const performanceLevel = getPerformanceLevel(overallScore);

  const chartConfig = {
    labels: ['ON-TIME DELIVERY', 'SAFETY INTEGRITY', 'CUSTOMER RATING', 'FUEL EFFICIENCY', 'LOAD UTILIZATION', 'RESPONSE TIME'],
    datasets: [
      {
        label: 'Metric Grade (%)',
        data: [data.onTimeDelivery, data.safetyScore, data.customerRating, data.fuelEfficiency, data.loadUtilization, data.responseTime],
        backgroundColor: '#345E85',
        hoverBackgroundColor: '#0f172a',
        borderRadius: 12,
        barThickness: 32,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { family: 'Inter', size: 10, weight: 'bold' as const },
        bodyFont: { family: 'Inter', size: 12, weight: 'bold' as const },
        padding: 16,
        displayColors: false,
        callbacks: { label: (ctx: any) => `${ctx.parsed.x}%` },
      },
    },
    scales: {
      x: { display: false, beginAtZero: true, max: 100 },
      y: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { family: 'Inter', size: 9, weight: 'bold' as const }, padding: 10 },
      },
    },
  };

  // Top strength and weakest metric — only from populated metrics
  const metricMap: Record<string, number> = {
    onTimeDelivery: data.onTimeDelivery,
    safetyScore: data.safetyScore,
    customerRating: data.customerRating,
    fuelEfficiency: data.fuelEfficiency,
    loadUtilization: data.loadUtilization,
    responseTime: data.responseTime,
  };
  const populatedEntries = Object.entries(metricMap).filter(([, v]) => v > 0);
  const topStrength = populatedEntries.length > 0
    ? populatedEntries.reduce((a, b) => a[1] > b[1] ? a : b)[0].replace(/([A-Z])/g, ' $1').trim()
    : '—';
  const needsWork = populatedEntries.length > 0
    ? populatedEntries.reduce((a, b) => a[1] < b[1] ? a : b)[0].replace(/([A-Z])/g, ' $1').trim()
    : '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 p-5 sm:p-10 shadow-2xl shadow-slate-200/40 group"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 sm:mb-10">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-blue-50 flex items-center justify-center text-[#345E85] border border-blue-100 group-hover:bg-[#345E85] group-hover:text-white transition-all duration-500 shrink-0">
            <Activity size={24} />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Performance Analytics</h3>
            <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">Driver Score</p>
          </div>
        </div>

        <div className={`px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl ${performanceLevel.bgColor} border border-transparent flex items-center gap-4 sm:gap-5 shadow-sm w-fit`}>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
            <Award className={cn(performanceLevel.color)} size={24} />
          </div>
          <div className="text-right">
            <div className={`text-xl sm:text-2xl font-black ${performanceLevel.color} tracking-tight`}>
              {overallScore > 0 ? `${overallScore}%` : '—'}
            </div>
            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
              {performanceLevel.label} Status
            </div>
          </div>
        </div>
      </div>

      <div className="h-[300px] sm:h-[400px] relative mb-8 sm:mb-0">
        <div className="absolute inset-0 bg-slate-50/30 rounded-[2rem] -z-10" />
        <Bar data={chartConfig} options={options} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-10">
        {[
          { label: 'Top Strength', icon: Shield, value: topStrength },
          { label: 'Needs Improvement', icon: Target, value: needsWork },
        ].map((insight) => (
          <div key={insight.label} className="p-4 sm:p-6 bg-slate-50/50 border border-slate-100 rounded-2xl sm:rounded-3xl hover:bg-white hover:shadow-xl transition-all duration-500 group/item">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-[#345E85] flex items-center justify-center">
                <insight.icon size={14} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{insight.label}</span>
            </div>
            <p className="text-xs sm:text-sm font-black text-[#0f172a] uppercase tracking-tight">{insight.value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
