import React from 'react';
import {
  Truck,
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

  const stats = [
    {
      title: 'Total Revenue',
      value: formatCurrency(metrics?.totalRevenue),
      icon: DollarSign,
      themeColor: 'text-[#ff9800]',
      borderColor: 'border-[#ff9800]',
      shadowColor: 'shadow-[#ff9800]/20'
    },
    {
      title: 'Active Shipments',
      value: formatNumber(metrics?.totalShipments),
      icon: Box,
      themeColor: 'text-[#9c27b0]',
      borderColor: 'border-[#9c27b0]',
      shadowColor: 'shadow-[#9c27b0]/20'
    },
    {
      title: 'Live Fleet',
      value: (metrics?.activeFleet || 0).toString(),
      icon: Truck,
      themeColor: 'text-[#e91e63]',
      borderColor: 'border-[#e91e63]',
      shadowColor: 'shadow-[#e91e63]/20'
    },
    {
      title: 'Reliability Rate',
      value: formatPercentage(metrics?.onTimeDelivery),
      icon: CheckCircle,
      themeColor: 'text-[#3f51b5]',
      borderColor: 'border-[#3f51b5]',
      shadowColor: 'shadow-[#3f51b5]/20'
    },
    {
      title: 'Partner Trust',
      value: `${metrics?.customerSatisfaction || 0}/5`,
      icon: Star,
      themeColor: 'text-[#ff9800]',
      borderColor: 'border-[#ff9800]',
      shadowColor: 'shadow-[#ff9800]/20'
    },
    {
      title: 'Fuel Optimization',
      value: `${metrics?.fuelEfficiency || 0} L/km`,
      icon: Route,
      themeColor: 'text-[#9c27b0]',
      borderColor: 'border-[#9c27b0]',
      shadowColor: 'shadow-[#9c27b0]/20'
    },
    {
      title: 'Asset Yield',
      value: formatPercentage(metrics?.averageLoadUtilization),
      icon: Box,
      themeColor: 'text-[#e91e63]',
      borderColor: 'border-[#e91e63]',
      shadowColor: 'shadow-[#e91e63]/20'
    },
    {
      title: 'Conflict Index',
      value: formatPercentage(metrics?.disputeRate),
      icon: AlertTriangle,
      themeColor: 'text-[#3f51b5]',
      borderColor: 'border-[#3f51b5]',
      shadowColor: 'shadow-[#3f51b5]/20'
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10 py-6"
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={index}
            variants={item}
            className="flex items-center space-x-5 transition-transform duration-300 hover:translate-x-1"
          >
            <div className={`relative flex-shrink-0 items-center justify-center w-16 h-16 rounded-full bg-white border ${stat.borderColor} ${stat.shadowColor} shadow-lg overflow-hidden transition-all duration-500 hover:scale-110 flex`}>
              <Icon className="w-8 h-8 text-[#009688]" strokeWidth={2.5} />
            </div>

            <div className="flex flex-col">
              <span className={`text-2xl font-black ${stat.themeColor} tracking-tight leading-none mb-1`}>
                {stat.value}
              </span>
              <span className="text-[14px] font-bold text-slate-500 whitespace-nowrap">
                {stat.title}
              </span>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default QuickStats;

