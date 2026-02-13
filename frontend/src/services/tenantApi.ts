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

export interface OperationalMetrics {
  onTimePerformance: number;
  averageTransitTime: number;
  damageRate: number;
  customerComplaints: number;
  driverSafetyScore: number;
  routeEfficiency: number;
}

// Tenant Dashboard API calls
export const tenantApi = {
  // Get tenant information
  getTenantInfo: async (tenantId: string): Promise<TenantInfo> => {
    const response = await api.get(`/tenants/${tenantId}`);
    return response.data;
  },

  // Get tenant metrics
  getTenantMetrics: async (tenantId: string, timeRange: string = '7d'): Promise<TenantMetrics> => {
    const response = await api.get(`/tenant-dashboard/${tenantId}/metrics`, {
      params: { timeRange }
    });
    return response.data;
  },

  // Get tenant trends
  getTenantTrends: async (tenantId: string, timeRange: string = '7d'): Promise<TenantTrends> => {
    const response = await api.get(`/tenant-dashboard/${tenantId}/trends`, {
      params: { timeRange }
    });
    return response.data;
  },

  // Get recent activity
  getRecentActivity: async (tenantId: string, limit: number = 10): Promise<TenantActivity[]> => {
    const response = await api.get(`/tenant-dashboard/${tenantId}/activity`, {
      params: { limit }
    });
    return response.data;
  },

  // Get performance metrics
  getPerformanceMetrics: async (tenantId: string): Promise<PerformanceMetric[]> => {
    const response = await api.get(`/tenants/${tenantId}/performance`);
    return response.data;
  },

  // Get financial metrics
  getFinancialMetrics: async (tenantId: string, timeRange: string = '7d'): Promise<FinancialMetrics> => {
    const response = await api.get(`/tenants/${tenantId}/financial`, {
      params: { timeRange }
    });
    return response.data;
  },

  // Get fleet metrics
  getFleetMetrics: async (tenantId: string): Promise<FleetMetrics> => {
    const response = await api.get(`/tenants/${tenantId}/fleet`);
    return response.data;
  },

  // Get cargo metrics
  getCargoMetrics: async (tenantId: string, timeRange: string = '7d'): Promise<CargoMetrics> => {
    const response = await api.get(`/tenants/${tenantId}/cargo`, {
      params: { timeRange }
    });
    return response.data;
  },

  // Get operational metrics
  getOperationalMetrics: async (tenantId: string): Promise<OperationalMetrics> => {
    const response = await api.get(`/tenants/${tenantId}/operations`);
    return response.data;
  },

  // Update tenant settings
  updateTenantSettings: async (tenantId: string, settings: Partial<TenantInfo>): Promise<TenantInfo> => {
    const response = await api.put(`/tenants/${tenantId}/settings`, settings);
    return response.data;
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
  }
};

// Mock data for development/testing
export const mockTenantData: {
  id: string;
  name: string;
  status: string;
  type: string;
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
  metrics: TenantMetrics;
  trends: TenantTrends;
  recentActivity: TenantActivity[];
  performanceMetrics: PerformanceMetric[];
  financialMetrics: FinancialMetrics;
} = {
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
    { id: 1, type: 'shipment' as const, action: 'completed', description: 'Load #L-2024-001 delivered successfully', timestamp: '2 hours ago', status: 'success' as const },
    { id: 2, type: 'maintenance' as const, action: 'scheduled', description: 'Truck #T-001 maintenance scheduled', timestamp: '4 hours ago', status: 'info' as const },
    { id: 3, type: 'payment' as const, action: 'received', description: 'Payment received for Load #L-2024-002', timestamp: '6 hours ago', status: 'success' as const },
    { id: 4, type: 'dispute' as const, action: 'resolved', description: 'Dispute resolved for Load #L-2024-003', timestamp: '1 day ago', status: 'warning' as const },
  ] as TenantActivity[],
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
  }
};
