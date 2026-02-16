import React from 'react';
import { Truck, DollarSign, Star, TrendingUp, Package, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface Stat {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  textColor: string;
}

interface DriverQuickStatsProps {
  stats: {
    totalTrips?: number;
    totalEarnings?: number;
    rating?: number;
    completionRate?: number;
    activeTrips?: number;
    hoursWorked?: number;
  };
  isLoading?: boolean;
}

export const DriverQuickStats: React.FC<DriverQuickStatsProps> = ({ stats, isLoading }) => {
  const statCards: Stat[] = [
    {
      label: 'Total Trips',
      value: stats.totalTrips || 0,
      change: 12,
      icon: Truck,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      label: 'Total Earnings',
      value: `$${(stats.totalEarnings || 0).toLocaleString()}`,
      change: 8,
      icon: DollarSign,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      label: 'Rating',
      value: (stats.rating || 0).toFixed(1),
      icon: Star,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    {
      label: 'Completion Rate',
      value: `${stats.completionRate || 0}%`,
      change: 5,
      icon: TrendingUp,
      color: 'purple',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      label: 'Active Trips',
      value: stats.activeTrips || 0,
      icon: Package,
      color: 'orange',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
    {
      label: 'Hours Worked',
      value: `${stats.hoursWorked || 0}h`,
      change: 3,
      icon: Clock,
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              <div className="w-12 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="w-20 h-8 bg-gray-200 rounded mb-2"></div>
            <div className="w-24 h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
              {stat.change !== undefined && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  className={`text-sm font-medium px-2 py-1 rounded-full ${
                    stat.change > 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {stat.change > 0 ? '+' : ''}{stat.change}%
                </motion.span>
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
};
