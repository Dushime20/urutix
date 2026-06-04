import React, { useState, useEffect } from 'react';
import { FaMapMarkedAlt, FaTruck, FaExclamationTriangle } from 'react-icons/fa';
import OperationalPageLayout from '../../components/Admin/OperationalPageLayout';
import { operationalAdminApi } from '../../services/operationalAdminApi';
import type { Trip } from '../../services/tenantApi';
import ModernLoader from '../../components/common/ModernLoader';
import { StatCard } from '../../components/EnliteUI';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const OperationalAdminMonitoring: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [routePerformance, setRoutePerformance] = useState<any[]>([]);

  useEffect(() => {
    if (user?.tenantId) {
      fetchMonitoringData(user.tenantId);
    } else {
      setLoading(false);
    }
  }, [user?.tenantId]);

  const fetchMonitoringData = async (tenantId: string) => {
    try {
      setLoading(true);
      const [tripsData, healthData] = await Promise.all([
        operationalAdminApi.getTrips(),
        operationalAdminApi.getHealth(),
      ]);
      const allTrips: any[] = Array.isArray(tripsData)
        ? tripsData
        : tripsData?.trips ?? tripsData?.data ?? tripsData?.items ?? [];
      // Scope to this tenant only
      const tenantTrips = allTrips.filter((t: any) => !t.tenantId || t.tenantId === tenantId);
      setActiveTrips(tenantTrips.filter((t: any) => ['IN_PROGRESS', 'DELAYED'].includes(t.status)));
      const routes = healthData?.activeRoutes ?? healthData?.routes ?? [];
      setRoutePerformance(Array.isArray(routes) ? routes : []);
    } catch (error) {
      toast.error('Failed to load live monitoring data');
      console.error(error);
      setActiveTrips([]);
      setRoutePerformance([]);
    } finally {
      setLoading(false);
    }
  };

  const delayedTrips = activeTrips.filter(t => t.status === 'DELAYED').length;

  return (
    <OperationalPageLayout
      title="Network Monitoring"
      description="Track active trips and monitor route performance in real-time"
    >
      {loading ? (
        <ModernLoader isLoading={true} type="page" />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Active Trips"
              value={activeTrips.length}
              icon={<FaTruck size={22} />}
              color="primary"
              variant="classic"
              subtitle="Currently in transit"
            />
            <StatCard
              title="Delayed Trips"
              value={delayedTrips}
              icon={<FaExclamationTriangle size={22} />}
              color="error"
              variant="classic"
              subtitle="Action required"
            />
            <StatCard
              title="Monitored Routes"
              value={routePerformance.length}
              icon={<FaMapMarkedAlt size={22} />}
              color="success"
              variant="classic"
              subtitle="Active route analysis"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaMapMarkedAlt className="text-primary-500" /> Live Tracking Feed
            </h3>
            <div className="h-[400px] bg-slate-50 dark:bg-slate-950 rounded-xl flex items-center justify-center border border-dashed border-gray-300 dark:border-slate-700">
              <div className="text-center">
                <FaMapMarkedAlt size={48} className="text-gray-300 dark:text-slate-700 mx-auto mb-4" />
                <p className="text-gray-500 font-semibold">Interactive Map Integration Ready</p>
                <p className="text-sm text-gray-400 mt-2">Currently tracking {activeTrips.length} vehicles</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800">
            <div className="p-4 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Active Trip Status</h3>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Trip Reference</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Origin</th>
                  <th className="px-6 py-4 font-semibold">Destination</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {activeTrips.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No active trips to monitor right now.
                    </td>
                  </tr>
                ) : (
                  activeTrips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4 font-semibold">{trip.tripNumber || `TRP-${trip.id.slice(0, 6)}`}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          trip.status === 'DELAYED' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {trip.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {typeof trip.origin === 'object' ? trip.origin?.name : trip.origin || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {typeof trip.destination === 'object' ? trip.destination?.name : trip.destination || 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </OperationalPageLayout>
  );
};

export default OperationalAdminMonitoring;
