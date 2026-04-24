// Payment Utility Functions

import { PaymentType, PaymentUrgency } from './types';

/**
 * Calculate urgency based on due date
 */
export const calculateUrgency = (dueDate: Date): PaymentUrgency => {
  const now = new Date();
  const diffDays = Math.ceil((new Date(dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return PaymentUrgency.OVERDUE;
  if (diffDays <= 7) return PaymentUrgency.DUE_SOON;
  return PaymentUrgency.PENDING;
};

/**
 * Format due date with relative time
 */
export const formatDueDate = (dueDate: Date): string => {
  const now = new Date();
  const diffDays = Math.ceil((new Date(dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return `${overdueDays} day${overdueDays > 1 ? 's' : ''} overdue`;
  }
  
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  
  return `Due in ${diffDays} days`;
};

/**
 * Get payment type label
 */
export const getPaymentTypeLabel = (type: PaymentType): string => {
  const labels: Record<PaymentType, string> = {
    [PaymentType.LOAN_REPAYMENT]: 'Loan Repayment',
    [PaymentType.LOAD_PAYMENT]: 'Load Payment',
    [PaymentType.ADVANCE_PAYMENT]: 'Advance Payment',
    [PaymentType.REFUND]: 'Refund',
  };
  return labels[type] || type;
};

/**
 * Get payment type icon
 */
export const getPaymentTypeIcon = (type: PaymentType): string => {
  const icons: Record<PaymentType, string> = {
    [PaymentType.LOAN_REPAYMENT]: '🏦',
    [PaymentType.LOAD_PAYMENT]: '📦',
    [PaymentType.ADVANCE_PAYMENT]: '💵',
    [PaymentType.REFUND]: '🔄',
  };
  return icons[type] || '💰';
};

/**
 * Get payment type color
 */
export const getPaymentTypeColor = (type: PaymentType): string => {
  const colors: Record<PaymentType, string> = {
    [PaymentType.LOAN_REPAYMENT]: 'purple',
    [PaymentType.LOAD_PAYMENT]: 'blue',
    [PaymentType.ADVANCE_PAYMENT]: 'green',
    [PaymentType.REFUND]: 'orange',
  };
  return colors[type] || 'gray';
};

/**
 * Get urgency configuration
 */
export const getUrgencyConfig = (urgency: PaymentUrgency) => {
  const configs = {
    [PaymentUrgency.OVERDUE]: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-900',
      badge: 'bg-rose-100 text-rose-700 border-rose-200',
      icon: '🔴',
      label: 'OVERDUE',
    },
    [PaymentUrgency.DUE_SOON]: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-900',
      badge: 'bg-amber-100 text-amber-700 border-amber-200',
      icon: '🟡',
      label: 'DUE SOON',
    },
    [PaymentUrgency.PENDING]: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-700',
      badge: 'bg-slate-100 text-slate-600 border-slate-200',
      icon: '⚪',
      label: 'PENDING',
    },
  };
  return configs[urgency];
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format date
 */
export const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format date with time
 */
export const formatDateTime = (date: Date): string => {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get status style
 */
export const getStatusStyle = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'paid':
      return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case 'pending':
    case 'processing':
      return 'bg-amber-50 text-amber-600 border-amber-100';
    case 'failed':
    case 'overdue':
      return 'bg-rose-50 text-rose-600 border-rose-100';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-100';
  }
};
