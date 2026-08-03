import React, { useState, useEffect, useMemo } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import OperationalPageLayout from '../../components/Admin/OperationalPageLayout';
import { operationalAdminApi } from '../../services/operationalAdminApi';
import type { Bid } from '../../services/tenantApi';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../config/errorMessages';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../../components/EnliteUI/Tables';

const OperationalAdminBidding: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bids, setBids] = useState<Bid[]>([]);

  useEffect(() => {
    if (user?.tenantId) {
      fetchBids(user.tenantId);
    } else {
      setLoading(false);
    }
  }, [user?.tenantId]);

  const fetchBids = async (tenantId: string) => {
    try {
      setLoading(true);
      const bidsRes = await operationalAdminApi.getBids();
      const rawBids: any[] = Array.isArray(bidsRes) ? bidsRes : bidsRes?.bids ?? bidsRes?.data ?? bidsRes?.items ?? [];
      const tenantBids = rawBids.filter((b: any) => !b.tenantId || b.tenantId === tenantId);
      setBids(tenantBids);
    } catch (error: any) {
      toast.error(getApiErrorMessage(error));
      console.error(error);
      setBids([]);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<Bid>[] = useMemo(() => [
    {
      key: 'loadId',
      label: 'Load / Route',
      sortable: true,
      render: (_v, row) => (
        <div>
          <div className="font-semibold text-gray-900 dark:text-white">{row.loadId || 'Unknown Load'}</div>
          <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
            <FaMapMarkerAlt size={10} /> {(row as any).loadOrigin} → {(row as any).loadDestination}
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (_v, row) => (
        <span className="font-bold text-gray-900 dark:text-gray-100">
          ${row.amount?.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'driverName',
      label: 'Driver / Truck',
      render: (_v, row) => (
        <div>
          <div className="text-gray-900 dark:text-gray-200">{(row as any).driverName || 'Unassigned'}</div>
          <div className="text-xs text-gray-500 mt-1">Truck: {(row as any).truckId || 'N/A'}</div>
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (_v, row) => (
        <span className="text-gray-600 dark:text-slate-300">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_v, row) => (
        <StatusBadge status={row.status} label={row.status} />
      ),
    },
  ], []);

  const rowActions: TableAction<Bid>[] = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      onClick: () => {},
    },
  ], []);

  return (
    <OperationalPageLayout
      title="Bidding Management"
      description="Review and manage freight bids from carriers and drivers"
    >
      <StandardDataTable
        columns={columns}
        data={bids}
        loading={loading}
        getRowId={(row) => row.id}
        searchPlaceholder="Search bids by load ID or driver name..."
        searchKeys={['loadId', 'driverName']}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'pending', label: 'Pending' },
              { value: 'accepted', label: 'Accepted' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'withdrawn', label: 'Withdrawn' },
            ],
          },
        ]}
        defaultSortKey="createdAt"
        defaultSortDirection="desc"
        rowActions={rowActions}
        onRefresh={() => user?.tenantId && fetchBids(user.tenantId)}
        emptyMessage="No bids found matching your criteria."
        ariaLabel="Operational bids"
      />
    </OperationalPageLayout>
  );
};

export default OperationalAdminBidding;
