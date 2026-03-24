import api from './api';

export type InspectionType = 'pre_trip' | 'post_trip' | 'weekly' | 'monthly' | 'annual' | 'random' | 'cargo';

export const InspectionTypes = {
  PRE_TRIP: 'pre_trip' as InspectionType,
  POST_TRIP: 'post_trip' as InspectionType,
  WEEKLY: 'weekly' as InspectionType,
  MONTHLY: 'monthly' as InspectionType,
  ANNUAL: 'annual' as InspectionType,
  RANDOM: 'random' as InspectionType,
  CARGO: 'cargo' as InspectionType,
};

export type InspectionStatus = 'passed' | 'failed' | 'conditional';

export const InspectionStatuses = {
  PASSED: 'passed' as InspectionStatus,
  FAILED: 'failed' as InspectionStatus,
  CONDITIONAL: 'conditional' as InspectionStatus,
};

export interface InspectionItem {
  id: string;
  category: string;
  item: string;
  status: string;
  notes?: string;
}

export interface CreateSafetyInspectionDto {
  type: InspectionType;
  inspector: string;
  inspectionDate: string;
  truckId?: string;
  truckPlate?: string;
  driverId?: string;
  driverName?: string;
  status: InspectionStatus;
  score?: number;
  maxScore?: number;
  items?: InspectionItem[];
  notes?: string;
}

export const safetyApi = {
  createInspection: async (data: CreateSafetyInspectionDto) => {
    return api.post('/safety/inspections', data);
  },
  getInspections: async (params?: { truckId?: string; status?: string; type?: string }) => {
    return api.get('/safety/inspections', { params });
  },
  getInspection: async (id: string) => {
    return api.get(`/safety/inspections/${id}`);
  },
  getCargoInspections: async () => {
    // We get cargo inspections from the assigned-loads endpoint which includes metadata
    return api.get('/loads-v2/assigned-loads');
  },

  // Incident operations
  getIncidents: async (params?: any) => {
    return api.get('/safety/incidents', { params });
  },
  getIncident: async (id: string) => {
    return api.get(`/safety/incidents/${id}`);
  },
  updateIncident: async (id: string, data: any) => {
    return api.put(`/safety/incidents/${id}`, data);
  },
  deleteIncident: async (id: string) => {
    return api.delete(`/safety/incidents/${id}`);
  }
};

export default safetyApi;
