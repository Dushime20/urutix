export type ParkingWorkspaceTab = 'queue' | 'fees';

export function parkingWorkspaceTab(search: string): ParkingWorkspaceTab {
  const value = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get('tab');
  return value === 'fees' ? 'fees' : 'queue';
}

export function parkingWorkspaceHref(basePath: string, tab: ParkingWorkspaceTab = 'queue') {
  return tab === 'fees' ? `${basePath}?tab=fees` : basePath;
}

export function parkingFeesPath(basePath: string) {
  if (basePath.includes('/dashboard/parking')) {
    return '/dashboard/parking/fees';
  }
  return parkingWorkspaceHref(basePath, 'fees');
}

export function parkingPortalHomeForRole(role?: string, onFees = false) {
  const tab: ParkingWorkspaceTab = onFees ? 'fees' : 'queue';
  if (role === 'SUPER_ADMIN') return parkingWorkspaceHref('/admin/parking-reservations', tab);
  if (role === 'ADMIN') return parkingWorkspaceHref('/admin-operational/parking-reservations', tab);
  if (role === 'TENANT_ADMIN') return parkingWorkspaceHref('/tenant-admin/parking-reservations', tab);
  return onFees ? '/dashboard/parking/fees' : '/dashboard/parking/reservations';
}
