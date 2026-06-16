import api from './api';
import type { Permission, UserPermission, PermissionAuditLog } from '@/types/permission.types';

// ── Types ────────────────────────────────────────────────────────────────────

export interface PermissionItem {
  id: string;
  code: string;          // e.g. "cargo.view"
  resource: string;
  action: string;
  description: string;
  category: string;
  effective: boolean;    // whether user currently has this
  source: 'role' | 'user_granted' | 'user_denied' | 'none';
  override: {
    isGranted: boolean;
    grantedBy: string;
    reason: string;
    expiresAt: string | null;
    grantedAt: string;
  } | null;
}

export interface UserPermissionDetail {
  userId: string;
  userRole: string;
  permissions: PermissionItem[];
}

export const permissionApi = {
  // ── All permissions grouped by module ─────────────────────────────────────
  getAllPermissionsGrouped: async (): Promise<Record<string, PermissionItem[]>> => {
    const response = await api.get('/admin/permissions');
    return response.data?.data || response.data;
  },

  // ── List all defined system permissions (flat list) ───────────────────────
  listAllPermissions: async (): Promise<Permission[]> => {
    const response = await api.get('/admin/permissions/list');
    return response.data;
  },

  // ── Full per-user permission detail with effective status ─────────────────
  getUserPermissionDetail: async (userId: string): Promise<UserPermissionDetail> => {
    const response = await api.get(`/admin/permissions/users/${userId}/detail`);
    return response.data?.data;
  },

  // ── Get effective permissions for a user (legacy) ─────────────────────────
  getUserPermissions: async (userId: string): Promise<{
    userPermissions: string[];
    rolePermissions: string[];
    overrides: UserPermission[];
  }> => {
    const response = await api.get(`/admin/permissions/users/${userId}`);
    return response.data;
  },

  // ── Bulk update user permissions ──────────────────────────────────────────
  updateUserPermissions: async (
    userId: string,
    grants: string[],
    revokes: string[],
    reason?: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/admin/permissions/users/${userId}`, {
      grants,
      revokes,
      reason,
    });
    return response.data;
  },

  // ── Grant a permission override ───────────────────────────────────────────
  grantPermission: async (userId: string, permission: string, reason?: string, expiresAt?: Date) => {
    const response = await api.post('/admin/permissions/grant', {
      userId,
      permission,
      reason,
      expiresAt,
    });
    return response.data;
  },

  // ── Revoke a permission override ──────────────────────────────────────────
  revokePermission: async (userId: string, permission: string) => {
    const response = await api.post('/admin/permissions/revoke', { userId, permission });
    return response.data;
  },

  // ── Deny a permission ─────────────────────────────────────────────────────
  denyPermission: async (userId: string, permission: string, reason?: string) => {
    const response = await api.post('/admin/permissions/deny', { userId, permission, reason });
    return response.data;
  },

  // ── Audit log ─────────────────────────────────────────────────────────────
  getAuditLog: async (userId: string, limit = 20, offset = 0): Promise<PermissionAuditLog[]> => {
    const response = await api.get(`/admin/permissions/audit/${userId}`, {
      params: { limit, offset },
    });
    return response.data;
  },

  // ── Role Matrix ───────────────────────────────────────────────────────────
  getRoleMatrix: async () => {
    const response = await api.get('/admin/permissions/roles/matrix');
    return response.data;
  },

  grantRolePermission: async (role: string, permission: string) => {
    const response = await api.post('/admin/permissions/roles/grant', { role, permission });
    return response.data;
  },

  revokeRolePermission: async (role: string, permission: string) => {
    const response = await api.post('/admin/permissions/roles/revoke', { role, permission });
    return response.data;
  },
};
