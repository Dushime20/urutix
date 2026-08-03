import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Archive, Eye, CheckCircle } from 'lucide-react';
import { customsApi } from '../../services/customsApi';
import {
  StandardDataTable,
  StatusBadge,
  type Column,
  type TableAction,
} from '../../components/EnliteUI/Tables';

const ClearedShipmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['customs-cleared', search],
    queryFn: () => customsApi.getInspections({ status: 'CLEARED', search: search || undefined, limit: 50 }),
    refetchInterval: 60000,
  });

  const inspections: any[] = data?.data?.data || [];
  const total = data?.data?.total || 0;

  const columns: Column<any>[] = useMemo(() => [
    {
      key: 'plateNumber',
      label: 'Plate / Ref',
      sortable: true,
      alwaysVisible: true,
      render: (_: any, ins: any) => (
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-white">{ins.plateNumber || '—'}</p>
          <p className="text-[10px] font-mono text-slate-400">{ins.shipmentReference || ins.containerNumber || '—'}</p>
        </div>
      ),
    },
    {
      key: 'cargoType',
      label: 'Cargo',
      sortable: true,
      render: (value: string) => value || '—',
    },
    {
      key: 'originCountry',
      label: 'Route',
      render: (_: any, ins: any) =>
        ins.originCountry && ins.destinationCountry
          ? `${ins.originCountry} → ${ins.destinationCountry}`
          : '—',
    },
    {
      key: 'checkpointName',
      label: 'Checkpoint',
      sortable: true,
      render: (value: string) => value || '—',
    },
    {
      key: 'completedAt',
      label: 'Cleared At',
      sortable: true,
      render: (_: any, ins: any) => (
        <div className="flex items-center gap-1.5">
          <CheckCircle size={12} className="text-emerald-500" />
          <StatusBadge
            status="cleared"
            label={
              ins.completedAt
                ? new Date(ins.completedAt).toLocaleDateString()
                : new Date(ins.updatedAt).toLocaleDateString()
            }
            variant="success"
          />
        </div>
      ),
    },
  ], []);

  const rowActions: TableAction<any>[] = useMemo(() => [
    {
      key: 'view',
      label: 'View inspection',
      icon: <Eye size={14} />,
      onClick: (row) => navigate(`/dashboard/customs/inspections/${row.id}`),
    },
  ], [navigate]);

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
          <Archive size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">Cleared Shipments</h1>
          <p className="text-xs text-slate-400">{total} shipments cleared</p>
        </div>
      </div>

      <StandardDataTable
        embedded
        columns={columns}
        data={inspections}
        loading={isLoading}
        getRowId={(row) => row.id}
        onRowClick={(row) => navigate(`/dashboard/customs/inspections/${row.id}`)}
        searchable
        searchPlaceholder="Search plate, ref, container…"
        searchValue={search}
        onSearchChange={setSearch}
        searchKeys={['plateNumber', 'shipmentReference', 'containerNumber', 'cargoType', 'checkpointName']}
        pagination
        pageSize={10}
        columnVisibility
        stickyHeader
        striped
        hoverable
        emptyMessage="No cleared shipments"
        rowActions={rowActions}
        ariaLabel="Cleared shipments"
      />
    </div>
  );
};

export default ClearedShipmentsPage;
