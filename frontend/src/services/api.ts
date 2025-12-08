import axios from 'axios';
import { getApiBaseUrl } from '../config/environment';
import type { IPaginatedRes } from '../types/apiResponse';
import type { Tenant, TenantSearchParams } from '../types/tenant';

const baseURL = getApiBaseUrl();

// Create axios instance
const api = axios.create({
  baseURL: baseURL ?? 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor to add auth token and tenant header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    // Resolve tenant ID from stored user or fallback key
    let tenantId: string | null = null;
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        tenantId = user?.tenantId || null;
      } catch {
        // ignore parse errors
      }
    }
    if (!tenantId) {
      tenantId = localStorage.getItem('tenantId');
    }
    console.log('🔐 API Request Debug:');
    console.log('URL:', config.url);
    console.log('Method:', config.method);
    console.log('Token found:', !!token);
    console.log('Token preview:', token ? `${token.substring(0, 20)}...` : 'No token');
    console.log('Tenant ID:', tenantId || 'None');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Authorization header added');
    } else {
      console.log('❌ No token found in localStorage');
    }
    if (tenantId) {
      // Add multi-tenant header for backend routing
      (config.headers as any)['X-Tenant-ID'] = tenantId;
      console.log('✅ X-Tenant-ID header added');
    }
    
    console.log('Final headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Note: Response interceptor removed to prevent conflicts with AuthContext
// The AuthContext handles 401 errors and token refresh automatically

// Auth API
export const authAPI = {
  login: (data: { email: string; password: string, rememberMe?: boolean }) =>
    api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  testAuth: () => api.get('/auth/profile'), // Simple auth test
  setupDriverPassword: (data: { token: string; password: string; confirmPassword: string }) =>
    api.post('/auth/driver/setup-password', data),
  setupTenantPassword: (data: { token: string; password: string; confirmPassword: string }) =>
    api.post('/auth/tenant/setup-password', data),
  setupLenderPassword: (data: { token: string; password: string; confirmPassword: string }) =>
    api.post('/auth/lender/setup-password', data),
};

// Trips API
export const tripsAPI = {
  getAll: (params?: any) => api.get('/trips', { params }),
  getById: (id: string) => api.get(`/trips/${id}`),
  create: (data: any) => api.post('/trips', data),
  updateStatus: (id: string, data: any) => api.patch(`/trips/${id}/status`, data),
  getAnalytics: () => api.get('/trips/analytics/summary'),
  getActive: () => api.get('/trips/active'),
};

// Fleet API
export const fleetAPI = {
  getTrucks: (params?: any) => api.get('/fleet/trucks', { params }),
  getTruckById: (id: string) => api.get(`/fleet/trucks/${id}`),
  createTruck: (data: any) => api.post('/fleet/trucks', data),
  updateTruck: (id: string, data: any) => api.patch(`/fleet/trucks/${id}`, data),
  deleteTruck: (id: string) => api.delete(`/fleet/trucks/${id}`),
  
  getDrivers: (params?: any) => api.get('/fleet/drivers', { params }),
  getDriverById: (id: string) => api.get(`/fleet/drivers/${id}`),
  createDriver: (data: any) => api.post('/fleet/drivers', data),
  updateDriver: (id: string, data: any) => api.patch(`/fleet/drivers/${id}`, data),
  deleteDriver: (id: string) => api.delete(`/fleet/drivers/${id}`),
  
  getAnalytics: () => api.get('/fleet/analytics'),
};

// Tenant API
export const tenantAPI = {
  getTenants: (params?: any) => api.get("/tenant", { params }),
  getTenantById: (id: string) => api.get(`/tenant/${id}`),
  createTenant: (data: any) => api.post("/tenant", data),
  searchTenants: (params?: TenantSearchParams) =>
    api.get<IPaginatedRes<Tenant>>("/tenants/search", { params }),
};

// Financial API
export const financialAPI = {
  // Invoices
  getInvoices: (params?: any) => api.get('/financial/invoices', { params }),
  getInvoiceById: (id: string) => api.get(`/financial/invoices/${id}`),
  createInvoice: (data: any) => api.post('/financial/invoices', data),
  updateInvoice: (id: string, data: any) => api.patch(`/financial/invoices/${id}`, data),
  deleteInvoice: (id: string) => api.delete(`/financial/invoices/${id}`),
  
  // Expenses
  getExpenses: (params?: any) => api.get('/financial/expenses', { params }),
  getExpenseById: (id: string) => api.get(`/financial/expenses/${id}`),
  createExpense: (data: any) => api.post('/financial/expenses', data),
  updateExpense: (id: string, data: any) => api.patch(`/financial/expenses/${id}`, data),
  deleteExpense: (id: string) => api.delete(`/financial/expenses/${id}`),
  
  // Payments
  getPayments: (params?: any) => api.get('/financial/payments', { params }),
  getPaymentById: (id: string) => api.get(`/financial/payments/${id}`),
  createPayment: (data: any) => api.post('/financial/payments', data),
  
  // Reports
  getFinancialReports: (params?: any) => api.get('/financial/reports', { params }),
  generateFinancialReport: (data: any) => api.post('/financial/reports', data),
  
  // Analytics
  getPerformanceMetrics: (params?: any) => api.get('/financial/analytics/performance', { params }),
  getCustomerAnalytics: (params?: any) => api.get('/financial/analytics/customers', { params }),
  getDriverAnalytics: (params?: any) => api.get('/financial/analytics/drivers', { params }),
  getPredictiveAnalytics: (params?: any) => api.get('/financial/analytics/predictive', { params }),
};

// Payments API
export const paymentsAPI = {
  getAdvancePaymentCalculation: (tripId: string) => 
    api.get(`/payments/trip/${tripId}/advance-payment-calculation`),
  getAll: (params?: any) => api.get('/payments', { params }),
  getById: (id: string) => api.get(`/payments/${id}`),
  create: (data: any) => api.post('/payments', data),
  updateStatus: (id: string, data: any) => api.patch(`/payments/${id}/status`, data),
  process: (id: string) => api.post(`/payments/${id}/process`),
  refund: (id: string, data: any) => api.post(`/payments/${id}/refund`, data),
  getAnalytics: () => api.get('/payments/analytics'),
  getHistory: (tripId: string) => api.get(`/payments/trip/${tripId}/history`),
  requestAdvance: (data: { tripId: string; amount: number; reason: string; urgency: string }) => 
    api.post('/payments/advance-request', data),
  getForecast: (params?: any) => api.get('/payments/forecast', { params }),
};

// Locations API
export const locationsAPI = {
  getAll: (params?: any) => api.get('/locations', { params }),
  getById: (id: string) => api.get(`/locations/${id}`),
  create: (data: any) => api.post('/locations', data),
  update: (id: string, data: any) => api.patch(`/locations/${id}`, data),
  delete: (id: string) => api.delete(`/locations/${id}`),
  search: (params: any) => api.get('/locations/search', { params }),
};

// Notifications API
export const notificationsAPI = {
  getAll: (params?: any) => api.get('/notifications', { params }),
  getById: (id: string) => api.get(`/notifications/${id}`),
  create: (data: any) => api.post('/notifications', data),
  update: (id: string, data: any) => api.patch(`/notifications/${id}`, data),
  delete: (id: string) => api.delete(`/notifications/${id}`),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read/all'),
  archive: (id: string) => api.patch(`/notifications/${id}/archive`),
  getUnreadCount: () => api.get('/notifications/unread/count'),
  getStats: () => api.get('/notifications/stats'),
};

// Matching API
export const matchingAPI = {
  findMatches: (data: any) => api.post('/matching/find-matches', data),
  findMatchesHungarian: (data: any) => api.post('/matching/find-matches-hungarian', data),
  findMatchesGenetic: (data: any) => api.post('/matching/find-matches-genetic', data),
  findMatchesTopsis: (data: any) => api.post('/matching/find-matches-topsis', data),
  findMatchesHybrid: (data: any) => api.post('/matching/find-matches-hybrid', data),
  getMarketInsights: () => api.get('/matching/market-insights'),
  getMatchHistory: (params?: any) => api.get('/matching/history', { params }),
  getAvailableAlgorithms: () => api.get('/matching/algorithms'),
  getScoringFactors: () => api.get('/matching/scoring-factors'),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: (params?: any) => api.get('/analytics/dashboard', { params }),
  getRevenue: (params?: any) => api.get('/analytics/revenue', { params }),
  getTrips: (params?: any) => api.get('/analytics/trips', { params }),
  getLoads: (params?: any) => api.get('/analytics/loads', { params }),
  getPayments: (params?: any) => api.get('/analytics/payments', { params }),
  getUsers: (params?: any) => api.get('/analytics/users', { params }),
  getFleet: (params?: any) => api.get('/analytics/fleet', { params }),
  getMatching: (params?: any) => api.get('/analytics/matching', { params }),
  getNotifications: (params?: any) => api.get('/analytics/notifications', { params }),
};

// Lending API
export const lendingAPI = {
  // Loan Requests
  getLoanRequests: (params?: any) => api.get('/lending/loan-requests', { params }),
  createLoanRequest: (data: any) => api.post('/lending/loan-requests', data),
  getLoanRequest: (id: string) => api.get(`/lending/loan-requests/${id}`),
  approveLoanRequest: (id: string) => api.post(`/lending/loan-requests/${id}/approve`),
  rejectLoanRequest: (id: string, reason: string) => api.post(`/lending/loan-requests/${id}/reject`, { reason }),
  
  // Cargo-based loan requests
  createCargoLoanRequest: (cargoId: string, data?: any) => api.post(`/lending/cargo/${cargoId}/loan-request`, data),
  
  // Disbursements
  getDisbursements: (params?: any) => api.get('/lending/disbursements', { params }),
  createDisbursement: (data: any) => api.post('/lending/disbursements', data),
  getDisbursement: (id: string) => api.get(`/lending/disbursements/${id}`),
  updateDisbursementStatus: (id: string, status: string) => api.patch(`/lending/disbursements/${id}/status`, { status }),
  
  // Repayments
  getRepayments: (params?: any) => api.get('/lending/repayments', { params }),
  createRepayment: (data: any) => api.post('/lending/repayments', data),
  getRepayment: (id: string) => api.get(`/lending/repayments/${id}`),
  
  // Dashboard Stats
  getDashboardStats: (params?: any) => api.get('/lending/dashboard/stats', { params }),
  getPortfolioAnalysis: (params?: any) => api.get('/lending/dashboard/portfolio', { params }),
  getRiskAnalysis: (params?: any) => api.get('/lending/dashboard/risk', { params }),
  
  // Lenders
  getLenders: (params?: any) => api.get('/lending/lenders', { params }),
  getLender: (id: string) => api.get(`/lending/lenders/${id}`),
  getLenderPolicies: (id: string) => api.get(`/lending/lenders/${id}/policies`),
};

export default api; 