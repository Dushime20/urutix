import api from './api';

// Re-export cargoOwnerAPI and its types
export { cargoOwnerAPI, type MatchedTruck } from './cargoOwnerAPI';

export interface CargoSummary {
  totalCargoOwners: number;
  activeCargoOwners: number;
  totalLoads: number;
  activeLoads: number;
  completedLoads: number;
  pendingLoads: number;
  totalRevenue: number;
  averageDeliveryTime: number;
}

export interface CargoOwner {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  status: string;
  totalLoads: number;
  activeLoads: number;
  completedLoads: number;
  totalRevenue: number;
  averageRating: number;
  joinedDate: string;
}

export interface Load {
  id: string;
  loadNumber: string;
  cargoType: string;
  origin: string;
  destination: string;
  status: string;
  weight: number;
  distance: number;
  dimensions?: string;
  quantity?: string;
  description?: string;
  owner: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    companyName: string | null;
  };
  assignedTruck: {
    id: string;
    plateNumber: string;
    make?: string;
    model?: string;
  } | null;
  assignedDriver: {
    id: string;
    name: string;
    phone?: string;
  } | null;
  pickupDate: string | null;
  deliveryDate: string | null;
  revenue: number;
  rating: number | null;
  isOwnCargo: boolean;
  isOwnFleet: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const cargoApi = {
  getCargoSummary: async (tenantId: string): Promise<CargoSummary> => {
    const response = await api.get(`/cargo/${tenantId}/summary`);
    return response.data.data;
  },

  getCargoOwners: async (
    tenantId: string,
    filters?: {
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ cargoOwners: CargoOwner[]; total: number }> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/cargo/${tenantId}/cargo-owners?${params.toString()}`);
    return response.data.data;
  },

  getLoads: async (
    tenantId: string,
    filters?: {
      ownerId?: string;
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
      loadType?: 'all' | 'own-cargo' | 'own-fleet';
    }
  ): Promise<{ loads: Load[]; total: number }> => {
    const params = new URLSearchParams();
    if (filters?.ownerId) params.append('ownerId', filters.ownerId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.loadType) params.append('loadType', filters.loadType);

    const response = await api.get(`/cargo/${tenantId}/loads?${params.toString()}`);
    return response.data.data;
  },

  getCargoOwnerById: async (tenantId: string, ownerId: string): Promise<CargoOwner> => {
    const response = await api.get(`/cargo/${tenantId}/cargo-owners/${ownerId}`);
    return response.data.data;
  },

  getLoadById: async (tenantId: string, loadId: string): Promise<Load> => {
    const response = await api.get(`/cargo/${tenantId}/loads/${loadId}`);
    return response.data.data;
  },
};

// Backward compatibility helper
export const fetchCargos = async (page: number = 1, search: string = '', filters: any = {}) => {
  const tenantId = localStorage.getItem('tenantId') || '';
  const result = await cargoApi.getLoads(tenantId, {
    page,
    search,
    limit: filters.limit || 20,
    ...filters,
  });
  
  // Return in the old format for compatibility
  return {
    items: result.loads,
    total: result.total,
    page,
    limit: filters.limit || 20,
  };
};

// Placeholder for convertBasicCargoToEnhanced (if needed)
export const convertBasicCargoToEnhanced = (cargo: any) => {
  return cargo; // Simple passthrough for now
};

// Export cargos to file
export const exportCargos = async (format: 'csv' | 'excel' = 'csv') => {
  const tenantId = localStorage.getItem('tenantId') || '';
  const response = await api.get(`/cargo/${tenantId}/export?format=${format}`, {
    responseType: 'blob',
  });
  return response.data;
};

// Subscribe to cargo updates (WebSocket or polling)
export const subscribeCargoUpdates = (callback: (data: any) => void) => {
  // Placeholder for real-time updates implementation
  // This would typically use WebSocket or Server-Sent Events
  return () => {
    // Cleanup function
  };
};

// Create new cargo
export const createCargo = async (cargoData: any) => {
  const tenantId = localStorage.getItem('tenantId') || '';
  const response = await api.post(`/cargo/${tenantId}/loads`, cargoData);
  return response.data.data;
};

// Update existing cargo
export const updateCargo = async (cargoId: string, cargoData: any) => {
  const tenantId = localStorage.getItem('tenantId') || '';
  const response = await api.put(`/cargo/${tenantId}/loads/${cargoId}`, cargoData);
  return response.data.data;
};

// Delete cargo
export const deleteCargo = async (cargoId: string) => {
  const tenantId = localStorage.getItem('tenantId') || '';
  const response = await api.delete(`/cargo/${tenantId}/loads/${cargoId}`);
  return response.data;
};

// Publish cargo (make it available to brokers/carriers)
export const publishCargo = async (cargoId: string) => {
  const tenantId = localStorage.getItem('tenantId') || '';
  const response = await api.post(`/cargo/${tenantId}/loads/${cargoId}/publish`);
  return response.data.data;
};
