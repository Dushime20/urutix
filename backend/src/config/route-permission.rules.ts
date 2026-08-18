/**
 * Route → capability mapping used ONLY when a user has admin grant/deny overrides.
 * Does not restrict users without overrides — existing role-based APIs unchanged.
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface RoutePermissionRule {
  /** HTTP methods (default: all) */
  methods?: HttpMethod[];
  /** RegExp tested against normalized path, e.g. "fleet/trucks" */
  pattern: RegExp;
  /** User needs ANY of these capabilities */
  permissions: string[];
}

/** Paths that never require capability checks (public / auth bootstrap / webhooks). */
export const ROUTE_PERMISSION_SKIP: RegExp[] = [
  /^$/,
  /^health$/,
  /^auth\//,
  /^settings\/public/,
  /^platform\/v1\//,
  /^public\//,
  /^payments\/webhook/,
  /^payments\/.*webhook/i,
  /^lending\/webhook/i,
  /^bidding\/test$/,
  /^bidding\/test-db$/,
  /^parking-reservations\/lookup/,
  /^parking-reservations\/lookup\/pay/,
];

export const ROUTE_PERMISSION_RULES: RoutePermissionRule[] = [
  // ── Cargo / loads ───────────────────────────────────────────────────────
  { methods: ['GET', 'HEAD'], pattern: /^loads(-v2)?(\/|$)/, permissions: ['cargo:view', 'cargo:view_own'] },
  { methods: ['POST'], pattern: /^loads(-v2)?(\/|$)/, permissions: ['cargo:create'] },
  { methods: ['PUT', 'PATCH'], pattern: /^loads(-v2)?\//, permissions: ['cargo:edit'] },
  { methods: ['DELETE'], pattern: /^loads(-v2)?\//, permissions: ['cargo:delete'] },
  { methods: ['POST'], pattern: /^loads(-v2)?\/.*\/publish/, permissions: ['cargo:publish', 'cargo:edit'] },
  { pattern: /^loads\/templates/, permissions: ['cargo:view', 'cargo:view_own', 'cargo:create'] },

  // ── Fleet / trucks ────────────────────────────────────────────────────────
  { methods: ['GET', 'HEAD'], pattern: /^fleet(\/|$)/, permissions: ['fleet:view', 'fleet:view_own'] },
  { methods: ['POST'], pattern: /^fleet\/trucks(\/|$)/, permissions: ['fleet:create'] },
  { methods: ['PUT', 'PATCH'], pattern: /^fleet\/trucks\//, permissions: ['fleet:edit'] },
  { methods: ['DELETE'], pattern: /^fleet\/trucks\//, permissions: ['fleet:delete'] },
  { methods: ['POST', 'PATCH'], pattern: /^fleet\/.*assign.*driver/i, permissions: ['fleet:assign_driver', 'trips:assign_driver'] },
  { pattern: /^fleet\/epods/, permissions: ['trips:view_epod', 'trips:view', 'trips:view_assigned'] },

  // ── Drivers ─────────────────────────────────────────────────────────────
  { methods: ['GET', 'HEAD'], pattern: /^drivers(\/|$)/, permissions: ['drivers:view', 'drivers:view_own'] },
  { methods: ['POST'], pattern: /^drivers(\/|$)/, permissions: ['drivers:create'] },
  { methods: ['PUT', 'PATCH'], pattern: /^drivers\//, permissions: ['drivers:edit'] },
  { methods: ['DELETE'], pattern: /^drivers\//, permissions: ['drivers:delete'] },

  // ── Bidding / auctions ────────────────────────────────────────────────────
  { methods: ['GET', 'HEAD'], pattern: /^bidding\/auctions/, permissions: ['auctions:view', 'auctions:create', 'auctions:manage', 'bids:manage'] },
  { methods: ['POST'], pattern: /^bidding\/auctions(\/|$)/, permissions: ['auctions:create'] },
  { methods: ['PUT', 'PATCH', 'DELETE'], pattern: /^bidding\/auctions\//, permissions: ['auctions:manage', 'auctions:create'] },
  { methods: ['GET', 'HEAD'], pattern: /^bidding\/(bids|history|dashboard)/, permissions: ['bids:view', 'bids:view_own', 'bids:view_history', 'bids:manage'] },
  { methods: ['POST'], pattern: /^bidding\/bids(\/|$)/, permissions: ['bids:create'] },
  { methods: ['POST'], pattern: /^bidding\/bids\/.*\/accept/, permissions: ['bids:manage'] },
  { pattern: /^bidding\//, permissions: ['auctions:view', 'bids:view_own', 'bids:create', 'bids:manage'] },

  // ── Smart matching ────────────────────────────────────────────────────────
  { methods: ['POST'], pattern: /^matching\/(find-matches|request|enhanced)/, permissions: ['matching:request'] },
  { methods: ['POST'], pattern: /^matching\/(respond|accept|create-trip)/, permissions: ['matching:respond', 'matching:request'] },
  { methods: ['GET', 'HEAD'], pattern: /^matching\//, permissions: ['matching:view_results', 'matching:request', 'matching:respond', 'matching:analytics'] },

  // ── Trips ─────────────────────────────────────────────────────────────────
  { methods: ['GET', 'HEAD'], pattern: /^trips(\/|$)/, permissions: ['trips:view', 'trips:view_assigned'] },
  { methods: ['POST'], pattern: /^trips(\/|$)/, permissions: ['trips:create', 'trips:view'] },
  { methods: ['POST', 'PATCH'], pattern: /^trips\/.*\/start/, permissions: ['trips:start'] },
  { methods: ['POST', 'PATCH'], pattern: /^trips\/.*\/(complete|finish)/, permissions: ['trips:complete'] },
  { methods: ['POST', 'PATCH'], pattern: /^trips\/.*\/(pause)/, permissions: ['trips:pause'] },
  { methods: ['POST', 'PATCH'], pattern: /^trips\/.*\/(resume)/, permissions: ['trips:resume'] },
  { methods: ['POST', 'PATCH'], pattern: /^trips\/.*\/(cancel)/, permissions: ['trips:cancel'] },
  { methods: ['POST', 'PATCH'], pattern: /^trips\/.*assign.*driver/i, permissions: ['trips:assign_driver'] },
  { methods: ['POST', 'PATCH'], pattern: /^trips\/.*\/location/, permissions: ['trips:track', 'trips:start'] },
  { pattern: /^trips\/.*epod/i, permissions: ['trips:view_epod', 'trips:confirm_epod'] },
  { pattern: /^tracking\//, permissions: ['trips:track', 'trips:view', 'trips:view_assigned'] },

  // ── Lending ───────────────────────────────────────────────────────────────
  { methods: ['GET', 'HEAD'], pattern: /^lending(\/|$)/, permissions: ['lending:view', 'lending:view_own'] },
  { methods: ['POST'], pattern: /^lending\/.*(request|apply)/i, permissions: ['lending:create_request'] },
  { methods: ['POST', 'PATCH'], pattern: /^lending\/.*(approve|reject)/i, permissions: ['lending:approve'] },
  { methods: ['POST', 'PATCH'], pattern: /^lending\/.*disburse/i, permissions: ['lending:disburse'] },
  { methods: ['POST', 'PATCH'], pattern: /^lending\/.*repay/i, permissions: ['lending:repayment'] },
  { pattern: /^lending\/policies/, permissions: ['lending:policies', 'lending:view'] },

  // ── Brokers ─────────────────────────────────────────────────────────────────
  { methods: ['GET', 'HEAD'], pattern: /^brokers(\/|$)/, permissions: ['brokers:view', 'cargo:view'] },
  { methods: ['POST', 'PATCH'], pattern: /^brokers\/.*assign/, permissions: ['brokers:assign'] },
  { methods: ['POST'], pattern: /^brokers(\/|$)/, permissions: ['brokers:create', 'brokers:view'] },

  // ── Customs & receivers ─────────────────────────────────────────────────────
  { methods: ['GET', 'HEAD'], pattern: /^customs(\/|$)/, permissions: ['customs:view'] },
  { methods: ['POST'], pattern: /^customs(\/|$)/, permissions: ['customs:create'] },
  { methods: ['PUT', 'PATCH'], pattern: /^customs\//, permissions: ['customs:update'] },
  { methods: ['GET', 'HEAD'], pattern: /^receivers(\/|$)/, permissions: ['receivers:view', 'cargo:view_own'] },
  { methods: ['POST', 'PUT', 'PATCH'], pattern: /^receivers\/.*inspect/i, permissions: ['receivers:inspect'] },
  { pattern: /^cargo-owner\/epods/, permissions: ['trips:confirm_epod', 'receivers:inspect', 'cargo:view_own'] },

  // ── Parking reservations ────────────────────────────────────────────────────
  { methods: ['GET', 'HEAD'], pattern: /^parking-reservations(\/|$)/, permissions: ['parking:view', 'parking:view_own', 'parking:view_details'] },
  { methods: ['POST'], pattern: /^parking-reservations\/.*\/approve/, permissions: ['parking:approve'] },
  { methods: ['POST'], pattern: /^parking-reservations\/.*\/reject/, permissions: ['parking:reject'] },
  { methods: ['POST'], pattern: /^parking-reservations\/.*\/assign/, permissions: ['parking:assign'] },
  { methods: ['POST'], pattern: /^parking-reservations\/.*\/request-information/, permissions: ['parking:request_information'] },
  { methods: ['POST'], pattern: /^parking-reservations\/.*\/cancel/, permissions: ['parking:cancel'] },
  { methods: ['POST'], pattern: /^parking-reservations\/.*\/notes/, permissions: ['parking:add_note'] },
  { methods: ['PATCH'], pattern: /^parking-reservations\/.*\/review/, permissions: ['parking:review'] },
  { methods: ['PATCH'], pattern: /^parking-reservations\/facility/, permissions: ['parking:manage_capacity'] },
  { methods: ['GET'], pattern: /^parking-reservations\/fees/, permissions: ['parking:view', 'parking:manage_fees'] },
  { methods: ['PATCH'], pattern: /^parking-reservations\/fees/, permissions: ['parking:manage_fees'] },
  { methods: ['POST'], pattern: /^parking-reservations\/fees\/preview/, permissions: ['parking:view', 'parking:manage_fees'] },
  { methods: ['POST'], pattern: /^parking-reservations\/fees\/schedules\/.*\/activate/, permissions: ['parking:manage_fees'] },
  { methods: ['POST'], pattern: /^parking-reservations\/fees\/schedules\/.*\/archive/, permissions: ['parking:manage_fees'] },
  { methods: ['POST'], pattern: /^parking-reservations\/.*\/pay-now/, permissions: ['parking:view_own', 'parking:create'] },
  { methods: ['POST'], pattern: /^parking-reservations\/.*\/pay-status/, permissions: ['parking:view_own', 'parking:create'] },
  { methods: ['POST'], pattern: /^parking-reservations\/.*\/pay/, permissions: ['parking:view_own', 'parking:create'] },
  { methods: ['POST'], pattern: /^parking-reservations\/.*\/confirm-payment/, permissions: ['parking:confirm_payment', 'parking:approve'] },
  { methods: ['POST'], pattern: /^parking-reservations\/.*\/waive-payment/, permissions: ['parking:confirm_payment', 'parking:approve'] },
  { methods: ['GET'], pattern: /^parking-reservations\/export/, permissions: ['parking:export'] },

  // ── Financial / payments ────────────────────────────────────────────────────
  { methods: ['GET', 'HEAD'], pattern: /^(payments|financial|pending-payments|invoices)(\/|$)/, permissions: ['payments:view', 'payments:view_own', 'invoices:view'] },
  { methods: ['POST', 'PUT', 'PATCH'], pattern: /^(payments|financial)(\/|$)/, permissions: ['payments:manage', 'invoices:create'] },

  // ── Credits & subscriptions ─────────────────────────────────────────────────
  { methods: ['GET', 'HEAD'], pattern: /^credits(\/|$)/, permissions: ['credits:view'] },
  { methods: ['POST'], pattern: /^credits\/.*purchase/i, permissions: ['credits:purchase'] },
  { methods: ['POST'], pattern: /^credits\/.*consume/i, permissions: ['credits:consume'] },
  { pattern: /^subscriptions(\/|$)/, permissions: ['credits:view', 'payments:view_own'] },

  // ── Analytics & reports ─────────────────────────────────────────────────────
  { pattern: /^analytics\//, permissions: ['analytics:view_own', 'analytics:view_tenant', 'analytics:view_all', 'analytics:financial'] },

  // ── Notifications & profile ─────────────────────────────────────────────────
  { pattern: /^notifications(\/|$)/, permissions: ['notifications:view'] },
  { methods: ['GET', 'HEAD'], pattern: /^users(\/|$)/, permissions: ['users:view_own'] },
  { methods: ['PUT', 'PATCH'], pattern: /^users\//, permissions: ['users:edit_own'] },

  // ── Fuel / maintenance / safety (fleet-adjacent) ────────────────────────────
  { pattern: /^fuel(\/|$)/, permissions: ['fleet:view', 'fleet:view_own', 'fleet:edit'] },
  { pattern: /^maintenance(\/|$)/, permissions: ['fleet:view', 'fleet:edit'] },
  { pattern: /^safety(\/|$)/, permissions: ['fleet:view', 'drivers:view'] },

  // ── Availability (truck owner respond to loads) ─────────────────────────────
  { pattern: /^availability(\/|$)/, permissions: ['matching:respond', 'fleet:view_own', 'trips:view'] },

  // ── Tenant dashboard (tenant-scoped ops) ──────────────────────────────────────
  { pattern: /^tenant-dashboard\//, permissions: ['analytics:view_tenant', 'cargo:view', 'fleet:view'] },

  // ── Admin (super-admin / tenant admin capabilities) ───────────────────────────
  { pattern: /^admin\/permissions/, permissions: ['users:permissions.manage'] },
  { pattern: /^admin\/users/, permissions: ['users:permissions.manage', 'users:view_own'] },
  { pattern: /^admin\/feature-controls/, permissions: ['users:permissions.manage'] },
  { pattern: /^admin\/tenant-management/, permissions: ['users:permissions.manage'] },
  { pattern: /^admin\/(monitoring|operational|bidding)/, permissions: ['analytics:view_all', 'users:permissions.manage'] },
];
