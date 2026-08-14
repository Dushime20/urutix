import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../../components/EnliteUI/Tables';
import { parkingApi } from '../../services/parkingApi';
import { PARKING_STATUS_LABELS, type ParkingReservation } from '../../types/parking';
import { TranslatedText } from '../../components/translated-text';
import { getApiErrorMessage } from '../../config/errorMessages';

const MyParkingReservations = ({ basePath = '/dashboard/parking-reservations' }: { basePath?: string }) => {
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ['my-parking-reservations'],
    queryFn: () => parkingApi.list({ page: 1, limit: 50, sortBy: 'createdAt', sortDir: 'DESC' }),
  });

  const columns: Column<ParkingReservation>[] = useMemo(() => [
    { key: 'reservationReference', label: 'Reservation Reference', render: (_v, row) => <span className="font-bold">{row.reservationReference}</span> },
    { key: 'requestedStartDate', label: 'Requested Date', render: (v) => String(v).slice(0, 10) },
    { key: 'truckSpacesRequested', label: 'Spaces' },
    { key: 'contractMonths', label: 'Contract Duration', render: (v) => `${v} month(s)` },
    { key: 'status', label: 'Status', render: (_v, row) => <StatusBadge status={row.status} label={PARKING_STATUS_LABELS[row.status]} /> },
    { key: 'createdAt', label: 'Submitted Date', render: (v) => new Date(v as string).toLocaleDateString() },
    { key: 'updatedAt', label: 'Last Updated', render: (v) => new Date(v as string).toLocaleDateString() },
  ], []);

  const rowActions: TableAction<ParkingReservation>[] = [
    { label: 'View Details', onClick: (row) => navigate(`${basePath}/${row.id}`) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="ui-page-title"><TranslatedText text="My Parking Reservations" /></h1>
        <p className="ui-body-small mt-1"><TranslatedText text="Track the status of your truck parking reservation requests." /></p>
      </div>
      <StandardDataTable
        columns={columns}
        data={query.data?.items || []}
        loading={query.isLoading}
        error={query.isError ? getApiErrorMessage(query.error) : null}
        onRetry={() => query.refetch()}
        searchable
        searchPlaceholder="Search reservations"
        rowActions={rowActions}
        emptyMessage="You have not submitted any parking reservations yet"
        ariaLabel="My parking reservations"
      />
    </div>
  );
};

export default MyParkingReservations;
