/**
 * API service for all Sprint 1-3 new features
 */
import api from './api';

// ─── Load Templates ───────────────────────────────────────────────────────────

export const loadTemplatesApi = {
  list: () => api.get('/loads/templates').then(r => r.data),
  get: (id: string) => api.get(`/loads/templates/${id}`).then(r => r.data),
  create: (data: { name: string; description?: string; templateData: Record<string, any> }) =>
    api.post('/loads/templates', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/loads/templates/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/loads/templates/${id}`),
  createLoad: (id: string, overrides?: Record<string, any>) =>
    api.post(`/loads/templates/${id}/create-load`, { overrides }).then(r => r.data),
  setSchedule: (id: string, schedule: { frequency: string; startDate: string; endDate?: string; dayOfWeek?: number; dayOfMonth?: number }) =>
    api.post(`/loads/templates/${id}/schedule`, schedule).then(r => r.data),
  getScheduled: (id: string) => api.get(`/loads/templates/${id}/scheduled`).then(r => r.data),
};

// ─── 2FA ─────────────────────────────────────────────────────────────────────

export const twoFactorApi = {
  setup: () => api.post('/auth/2fa/setup').then(r => r.data),
  verifySetup: (token: string) => api.post('/auth/2fa/verify-setup', { token }).then(r => r.data),
  disable: (token: string) => api.post('/auth/2fa/disable', { token }).then(r => r.data),
  validate: (userId: string, token: string) => api.post('/auth/2fa/validate', { userId, token }).then(r => r.data),
  backup: (userId: string, code: string) => api.post('/auth/2fa/backup', { userId, code }).then(r => r.data),
};

// ─── Compliance ───────────────────────────────────────────────────────────────

export const complianceApi = {
  getDashboard: () => api.get('/compliance/dashboard').then(r => r.data),
  getDriverStatus: (id: string) => api.get(`/compliance/driver/${id}`).then(r => r.data),
  getTruckStatus: (id: string) => api.get(`/compliance/truck/${id}`).then(r => r.data),
};

// ─── Revenue ─────────────────────────────────────────────────────────────────

export const revenueApi = {
  getSummary: (from?: string, to?: string) =>
    api.get('/revenue/summary', { params: { from, to } }).then(r => r.data),
  getTenantRevenue: (tenantId: string, from?: string, to?: string) =>
    api.get(`/revenue/tenant/${tenantId}`, { params: { from, to } }).then(r => r.data),
  getMyTenantRevenue: () => api.get('/revenue/my-tenant').then(r => r.data),
};

// ─── Carrier Tiers ────────────────────────────────────────────────────────────

export const carrierTierApi = {
  getLeaderboard: () => api.get('/carrier-tiers/leaderboard').then(r => r.data),
  getMyTier: () => api.get('/carrier-tiers/my-tier').then(r => r.data),
  getOwnerTier: (ownerId: string) => api.get(`/carrier-tiers/owner/${ownerId}`).then(r => r.data),
};

// ─── Carrier Marketplace ──────────────────────────────────────────────────────

export const carrierMarketplaceApi = {
  browse: (filters?: { truckType?: string; minRating?: number; tier?: string; available?: boolean; page?: number; limit?: number }) =>
    api.get('/carrier-marketplace/carriers', { params: filters }).then(r => r.data),
  getFeatured: () => api.get('/carrier-marketplace/carriers/featured').then(r => r.data),
  getProfile: (id: string) => api.get(`/carrier-marketplace/carriers/${id}`).then(r => r.data),
  findBackhaul: (data: { returnOriginCity: string; returnDestinationCity: string; availableDate: string }) =>
    api.post('/carrier-marketplace/backhaul', data).then(r => r.data),
  getNetwork: () => api.get('/carrier-marketplace/network').then(r => r.data),
  inviteToNetwork: (truckOwnerId: string, notes?: string) =>
    api.post(`/carrier-marketplace/network/${truckOwnerId}`, { notes }).then(r => r.data),
  removeFromNetwork: (truckOwnerId: string) =>
    api.delete(`/carrier-marketplace/network/${truckOwnerId}`),
};

// ─── Emergency Rematch ────────────────────────────────────────────────────────

export const emergencyRematchApi = {
  trigger: (tripId: string) => api.post(`/matching/emergency/trip/${tripId}`).then(r => r.data),
  getStatus: (loadId: string) => api.get(`/matching/emergency/status/${loadId}`).then(r => r.data),
};

// ─── Geofencing ───────────────────────────────────────────────────────────────

export const geofencingApi = {
  list: () => api.get('/geofences').then(r => r.data),
  get: (id: string) => api.get(`/geofences/${id}`).then(r => r.data),
  create: (data: any) => api.post('/geofences', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/geofences/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/geofences/${id}`),
};

// ─── Bulk CSV ─────────────────────────────────────────────────────────────────

export const bulkCsvApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/loads/bulk-upload', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },
  downloadTemplate: () => `${api.defaults.baseURL}/loads/bulk-upload/template`,
};

// ─── Map View ─────────────────────────────────────────────────────────────────

export const mapViewApi = {
  getLoads: (lat: number, lng: number, radius: number, truckType?: string) =>
    api.get('/loads/map', { params: { lat, lng, radius, truckType } }).then(r => r.data),
};

// ─── API Marketplace & Webhooks ───────────────────────────────────────────────

export const apiMarketplaceApi = {
  // API Keys
  generateKey: (data: { name: string; permissions?: string[]; expiresAt?: string }) =>
    api.post('/api-marketplace/api-keys', data).then(r => r.data),
  listKeys: () => api.get('/api-marketplace/api-keys').then(r => r.data),
  revokeKey: (id: string) => api.delete(`/api-marketplace/api-keys/${id}`),
  // Webhooks
  getEvents: () => api.get('/api-marketplace/events').then(r => r.data),
  createWebhook: (data: { name: string; url: string; events: string[] }) =>
    api.post('/api-marketplace/webhooks', data).then(r => r.data),
  listWebhooks: () => api.get('/api-marketplace/webhooks').then(r => r.data),
  updateWebhook: (id: string, data: any) => api.put(`/api-marketplace/webhooks/${id}`, data).then(r => r.data),
  deleteWebhook: (id: string) => api.delete(`/api-marketplace/webhooks/${id}`),
  testWebhook: (id: string) => api.post(`/api-marketplace/webhooks/${id}/test`).then(r => r.data),
  getWebhookLogs: (id: string) => api.get(`/api-marketplace/webhooks/${id}/logs`).then(r => r.data),
};

// ─── Branding ─────────────────────────────────────────────────────────────────

export const brandingApi = {
  get: (tenantId: string) => api.get(`/tenants/${tenantId}/branding`).then(r => r.data),
  update: (tenantId: string, data: { logoUrl?: string; primaryColor?: string; secondaryColor?: string; fontFamily?: string; faviconUrl?: string; companyName?: string }) =>
    api.put(`/tenants/${tenantId}/branding`, data).then(r => r.data),
};
