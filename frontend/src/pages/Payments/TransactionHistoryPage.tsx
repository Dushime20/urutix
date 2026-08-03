import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { pendingPaymentsApi } from '../../services/pendingPaymentsApi';
import CompletedTransactionsSection from './components/CompletedTransactionsSection';
import type { CompletedTransaction } from './types';
import { PaymentType } from './types';
import { formatLocation } from '../../utils/formatLocation';

const ITEMS_PER_PAGE = 20;

// Map backend paymentType strings to frontend PaymentType enum
const mapPaymentType = (raw: string): PaymentType => {
  switch (raw?.toUpperCase()) {
    case 'TRIP_PAYMENT':
    case 'LOAD_PAYMENT':
    case 'FINAL':
      return PaymentType.LOAD_PAYMENT;
    case 'ADVANCE':
      return PaymentType.ADVANCE_PAYMENT;
    case 'REFUND':
      return PaymentType.REFUND;
    case 'LOAN_REPAYMENT':
      return PaymentType.LOAN_REPAYMENT;
    default:
      return PaymentType.LOAD_PAYMENT;
  }
};

const TransactionHistoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<PaymentType | undefined>();

  // Dedicated cargo owner completed-payments endpoint
  // Fetch a generous window and paginate client-side so search/filter work instantly
  const { data: apiData, isLoading, isError, refetch } = useQuery({
    queryKey: ['cargoOwnerCompletedPayments'],
    queryFn: () =>
      pendingPaymentsApi.getCompletedPaymentsForCargoOwner({ limit: 500 }),
    staleTime: 60_000,
  });

  // Map API response to CompletedTransaction shape
  const allTransactions = useMemo((): CompletedTransaction[] => {
    if (!apiData?.payments) return [];

    return apiData.payments.map((p) => ({
      id: p.id,
      type: mapPaymentType(p.paymentType),
      amount: p.amount,
      currency: p.currency || 'RWF',
      paidDate: new Date(p.processedAt || p.createdAt),
      paymentMethod: p.paymentMethod || 'BANK_TRANSFER',
      referenceNumber: p.referenceNumber || `PAY-${p.id.slice(0, 8).toUpperCase()}`,
      description:
        p.description ||
        `Payment for Trip #${p.trip?.tripNumber ?? p.tripId?.slice(-8) ?? '—'}`,
      status: 'COMPLETED' as const,
      isLenderPayment: p.isLenderPayment,
      lenderName: p.lenderName,
      trip: p.trip
        ? {
            id: p.trip.id,
            tripNumber: p.trip.tripNumber,
            load: p.trip.load
              ? {
                  title: p.trip.load.title,
                  cargoType: p.trip.load.cargoType,
                  origin: formatLocation(p.trip.load.origin) || null,
                  destination: formatLocation(p.trip.load.destination) || null,
                }
              : null,
          }
        : undefined,
    }));
  }, [apiData]);

  // Apply type filter + search (client-side for snappy UX)
  const filteredTransactions = useMemo(() => {
    let list = allTransactions;

    if (filterType) {
      list = list.filter((t) => t.type === filterType);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (t) =>
          t.referenceNumber.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.amount.toString().includes(q) ||
          t.trip?.tripNumber?.toLowerCase().includes(q) ||
          t.trip?.load?.title?.toLowerCase().includes(q) ||
          t.trip?.load?.origin?.toLowerCase().includes(q) ||
          t.trip?.load?.destination?.toLowerCase().includes(q),
      );
    }

    return list;
  }, [allTransactions, filterType, searchTerm]);

  // Client-side pagination
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const pagination = {
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    total: filteredTransactions.length,
    totalPages: Math.max(1, Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE)),
  };

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    setCurrentPage(1);
  };

  const handleFilterChange = (filters: any) => {
    setFilterType(filters.type);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewDetails = (_id: string) => {
    toast.success('Opening payment details…');
    // TODO: open detail modal
  };

  const handleDownloadReceipt = (_id: string) => {
    toast.success('Preparing receipt download…');
    // TODO: wire up InvoiceReceiptService endpoint
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <p className="text-slate-700 font-semibold">Failed to load transaction history.</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 text-sm font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary strip — slate + primary only, matches pending payments */}
      {apiData?.summary && !isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Total Paid
            </p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: apiData.summary.currency || 'RWF',
                minimumFractionDigits: 0,
              }).format(apiData.summary.totalAmount)}
            </p>
          </div>
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800/50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary-600/70 dark:text-primary-400/70 mb-1">
              Transactions
            </p>
            <p className="text-lg font-bold text-primary-700 dark:text-primary-300">
              {apiData.summary.totalPayments}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Trip Payments
            </p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {apiData.summary.tripPaymentsCount}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Advances
            </p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {apiData.summary.advancePaymentsCount}
            </p>
          </div>
        </div>
      )}

      {/* Transactions table */}
      <CompletedTransactionsSection
        transactions={paginatedTransactions}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onViewDetails={handleViewDetails}
        onDownloadReceipt={handleDownloadReceipt}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
      />
    </div>
  );
};

export default TransactionHistoryPage;
