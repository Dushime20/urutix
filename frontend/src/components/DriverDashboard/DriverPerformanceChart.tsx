import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Award, Target, Shield, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DriverPerformanceChartProps {
  data?: {
    onTimeDelivery: number;
    safetyScore: number;
    customerRating: number;
    fuelEfficiency: number;
    loadUtilization: number;
    responseTime: number;
  };
  isLoading?: boolean;
}

export const DriverPerformanceChart: React.FC<DriverPerformanceChartProps> = ({
  data,
  isLoading
}) => {
  // Mock data if not provided
  const mockData = {
    onTimeDelivery: 95,
    safetyScore: 92,
    customerRating: 88,
    fuelEfficiency: 85,
    loadUtilization: 90,
    responseTime: 87
  };

  const performanceData = data || mockData;

  const overallScore = Math.round(
    (performanceData.onTimeDelivery +
      performanceData.safetyScore +
      performanceData.customerRating +
      performanceData.fuelEfficiency +
      performanceData.loadUtilization +
      performanceData.responseTime) / 6
  );

  const chartConfig = {
    labels: [
      'ON-TIME DELIVERY',
      'SAFETY INTEGRITY',
      'CUSTOMER RATING',
      'FUEL EFFICIENCY',
      'LOAD UTILIZATION',
      'RESPONSE TIME'
    ],
    datasets: [
      {
        label: 'Metric Grade (%)',
        data: [
          performanceData.onTimeDelivery,
          performanceData.safetyScore,
          performanceData.customerRating,
          performanceData.fuelEfficiency,
          performanceData.loadUtilization,
          performanceData.responseTime
        ],
        backgroundColor: '#345E85',
        hoverBackgroundColor: '#0f172a',
        borderRadius: 12,
        barThickness: 32,
      }
    ]
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
        callbacks: {
          label: (context: any) => `${context.parsed.x}% Grade`
        }
      }
    },
    scales: {
      x: {
        display: false,
        beginAtZero: true,
        max: 100,
      },
      y: {
        grid: { display: false },
        ticks: {
          color: '#64748b',
          font: { family: 'Inter', size: 9, weight: 'bold' as const },
          padding: 10
        }
      }
    }
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { label: 'Elite', color: 'text-[#345E85]', bgColor: 'bg-blue-50' };
    if (score >= 80) return { label: 'Good', color: 'text-[#345E85]', bgColor: 'bg-blue-50' };
    if (score >= 70) return { label: 'Average', color: 'text-[#345E85]', bgColor: 'bg-blue-50' };
    return { label: 'Low', color: 'text-[#345E85]', bgColor: 'bg-blue-50' };
  };

  const performanceLevel = getPerformanceLevel(overallScore);

  if (isLoading) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 animate-pulse h-[550px]" />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-2xl shadow-slate-200/40 group"
    >
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-[#345E85] border border-blue-100 group-hover:bg-[#345E85] group-hover:text-white transition-all duration-500">
            <Activity size={24} />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Performance Analytics</h3>
            <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">Driver Score</p>
          </div>
        </div>

        <div className={`px-6 py-4 rounded-2xl ${performanceLevel.bgColor} border border-transparent hover:border-slate-100 transition-all duration-500 flex items-center gap-5 shadow-sm`}>
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
            <Award className={performanceLevel.color} size={24} />
          </div>
          <div className="text-right">
            <div className={`text-2xl font-black ${performanceLevel.color} tracking-tight`}>
              {overallScore}%
            </div>
            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
              {performanceLevel.label} Status
            </div>
          </div>
        </div>
      </div>

      <div className="h-[400px] relative">
        <div className="absolute inset-0 bg-slate-50/30 rounded-[2rem] -z-10" />
        <Bar data={chartConfig} options={options} />
      </div>

      <div className="grid grid-cols-2 gap-6 mt-10">
        {[
          {
            label: 'Top Strength',
            icon: Shield,
            color: 'text-[#345E85]',
            bgColor: 'bg-blue-50',
            value: Object.entries(performanceData).reduce((a, b) =>
              performanceData[a[0] as keyof typeof performanceData] > performanceData[b[0] as keyof typeof performanceData] ? a : b
            )[0].replace(/([A-Z])/g, ' $1').trim()
          },
          {
            label: 'Needs Improvement',
            icon: Target,
            color: 'text-[#345E85]',
            bgColor: 'bg-blue-50',
            value: Object.entries(performanceData).reduce((a, b) =>
              performanceData[a[0] as keyof typeof performanceData] < performanceData[b[0] as keyof typeof performanceData] ? a : b
            )[0].replace(/([A-Z])/g, ' $1').trim()
          }
        ].map((insight) => (
          <div key={insight.label} className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl hover:bg-white hover:shadow-xl transition-all duration-500 group/item">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover/item:rotate-12", insight.bgColor, insight.color)}>
                <insight.icon size={14} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{insight.label}</span>
            </div>
            <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">{insight.value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
