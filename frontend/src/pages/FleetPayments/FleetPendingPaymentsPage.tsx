import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { paymentsAPI } from '../../services/api';
import PendingPaymentsSection from '../Payments/components/PendingPaymentsSection';
import FinancialOverview from '../Payments/components/FinancialOverview';
import type { 
  PendingPayment, 
  FinancialSummary,
} from '../Payments/types';
import {
  PaymentUrgency,
  PaymentType 
} from '../Payments/types';
import { calculateUrgency } from '../Payments/utils';

const FleetPendingPaymentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch payments that truck owner needs to make
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['fleet-pending-payments', searchTerm],
    queryFn: () => paymentsAPI.getAll({ search: searchTerm, direction: 'OUTGOING' }),
  });

  // Process pending payments (expenses, etc.)
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
        if (payment.dueDate) {
          const urgency = calculateUrgency(new Date(payment.dueDate));
          pendingPayments.push({
            id: payment.id,
            type: payment.paymentType || PaymentType.LOAD_PAYMENT,
            amount: payment.amount,
            currency: payment.currency || 'USD',
            dueDate: new Date(payment.dueDate),
            urgency,
            description: payment.description || `Payment for ${payment.category || 'expense'}`,
            referenceNumber: payment.referenceNumber || `PAY-${payment.id.slice(0, 8)}`,
            relatedEntity: {
              type: 'LOAD',
              id: payment.id,
              number: payment.referenceNumber || 'N/A',
            },
            createdAt: new Date(payment.createdAt),
          });
        }
      }
    });

    // Group by urgency
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

  const handlePayNow = (paymentId: string) => {
    toast.success('Opening payment modal...');
  };

  const handleViewDetails = (id: string) => {
    toast.success('Opening payment details...');
  };

  const handleRequestExtension = (paymentId: string) => {
    toast.success('Opening extension request...');
  };

  return (
    <div className="space-y-8">
      {/* Financial Overview */}
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
    </div>
  );
};

export default FleetPendingPaymentsPage;
