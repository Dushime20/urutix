import type { ReactNode } from 'react';
import { useMutationSyncEvents } from '../hooks/useMutationSyncEvents';

/** Mounts WebSocket listeners that invalidate React Query caches on domain events. */
export function MutationSyncProvider({ children }: { children: ReactNode }) {
  useMutationSyncEvents();
  return <>{children}</>;
}
