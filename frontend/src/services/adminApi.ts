import api from './api';

export interface AdminStats {
  totalUsers: number;
  activeTrucks: number;
  totalLoads: number;
  revenue: number;
  userGrowth?: number;
  truckGrowth?: number;
  loadGrowth?: number;
  revenueGrowth?: number;
}

export interface AdminKPI {
  users: number;
  activeTrips: number;
  revenue: number;
  engagement: number;
  alerts: number;
}

export interface AdminAnalytics {
  recentTrips: any[];
  recentPayments: any[];
}

export interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  tenantId: string;
  createdAt: string;
  isActive: boolean;
  profile?: any;
}

export interface AdminTruck {
  id: string;
  licensePlate: string;
  make?: string;
  model?: string;
  year?: number;
  status: string;
  isActive: boolean;
  tenantId: string;
  tenantName: string;
  ownerName: string;
  ownerEmail?: string;
  currentDriverName?: string;
  currentDriverId?: string;
  currentDriverPhone?: string;
  currentLocationString?: string;
  coordinates?: { latitude: number; longitude: number };
  createdAt: string;
  assignedDrivers?: Array<{
    driverId: string;
    driverName: string;
    status: string;
    assignmentDate: string;
    notes?: string;
  }>;
}

export interface AdminLoad {
  id: string;
  title: string;
  description?: string;
  origin: any; // may be string or {lat, lng, city, address, country}
  destination: any;
  status: string;
  weight?: number;
  value?: number;
  loadValue?: number;
  offeredPrice?: number;
  currencyCode?: string;
  cargoType?: string;
  loadType?: string;
  equipmentType?: string;
  urgencyLevel?: string;
  packagingType?: string;
  numberOfPieces?: number;
  numberOfPallets?: number;
  isHazardous?: boolean;
  isFragile?: boolean;
  requiresRefrigeration?: boolean;
  pickupDate?: string;
  deliveryDate?: string;
  paymentTerms?: string;
  tenantId: string;
  tenantName?: string;
  cargoOwnerId?: string;
  cargoOwnerName?: string;
  cargoOwnerEmail?: string;
  assignedTruckId?: string;
  truckPlate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminTrip {
  id: string;
  origin: string;
  destination: string;
  status: string;
  tenantId: string;
  createdAt: string;
  startDate?: string;
  endDate?: string;
}

export interface AdminTenant {
  id: string;
  name: string;
  subdomain: string;
  domain: string;
  status: string;
  type: string;
  contactEmail: string;
  subscriptionPlan: string;
  createdAt: string;
  isActive: boolean;
}

export interface AdminRoute {
  id: string;
  name: string;
  origin: string;
  destination: string;
  status: string;
  tenantId: string;
  createdAt: string;
}

export interface AdminFinancials {
  totalRevenue: number;
  revenueBreakdown?: Record<string, number>;
  error?: string;
}

export interface AdminHealth {
  status: string;
  uptime: number;
}

export interface AdminDispute {
  id: string;
  title: string;
  status: string;
  tenantId: string;
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  action: string;
  userId: string;
  tenantId: string;
  createdAt: string;
  details?: any;
}

// Admin API service
export const adminAPI = {
  // Dashboard stats and KPIs
  getKPI: (tenantId?: string) => 
    api.get<{ data: AdminKPI }>('/admin/kpi', { params: tenantId ? { tenantId } : {} }),
  
  getAnalytics: (tenantId?: string) => 
    api.get<{ data: AdminAnalytics }>('/admin/analytics', { params: tenantId ? { tenantId } : {} }),
  
  getFinancials: (tenantId?: string) => 
    api.get<{ data: AdminFinancials }>('/admin/financials', { params: tenantId ? { tenantId } : {} }),
  
  getHealth: () => 
    api.get<{ data: AdminHealth }>('/admin/health'),

  getEscrow: (tenantId?: string) =>
    api.get<any>('/admin/escrow', { params: tenantId ? { tenantId } : {} }),

  getAnalyticsOverview: (tenantId?: string) =>
    api.get<any>('/admin/analytics/overview', { params: tenantId ? { tenantId } : {} }),

  getCargoAnalytics: (tenantId?: string) =>
    api.get<any>('/admin/analytics/cargo', { params: tenantId ? { tenantId } : {} }),

  getFleetAnalytics: (tenantId?: string) =>
    api.get<any>('/admin/analytics/fleet', { params: tenantId ? { tenantId } : {} }),

  getSystemVitals: () =>
    api.get<any>('/admin/analytics/system'),

  // Entity listings
  getAllUsers: (tenantId?: string) => 
    api.get<{ users: AdminUser[] }>('/admin/all/users', { params: tenantId ? { tenantId } : {} }),
  
  getAllTrucks: (tenantId?: string) => 
    api.get<{ trucks: AdminTruck[] }>('/admin/all/trucks', { params: tenantId ? { tenantId } : {} }),
  
  getAllLoads: (tenantId?: string) => 
    api.get<{ loads: AdminLoad[] }>('/admin/all/loads', { params: tenantId ? { tenantId } : {} }),

  deleteLoad: (loadId: string) =>
    api.delete(`/loads/${loadId}`),
  
  getAllTrips: (tenantId?: string) => 
    api.get<{ trips: AdminTrip[] }>('/admin/all/trips', { params: tenantId ? { tenantId } : {} }),
  
  getTenants: () => 
    api.get<{ tenants: AdminTenant[] }>('/admin/tenants'),
  
  getRoutes: (filters?: { tenantId?: string; status?: string; search?: string }) => 
    api.get<{ routes: AdminRoute[] }>('/admin/routes', { params: filters }),

  // Audit and monitoring
  getDisputes: (tenantId?: string) => 
    api.get<{ disputes: AdminDispute[] }>('/admin/disputes', { params: tenantId ? { tenantId } : {} }),
  
  getAuditLogs: (tenantId?: string) => 
    api.get<{ logs: AdminAuditLog[] }>('/admin/audit', { params: tenantId ? { tenantId } : {} }),

  // Tenant management
  createTenant: (data: any) => 
    api.post('/admin/tenants', data),
  
  createRoute: (data: { tenantId: string; route: any }) => 
    api.post('/admin/routes', data),

  // Subscription management
  getAllSubscriptionPlans: () => 
    api.get('/admin/subscription-plans'),
  
  createSubscriptionPlan: (data: any) => 
    api.post('/admin/subscription-plans', data),
  
  updateSubscriptionPlan: (id: string, data: any) => 
    api.patch(`/admin/subscription-plans/${id}`, data),
  
  deleteSubscriptionPlan: (id: string) => 
    api.delete(`/admin/subscription-plans/${id}`),
  
  getAllSubscriptions: (filters?: { status?: string; plan?: string }) => 
    api.get('/admin/subscriptions', { params: filters }),
  
  getTenantSubscription: (tenantId: string) => 
    api.get(`/admin/tenants/${tenantId}/subscription`),
  
  cancelTenantSubscription: (subscriptionId: string, data: { reason?: string; immediate?: boolean }) => 
    api.post(`/admin/subscriptions/${subscriptionId}/cancel`, data),
  
  reactivateTenantSubscription: (subscriptionId: string) => 
    api.post(`/admin/subscriptions/${subscriptionId}/reactivate`),

  // Credit management
  addBonusCredits: (data: { tenantId: string; amount: number; reason: string; type?: string }) => 
    api.post('/admin/credits/add', data),
  
  getTenantCreditTransactions: (tenantId: string, filters?: any) => 
    api.get(`/admin/credits/transactions/${tenantId}`, { params: filters }),
  
  getAllCreditTransactions: (filters?: any) => 
    api.get('/admin/credits/transactions', { params: filters }),
};

export default adminAPI;

// Named exports for direct imports (used by AdminUsers.tsx and other pages)
export const fetchAllUsers = (tenantId?: string) =>
  api.get<any>('/admin/all/users', { params: tenantId ? { tenantId } : {} })
    .then(res => res.data?.users ?? res.data ?? []);

export const fetchTenants = () =>
  api.get<any>('/admin/tenants')
    .then(res => res.data);

export const createTenantUser = (tenantId: string, data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  phoneNumber?: string;
  companyName?: string;
}) =>
  api.post<any>(`/users/tenant/${tenantId}/user`, data)
    .then(res => res.data);

export const updateUser = (userId: string, data: {
  email?: string;
  tenantId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  companyName?: string;
  role?: string;
  status?: string;
}) =>
  api.patch<any>(`/admin/users/${userId}`, data)
    .then(res => res.data);

export const deleteUser = (userId: string) =>
  api.delete<any>(`/admin/users/${userId}`)
    .then(res => res.data);

export const activateUser = (userId: string) =>
  api.patch<any>(`/admin/users/${userId}/activate`)
    .then(res => res.data);

export const suspendUser = (userId: string, reason?: string) =>
  api.patch<any>(`/admin/users/${userId}/suspend`, reason ? { reason } : {})
    .then(res => res.data);
// Tenant activation/suspension functions
export const activateTenant = (tenantId: string) =>
  api.patch<any>(`/admin/tenants/${tenantId}/activate`)
    .then(res => res.data);

export const suspendTenant = (tenantId: string, reason?: string) =>
  api.patch<any>(`/admin/tenants/${tenantId}/suspend`, reason ? { reason } : {})
    .then(res => res.data);

export const deactivateTenant = (tenantId: string) =>
  api.delete<any>(`/admin/tenants/${tenantId}`)
    .then(res => res.data);

// Additional missing functions for compatibility
export const fetchAllTrips = (tenantId?: string) =>
  api.get<any>('/admin/all/trips', { params: tenantId ? { tenantId } : {} })
    .then(res => res.data?.trips ?? res.data ?? []);

export const fetchUsers = (tenantId?: string) =>
  api.get<any>('/admin/all/users', { params: tenantId ? { tenantId } : {} })
    .then(res => res.data?.users ?? res.data ?? []);

export const fetchKPI = (tenantId?: string) =>
  api.get<any>('/admin/kpi', { params: tenantId ? { tenantId } : {} })
    .then(res => res.data);

export const fetchHealth = () =>
  api.get<any>('/admin/health')
    .then(res => res.data);

export const fetchFinancials = (tenantId?: string) =>
  api.get<any>('/admin/financials', { params: tenantId ? { tenantId } : {} })
    .then(res => res.data);

export const fetchDisputes = (tenantId?: string) =>
  api.get<any>('/admin/disputes', { params: tenantId ? { tenantId } : {} })
    .then(res => res.data?.disputes ?? res.data ?? []);

export const fetchAuditLogs = (tenantId?: string) =>
  api.get<any>('/admin/audit', { params: tenantId ? { tenantId } : {} })
    .then(res => res.data?.logs ?? res.data ?? []);

export const fetchAnalytics = (tenantId?: string) =>
  api.get<any>('/admin/analytics', { params: tenantId ? { tenantId } : {} })
    .then(res => res.data);

export const fetchAdminRoutes = (filters?: { tenantId?: string; status?: string; search?: string }) =>
  api.get<any>('/admin/routes', { params: filters })
    .then(res => res.data?.routes ?? res.data ?? []);

export const fetchRouteAnalytics = () =>
  api.get<any>('/admin/routes/analytics')
    .then(res => res.data);

export const bulkUpdateRouteStatus = (routeIds: string[], status: string) =>
  api.patch<any>('/admin/routes/bulk-update', { routeIds, status })
    .then(res => res.data);

export const fetchEnrichedTenants = (filters?: any) =>
  api.get<any>('/admin/tenants', { params: filters })
    .then(res => res.data?.tenants ?? res.data ?? []);

export const getTenantById = (tenantId: string) =>
  api.get<any>(`/admin/tenants/${tenantId}`)
    .then(res => res.data);

export const updateTenant = (tenantId: string, data: any) =>
  api.put<any>(`/admin/tenants/${tenantId}`, data)
    .then(res => res.data);

export const deleteTenant = (tenantId: string, reason?: string) =>
  api.delete<any>(`/admin/tenant-management/${tenantId}`, { data: { reason } })
    .then(res => res.data);

export const createTenant = (data: any) =>
  api.post<any>('/admin/tenants', data)
    .then(res => res.data);

export const createTenantRoute = (tenantId: string, routeData: any) =>
  api.post<any>('/admin/routes', { tenantId, route: routeData })
    .then(res => res.data);

export const updateTenantRoute = (routeId: string, data: any) =>
  api.patch<any>(`/admin/routes/${routeId}`, data)
    .then(res => res.data);

export const deleteTenantRoute = (routeId: string) =>
  api.delete<any>(`/admin/routes/${routeId}`)
    .then(res => res.data);


// Trip management
export const updateTripStatus = (tripId: string, status: string, reason?: string) =>
  api.patch<any>(`/admin/trips/${tripId}/status`, { status, reason })
    .then(res => res.data);

export const cancelTrip = (tripId: string, reason: string) =>
  api.patch<any>(`/admin/trips/${tripId}/cancel`, { reason })
    .then(res => res.data);

export const assignTripDriver = (tripId: string, driverId: string) =>
  api.patch<any>(`/admin/trips/${tripId}/assign-driver`, { driverId })
    .then(res => res.data);
