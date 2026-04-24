import React, { useState } from 'react';
import { Search, Filter, Download, CheckCircle } from 'lucide-react';
import type { CompletedTransaction } from '../types';
import { PaymentType } from '../types';
import TransactionRow from './TransactionRow';
import Pagination from './Pagination';
import { cn } from '@/utils/cn';

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
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<PaymentType | 'all'>('all');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  const handleFilterChange = (type: PaymentType | 'all') => {
    setFilterType(type);
    onFilterChange({ type: type === 'all' ? undefined : type });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden">
        <div className="p-8">
          <div className="h-8 w-64 bg-slate-200 rounded animate-pulse mb-6" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-slate-50 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="p-8 border-b border-slate-100">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                Completed Transactions
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Transaction History • {pagination.total} Total
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm uppercase tracking-wide transition-all border-2",
                showFilters 
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
              )}
            >
              <Filter size={16} className={showFilters ? "rotate-180 transition-transform" : "transition-transform"} />
              Filters
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
          <input
            type="text"
            placeholder="SEARCH BY REFERENCE, AMOUNT, OR DESCRIPTION..."
            className="w-full h-14 pl-14 pr-6 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all placeholder:text-slate-300"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-6 bg-slate-50 rounded-2xl p-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
              Filter by Payment Type
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'All Types' },
                { value: PaymentType.LOAN_REPAYMENT, label: 'Loan Repayments' },
                { value: PaymentType.LOAD_PAYMENT, label: 'Load Payments' },
                { value: PaymentType.ADVANCE_PAYMENT, label: 'Advance Payments' },
                { value: PaymentType.REFUND, label: 'Refunds' },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => handleFilterChange(filter.value as PaymentType | 'all')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all",
                    filterType === filter.value
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-50">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Date
              </th>
              <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Type
              </th>
              <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Description
              </th>
              <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Amount
              </th>
              <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Method
              </th>
              <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Status
              </th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-50">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-8 py-24 text-center">
                  <div className="flex flex-col items-center gap-4 opacity-40">
                    <CheckCircle size={48} className="text-slate-200" />
                    <div>
                      <p className="text-sm font-black text-slate-900 mb-1">No Transactions Found</p>
                      <p className="text-xs text-slate-600">
                        {searchQuery || filterType !== 'all' 
                          ? 'Try adjusting your search or filters'
                          : 'Completed transactions will appear here'}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  onViewDetails={onViewDetails}
                  onDownloadReceipt={onDownloadReceipt}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {transactions.length > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

export default CompletedTransactionsSection;
