import api from './api';

// KPI metrics
export const fetchKPI = async () => {
  const res = await api.get('/admin/kpi');
  return res.data;
};

// Real-time analytics
export const fetchAnalytics = async () => {
  const res = await api.get('/admin/analytics');
  return res.data;
};

// User management
export const fetchUsers = async () => {
  const res = await api.get('/admin/users');
  return res.data;
};

// Financial reporting
export const fetchFinancials = async () => {
  const res = await api.get('/admin/financials');
  return res.data;
};

// System health
export const fetchHealth = async () => {
  const res = await api.get('/admin/health');
  return res.data;
};

// Dispute resolution
export const fetchDisputes = async () => {
  const res = await api.get('/admin/disputes');
  return res.data;
};

// Audit logs
export const fetchAuditLogs = async () => {
  const res = await api.get('/admin/audit');
  return res.data;
};

// Tenants
export const fetchTenants = async () => {
  const res = await api.get('/admin/tenants');
  return res.data;
};

// Admin-wide listings
export const fetchAllTrucks = async (tenantId?: string) => {
  const res = await api.get('/admin/all/trucks', { params: tenantId ? { tenantId } : {} });
  return res.data.trucks || []; // Extract trucks array from response
};

export const fetchAllLoads = async (tenantId?: string) => {
  const res = await api.get('/admin/all/loads', { params: tenantId ? { tenantId } : {} });
  return res.data.loads || []; // Extract loads array from response
};

export const fetchAllTrips = async (tenantId?: string) => {
  const res = await api.get('/admin/all/trips', { params: tenantId ? { tenantId } : {} });
  return res.data.trips || []; // Extract trips array from response
};

export const fetchAllUsers = async (tenantId?: string) => {
  const res = await api.get('/admin/all/users', { params: tenantId ? { tenantId } : {} });
  return res.data.users || []; // Extract users array from response
};

// Create tenant
export const createTenant = async (payload: any) => {
  const res = await api.post('/admin/tenants', payload);
  return res.data;
};

// Create route for tenant
export const createTenantRoute = async (tenantId: string, route: any) => {
  try {
    // Backend expects a nested object: { tenantId, route: { ... } }
    const payload = {
      tenantId,
      route: {
        name: route.name,
        origin: route.origin,
        destination: route.destination,
        distance: Number(route.distance),
        estimatedTime: Number(route.estimatedTime),
        status: route.status || 'active',
        routeType: route.routeType || 'highway',
        priority: route.priority || 'medium',
        trafficLevel: route.trafficLevel || 'moderate',
        tollCost: route.tollCost ?? null,
        fuelCost: route.fuelCost ?? null,
        description: route.description ?? null,
      },
    };
    console.log('🛣️ Creating tenant route with payload:', payload);
    const res = await api.post('/admin/routes', payload);
    return res.data;
  } catch (error: any) {
    console.error('Error creating tenant route:', {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
    });
    throw error;
  }
};

// ===== ROUTE MANAGEMENT APIs =====

// Fetch all admin routes with optional filters
export const fetchAdminRoutes = async (filters?: {
  tenantId?: string;
  status?: string;
  priority?: string;
  routeType?: string;
  search?: string;
}) => {
  try {
    const params = new URLSearchParams();
    if (filters?.tenantId) params.append('tenantId', filters.tenantId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.routeType) params.append('routeType', filters.routeType);
    if (filters?.search) params.append('search', filters.search);

    const res = await api.get(`/admin/routes?${params.toString()}`);
    return res.data.routes || [];
  } catch (error) {
    console.error('Error fetching admin routes:', error);
    return [];
  }
};

// Get route by ID
export const getRouteById = async (routeId: string) => {
  try {
    const res = await api.get(`/admin/routes/${routeId}`);
    return res.data.route;
  } catch (error) {
    console.error('Error fetching route by ID:', error);
    throw error;
  }
};

// Update existing route
export const updateTenantRoute = async (routeId: string, updateData: any) => {
  try {
    const res = await api.patch(`/admin/routes/${routeId}`, updateData);
    return res.data;
  } catch (error) {
    console.error('Error updating route:', error);
    throw error;
  }
};

// Delete route
export const deleteTenantRoute = async (routeId: string) => {
  try {
    const res = await api.delete(`/admin/routes/${routeId}`);
    return res.data;
  } catch (error) {
    console.error('Error deleting route:', error);
    throw error;
  }
};

// Bulk operations for routes
export const bulkUpdateRouteStatus = async (routeIds: string[], status: string) => {
  try {
    const res = await api.patch('/admin/routes/bulk/status', {
      routeIds,
      status
    });
    return res.data;
  } catch (error) {
    console.error('Error bulk updating route status:', error);
    throw error;
  }
};

export const bulkDeleteRoutes = async (routeIds: string[]) => {
  try {
    const res = await api.delete('/admin/routes/bulk', {
      data: { routeIds }
    });
    return res.data;
  } catch (error) {
    console.error('Error bulk deleting routes:', error);
    throw error;
  }
};

// Route analytics and statistics
export const fetchRouteAnalytics = async (tenantId?: string) => {
  try {
    const params = tenantId ? { tenantId } : {};
    const res = await api.get('/admin/routes/analytics', { params });
    return res.data;
  } catch (error) {
    console.error('Error fetching route analytics:', error);
    return {
      totalRoutes: 0,
      activeRoutes: 0,
      totalDistance: 0,
      averageUtilization: 0,
      topRoutes: [],
      recentActivity: []
    };
  }
};

// Route performance metrics
export const fetchRoutePerformance = async (routeId: string, period: 'day' | 'week' | 'month' | 'year' = 'month') => {
  try {
    const res = await api.get(`/admin/routes/${routeId}/performance`, {
      params: { period }
    });
    return res.data;
  } catch (error) {
    console.error('Error fetching route performance:', error);
    return {
      utilization: 0,
      completedTrips: 0,
      averageTime: 0,
      revenue: 0,
      costs: 0,
      profit: 0
    };
  }
};