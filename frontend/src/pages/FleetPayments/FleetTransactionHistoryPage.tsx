import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentsAPI } from '../../services/api';
import { Building, User } from 'lucide-react';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { StandardDataTable, type Column } from '../../components/EnliteUI/Tables';

const methodLabel: Record<string, string> = {
  credit_card: 'Card',
  digital_wallet: 'Mobile Money',
  bank_transfer: 'Bank Transfer',
  wallet: 'Wallet',
  wire_transfer: 'Wire',
};

const FleetTransactionHistoryPage = () => {
  const { compactIn: fmt } = useCurrencyFormat();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['fleet-completed-transactions'],
    queryFn: () => paymentsAPI.getTruckOwnerCompletedPayments(),
    refetchInterval: 60000,
  });

  const transactions: any[] = data?.data?.data?.payments || [];

  const tableData = useMemo(() =>
    transactions.map((t: any) => ({
      ...t,
      sourceKey: t.isLenderPayment ? 'lender' : 'cargo_owner',
      tripNumber: t.trip?.tripNumber || '',
    })),
  [transactions]);

  const types = useMemo(() =>
    [...new Set(transactions.map((t: any) => t.paymentType).filter(Boolean))],
    [transactions]
  );

  const columns: Column<any>[] = useMemo(() => [
    {
      key: 'processedAt',
      label: 'Date',
      sortable: true,
      render: (_v, row) => (
        <span className="text-sm text-slate-700 whitespace-nowrap">
          {new Date(row.processedAt || row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'referenceNumber',
      label: 'Reference',
      render: (_v, row) => (
        <span className="text-xs font-mono text-slate-400">
          {row.referenceNumber || `PAY-${row.id.slice(0, 8)}`}
        </span>
      ),
    },
    {
      key: 'tripNumber',
      label: 'Trip / Load',
      render: (_v, row) =>
        row.trip ? (
          <div>
            <p className="text-sm font-bold text-slate-800">{row.trip.tripNumber}</p>
            {row.trip.load && (
              <p className="text-xs text-slate-400 truncate max-w-[160px]">
                {row.trip.load.origin?.city && row.trip.load.destination?.city
                  ? `${row.trip.load.origin.city} → ${row.trip.load.destination.city}`
                  : row.trip.load.title}
              </p>
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
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary-50 text-primary-700 border border-primary-100">
              <Building className="w-2.5 h-2.5" /> Lender
            </span>
            {row.lenderName && (
              <span className="text-xs text-slate-500 truncate max-w-[80px]">{row.lenderName}</span>
            )}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
            <User className="w-2.5 h-2.5" /> Direct
          </span>
        ),
    },
    {
      key: 'paymentMethod',
      label: 'Method',
      render: (_v, row) => (
        <span className="text-xs font-medium text-slate-500">
          {methodLabel[row.paymentMethod] || row.paymentMethod || '—'}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (_v, row) => (
        <span className="text-base font-bold text-slate-900 whitespace-nowrap">
          {fmt(row.amount, row.currency)}{' '}
          <span className="text-xs font-bold text-slate-400">{row.currency}</span>
        </span>
      ),
    },
  ], [fmt]);

  return (
    <StandardDataTable
      columns={columns}
      data={tableData}
      loading={isLoading}
      error={isError ? 'Failed to load transaction history' : null}
      onRetry={() => refetch()}
      getRowId={(row) => row.id}
      searchPlaceholder="Search by reference, trip, lender, amount..."
      searchKeys={['referenceNumber', 'description', 'tripNumber', 'lenderName', 'amount']}
      filters={[
        {
          key: 'paymentType',
          label: 'Type',
          options: types.map((t: string) => ({
            value: t,
            label: t.replace(/_/g, ' '),
          })),
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
      emptyMessage="No transactions found"
      ariaLabel="Fleet transaction history"
      embedded
    />
  );
};

export default FleetTransactionHistoryPage;
