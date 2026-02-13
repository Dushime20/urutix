import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types
export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  tripId?: string;
  truckId?: string;
  driverId?: string;
  issueDate: Date;
  dueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  notes?: string;
  paymentTerms: string;
  paymentMethod?: string;
  paidDate?: Date;
  lateFees?: number;
  items: InvoiceItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  type: 'freight' | 'fuel_surcharge' | 'toll' | 'detention' | 'lumper' | 'accessorial';
  tripId?: string;
  notes?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: 'check' | 'ach' | 'credit_card' | 'wire' | 'cash';
  referenceNumber?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  notes?: string;
  processingFee?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  planName: string;
  planType: 'basic' | 'professional' | 'enterprise';
  status: 'active' | 'cancelled' | 'suspended' | 'trial';
  billingCycle: 'monthly' | 'quarterly' | 'annual';
  amount: number;
  currency: string;
  startDate: Date;
  endDate?: Date;
  nextBillingDate: Date;
  features: string[];
  limits: {
    users: number;
    trucks: number;
    loads: number;
    storage: string;
  };
}

export interface TaxReport {
  id: string;
  period: string;
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  totalExpenses: number;
  taxableIncome: number;
  taxAmount: number;
  taxRate: number;
  status: 'draft' | 'filed' | 'paid';
  filedDate?: Date;
  paidDate?: Date;
}

export interface BillingStats {
  totalRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  pendingPayments: number;
  totalPayments: number;
  averageInvoiceAmount: number;
  averagePaymentTime: number;
}

// API Functions
export const billingApi = {
  // Invoices
  getInvoices: async (params?: {
    status?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: Invoice[]; total: number }> => {
    const response = await apiClient.get(`/financial/invoices`, { params });
    return {
      data: response.data.data.invoices,
      total: response.data.data.invoices.length
    };
  },

  getInvoiceById: async (id: string): Promise<Invoice> => {
    const response = await apiClient.get(`/financial/invoices/${id}`);
    return response.data.data.invoice;
  },

  createInvoice: async (invoice: Partial<Invoice>): Promise<Invoice> => {
    const response = await apiClient.post(`/financial/invoices`, invoice);
    return response.data.data.invoice;
  },

  updateInvoice: async (id: string, invoice: Partial<Invoice>): Promise<Invoice> => {
    const response = await apiClient.patch(`/financial/invoices/${id}`, invoice);
    return response.data.data.invoice;
  },

  deleteInvoice: async (id: string): Promise<void> => {
    await apiClient.delete(`/financial/invoices/${id}`);
  },

  sendInvoice: async (id: string, email: string): Promise<void> => {
    await apiClient.post(`/financial/invoices/${id}/send`, { email });
  },

  // Payments
  getPayments: async (params?: {
    status?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: Payment[]; total: number }> => {
    const response = await apiClient.get(`/financial/payments`, { params });
    return {
      data: response.data.data.payments,
      total: response.data.data.payments.length
    };
  },

  getPaymentById: async (id: string): Promise<Payment> => {
    const response = await apiClient.get(`/financial/payments/${id}`);
    return response.data.data.payment;
  },

  createPayment: async (payment: Partial<Payment>): Promise<Payment> => {
    const response = await apiClient.post(`/financial/payments`, payment);
    return response.data.data.payment;
  },

  refundPayment: async (id: string, reason: string): Promise<Payment> => {
    const response = await apiClient.post(`/financial/payments/${id}/refund`, { reason });
    return response.data.data.payment;
  },

  // Subscription (Mock for now - implement backend later)
  getSubscription: async (tenantId: string): Promise<Subscription> => {
    // Mock data - replace with real API call
    return {
      id: 'sub-001',
      planName: 'Professional Plan',
      planType: 'professional',
      status: 'active',
      billingCycle: 'monthly',
      amount: 299,
      currency: 'USD',
      startDate: new Date('2024-01-01'),
      nextBillingDate: new Date('2024-03-01'),
      features: [
        'Unlimited users',
        'Up to 50 trucks',
        'Unlimited loads',
        '100GB storage',
        'Advanced analytics',
        'Priority support'
      ],
      limits: {
        users: -1,
        trucks: 50,
        loads: -1,
        storage: '100GB'
      }
    };
  },

  updateSubscription: async (tenantId: string, planType: string): Promise<Subscription> => {
    // Mock - implement backend later
    const response = await apiClient.patch(`/tenants/${tenantId}/subscription`, { planType });
    return response.data.data.subscription;
  },

  cancelSubscription: async (tenantId: string, reason: string): Promise<void> => {
    await apiClient.post(`/tenants/${tenantId}/subscription/cancel`, { reason });
  },

  // Tax Reports (Mock for now)
  getTaxReports: async (params?: {
    period?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: TaxReport[]; total: number }> => {
    // Mock data
    return {
      data: [
        {
          id: 'tax-001',
          period: 'Q4 2023',
          startDate: new Date('2023-10-01'),
          endDate: new Date('2023-12-31'),
          totalRevenue: 125000,
          totalExpenses: 45000,
          taxableIncome: 80000,
          taxAmount: 16000,
          taxRate: 20,
          status: 'paid',
          filedDate: new Date('2024-01-15'),
          paidDate: new Date('2024-01-20')
        }
      ],
      total: 1
    };
  },

  generateTaxReport: async (startDate: string, endDate: string): Promise<TaxReport> => {
    const response = await apiClient.post(`/financial/tax/generate`, {
      startDate,
      endDate
    });
    return response.data.data.report;
  },

  exportTaxReport: async (id: string, format: 'csv' | 'excel' | 'pdf'): Promise<Blob> => {
    const response = await apiClient.get(`/financial/tax/${id}/export`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  },

  // Statistics
  getBillingStats: async (tenantId: string): Promise<BillingStats> => {
    // Calculate from invoices and payments
    const [invoices, payments] = await Promise.all([
      billingApi.getInvoices(),
      billingApi.getPayments()
    ]);

    const totalRevenue = invoices.data.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const paidInvoices = invoices.data.filter(inv => inv.status === 'paid').length;
    const overdueInvoices = invoices.data.filter(inv => inv.status === 'overdue').length;
    const pendingPayments = payments.data.filter(p => p.status === 'pending').length;

    return {
      totalRevenue,
      totalInvoices: invoices.total,
      paidInvoices,
      overdueInvoices,
      pendingPayments,
      totalPayments: payments.total,
      averageInvoiceAmount: totalRevenue / invoices.total || 0,
      averagePaymentTime: 28 // Mock - calculate from actual data
    };
  },

  // Export
  exportBillingData: async (
    format: 'csv' | 'excel' | 'pdf',
    dataType: 'invoices' | 'payments' | 'all',
    startDate?: string,
    endDate?: string
  ): Promise<Blob> => {
    const response = await apiClient.post(
      `/financial/export`,
      { format, dataType, startDate, endDate },
      { responseType: 'blob' }
    );
    return response.data;
  }
};
