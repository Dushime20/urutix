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
                headers: { Authorization: `Bearer ${token}` }
            });

            let userPermissions: string[] = [];
            if (response.data.success) {
                userPermissions = response.data.data || response.data.data?.permissions || [];
            }

            // For admins: also fetch per-user permission detail from RBAC system
            const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);
            if (isAdmin) {
                try {
                    const detailRes = await axios.get(`${baseURL}/admin/permissions/users/${user.id}/detail`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (detailRes.data?.success && detailRes.data?.data?.permissions) {
                        const rbacPerms = (detailRes.data.data.permissions as any[])
                            .filter((p: any) => p.effective)
                            .map((p: any) => p.code);
                        userPermissions = Array.from(new Set([...userPermissions, ...rbacPerms]));
                    }
                } catch (_) {
                    // Non-critical: fall back to role-based
                }
            }

            setPermissions(userPermissions);

        } catch (error: any) {
            console.error('Error fetching permissions:', error);
            if (error?.response?.status === 500) {
                console.warn('Permissions system not available. Using role-based access only.');
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
