import React, { useState } from 'react';
import { Filter, AlertCircle } from 'lucide-react';
import type { PendingPayment } from '../types';
import { PaymentType, PaymentUrgency } from '../types';
import PendingPaymentCard from './PendingPaymentCard';
import { cn } from '@/utils/cn';

interface PendingPaymentsSectionProps {
  overdue: PendingPayment[];
  dueSoon: PendingPayment[];
  pending: PendingPayment[];
  isLoading?: boolean;
  onPayNow: (paymentId: string) => void;
  onViewDetails: (paymentId: string) => void;
  onRequestExtension?: (paymentId: string) => void;
}

const PendingPaymentsSection: React.FC<PendingPaymentsSectionProps> = ({
  overdue,
  dueSoon,
  pending,
  isLoading,
  onPayNow,
  onViewDetails,
  onRequestExtension,
}) => {
  const [filterType, setFilterType] = useState<PaymentType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Combine all payments
  const allPayments = [...overdue, ...dueSoon, ...pending];

  // Apply filters
  const filteredPayments = filterType === 'all' 
    ? allPayments 
    : allPayments.filter(p => p.type === filterType);

  // Group by urgency
  const filteredOverdue = filteredPayments.filter(p => p.urgency === PaymentUrgency.OVERDUE);
  const filteredDueSoon = filteredPayments.filter(p => p.urgency === PaymentUrgency.DUE_SOON);
  const filteredPending = filteredPayments.filter(p => p.urgency === PaymentUrgency.PENDING);

  if (isLoading) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-slate-200 rounded-2xl animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-50 rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (allPayments.length === 0) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-12 mb-8 text-center">
        <div className="flex flex-col items-center gap-4 opacity-40">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
            <AlertCircle size={32} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-lg font-black text-slate-900 mb-1">All Caught Up!</p>
            <p className="text-sm text-slate-600">You have no pending payments at this time.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              Pending Payments
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Action Required • {filteredPayments.length} Payment{filteredPayments.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Filter Button */}
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

      {/* Filters */}
      {showFilters && (
        <div className="bg-slate-50 rounded-2xl p-6 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
            Filter by Payment Type
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All Types' },
              { value: PaymentType.LOAN_REPAYMENT, label: 'Loan Repayments' },
              { value: PaymentType.LOAD_PAYMENT, label: 'Load Payments' },
              { value: PaymentType.ADVANCE_PAYMENT, label: 'Advance Payments' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setFilterType(filter.value as PaymentType | 'all')}
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

      {/* Payments List */}
      <div className="space-y-6">
        {/* Overdue Payments */}
        {filteredOverdue.length > 0 && (
          <div>
            <h3 className="text-sm font-black text-rose-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              Overdue ({filteredOverdue.length})
            </h3>
            <div className="space-y-4">
              {filteredOverdue.map((payment) => (
                <PendingPaymentCard
                  key={payment.id}
                  payment={payment}
                  onPayNow={onPayNow}
                  onViewDetails={onViewDetails}
                  onRequestExtension={onRequestExtension}
                />
              ))}
            </div>
          </div>
        )}

        {/* Due Soon Payments */}
        {filteredDueSoon.length > 0 && (
          <div>
            <h3 className="text-sm font-black text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Due Soon ({filteredDueSoon.length})
            </h3>
            <div className="space-y-4">
              {filteredDueSoon.map((payment) => (
                <PendingPaymentCard
                  key={payment.id}
                  payment={payment}
                  onPayNow={onPayNow}
                  onViewDetails={onViewDetails}
                />
              ))}
            </div>
          </div>
        )}

        {/* Pending Payments */}
        {filteredPending.length > 0 && (
          <div>
            <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              Pending ({filteredPending.length})
            </h3>
            <div className="space-y-4">
              {filteredPending.map((payment) => (
                <PendingPaymentCard
                  key={payment.id}
                  payment={payment}
                  onPayNow={onPayNow}
                  onViewDetails={onViewDetails}
                />
              ))}
            </div>
          </div>
        )}

        {/* No results after filtering */}
        {filteredPayments.length === 0 && allPayments.length > 0 && (
          <div className="text-center py-12">
            <p className="text-sm font-bold text-slate-400">
              No payments match the selected filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingPaymentsSection;
