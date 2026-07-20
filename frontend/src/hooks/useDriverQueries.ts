import { useQuery } from '@tanstack/react-query';
import { driverApi } from '../services/driverApi';
import { queryKeys } from '../lib/queryKeys';

export function usePreTripInspectionLoads(driverId?: string) {
  return useQuery({
    queryKey: [...queryKeys.drivers.preTripInspections(driverId), 'loads'],
    queryFn: () => driverApi.getPreTripInspectionLoads(driverId!),
    enabled: !!driverId,
    refetchInterval: 30_000,
  });
}
