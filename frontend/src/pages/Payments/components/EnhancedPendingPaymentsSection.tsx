import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  AlertCircle, 
  Clock, 
  DollarSign, 
  Calendar,
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
  };

  const handleViewDetails = (paymentId: string) => {
    const payment = findPaymentById(paymentId);
    if (payment) {
      setSelectedPayment(payment);
      setShowDetailModal(true);
    }
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

  const PaymentCard: React.FC<{ payment: PendingPayment; urgencyType: 'overdue' | 'dueSoon' | 'pending' }> = ({ 
    payment, 
    urgencyType 
  }) => {
    const urgencyColors = {
      overdue: 'border-red-200 bg-red-50',
      dueSoon: 'border-orange-200 bg-orange-50',
      pending: 'border-slate-200 bg-white',
    };

    const urgencyTextColors = {
      overdue: 'text-red-700',
      dueSoon: 'text-orange-700',
      pending: 'text-slate-700',
    };

    const isProcessing = payment.status === 'PROCESSING';
    const paymentSource = payment.paymentSource ||
      (payment.isLenderPayment ? 'lender_disbursement' : 'direct_payment');

    const sourceLabel =
      paymentSource === 'lender_disbursement'
        ? { text: 'Via Lender', color: 'bg-purple-100 text-purple-700' }
        : paymentSource === 'direct_payment'
        ? { text: 'Direct Payment', color: 'bg-blue-100 text-blue-700' }
        : { text: 'Auto-created', color: 'bg-slate-100 text-slate-600' };

    return (
      <div className={cn(
        'rounded-2xl border p-6 transition-all hover:shadow-lg',
        urgencyColors[urgencyType]
      )}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              {isCargoOwner ? <CreditCard className="w-6 h-6 text-blue-600" /> : <DollarSign className="w-6 h-6 text-green-600" />}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">
                {payment.trip?.load?.title || 'Cargo Payment'}
              </h3>
              <p className="text-sm text-slate-500">
                Trip #{payment.trip?.tripNumber || payment.tripId.slice(-8)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-slate-900">
              {formatCurrency(payment.amount, payment.currency)}
            </div>
            <div className={cn('text-sm font-medium', urgencyTextColors[urgencyType])}>
              {formatDaysUntilDue(payment.dueDate)}
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Package className="w-4 h-4" />
            <span>{payment.trip?.load?.cargoType || 'General Cargo'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4" />
            <span>Created: {new Date(payment.createdAt).toLocaleDateString()}</span>
          </div>
          {payment.referenceNumber && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                {payment.referenceNumber}
              </span>
            </div>
          )}
          {/* Payment source badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', sourceLabel.color)}>
              {sourceLabel.text}
            </span>
            {payment.isLenderPayment && payment.lenderName && (
              <span className="text-xs text-slate-500">by {payment.lenderName}</span>
            )}
            {isProcessing && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Processing
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {isCargoOwner && (
            isProcessing ? (
              <div className="flex-1 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Payment in progress…
              </div>
            ) : (
              <button
                onClick={() => handlePayNow(payment.id)}
                disabled={processPaymentMutation.isPending}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processPaymentMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                Pay Now
              </button>
            )
          )}
          <button
            onClick={() => handleViewDetails(payment.id)}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Details
          </button>
        </div>
      </div>
    );
  };

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
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Payments</h3>
          <p className="text-red-600 mb-4">Failed to load payment information</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">All Caught Up!</h3>
          <p className="text-slate-600">
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
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {isCargoOwner ? 'Pending Payments' : 'Expected Payments'}
            </h2>
            <p className="text-sm text-slate-600">
              {isCargoOwner 
                ? 'Payments you need to make for completed deliveries'
                : 'Payments you will receive for completed deliveries'
              }
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Cards */}
        {paymentsData?.summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-sm text-slate-600">Total Amount</div>
              <div className="text-lg font-bold text-slate-900">
                {formatCurrency(paymentsData.summary.totalAmount, paymentsData.summary.currency)}
              </div>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <div className="text-sm text-red-600">Overdue</div>
              <div className="text-lg font-bold text-red-700">
                {paymentsData.summary.overdueCount} ({formatCurrency(paymentsData.summary.overdueAmount, paymentsData.summary.currency)})
              </div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4">
              <div className="text-sm text-orange-600">Due Soon</div>
              <div className="text-lg font-bold text-orange-700">
                {paymentsData.summary.dueSoonCount} ({formatCurrency(paymentsData.summary.dueSoonAmount, paymentsData.summary.currency)})
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-sm text-blue-600">Total Payments</div>
              <div className="text-lg font-bold text-blue-700">
                {paymentsData.summary.totalPayments}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1 text-sm"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
            </select>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border border-slate-300 rounded-lg px-3 py-1 text-sm"
          >
            <option value="dueDate">Sort by Due Date</option>
            <option value="amount">Sort by Amount</option>
            <option value="created">Sort by Created Date</option>
          </select>
        </div>
      </div>

      {/* Overdue Payments */}
      {overdue.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Overdue ({overdue.length})
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {overdue.map((payment) => (
              <PaymentCard key={payment.id} payment={payment} urgencyType="overdue" />
            ))}
          </div>
        </div>
      )}

      {/* Due Soon Payments */}
      {dueSoon.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-orange-700 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Due Soon ({dueSoon.length})
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {dueSoon.map((payment) => (
              <PaymentCard key={payment.id} payment={payment} urgencyType="dueSoon" />
            ))}
          </div>
        </div>
      )}

      {/* Pending Payments */}
      {pending.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Pending ({pending.length})
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pending.map((payment) => (
              <PaymentCard key={payment.id} payment={payment} urgencyType="pending" />
            ))}
          </div>
        </div>
      )}

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