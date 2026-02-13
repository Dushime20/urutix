import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    FaPlus, FaEdit, FaTrash,
    FaCheck, FaTimes, FaSave, FaUserShield
} from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';

interface Permission {
    id: string;
    resource: string;
    action: string;
    description: string;
    category: string;
}

interface Role {
    id: string;
    name: string;
    description: string;
    isSystem: boolean;
    permissions: Permission[];
}

const EnhancedPermissions: React.FC = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'matrix' | 'roles'>('matrix');
    const [showCreateRole, setShowCreateRole] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [newRole, setNewRole] = useState({ name: '', description: '', permissionIds: [] as string[] });

    // Fetch permission matrix
    const { data: matrixData, isLoading: matrixLoading } = useQuery({
        queryKey: ['permission-matrix'],
        queryFn: async () => {
            const response = await axios.get('/api/admin/permissions/roles/matrix');
            return response.data;
        },
    });

    // Fetch all roles - using the list endpoint and extracting unique roles
    const { data: rolesData, isLoading: rolesLoading } = useQuery({
        queryKey: ['roles'],
        queryFn: async () => {
            const response = await axios.get('/api/admin/permissions/roles');
            return response.data?.data || [];
        },
    });

    // Create role mutation
    const createRoleMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await axios.post('/api/admin/permissions/roles', data);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            queryClient.invalidateQueries({ queryKey: ['permission-matrix'] });
            setShowCreateRole(false);
            setNewRole({ name: '', description: '', permissionIds: [] });
            toast.success(data.message || 'Role created successfully');
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create role';
            toast.error(errorMessage);
        },
    });

    // Update role mutation
    const updateRoleMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const response = await axios.put(`/api/admin/permissions/roles/${id}`, data);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            queryClient.invalidateQueries({ queryKey: ['permission-matrix'] });
            setEditingRole(null);
            toast.success(data.message || 'Role updated successfully');
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update role';
            toast.error(errorMessage);
        },
    });

    // Delete role mutation
    const deleteRoleMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await axios.delete(`/api/admin/permissions/roles/${id}`);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            queryClient.invalidateQueries({ queryKey: ['permission-matrix'] });
            toast.success(data.message || 'Role deleted successfully');
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete role';
            toast.error(errorMessage);
        },
    });

    // Bulk assign permissions
    const bulkAssignMutation = useMutation({
        mutationFn: async ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => {
            const response = await axios.post(`/api/admin/permissions/roles/${roleId}/bulk-assign`, { permissionIds });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['permission-matrix'] });
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            toast.success(data.message || 'Permissions updated successfully');
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update permissions';
            toast.error(errorMessage);
        },
    });

    const handleCreateRole = () => {
        createRoleMutation.mutate(newRole);
    };

    const handleUpdateRole = (role: Role) => {
        const permissionIds = role.permissions.map(p => p.id);
        updateRoleMutation.mutate({ 
            id: role.id, 
            data: { 
                name: role.name,
                description: role.description 
            } 
        });
    };

    const handleDeleteRole = (id: string) => {
        if (window.confirm('Are you sure you want to delete this role?')) {
            deleteRoleMutation.mutate(id);
        }
    };

    const togglePermission = (roleId: string, permissionId: string, currentPermissions: Permission[]) => {
        const hasPermission = currentPermissions.some(p => p.id === permissionId);
        const newPermissionIds = hasPermission
            ? currentPermissions.filter(p => p.id !== permissionId).map(p => p.id)
            : [...currentPermissions.map(p => p.id), permissionId];

        bulkAssignMutation.mutate({ roleId, permissionIds: newPermissionIds });
    };

    return (
        <AdminPageLayout
            title="Permissions & Roles"
            description="Manage roles, permissions, and access control across the platform"
            actions={
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowCreateRole(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
                    >
                        <FaPlus size={16} /> Create Role
                    </button>
                </div>
            }
        >
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
                <div className="border-b border-slate-200">
                    <nav className="flex gap-1 px-4">
                        <button
                            onClick={() => setActiveTab('matrix')}
                            className={`py-3 px-4 border-b-2 font-bold text-sm transition-colors ${activeTab === 'matrix'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Permission Matrix
                        </button>
                        <button
                            onClick={() => setActiveTab('roles')}
                            className={`py-3 px-4 border-b-2 font-bold text-sm transition-colors ${activeTab === 'roles'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Roles ({rolesData?.length || 0})
                        </button>
                    </nav>
                </div>

                {/* Permission Matrix Tab */}
                {activeTab === 'matrix' && (
                    <div className="p-6">
                        {matrixLoading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                                <p className="mt-4 text-slate-600">Loading permission matrix...</p>
                            </div>
                        ) : (
                            <>
                                {/* Info Banner */}
                                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                                            <span className="text-white text-xs font-bold">i</span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-blue-900 mb-1">Permission Matrix</h4>
                                            <p className="text-sm text-blue-800">
                                                Toggle permissions for each role by clicking the checkboxes. System roles are protected and cannot be modified. 
                                                <span className="font-medium"> Create custom roles</span> to define specific permission sets for your team.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Matrix Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 border-b-2 border-slate-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-bold text-slate-700">Permission</th>
                                                {matrixData?.roles?.map((role: Role) => (
                                                    <th key={role.id} className="px-4 py-3 text-center font-bold text-slate-700">
                                                        {role.name}
                                                        {role.isSystem && <span className="ml-1 text-xs text-indigo-600">(System)</span>}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {matrixData?.permissions?.map((permission: Permission) => (
                                                <tr key={permission.id} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3">
                                                        <div>
                                                        <p className="font-medium text-slate-800">{permission.resource}.{permission.action}</p>
                                                        <p className="text-xs text-slate-500">{permission.description}</p>
                                                    </div>
                                                </td>
                                                {matrixData?.roles?.map((role: Role) => {
                                                    const hasPermission = role.permissions.some((p: Permission) => p.id === permission.id);
                                                    return (
                                                        <td key={role.id} className="px-4 py-3 text-center">
                                                            <button
                                                                onClick={() => !role.isSystem && togglePermission(role.id, permission.id, role.permissions)}
                                                                disabled={role.isSystem}
                                                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${hasPermission
                                                                    ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                                                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                                                    } ${role.isSystem ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                                            >
                                                                {hasPermission ? <FaCheck /> : <FaTimes />}
                                                            </button>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            </>
                        )}
                    </div>
                )}

                {/* Roles Tab */}
                {activeTab === 'roles' && (
                    <div className="p-6">
                        {rolesLoading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                                <p className="mt-4 text-slate-600">Loading roles...</p>
                            </div>
                        ) : rolesData && rolesData.length === 0 ? (
                            // Empty state
                            <div className="text-center py-16">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                                    <FaUserShield className="text-indigo-600 text-2xl" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">No Roles Yet</h3>
                                <p className="text-slate-600 mb-6 max-w-md mx-auto">
                                    Create custom roles to define specific permission sets for your team members.
                                </p>
                                <button
                                    onClick={() => setShowCreateRole(true)}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-lg shadow-indigo-600/20 transition-all"
                                >
                                    <FaPlus size={16} /> Create Your First Role
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Header with additional Create button */}
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">All Roles</h3>
                                        <p className="text-sm text-slate-600">
                                            {rolesData?.filter((r: Role) => !r.isSystem).length || 0} custom roles, {rolesData?.filter((r: Role) => r.isSystem).length || 0} system roles
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowCreateRole(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                                    >
                                        <FaPlus size={14} /> New Role
                                    </button>
                                </div>

                                {/* Roles Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {rolesData?.map((role: Role) => (
                                        <div key={role.id} className="p-4 bg-white border border-slate-200 rounded-lg hover:border-indigo-200 transition-colors">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h3 className="font-bold text-slate-800">{role.name}</h3>
                                                    {role.isSystem && <span className="text-xs text-indigo-600 font-medium">System Role</span>}
                                                </div>
                                                {!role.isSystem && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setEditingRole(role)}
                                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                        >
                                                            <FaEdit size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteRole(role.id)}
                                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                        >
                                                            <FaTrash size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-600 mb-3">{role.description}</p>
                                            <div className="text-xs text-slate-500">
                                                {role.permissions?.length || 0} permissions
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Create Role Modal */}
            {showCreateRole && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <h2 className="text-xl font-bold mb-4">Create New Role</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role Name</label>
                                <input
                                    type="text"
                                    value={newRole.name}
                                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g., Content Manager"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    value={newRole.description}
                                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    rows={3}
                                    placeholder="Describe the role..."
                                />
                            </div>

                            <div className="border-t border-slate-200 pt-4">
                                <h3 className="text-sm font-bold text-slate-800 mb-2">Quick Start Templates</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setNewRole({
                                            name: 'Viewer',
                                            description: 'Read-only access to most resources.',
                                            permissionIds: [] // Backend handles template logic if we pass template name, or we pre-fill. 
                                            // For simplicity, we'll let user create and then edit permissions, or we can fetch templates.
                                            // Let's keep it simple: Just pre-fill name/desc for now
                                        })}
                                        className="text-left p-2 border border-slate-200 rounded hover:bg-slate-50 text-xs"
                                    >
                                        <div className="font-bold">Viewer</div>
                                        <div className="text-slate-500 truncate">Read-only access</div>
                                    </button>
                                    <button
                                        onClick={() => setNewRole({
                                            name: 'Operation Manager',
                                            description: 'Can manage daily operations (users, loads) but not system settings.',
                                            permissionIds: []
                                        })}
                                        className="text-left p-2 border border-slate-200 rounded hover:bg-slate-50 text-xs"
                                    >
                                        <div className="font-bold">Manager</div>
                                        <div className="text-slate-500 truncate">Daily operations</div>
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleCreateRole}
                                    disabled={!newRole.name}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Create Role
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCreateRole(false);
                                        setNewRole({ name: '', description: '', permissionIds: [] });
                                    }}
                                    className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminPageLayout>
    );
};

export default EnhancedPermissions;
