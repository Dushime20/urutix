import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tripsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  FaRoute,
  FaTruck,
  FaEye,
  FaSync,
  FaMapMarkerAlt,
  FaUser,
} from 'react-icons/fa';
import ActiveTrips from '../TenantDashboard/ActiveTrips';
import { formatLocation } from '../../utils/formatLocation';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../EnliteUI/Tables';

interface Trip {
  id: string;
  reference?: string;
  status: string;
  driverName?: string;
  truckNumber?: string;
  routeName?: string;
  origin?: string;
  destination?: string;
  cargoType?: string;
  cargoWeight?: number;
  distance?: number;
  estimatedDuration?: number;
  startTime?: string;
  endTime?: string;
  revenue?: number;
  progress?: number;
  createdAt: string;
  updatedAt: string;
}

const TenantAdminTrips: React.FC = () => {
  const { user } = useAuth();

  const {
    data: tripsData,
    isLoading: tripsLoading,
    error: tripsError,
    refetch: refetchTrips,
  } = useQuery({
    queryKey: ['tenant-trips'],
    queryFn: async () => {
      try {
        const response = await tripsAPI.getAll({});
        const data = response?.data || response;
        if (data?.items && Array.isArray(data.items)) {
          return data.items;
        }
        if (data?.trips && Array.isArray(data.trips)) {
          return data.trips;
        }
        if (Array.isArray(data)) {
          return data;
        }
        return [];
      } catch (error: any) {
        console.error('Error fetching trips:', error);
        return [];
      }
    },
  });

  const trips: Trip[] = Array.isArray(tripsData) ? tripsData : [];

  const columns: Column<Trip>[] = useMemo(() => [
    {
      key: 'reference',
      label: 'Reference',
      alwaysVisible: true,
      render: (_v, trip) => (
        <div className="text-sm font-medium text-gray-900 dark:text-slate-100">
          {trip.reference || trip.id.slice(0, 8)}
        </div>
      ),
    },
    {
      key: 'routeName',
      label: 'Route',
      render: (_v, trip) => (
        <div className="text-sm text-gray-700 dark:text-slate-300">
          {trip.routeName || (
            <span className="flex items-center gap-1 text-xs">
              <FaMapMarkerAlt className="w-3 h-3 text-green-500" />
              {formatLocation(trip.origin, 'N/A')}
              <span className="mx-1">→</span>
              <FaMapMarkerAlt className="w-3 h-3 text-red-500" />
              {formatLocation(trip.destination, 'N/A')}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'driverName',
      label: 'Driver',
      render: (_v, trip) => (
        <div className="text-sm text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
          <FaUser className="w-3 h-3 text-gray-400" />
          {trip.driverName || 'N/A'}
        </div>
      ),
    },
    {
      key: 'truckNumber',
      label: 'Truck',
      render: (_v, trip) => (
        <div className="text-sm text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
          <FaTruck className="w-3 h-3 text-gray-400" />
          {trip.truckNumber || 'N/A'}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_v, trip) => (
        <StatusBadge
          status={trip.status}
          label={(trip.status || 'pending').replace(/_/g, ' ')}
        />
      ),
    },
    {
      key: 'revenue',
      label: 'Revenue',
      render: (_v, trip) => (
        <span className="text-sm text-gray-700 dark:text-slate-300">
          {trip.revenue
            ? `$${typeof trip.revenue === 'number' ? trip.revenue.toFixed(2) : Number(trip.revenue).toFixed(2)}`
            : 'N/A'}
        </span>
      ),
    },
  ], []);

  const rowActions: TableAction<Trip>[] = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: <FaEye className="w-3.5 h-3.5" />,
      onClick: () => {},
    },
  ], []);

  if (tripsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full">
      {user?.tenantId && (
        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm p-6 mb-6">
          <ActiveTrips tenantId={user.tenantId} />
        </div>
      )}

      <StandardDataTable
        title="Trip Management"
        subtitle="Monitor and manage trips in your tenant"
        icon={<FaRoute className="w-5 h-5" />}
        headerColor="primary"
        headerActions={
          <button
            onClick={() => refetchTrips()}
            className="px-3 py-1.5 border border-gray-300 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm"
          >
            <FaSync className="w-3.5 h-3.5" />
            Refresh
          </button>
        }
        columns={columns}
        data={trips}
        loading={tripsLoading}
        error={tripsError ? 'Failed to load trips' : null}
        onRetry={() => refetchTrips()}
        getRowId={(row) => row.id}
        searchPlaceholder="Search trips..."
        searchKeys={['reference', 'driverName', 'truckNumber', 'routeName', 'status']}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'delayed', label: 'Delayed' },
            ],
          },
        ]}
        defaultSortKey="createdAt"
        defaultSortDirection="desc"
        rowActions={rowActions}
        onRefresh={() => refetchTrips()}
        emptyMessage="No trips match your current filters"
        ariaLabel="Tenant trips"
      />
    </div>
  );
};

export default TenantAdminTrips;
