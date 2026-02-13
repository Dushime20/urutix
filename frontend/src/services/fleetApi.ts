import api from './api';

export interface FleetSummary {
  totalTruckOwners: number;
  activeTruckOwners: number;
  totalTrucks: number;
  activeTrucks: number;
  maintenanceTrucks: number;
  inactiveTrucks: number;
  totalDrivers: number;
  activeDrivers: number;
}

export interface FleetUtilization {
  current: number;
  weekly: number[];
  monthly: number[];
}

export interface TruckOwner {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  status: string;
  totalTrucks: number;
  activeTrucks: number;
  totalTrips: number;
  completedTrips: number;
  totalRevenue: number;
  averageRating: number;
  joinedDate: string;
}

export interface Truck {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  truckType: string;
  status: string;
  capacity: number | null;
  dimensions: string | null;
  registrationNumber: string | null;
  insuranceStatus: string | null;
  owner: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    companyName: string | null;
  };
  driver: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    licenseNumber: string | null;
  } | null;
  location: string;
  utilization: number;
  lastMaintenanceDate: string | null;
  nextMaintenanceDate: string | null;
  maintenanceNotes: string | null;
  mileage: number;
  fuelEfficiency: number | null;
  totalTrips: number;
  totalRevenue: number;
  averageRating: number | null;
  createdAt: string;
  updatedAt: string;
}

export const fleetApi = {
  /**
   * Get fleet summary for a tenant
   */
  async getFleetSummary(tenantId: string): Promise<FleetSummary> {
    const response = await api.get(`/fleet/${tenantId}/summary`);
    return response.data.data;
  },

  /**
   * Get fleet utilization metrics
   */
  async getFleetUtilization(tenantId: string): Promise<FleetUtilization> {
    const response = await api.get(`/fleet/${tenantId}/utilization`);
    return response.data.data;
  },

  /**
   * Get truck owners for a tenant
   */
  async getTruckOwners(
    tenantId: string,
    filters?: {
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ success: boolean; data: TruckOwner[]; total: number; message: string }> {
    const response = await api.get(`/fleet/${tenantId}/truck-owners?${this.buildParams(filters)}`);
    return {
      success: response.data.success,
      data: response.data.data.truckOwners,
      total: response.data.data.total,
      message: response.data.message,
    };
  },

  /**
   * Get trucks for a tenant
   */
  async getTrucks(
    tenantId: string,
    filters?: {
      ownerId?: string;
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ success: boolean; data: Truck[]; total: number; message: string }> {
    const response = await api.get(`/fleet/${tenantId}/trucks?${this.buildParams(filters)}`);
    return {
      success: response.data.success,
      data: response.data.data.trucks,
      total: response.data.data.total,
      message: response.data.message,
    };
  },

  /**
   * Build query parameters
   */
  buildParams(filters?: Record<string, any>): string {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== 'all') {
          params.append(key, value.toString());
        }
      });
    }
    return params.toString();
  },

  /**
   * Get truck owner details
   */
  async getTruckOwnerById(tenantId: string, ownerId: string): Promise<TruckOwner> {
    const response = await api.get(`/fleet/${tenantId}/truck-owners/${ownerId}`);
    return response.data.data;
  },

  /**
   * Get truck details
   */
  async getTruckById(tenantId: string, truckId: string): Promise<Truck> {
    const response = await api.get(`/fleet/${tenantId}/trucks/${truckId}`);
    return response.data.data;
  },
};

export default fleetApi;
