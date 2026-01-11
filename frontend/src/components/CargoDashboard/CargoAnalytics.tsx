import React, { useMemo } from 'react';
import { TrendingUp, DollarSign, Clock, CheckCircle, Package, AlertTriangle } from 'lucide-react';

interface Cargo {
  id: string;
  loadValue: number;
  status: string;
  createdAt: string;
  pickupDate: string;
  deliveryDate: string;
  urgencyLevel?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
}

interface CargoAnalyticsProps {
  cargos: Cargo[];
}

export const CargoAnalytics: React.FC<CargoAnalyticsProps> = ({ cargos }) => {
  // Calculate analytics
  const analytics = useMemo(() => {
    const totalValue = cargos.reduce((sum, cargo) => sum + (cargo.loadValue || 0), 0);

    // Calculate average delivery time (in days)
    const deliveredCargos = cargos.filter(c => c.status === 'DELIVERED' && c.pickupDate && c.deliveryDate);
    const avgDeliveryTime = deliveredCargos.length > 0
      ? deliveredCargos.reduce((sum, cargo) => {
        const pickup = new Date(cargo.pickupDate).getTime();
        const delivery = new Date(cargo.deliveryDate).getTime();
        const days = (delivery - pickup) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0) / deliveredCargos.length
      : 0;

    // Calculate success rate (delivered / total non-draft)
    const nonDraftCargos = cargos.filter(c => c.status !== 'DRAFT');
    const successRate = nonDraftCargos.length > 0
      ? (cargos.filter(c => c.status === 'DELIVERED').length / nonDraftCargos.length) * 100
      : 0;

    // Status distribution
    const statusDistribution = cargos.reduce((acc, cargo) => {
      acc[cargo.status] = (acc[cargo.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Urgency distribution
    const urgencyDistribution = cargos.reduce((acc, cargo) => {
      const urgency = cargo.urgencyLevel || 'NORMAL';
      acc[urgency] = (acc[urgency] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalValue,
      avgDeliveryTime,
      successRate,
      statusDistribution,
      urgencyDistribution,
      totalCargos: cargos.length,
    };
  }, [cargos]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-600',
      PUBLISHED: 'bg-green-100 text-green-600',
      IN_TRANSIT: 'bg-blue-100 text-blue-600',
      DELIVERED: 'bg-purple-100 text-purple-600',
      CANCELLED: 'bg-red-100 text-red-600',
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  // Get urgency color
  const getUrgencyColor = (urgency: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-yellow-100 text-yellow-600',
      NORMAL: 'bg-blue-100 text-blue-600',
      HIGH: 'bg-orange-100 text-orange-600',
      CRITICAL: 'bg-red-100 text-red-600',
    };
    return colors[urgency] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-6 mb-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Value */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.totalValue)}</p>
            <p className="text-xs text-gray-600 font-medium">Total Cargo Value</p>
          </div>
        </div>

        {/* Average Delivery Time */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <Package className="w-4 h-4 text-blue-500" />
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900">{analytics.avgDeliveryTime.toFixed(1)} days</p>
            <p className="text-xs text-gray-600 font-medium">Avg Delivery Time</p>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900">{analytics.successRate.toFixed(1)}%</p>
            <p className="text-xs text-gray-600 font-medium">Success Rate</p>
          </div>
        </div>

        {/* Total Cargo */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <AlertTriangle className="w-4 h-4 text-orange-500" />
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900">{analytics.totalCargos}</p>
            <p className="text-xs text-gray-600 font-medium">Total Cargo</p>
          </div>
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Distribution */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-primary-600" />
            Cargo by Status
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.statusDistribution).map(([status, count]) => {
              const percentage = (count / analytics.totalCargos) * 100;
              return (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{status}</span>
                    <span className="text-gray-600">{count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getStatusColor(status)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Urgency Distribution */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            Cargo by Urgency
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.urgencyDistribution).map(([urgency, count]) => {
              const percentage = (count / analytics.totalCargos) * 100;
              return (
                <div key={urgency} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{urgency}</span>
                    <span className="text-gray-600">{count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getUrgencyColor(urgency)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};