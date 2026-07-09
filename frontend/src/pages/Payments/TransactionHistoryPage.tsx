import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { pendingPaymentsApi } from '../../services/pendingPaymentsApi';
import CompletedTransactionsSection from './components/CompletedTransactionsSection';
import type { CompletedTransaction } from './types';
import { PaymentType } from './types';

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
                  origin: p.trip.load.origin,
                  destination: p.trip.load.destination,
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
        <p className="text-red-600 font-semibold">Failed to load transaction history.</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary strip */}
      {apiData?.summary && !isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
              Total Paid
            </p>
            <p className="text-xl font-black text-slate-900 mt-1">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: apiData.summary.currency || 'RWF',
                minimumFractionDigits: 0,
              }).format(apiData.summary.totalAmount)}
            </p>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
            <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">
              Transactions
            </p>
            <p className="text-xl font-black text-emerald-800 mt-1">
              {apiData.summary.totalPayments}
            </p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
              Trip Payments
            </p>
            <p className="text-xl font-black text-blue-800 mt-1">
              {apiData.summary.tripPaymentsCount}
            </p>
          </div>
          <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
            <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide">
              Advances
            </p>
            <p className="text-xl font-black text-orange-800 mt-1">
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
