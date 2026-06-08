import api from './api';

export const customsApi = {
  getDashboardStats: () => api.get('/customs/dashboard/stats'),
  getAnalytics: (days?: number) => api.get('/customs/analytics', { params: { days } }),

  searchTruck: (params: {
    plateNumber?: string;
    shipmentReference?: string;
    containerNumber?: string;
    driverId?: string;
    driverName?: string;
    tripId?: string;
  }) => api.get('/customs/search', { params }),

  getInspections: (params?: {
    status?: string;
    riskLevel?: string;
    limit?: number;
    offset?: number;
    search?: string;
  }) => api.get('/customs/inspections', { params }),

  getInspectionById: (id: string) => api.get(`/customs/inspections/${id}`),

  createInspection: (data: any) => api.post('/customs/inspections', data),

  updateInspectionStatus: (id: string, data: {
    status: string;
    rejectionReason?: string;
    inspectionNotes?: string;
    riskLevel?: string;
    documentsVerified?: Record<string, boolean>;
    evidenceUrls?: string[];
  }) => api.patch(`/customs/inspections/${id}/status`, data),

  flagInspection: (id: string, riskLevel: string, notes?: string) =>
    api.patch(`/customs/inspections/${id}/flag`, { riskLevel, notes }),

  getCheckpoints: () => api.get('/customs/checkpoints'),
  createCheckpoint: (data: any) => api.post('/customs/checkpoints', data),

  getMyInspections: () => api.get('/customs/my-inspections'),

  // ─── Compliance Responses ───────────────────────────────────────────────────

  /** Cargo owner submits notes + document IDs to resolve an ON_HOLD inspection */
  submitComplianceResponse: (inspectionId: string, data: {
    notes: string;
    documentIds?: string[];
  }) => api.post(`/customs/inspections/${inspectionId}/compliance-response`, data),

  /** Get all compliance responses for an inspection (officer + cargo owner) */
  getComplianceResponses: (inspectionId: string) =>
    api.get(`/customs/inspections/${inspectionId}/compliance-responses`),

  /** Officer accepts or rejects a compliance response */
  reviewComplianceResponse: (inspectionId: string, responseId: string, data: {
    status: 'ACCEPTED' | 'REJECTED';
    reviewNotes?: string;
  }) => api.patch(
    `/customs/inspections/${inspectionId}/compliance-response/${responseId}/review`,
    data,
  ),
};
