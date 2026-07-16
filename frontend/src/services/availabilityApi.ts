import api from './api';
import { getApiErrorMessage } from '../config/errorMessages';

export interface AvailableTruck {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  truckType: string;
  trailerType: string;
  capacityWeight: number;
  capacityVolume: number;
  status: string;
  averageRating: number;
  currentLocation?: string;
}

export interface AvailableDriver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  availabilityStatus: string;
  rating: number;
  licenseNumber: string;
  currentTruckId?: string;
}

export interface UtilizationSummary {
  availableTrucks: number;
  busyTrucks: number;
  availableDrivers: number;
  busyDrivers: number;
  upcomingTrips: number;
  currentTrips: number;
}

export interface TruckScheduleItem {
  id: string;
  tripId: string;
  cargoId: string;
  truckId: string;
  driverId: string | null;
  pickupDateTime: string;
  deliveryDateTime: string;
  status: string;
}

export interface ConflictDetail {
  type: 'TRUCK' | 'DRIVER';
  resourceId: string;
  conflictingTripId: string;
  conflictingCargoId: string;
  existingPickup: string;
  existingDelivery: string;
}

export const availabilityApi = {
  /** Get trucks available for a window */
  getAvailableTrucks: async (params: {
    pickupDateTime: string;
    deliveryDateTime: string;
    capacityWeight?: number;
    truckType?: string;
  }): Promise<AvailableTruck[]> => {
    const response = await api.get('/availability/trucks', { params });
    return response.data?.data || [];
  },

  /** Get drivers available for a window (optionally scoped to a truck's assigned drivers) */
  getAvailableDrivers: async (params: {
    pickupDateTime: string;
    deliveryDateTime: string;
    truckId?: string;
  }): Promise<AvailableDriver[]> => {
    const response = await api.get('/availability/drivers', { params });
    return response.data?.data || [];
  },

  /** Fleet utilization summary */
  getUtilizationSummary: async (): Promise<UtilizationSummary> => {
    const response = await api.get('/availability/summary');
    return response.data?.data;
  },

  /** Schedule (reservations) for a specific truck */
  getTruckSchedule: async (truckId: string): Promise<TruckScheduleItem[]> => {
    const response = await api.get(`/availability/trucks/${truckId}/schedule`);
    return response.data?.data || [];
  },

  /** Schedule (reservations) for a specific driver */
  getDriverSchedule: async (driverId: string): Promise<TruckScheduleItem[]> => {
    const response = await api.get(`/availability/drivers/${driverId}/schedule`);
    return response.data?.data || [];
  },

  /** Backfill reservations from existing trips (one-time admin action) */
  backfill: async (): Promise<{ count: number }> => {
    const response = await api.post('/availability/backfill');
    return response.data?.data;
  },
};
