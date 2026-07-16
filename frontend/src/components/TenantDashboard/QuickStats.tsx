import React from 'react';
import {
  Truck,
  DollarSign, AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

interface Metrics {
  totalRevenue: number;
  totalShipments: number;
  activeTrucks?: number;
  activeFleet?: number;
  onTimeDelivery: number;
  customerSatisfaction: number;
  fuelEfficiency: number;
  averageLoadUtilization: number;
  disputeRate: number;
  openDisputes?: number;
}

interface QuickStatsProps {
  metrics: Metrics;
}

const QuickStats: React.FC<QuickStatsProps> = ({ metrics }) => {
  const { tSync } = useTranslation();
  const { format: formatCurrency } = useCurrencyFormat();

  const formatNumber = (num: number | undefined) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  // Reported Issues: prefer openDisputes count, fall back to disputeRate % display
  const reportedIssuesValue = metrics?.openDisputes != null
    ? formatNumber(metrics.openDisputes)
    : `${(metrics?.disputeRate || 0).toFixed(1)}%`;

  // Active trucks: prefer activeTrucks, fall back to activeFleet
  const activeTrucksValue = (metrics?.activeTrucks ?? metrics?.activeFleet ?? 0).toString();

  const stats = [
    {
      title: 'Total Earnings',
      value: formatCurrency(metrics?.totalRevenue),
      icon: DollarSign,
    },
    {
      title: 'Trips Today',
      value: formatNumber(metrics?.totalShipments),
      icon: Truck,
    },
    {
      title: 'Active Trucks',
      value: activeTrucksValue,
      icon: Truck,
    },
    {
      title: 'Reported Issues',
      value: reportedIssuesValue,
      icon: AlertTriangle,
    },
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
      className="grid grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-12 py-10"
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={index}
            variants={item}
            className="flex items-center space-x-6 transition-transform duration-300 hover:translate-x-1 cursor-default group"
          >
            <div className="relative flex-shrink-0 flex items-center justify-center w-20 h-20 rounded-full bg-white dark:bg-slate-900 border border-primary-100 dark:border-primary-900/30 shadow-xl shadow-primary-100/20 dark:shadow-none overflow-hidden transition-all duration-500 group-hover:scale-110">
              <Icon size={28} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-4xl font-black text-primary-600 dark:text-primary-400 tracking-tight leading-none mb-1.5">
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

