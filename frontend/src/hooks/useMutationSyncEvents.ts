import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { queryClient } from '../lib/queryClient';
import { queryKeys } from '../lib/queryKeys';

/**
 * Listens for domain events over the /events WebSocket and invalidates
 * affected React Query caches so other users see updates without a reload.
 */
export function useMutationSyncEvents() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('accessToken');
    const wsUrl =
      import.meta.env.VITE_WEBSOCKET_URL ||
      import.meta.env.VITE_API_URL?.replace('/api', '') ||
      'http://localhost:3001';

    const socket: Socket = io(`${wsUrl}/events`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    const invalidate = (keys: readonly (readonly string[])[]) => {
      keys.forEach((queryKey) => {
        void queryClient.invalidateQueries({ queryKey });
      });
    };

    socket.on('notification', (payload: { type?: string; notificationType?: string; data?: { type?: string } }) => {
      const type = (
        payload?.notificationType ||
        payload?.type ||
        payload?.data?.type ||
        ''
      ).toUpperCase();

      if (!type) return;

      if (type.includes('BID') || type.includes('AUCTION')) {
        invalidate([
          queryKeys.bidding.all,
          queryKeys.bidding.stats,
          queryKeys.loads.all,
          queryKeys.dashboard.cargos(user.id),
          queryKeys.availability.trucks,
        ]);
        return;
      }

      if (type.includes('LOAD') || type.includes('CARGO') || type.includes('SHIPMENT')) {
        invalidate([
          queryKeys.loads.all,
          queryKeys.dashboard.cargos(user.id),
          queryKeys.tenant.cargo,
        ]);
        return;
      }

      if (type.includes('TRIP') || type.includes('DELIVERY')) {
        invalidate([
          queryKeys.trips.all,
          queryKeys.drivers.currentTrip(),
          queryKeys.drivers.upcomingTrips(),
        ]);
        return;
      }

      if (type.includes('BOOKING') || type.includes('MATCH')) {
        invalidate([
          queryKeys.matching.bookingRequests,
          queryKeys.matching.all,
          queryKeys.availability.trucks,
        ]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);
}
