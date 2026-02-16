import React from 'react';
import { Line } from 'react-chartjs-2';
import { DollarSign, TrendingUp } from 'lucide-react';
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
  };
  isLoading?: boolean;
  timeRange?: string;
}

export const DriverEarningsChart: React.FC<DriverEarningsChartProps> = ({
  data,
  isLoading,
  timeRange = '7d'
}) => {
  // Mock data if not provided
  const mockData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    earnings: [12000, 15000, 13500, 18000, 16500, 14000, 19000],
    trips: [3, 4, 3, 5, 4, 3, 5]
  };

  const chartData = data || mockData;

  // Calculate total earnings and growth
  const totalEarnings = chartData.earnings.reduce((sum, val) => sum + val, 0);
  const avgEarnings = totalEarnings / chartData.earnings.length;
  const lastWeekAvg = avgEarnings * 0.85; // Mock previous week average
  const growth = ((avgEarnings - lastWeekAvg) / lastWeekAvg) * 100;

  const earningsGradient = (ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(34, 197, 94, 0.3)');
    gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
    return gradient;
  };

  const chartConfig = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Earnings (RWF)',
        data: chartData.earnings,
        borderColor: '#22c55e',
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(34, 197, 94, 0.1)';
          return earningsGradient(ctx);
        },
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#22c55e',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#22c55e',
        pointHoverBorderColor: 'white',
        pointHoverBorderWidth: 3,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context: any) {
            return `Earnings: ${context.parsed.y.toLocaleString()} RWF`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: '#94a3b8',
          font: { size: 11 },
          callback: function(value: any) {
            return value.toLocaleString();
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#94a3b8',
          font: { size: 11 }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="w-48 h-6 bg-gray-200 rounded"></div>
          <div className="w-24 h-8 bg-gray-200 rounded"></div>
        </div>
        <div className="h-80 bg-gray-100 rounded"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-green-50 rounded-lg">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Earnings Trend</h3>
            <p className="text-sm text-gray-500">
              {timeRange === '24h' ? 'Today' : timeRange === '7d' ? 'Last 7 days' : timeRange === '30d' ? 'Last 30 days' : 'Last 90 days'}
            </p>
          </div>
        </div>
        
        {/* Stats Badge */}
        <div className="text-right">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-2xl font-bold text-gray-900">
              {totalEarnings.toLocaleString()}
            </span>
            <span className="text-sm text-gray-500">RWF</span>
          </div>
          <div className="flex items-center justify-end space-x-1">
            <TrendingUp className={`w-4 h-4 ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            <span className={`text-sm font-medium ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
            </span>
            <span className="text-xs text-gray-500">vs last period</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <Line data={chartConfig} options={options} />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Total Trips</p>
          <p className="text-xl font-bold text-gray-900">
            {chartData.trips.reduce((sum, val) => sum + val, 0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Avg per Trip</p>
          <p className="text-xl font-bold text-gray-900">
            {(totalEarnings / chartData.trips.reduce((sum, val) => sum + val, 0)).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Daily Avg</p>
          <p className="text-xl font-bold text-gray-900">
            {avgEarnings.toLocaleString()}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
