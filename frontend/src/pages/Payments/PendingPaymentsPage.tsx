import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { paymentsAPI } from '../../services/api';
import FinancialOverview from './components/FinancialOverview';
import PendingPaymentsSection from './components/PendingPaymentsSection';
import PaymentModal from './components/PaymentModal';
import PaymentDetailModal from './components/PaymentDetailModal';
import type { 
  PendingPayment, 
  FinancialSummary,
} from './types';
import {
  PaymentUrgency,
  PaymentType 
} from './types';
import { calculateUrgency } from './utils';

const PendingPaymentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch all payments
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['payments', searchTerm],
    queryFn: () => paymentsAPI.getAll({ search: searchTerm }),
  });

  // Process payments data - only pending
  const processedData = useMemo(() => {
    if (!paymentsData?.data?.payments) {
      return {
        pending: { overdue: [], dueSoon: [], pending: [] },
        summary: {
          overdue: { amount: 0, count: 0 },
          dueSoon: { amount: 0, count: 0 },
          completed: { amount: 0, count: 0 },
          total: { amount: 0, count: 0 },
        },
      };
    }

    const payments = paymentsData.data.payments;
    const pendingPayments: PendingPayment[] = [];
    let completedAmount = 0;
    let completedCount = 0;

    payments.forEach((payment: any) => {
      if (payment.status === 'COMPLETED') {
        completedAmount += payment.amount;
        completedCount++;
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
        amount: completedAmount,
        count: completedCount,
      },
      total: {
        amount: payments.reduce((sum: number, p: any) => sum + p.amount, 0),
        count: payments.length,
      },
    };

    return {
      pending: { overdue, dueSoon, pending },
      summary,
    };
  }, [paymentsData]);

  // Find payment by ID
  const findPaymentById = (id: string): PendingPayment | null => {
    const allPayments = [
      ...processedData.pending.overdue,
      ...processedData.pending.dueSoon,
      ...processedData.pending.pending,
    ];
    return allPayments.find(p => p.id === id) || null;
  };

  // Handlers
  const handlePayNow = (paymentId: string) => {
    const payment = findPaymentById(paymentId);
    if (payment) {
      setSelectedPayment(payment);
      setShowPaymentModal(true);
    }
  };

  const handleViewDetails = (id: string) => {
    const payment = findPaymentById(id);
    if (payment) {
      setSelectedPayment(payment);
      setShowDetailModal(true);
    }
  };

  const handleRequestExtension = (paymentId: string) => {
    toast.success('Opening extension request...');
    // TODO: Implement extension request
  };

  const handlePaymentSuccess = () => {
    // Refresh payments data
    toast.success('Payment completed successfully!');
    setShowPaymentModal(false);
    setShowDetailModal(false);
    setSelectedPayment(null);
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

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedPayment(null);
        }}
        payment={selectedPayment}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Payment Detail Modal */}
      <PaymentDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedPayment(null);
        }}
        payment={selectedPayment}
        onPayNow={(payment) => {
          setSelectedPayment(payment);
          setShowDetailModal(false);
          setShowPaymentModal(true);
        }}
      />
    </div>
  );
};

export default PendingPaymentsPage;
