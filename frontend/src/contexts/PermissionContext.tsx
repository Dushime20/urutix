import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

/**
 * Permission Context Types
 */
interface PermissionContextType {
    permissions: string[];
    disabledFeatures: string[];
    isLoading: boolean;
    hasPermission: (permission: string) => boolean;
    hasAnyPermission: (permissions: string[]) => boolean;
    hasAllPermissions: (permissions: string[]) => boolean;
    isFeatureEnabled: (permission: string) => boolean;
    can: (permission: string) => boolean;
    cannot: (permission: string) => boolean;
    refetchPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

const normalize = (permission: string) => {
    if (!permission) return '';
    if (permission.includes(':')) return permission.trim();
    if (permission.includes('.')) {
        const [resource, action] = permission.split('.');
        return `${resource.trim()}:${action.trim()}`;
    }
    return permission.trim();
};

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
 * Fetches effective capabilities (permissions minus globally disabled features)
 */
interface PermissionProviderProps {
    children: ReactNode;
}

export const PermissionProvider = ({ children }: PermissionProviderProps) => {
    const { user } = useAuth();
    const [permissions, setPermissions] = useState<string[]>([]);
    const [disabledFeatures, setDisabledFeatures] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPermissions = async (opts?: { background?: boolean }) => {
        if (!user) {
            setPermissions([]);
            setDisabledFeatures([]);
            setIsLoading(false);
            return;
        }

        try {
            // Background refresh (interval / focus) must not flip isLoading —
            // consumers early-return on loading and would unmount open modals/dialogs.
            if (!opts?.background) {
                setIsLoading(true);
            }
            const token = localStorage.getItem('accessToken');
            const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

            // Prefer capabilities endpoint (permissions + disabled features)
            try {
                const capsRes = await axios.get(`${baseURL}/auth/capabilities`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (capsRes.data?.success && capsRes.data?.data) {
                    const data = capsRes.data.data;
                    setPermissions(data.permissions || data.allPermissions || []);
                    setDisabledFeatures(data.disabledFeatures || []);
                    return;
                }
            } catch (_) {
                // Fall back to legacy permissions endpoint
            }

            const response = await axios.get(`${baseURL}/auth/permissions`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            let userPermissions: string[] = [];
            if (response.data.success) {
                userPermissions = response.data.data || response.data.data?.permissions || [];
            }

            const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);
            if (isAdmin) {
                try {
                    const detailRes = await axios.get(`${baseURL}/admin/permissions/users/${user.id}/detail`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (detailRes.data?.success && detailRes.data?.data?.permissions) {
                        const rbacPerms = (detailRes.data.data.permissions as any[])
                            .filter((p: any) => p.effective)
                            .map((p: any) => normalize(p.code));
                        userPermissions = Array.from(new Set([...userPermissions, ...rbacPerms]));
                    }
                } catch (_) {
                    // Non-critical
                }
            }

            setPermissions(userPermissions);
            setDisabledFeatures([]);
        } catch (error: any) {
            console.error('Error fetching permissions:', error);
            if (error?.response?.status === 500) {
                console.warn('Permissions system not available. Using role-based access only.');
            }
            setPermissions([]);
            setDisabledFeatures([]);
        } finally {
            if (!opts?.background) {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchPermissions();
        if (!user) return;

        const refreshInBackground = () => {
            void fetchPermissions({ background: true });
        };

        const interval = window.setInterval(refreshInBackground, 20_000);

        const onFocus = () => {
            refreshInBackground();
        };
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') onFocus();
        };
        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            window.clearInterval(interval);
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [user?.id]);

    const isFeatureEnabled = (permission: string): boolean => {
        const code = normalize(permission);
        return !disabledFeatures.map(normalize).includes(code);
    };

    const hasPermission = (permission: string): boolean => {
        if (!user) return false;
        const code = normalize(permission);
        if (!isFeatureEnabled(code)) return false;
        // SUPER_ADMIN retains UI access for admin tools, but feature kill-switches still hide business actions
        if (user.role === 'SUPER_ADMIN' && !disabledFeatures.length) return true;
        if (user.role === 'SUPER_ADMIN' && isFeatureEnabled(code)) {
            // Super admin can manage; for business caps still respect global OFF via isFeatureEnabled above
            return true;
        }
        return permissions.map(normalize).includes(code);
    };

    const hasAnyPermission = (perms: string[]): boolean => {
        if (!user) return false;
        return perms.some((p) => hasPermission(p));
    };

    const hasAllPermissions = (perms: string[]): boolean => {
        if (!user) return false;
        return perms.every((p) => hasPermission(p));
    };

    const can = (permission: string) => hasPermission(permission);
    const cannot = (permission: string) => !hasPermission(permission);

    const value: PermissionContextType = {
        permissions,
        disabledFeatures,
        isLoading,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isFeatureEnabled,
        can,
        cannot,
        refetchPermissions: fetchPermissions,
    };

    return (
        <PermissionContext.Provider value={value}>
            {children}
        </PermissionContext.Provider>
    );
};
