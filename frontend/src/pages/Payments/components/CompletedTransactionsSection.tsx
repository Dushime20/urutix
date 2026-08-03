import React, { useMemo, useState } from 'react';
import { Eye, Download, CheckCircle } from 'lucide-react';
import type { CompletedTransaction } from '../types';
import { PaymentType } from '../types';
import { formatCurrency, formatDate, getPaymentTypeIcon, getPaymentTypeLabel } from '../utils';
import { formatLocation } from '@/utils/formatLocation';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../../../components/EnliteUI/Tables';

interface CompletedTransactionsSectionProps {
  transactions: CompletedTransaction[];
  isLoading?: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onViewDetails: (transactionId: string) => void;
  onDownloadReceipt: (transactionId: string) => void;
  onSearch: (query: string) => void;
  onFilterChange: (filters: any) => void;
}

const CompletedTransactionsSection: React.FC<CompletedTransactionsSectionProps> = ({
  transactions,
  isLoading,
  pagination,
  onPageChange,
  onViewDetails,
  onDownloadReceipt,
  onSearch,
  onFilterChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<PaymentType | 'all'>('all');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  const handleFilterChange = (type: string) => {
    const next = type === 'all' ? 'all' : (type as PaymentType);
    setFilterType(next);
    onFilterChange({ type: next === 'all' ? undefined : next });
  };

  const columns: Column<CompletedTransaction>[] = useMemo(() => [
    {
      key: 'paidDate',
      label: 'Date',
      alwaysVisible: true,
      render: (_v, transaction) => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-900">
            {formatDate(transaction.paidDate)}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            {new Date(transaction.paidDate).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (_v, transaction) => (
        <div className="flex items-center gap-2">
          <span className="text-xl">{getPaymentTypeIcon(transaction.type)}</span>
          <div>
            <div className="text-xs font-bold text-slate-900">
              {getPaymentTypeLabel(transaction.type)}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {transaction.referenceNumber}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (_v, transaction) => (
        <div className="max-w-xs">
          <p className="text-xs font-medium text-slate-700 truncate">
            {transaction.description}
          </p>
          {transaction.trip && (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Trip #{transaction.trip.tripNumber}
              {transaction.trip.load?.title ? ` · ${transaction.trip.load.title}` : ''}
            </p>
          )}
          {(transaction.trip?.load?.origin || transaction.trip?.load?.destination) && (
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">
              {formatLocation(transaction.trip.load?.origin, '—')} → {formatLocation(transaction.trip.load?.destination, '—')}
            </p>
          )}
          {transaction.isLenderPayment && transaction.lenderName && (
            <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-primary-50 text-primary-700 border border-primary-100 uppercase tracking-wide">
              Via {transaction.lenderName}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (_v, transaction) => (
        <div className="space-y-1">
          <div className="text-sm font-black text-slate-900">
            {formatCurrency(transaction.amount, transaction.currency)}
          </div>
          <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">
            {transaction.currency}
          </div>
        </div>
      ),
    },
    {
      key: 'paymentMethod',
      label: 'Method',
      render: (v) => (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-700">
          {v}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: () => (
        <StatusBadge variant="neutral" label="COMPLETED" />
      ),
    },
  ], []);

  const rowActions: TableAction<CompletedTransaction>[] = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: <Eye size={14} />,
      onClick: (t) => onViewDetails(t.id),
    },
    {
      key: 'download',
      label: 'Download Receipt',
      icon: <Download size={14} />,
      onClick: (t) => onDownloadReceipt(t.id),
    },
  ], [onViewDetails, onDownloadReceipt]);

  return (
    <StandardDataTable
      title="Completed Transactions"
      subtitle={`Transaction History • ${pagination.total} Total`}
      icon={<CheckCircle className="w-5 h-5 text-primary-600" />}
      headerColor="primary"
      columns={columns}
      data={transactions}
      loading={isLoading}
      getRowId={(row) => row.id}
      searchPlaceholder="Search by reference, amount, or description..."
      searchValue={searchQuery}
      onSearchChange={handleSearch}
      searchable
      filters={[
        {
          key: 'type',
          label: 'Payment Type',
          options: [
            { value: PaymentType.LOAN_REPAYMENT, label: 'Loan Repayments' },
            { value: PaymentType.LOAD_PAYMENT, label: 'Load Payments' },
            { value: PaymentType.ADVANCE_PAYMENT, label: 'Advance Payments' },
            { value: PaymentType.REFUND, label: 'Refunds' },
          ],
        },
      ]}
      filterValues={{ type: filterType === 'all' ? 'all' : filterType }}
      onFilterChange={(_key, value) => handleFilterChange(value)}
      pagination
      pageSize={pagination.limit}
      totalItems={pagination.total}
      page={pagination.page}
      onPageChange={onPageChange}
      rowActions={rowActions}
      stickyHeader
      columnVisibility
      emptyMessage="No Transactions Found"
      ariaLabel="Completed transactions"
    />
  );
};

export default CompletedTransactionsSection;
