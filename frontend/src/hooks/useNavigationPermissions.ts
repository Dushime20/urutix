import { useMemo } from 'react';
import { usePermission } from '../contexts/PermissionContext';
import { useAuth } from '../contexts/AuthContext';

export const useNavigationPermissions = () => {
  const { hasPermission, hasAnyPermission, isFeatureEnabled } = usePermission();
  const { user } = useAuth();

  return useMemo(() => {
    // Dashboard access
    const canAccessDashboard = hasAnyPermission([
      'dashboard:view',
      'dashboard:access'
    ]) || user?.role !== undefined;

    // Cargo Management
    const canAccessCargoManagement = hasAnyPermission([
      'cargo:view',
      'cargo:manage',
      'cargo:create'
    ]) || user?.role === 'CARGO_OWNER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    const canCreateCargo =
      (hasPermission('cargo:create') || user?.role === 'CARGO_OWNER') &&
      isFeatureEnabled('cargo:create');

    // Fleet Management
    const canAccessFleetManagement = hasAnyPermission([
      'fleet:view',
      'fleet:manage',
      'truck:view'
    ]) || user?.role === 'TRUCK_OWNER' || user?.role === 'FLEET_OWNER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    const canManageFleet = hasPermission('fleet:manage') || user?.role === 'TRUCK_OWNER' || user?.role === 'FLEET_OWNER';

    // Driver Management
    const canAccessDrivers = hasAnyPermission([
      'driver:view',
      'driver:manage'
    ]) || user?.role === 'TRUCK_OWNER' || user?.role === 'FLEET_OWNER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    // Bidding — respect global kill switch even when role fallback applies
    const canAccessBidding =
      (hasAnyPermission([
        'bids:view',
        'bids:create',
        'bids:manage',
        'bid:view',
        'bid:create',
        'bid:manage',
      ]) ||
        user?.role === 'CARGO_OWNER' ||
        user?.role === 'TRUCK_OWNER' ||
        user?.role === 'BROKER') &&
      (isFeatureEnabled('bids:create') ||
        isFeatureEnabled('bids:manage') ||
        isFeatureEnabled('auctions:create'));

    const canCreateBid =
      (hasPermission('bids:create') || user?.role === 'TRUCK_OWNER') &&
      isFeatureEnabled('bids:create');

    const canUseSmartMatching =
      (hasAnyPermission(['matching:request', 'matching:view_results', 'matching:respond']) ||
        user?.role === 'CARGO_OWNER' ||
        user?.role === 'TRUCK_OWNER' ||
        user?.role === 'BROKER') &&
      (isFeatureEnabled('matching:request') ||
        isFeatureEnabled('matching:respond') ||
        isFeatureEnabled('matching:view_results'));

    // Tracking
    const canAccessTracking = hasAnyPermission([
      'tracking:view',
      'location:view'
    ]) || user?.role === 'CARGO_OWNER' || user?.role === 'TRUCK_OWNER' || user?.role === 'DRIVER';

    // Analytics
    const canAccessAnalytics = hasAnyPermission([
      'analytics:view',
      'reports:view'
    ]) || user?.role !== 'DRIVER'; // Most roles can access analytics

    // Payments
    const canAccessPayments = hasAnyPermission([
      'payment:view',
      'payment:manage'
    ]) || user?.role === 'CARGO_OWNER' || user?.role === 'TRUCK_OWNER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    // Documents
    const canAccessDocuments = hasAnyPermission([
      'document:view',
      'document:manage'
    ]); // Removed redundant || true

    // Notifications
    const canAccessNotifications = true; // All users can access notifications

    // Admin Functions
    const canAccessAdminPanel = hasAnyPermission([
      'admin:access',
      'admin:view'
    ]) || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'TENANT_ADMIN';

    const canManageUsers = hasAnyPermission([
      'user:manage',
      'user:update'
    ]) || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'TENANT_ADMIN';

    const canManageTenants = hasPermission('tenant:manage') || user?.role === 'SUPER_ADMIN';

    const canManagePermissions = hasPermission('permission:manage') || user?.role === 'SUPER_ADMIN';

    // Broker Functions
    const canAccessBrokerPanel = hasAnyPermission([
      'broker:access',
      'broker:view'
    ]) || user?.role === 'BROKER';

    const canAccessMarketIntelligence = hasPermission('market:view') || user?.role === 'BROKER' || user?.role === 'ADMIN';

    const canManageDisputes = hasAnyPermission([
      'dispute:manage',
      'dispute:view'
    ]) || user?.role === 'BROKER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    // Lender Functions
    const canAccessLenderPanel = hasAnyPermission([
      'lender:access',
      'lender:view'
    ]) || user?.role === 'LENDER';

    const canManageLoans =
      (hasAnyPermission(['loan:manage', 'loan:view', 'lending:approve', 'lending:create_request']) ||
        user?.role === 'LENDER' ||
        user?.role === 'CARGO_OWNER') &&
      (isFeatureEnabled('lending:approve') || isFeatureEnabled('lending:create_request'));

    // Financial Management
    const canAccessFinancial = hasAnyPermission([
      'financial:view',
      'financial:manage'
    ]) || user?.role === 'TRUCK_OWNER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    // Route Management
    const canAccessRoutes = hasAnyPermission([
      'route:view',
      'route:manage'
    ]) || user?.role === 'TRUCK_OWNER' || user?.role === 'ADMIN' || user?.role === 'TENANT_ADMIN';

    // Trip Management
    const canAccessTrips = hasAnyPermission([
      'trip:view',
      'trip:manage',
      'trips:start',
      'trips:complete'
    ]) || user?.role === 'DRIVER' || user?.role === 'TRUCK_OWNER' || user?.role === 'CARGO_OWNER';

    const canStartTrip =
      (hasPermission('trips:start') ||
        user?.role === 'DRIVER' ||
        user?.role === 'TRUCK_OWNER') &&
      isFeatureEnabled('trips:start');

    // Safety & Compliance
    const canAccessSafety = hasAnyPermission([
      'safety:view',
      'safety:manage'
    ]) || user?.role === 'DRIVER' || user?.role === 'TRUCK_OWNER' || user?.role === 'ADMIN';

    // Maintenance
    const canAccessMaintenance = hasAnyPermission([
      'maintenance:view',
      'maintenance:manage'
    ]) || user?.role === 'TRUCK_OWNER' || user?.role === 'DRIVER';

    // Fuel Management
    const canAccessFuel = hasAnyPermission([
      'fuel:view',
      'fuel:manage'
    ]) || user?.role === 'TRUCK_OWNER' || user?.role === 'DRIVER';

    // Settings
    const canAccessSettings = true; // All users can access their own settings

    return {
      canAccessDashboard,
      canAccessCargoManagement,
      canCreateCargo,
      canAccessFleetManagement,
      canManageFleet,
      canAccessDrivers,
      canAccessBidding,
      canCreateBid,
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
  }, [hasPermission, hasAnyPermission, isFeatureEnabled, user?.role]);
};
