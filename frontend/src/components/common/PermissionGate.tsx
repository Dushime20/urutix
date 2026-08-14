import React from 'react';
import { usePermission } from '../contexts/PermissionContext';

interface PermissionGateProps {
  /** User needs ANY of these capabilities */
  anyOf?: string[];
  /** User needs ALL of these capabilities */
  allOf?: string[];
  /** Also require feature kill-switch to be enabled */
  requireFeatureEnabled?: boolean;
  children: React.ReactNode;
  /** Shown when access denied (default: null = hide) */
  fallback?: React.ReactNode;
}

/**
 * Declarative UI gate — mirrors backend CapabilityService checks.
 * Use instead of hardcoding user.role === 'TRUCK_OWNER'.
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  anyOf,
  allOf,
  requireFeatureEnabled = true,
  children,
  fallback = null,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isFeatureEnabled, isLoading } =
    usePermission();

  if (isLoading) return null;

  const codes = anyOf || allOf || [];
  if (!codes.length) return <>{children}</>;

  const featureOk = !requireFeatureEnabled || codes.every((c) => isFeatureEnabled(c));
  if (!featureOk) return <>{fallback}</>;

  const allowed = anyOf
    ? hasAnyPermission(anyOf)
    : allOf
      ? hasAllPermissions(allOf)
      : true;

  return allowed ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGate;
