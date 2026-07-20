import { useQuery } from '@tanstack/react-query';
import { fleetApi } from '../services/fleetApi';
import { tripsAPI } from '../services/api';
import { queryKeys } from '../lib/queryKeys';

export function useFleetTrucksQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.fleet.trucks,
    queryFn: async () => {
      const trucksData = await fleetApi.getTrucks({});
      return Array.isArray(trucksData) ? trucksData : [];
    },
    enabled,
  });
}

export function useActiveTripsQuery(enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.trips.all, 'active'],
    queryFn: async () => {
      try {
        const response = await tripsAPI.getActive();
        const tripsData = response.data?.data || response.data || [];
        return Array.isArray(tripsData) ? tripsData : [];
      } catch (activeError: any) {
        if (activeError?.response?.status !== 404) throw activeError;

        const response = await tripsAPI.getAll({ status: 'IN_PROGRESS', limit: 100 });
        let allTrips = response.data?.data || response.data?.trips || response.data || [];
        if (allTrips && !Array.isArray(allTrips) && allTrips.trips) {
          allTrips = allTrips.trips;
        }
        return Array.isArray(allTrips)
          ? allTrips.filter((trip: any) => {
              const s = (trip.status || '').toUpperCase().replace(/\s+/g, '_');
              return ['IN_PROGRESS', 'IN_TRANSIT', 'ACTIVE', 'ONGOING'].includes(s);
            })
          : [];
      }
    },
    enabled,
  });
}
