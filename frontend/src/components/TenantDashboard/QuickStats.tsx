import React from 'react';
import { Truck, DollarSign, AlertTriangle, Route } from 'lucide-react';
import { TranslatedText } from '../translated-text';
import { StatCard } from '../EnliteUI/Cards/StatCard';
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
  const { compact: fmtMoney } = useCurrencyFormat();

  const formatNumber = (num: number | undefined) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const reportedIssuesValue =
    metrics?.openDisputes != null
      ? formatNumber(metrics.openDisputes)
      : `${(metrics?.disputeRate || 0).toFixed(1)}%`;

  const activeTrucksValue = formatNumber(metrics?.activeTrucks ?? metrics?.activeFleet ?? 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title={<TranslatedText text="Total Earnings" />}
        value={fmtMoney(metrics?.totalRevenue || 0)}
        icon={<DollarSign size={22} />}
        color="primary"
        variant="classic"
      />
      <StatCard
        title={<TranslatedText text="Trips Today" />}
        value={formatNumber(metrics?.totalShipments)}
        icon={<Route size={22} />}
        color="primary"
        variant="classic"
      />
      <StatCard
        title={<TranslatedText text="Active Trucks" />}
        value={activeTrucksValue}
        icon={<Truck size={22} />}
        color="primary"
        variant="classic"
      />
      <StatCard
        title={<TranslatedText text="Reported Issues" />}
        value={reportedIssuesValue}
        icon={<AlertTriangle size={22} />}
        color="primary"
        variant="classic"
      />
    </div>
  );
};

export default QuickStats;
