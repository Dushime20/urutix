import api from './api';

export const operationalAdminApi = {
  // Get KPI metrics
  getKpi: async () => {
    const response = await api.get('/admin/operational/kpi');
    return response.data.data || response.data;
  },

  // Get disputes
  getDisputes: async (params?: { status?: string; search?: string }) => {
    const response = await api.get('/admin/operational/disputes', { params });
    return response.data.data || response.data;
  },

  // Update dispute status
  updateDisputeStatus: async (id: string, data: { status: string; resolution?: string }) => {
    const response = await api.patch(`/admin/operational/disputes/${id}`, data);
    return response.data.data || response.data;
  },

  // Get trips
  getTrips: async (params?: { status?: string; search?: string }) => {
    const response = await api.get('/admin/operational/trips', { params });
    return response.data.data || response.data;
  },

  // Get loads
  getLoads: async (params?: { status?: string; search?: string }) => {
    const response = await api.get('/admin/operational/loads', { params });
    return response.data.data || response.data;
  },

  // Get users
  getUsers: async (params?: { role?: string; status?: string; search?: string }) => {
    const response = await api.get('/admin/operational/users', { params });
    return response.data.data || response.data;
  },

  // Get financial overview
  getFinancials: async () => {
    const response = await api.get('/admin/operational/financials');
    return response.data.data || response.data;
  },

  // Get analytics
  getAnalytics: async () => {
    const response = await api.get('/admin/operational/analytics');
    return response.data.data || response.data;
  },

  // Get analytics overview
  getAnalyticsOverview: async () => {
    const response = await api.get('/admin/operational/analytics/overview');
    return response.data.data || response.data;
  },

  // Get cargo analytics
  getCargoAnalytics: async () => {
    const response = await api.get('/admin/operational/analytics/cargo');
    return response.data.data || response.data;
  },

  // Get fleet analytics
  getFleetAnalytics: async () => {
    const response = await api.get('/admin/operational/analytics/fleet');
    return response.data.data || response.data;
  },

  // Get audit logs
  getAudit: async (params?: { entityType?: string; action?: string; from?: string; to?: string }) => {
    const response = await api.get('/admin/operational/audit', { params });
    return response.data.data || response.data;
  },

  // Get system health
  getHealth: async () => {
    const response = await api.get('/admin/operational/health');
    return response.data.data || response.data;
  },

  // Bidding endpoints
  getBids: async (params?: { status?: string; search?: string }) => {
    const response = await api.get('/admin/operational/bids', { params });
    return response.data.data || response.data;
  },

  getAuctions: async (params?: { status?: string }) => {
    const response = await api.get('/admin/operational/auctions', { params });
    return response.data.data || response.data;
  },

  getBiddingStats: async () => {
    const response = await api.get('/admin/operational/bidding/stats');
    return response.data.data || response.data;
  },

  getBidsHistory: async (params?: { limit?: number; offset?: number }) => {
    const response = await api.get('/admin/operational/bids/history', { params });
    return response.data.data || response.data;
  },

  // Activity logs — uses the dedicated endpoint scoped to ADMIN + TENANT_ADMIN
  getActivityLogs: async (params?: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/admin/activity-logs', { params });
    return response.data.data || response.data;
  },

  getActivityStats: async (days?: number) => {
    const response = await api.get('/admin/activity-logs/stats/summary', {
      params: { days },
    });
    return response.data.data || response.data;
  },

  // Dashboard chart data — all charts scoped to the admin's tenant
  getDashboardCharts: async (days: 7 | 30 = 7) => {
    const response = await api.get('/admin/operational/dashboard/charts', {
      params: { days },
    });
    return response.data.data || response.data;
  },
};
