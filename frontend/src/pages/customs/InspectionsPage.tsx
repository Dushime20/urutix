import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Plus, Eye } from 'lucide-react';
import { customsApi } from '../../services/customsApi';
import {
  StandardDataTable,
  StatusBadge,
  type Column,
  type TableAction,
  type StatusBadgeVariant,
} from '../../components/EnliteUI/Tables';

const BRAND = '#2c5173';

const STATUSES = ['PENDING', 'IN_PROGRESS', 'CLEARED', 'REJECTED', 'ON_HOLD', 'HIGH_RISK'];
const RISKS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const riskVariant: Record<string, StatusBadgeVariant> = {
  LOW: 'success',
  MEDIUM: 'warning',
  HIGH: 'error',
  CRITICAL: 'error',
};

const InspectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [risk, setRisk] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['customs-inspections', status, risk, search, page, pageSize],
    queryFn: () => customsApi.getInspections({
      status: status || undefined,
      riskLevel: risk || undefined,
      search: search || undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    refetchInterval: 30000,
  });

  const inspections: any[] = data?.data?.data || [];
  const total: number = data?.data?.total || 0;

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
      label: 'Cargo Type',
      sortable: true,
      render: (value: string) => value || '—',
    },
    {
      key: 'originCountry',
      label: 'Route',
      render: (_: any, ins: any) =>
        ins.originCountry && ins.destinationCountry
          ? `${ins.originCountry} → ${ins.destinationCountry}`
          : ins.originCountry || ins.destinationCountry || '—',
    },
    {
      key: 'driverName',
      label: 'Driver',
      sortable: true,
      render: (value: string) => value || '—',
    },
    {
      key: 'checkpointName',
      label: 'Checkpoint',
      sortable: true,
      render: (value: string) => value || '—',
    },
    {
      key: 'riskLevel',
      label: 'Risk',
      sortable: true,
      render: (value: string) => (
        <StatusBadge
          label={value}
          variant={riskVariant[value] || 'neutral'}
          status={value}
        />
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <StatusBadge
          status={value}
          label={value?.replace(/_/g, ' ')}
        />
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
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
    <div className="space-y-6 p-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: BRAND }}>
            <ShieldCheck size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">All Inspections</h1>
            <p className="text-xs text-slate-400">{total} total inspections</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard/customs/inspections/new')}
          className="px-5 py-2.5 rounded-xl text-white text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
          style={{ background: BRAND }}
        >
          <Plus size={15} /> New Inspection
        </button>
      </div>

      <StandardDataTable
        embedded
        columns={columns}
        data={inspections}
        loading={isLoading}
        getRowId={(row) => row.id}
        onRowClick={(row) => navigate(`/dashboard/customs/inspections/${row.id}`)}
        searchable
        searchPlaceholder="Search plate, ref, container, driver…"
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
          },
          {
            key: 'riskLevel',
            label: 'Risk Level',
            options: RISKS.map((r) => ({ value: r, label: r })),
          },
        ]}
        filterValues={{ status: status || 'all', riskLevel: risk || 'all' }}
        onFilterChange={(key, value) => {
          const next = value === 'all' ? '' : value;
          if (key === 'status') setStatus(next);
          if (key === 'riskLevel') setRisk(next);
          setPage(1);
        }}
        pagination
        pageSize={pageSize}
        page={page}
        totalItems={total}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        columnVisibility
        stickyHeader
        striped
        hoverable
        emptyMessage="No inspections found"
        rowActions={rowActions}
        onRefresh={() => refetch()}
        ariaLabel="Customs inspections"
      />
    </div>
  );
};

export default InspectionsPage;
