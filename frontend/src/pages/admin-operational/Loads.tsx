import React, { useState, useEffect, useMemo } from 'react';
import { FaEye } from 'react-icons/fa';
import OperationalPageLayout from '../../components/Admin/OperationalPageLayout';
import { operationalAdminApi } from '../../services/operationalAdminApi';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../config/errorMessages';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../../components/EnliteUI/Tables';

const OperationalAdminLoads: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [loads, setLoads] = useState<any[]>([]);

  useEffect(() => {
    fetchLoads();
  }, []);

  const fetchLoads = async () => {
    try {
      setLoading(true);
      const res = await operationalAdminApi.getLoads();
      const raw: any[] = Array.isArray(res) ? res : res?.loads ?? res?.data ?? res?.items ?? [];
      setLoads(raw);
    } catch (error: any) {
      toast.error(getApiErrorMessage(error));
      console.error(error);
      setLoads([]);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<any>[] = useMemo(() => [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (_v, row) => (
        <span className="font-semibold text-gray-900 dark:text-white">
          {row.title || `Load #${String(row.id || '').slice(0, 6)}`}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_v, row) => (
        <StatusBadge
          status={row.status}
          label={row.status?.replace(/_/g, ' ') || 'Unknown'}
        />
      ),
    },
    {
      key: 'cargoType',
      label: 'Cargo Type',
      render: (_v, row) => (
        <span className="text-gray-600 dark:text-slate-300">
          {row.cargoType?.replace(/_/g, ' ') || 'General Cargo'}
        </span>
      ),
    },
    {
      key: 'origin',
      label: 'Origin',
      render: (_v, row) => (
        <span className="text-gray-600 dark:text-slate-300">
          {typeof row.origin === 'object' ? row.origin?.name || row.origin?.city : row.origin || 'N/A'}
        </span>
      ),
    },
    {
      key: 'destination',
      label: 'Destination',
      render: (_v, row) => (
        <span className="text-gray-600 dark:text-slate-300">
          {typeof row.destination === 'object' ? row.destination?.name || row.destination?.city : row.destination || 'N/A'}
        </span>
      ),
    },
  ], []);

  const rowActions: TableAction<any>[] = useMemo(() => [
    {
      key: 'view',
      label: 'View',
      icon: <FaEye size={14} />,
      onClick: () => {},
    },
  ], []);

  return (
    <OperationalPageLayout
      title="Load Management"
      description="Manage and monitor all loads within your tenant's operations"
    >
      <StandardDataTable
        columns={columns}
        data={loads}
        loading={loading}
        getRowId={(row) => row.id}
        searchPlaceholder="Search loads by title or location..."
        searchKeys={['title', 'origin', 'destination', 'cargoType']}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'DRAFT', label: 'Draft' },
              { value: 'PUBLISHED', label: 'Published' },
              { value: 'ASSIGNED', label: 'Assigned' },
              { value: 'IN_TRANSIT', label: 'In Transit' },
              { value: 'DELIVERED', label: 'Delivered' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ],
          },
        ]}
        rowActions={rowActions}
        onRefresh={fetchLoads}
        emptyMessage="No loads found matching your criteria."
        ariaLabel="Operational loads"
      />
    </OperationalPageLayout>
  );
};

export default OperationalAdminLoads;
