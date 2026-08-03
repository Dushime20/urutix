import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentsAPI } from '../../services/api';
import { Building, User } from 'lucide-react';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { StandardDataTable, StatusBadge, type Column } from '../../components/EnliteUI/Tables';

const ReceivedPaymentsPage = () => {
  const { compactIn } = useCurrencyFormat();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['truck-owner-received-payments'],
    queryFn: () => paymentsAPI.getAllReceivedPayments({}),
    refetchInterval: 30000,
  });

  const payments: any[] = data?.data?.data?.payments || [];
  const payCurrency: string = data?.data?.data?.summary?.currency || payments[0]?.currency || 'RWF';

  const tableData = useMemo(() =>
    payments.map((p: any) => ({
      ...p,
      sourceKey: p.isLenderPayment ? 'lender' : 'cargo_owner',
      tripNumber: p.trip?.tripNumber || '',
      statusKey: (p.status || '').toLowerCase(),
    })),
  [payments]);

  const columns: Column<any>[] = useMemo(() => [
    {
      key: 'processedAt',
      label: 'Date',
      sortable: true,
      render: (_v, row) => (
        <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
          {new Date(row.processedAt || row.dueDate || row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'referenceNumber',
      label: 'Reference',
      render: (_v, row) => (
        <span className="text-xs font-mono text-slate-500">
          {row.referenceNumber || `PAY-${row.id.slice(0, 8)}`}
        </span>
      ),
    },
    {
      key: 'tripNumber',
      label: 'Trip',
      render: (_v, row) =>
        row.trip ? (
          <div>
            <p className="text-sm font-bold text-slate-800">{row.trip.tripNumber}</p>
            {row.trip.load && (
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[160px]">{row.trip.load.title}</p>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    {
      key: 'sourceKey',
      label: 'Source',
      render: (_v, row) =>
        row.isLenderPayment ? (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-violet-100 text-violet-700">
              <Building className="w-2.5 h-2.5" /> Lender
            </span>
            {row.lenderName && <span className="text-xs text-slate-500 truncate max-w-[80px]">{row.lenderName}</span>}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-700">
            <User className="w-2.5 h-2.5" /> Direct
          </span>
        ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (_v, row) => {
        const rowCurrency: string = row.currency || payCurrency;
        return (
          <span className="text-base font-black text-emerald-600 whitespace-nowrap">
            {compactIn(row.amount, rowCurrency, rowCurrency)}{' '}
            <span className="text-xs font-bold text-slate-400">{rowCurrency}</span>
          </span>
        );
      },
    },
    {
      key: 'statusKey',
      label: 'Status',
      sortable: true,
      render: (_v, row) => (
        <StatusBadge status={row.status} label={row.status} />
      ),
    },
  ], [compactIn, payCurrency]);

  return (
    <StandardDataTable
      columns={columns}
      data={tableData}
      loading={isLoading}
      error={isError ? 'Failed to load payments' : null}
      onRetry={() => refetch()}
      getRowId={(row) => row.id}
      searchPlaceholder="Search by reference, trip, lender, description..."
      searchKeys={['referenceNumber', 'description', 'amount', 'tripNumber', 'lenderName']}
      filters={[
        {
          key: 'statusKey',
          label: 'Status',
          options: [
            { value: 'pending', label: 'Pending' },
            { value: 'processing', label: 'Processing' },
            { value: 'completed', label: 'Completed' },
          ],
        },
        {
          key: 'sourceKey',
          label: 'Source',
          options: [
            { value: 'cargo_owner', label: 'Direct (Cargo Owner)' },
            { value: 'lender', label: 'Via Lender' },
          ],
        },
      ]}
      defaultSortKey="processedAt"
      defaultSortDirection="desc"
      onRefresh={() => refetch()}
      emptyMessage="No payments found"
      ariaLabel="Received payments"
      embedded
    />
  );
};

export default ReceivedPaymentsPage;
