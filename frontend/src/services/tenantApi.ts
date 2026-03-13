import api from './api';

export interface TenantMetrics {
  totalRevenue: number;
  totalShipments: number;
  activeFleet: number;
  onTimeDelivery: number;
  customerSatisfaction: number;
  fuelEfficiency: number;
  averageLoadUtilization: number;
  disputeRate: number;
}

export interface TenantTrends {
  revenue: number[];
  shipments: number[];
  fleetUtilization: number[];
  fuelEfficiency: number[];
}

export interface TenantActivity {
  id: number;
  type: 'shipment' | 'maintenance' | 'payment' | 'dispute' | 'route' | 'fleet';
  action: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
  metadata?: Record<string, any>;
}

export interface TenantInfo {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'suspended';
  type: 'fleet-operator' | 'cargo-owner' | 'broker' | 'logistics-provider';
  createdAt: string;
  updatedAt: string;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  subscription: {
    plan: string;
    status: string;
    expiresAt: string;
  };
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  target: number;
  previous: number;
  trend: 'up' | 'down' | 'stable';
  category: 'revenue' | 'efficiency' | 'quality' | 'safety';
  status: 'excellent' | 'good' | 'average' | 'poor';
}

export interface FinancialMetrics {
  totalRevenue: number;
  totalTransactions: number;
  pendingAmount: number;
  escrowBalance: number;
  platformFees: number;
  averageTransactionValue: number;
  dailyRevenue: number[];
  monthlyGrowth: number;
}

export interface FleetMetrics {
  totalVehicles: number;
  activeVehicles: number;
  maintenanceDue: number;
  averageUtilization: number;
  fuelConsumption: number;
  driverCount: number;
  routeCount: number;
}

export interface CargoMetrics {
  totalLoads: number;
  activeLoads: number;
  completedLoads: number;
  averageLoadValue: number;
  topCommodities: Array<{
    name: string;
    count: number;
    value: number;
  }>;
  popularRoutes: Array<{
    origin: string;
    destination: string;
    frequency: number;
  }>;
}

export type TripStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DELAYED';

export const TripStatusMap = {
  PLANNED: 'PLANNED' as TripStatus,
  IN_PROGRESS: 'IN_PROGRESS' as TripStatus,
  COMPLETED: 'COMPLETED' as TripStatus,
  CANCELLED: 'CANCELLED' as TripStatus,
  DELAYED: 'DELAYED' as TripStatus,
};

export interface Trip {
  id: string;
  tripNumber: string;
  status: TripStatus;
  loadId: string;
  truckId: string;
  driverId: string;
  tenantId: string;
  plannedStartTime?: string;
  plannedEndTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  agreedPrice: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Location Data
  currentLocation?: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  origin?: {
    name?: string;
    description?: string;
    latitude: number;
    longitude: number;
  } | string; // Supporting both object and simple string for backward compat
  destination?: {
    name?: string;
    description?: string;
    latitude: number;
    longitude: number;
  } | string;
  estimatedArrival?: string;
  truckNumber?: string; // Add truckNumber as it is used in UI
}

export interface TripAnalyticsSummary {
  totalTrips: number;
  completedTrips: number;
  inProgressTrips: number;
  plannedTrips: number;
  completionRate: number;
}

export interface OperationalMetrics {
  onTimePerformance: number;
  averageTransitTime: number;
  damageRate: number;
  customerComplaints: number;
  driverSafetyScore: number;
  routeEfficiency: number;
}

export interface CreditBalance {
  currentBalance: number;
  subscriptionCredits: number;
  purchasedCredits: number;
  bonusCredits: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  nextRefreshDate?: string;
  transactions?: any[];
}

export interface Bid {
  id: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'active';
  loadId: string;
  loadOrigin: string;
  loadDestination: string;
  pickupDate: string;
  truckId: string;
  driverName?: string;
  createdAt: string;
  expiryTime?: string;
}

// Tenant Dashboard API calls
export const tenantApi = {
  // Get tenant information
  getTenantInfo: async (tenantId: string): Promise<TenantInfo> => {
    const response = await api.get(`/tenants/${tenantId}`);
    return response.data.data || response.data;
  },

  // Get tenant metrics
  getTenantMetrics: async (tenantId: string, timeRange: string = '7d'): Promise<TenantMetrics> => {
    const response = await api.get(`/tenant-dashboard/${tenantId}/metrics`, {
      params: { timeRange }
    });
    return response.data.data;
  },

  // Get tenant trends
  getTenantTrends: async (tenantId: string, timeRange: string = '7d'): Promise<TenantTrends> => {
    const response = await api.get(`/tenant-dashboard/${tenantId}/trends`, {
      params: { timeRange }
    });
    return response.data.data;
  },

  // Get recent activity
  getRecentActivity: async (tenantId: string, limit: number = 10): Promise<TenantActivity[]> => {
    const response = await api.get(`/tenant-dashboard/${tenantId}/activity`, {
      params: { limit }
    });
    return response.data.data;
  },

  // Get comprehensive summary
  getTenantDashboardSummary: async (tenantId: string, timeRange: string = '7d'): Promise<any> => {
    const response = await api.get(`/tenant-dashboard/${tenantId}/summary`, {
      params: { timeRange }
    });
    return response.data.data;
  },

  // Notify low credit partners
  notifyLowCreditPartners: async (tenantId: string): Promise<any> => {
    const response = await api.post(`/tenant-dashboard/${tenantId}/notify-low-credit`);
    return response.data;
  },

  // Get performance metrics
  getPerformanceMetrics: async (tenantId: string): Promise<PerformanceMetric[]> => {
    const response = await api.get(`/tenant-dashboard/${tenantId}/performance`);
    return response.data.data;
  },

  // Get financial metrics
  getFinancialMetrics: async (tenantId: string, timeRange: string = '7d'): Promise<FinancialMetrics> => {
    const response = await api.get(`/tenant-dashboard/${tenantId}/financial`, {
      params: { timeRange }
    });
    return response.data.data;
  },

  // Get fleet metrics
  getFleetMetrics: async (tenantId: string): Promise<FleetMetrics> => {
    const response = await api.get(`/tenant-dashboard/${tenantId}/fleet`);
    return response.data.data;
  },

  // Get cargo metrics
  getCargoMetrics: async (tenantId: string, timeRange: string = '7d'): Promise<CargoMetrics> => {
    const response = await api.get(`/tenant-dashboard/${tenantId}/cargo`, {
      params: { timeRange }
    });
    return response.data.data;
  },

  // Get operational metrics
  getOperationalMetrics: async (tenantId: string): Promise<OperationalMetrics> => {
    const response = await api.get(`/tenant-dashboard/${tenantId}/operations`);
    return response.data.data;
  },

  // Update tenant settings
  updateTenantSettings: async (tenantId: string, settings: Partial<TenantInfo>): Promise<TenantInfo> => {
    const response = await api.put(`/tenants/${tenantId}/settings`, settings);
    return response.data.data || response.data;
  },

  // Get tenant analytics
  getTenantAnalytics: async (tenantId: string, filters: {
    startDate?: string;
    endDate?: string;
    metrics?: string[];
    groupBy?: string;
  } = {}): Promise<any> => {
    const response = await api.get(`/tenants/${tenantId}/analytics`, {
      params: filters
    });
    return response.data;
  },

  // Export tenant data
  exportTenantData: async (tenantId: string, format: 'csv' | 'excel' | 'pdf' = 'csv', filters: {
    startDate?: string;
    endDate?: string;
    dataType?: string;
  } = {}): Promise<Blob> => {
    const response = await api.get(`/tenants/${tenantId}/export`, {
      params: { format, ...filters },
      responseType: 'blob'
    });
    return response.data;
  },

  // KYC Management
  submitKYC: async (tenantId: string, data: any): Promise<TenantInfo> => {
    const response = await api.post(`/kyc/submit`, data);
    return response.data;
  },

  updateKYCStatus: async (tenantId: string, status: 'APPROVED' | 'REJECTED' | 'INCOMPLETE' | 'UNDER_REVIEW', notes?: string): Promise<TenantInfo> => {
    const response = await api.put(`/kyc/${tenantId}/status`, { status, notes });
    return response.data;
  },

  getPendingKYC: async (): Promise<TenantInfo[]> => {
    const response = await api.get('/kyc/pending');
    return response.data;
  },

  getKYCStats: async (): Promise<any> => {
    const response = await api.get('/kyc/stats');
    return response.data;
  },

  getKYCDocuments: async (tenantId: string): Promise<any[]> => {
    const response = await api.get(`/kyc/${tenantId}/documents`);
    return response.data;
  },

  getKYCAuditLog: async (tenantId: string): Promise<any[]> => {
    const response = await api.get(`/kyc/${tenantId}/audit-log`);
    return response.data;
  },

  // User Management
  getTenantUsers: async (tenantId: string): Promise<any[]> => {
    const response = await api.get(`/users/tenant/${tenantId}`);
    return response.data.data;
  },

  getTenantUsersByRole: async (tenantId: string, role: string): Promise<any[]> => {
    const response = await api.get(`/users/tenant/${tenantId}/role/${role}`);
    return response.data.data;
  },

  createTenantUser: async (tenantId: string, data: any): Promise<any> => {
    const response = await api.post(`/users/tenant/${tenantId}/user`, data);
    return response.data;
  },

  updateTenantUser: async (userId: string, data: any): Promise<any> => {
    const response = await api.put(`/users/${userId}`, data);
    return response.data;
  },

  // Partner Billing & Credits
  getPartnerBillingSummary: async (tenantId: string, userId: string): Promise<any> => {
    const response = await api.get(`/tenant-dashboard/${tenantId}/partners/${userId}/billing-summary`);
    return response.data;
  },

  adjustPartnerCredits: async (tenantId: string, userId: string, data: { amount: number; reason: string; adminId: string }): Promise<any> => {
    const response = await api.post(`/tenant-dashboard/${tenantId}/partners/${userId}/credits/adjust`, data);
    return response.data;
  },

  getPartnerCreditHistory: async (tenantId: string, userId: string, params?: { limit?: number; offset?: number }): Promise<any> => {
    const response = await api.get(`/tenant-dashboard/${tenantId}/partners/${userId}/credits/history`, { params });
    return response.data;
  },

  updatePartnerSubscription: async (tenantId: string, userId: string, data: { planId: string; billingCycle: string }): Promise<any> => {
    const response = await api.post(`/tenant-dashboard/${tenantId}/partners/${userId}/subscription/update`, data);
    return response.data;
  },

  // Subscription Plans
  getSubscriptionPlans: async (): Promise<any> => {
    const response = await api.get('/subscriptions/plans');
    return response.data;
  },

  // Trip Management
  getActiveTrips: async (_tenantId: string): Promise<Trip[]> => {
    const response = await api.get('/trips/active');
    return response.data.data;
  },

  getTrips: async (params: { page?: number; limit?: number; status?: string; search?: string } = {}): Promise<{ data: Trip[]; pagination: any }> => {
    const response = await api.get('/trips', { params });
    return {
      data: response.data.data,
      pagination: response.data.pagination
    };
  },

  getTripById: async (tripId: string): Promise<Trip> => {
    const response = await api.get(`/trips/${tripId}`);
    return response.data.data;
  },

  getTripAnalyticsSummary: async (): Promise<TripAnalyticsSummary> => {
    const response = await api.get('/trips/analytics/summary');
    return response.data.data;
  },

  // Credit Management
  getCreditBalance: async (): Promise<CreditBalance> => {
    const response = await api.get('/credits/balance');
    return response.data.data;
  },

  // Bidding Management
  getTenantBids: async (tenantId: string, status?: string): Promise<Bid[]> => {
    // Determine status filter query
    const params: any = {};
    if (status && status !== 'all') {
      params.status = status;
    }

    // Check if we have a specific endpoint, otherwise fall back to a generic one or mock
    // For now, we'll try to hit a plausible endpoint
    try {
      const response = await api.get(`/tenant-dashboard/${tenantId}/bids`, { params });
      return response.data.data || [];
    } catch (error) {
      console.warn('Failed to fetch bids, using empty array or mock', error);
      return [];
    }
  },
};

// Mock data for development/testing
export const mockTenantData = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Default Tenant",
  status: "active",
  type: "fleet-operator",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-08-11T00:00:00Z",
  contactInfo: {
    email: "admin@defaulttenant.com",
    phone: "+1234567890",
    address: "123 Main St, City, Country"
  },
  subscription: {
    plan: "enterprise",
    status: "active",
    expiresAt: "2025-01-01T00:00:00Z"
  },
  metrics: {
    totalRevenue: 12500000,
    totalShipments: 1247,
    activeFleet: 23,
    onTimeDelivery: 94.2,
    customerSatisfaction: 4.6,
    fuelEfficiency: 8.7,
    averageLoadUtilization: 87.3,
    disputeRate: 2.1,
  },
  trends: {
    revenue: [1250000, 1890000, 1500000, 2500000, 2200000, 3000000, 2800000],
    shipments: [45, 67, 52, 89, 76, 98, 84],
    fleetUtilization: [78, 82, 75, 88, 91, 85, 87],
    fuelEfficiency: [8.2, 8.5, 8.1, 8.8, 8.9, 8.6, 8.7],
  },
  recentActivity: [
    { id: 1, type: 'shipment', action: 'completed', description: 'Load #L-2024-001 delivered successfully', timestamp: '2 hours ago', status: 'success' as const, metadata: { tripId: 'trip-101' } },
    { id: 2, type: 'maintenance', action: 'scheduled', description: 'Truck #T-001 maintenance scheduled', timestamp: '4 hours ago', status: 'info' as const },
    { id: 3, type: 'payment', action: 'received', description: 'Payment received for Load #L-2024-002', timestamp: '6 hours ago', status: 'success' as const, metadata: { tripId: 'trip-102' } },
    { id: 4, type: 'dispute', action: 'resolved', description: 'Dispute resolved for Load #L-2024-003', timestamp: '1 day ago', status: 'warning' as const },
  ],
  performanceMetrics: [
    {
      name: 'Revenue Growth',
      value: 12.5,
      unit: '%',
      target: 10.0,
      previous: 8.2,
      trend: 'up',
      category: 'revenue',
      status: 'excellent'
    },
    {
      name: 'Fleet Utilization',
      value: 87.3,
      unit: '%',
      target: 85.0,
      previous: 84.1,
      trend: 'up',
      category: 'efficiency',
      status: 'good'
    },
    {
      name: 'On-Time Delivery',
      value: 94.2,
      unit: '%',
      target: 95.0,
      previous: 93.8,
      trend: 'up',
      category: 'quality',
      status: 'good'
    },
    {
      name: 'Fuel Efficiency',
      value: 8.7,
      unit: 'km/L',
      target: 9.0,
      previous: 8.5,
      trend: 'up',
      category: 'efficiency',
      status: 'good'
    },
    {
      name: 'Customer Satisfaction',
      value: 4.6,
      unit: '/5',
      target: 4.5,
      previous: 4.4,
      trend: 'up',
      category: 'quality',
      status: 'excellent'
    },
    {
      name: 'Safety Score',
      value: 98.5,
      unit: '%',
      target: 99.0,
      previous: 98.2,
      trend: 'up',
      category: 'safety',
      status: 'good'
    },
    {
      name: 'Load Optimization',
      value: 92.1,
      unit: '%',
      target: 90.0,
      previous: 89.5,
      trend: 'up',
      category: 'efficiency',
      status: 'excellent'
    },
    {
      name: 'Dispute Rate',
      value: 2.1,
      unit: '%',
      target: 2.0,
      previous: 2.3,
      trend: 'down',
      category: 'quality',
      status: 'good'
    }
  ],
  financialMetrics: {
    totalRevenue: 12500000,
    totalTransactions: 1247,
    pendingAmount: 45000,
    escrowBalance: 125000,
    platformFees: 375000,
    averageTransactionValue: 10032,
    dailyRevenue: [180000, 220000, 195000, 250000, 280000, 320000, 305000],
    monthlyGrowth: 12.5
  },
  lowCreditPartners: [
    {
      id: "cp-001",
      currentBalance: 240,
      subscriptionCredits: 150,
      purchasedCredits: 50,
      bonusCredits: 40,
      lifetimeEarned: 15000,
      lifetimeSpent: 14760,
      lastRefreshDate: "2024-08-01T10:00:00Z",
      nextRefreshDate: "2024-09-01T10:00:00Z",
      user: {
        id: "user-001",
        email: "operations@rapidlogistics.com",
        profile: {
          firstName: "John",
          lastName: "Doe",
          companyName: "Rapid Logistics Ltd",
          avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=John"
        }
      },
      recentTransactions: [
        { id: "tx-001", type: "CONSUMPTION", amount: -450, description: "Bulk SMS Broadcast", createdAt: "2024-08-10T14:30:00Z", balanceAfter: 240 },
        { id: "tx-002", type: "PURCHASE", amount: 500, description: "Credit Top-up", createdAt: "2024-08-05T09:15:00Z", balanceAfter: 690 },
        { id: "tx-003", type: "CONSUMPTION", amount: -200, description: "Load Marketplace Fee", createdAt: "2024-08-01T11:00:00Z", balanceAfter: 190 }
      ]
    },
    {
      id: "cp-002",
      currentBalance: 1200,
      subscriptionCredits: 500,
      purchasedCredits: 600,
      bonusCredits: 100,
      lifetimeEarned: 25000,
      lifetimeSpent: 23800,
      lastRefreshDate: "2024-08-05T09:30:00Z",
      nextRefreshDate: "2024-09-05T09:30:00Z",
      user: {
        id: "user-002",
        email: "sam@eahaulers.com",
        profile: {
          firstName: "Samuel",
          lastName: "Onyango",
          companyName: "East Africa Haulers",
          avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Samuel"
        }
      },
      recentTransactions: [
        { id: "tx-101", type: "SUBSCRIPTION_GRANT", amount: 1000, description: "Monthly Plan Refresh", createdAt: "2024-08-05T08:00:00Z", balanceAfter: 1200 },
        { id: "tx-102", type: "CONSUMPTION", amount: -800, description: "Route Optimization usage", createdAt: "2024-08-04T16:45:00Z", balanceAfter: 200 }
      ]
    },
    {
      id: "cp-003",
      currentBalance: 4500,
      subscriptionCredits: 3000,
      purchasedCredits: 1000,
      bonusCredits: 500,
      lifetimeEarned: 80000,
      lifetimeSpent: 75500,
      lastRefreshDate: "2024-07-20T14:15:00Z",
      nextRefreshDate: "2024-08-20T14:15:00Z",
      user: {
        id: "user-003",
        email: "mary@mbroadmovers.com",
        profile: {
          firstName: "Mary",
          lastName: "Wanjiku",
          companyName: "Mombasa Road Movers",
          avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mary"
        }
      },
      recentTransactions: [
        { id: "tx-201", type: "CONSUMPTION", amount: -1500, description: "API Integration License", createdAt: "2024-08-08T12:00:00Z", balanceAfter: 4500 },
        { id: "tx-202", type: "PURCHASE", amount: 5000, description: "Volume Top-up", createdAt: "2024-08-02T10:00:00Z", balanceAfter: 6000 }
      ]
    }
  ]
};
