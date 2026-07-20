/**
 * Central query key factory. Use hierarchical keys so prefix invalidation
 * (e.g. invalidateQueries({ queryKey: queryKeys.loads.all })) refreshes
 * all related list/detail/dashboard queries.
 */
export const queryKeys = {
  loads: {
    all: ['loads'] as const,
    list: (filters?: Record<string, unknown>) => ['loads', 'list', filters] as const,
    detail: (id: string) => ['loads', 'detail', id] as const,
  },
  dashboard: {
    cargos: (userId?: string) => ['dashboard', 'cargos', userId] as const,
    analytics: (period?: string) => ['dashboard', 'analytics', period] as const,
    loadedForPayment: (userId?: string) => ['dashboard', 'loaded-cargos', userId] as const,
  },
  bidding: {
    all: ['bidding'] as const,
    auctions: ['bidding', 'auctions'] as const,
    bids: ['bidding', 'bids'] as const,
    stats: ['bidding', 'stats'] as const,
    history: ['bidding', 'history'] as const,
    inactive: ['bidding', 'inactive-auctions'] as const,
    analytics: ['bidding', 'analytics'] as const,
    auctionableCargos: (userId?: string, role?: string) =>
      ['bidding', 'auctionable-cargos', userId, role] as const,
    brokerAuctions: (userId?: string) => ['broker-assigned-auctions', userId] as const,
  },
  matching: {
    all: ['matching'] as const,
    bookingRequests: ['matching', 'booking-requests'] as const,
  },
  trips: {
    all: ['trips'] as const,
    detail: (id: string) => ['trips', 'detail', id] as const,
  },
  drivers: {
    all: ['driver'] as const,
    me: (userId?: string) => ['driver-me', userId] as const,
    profile: (driverId?: string) => ['driver', driverId] as const,
    currentTrip: (driverId?: string) => ['driver-current-trip', driverId] as const,
    upcomingTrips: (driverId?: string) => ['driver-upcoming-trips', driverId] as const,
    tripHistory: (driverId?: string) => ['driver-trip-history', driverId] as const,
    stats: (driverId?: string, period?: string) => ['driver-stats', driverId, period] as const,
    preTripInspections: (driverId?: string) => ['driver-pre-trip-inspections', driverId] as const,
  },
  availability: {
    trucks: ['available-trucks'] as const,
    drivers: ['available-drivers'] as const,
    utilization: ['utilization-summary'] as const,
    truckSchedule: (truckId?: string) => ['truck-schedule', truckId] as const,
    driverSchedule: (driverId?: string) => ['driver-schedule', driverId] as const,
  },
  fleet: {
    all: ['fleet'] as const,
    trucks: ['fleet', 'trucks'] as const,
  },
  tenant: {
    cargo: ['tenant-cargo'] as const,
    trips: ['tenant-trips'] as const,
    routes: ['tenant-routes'] as const,
    drivers: ['tenant-drivers'] as const,
  },
  notifications: {
    all: (userId?: string) => ['notifications', userId] as const,
    unread: (userId?: string) => ['notifications-unread-count', userId] as const,
  },
  payments: {
    all: ['payments'] as const,
    cargoOwnerCompleted: ['cargoOwnerCompletedPayments'] as const,
  },
  financial: {
    overview: (period?: string) => ['financial-overview-summary', period] as const,
    recentInvoices: ['recent-invoices'] as const,
    metrics: (period?: string) => ['financialMetrics', period] as const,
  },
  disputes: {
    all: ['disputes'] as const,
    mine: ['my-disputes'] as const,
    admin: ['disputes-admin'] as const,
  },
  admin: {
    tenants: ['admin-tenants'] as const,
    users: ['admin-users'] as const,
    trips: ['admin-all-trips'] as const,
  },
  credits: {
    balance: ['credit-balance'] as const,
    creditBalance: ['creditBalance'] as const,
    truckOwner: (userId?: string) => ['truck-owner-credits', userId] as const,
  },
} as const;

export type QueryKeyPrefix = readonly string[];
