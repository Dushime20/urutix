import React, { useMemo } from 'react';
import { Package, AlertTriangle } from 'lucide-react';

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
      statusDistribution,
      urgencyDistribution,
      totalCargos: cargos.length,
    };
  }, [cargos]);

  // Get status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-600',
      PUBLISHED: 'bg-green-100 text-green-600',
      IN_TRANSIT: 'bg-primary-100 text-primary-600',
      DELIVERED: 'bg-purple-100 text-purple-600',
      CANCELLED: 'bg-red-100 text-red-600',
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  // Get urgency color
  const getUrgencyColor = (urgency: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-yellow-100 text-yellow-600',
      NORMAL: 'bg-primary-100 text-primary-600',
      HIGH: 'bg-orange-100 text-orange-600',
      CRITICAL: 'bg-red-100 text-red-600',
    };
    return colors[urgency] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-6 mb-6">
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
