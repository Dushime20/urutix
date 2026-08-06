import React from 'react';
import { Truck, DollarSign, AlertTriangle } from 'lucide-react';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { StatCard } from '../EnliteUI';

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

  const reportedIssuesValue =
    metrics?.openDisputes != null
      ? formatNumber(metrics.openDisputes)
      : `${(metrics?.disputeRate || 0).toFixed(1)}%`;

  const activeTrucksValue = (metrics?.activeTrucks ?? metrics?.activeFleet ?? 0).toString();

  const stats = [
    {
      title: tSync('Total Earnings'),
      value: formatCurrency(metrics?.totalRevenue),
      icon: <DollarSign className="w-4 h-4" />,
      color: 'primary' as const,
    },
    {
      title: tSync('Trips Today'),
      value: formatNumber(metrics?.totalShipments),
      icon: <Truck className="w-4 h-4" />,
      color: 'accent' as const,
    },
    {
      title: tSync('Active Trucks'),
      value: activeTrucksValue,
      icon: <Truck className="w-4 h-4" />,
      color: 'emerald' as const,
    },
    {
      title: tSync('Reported Issues'),
      value: reportedIssuesValue,
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'warning' as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          title={<TranslatedText text={stat.title} />}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
          variant="premium"
        />
      ))}
    </div>
  );
};

export default QuickStats;
