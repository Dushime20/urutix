import { useQuery } from '@tanstack/react-query';
import { availabilityApi } from '../services/availabilityApi';

/**
 * Fetches available trucks for a date range.
 * Enabled only when both dates are provided.
 */
export function useAvailableTrucks(params: {
  pickupDateTime?: string;
  deliveryDateTime?: string;
  capacityWeight?: number;
  truckType?: string;
}) {
  const { pickupDateTime, deliveryDateTime } = params;
  const enabled = !!pickupDateTime && !!deliveryDateTime;

  return useQuery({
    queryKey: ['available-trucks', params],
    queryFn: () =>
      availabilityApi.getAvailableTrucks({
        pickupDateTime: pickupDateTime!,
        deliveryDateTime: deliveryDateTime!,
        capacityWeight: params.capacityWeight,
        truckType: params.truckType,
      }),
    enabled,
    staleTime: 60_000, // 1 minute
  });
}

/**
 * Fetches available drivers for a date range.
 * When truckId is provided, only drivers assigned to that truck are returned.
 */
export function useAvailableDrivers(params: {
  pickupDateTime?: string;
  deliveryDateTime?: string;
  truckId?: string;
}) {
  const { pickupDateTime, deliveryDateTime, truckId } = params;
  const enabled = !!pickupDateTime && !!deliveryDateTime && !!truckId;

  return useQuery({
    queryKey: ['available-drivers', params],
    queryFn: () =>
      availabilityApi.getAvailableDrivers({
        pickupDateTime: pickupDateTime!,
        deliveryDateTime: deliveryDateTime!,
        truckId,
      }),
    enabled,
    staleTime: 60_000,
  });
}

/**
 * Fleet utilization summary — used on broker/fleet dashboards.
 */
export function useUtilizationSummary() {
  return useQuery({
    queryKey: ['utilization-summary'],
    queryFn: () => availabilityApi.getUtilizationSummary(),
    staleTime: 30_000,
  });
}

/**
 * Reservation schedule for a specific truck.
 */
export function useTruckSchedule(truckId?: string) {
  return useQuery({
    queryKey: ['truck-schedule', truckId],
    queryFn: () => availabilityApi.getTruckSchedule(truckId!),
    enabled: !!truckId,
    staleTime: 30_000,
  });
}

/**
 * Reservation schedule for a specific driver.
 */
export function useDriverSchedule(driverId?: string) {
  return useQuery({
    queryKey: ['driver-schedule', driverId],
    queryFn: () => availabilityApi.getDriverSchedule(driverId!),
    enabled: !!driverId,
    staleTime: 30_000,
  });
}
