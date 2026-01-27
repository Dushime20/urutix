import api from './api';
import type { Permission, UserPermission, PermissionAuditLog } from '@/types/permission.types';

export const permissionApi = {
    // List all defined system permissions
    listAllPermissions: async (): Promise<Permission[]> => {
        const response = await api.get('/admin/permissions/list');
        return response.data;
    },

    // Get effective permissions for a user
    getUserPermissions: async (userId: string): Promise<{
        userPermissions: string[];
        rolePermissions: string[];
        overrides: UserPermission[];
    }> => {
        const response = await api.get(`/admin/permissions/users/${userId}`);
        return response.data;
    },

    // Grant a permission override
    grantPermission: async (userId: string, permission: string, reason?: string, expiresAt?: Date) => {
        const response = await api.post('/admin/permissions/grant', {
            userId,
            permission,
            reason,
            expiresAt
        });
        return response.data;
    },

    // Revoke a permission override
    revokePermission: async (userId: string, permission: string) => {
        const response = await api.post('/admin/permissions/revoke', {
            userId,
            permission
        });
        return response.data;
    },

    // Deny a permission
    denyPermission: async (userId: string, permission: string, reason?: string) => {
        const response = await api.post('/admin/permissions/deny', {
            userId,
            permission,
            reason
        });
        return response.data;
    },

    // Get audit log
    getAuditLog: async (userId: string, limit = 20, offset = 0): Promise<PermissionAuditLog[]> => {
        const response = await api.get(`/admin/permissions/audit/${userId}`, {
            params: { limit, offset }
        });
        return response.data;
    },

    // Get Role Permission Matrix
    getRoleMatrix: async (): Promise<Array<{ role: string; permission: string }>> => {
        const response = await api.get('/admin/permissions/roles/matrix');
        return response.data;
    },

    // Grant Role Permission
    grantRolePermission: async (role: string, permission: string) => {
        const response = await api.post('/admin/permissions/roles/grant', { role, permission });
        return response.data;
    },

    // Revoke Role Permission
    revokeRolePermission: async (role: string, permission: string) => {
        const response = await api.post('/admin/permissions/roles/revoke', { role, permission });
        return response.data;
    }
};
