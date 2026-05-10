import api from './api';

export interface PendingPayment {
  id: string;
  tripId: string;
  amount: number;
  currency: string;
  dueDate: string | null;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  paymentType: string;
  description: string;
  referenceNumber: string;
  createdAt: string;
  metadata: any;
  trip: {
    id: string;
    tripNumber: string;
    status: string;
    load: {
      id: string;
      title: string;
      cargoType: string;
    } | null;
  } | null;
}

export interface PaymentSummary {
  totalPayments: number;
  totalAmount: number;
  currency: string;
  overdueCount: number;
  overdueAmount: number;
  dueSoonCount: number;
  dueSoonAmount: number;
}

export interface PendingPaymentsResponse {
  payments: PendingPayment[];
  summary: PaymentSummary;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface PaymentForecast {
  period: string;
  totalUpcoming: number;
  totalPending: number;
  totalOverdue: number;
  payments: Array<{
    id: string;
    tripId: string;
    tripNumber?: string;
    amount: number;
    currency: string;
    dueDate?: string;
    status: string;
    paymentType: string;
    daysUntilDue: number;
  }>;
}

class PendingPaymentsApi {
  /**
   * Get pending payments for cargo owner (payments they need to make)
   */
  async getPendingPaymentsForCargoOwner(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<PendingPaymentsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const response = await api.get(`/pending-payments/cargo-owner?${queryParams.toString()}`);
    return response.data.data;
  }

  /**
   * Get expected payments for truck owner (payments they will receive)
   */
  async getExpectedPaymentsForTruckOwner(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<PendingPaymentsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const response = await api.get(`/pending-payments/truck-owner?${queryParams.toString()}`);
    return response.data.data;
  }

  /**
   * Get payment forecast for the next N days
   */
  async getPaymentForecast(days: number = 30): Promise<PaymentForecast> {
    const response = await api.get(`/pending-payments/forecast?days=${days}`);
    return response.data.data;
  }

  /**
   * Process a pending payment
   */
  async processPayment(paymentId: string): Promise<any> {
    const response = await api.post(`/payments/${paymentId}/process`);
    return response.data;
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(paymentId: string): Promise<any> {
    const response = await api.get(`/payments/${paymentId}`);
    return response.data;
  }
}

export const pendingPaymentsApi = new PendingPaymentsApi();