import React, { useState, useEffect, useMemo } from 'react';
import { FaEye } from 'react-icons/fa';
import OperationalPageLayout from '../../components/Admin/OperationalPageLayout';
import { operationalAdminApi } from '../../services/operationalAdminApi';
import type { Trip } from '../../services/tenantApi';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../config/errorMessages';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../../components/EnliteUI/Tables';

const OperationalAdminTrips: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const res = await operationalAdminApi.getTrips();
      const raw: any[] = Array.isArray(res) ? res : res?.trips ?? res?.data ?? res?.items ?? [];
      setTrips(raw);
    } catch (error: any) {
      toast.error(getApiErrorMessage(error));
      console.error(error);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<Trip>[] = useMemo(() => [
    {
      key: 'tripNumber',
      label: 'Reference',
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
      key: 'truckNumber',
      label: 'Truck',
      render: (_v, row) => (
        <span className="text-gray-600 dark:text-slate-300">{(row as any).truckNumber || 'Unassigned'}</span>
      ),
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

  const rowActions: TableAction<Trip>[] = useMemo(() => [
    {
      key: 'view',
      label: 'View',
      icon: <FaEye size={14} />,
      onClick: () => {},
    },
  ], []);

  return (
    <OperationalPageLayout
      title="Trip Monitoring"
      description="Manage and monitor all active trips within your operations"
    >
      <StandardDataTable
        columns={columns}
        data={trips}
        loading={loading}
        getRowId={(row) => row.id}
        searchPlaceholder="Search trips by reference..."
        searchKeys={['tripNumber']}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'PLANNED', label: 'Planned' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'DELAYED', label: 'Delayed' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ],
          },
        ]}
        rowActions={rowActions}
        onRefresh={fetchTrips}
        emptyMessage="No trips found matching your criteria."
        ariaLabel="Operational trips"
      />
    </OperationalPageLayout>
  );
};

export default OperationalAdminTrips;
