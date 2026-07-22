import React, { useState, useEffect } from 'react';
import { FaChartLine } from 'react-icons/fa';
import OperationalPageLayout from '../../components/Admin/OperationalPageLayout';
import { operationalAdminApi } from '../../services/operationalAdminApi';
import ModernLoader from '../../components/common/ModernLoader';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../config/errorMessages';
const OperationalAdminAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    if (user?.tenantId) {
      fetchAnalytics(user.tenantId, timeRange);
    } else {
      setLoading(false);
    }
  }, [user?.tenantId, timeRange]);

  const fetchAnalytics = async (tenantId: string, range: string) => {
    try {
      setLoading(true);
      const data = await operationalAdminApi.getAnalyticsOverview();
      setMetrics(data);
    } catch (error: any) {
      toast.error(getApiErrorMessage(error));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <OperationalPageLayout
      title="Operational Analytics"
      description="Analyze key performance indicators and operational metrics"
    >
      {loading && !metrics ? (
        <ModernLoader isLoading={true} type="page" />
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end mb-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Performance Insights</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Fuel Efficiency</p>
                    <p className="text-xs text-gray-500 mt-1">Average kilometers per liter</p>
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{metrics?.fuelEfficiency || 0} km/L</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Load Utilization</p>
                    <p className="text-xs text-gray-500 mt-1">Average capacity utilized per trip</p>
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{metrics?.averageLoadUtilization || 0}%</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Dispute Rate</p>
                    <p className="text-xs text-gray-500 mt-1">Percentage of trips with disputes</p>
                  </div>
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-500">{metrics?.disputeRate || 0}%</span>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 flex items-center justify-center flex-col">
               <FaChartLine size={48} className="text-gray-300 dark:text-slate-700 mb-4" />
               <p className="text-gray-500 font-semibold">Trend Charts Placeholder</p>
               <p className="text-sm text-gray-400 mt-2">Will be rendered with charting library</p>
            </div>
          </div>
        </div>
      )}
    </OperationalPageLayout>
  );
};

export default OperationalAdminAnalytics;
