import React from 'react';
import { 
  FaArrowUp, FaArrowDown, FaMinus, FaTruck, 
  FaBox, FaDollarSign, FaCheckCircle, FaStar,
  FaRoute, FaExclamationTriangle 
} from 'react-icons/fa';

interface Metrics {
  totalRevenue: number;
  totalShipments: number;
  activeFleet: number;
  onTimeDelivery: number;
  customerSatisfaction: number;
  fuelEfficiency: number;
  averageLoadUtilization: number;
  disputeRate: number;
}

interface QuickStatsProps {
  metrics: Metrics;
}

const QuickStats: React.FC<QuickStatsProps> = ({ metrics }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <FaArrowUp className="w-3 h-3 text-green-500" />;
      case 'down': return <FaArrowDown className="w-3 h-3 text-red-500" />;
      case 'stable': return <FaMinus className="w-3 h-3 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      case 'stable': return 'text-gray-600';
    }
  };

  const stats = [
    {
      title: 'Total Revenue',
      value: formatCurrency(metrics.totalRevenue),
      icon: FaDollarSign,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: 'up' as const,
      change: '+12.5%',
      description: 'vs last month'
    },
    {
      title: 'Total Shipments',
      value: formatNumber(metrics.totalShipments),
      icon: FaBox,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: 'up' as const,
      change: '+8.3%',
      description: 'vs last month'
    },
    {
      title: 'Active Fleet',
      value: metrics.activeFleet.toString(),
      icon: FaTruck,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: 'stable' as const,
      change: '0%',
      description: 'vs last month'
    },
    {
      title: 'On-Time Delivery',
      value: formatPercentage(metrics.onTimeDelivery),
      icon: FaCheckCircle,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      trend: 'up' as const,
      change: '+2.1%',
      description: 'vs last month'
    },
    {
      title: 'Customer Satisfaction',
      value: `${metrics.customerSatisfaction}/5`,
      icon: FaStar,
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      trend: 'up' as const,
      change: '+0.2',
      description: 'vs last month'
    },
    {
      title: 'Fuel Efficiency',
      value: `${metrics.fuelEfficiency} km/L`,
      icon: FaRoute,
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      trend: 'up' as const,
      change: '+0.3',
      description: 'vs last month'
    },
    {
      title: 'Load Utilization',
      value: formatPercentage(metrics.averageLoadUtilization),
      icon: FaBox,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      trend: 'up' as const,
      change: '+3.7%',
      description: 'vs last month'
    },
    {
      title: 'Dispute Rate',
      value: formatPercentage(metrics.disputeRate),
      icon: FaExclamationTriangle,
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50',
      trend: 'down' as const,
      change: '-0.5%',
      description: 'vs last month'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
              <div className="flex items-center space-x-1">
                {getTrendIcon(stat.trend)}
                <span className={`text-sm font-medium ${getTrendColor(stat.trend)}`}>
                  {stat.change}
                </span>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500 truncate">
                {stat.title}
              </h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stat.value}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {stat.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QuickStats;
