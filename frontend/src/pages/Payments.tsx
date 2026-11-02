import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { paymentsAPI } from '../services/api';
import FinancialOverview from './Payments/components/FinancialOverview';
import PendingPaymentsSection from './Payments/components/PendingPaymentsSection';
import CompletedTransactionsSection from './Payments/components/CompletedTransactionsSection';
import type { 
  PendingPayment, 
  CompletedTransaction, 
  FinancialSummary,
} from './Payments/types';
import {
  PaymentUrgency,
  PaymentType 
} from './Payments/types';
import { calculateUrgency } from './Payments/utils';

const Payments = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<PaymentType | undefined>();
  const itemsPerPage = 20;

  // Fetch all payments
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['payments', searchTerm],
    queryFn: () => paymentsAPI.getAll({ search: searchTerm }),
  });

  // Process payments data
  const processedData = useMemo(() => {
    if (!paymentsData?.data?.payments) {
      return {
        pending: { overdue: [], dueSoon: [], pending: [] },
        completed: [],
        summary: {
          overdue: { amount: 0, count: 0 },
          dueSoon: { amount: 0, count: 0 },
          completed: { amount: 0, count: 0 },
          total: { amount: 0, count: 0 },
        },
      };
    }

    const payments = paymentsData.data.payments;
    const now = new Date();

    // Separate pending and completed
    const pendingPayments: PendingPayment[] = [];
    const completedTransactions: CompletedTransaction[] = [];

    payments.forEach((payment: any) => {
      if (payment.status === 'COMPLETED') {
        completedTransactions.push({
          id: payment.id,
          type: payment.paymentType || PaymentType.LOAD_PAYMENT,
          amount: payment.amount,
          currency: payment.currency || 'USD',
          paidDate: payment.processedAt || payment.createdAt,
          paymentMethod: payment.paymentMethod || 'WALLET',
          referenceNumber: payment.referenceNumber || `PAY-${payment.id.slice(0, 8)}`,
          description: payment.description || `Payment for ${payment.trip?.tripNumber || 'service'}`,
          status: 'COMPLETED',
          trip: payment.trip,
        });
      } else if (payment.status === 'PENDING' || payment.status === 'PROCESSING') {
        // Only include if there's a due date
        if (payment.dueDate) {
          const urgency = calculateUrgency(new Date(payment.dueDate));
          pendingPayments.push({
            id: payment.id,
            type: payment.paymentType || PaymentType.LOAD_PAYMENT,
            amount: payment.amount,
            currency: payment.currency || 'USD',
            dueDate: new Date(payment.dueDate),
            urgency,
            description: payment.description || `Payment for ${payment.trip?.tripNumber || 'service'}`,
            referenceNumber: payment.referenceNumber || `PAY-${payment.id.slice(0, 8)}`,
            relatedEntity: {
              type: payment.trip ? 'TRIP' : 'LOAD',
              id: payment.tripId || payment.id,
              number: payment.trip?.tripNumber || 'N/A',
            },
            createdAt: new Date(payment.createdAt),
          });
        }
      }
    });

    // Group pending by urgency
    const overdue = pendingPayments.filter(p => p.urgency === PaymentUrgency.OVERDUE);
    const dueSoon = pendingPayments.filter(p => p.urgency === PaymentUrgency.DUE_SOON);
    const pending = pendingPayments.filter(p => p.urgency === PaymentUrgency.PENDING);

    // Calculate summary
    const summary: FinancialSummary = {
      overdue: {
        amount: overdue.reduce((sum, p) => sum + p.amount, 0),
        count: overdue.length,
      },
      dueSoon: {
        amount: dueSoon.reduce((sum, p) => sum + p.amount, 0),
        count: dueSoon.length,
      },
      completed: {
        amount: completedTransactions.reduce((sum, t) => sum + t.amount, 0),
        count: completedTransactions.length,
      },
      total: {
        amount: payments.reduce((sum: number, p: any) => sum + p.amount, 0),
        count: payments.length,
      },
    };

    return {
      pending: { overdue, dueSoon, pending },
      completed: completedTransactions,
      summary,
    };
  }, [paymentsData]);

  // Apply filters and pagination to completed transactions
  const filteredCompleted = useMemo(() => {
    let filtered = processedData.completed;

    // Apply type filter
    if (filterType) {
      filtered = filtered.filter(t => t.type === filterType);
    }

    // Apply search
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.referenceNumber.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.amount.toString().includes(query)
      );
    }

    return filtered;
  }, [processedData.completed, filterType, searchTerm]);

  // Paginate completed transactions
  const paginatedCompleted = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCompleted.slice(startIndex, endIndex);
  }, [filteredCompleted, currentPage, itemsPerPage]);

  const pagination = {
    page: currentPage,
    limit: itemsPerPage,
    total: filteredCompleted.length,
    totalPages: Math.ceil(filteredCompleted.length / itemsPerPage),
  };

  // Handlers
  const handlePayNow = (paymentId: string) => {
    // Navigate to payment processing or open payment modal
    toast.success('Opening payment modal...');
    // TODO: Implement payment modal
  };

  const handleViewDetails = (id: string) => {
    toast.success('Opening payment details...');
    // TODO: Implement details modal
  };

  const handleDownloadReceipt = (transactionId: string) => {
    toast.success('Downloading receipt...');
    // TODO: Implement receipt download
  };

  const handleRequestExtension = (paymentId: string) => {
    toast.success('Opening extension request...');
    // TODO: Implement extension request
  };

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleFilterChange = (filters: any) => {
    setFilterType(filters.type);
    setCurrentPage(1); // Reset to first page on filter
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-8">
      {/* Financial Overview Cards */}
      <FinancialOverview 
        summary={processedData.summary} 
        isLoading={isLoading} 
      />

      {/* Pending Payments Section */}
      <PendingPaymentsSection
        overdue={processedData.pending.overdue}
        dueSoon={processedData.pending.dueSoon}
        pending={processedData.pending.pending}
        isLoading={isLoading}
        onPayNow={handlePayNow}
        onViewDetails={handleViewDetails}
        onRequestExtension={handleRequestExtension}
      />

      {/* Completed Transactions Section */}
      <CompletedTransactionsSection
        transactions={paginatedCompleted}
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

export default Payments;