import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export interface Permission {
    id: string;
    name: string;
    resource: string;
    action: string;
    description: string;
    category: string;
}

export interface Role {
    id: string;
    name: string;
    description: string;
    isSystem: boolean;
    permissions: Permission[];
}

/**
 * Hook to fetch role permissions from database
 * @param roleName - Optional role name, defaults to current user's role
 */
export function useRolePermissions(roleName?: string) {
    const { user } = useAuth();
    const effectiveRole = roleName || user?.role;

    return useQuery({
        queryKey: ['role-permissions', effectiveRole],
        queryFn: async () => {
            if (!effectiveRole) {
                return { permissions: [], permissionNames: [] };
            }
            
            try {
                const response = await axios.get('/api/admin/permissions/roles');
                const roles: Role[] = response.data?.data || [];
                const role = roles.find(r => r.name === effectiveRole);
                
                if (!role) {
                    return { permissions: [], permissionNames: [] };
                }

                const permissionNames = role.permissions.map(p => `${p.resource}:${p.action}`);
                
                return {
                    permissions: role.permissions,
                    permissionNames
                };
            } catch (error: any) {
                // Silently handle 403 errors (user doesn't have admin access)
                // This is expected for non-admin users
                if (error?.response?.status !== 403) {
                    console.error('Error fetching role permissions:', error);
                }
                return { permissions: [], permissionNames: [] };
            }
        },
        enabled: !!effectiveRole,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        retry: 2,
    });
}

/**
 * Hook to fetch all available permissions
 */
export function useAllPermissions() {
    return useQuery({
        queryKey: ['all-permissions'],
        queryFn: async () => {
            try {
                const response = await axios.get('/api/admin/permissions/list');
                return response.data?.permissions || [];
            } catch (error) {
                console.error('Error fetching all permissions:', error);
                return [];
            }
        },
        staleTime: 10 * 60 * 1000, // Cache for 10 minutes
        retry: 2,
    });
}

/**
 * Hook to check if current user's role has specific permission
 * @param permission - Permission string (e.g., 'cargo:create')
 * @returns boolean indicating if user has permission
 */
export function useHasPermission(permission: string): boolean {
    const { user } = useAuth();
    const { data, isLoading } = useRolePermissions();
    
    // SUPER_ADMIN always has all permissions
    if (user?.role === 'SUPER_ADMIN') {
        return true;
    }

    // While loading, deny access (fail-safe)
    if (isLoading) {
        return false;
    }
    
    return data?.permissionNames.includes(permission) || false;
}

/**
 * Hook to check if current user has any of the specified permissions
 * @param permissions - Array of permission strings
 * @returns boolean indicating if user has at least one permission
 */
export function useHasAnyPermission(permissions: string[]): boolean {
    const { user } = useAuth();
    const { data, isLoading } = useRolePermissions();
    
    if (user?.role === 'SUPER_ADMIN') {
        return true;
    }

    if (isLoading) {
        return false;
    }
    
    return permissions.some(p => data?.permissionNames.includes(p)) || false;
}

/**
 * Hook to check if current user has all of the specified permissions
 * @param permissions - Array of permission strings
 * @returns boolean indicating if user has all permissions
 */
export function useHasAllPermissions(permissions: string[]): boolean {
    const { user } = useAuth();
    const { data, isLoading } = useRolePermissions();
    
    if (user?.role === 'SUPER_ADMIN') {
        return true;
    }

    if (isLoading) {
        return false;
    }
    
    return permissions.every(p => data?.permissionNames.includes(p)) || false;
}

/**
 * Hook to get permissions grouped by category
 */
export function usePermissionsByCategory() {
    const { data: allPermissions } = useAllPermissions();

    const grouped = (allPermissions || []).reduce((acc: Record<string, Permission[]>, perm: Permission) => {
        const category = perm.category || 'Other';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(perm);
        return acc;
    }, {});

    return grouped;
}

/**
 * Hook to check if a role has a specific permission (for admin use)
 * @param roleName - Role name to check
 * @param permission - Permission string
 */
export function useRoleHasPermission(roleName: string, permission: string): boolean {
    const { data, isLoading } = useRolePermissions(roleName);
    
    if (roleName === 'SUPER_ADMIN') {
        return true;
    }

    if (isLoading) {
        return false;
    }
    
    return data?.permissionNames.includes(permission) || false;
}
