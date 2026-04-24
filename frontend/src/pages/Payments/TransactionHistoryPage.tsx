import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { paymentsAPI } from '../../services/api';
import CompletedTransactionsSection from './components/CompletedTransactionsSection';
import type { CompletedTransaction } from './types';
import { PaymentType } from './types';

const TransactionHistoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<PaymentType | undefined>();
  const itemsPerPage = 20;

  // Fetch all payments
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['payments', searchTerm],
    queryFn: () => paymentsAPI.getAll({ search: searchTerm }),
  });

  // Process payments data - only completed
  const completedTransactions = useMemo(() => {
    if (!paymentsData?.data?.payments) {
      return [];
    }

    const payments = paymentsData.data.payments;
    const completed: CompletedTransaction[] = [];

    payments.forEach((payment: any) => {
      if (payment.status === 'COMPLETED') {
        completed.push({
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
      }
    });

    return completed;
  }, [paymentsData]);

  // Apply filters and pagination
  const filteredCompleted = useMemo(() => {
    let filtered = completedTransactions;

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
  }, [completedTransactions, filterType, searchTerm]);

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
  const handleViewDetails = (id: string) => {
    toast.success('Opening payment details...');
    // TODO: Implement details modal
  };

  const handleDownloadReceipt = (transactionId: string) => {
    toast.success('Downloading receipt...');
    // TODO: Implement receipt download
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

export default TransactionHistoryPage;
