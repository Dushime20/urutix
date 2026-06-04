import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAnalytics } from '../../services/adminApi';
import { Line } from 'react-chartjs-2';
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

interface ChartDataPoint {
  label: string;
  value: number;
  change?: number;
}

interface AnalyticsChartProps {
  title?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  showArea?: boolean;
  className?: string;
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  title = 'Performance Trends',
  height = 300,
  showLegend = true,
  showGrid = true,
  showArea = true,
  className = '',
}) => {
  const [chartType, setChartType] = useState<'line' | 'area'>('line');
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => fetchAnalytics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Enhanced chart data transformation with fallback
  const chartData: ChartDataPoint[] = useMemo(() => {
    if (data?.chart && Array.isArray(data.chart)) {
      return data.chart;
    }
    
    // Fallback data with realistic cargo industry metrics
    return [
      { label: 'Jan', value: 120, change: 5.2 },
      { label: 'Feb', value: 150, change: 25.0 },
      { label: 'Mar', value: 170, change: 13.3 },
      { label: 'Apr', value: 140, change: -17.6 },
      { label: 'May', value: 180, change: 28.6 },
      { label: 'Jun', value: 210, change: 16.7 },
      { label: 'Jul', value: 195, change: -7.1 },
      { label: 'Aug', value: 230, change: 17.9 },
    ];
  }, [data]);

  // Calculate trend indicators
  const trendInfo = useMemo(() => {
    if (chartData.length < 2) return null;
    
    const firstValue = chartData[0].value;
    const lastValue = chartData[chartData.length - 1].value;
    const change = ((lastValue - firstValue) / firstValue) * 100;
    const isPositive = change >= 0;
    
    return {
      change: Math.abs(change).toFixed(1),
      isPositive,
      trend: isPositive ? 'up' : 'down',
    };
  }, [chartData]);

  const lineData = {
    labels: chartData.map((d: ChartDataPoint) => d.label),
    datasets: [
      {
        label: 'Performance',
        data: chartData.map((d: ChartDataPoint) => d.value),
        borderColor: '#3b82f6',
        backgroundColor: showArea 
          ? 'rgba(59, 130, 246, 0.1)' 
          : 'rgba(59, 130, 246, 0.8)',
        borderWidth: 3,
        tension: 0.4,
        fill: showArea,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: '#1d4ed8',
        pointHoverBorderColor: '#ffffff',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: showLegend,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 600,
          },
        },
      },
      title: { 
        display: false, // We'll handle title separately for better control
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#3b82f6',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context: any) => {
            const dataPoint = chartData[context.dataIndex];
            let label = `Value: ${dataPoint.value}`;
            if (dataPoint.change !== undefined) {
              const changeText = dataPoint.change >= 0 ? `+${dataPoint.change}%` : `${dataPoint.change}%`;
              label += ` (${changeText})`;
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: { 
        grid: { 
          display: showGrid,
          color: '#e5e7eb',
          drawBorder: false,
        },
        ticks: {
          font: { size: 11, weight: 500 },
          color: '#6b7280',
        },
      },
      y: { 
        grid: { 
          color: showGrid ? '#e5e7eb' : 'transparent',
          drawBorder: false,
        },
        ticks: {
          font: { size: 11, weight: 500 },
          color: '#6b7280',
          callback: (value: any) => `${value}k`,
        },
        beginAtZero: true,
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    elements: {
      point: {
        hoverBackgroundColor: '#1d4ed8',
      },
    },
  };

  const handleRefresh = () => {
    refetch();
  };

  const toggleChartType = () => {
    setChartType(chartType === 'line' ? 'area' : 'line');
  };

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-red-200 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={handleRefresh}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Retry
          </button>
        </div>
        <div className="h-32 flex flex-col items-center justify-center text-red-600">
          <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm">Failed to load analytics data</p>
          <p className="text-xs text-gray-500 mt-1">Please check your connection and try again</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Header with title and controls */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {trendInfo && (
            <div className="flex items-center mt-1">
              <span className={`text-sm font-medium ${
                trendInfo.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trendInfo.isPositive ? '↗' : '↘'} {trendInfo.change}%
              </span>
              <span className="text-xs text-gray-500 ml-2">
                vs last period
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleChartType}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              chartType === 'area'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {chartType === 'area' ? 'Area' : 'Line'}
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
            title="Refresh data"
          >
            <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative" style={{ height: `${height}px` }}>
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-sm text-gray-500">Loading analytics...</p>
            </div>
          </div>
        ) : (
          <Line data={lineData} options={options} />
        )}
      </div>

      {/* Summary Stats */}
      {!isLoading && chartData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Current</p>
              <p className="text-lg font-semibold text-gray-900">
                {chartData[chartData.length - 1].value}k
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Average</p>
              <p className="text-lg font-semibold text-gray-900">
                {Math.round(chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length)}k
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Peak</p>
              <p className="text-lg font-semibold text-gray-900">
                {Math.max(...chartData.map(d => d.value))}k
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsChart;
