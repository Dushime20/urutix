import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  AlertCircle, 
  Clock, 
  DollarSign, 
  Package,
  CreditCard,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  Eye,
} from 'lucide-react';
import { pendingPaymentsApi, type PendingPayment, type PaymentSummary } from '@/services/pendingPaymentsApi';
import type { PendingPayment as UIPendingPayment } from '../types';
import { PaymentType, PaymentUrgency } from '../types';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import PaymentModal from './PaymentModal';
import PaymentDetailModal from './PaymentDetailModal';

interface EnhancedPendingPaymentsSectionProps {
  onPayNow?: (paymentId: string) => void;
  onViewDetails?: (paymentId: string) => void;
  className?: string;
}

const EnhancedPendingPaymentsSection: React.FC<EnhancedPendingPaymentsSectionProps> = ({
  onPayNow,
  onViewDetails,
  className,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'amount' | 'created'>('dueDate');
  
  // Modal states
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Determine if user is cargo owner or truck owner
  const isCargoOwner = user?.role === 'CARGO_OWNER';
  const isTruckOwner = user?.role === 'TRUCK_OWNER' || user?.role === 'FLEET_MANAGER';

  // Fetch pending payments based on user role
  const { 
    data: paymentsData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['pendingPayments', user?.role, statusFilter],
    queryFn: async () => {
      if (isCargoOwner) {
        return await pendingPaymentsApi.getPendingPaymentsForCargoOwner({
          status: statusFilter === 'all' ? undefined : statusFilter,
          limit: 50,
        });
      } else if (isTruckOwner) {
        return await pendingPaymentsApi.getExpectedPaymentsForTruckOwner({
          status: statusFilter === 'all' ? undefined : statusFilter,
          limit: 50,
        });
      }
      return { payments: [], summary: {} as PaymentSummary, pagination: { total: 0, limit: 0, offset: 0, hasMore: false } };
    },
    enabled: !!(isCargoOwner || isTruckOwner),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: (paymentId: string) => pendingPaymentsApi.processPayment(paymentId),
    onSuccess: () => {
      toast.success('Payment processed successfully!');
      queryClient.invalidateQueries({ queryKey: ['pendingPayments'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to process payment');
    },
  });

  const mapToUIPendingPayment = (payment: PendingPayment): UIPendingPayment => {
    const now = new Date();
    const dueDate = payment.dueDate ? new Date(payment.dueDate) : now;
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const urgency: PaymentUrgency =
      daysUntilDue < 0
        ? PaymentUrgency.OVERDUE
        : daysUntilDue <= 7
        ? PaymentUrgency.DUE_SOON
        : PaymentUrgency.PENDING;

    const typeMap: Record<string, PaymentType> = {
      LOAN_REPAYMENT: PaymentType.LOAN_REPAYMENT,
      LOAD_PAYMENT: PaymentType.LOAD_PAYMENT,
      ADVANCE_PAYMENT: PaymentType.ADVANCE_PAYMENT,
      REFUND: PaymentType.REFUND,
    };

    return {
      id: payment.id,
      type: typeMap[payment.paymentType] ?? PaymentType.LOAD_PAYMENT,
      amount: payment.amount,
      currency: payment.currency,
      dueDate,
      urgency,
      description: payment.description,
      referenceNumber: payment.referenceNumber,
      createdAt: new Date(payment.createdAt),
      relatedEntity: {
        type: 'TRIP',
        id: payment.tripId,
        number: payment.trip?.tripNumber ?? payment.tripId.slice(-8),
        name: payment.trip?.load?.title ?? undefined,
      },
    };
  };

  // Find payment by ID helper
  const findPaymentById = (id: string): PendingPayment | null => {
    return sortedPayments.find(p => p.id === id) || null;
  };

  const handlePayNow = (paymentId: string) => {
    const payment = findPaymentById(paymentId);
    if (payment) {
      setSelectedPayment(payment);
      setShowPaymentModal(true);
    }
    onPayNow?.(paymentId);
  };

  const handleViewDetails = (paymentId: string) => {
    const payment = findPaymentById(paymentId);
    if (payment) {
      setSelectedPayment(payment);
      setShowDetailModal(true);
    }
    onViewDetails?.(paymentId);
  };

  const handlePaymentSuccess = () => {
    toast.success('Payment completed successfully!');
    setShowPaymentModal(false);
    setShowDetailModal(false);
    setSelectedPayment(null);
    // Refresh payments
    queryClient.invalidateQueries({ queryKey: ['pendingPayments'] });
  };

  // Sort payments
  const sortedPayments = paymentsData?.payments?.sort((a, b) => {
    switch (sortBy) {
      case 'dueDate':
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      case 'amount':
        return b.amount - a.amount;
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default:
        return 0;
    }
  }) || [];

  // Categorize payments by urgency
  const categorizePayments = (payments: PendingPayment[]) => {
    const now = new Date();
    const overdue: PendingPayment[] = [];
    const dueSoon: PendingPayment[] = [];
    const pending: PendingPayment[] = [];

    payments.forEach(payment => {
      if (!payment.dueDate) {
        pending.push(payment);
        return;
      }

      const dueDate = new Date(payment.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilDue < 0) {
        overdue.push(payment);
      } else if (daysUntilDue <= 7) {
        dueSoon.push(payment);
      } else {
        pending.push(payment);
      }
    });

    return { overdue, dueSoon, pending };
  };

  const { overdue, dueSoon, pending } = categorizePayments(sortedPayments);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return 'No due date';
    
    const now = new Date();
    const due = new Date(dueDate);
    const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) {
      return `${Math.abs(daysUntilDue)} days overdue`;
    } else if (daysUntilDue === 0) {
      return 'Due today';
    } else if (daysUntilDue === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${daysUntilDue} days`;
    }
  };

  const getUrgencyType = (payment: PendingPayment): 'overdue' | 'dueSoon' | 'pending' => {
    if (!payment.dueDate) return 'pending';
    const daysUntilDue = Math.ceil((new Date(payment.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilDue < 0) return 'overdue';
    if (daysUntilDue <= 7) return 'dueSoon';
    return 'pending';
  };

  const getSourceLabel = (payment: PendingPayment) => {
    const paymentSource = payment.paymentSource ||
      (payment.isLenderPayment ? 'lender_disbursement' : 'direct_payment');
    if (payment.isLoanRepaymentObligation) {
      return `Repay Lender${payment.lenderName ? ` · ${payment.lenderName}` : ''}`;
    }
    if (paymentSource === 'lender_disbursement') return 'Via Lender';
    if (paymentSource === 'direct_payment') return 'Direct Payment';
    return 'Auto-created';
  };

  const urgencyLabel = {
    overdue: 'Overdue',
    dueSoon: 'Due Soon',
    pending: 'Pending',
  };

  const PaymentRow: React.FC<{ payment: PendingPayment }> = ({ payment }) => {
    const urgencyType = getUrgencyType(payment);
    const isProcessing = payment.status === 'PROCESSING';
    const sourceLabel = getSourceLabel(payment);

    return (
      <tr className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
              {isCargoOwner
                ? <CreditCard className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                : <DollarSign className="w-4 h-4 text-primary-600 dark:text-primary-400" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[220px]">
                {payment.trip?.load?.title || 'Cargo Payment'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Trip #{payment.trip?.tripNumber || payment.tripId.slice(-8)}
              </p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3.5 hidden md:table-cell">
          <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
            <Package className="w-3.5 h-3.5 text-slate-400" />
            <span>{payment.trip?.load?.cargoType || 'General'}</span>
          </div>
        </td>
        <td className="px-4 py-3.5">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
            {urgencyLabel[urgencyType]}
          </span>
        </td>
        <td className="px-4 py-3.5 hidden lg:table-cell">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-800 whitespace-nowrap">
            {sourceLabel}
          </span>
        </td>
        <td className="px-4 py-3.5 hidden sm:table-cell">
          <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
            {formatDaysUntilDue(payment.dueDate)}
          </div>
          <div className="text-[11px] text-slate-400">
            {new Date(payment.createdAt).toLocaleDateString()}
          </div>
        </td>
        <td className="px-4 py-3.5 text-right">
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
            {formatCurrency(payment.amount, payment.currency)}
          </div>
          {payment.referenceNumber && (
            <div className="text-[10px] font-mono text-slate-400 truncate max-w-[120px] ml-auto">
              {payment.referenceNumber}
            </div>
          )}
        </td>
        <td className="px-4 py-3.5">
          <div className="flex items-center justify-end gap-1.5">
            {isCargoOwner && (
              isProcessing ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Processing
                </span>
              ) : (
                <button
                  onClick={() => handlePayNow(payment.id)}
                  disabled={processPaymentMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 text-xs font-semibold"
                  title="Pay Now"
                >
                  {processPaymentMutation.isPending ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CreditCard className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden xl:inline">Pay Now</span>
                </button>
              )
            )}
            <button
              onClick={() => handleViewDetails(payment.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-medium"
              title="View Details"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Details</span>
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const PaymentTable = ({ payments }: { payments: PendingPayment[] }) => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Cargo / Trip</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 hidden md:table-cell">Type</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 hidden lg:table-cell">Source</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Due</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Amount</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <PaymentRow key={payment.id} payment={payment} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className={cn('space-y-4 animate-pulse', className)}>
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center">
          <XCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Error Loading Payments</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">Failed to load payment information</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors text-sm font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const totalPayments = sortedPayments.length;

  if (totalPayments === 0) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">All Caught Up!</h3>
          <p className="text-slate-500 dark:text-slate-400">
            {isCargoOwner 
              ? "You have no pending payments at this time." 
              : "No expected payments at this time."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {isCargoOwner ? 'Pending Payments' : 'Expected Payments'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isCargoOwner 
                ? 'Payments you need to make for completed deliveries'
                : 'Payments you will receive for completed deliveries'
              }
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Cards — system palette only */}
        {paymentsData?.summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Total Amount</div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(paymentsData.summary.totalAmount, paymentsData.summary.currency)}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Overdue</div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {paymentsData.summary.overdueCount}
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 ml-1.5">
                  ({formatCurrency(paymentsData.summary.overdueAmount, paymentsData.summary.currency)})
                </span>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Due Soon</div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {paymentsData.summary.dueSoonCount}
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 ml-1.5">
                  ({formatCurrency(paymentsData.summary.dueSoonAmount, paymentsData.summary.currency)})
                </span>
              </div>
            </div>
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800/50 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-primary-600/70 dark:text-primary-400/70 mb-1">Total Payments</div>
              <div className="text-lg font-bold text-primary-700 dark:text-primary-300">
                {paymentsData.summary.totalPayments}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
            </select>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
          >
            <option value="dueDate">Sort by Due Date</option>
            <option value="amount">Sort by Amount</option>
            <option value="created">Sort by Created Date</option>
          </select>
        </div>
      </div>

      {/* Payments table — row format */}
      <div>
        <div className="flex flex-wrap items-center gap-3 mb-3 text-xs text-slate-500 dark:text-slate-400">
          {overdue.length > 0 && (
            <span className="inline-flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
              Overdue: {overdue.length}
            </span>
          )}
          {dueSoon.length > 0 && (
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
              Due Soon: {dueSoon.length}
            </span>
          )}
          {pending.length > 0 && (
            <span className="inline-flex items-center gap-1.5 font-medium">
              <DollarSign className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
              Pending: {pending.length}
            </span>
          )}
        </div>
        <PaymentTable payments={[...overdue, ...dueSoon, ...pending]} />
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedPayment(null);
        }}
        payment={selectedPayment ? mapToUIPendingPayment(selectedPayment) : null}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Payment Detail Modal */}
      <PaymentDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedPayment(null);
        }}
        payment={selectedPayment ? mapToUIPendingPayment(selectedPayment) : null}
        onPayNow={(payment) => {
          const apiPayment = sortedPayments.find(p => p.id === payment.id) ?? null;
          setSelectedPayment(apiPayment);
          setShowDetailModal(false);
          setShowPaymentModal(true);
        }}
      />
    </div>
  );
};

export default EnhancedPendingPaymentsSection;
