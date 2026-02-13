import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface TenantPlan {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  targetUser: 'CARGO_OWNER' | 'TRUCK_OWNER' | 'BOTH';
  price: number;
  currency: string;
  duration: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  maxShipments?: number;
  maxTrucks?: number;
  maxDrivers?: number;
  maxTransactions?: number;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  apiAccess: boolean;
  displayOrder: number;
  isPopular: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePlanDto {
  name: string;
  description?: string;
  targetUser: 'CARGO_OWNER' | 'TRUCK_OWNER' | 'BOTH';
  price: number;
  currency?: string;
  duration: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  maxShipments?: number;
  maxTrucks?: number;
  maxDrivers?: number;
  maxTransactions?: number;
  advancedAnalytics?: boolean;
  prioritySupport?: boolean;
  apiAccess?: boolean;
  displayOrder?: number;
  isPopular?: boolean;
}

export interface PlanStatistics {
  plan: TenantPlan;
  totalSubscribers: number;
  activeSubscribers: number;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
}

export interface SubscriptionOverview {
  plans: Array<{
    planId: string;
    planName: string;
    status: string;
    activeSubscribers: number;
    revenue: number;
  }>;
  totalRevenue: number;
  totalSubscribers: number;
  activePlans: number;
}

export const tenantSubscriptionApi = {
  // Plan Management
  createPlan: async (planData: CreatePlanDto): Promise<TenantPlan> => {
    const response = await apiClient.post('/tenant-subscriptions/plans', planData);
    return response.data.data.plan;
  },

  getPlans: async (includeInactive = false): Promise<TenantPlan[]> => {
    const response = await apiClient.get('/tenant-subscriptions/plans', {
      params: { includeInactive },
    });
    return response.data.data.plans;
  },

  getPlanById: async (planId: string): Promise<TenantPlan> => {
    const response = await apiClient.get(`/tenant-subscriptions/plans/${planId}`);
    return response.data.data.plan;
  },

  updatePlan: async (planId: string, planData: Partial<CreatePlanDto>): Promise<TenantPlan> => {
    const response = await apiClient.put(`/tenant-subscriptions/plans/${planId}`, planData);
    return response.data.data.plan;
  },

  togglePlanStatus: async (planId: string): Promise<TenantPlan> => {
    const response = await apiClient.put(`/tenant-subscriptions/plans/${planId}/toggle-status`);
    return response.data.data.plan;
  },

  deletePlan: async (planId: string): Promise<void> => {
    await apiClient.delete(`/tenant-subscriptions/plans/${planId}`);
  },

  // Statistics & Analytics
  getPlanStatistics: async (planId: string): Promise<PlanStatistics> => {
    const response = await apiClient.get(`/tenant-subscriptions/plans/${planId}/statistics`);
    return response.data.data;
  },

  getSubscriptionOverview: async (): Promise<SubscriptionOverview> => {
    const response = await apiClient.get('/tenant-subscriptions/overview');
    return response.data.data;
  },

  getSubscribersByPlan: async (planId: string) => {
    const response = await apiClient.get(`/tenant-subscriptions/plans/${planId}/subscribers`);
    return response.data.data.subscribers;
  },

  getExpiringSubscriptions: async (days = 30) => {
    const response = await apiClient.get('/tenant-subscriptions/expiring', {
      params: { days },
    });
    return response.data.data;
  },
};

// Explicit type exports for better IDE support
export type { TenantPlan, CreatePlanDto, PlanStatistics, SubscriptionOverview };
