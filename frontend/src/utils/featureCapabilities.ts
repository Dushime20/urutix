/**
 * Frontend capability helpers aligned with backend route-permission.rules.ts
 * and permission-catalog.json. Used for nav / tab gating (UX only — API is authoritative).
 */

export type FeatureArea =
  | 'cargo'
  | 'fleet'
  | 'drivers'
  | 'bidding'
  | 'matching'
  | 'trips'
  | 'lending'
  | 'brokers'
  | 'customs'
  | 'receivers'
  | 'financial'
  | 'analytics'
  | 'notifications'
  | 'credits'
  | 'admin';

/** ANY-of capability lists per business area */
export const FEATURE_CAPABILITIES: Record<FeatureArea, string[]> = {
  cargo: ['cargo:view', 'cargo:view_own', 'cargo:create', 'cargo:edit'],
  fleet: ['fleet:view', 'fleet:view_own', 'fleet:create', 'fleet:edit'],
  drivers: ['drivers:view', 'drivers:view_own', 'drivers:create', 'drivers:edit'],
  bidding: [
    'auctions:view',
    'auctions:create',
    'auctions:manage',
    'bids:view',
    'bids:view_own',
    'bids:view_history',
    'bids:manage',
  ],
  matching: ['matching:request', 'matching:respond', 'matching:view_results'],
  trips: ['trips:view', 'trips:view_assigned', 'trips:start', 'trips:complete'],
  lending: ['lending:view', 'lending:view_own', 'lending:create_request', 'lending:approve'],
  brokers: ['brokers:view', 'brokers:assign'],
  customs: ['customs:view', 'customs:create', 'customs:update'],
  receivers: ['receivers:view', 'receivers:inspect'],
  financial: ['payments:view', 'payments:view_own', 'invoices:view', 'payments:manage'],
  analytics: ['analytics:view_own', 'analytics:view_tenant', 'analytics:view_all'],
  notifications: ['notifications:view'],
  credits: ['credits:view', 'credits:purchase'],
  admin: ['users:permissions.manage'],
};

/** Map URL path fragments to feature areas for header / link filtering */
export function pathToFeatureArea(path: string): FeatureArea | null {
  const p = path.toLowerCase();
  if (p.includes('bidding') || p.includes('/bids')) return 'bidding';
  if (p.includes('smart-matching') || p.includes('tab=matches') || p.includes('/matches')) return 'matching';
  if (p.includes('/cargos') || p.includes('cargo-owner/cargos')) return 'cargo';
  if (p.includes('/trucks') || p.includes('/fleet')) return 'fleet';
  if (p.includes('/drivers')) return 'drivers';
  if (p.includes('/trips') || p.includes('/tracking')) return 'trips';
  if (p.includes('/lender') || p.includes('/loans') || p.includes('/credits')) return 'lending';
  if (p.includes('/broker')) return 'brokers';
  if (p.includes('/customs')) return 'customs';
  if (p.includes('/receivers') || p.includes('inspect')) return 'receivers';
  if (p.includes('/financial') || p.includes('/invoices') || p.includes('/payments')) return 'financial';
  if (p.includes('/analytics') || p.includes('/reports')) return 'analytics';
  if (p.includes('/admin')) return 'admin';
  return null;
}
