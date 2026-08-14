import React from 'react';
import { Truck, DollarSign, AlertTriangle, Route } from 'lucide-react';
import { motion } from 'framer-motion';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';

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

  const formatNumber = (num: number | undefined) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const reportedIssuesValue =
    metrics?.openDisputes != null
      ? formatNumber(metrics.openDisputes)
      : `${(metrics?.disputeRate || 0).toFixed(1)}%`;

  const activeTrucksValue = (metrics?.activeTrucks ?? metrics?.activeFleet ?? 0).toString();

  const stats = [
    {
      title: tSync('Total Earnings'),
      value: `${formatNumber(metrics?.totalRevenue)} TRX`,
      icon: DollarSign,
    },
    {
      title: tSync('Trips Today'),
      value: formatNumber(metrics?.totalShipments),
      icon: Route,
    },
    {
      title: tSync('Active Trucks'),
      value: activeTrucksValue,
      icon: Truck,
    },
    {
      title: tSync('Reported Issues'),
      value: reportedIssuesValue,
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-5"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="ui-label mb-0 text-slate-500 dark:text-slate-400 truncate">
                  <TranslatedText text={stat.title} />
                </p>
                <p className="mt-1.5 ui-page-title truncate">
                  {stat.value}
                </p>
              </div>
              <div className="shrink-0 p-2 rounded-xl bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                <Icon className="w-4 h-4" />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default QuickStats;
