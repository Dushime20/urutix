// Payment Types and Interfaces

export enum PaymentType {
  LOAN_REPAYMENT = 'LOAN_REPAYMENT',
  LOAD_PAYMENT = 'LOAD_PAYMENT',
  ADVANCE_PAYMENT = 'ADVANCE_PAYMENT',
  REFUND = 'REFUND',
}

export enum PaymentUrgency {
  OVERDUE = 'OVERDUE',
  DUE_SOON = 'DUE_SOON',
  PENDING = 'PENDING',
}

export interface PendingPayment {
  id: string;
  type: PaymentType;
  amount: number;
  currency: string;
  dueDate: Date;
  urgency: PaymentUrgency;
  description: string;
  referenceNumber: string;
  relatedEntity: {
    type: 'LOAN' | 'LOAD' | 'TRIP';
    id: string;
    number: string;
    name?: string;
  };
  lateFee?: number;
  createdAt: Date;
}

export interface CompletedTransaction {
  id: string;
  type: PaymentType;
  amount: number;
  currency: string;
  paidDate: Date;
  paymentMethod: string;
  referenceNumber: string;
  description: string;
  receiptUrl?: string;
  status: 'COMPLETED';
  trip?: {
    id: string;
    tripNumber: string;
  };
}

export interface FinancialSummary {
  overdue: {
    amount: number;
    count: number;
  };
  dueSoon: {
    amount: number;
    count: number;
  };
  completed: {
    amount: number;
    count: number;
  };
  total: {
    amount: number;
    count: number;
  };
}

export interface PendingPaymentsResponse {
  overdue: PendingPayment[];
  dueSoon: PendingPayment[];
  pending: PendingPayment[];
  summary: {
    totalOverdue: number;
    totalDueSoon: number;
    totalPending: number;
    totalAmount: number;
  };
}

export interface CompletedTransactionsResponse {
  transactions: CompletedTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalAmount: number;
    totalCount: number;
  };
}

export interface PaymentFilters {
  type?: PaymentType;
  urgency?: PaymentUrgency;
  minAmount?: number;
  maxAmount?: number;
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: PaymentType;
  method?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}
