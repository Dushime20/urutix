import { useMemo } from 'react';
import { usePermission } from '../contexts/PermissionContext';
import { useAuth } from '../contexts/AuthContext';

/**
 * Navigation / feature access derived from effective capabilities
 * (role defaults + per-user grants/denies − feature kill-switches).
 *
 * After permissions load, role is NOT used as an OR bypass — otherwise
 * denying auctions:view (etc.) would still show bidding to TRUCK_OWNER.
 * While loading, role is used only as a temporary UX fallback.
 */
export const useNavigationPermissions = () => {
  const { hasPermission, hasAnyPermission, isFeatureEnabled, isLoading, permissions } =
    usePermission();
  const { user } = useAuth();

  return useMemo(() => {
    const role = user?.role;
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'TENANT_ADMIN';
    // Trust capability set once fetch finished (even if empty = fully denied)
    const trustCaps = !isLoading;

    const allow = (codes: string[], roleFallback: boolean) => {
      if (trustCaps) return hasAnyPermission(codes);
      return roleFallback;
    };

    const allowAndFeature = (
      codes: string[],
      featureCodes: string[],
      roleFallback: boolean,
    ) => {
      const capsOk = allow(codes, roleFallback);
      const featureOk = featureCodes.some((c) => isFeatureEnabled(c));
      return capsOk && featureOk;
    };

    const canAccessDashboard =
      allow(['dashboard:view', 'dashboard:access'], !!role) || !!role;

    const canAccessCargoManagement = allow(
      ['cargo:view', 'cargo:view_own', 'cargo:create', 'cargo:edit'],
      role === 'CARGO_OWNER' || isAdmin,
    );

    const canCreateCargo =
      (trustCaps
        ? hasPermission('cargo:create')
        : role === 'CARGO_OWNER' || isAdmin) && isFeatureEnabled('cargo:create');

    const canAccessFleetManagement = allow(
      ['fleet:view', 'fleet:view_own', 'fleet:create', 'fleet:edit'],
      role === 'TRUCK_OWNER' || role === 'FLEET_OWNER' || isAdmin,
    );

    const canManageFleet = allow(
      ['fleet:create', 'fleet:edit', 'fleet:delete', 'fleet:assign_driver'],
      role === 'TRUCK_OWNER' || role === 'FLEET_OWNER' || isAdmin,
    );

    const canAccessDrivers = allow(
      ['drivers:view', 'drivers:view_own', 'drivers:create', 'drivers:edit'],
      role === 'TRUCK_OWNER' || role === 'FLEET_OWNER' || isAdmin,
    );

    // Bidding hub: need view/manage capability (create alone is not enough to browse auctions)
    const canAccessBidding = allowAndFeature(
      [
        'auctions:view',
        'auctions:create',
        'auctions:manage',
        'bids:view',
        'bids:view_own',
        'bids:view_history',
        'bids:manage',
      ],
      ['auctions:view', 'auctions:create', 'bids:manage', 'bids:view_own'],
      role === 'CARGO_OWNER' || role === 'TRUCK_OWNER' || role === 'BROKER' || isAdmin,
    );

    const canViewAuctions =
      (trustCaps
        ? hasPermission('auctions:view')
        : role === 'TRUCK_OWNER' ||
          role === 'CARGO_OWNER' ||
          role === 'BROKER' ||
          isAdmin) && isFeatureEnabled('auctions:view');

    const canCreateAuction =
      (trustCaps
        ? hasPermission('auctions:create')
        : role === 'CARGO_OWNER' || role === 'BROKER' || isAdmin) &&
      isFeatureEnabled('auctions:create');

    const canCreateBid =
      (trustCaps
        ? hasPermission('bids:create')
        : role === 'TRUCK_OWNER' || isAdmin) && isFeatureEnabled('bids:create');

    const canManageBids =
      (trustCaps
        ? hasPermission('bids:manage')
        : role === 'CARGO_OWNER' || role === 'BROKER' || isAdmin) &&
      isFeatureEnabled('bids:manage');

    const canUseSmartMatching = allowAndFeature(
      ['matching:request', 'matching:view_results', 'matching:respond'],
      ['matching:request', 'matching:respond', 'matching:view_results'],
      role === 'CARGO_OWNER' || role === 'TRUCK_OWNER' || role === 'BROKER' || isAdmin,
    );

    const canAccessTracking = allow(
      ['trips:track', 'trips:view', 'trips:view_assigned'],
      role === 'CARGO_OWNER' ||
        role === 'TRUCK_OWNER' ||
        role === 'DRIVER' ||
        role === 'BROKER' ||
        isAdmin,
    );

    const canAccessAnalytics = allow(
      [
        'analytics:view_own',
        'analytics:view_tenant',
        'analytics:view_all',
        'reports:view',
      ],
      role !== 'DRIVER',
    );

    const canAccessPayments = allow(
      ['payments:view', 'payments:view_own', 'payments:manage', 'invoices:view'],
      role === 'CARGO_OWNER' || role === 'TRUCK_OWNER' || isAdmin,
    );

    const canAccessDocuments = allow(
      ['document:view', 'document:manage'],
      false,
    );

    const canAccessNotifications = true;

    const canAccessAdminPanel = allow(
      ['admin:access', 'admin:view', 'users:permissions.manage'],
      isAdmin,
    );

    const canManageUsers = allow(
      ['users:view_own', 'users:permissions.manage', 'user:manage', 'user:update'],
      isAdmin,
    );

    const canManageTenants =
      trustCaps
        ? hasPermission('tenant:manage')
        : role === 'SUPER_ADMIN';

    const canManagePermissions =
      trustCaps
        ? hasAnyPermission(['permission:manage', 'users:permissions.manage'])
        : role === 'SUPER_ADMIN';

    const canAccessBrokerPanel = allow(
      ['brokers:view', 'brokers:assign', 'bids:manage'],
      role === 'BROKER',
    );

    const canAccessMarketIntelligence = allow(
      ['market:view', 'analytics:view_own'],
      role === 'BROKER' || isAdmin,
    );

    const canManageDisputes = allow(
      ['dispute:manage', 'dispute:view'],
      role === 'BROKER' || isAdmin,
    );

    const canAccessLenderPanel = allow(
      ['lending:view', 'lending:approve', 'lending:policies'],
      role === 'LENDER',
    );

    const canManageLoans = allowAndFeature(
      ['loan:manage', 'loan:view', 'lending:approve', 'lending:create_request', 'lending:view_own'],
      ['lending:approve', 'lending:create_request'],
      role === 'LENDER' || role === 'CARGO_OWNER' || role === 'TRUCK_OWNER',
    );

    const canAccessFinancial = allow(
      ['payments:view', 'payments:view_own', 'invoices:view', 'financial:view'],
      role === 'TRUCK_OWNER' || role === 'CARGO_OWNER' || isAdmin,
    );

    const canAccessRoutes = allow(
      ['route:view', 'route:manage', 'fleet:view'],
      role === 'TRUCK_OWNER' || isAdmin,
    );

    const canAccessTrips = allow(
      [
        'trips:view',
        'trips:view_assigned',
        'trips:start',
        'trips:complete',
        'trips:assign_driver',
      ],
      role === 'DRIVER' ||
        role === 'TRUCK_OWNER' ||
        role === 'CARGO_OWNER' ||
        isAdmin,
    );

    const canStartTrip =
      (trustCaps
        ? hasPermission('trips:start')
        : role === 'DRIVER' || role === 'TRUCK_OWNER') &&
      isFeatureEnabled('trips:start');

    const canAccessSafety = allow(
      ['safety:view', 'safety:manage'],
      role === 'DRIVER' || role === 'TRUCK_OWNER' || isAdmin,
    );

    const canAccessMaintenance = allow(
      ['maintenance:view', 'maintenance:manage', 'fleet:edit'],
      role === 'TRUCK_OWNER' || role === 'DRIVER',
    );

    const canAccessFuel = allow(
      ['fuel:view', 'fuel:manage', 'fleet:view'],
      role === 'TRUCK_OWNER' || role === 'DRIVER',
    );

    const canAccessSettings = true;

    return {
      isLoading,
      permissionsLoaded: trustCaps,
      permissionCount: permissions.length,
      canAccessDashboard,
      canAccessCargoManagement,
      canCreateCargo,
      canAccessFleetManagement,
      canManageFleet,
      canAccessDrivers,
      canAccessBidding,
      canViewAuctions,
      canCreateAuction,
      canCreateBid,
      canManageBids,
      canUseSmartMatching,
      canAccessTracking,
      canAccessAnalytics,
      canAccessPayments,
      canAccessDocuments,
      canAccessNotifications,
      canAccessAdminPanel,
      canManageUsers,
      canManageTenants,
      canManagePermissions,
      canAccessBrokerPanel,
      canAccessMarketIntelligence,
      canManageDisputes,
      canAccessLenderPanel,
      canManageLoans,
      canAccessFinancial,
      canAccessRoutes,
      canAccessTrips,
      canStartTrip,
      canAccessSafety,
      canAccessMaintenance,
      canAccessFuel,
      canAccessSettings,
    };
  }, [
    hasPermission,
    hasAnyPermission,
    isFeatureEnabled,
    isLoading,
    permissions.length,
    user?.role,
  ]);
};
