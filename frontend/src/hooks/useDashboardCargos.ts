import { useQuery } from '@tanstack/react-query';
import { fetchCargos } from '../services/cargoApi';
import receiverService from '../services/receiverService';
import { queryKeys } from '../lib/queryKeys';

interface DashboardUser {
  id?: string;
  role?: string;
}

export function useDashboardCargos(user: DashboardUser | null | undefined) {
  const isReceiver = user?.role === 'CARGO_RECEIVER';

  return useQuery({
    queryKey: queryKeys.dashboard.cargos(user?.id),
    queryFn: async () => {
      if (isReceiver) {
        const data = await receiverService.getMyCargos();
        return Array.isArray(data) ? data : [];
      }
      const data = await fetchCargos(1, '', { limit: 50 });
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user?.id,
    refetchInterval: 30_000,
  });
}
