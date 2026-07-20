import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import { queryClient } from './queryClient';
import { queryKeys } from './queryKeys';
import type { QueryKeyPrefix } from './queryKeys';

const MUTATION_METHODS = new Set(['post', 'put', 'patch', 'delete']);

/** Set on axios config to skip automatic cache sync for one-off requests */
export const SKIP_MUTATION_SYNC_HEADER = 'X-Skip-Mutation-Sync';

const REFRESH_FAILED_MESSAGE =
  'Your action was completed, but the latest information could not be loaded. Please refresh or try again.';

type InvalidationRule = {
  test: (path: string) => boolean;
  keys: QueryKeyPrefix[];
};

/**
 * Maps API paths to query key prefixes invalidated after successful mutations.
 * Rules are evaluated in order; all matching rules contribute keys.
 */
const INVALIDATION_RULES: InvalidationRule[] = [
  {
    test: (p) => /^\/bidding/.test(p),
    keys: [
      queryKeys.bidding.all,
      queryKeys.bidding.auctions,
      queryKeys.bidding.bids,
      queryKeys.bidding.stats,
      queryKeys.bidding.history,
      queryKeys.loads.all,
      queryKeys.tenant.cargo,
      queryKeys.dashboard.cargos(),
      queryKeys.matching.bookingRequests,
      queryKeys.availability.trucks,
      queryKeys.availability.drivers,
      queryKeys.availability.utilization,
      ['broker-assigned-auctions'],
      ['auction-bids'],
    ],
  },
  {
    test: (p) => /^\/loads-v2/.test(p) || /^\/loads(\/|$)/.test(p),
    keys: [
      queryKeys.loads.all,
      queryKeys.tenant.cargo,
      queryKeys.dashboard.cargos(),
      queryKeys.dashboard.loadedForPayment(),
      queryKeys.matching.bookingRequests,
      queryKeys.bidding.all,
    ],
  },
  {
    test: (p) => /^\/matching/.test(p),
    keys: [
      queryKeys.matching.all,
      queryKeys.matching.bookingRequests,
      queryKeys.loads.all,
      queryKeys.availability.trucks,
      queryKeys.availability.drivers,
      queryKeys.availability.utilization,
      queryKeys.availability.truckSchedule(),
      queryKeys.availability.driverSchedule(),
      queryKeys.dashboard.cargos(),
    ],
  },
  {
    test: (p) => /^\/trips/.test(p),
    keys: [
      queryKeys.trips.all,
      queryKeys.tenant.trips,
      queryKeys.drivers.currentTrip(),
      queryKeys.drivers.upcomingTrips(),
      queryKeys.drivers.tripHistory(),
      ['driver-trips'],
      queryKeys.admin.trips,
    ],
  },
  {
    test: (p) => /^\/drivers/.test(p),
    keys: [
      queryKeys.drivers.all,
      queryKeys.drivers.currentTrip(),
      queryKeys.drivers.upcomingTrips(),
      queryKeys.drivers.tripHistory(),
      queryKeys.drivers.stats(),
      queryKeys.drivers.preTripInspections(),
      queryKeys.fleet.trucks,
    ],
  },
  {
    test: (p) => /^\/fleet/.test(p),
    keys: [
      queryKeys.fleet.all,
      queryKeys.fleet.trucks,
      queryKeys.availability.trucks,
      queryKeys.availability.utilization,
    ],
  },
  {
    test: (p) => /^\/payments/.test(p) || /^\/pending-payments/.test(p),
    keys: [
      queryKeys.payments.all,
      queryKeys.payments.cargoOwnerCompleted,
      queryKeys.financial.overview(),
      queryKeys.financial.recentInvoices,
      queryKeys.dashboard.loadedForPayment(),
    ],
  },
  {
    test: (p) => /^\/financial/.test(p),
    keys: [
      queryKeys.financial.overview(),
      queryKeys.financial.recentInvoices,
      queryKeys.financial.metrics(),
      ['financial-reports'],
    ],
  },
  {
    test: (p) => /^\/disputes/.test(p),
    keys: [
      queryKeys.disputes.all,
      queryKeys.disputes.mine,
      queryKeys.disputes.admin,
      ['admin-disputes'],
    ],
  },
  {
    test: (p) => /^\/notifications/.test(p),
    keys: [
      queryKeys.notifications.all(),
      queryKeys.notifications.unread(),
    ],
  },
  {
    test: (p) => /^\/receivers/.test(p),
    keys: [
      queryKeys.loads.all,
      queryKeys.dashboard.cargos(),
    ],
  },
  {
    test: (p) => /^\/brokers/.test(p),
    keys: [
      queryKeys.loads.all,
      queryKeys.tenant.cargo,
      queryKeys.dashboard.cargos(),
    ],
  },
  {
    test: (p) => /^\/tenant/.test(p) || /^\/tenants/.test(p),
    keys: [
      queryKeys.admin.tenants,
      ['tenant'],
    ],
  },
  {
    test: (p) => /^\/subscriptions/.test(p) || /\/credits/.test(p),
    keys: [
      queryKeys.credits.balance,
      queryKeys.credits.creditBalance,
      queryKeys.credits.truckOwner(),
      ['marketplace-stats'],
      ['truck-owner-transactions'],
    ],
  },
  {
    test: (p) => /^\/lending/.test(p),
    keys: [
      ['loan-requests'],
      ['active-loans'],
      ['disbursements'],
      ['repayments'],
    ],
  },
  {
    test: (p) => /^\/maintenance/.test(p),
    keys: [
      queryKeys.fleet.trucks,
      ['driver-assigned-truck'],
    ],
  },
  {
    test: (p) => /^\/bookings/.test(p),
    keys: [
      queryKeys.loads.all,
      queryKeys.trips.all,
      queryKeys.matching.bookingRequests,
    ],
  },
];

function normalizePath(url: string | undefined): string {
  if (!url) return '';
  const withoutQuery = url.split('?')[0];
  if (withoutQuery.startsWith('http')) {
    try {
      const pathname = new URL(withoutQuery).pathname;
      return pathname.replace(/^\/api/, '') || pathname;
    } catch {
      return withoutQuery;
    }
  }
  return withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
}

function shouldSkipSync(config: InternalAxiosRequestConfig): boolean {
  if (config.headers?.[SKIP_MUTATION_SYNC_HEADER] === 'true') return true;
  if (config.headers?.[SKIP_MUTATION_SYNC_HEADER] === true) return true;
  const path = normalizePath(config.url);
  // Auth and read-only profile checks should not trigger global refresh
  if (/^\/auth(\/|$)/.test(path)) return true;
  return false;
}

export function resolveInvalidationKeys(path: string): QueryKeyPrefix[] {
  const keys: QueryKeyPrefix[] = [];
  const seen = new Set<string>();

  for (const rule of INVALIDATION_RULES) {
    if (!rule.test(path)) continue;
    for (const key of rule.keys) {
      const serialized = JSON.stringify(key);
      if (!seen.has(serialized)) {
        seen.add(serialized);
        keys.push(key);
      }
    }
  }

  return keys;
}

/**
 * Invalidate and refetch active queries affected by a successful mutation.
 */
export async function syncAfterMutation(
  method: string | undefined,
  url: string | undefined,
  options?: { skip?: boolean },
): Promise<void> {
  if (options?.skip) return;
  const normalizedMethod = (method ?? 'get').toLowerCase();
  if (!MUTATION_METHODS.has(normalizedMethod)) return;

  const path = normalizePath(url);
  if (/^\/auth(\/|$)/.test(path)) return;

  const keys = resolveInvalidationKeys(path);
  if (keys.length === 0) return;

  try {
    await Promise.all(
      keys.map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    );

    await Promise.all(
      keys.map((queryKey) =>
        queryClient.refetchQueries({ queryKey, type: 'active' }),
      ),
    );
  } catch (error) {
    console.error('[mutationSync] Refresh failed after mutation:', path, error);
    toast.error(REFRESH_FAILED_MESSAGE, { duration: 5000 });
  }
}

export function handleMutationResponse(response: AxiosResponse): void {
  const config = response.config;
  if (shouldSkipSync(config)) return;

  void syncAfterMutation(config.method, config.url);
}

/**
 * Manually trigger cache sync (e.g. after mutations via a separate axios instance).
 */
export function invalidateQueryKeys(keys: QueryKeyPrefix[]): void {
  void Promise.all(
    keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  ).catch(() => {
    toast.error(REFRESH_FAILED_MESSAGE, { duration: 5000 });
  });
}
