/**
 * Maps each capability code → roles that receive it by default (from permission-catalog roleDefaults).
 * Used as API fallback on @RequirePermissions endpoints when permission DB is incomplete.
 * User explicit DENY always wins over role fallback.
 */

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN'];

/** Mirrors backend/src/config/permission-catalog.json → roleDefaults */
const ROLE_DEFAULTS: Record<string, string[]> = {
  CARGO_OWNER: [
    'cargo:view', 'cargo:view_own', 'cargo:create', 'cargo:edit', 'cargo:delete', 'cargo:publish',
    'auctions:view', 'auctions:create', 'bids:view', 'bids:manage',
    'matching:request', 'matching:view_results', 'lending:create_request', 'brokers:assign',
    'trips:view_assigned', 'analytics:view_own', 'analytics:view_tenant',
  ],
  TRUCK_OWNER: [
    'fleet:view', 'fleet:view_own', 'fleet:create', 'fleet:edit', 'fleet:delete', 'fleet:assign_driver',
    'drivers:view', 'drivers:create', 'drivers:edit',
    'auctions:view', 'bids:view_own', 'bids:create', 'bids:view_history',
    'matching:respond', 'trips:view', 'trips:start', 'trips:complete', 'trips:assign_driver',
    'lending:view_own', 'lending:create_request', 'analytics:view_own',
  ],
  DRIVER: [
    'trips:view_assigned', 'trips:start', 'trips:complete', 'trips:pause', 'trips:resume',
    'trips:view_epod', 'analytics:view_own',
  ],
  LENDER: [
    'lending:view', 'lending:approve', 'lending:disburse', 'lending:repayment', 'lending:policies',
    'analytics:view_own',
  ],
  BROKER: [
    'auctions:view', 'bids:view', 'bids:manage', 'matching:request', 'matching:view_results',
    'brokers:view', 'cargo:view',
  ],
  TENANT_ADMIN: [
    'cargo:view', 'fleet:view', 'bids:manage', 'auctions:manage', 'brokers:assign',
    'matching:view_results', 'trips:assign_driver', 'analytics:view_tenant',
  ],
  CARGO_RECEIVER: ['receivers:inspect', 'receivers:view', 'cargo:view_own', 'trips:confirm_epod'],
  CUSTOMS_OFFICER: ['customs:view', 'customs:create', 'customs:update'],
  FLEET_MANAGER: ['fleet:view', 'fleet:edit', 'trips:assign_driver', 'trips:start', 'trips:complete'],
  FLEET_DISPATCHER: ['trips:assign_driver', 'trips:start', 'trips:complete', 'fleet:view'],
};

function buildPermissionRoleMap(): Record<string, string[]> {
  const map = new Map<string, Set<string>>();

  for (const [role, permissions] of Object.entries(ROLE_DEFAULTS)) {
    for (const perm of permissions) {
      if (!map.has(perm)) map.set(perm, new Set());
      map.get(perm)!.add(role);
    }
  }

  for (const perm of map.keys()) {
    ADMIN_ROLES.forEach((r) => map.get(perm)!.add(r));
  }

  return Object.fromEntries(
    [...map.entries()].map(([perm, roles]) => [perm, [...roles]]),
  );
}

export const PERMISSION_ROLE_FALLBACK: Record<string, string[]> = buildPermissionRoleMap();

export function getRoleFallbackForPermissions(permissionCodes: string[]): string[] {
  const roles = new Set<string>();
  for (const raw of permissionCodes) {
    const code = normalizePermCode(raw);
    for (const role of PERMISSION_ROLE_FALLBACK[code] || []) {
      roles.add(role.toUpperCase());
    }
  }
  return [...roles];
}

export function normalizePermCode(permission: string): string {
  if (!permission) return '';
  if (permission.includes(':')) {
    const [resource, ...rest] = permission.split(':');
    return `${resource.trim()}:${rest.join(':').trim()}`;
  }
  if (permission.includes('.')) {
    const [resource, ...rest] = permission.split('.');
    return `${resource.trim()}:${rest.join('.').trim()}`;
  }
  return permission.trim();
}

export function normalizeUserRole(role: unknown): string {
  if (Array.isArray(role)) return String(role[0] || '').toUpperCase();
  return String(role || '').toUpperCase();
}

export function userHasAnyRole(userRole: unknown, allowedRoles: string[]): boolean {
  if (!allowedRoles.length) return false;
  const normalized = normalizeUserRole(userRole);
  const allowed = new Set(allowedRoles.map((r) => r.toUpperCase()));
  return allowed.has(normalized);
}
