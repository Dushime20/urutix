import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { paymentsAPI } from '../../services/api';
import CompletedTransactionsSection from '../Payments/components/CompletedTransactionsSection';
import type { CompletedTransaction } from '../Payments/types';
import { PaymentType } from '../Payments/types';

const FleetTransactionHistoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<PaymentType | undefined>();
  const itemsPerPage = 20;

  // Fetch completed transactions made by truck owner
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['fleet-transactions', searchTerm],
    queryFn: () => paymentsAPI.getAll({ search: searchTerm, direction: 'OUTGOING' }),
  });

  // Process completed transactions
  const completedTransactions = useMemo(() => {
    if (!paymentsData?.data?.payments) return [];

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
          description: payment.description || `Payment for ${payment.category || 'expense'}`,
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

    if (filterType) {
      filtered = filtered.filter(t => t.type === filterType);
    }

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

  const handleViewDetails = (id: string) => {
    toast.success('Opening payment details...');
  };

  const handleDownloadReceipt = (transactionId: string) => {
    toast.success('Downloading receipt...');
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

  return (
    <div className="space-y-8">
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

export default FleetTransactionHistoryPage;
