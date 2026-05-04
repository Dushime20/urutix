import React from 'react';
import {
  Truck,
  Box, DollarSign, CheckCircle, Star,
  Route, AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';

interface Metrics {
  totalRevenue: number;
  totalShipments: number;
  activeTrucks: number;
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
  const { tSync } = useTranslation();
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
      title: 'Total Earnings',
      value: formatCurrency(metrics?.totalRevenue),
      icon: DollarSign,
      themeColor: 'text-primary-600 dark:text-primary-400',
      borderColor: 'border-primary-100 dark:border-primary-900/30',
      shadowColor: 'shadow-primary-100/20 dark:shadow-none'
    },
    {
      title: 'Trips Today',
      value: formatNumber(metrics?.totalShipments),
      icon: Box,
      themeColor: 'text-primary-600 dark:text-primary-400',
      borderColor: 'border-primary-100 dark:border-primary-900/30',
      shadowColor: 'shadow-primary-100/20 dark:shadow-none'
    },
    {
      title: 'Active Trucks',
      value: (metrics?.activeTrucks || 0).toString(),
      icon: Truck,
      themeColor: 'text-primary-600 dark:text-primary-400',
      borderColor: 'border-primary-100 dark:border-primary-900/30',
      shadowColor: 'shadow-primary-100/20 dark:shadow-none'
    },
    {
      title: 'On-Time Delivery',
      value: formatPercentage(metrics?.onTimeDelivery),
      icon: CheckCircle,
      themeColor: 'text-primary-600 dark:text-primary-400',
      borderColor: 'border-primary-100 dark:border-primary-900/30',
      shadowColor: 'shadow-primary-100/20 dark:shadow-none'
    },
    {
      title: 'Customer Rating',
      value: `${metrics?.customerSatisfaction || 0}/5`,
      icon: Star,
      themeColor: 'text-primary-600 dark:text-primary-400',
      borderColor: 'border-primary-100 dark:border-primary-900/30',
      shadowColor: 'shadow-primary-100/20 dark:shadow-none'
    },
    {
      title: 'Fuel Efficiency',
      value: `${metrics?.fuelEfficiency || 0} km/L`,
      icon: Route,
      themeColor: 'text-primary-600 dark:text-primary-400',
      borderColor: 'border-primary-100 dark:border-primary-900/30',
      shadowColor: 'shadow-primary-100/20 dark:shadow-none'
    },
    {
      title: 'Truck Capacity',
      value: formatPercentage(metrics?.averageLoadUtilization),
      icon: Box,
      themeColor: 'text-primary-600 dark:text-primary-400',
      borderColor: 'border-primary-100 dark:border-primary-900/30',
      shadowColor: 'shadow-primary-100/20 dark:shadow-none'
    },
    {
      title: 'Reported Issues',
      value: formatPercentage(metrics?.disputeRate),
      icon: AlertTriangle,
      themeColor: 'text-primary-600 dark:text-primary-400',
      borderColor: 'border-primary-100 dark:border-primary-900/30',
      shadowColor: 'shadow-primary-100/20 dark:shadow-none'
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
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-12 py-10"
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={index}
            variants={item}
            className="flex items-center space-x-6 transition-transform duration-300 hover:translate-x-1 cursor-default group"
          >
            <div className={`relative flex-shrink-0 flex items-center justify-center w-20 h-20 rounded-full bg-white dark:bg-slate-900 border ${stat.borderColor} shadow-xl ${stat.shadowColor} overflow-hidden transition-all duration-500 group-hover:scale-110`}>
              <Icon size={28} className="text-primary-600 dark:text-primary-400" />
            </div>

            <div className="flex flex-col">
              <span className={`text-4xl font-black ${stat.themeColor} tracking-tight leading-none mb-1.5`}>
                {stat.value}
              </span>
              <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 whitespace-nowrap uppercase tracking-[0.2em]">
                <TranslatedText text={stat.title} />
              </span>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default QuickStats;

