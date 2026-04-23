import React from 'react';
import { Line } from 'react-chartjs-2';
import { TrendingUp, Zap, BarChart3, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
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
  };
  isLoading?: boolean;
  timeRange?: string;
}

export const DriverEarningsChart: React.FC<DriverEarningsChartProps> = ({
  data,
  isLoading
}) => {
  // Mock data if not provided
  const mockData = {
    labels: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    earnings: [12000, 15000, 13500, 18000, 16500, 14000, 19000],
    trips: [3, 4, 3, 5, 4, 3, 5]
  };

  const chartData = data || mockData;

  const totalEarnings = chartData.earnings.reduce((sum, val) => sum + val, 0);
  const avgEarnings = totalEarnings / chartData.earnings.length;
  const lastWeekAvg = avgEarnings * 0.85;
  const growth = ((avgEarnings - lastWeekAvg) / lastWeekAvg) * 100;

  const chartConfig = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Earnings',
        data: chartData.earnings,
        borderColor: '#345E85',
        backgroundColor: 'rgba(52, 94, 133, 0.05)',
        borderWidth: 4,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#345E85',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: '#345E85',
        pointHoverBorderColor: 'white',
        pointHoverBorderWidth: 4,
      }
    ]
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
        callbacks: {
          label: (context: any) => `$${context.parsed.y.toLocaleString()}`
        }
      }
    },
    scales: {
      y: {
        display: false,
        beginAtZero: true,
      },
      x: {
        grid: { display: false },
        ticks: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 9, weight: 'bold' as const },
          padding: 10
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 animate-pulse h-[450px]" />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-2xl shadow-slate-200/40 relative overflow-hidden group"
    >
      <div className="flex items-start justify-between mb-10">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-[#345E85] border border-blue-100 group-hover:bg-[#345E85] group-hover:text-white transition-all duration-500">
            <Zap size={24} />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Financial Analytics</h3>
            <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">Revenue Over Time</p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end gap-2 mb-1">
            <span className="text-2xl font-black text-[#0f172a] tracking-tight group-hover:scale-110 transition-transform duration-500 origin-right">
              ${totalEarnings.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <div className="flex items-center gap-1 bg-blue-50 text-[#345E85] px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
              <TrendingUp size={10} />
              +{growth.toFixed(1)}%
            </div>
            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Growth</span>
          </div>
        </div>
      </div>

      <div className="h-64 relative">
        {/* Background Decor */}
        <div className="absolute inset-0 bg-slate-50/50 rounded-3xl -z-10" />
        <Line data={chartConfig} options={options as any} />
      </div>

      <div className="grid grid-cols-3 gap-6 mt-10 pt-10 border-t border-slate-50">
        {[
          { label: 'Total Trips', value: chartData.trips.reduce((sum, val) => sum + val, 0), icon: BarChart3 },
          { label: 'Total Trips', value: chartData.totalTrips ?? chartData.trips.reduce((sum, val) => sum + val, 0), icon: BarChart3 },
          { label: 'Avg. Per Trip', value: chartData.avgPerTrip != null ? \          { label: 'Total Trips', value: chartData.totalTrips ?? chartData.trips.reduce((sum, val) => sum + val, 0), icon: BarChart3 },{chartData.avgPerTrip.toLocaleString()} : (totalTrips > 0 ? \          { label: 'Total Trips', value: chartData.totalTrips ?? chartData.trips.reduce((sum, val) => sum + val, 0), icon: BarChart3 },{Math.round(totalEarnings / totalTrips).toLocaleString()} : '—'), icon: Activity },
          { label: 'Performance Grade', value: chartData.performanceGrade ?? '—', icon: Zap }
          <div key={stat.label} className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2 text-[#345E85]">
              <stat.icon size={12} />
              <p className="text-[8px] font-black uppercase tracking-widest text-[#345E85]">{stat.label}</p>
            </div>
            <p className="text-lg font-black text-[#0f172a] tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
