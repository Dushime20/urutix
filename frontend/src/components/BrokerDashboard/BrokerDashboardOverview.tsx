import React from 'react';
import { Package, TrendingUp, AlertTriangle, CheckCircle, Navigation } from 'lucide-react';

interface BrokerDashboardOverviewProps {
  stats: {
    totalAssigned: number;
    activeAuctions: number;
    inTransit: number;
    delivered: number;
  };
}

export const BrokerDashboardOverview: React.FC<BrokerDashboardOverviewProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Assigned Cargo</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalAssigned}</h3>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Auctions</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.activeAuctions}</h3>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">In Transit</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.inTransit}</h3>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <Navigation className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Delivered</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.delivered}</h3>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
