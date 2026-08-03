import React, { useState, useEffect, useMemo } from 'react';
import { FaMapMarkedAlt } from 'react-icons/fa';
import OperationalPageLayout from '../../components/Admin/OperationalPageLayout';
import { operationalAdminApi } from '../../services/operationalAdminApi';
import type { Trip } from '../../services/tenantApi';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../config/errorMessages';
import { StandardDataTable, StatusBadge, type Column } from '../../components/EnliteUI/Tables';

const OperationalAdminMonitoring: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);

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
      const tripsData = await operationalAdminApi.getTrips();
      const allTrips: any[] = Array.isArray(tripsData)
        ? tripsData
        : tripsData?.trips ?? tripsData?.data ?? tripsData?.items ?? [];
      const tenantTrips = allTrips.filter((t: any) => !t.tenantId || t.tenantId === tenantId);
      setActiveTrips(tenantTrips.filter((t: any) => ['IN_PROGRESS', 'DELAYED'].includes(t.status)));
    } catch (error: any) {
      toast.error(getApiErrorMessage(error));
      console.error(error);
      setActiveTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<Trip>[] = useMemo(() => [
    {
      key: 'tripNumber',
      label: 'Trip Reference',
      sortable: true,
      render: (_v, row) => (
        <span className="font-semibold text-gray-900 dark:text-white">
          {row.tripNumber || `TRP-${String(row.id || '').slice(0, 6)}`}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_v, row) => <StatusBadge status={row.status} label={row.status} />,
    },
    {
      key: 'origin',
      label: 'Origin',
      render: (_v, row) => (
        <span className="text-gray-600 dark:text-slate-300">
          {typeof row.origin === 'object' ? (row.origin as any)?.name : row.origin || 'N/A'}
        </span>
      ),
    },
    {
      key: 'destination',
      label: 'Destination',
      render: (_v, row) => (
        <span className="text-gray-600 dark:text-slate-300">
          {typeof row.destination === 'object' ? (row.destination as any)?.name : row.destination || 'N/A'}
        </span>
      ),
    },
  ], []);

  return (
    <OperationalPageLayout
      title="Network Monitoring"
      description="Track active trips and monitor route performance in real-time"
    >
      <div className="space-y-6">
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

        <StandardDataTable
          title="Active Trip Status"
          columns={columns}
          data={activeTrips}
          loading={loading}
          getRowId={(row) => row.id}
          searchPlaceholder="Search active trips..."
          searchKeys={['tripNumber']}
          onRefresh={() => user?.tenantId && fetchMonitoringData(user.tenantId)}
          emptyMessage="No active trips to monitor right now."
          ariaLabel="Active trip monitoring"
        />
      </div>
    </OperationalPageLayout>
  );
};

export default OperationalAdminMonitoring;
