import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

/**
 * Permission Context Types
 */
interface PermissionContextType {
    permissions: string[];
    isLoading: boolean;
    hasPermission: (permission: string) => boolean;
    hasAnyPermission: (permissions: string[]) => boolean;
    hasAllPermissions: (permissions: string[]) => boolean;
    refetchPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

/**
 * Custom hook to use permission context
 */
export const usePermission = () => {
    const context = useContext(PermissionContext);
    if (!context) {
        throw new Error('usePermission must be used within PermissionProvider');
    }
    return context;
};

/**
 * Permission Provider Component
 * Fetches and caches user permissions from the backend
 */
interface PermissionProviderProps {
    children: ReactNode;
}

export const PermissionProvider = ({ children }: PermissionProviderProps) => {
    const { user } = useAuth();
    const [permissions, setPermissions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [rolePermissionsCache, setRolePermissionsCache] = useState<Record<string, string[]>>({});

    const fetchPermissions = async () => {
        if (!user) {
            setPermissions([]);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const token = localStorage.getItem('accessToken');
            const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

            // Fetch user-specific permissions
            const response = await axios.get(`${baseURL}/auth/permissions`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            let userPermissions: string[] = [];
            if (response.data.success) {
                userPermissions = response.data.data || response.data.data?.permissions || [];
            }

            // Fetch role-based permissions from database if not cached
            // Only fetch if user is an admin (others won't have access to this endpoint)
            const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);
            let rolePermissions: string[] = [];

            if (user.role && isAdmin && !rolePermissionsCache[user.role]) {
                try {
                    const rolesResponse = await axios.get(`${baseURL}/admin/permissions/roles`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });

                    const roles = rolesResponse.data?.data || [];
                    const role = roles.find((r: any) => r.name === user.role);

                    if (role) {
                        rolePermissions = role.permissions.map((p: any) => `${p.resource}:${p.action}`);

                        // Cache role permissions
                        setRolePermissionsCache(prev => ({
                            ...prev,
                            [user.role]: rolePermissions
                        }));
                    }
                } catch (roleError: any) {
                    // Silently handle 403 errors (user doesn't have admin access)
                    // This is expected for non-admin users
                    if (roleError?.response?.status !== 403) {
                        console.warn('Could not fetch role permissions from database, using user permissions only:', roleError);
                    }
                }
            } else if (user.role && rolePermissionsCache[user.role]) {
                rolePermissions = rolePermissionsCache[user.role];
            }

            // Merge user-specific and role-based permissions (user-specific takes precedence)
            const allPermissions = Array.from(new Set([...rolePermissions, ...userPermissions]));
            setPermissions(allPermissions);

        } catch (error: any) {
            console.error('Error fetching permissions:', error);

            // If it's a 500 error, the permissions system might not be set up yet
            // Set empty permissions array and continue (don't block the app)
            if (error?.response?.status === 500) {
                console.warn('Permissions system not available (500 error). Using role-based access only.');
            }

            setPermissions([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch permissions when user changes
    useEffect(() => {
        fetchPermissions();
    }, [user?.id]);

    /**
     * Check if user has a specific permission
     */
    const hasPermission = (permission: string): boolean => {
        if (!user) return false;

        // SUPER_ADMIN has all permissions
        if (user.role === 'SUPER_ADMIN') return true;

        return permissions.includes(permission);
    };

    /**
     * Check if user has ANY of the specified permissions
     */
    const hasAnyPermission = (perms: string[]): boolean => {
        if (!user) return false;

        // SUPER_ADMIN has all permissions
        if (user.role === 'SUPER_ADMIN') return true;

        return perms.some(p => permissions.includes(p));
    };

    /**
     * Check if user has ALL of the specified permissions
     */
    const hasAllPermissions = (perms: string[]): boolean => {
        if (!user) return false;

        // SUPER_ADMIN has all permissions
        if (user.role === 'SUPER_ADMIN') return true;

        return perms.every(p => permissions.includes(p));
    };

    const value: PermissionContextType = {
        permissions,
        isLoading,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        refetchPermissions: fetchPermissions,
    };

    return (
        <PermissionContext.Provider value={value}>
            {children}
        </PermissionContext.Provider>
    );
};
