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
    return <div className="bg-transparent p-6 sm:p-8 animate-pulse h-full min-h-[350px]" />;
  }

  if (!data) {
    return (
      <div className="bg-transparent p-6 sm:p-8 h-full min-h-[350px] flex flex-col items-center justify-center gap-3">
        <Activity size={32} className="text-slate-300" />
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
    if (score >= 80) return { label: 'Good',    color: 'text-[#2b5271]',  bgColor: 'bg-slate-100'    };
    if (score >= 70) return { label: 'Average', color: 'text-amber-600',  bgColor: 'bg-amber-50'   };
    if (score > 0)   return { label: 'Low',     color: 'text-rose-600',   bgColor: 'bg-rose-50'    };
    return               { label: 'No Data',  color: 'text-slate-400',  bgColor: 'bg-slate-100'   };
  };

  const performanceLevel = getPerformanceLevel(overallScore);

  const chartConfig = {
    labels: ['ON-TIME DELIVERY', 'SAFETY INTEGRITY', 'CUSTOMER RATING', 'FUEL EFFICIENCY', 'LOAD UTILIZATION', 'RESPONSE TIME'],
    datasets: [
      {
        label: 'Metric Grade (%)',
        data: [data.onTimeDelivery, data.safetyScore, data.customerRating, data.fuelEfficiency, data.loadUtilization, data.responseTime],
        backgroundColor: '#2b5271',
        hoverBackgroundColor: '#0f172a',
        borderRadius: 0,
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



  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-transparent p-6 sm:p-8 relative h-full flex flex-col"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-[#2b5271] flex items-center justify-center text-white shrink-0">
            <Activity size={24} />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Performance Analytics</h3>
            <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">Driver Score</p>
          </div>
        </div>

        <div className={`px-6 py-4 ${performanceLevel.bgColor} flex items-center gap-5 w-fit`}>
          <div className="w-12 h-12 bg-white flex items-center justify-center shrink-0">
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

      <div className="flex-1 min-h-[150px] relative mt-4">
        <Bar data={chartConfig} options={options} />
      </div>
    </motion.div>
  );
};
