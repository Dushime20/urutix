import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    FaPlus, FaEdit, FaTrash,
    FaCheck, FaTimes, FaSave, FaUserShield
} from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import AdminHeader from '../../components/Admin/AdminHeader';

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
            const response = await axios.get('/api/admin/permissions/matrix');
            return response.data;
        },
    });

    // Fetch all roles
    const { data: rolesData, isLoading: rolesLoading } = useQuery({
        queryKey: ['roles'],
        queryFn: async () => {
            const response = await axios.get('/api/admin/permissions/roles');
            return response.data;
        },
    });

    // Create role mutation
    const createRoleMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await axios.post('/api/admin/permissions/roles', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            queryClient.invalidateQueries({ queryKey: ['permission-matrix'] });
            setShowCreateRole(false);
            setNewRole({ name: '', description: '', permissionIds: [] });
            toast.success('Role created successfully');
        },
        onError: () => {
            toast.error('Failed to create role');
        },
    });

    // Update role mutation
    const updateRoleMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const response = await axios.put(`/api/admin/permissions/roles/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            queryClient.invalidateQueries({ queryKey: ['permission-matrix'] });
            setEditingRole(null);
            toast.success('Role updated successfully');
        },
        onError: () => {
            toast.error('Failed to update role');
        },
    });

    // Delete role mutation
    const deleteRoleMutation = useMutation({
        mutationFn: async (id: string) => {
            await axios.delete(`/api/admin/permissions/roles/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            queryClient.invalidateQueries({ queryKey: ['permission-matrix'] });
            toast.success('Role deleted successfully');
        },
        onError: () => {
            toast.error('Failed to delete role');
        },
    });

    // Bulk assign permissions
    const bulkAssignMutation = useMutation({
        mutationFn: async ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => {
            const response = await axios.post(`/api/admin/permissions/roles/${roleId}/bulk-assign`, { permissionIds });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permission-matrix'] });
            toast.success('Permissions updated successfully');
        },
    });

    const handleCreateRole = () => {
        createRoleMutation.mutate(newRole);
    };

    const handleUpdateRole = (role: Role) => {
        const permissionIds = role.permissions.map(p => p.id);
        updateRoleMutation.mutate({ id: role.id, data: { permissionIds } });
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
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Dark Header */}
            <div className="bg-[#0f172a] text-white">
                <AdminHeader
                    searchPlaceholder="Search permissions or roles..."
                    onSearch={(val) => {
                        // Optional: client-side filter
                        console.log('Searching permissions:', val);
                    }}
                />

                {/* Hero Section */}
                <div className="bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
                    <div className="max-w-[1536px] mx-auto px-4 md:px-8 lg:px-12 xl:px-20 py-8 pb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">Permissions & Roles</h1>
                            <p className="text-slate-400 max-w-xl">Manage roles, permissions, and access control across the platform.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowCreateRole(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-600/20 transition-all"
                            >
                                <FaPlus size={14} /> Create Role
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-[1536px] mx-auto px-4 md:px-8 lg:px-12 xl:px-20 -mt-8 pb-12">
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
                            ) : (
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
            </main>
        </div>
    );
};

export default EnhancedPermissions;
