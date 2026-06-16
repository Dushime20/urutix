import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionApi } from '../../../services/permissionApi';
import {
    FaCheck, FaTimes, FaSpinner, FaFilter, FaDownload, FaCopy,
    FaChartBar, FaInfoCircle, FaLock, FaUnlock, FaCheckDouble
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { UserRole } from '@/types/permission.types';
import type { Permission } from '@/types/permission.types';

interface RolePermissionsMatrixProps {
    className?: string;
}

export const RolePermissionsMatrix: React.FC<RolePermissionsMatrixProps> = ({ className = '' }) => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedResource, setSelectedResource] = useState<string>('all');
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [showStats, setShowStats] = useState(false);
    const [bulkMode, setBulkMode] = useState(false);
    const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

    // Fetch all permissions
    const { data: permissions = [], isLoading: isLoadingPermissions } = useQuery({
        queryKey: ['admin-permissions'],
        queryFn: permissionApi.listAllPermissions
    });

    // Fetch existing role matrix — backend returns { roles, permissions }
    // We normalise it here into a flat { role, permission } array so the rest
    // of the component can just call hasPermission(role, permName).
    const { data: rawMatrix, isLoading: isLoadingMatrix } = useQuery({
        queryKey: ['admin-role-matrix'],
        queryFn: permissionApi.getRoleMatrix
    });

    // Normalise: [{role, permission}] from the roles[].permissions[] nesting
    const roleMatrix: { role: string; permission: string }[] = useMemo(() => {
        if (!rawMatrix) return [];
        // If the backend returns a flat array directly (legacy shape), keep it
        if (Array.isArray(rawMatrix)) return rawMatrix;
        // New shape: { roles: [{name, permissions:[{name}]}], permissions: [] }
        const rolesList: any[] = rawMatrix.roles ?? rawMatrix.data?.roles ?? [];
        const flat: { role: string; permission: string }[] = [];
        rolesList.forEach((r: any) => {
            const perms: any[] = Array.isArray(r.permissions) ? r.permissions : [];
            perms.forEach((p: any) => {
                const permKey = p.name ?? `${p.resource}.${p.action}`;
                flat.push({ role: r.name, permission: permKey });
            });
        });
        return flat;
    }, [rawMatrix]);

    // Determine current state helper
    const hasPermission = (role: string, permission: string) => {
        if (role === 'SUPER_ADMIN') return true;
        const matrixArray = Array.isArray(roleMatrix) ? roleMatrix : [];
        return matrixArray.some((rp: any) => rp.role === role && rp.permission === permission);
    };

    // Mutation for Grant
    const { mutate: grantPermission } = useMutation({
        mutationFn: ({ role, permission }: { role: string; permission: string }) =>
            permissionApi.grantRolePermission(role, permission),
        onSuccess: (_, variables) => {
            queryClient.setQueryData(['admin-role-matrix'], (old: any) => {
                const oldArray = Array.isArray(old) ? old : [];
                return [...oldArray, { role: variables.role, permission: variables.permission }];
            });
            toast.success(`✓ Granted ${variables.permission} to ${variables.role}`);
        },
        onError: () => toast.error('Failed to grant permission')
    });

    // Mutation for Revoke
    const { mutate: revokePermission } = useMutation({
        mutationFn: ({ role, permission }: { role: string; permission: string }) =>
            permissionApi.revokeRolePermission(role, permission),
        onSuccess: (_, variables) => {
            queryClient.setQueryData(['admin-role-matrix'], (old: any) => {
                const oldArray = Array.isArray(old) ? old : [];
                return oldArray.filter((rp: any) => !(rp.role === variables.role && rp.permission === variables.permission));
            });
            toast.success(`✓ Revoked ${variables.permission} from ${variables.role}`);
        },
        onError: () => toast.error('Failed to revoke permission')
    });

    const handleToggle = (role: string, permission: string, currentStatus: boolean) => {
        if (role === 'SUPER_ADMIN') {
            toast.error('SUPER_ADMIN permissions cannot be modified');
            return;
        }

        if (currentStatus) {
            revokePermission({ role, permission });
        } else {
            grantPermission({ role, permission });
        }
    };

    // Bulk operations
    const handleBulkGrant = () => {
        if (!selectedRole || selectedPermissions.size === 0) {
            toast.error('Please select a role and permissions');
            return;
        }

        selectedPermissions.forEach(permission => {
            if (!hasPermission(selectedRole, permission)) {
                grantPermission({ role: selectedRole, permission });
            }
        });
        setSelectedPermissions(new Set());
        setBulkMode(false);
        toast.success(`Granted ${selectedPermissions.size} permissions to ${selectedRole}`);
    };

    const handleBulkRevoke = () => {
        if (!selectedRole || selectedPermissions.size === 0) {
            toast.error('Please select a role and permissions');
            return;
        }

        selectedPermissions.forEach(permission => {
            if (hasPermission(selectedRole, permission)) {
                revokePermission({ role: selectedRole, permission });
            }
        });
        setSelectedPermissions(new Set());
        setBulkMode(false);
        toast.success(`Revoked ${selectedPermissions.size} permissions from ${selectedRole}`);
    };

    // Copy role permissions
    const handleCopyRole = (sourceRole: string, targetRole: string) => {
        if (targetRole === 'SUPER_ADMIN') {
            toast.error('Cannot modify SUPER_ADMIN');
            return;
        }

        const sourcePermissions = roleMatrix
            .filter((rp: any) => rp.role === sourceRole)
            .map((rp: any) => rp.permission);

        sourcePermissions.forEach((permission: string) => {
            if (!hasPermission(targetRole, permission)) {
                grantPermission({ role: targetRole, permission });
            }
        });

        toast.success(`Copied ${sourcePermissions.length} permissions from ${sourceRole} to ${targetRole}`);
    };

    // Export to CSV
    const handleExport = () => {
        const csvContent = [
            ['Permission', ...roles].join(','),
            ...permissions.map((p: any) =>
                [p.name, ...roles.map(role => hasPermission(role, p.name) ? 'Yes' : 'No')].join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `role-permissions-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.success('Exported to CSV');
    };

    // Group permissions by resource
    const groupedPermissions = useMemo(() => {
        const groups: Record<string, Permission[]> = {};
        permissions.forEach((p: any) => {
            if (!groups[p.resource]) groups[p.resource] = [];
            groups[p.resource].push(p);
        });
        return groups;
    }, [permissions]);

    // Roles list
    const roles = Object.values(UserRole);

    // Calculate statistics
    const stats = useMemo(() => {
        const roleStats = roles.map(role => {
            const matrixArray = Array.isArray(roleMatrix) ? roleMatrix : [];
            const granted = matrixArray.filter((rp: any) => rp.role === role).length;
            const total = permissions.length;
            return {
                role,
                granted,
                total,
                percentage: total > 0 ? Math.round((granted / total) * 100) : 0
            };
        });
        return roleStats;
    }, [roleMatrix, permissions, roles]);

    const filteredResources = Object.keys(groupedPermissions).filter(resource => {
        if (selectedResource !== 'all' && resource !== selectedResource) return false;
        if (!searchTerm) return true;
        const resourceMatch = resource.toLowerCase().includes(searchTerm.toLowerCase());
        const permMatch = groupedPermissions[resource].some((p: any) =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.action.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return resourceMatch || permMatch;
    }).sort();

    if (isLoadingPermissions || isLoadingMatrix) {
        return (
            <div className="flex h-96 items-center justify-center">
                <FaSpinner className="animate-spin text-indigo-600 text-4xl" />
            </div>
        );
    }

    const resourceList = Object.keys(groupedPermissions).sort();

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Enhanced Controls Bar */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[300px]">
                        <input
                            type="text"
                            placeholder="Search permissions, resources, or actions..."
                            className="w-full px-4 py-2.5 pl-10 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <span className="absolute left-3 top-3 text-indigo-400">🔍</span>
                    </div>

                    {/* Resource Filter */}
                    <div className="flex items-center gap-2">
                        <FaFilter className="text-indigo-600" />
                        <select
                            value={selectedResource}
                            onChange={(e) => setSelectedResource(e.target.value)}
                            className="px-4 py-2.5 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                        >
                            <option value="all">All Resources ({resourceList.length})</option>
                            {resourceList.map(resource => (
                                <option key={resource} value={resource}>
                                    {resource} ({groupedPermissions[resource].length})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowStats(!showStats)}
                            className="px-4 py-2.5 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-2 text-sm font-medium text-indigo-700"
                        >
                            <FaChartBar /> {showStats ? 'Hide' : 'Show'} Stats
                        </button>
                        <button
                            onClick={handleExport}
                            className="px-4 py-2.5 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-2 text-sm font-medium text-indigo-700"
                        >
                            <FaDownload /> Export
                        </button>
                        <button
                            onClick={() => setBulkMode(!bulkMode)}
                            className={`px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${bulkMode
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50'
                                }`}
                        >
                            <FaCheckDouble /> Bulk Mode
                        </button>
                    </div>
                </div>

                {/* Bulk Operations Panel */}
                {bulkMode && (
                    <div className="mt-4 p-4 bg-white rounded-lg border border-indigo-200">
                        <div className="flex items-center gap-4">
                            <select
                                value={selectedRole || ''}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="px-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                            >
                                <option value="">Select Role</option>
                                {roles.filter(r => r !== 'SUPER_ADMIN').map(role => (
                                    <option key={role} value={role}>{role.replace('_', ' ')}</option>
                                ))}
                            </select>
                            <span className="text-sm text-slate-600">
                                {selectedPermissions.size} permission(s) selected
                            </span>
                            <div className="flex gap-2 ml-auto">
                                <button
                                    onClick={handleBulkGrant}
                                    disabled={!selectedRole || selectedPermissions.size === 0}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
                                >
                                    <FaUnlock /> Grant Selected
                                </button>
                                <button
                                    onClick={handleBulkRevoke}
                                    disabled={!selectedRole || selectedPermissions.size === 0}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
                                >
                                    <FaLock /> Revoke Selected
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedPermissions(new Set());
                                        setBulkMode(false);
                                        setSelectedRole(null);
                                    }}
                                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 text-sm font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Statistics Panel */}
            {showStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                    {stats.map(stat => (
                        <div key={stat.role} className="bg-white rounded-lg p-4 border border-slate-200 hover:shadow-md transition-shadow">
                            <div className="text-xs font-bold text-slate-500 mb-1">{stat.role.replace('_', ' ')}</div>
                            <div className="text-2xl font-black text-indigo-600 mb-1">{stat.granted}</div>
                            <div className="text-xs text-slate-500">of {stat.total} ({stat.percentage}%)</div>
                            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                                    style={{ width: `${stat.percentage}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-6 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <FaCheck className="text-emerald-600" size={10} />
                    </div>
                    <span className="font-medium">Granted</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
                        <FaTimes className="text-slate-300" size={10} />
                    </div>
                    <span className="font-medium">Revoked</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                    <FaInfoCircle className="text-indigo-500" />
                    <span className="font-medium">Click to toggle • SUPER_ADMIN is immutable</span>
                </div>
            </div>

            {/* Matrix Table */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-indigo-200">
                            <tr>
                                {bulkMode && (
                                    <th className="px-4 py-4 text-center font-bold text-slate-700 w-12 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    const allPerms = new Set(permissions.map((p: any) => p.name));
                                                    setSelectedPermissions(allPerms);
                                                } else {
                                                    setSelectedPermissions(new Set());
                                                }
                                            }}
                                        />
                                    </th>
                                )}
                                <th className={`px-6 py-4 text-left font-bold text-slate-700 min-w-[250px] sticky ${bulkMode ? 'left-12' : 'left-0'} bg-slate-50 z-10 border-r border-slate-200`}>
                                    <div className="flex items-center gap-2">
                                        <FaFilter className="text-indigo-500" />
                                        Resource / Permission
                                    </div>
                                </th>
                                {roles.map(role => (
                                    <th key={role} className="px-4 py-4 text-center font-bold text-slate-700 min-w-[110px] group">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Role</span>
                                            <span className="text-sm">{role.replace('_', ' ')}</span>
                                            {role !== 'SUPER_ADMIN' && (
                                                <button
                                                    onClick={() => {
                                                        const sourceRole = prompt('Copy permissions from role:', 'ADMIN');
                                                        if (sourceRole && roles.includes(sourceRole as any)) {
                                                            handleCopyRole(sourceRole, role);
                                                        }
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-1"
                                                >
                                                    <FaCopy size={8} /> Copy
                                                </button>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredResources.map(resource => (
                                <React.Fragment key={resource}>
                                    {/* Resource Section Header */}
                                    <tr className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
                                        <td colSpan={roles.length + (bulkMode ? 2 : 1)} className="px-6 py-3 text-xs font-black text-indigo-700 uppercase tracking-wider border-y border-indigo-100">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                                                {resource}
                                                <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold">
                                                    {groupedPermissions[resource].length} permissions
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                    {/* Permissions Rows */}
                                    {groupedPermissions[resource]
                                        .filter((p: any) => !searchTerm ||
                                            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            p.action.toLowerCase().includes(searchTerm.toLowerCase())
                                        )
                                        .map((p: any) => (
                                            <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors group">
                                                {bulkMode && (
                                                    <td className="px-4 py-3 text-center sticky left-0 bg-white group-hover:bg-indigo-50/30 z-10 border-r border-slate-100">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedPermissions.has(p.name)}
                                                            onChange={(e) => {
                                                                const newSet = new Set(selectedPermissions);
                                                                if (e.target.checked) {
                                                                    newSet.add(p.name);
                                                                } else {
                                                                    newSet.delete(p.name);
                                                                }
                                                                setSelectedPermissions(newSet);
                                                            }}
                                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                    </td>
                                                )}
                                                <td className={`px-6 py-3 border-r border-slate-100 sticky ${bulkMode ? 'left-12' : 'left-0'} bg-white group-hover:bg-indigo-50/30 z-10`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                                                            <span className="text-xs font-bold text-indigo-700">
                                                                {p.action.split(':')[1]?.charAt(0).toUpperCase() || 'P'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-slate-700">{p.action}</div>
                                                            <div className="text-xs text-slate-400 font-mono mt-0.5">{p.name}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                {roles.map(role => {
                                                    const isGranted = hasPermission(role, p.name);
                                                    const isSuperAdmin = role === 'SUPER_ADMIN';
                                                    return (
                                                        <td key={`${role}-${p.name}`} className="px-4 py-3 text-center">
                                                            <div className="flex justify-center">
                                                                <button
                                                                    disabled={isSuperAdmin}
                                                                    onClick={() => handleToggle(role, p.name, isGranted)}
                                                                    title={isSuperAdmin ? 'SUPER_ADMIN permissions are immutable' : `Click to ${isGranted ? 'revoke' : 'grant'}`}
                                                                    className={`
                                                                        w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 font-bold
                                                                        ${isGranted
                                                                            ? 'bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700 hover:from-emerald-200 hover:to-emerald-300 shadow-sm'
                                                                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-500'
                                                                        }
                                                                        ${isSuperAdmin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110 active:scale-95'}
                                                                    `}
                                                                >
                                                                    {isGranted ? <FaCheck size={14} /> : <FaTimes size={12} />}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary Footer */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-6">
                        <span className="text-slate-600">
                            <span className="font-bold text-slate-900">{permissions.length}</span> total permissions
                        </span>
                        <span className="text-slate-600">
                            <span className="font-bold text-slate-900">{resourceList.length}</span> resources
                        </span>
                        <span className="text-slate-600">
                            <span className="font-bold text-slate-900">{roles.length}</span> roles
                        </span>
                    </div>
                    <div className="text-xs text-slate-500">
                        Last updated: {new Date().toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    );
};
