import React from 'react';
import { Bar } from 'react-chartjs-2';
import { TrendingUp, Award } from 'lucide-react';
import { motion } from 'framer-motion';
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

  // Calculate overall performance score
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
      'On-Time Delivery',
      'Safety Score',
      'Customer Rating',
      'Fuel Efficiency',
      'Load Utilization',
      'Response Time'
    ],
    datasets: [
      {
        label: 'Performance Score (%)',
        data: [
          performanceData.onTimeDelivery,
          performanceData.safetyScore,
          performanceData.customerRating,
          performanceData.fuelEfficiency,
          performanceData.loadUtilization,
          performanceData.responseTime
        ],
        backgroundColor: [
          'rgba(99, 102, 241, 0.85)',
          'rgba(34, 197, 94, 0.85)',
          'rgba(245, 158, 11, 0.85)',
          'rgba(239, 68, 68, 0.85)',
          'rgba(139, 92, 246, 0.85)',
          'rgba(20, 184, 166, 0.85)',
        ],
        borderRadius: 8,
        barThickness: 40,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
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
            return `Score: ${context.parsed.x}%`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: '#94a3b8',
          font: { size: 11 },
          callback: function(value: any) {
            return value + '%';
          }
        }
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          color: '#475569',
          font: { size: 12, weight: 500 }
        }
      }
    }
  };

  // Get performance level
  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (score >= 80) return { label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    if (score >= 70) return { label: 'Average', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    return { label: 'Needs Improvement', color: 'text-red-600', bgColor: 'bg-red-50' };
  };

  const performanceLevel = getPerformanceLevel(overallScore);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="w-48 h-6 bg-gray-200 rounded"></div>
          <div className="w-32 h-10 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-96 bg-gray-100 rounded"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-50 rounded-lg">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Performance Metrics</h3>
            <p className="text-sm text-gray-500">Key performance indicators</p>
          </div>
        </div>
        
        {/* Overall Score Badge */}
        <div className={`px-4 py-2 rounded-full ${performanceLevel.bgColor} flex items-center space-x-2`}>
          <Award className={`w-5 h-5 ${performanceLevel.color}`} />
          <div className="text-right">
            <div className={`text-2xl font-bold ${performanceLevel.color}`}>
              {overallScore}%
            </div>
            <div className={`text-xs font-medium ${performanceLevel.color}`}>
              {performanceLevel.label}
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96">
        <Bar data={chartConfig} options={options} />
      </div>

      {/* Performance Insights */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Performance Insights</h4>
        <div className="grid grid-cols-2 gap-3">
          {/* Strengths */}
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xs font-medium text-green-700 mb-1">Top Strength</p>
            <p className="text-sm font-bold text-green-900">
              {Object.entries(performanceData).reduce((a, b) => 
                performanceData[a[0] as keyof typeof performanceData] > performanceData[b[0] as keyof typeof performanceData] ? a : b
              )[0].replace(/([A-Z])/g, ' $1').trim()}
            </p>
            <p className="text-xs text-green-600 mt-1">
              {Math.max(...Object.values(performanceData))}% score
            </p>
          </div>

          {/* Areas for Improvement */}
          <div className="bg-amber-50 rounded-lg p-3">
            <p className="text-xs font-medium text-amber-700 mb-1">Focus Area</p>
            <p className="text-sm font-bold text-amber-900">
              {Object.entries(performanceData).reduce((a, b) => 
                performanceData[a[0] as keyof typeof performanceData] < performanceData[b[0] as keyof typeof performanceData] ? a : b
              )[0].replace(/([A-Z])/g, ' $1').trim()}
            </p>
            <p className="text-xs text-amber-600 mt-1">
              {Math.min(...Object.values(performanceData))}% score
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
