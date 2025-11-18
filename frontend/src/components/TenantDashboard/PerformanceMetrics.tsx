import React from 'react';
import { FaArrowUp, FaArrowDown, FaMinus, FaTrophy, FaBullseye, FaChartLine } from 'react-icons/fa';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  target: number;
  previous: number;
  trend: 'up' | 'down' | 'stable';
  category: 'revenue' | 'efficiency' | 'quality' | 'safety';
  status: 'excellent' | 'good' | 'average' | 'poor';
}

interface PerformanceMetricsProps {
  tenantId?: string;
  className?: string;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ 
  tenantId, 
  className = '' 
}) => {
  // Mock data - in real app, this would come from API calls
  const metrics: PerformanceMetric[] = [
    {
      name: 'Revenue Growth',
      value: 12.5,
      unit: '%',
      target: 10.0,
      previous: 8.2,
      trend: 'up',
      category: 'revenue',
      status: 'excellent'
    },
    {
      name: 'Fleet Utilization',
      value: 87.3,
      unit: '%',
      target: 85.0,
      previous: 84.1,
      trend: 'up',
      category: 'efficiency',
      status: 'good'
    },
    {
      name: 'On-Time Delivery',
      value: 94.2,
      unit: '%',
      target: 95.0,
      previous: 93.8,
      trend: 'up',
      category: 'quality',
      status: 'good'
    },
    {
      name: 'Fuel Efficiency',
      value: 8.7,
      unit: 'km/L',
      target: 9.0,
      previous: 8.5,
      trend: 'up',
      category: 'efficiency',
      status: 'good'
    },
    {
      name: 'Customer Satisfaction',
      value: 4.6,
      unit: '/5',
      target: 4.5,
      previous: 4.4,
      trend: 'up',
      category: 'quality',
      status: 'excellent'
    },
    {
      name: 'Safety Score',
      value: 98.5,
      unit: '%',
      target: 99.0,
      previous: 98.2,
      trend: 'up',
      category: 'safety',
      status: 'good'
    },
    {
      name: 'Load Optimization',
      value: 92.1,
      unit: '%',
      target: 90.0,
      previous: 89.5,
      trend: 'up',
      category: 'efficiency',
      status: 'excellent'
    },
    {
      name: 'Dispute Rate',
      value: 2.1,
      unit: '%',
      target: 2.0,
      previous: 2.3,
      trend: 'down',
      category: 'quality',
      status: 'good'
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <FaArrowUp className="text-green-500" />;
      case 'down':
        return <FaArrowDown className="text-red-500" />;
      default:
        return <FaMinus className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'average':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'poor':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'revenue':
        return <FaTrophy className="text-yellow-500" />;
      case 'efficiency':
        return <FaChartLine className="text-blue-500" />;
      case 'quality':
        return <FaBullseye className="text-green-500" />;
      case 'safety':
        return <FaBullseye className="text-red-500" />;
      default:
        return <FaBullseye className="text-gray-500" />;
    }
  };

  const getProgressColor = (value: number, target: number) => {
    const percentage = (value / target) * 100;
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 80) return 'bg-blue-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getProgressWidth = (value: number, target: number) => {
    const percentage = Math.min((value / target) * 100, 100);
    return `${percentage}%`;
  };

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
          <div className="flex items-center space-x-2">
            <FaChartLine className="text-blue-500" />
            <span className="text-sm text-gray-500">Real-time tracking</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric) => (
            <div key={metric.name} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(metric.category)}
                  <span className="text-sm font-medium text-gray-900">{metric.category}</span>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(metric.status)}`}>
                  {metric.status}
                </span>
              </div>

              <div className="mb-3">
                <h4 className="text-lg font-semibold text-gray-900 mb-1">
                  {metric.name}
                </h4>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {metric.value}
                  </span>
                  <span className="text-sm text-gray-500">{metric.unit}</span>
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(metric.trend)}
                    <span className={`text-xs font-medium ${
                      metric.trend === 'up' ? 'text-green-600' : 
                      metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {Math.abs(metric.value - metric.previous).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Target: {metric.target}{metric.unit}</span>
                  <span>{((metric.value / metric.target) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(metric.value, metric.target)}`}
                    style={{ width: getProgressWidth(metric.value, metric.target) }}
                  ></div>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                Previous: {metric.previous}{metric.unit}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FaTrophy className="text-blue-500 text-xl" />
            <h4 className="text-lg font-semibold text-blue-900">Performance Summary</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">
                {metrics.filter(m => m.status === 'excellent').length}
              </div>
              <div className="text-sm text-blue-700">Excellent Metrics</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">
                {metrics.filter(m => m.trend === 'up').length}
              </div>
              <div className="text-sm text-blue-700">Improving Metrics</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">
                {((metrics.filter(m => m.value >= m.target).length / metrics.length) * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-blue-700">Target Achievement</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
