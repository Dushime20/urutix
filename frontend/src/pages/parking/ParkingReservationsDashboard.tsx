import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, CheckCircle2, Clock, AlertTriangle, XCircle, CalendarDays } from 'lucide-react';
import { StatCard } from '../../components/EnliteUI';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../../components/EnliteUI/Tables';
import { parkingApi } from '../../services/parkingApi';
import { getApiErrorMessage } from '../../config/errorMessages';
import { PARKING_STATUS_LABELS, type ParkingReservation } from '../../types/parking';
import { TranslatedText } from '../../components/translated-text';
import { usePermission } from '../../contexts/PermissionContext';

const ParkingReservationsDashboard = ({ basePath = '/dashboard/parking/reservations' }: { basePath?: string }) => {
  const navigate = useNavigate();
  const { can } = usePermission();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const statsQuery = useQuery({
    queryKey: ['parking-reservation-stats'],
    queryFn: parkingApi.stats,
  });

  const listQuery = useQuery({
    queryKey: ['parking-reservations', search, status, page],
    queryFn: () =>
      parkingApi.list({
        search: search || undefined,
        status: status === 'all' ? undefined : status,
        page,
        limit: 10,
        sortBy: 'createdAt',
        sortDir: 'DESC',
      }),
  });

  const stats = statsQuery.data;
  const rows = listQuery.data?.items || [];

  const columns: Column<ParkingReservation>[] = useMemo(() => [
    {
      key: 'reservationReference',
      label: 'Reference',
      sortable: true,
      render: (_v, row) => <span className="font-bold text-slate-900 dark:text-white">{row.reservationReference}</span>,
    },
    { key: 'companyName', label: 'Company', sortable: true },
    { key: 'mcNumber', label: 'MC Number' },
    { key: 'usdotNumber', label: 'USDOT' },
    {
      key: 'email',
      label: 'Contact',
      render: (_v, row) => (
        <div>
          <div className="font-semibold">{row.driverFirstName} {row.driverLastName}</div>
          <div className="text-xs text-slate-500">{row.driverEmail || row.email}</div>
        </div>
      ),
    },
    { key: 'truckSpacesRequested', label: 'Spaces', sortable: true },
    {
      key: 'contractMonths',
      label: 'Duration',
      render: (v) => `${v} mo`,
    },
    {
      key: 'requestedStartDate',
      label: 'Requested Date',
      sortable: true,
      render: (v) => String(v).slice(0, 10),
    },
    {
      key: 'createdAt',
      label: 'Submitted',
      sortable: true,
      render: (v) => new Date(v as string).toLocaleDateString(),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_v, row) => <StatusBadge status={row.status} label={PARKING_STATUS_LABELS[row.status]} />,
    },
    {
      key: 'assignedToName',
      label: 'Assigned To',
      render: (v) => (v as string) || '—',
    },
  ], []);

  const rowActions: TableAction<ParkingReservation>[] = [
    { label: 'View Details', onClick: (row) => navigate(`${basePath}/${row.id}`) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="ui-page-title"><TranslatedText text="Parking Reservations" /></h1>
        <p className="ui-body-small mt-1">
          <TranslatedText text="Review, assign, and process Nova Parking 365 reservation requests." />
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        <StatCard title="Pending Review" value={stats?.pendingReview ?? 0} color="warning" variant="modern" icon={<Clock className="w-5 h-5" />} loading={statsQuery.isLoading} onClick={() => { setStatus('PENDING_REVIEW'); setPage(1); }} />
        <StatCard title="Under Review" value={stats?.underReview ?? 0} color="info" variant="modern" icon={<ClipboardList className="w-5 h-5" />} loading={statsQuery.isLoading} onClick={() => { setStatus('UNDER_REVIEW'); setPage(1); }} />
        <StatCard title="Approved" value={stats?.approved ?? 0} color="success" variant="modern" icon={<CheckCircle2 className="w-5 h-5" />} loading={statsQuery.isLoading} onClick={() => { setStatus('APPROVED'); setPage(1); }} />
        <StatCard title="Information Required" value={stats?.additionalInformationRequired ?? 0} color="orange" variant="modern" icon={<AlertTriangle className="w-5 h-5" />} loading={statsQuery.isLoading} onClick={() => { setStatus('ADDITIONAL_INFORMATION_REQUIRED'); setPage(1); }} />
        <StatCard title="Rejected" value={stats?.rejected ?? 0} color="error" variant="modern" icon={<XCircle className="w-5 h-5" />} loading={statsQuery.isLoading} onClick={() => { setStatus('REJECTED'); setPage(1); }} />
        <StatCard title="Today's Requests" value={stats?.todaysRequests ?? 0} color="primary" variant="modern" icon={<CalendarDays className="w-5 h-5" />} loading={statsQuery.isLoading} />
      </div>

      {!can('parking:view') && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-semibold">
          You don't have permission to perform this action.
        </div>
      )}

      <StandardDataTable
        title="Reservation queue"
        columns={columns}
        data={rows}
        loading={listQuery.isLoading}
        error={listQuery.isError ? getApiErrorMessage(listQuery.error) : null}
        onRetry={() => listQuery.refetch()}
        searchable
        searchValue={search}
        onSearchChange={(value) => { setSearch(value); setPage(1); }}
        searchPlaceholder="Search reference, company, MC, USDOT, driver, email"
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'PENDING_REVIEW', label: 'Pending Review' },
              { value: 'UNDER_REVIEW', label: 'Under Review' },
              { value: 'ADDITIONAL_INFORMATION_REQUIRED', label: 'Information Required' },
              { value: 'APPROVED', label: 'Approved' },
              { value: 'REJECTED', label: 'Rejected' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ],
          },
        ]}
        filterValues={{ status }}
        onFilterChange={(_key, value) => { setStatus(value); setPage(1); }}
        pagination
        totalItems={listQuery.data?.total}
        page={page}
        onPageChange={setPage}
        rowActions={rowActions}
        emptyMessage="No parking reservations found"
        ariaLabel="Parking reservations"
      />
    </div>
  );
};

export default ParkingReservationsDashboard;
