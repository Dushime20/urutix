import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus, Edit2, Trash2,
    Check, X, Save, ShieldAlert,
    ShieldCheck, Lock, AlertCircle
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { TranslatedText } from '../../components/translated-text';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import ModernLoader from '../../components/common/ModernLoader';

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

    if (matrixLoading && !matrixData) {
        return (
            <AdminPageLayout
                title={<TranslatedText text="Permissions & Roles" />}
                description={<TranslatedText text="Manage roles, permissions, and access control across the platform" />}
            >
                <ModernLoader isLoading={true} type="page" showStats={true} />
            </AdminPageLayout>
        );
    }

    return (
        <AdminPageLayout
            title={<TranslatedText text="Permissions & Roles" />}
            description={<TranslatedText text="Manage roles, permissions, and access control across the platform" />}
            actions={
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowCreateRole(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#2c5173] hover:bg-[#1e3850] text-white rounded-xl font-bold transition-all hover:scale-105 active:scale-95 text-xs uppercase tracking-wider"
                    >
                        <Plus size={16} /> <TranslatedText text="Create Role" />
                    </button>
                </div>
            }
        >
            {/* Tabs */}
            <div className="bg-white rounded-[24px] border border-slate-100 mb-6 overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50/50">
                    <nav className="flex gap-1 px-6">
                        <button
                            onClick={() => setActiveTab('matrix')}
                            className={`py-4 px-4 border-b-2 font-black text-xs uppercase tracking-widest transition-colors ${activeTab === 'matrix'
                                ? 'border-[#2c5173] text-[#2c5173]'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <TranslatedText text="Permission Matrix" />
                        </button>
                        <button
                            onClick={() => setActiveTab('roles')}
                            className={`py-4 px-4 border-b-2 font-black text-xs uppercase tracking-widest transition-colors ${activeTab === 'roles'
                                ? 'border-[#2c5173] text-[#2c5173]'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <TranslatedText text="Roles" /> ({rolesData?.length || 0})
                        </button>
                    </nav>
                </div>

                {/* Permission Matrix Tab */}
                {activeTab === 'matrix' && (
                    <div className="p-6">
                        {matrixLoading ? (
                            <div className="space-y-3 p-6 animate-pulse">
                                {[1,2,3,4,5,6].map(i => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="w-32 h-4 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0" />
                                        <div className="flex gap-3 flex-1">
                                            {[1,2,3,4].map(j => <div key={j} className="h-8 w-16 bg-slate-100 dark:bg-slate-800 rounded-lg" />)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                {/* Info Banner */}
                                <div className="mb-8 p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-4">
                                    <div className="flex-shrink-0 p-2 bg-slate-100 rounded-lg">
                                        <AlertCircle className="w-5 h-5 text-[#2c5173]" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-[#2c5173] mb-1 text-sm">Permission Matrix Guide</h4>
                                        <p className="text-xs text-[#2c5173] leading-relaxed font-medium">
                                            Toggle permissions for each role by clicking the checkboxes. System roles are protected and cannot be modified directly.
                                            Use <span className="font-bold underline">Create Role</span> to define custom permission sets for your team.
                                        </p>
                                    </div>
                                </div>

                                {/* Matrix Table */}
                                <div className="overflow-x-auto rounded-xl border border-slate-100">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50/80 border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-black text-[10px] text-slate-400 uppercase tracking-widest">Permission Resource</th>
                                                {matrixData?.roles?.map((role: Role) => (
                                                    <th key={role.id} className="px-4 py-4 text-center font-black text-[10px] text-slate-400 uppercase tracking-widest min-w-[100px]">
                                                        {role.name}
                                                        {role.isSystem && <Lock size={10} className="inline ml-1 text-[#2c5173]" />}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 bg-white">
                                            {matrixData?.permissions?.map((permission: Permission) => (
                                                <tr key={permission.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-700 text-xs mb-0.5 group-hover:text-[#2c5173] transition-colors">
                                                                {permission.resource}.{permission.action}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-medium">{permission.description}</span>
                                                        </div>
                                                    </td>
                                                    {matrixData?.roles?.map((role: Role) => {
                                                        const hasPermission = role.permissions.some((p: Permission) => p.id === permission.id);
                                                        return (
                                                            <td key={role.id} className="px-4 py-3 text-center">
                                                                <button
                                                                    onClick={() => !role.isSystem && togglePermission(role.id, permission.id, role.permissions)}
                                                                    disabled={role.isSystem}
                                                                    className={`w-8 h-8 rounded-lg inline-flex items-center justify-center transition-all duration-200 ${hasPermission
                                                                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100'
                                                                        : 'bg-slate-50 text-slate-300 hover:bg-slate-100 hover:text-slate-400'
                                                                        } ${role.isSystem ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110 active:scale-95'}`}
                                                                >
                                                                    {hasPermission ? <Check size={14} strokeWidth={3} /> : <X size={14} />}
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
                    <div className="p-8">
                        {rolesLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 animate-pulse">
                                {[1,2,3,4,5,6].map(i => (
                                    <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-[24px]" />
                                ))}
                            </div>
                        ) : rolesData && rolesData.length === 0 ? (
                            // Empty state
                            <div className="text-center py-24 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-6">
                                    <ShieldAlert className="text-[#2c5173] w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-black text-slate-800 mb-2">No Roles Defined</h3>
                                <p className="text-slate-500 mb-8 max-w-md mx-auto text-sm">
                                    Create custom roles to assign specific permissions to your team members and control access levels.
                                </p>
                                <button
                                    onClick={() => setShowCreateRole(true)}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#2c5173] hover:bg-[#1e3850] text-white rounded-xl font-bold transition-all hover:-translate-y-1"
                                >
                                    <Plus size={16} /> Create First Role
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Header with additional Create button */}
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800">Available Roles</h3>
                                        <p className="text-sm text-slate-500 font-medium">
                                            {rolesData?.filter((r: Role) => !r.isSystem).length || 0} Custom roles • {rolesData?.filter((r: Role) => r.isSystem).length || 0} System roles
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowCreateRole(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-[#2c5173] hover:bg-[#1e3850] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                                    >
                                        <Plus size={14} /> New Role
                                    </button>
                                </div>

                                {/* Roles Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {rolesData?.map((role: Role) => (
                                        <div key={role.id} className="p-6 bg-white border border-slate-100 rounded-[24px] hover:border-slate-200 transition-all group">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-xl ${role.isSystem ? 'bg-slate-100 text-[#2c5173]' : 'bg-slate-50 text-slate-600 group-hover:bg-slate-100 group-hover:text-[#2c5173]'} transition-colors`}>
                                                        {role.isSystem ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-800">{role.name}</h3>
                                                        {role.isSystem && <span className="text-[10px] text-[#2c5173] font-black uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded">System</span>}
                                                    </div>
                                                </div>
                                                {!role.isSystem && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setEditingRole(role)}
                                                            className="p-1.5 text-slate-400 hover:text-[#2c5173] hover:bg-slate-100 rounded-lg transition-colors"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteRole(role.id)}
                                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 mb-4 line-clamp-2 min-h-[2.5em]">{role.description}</p>
                                            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Permissions</span>
                                                <span className="text-xs font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                                    {role.permissions?.length || 0}
                                                </span>
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
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[24px] p-8 max-w-lg w-full animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-xl">
                                <ShieldCheck className="text-[#2c5173] w-6 h-6" />
                            </div>
                            Create New Role
                        </h2>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Role Name</label>
                                <input
                                    type="text"
                                    value={newRole.name}
                                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2c5173] focus:border-transparent outline-none transition-all font-medium"
                                    placeholder="e.g., Content Manager"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Description</label>
                                <textarea
                                    value={newRole.description}
                                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2c5173] focus:border-transparent outline-none transition-all font-medium resize-none"
                                    rows={3}
                                    placeholder="Describe the purpose and access level of this role..."
                                />
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Quick Start Templates</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setNewRole({
                                            name: 'Viewer',
                                            description: 'Read-only access to most resources.',
                                            permissionIds: []
                                        })}
                                        className="text-left p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all group"
                                    >
                                        <div className="font-bold text-slate-700 text-sm group-hover:text-[#2c5173]">Viewer</div>
                                        <div className="text-xs text-slate-400 mt-1">Read-only access</div>
                                    </button>
                                    <button
                                        onClick={() => setNewRole({
                                            name: 'Operation Manager',
                                            description: 'Can manage daily operations (users, loads) but not system settings.',
                                            permissionIds: []
                                        })}
                                        className="text-left p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all group"
                                    >
                                        <div className="font-bold text-slate-700 text-sm group-hover:text-[#2c5173]">Manager</div>
                                        <div className="text-xs text-slate-400 mt-1">Daily operations</div>
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => {
                                        setShowCreateRole(false);
                                        setNewRole({ name: '', description: '', permissionIds: [] });
                                    }}
                                    className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateRole}
                                    disabled={!newRole.name}
                                    className="flex-1 px-4 py-3 bg-[#2c5173] text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[#1e3850] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5"
                                >
                                    Create Role
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
