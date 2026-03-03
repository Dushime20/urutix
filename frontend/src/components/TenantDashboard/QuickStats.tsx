import React from 'react';
import {
  ArrowUp, ArrowDown, Minus, Truck,
  Box, DollarSign, CheckCircle, Star,
  Route, AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';

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
  const formatCurrency = (amount: number | undefined) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatNumber = (num: number | undefined) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const formatPercentage = (num: number | undefined) => {
    return `${(num || 0).toFixed(1)}%`;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-3 h-3 text-emerald-500" />;
      case 'down': return <ArrowDown className="w-3 h-3 text-rose-500" />;
      case 'stable': return <Minus className="w-3 h-3 text-slate-400" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-emerald-600';
      case 'down': return 'text-rose-600';
      case 'stable': return 'text-slate-500';
    }
  };

  const stats = [
    {
      title: 'Total Revenue',
      value: formatCurrency(metrics?.totalRevenue),
      icon: DollarSign,
      iconColor: 'text-[#1e40af]',
      bgColor: 'bg-[#f0f7ff]',
      trend: 'up' as const,
      change: '+12.5%',
      description: 'vs prev cycle'
    },
    {
      title: 'Active Shipments',
      value: formatNumber(metrics?.totalShipments),
      icon: Box,
      iconColor: 'text-[#1e40af]',
      bgColor: 'bg-[#f0f7ff]',
      trend: 'up' as const,
      change: '+8.3%',
      description: 'vs prev cycle'
    },
    {
      title: 'Live Fleet',
      value: (metrics?.activeFleet || 0).toString(),
      icon: Truck,
      iconColor: 'text-[#1e40af]',
      bgColor: 'bg-[#f0f7ff]',
      trend: 'stable' as const,
      change: '0%',
      description: 'vs prev cycle'
    },
    {
      title: 'Reliability Rate',
      value: formatPercentage(metrics?.onTimeDelivery),
      icon: CheckCircle,
      iconColor: 'text-[#1e40af]',
      bgColor: 'bg-[#f0f7ff]',
      trend: 'up' as const,
      change: '+2.1%',
      description: 'vs prev cycle'
    },
    {
      title: 'Partner Trust',
      value: `${metrics?.customerSatisfaction || 0}/5`,
      icon: Star,
      iconColor: 'text-[#1e40af]',
      bgColor: 'bg-[#f0f7ff]',
      trend: 'up' as const,
      change: '+0.2',
      description: 'vs prev cycle'
    },
    {
      title: 'Fuel Optimization',
      value: `${metrics?.fuelEfficiency || 0} km/L`,
      icon: Route,
      iconColor: 'text-[#1e40af]',
      bgColor: 'bg-[#f0f7ff]',
      trend: 'up' as const,
      change: '+0.3',
      description: 'vs prev cycle'
    },
    {
      title: 'Asset Yield',
      value: formatPercentage(metrics?.averageLoadUtilization),
      icon: Box,
      iconColor: 'text-[#1e40af]',
      bgColor: 'bg-[#f0f7ff]',
      trend: 'up' as const,
      change: '+3.7%',
      description: 'vs prev cycle'
    },
    {
      title: 'Conflict Index',
      value: formatPercentage(metrics?.disputeRate),
      icon: AlertTriangle,
      iconColor: 'text-[#1e40af]',
      bgColor: 'bg-[#f0f7ff]',
      trend: 'down' as const,
      change: '-0.5%',
      description: 'vs prev cycle'
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={index}
            variants={item}
            whileHover={{ y: -4, scale: 1.02 }}
            className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group cursor-default"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${stat.bgColor} transition-transform duration-300 group-hover:scale-110`}>
                <Icon className={`w-4 h-4 ${stat.iconColor}`} />
              </div>
              <div className="flex items-center space-x-1.5 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                {getTrendIcon(stat.trend)}
                <span className={`text-[11px] font-black ${getTrendColor(stat.trend)}`}>
                  {stat.change}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate mb-1">
                {stat.title}
              </h3>
              <p className="text-2xl font-black text-slate-800 tracking-tight">
                {stat.value}
              </p>
              <p className="text-[11px] font-bold text-slate-300 mt-1">
                {stat.description}
              </p>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default QuickStats;

