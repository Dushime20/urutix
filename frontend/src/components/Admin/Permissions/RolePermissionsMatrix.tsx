import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionApi } from '../../../services/permissionApi';
import {
    FaCheck, FaTimes, FaSpinner, FaFilter, FaDownload, FaCopy,
    FaChartBar, FaInfoCircle, FaLock, FaUnlock, FaCheckDouble,
    FaShieldAlt, FaChevronDown, FaChevronRight, FaSearch,
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { UserRole } from '@/types/permission.types';
import type { Permission } from '@/types/permission.types';

// ── Role colour palette ────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    SUPER_ADMIN:  { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200', dot: 'bg-purple-500'  },
    ADMIN:        { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',   dot: 'bg-blue-500'    },
    CARGO_OWNER:  { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',  dot: 'bg-amber-500'   },
    TRUCK_OWNER:  { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200',  dot: 'bg-green-500'   },
    DRIVER:       { bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200',   dot: 'bg-teal-500'    },
    BROKER:       { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200', dot: 'bg-orange-500'  },
    AGENT:        { bg: 'bg-cyan-50',    text: 'text-cyan-700',    border: 'border-cyan-200',   dot: 'bg-cyan-500'    },
    LENDER:       { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200', dot: 'bg-indigo-500'  },
};
const roleColor = (role: string) =>
    ROLE_COLORS[role] ?? { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' };

// ── RoleDetailModal ────────────────────────────────────────────────────────
interface RoleDetailModalProps {
    role: string;
    onClose: () => void;
    onSaved: () => void;
}

const RoleDetailModal: React.FC<RoleDetailModalProps> = ({ role, onClose, onSaved }) => {
    const queryClient = useQueryClient();
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
    const isSuperAdmin = role === 'SUPER_ADMIN';
    const colors = roleColor(role);

    // ── Fetch all system permissions ─────────────────────────────────────────
    const { data: allPermsRaw = [], isLoading: loadingPerms } = useQuery({
        queryKey: ['modal-all-permissions'],
        queryFn: async () => {
            const res = await import('../../../services/api').then(m => m.default.get('/admin/permissions/list'));
            return res.data || [];
        },
    });

    // ── Fetch this role's current permissions ─────────────────────────────────
    const { data: roleData, isLoading: loadingRole } = useQuery({
        queryKey: ['modal-role-detail', role],
        queryFn: async () => {
            const api = await import('../../../services/api').then(m => m.default);
            // Try to find the role by name from the matrix endpoint
            const res = await api.get('/admin/permissions/roles/matrix');
            const matrix = res.data;
            const rolesList: any[] = matrix?.roles ?? matrix?.data?.roles ?? [];
            return rolesList.find((r: any) => r.name === role) ?? null;
        },
    });

    const isLoading = loadingPerms || loadingRole;

    // Normalise all permissions — ensure .name is always set
    const allPerms: any[] = useMemo(() =>
        (allPermsRaw as any[]).map((p: any) => ({
            ...p,
            name: p.name ?? `${p.resource}.${p.action}`,
        })),
    [allPermsRaw]);

    // IDs currently granted to this role
    const grantedIds = useMemo((): Set<string> => {
        if (isSuperAdmin) return new Set(allPerms.map(p => p.id));
        const granted: any[] = roleData?.permissions ?? [];
        return new Set(granted.map((p: any) => p.id).filter(Boolean));
    }, [roleData, allPerms, isSuperAdmin]);

    // Local checkbox state (initialised once data loads)
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [initialised, setInitialised] = useState(false);

    // Initialise selected from grantedIds when data arrives
    React.useEffect(() => {
        if (!isLoading && !initialised && allPerms.length > 0) {
            setSelected(new Set(grantedIds));
            setInitialised(true);
        }
    }, [isLoading, initialised, grantedIds, allPerms.length]);

    const isDirty = useMemo(() => {
        if (!initialised) return false;
        if (grantedIds.size !== selected.size) return true;
        for (const id of selected) if (!grantedIds.has(id)) return true;
        return false;
    }, [selected, grantedIds, initialised]);

    // Bulk-assign mutation (uses role ID)
    const { mutate: bulkAssign, isPending: isSaving } = useMutation({
        mutationFn: async (permIds: string[]) => {
            if (!roleData?.id) throw new Error('Role ID not found');
            const api = await import('../../../services/api').then(m => m.default);
            const res = await api.post(`/admin/permissions/roles/${roleData.id}/bulk-assign`, { permissionIds: permIds });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-role-matrix'] });
            queryClient.invalidateQueries({ queryKey: ['modal-role-detail', role] });
            toast.success(`Permissions updated for ${role.replace(/_/g, ' ')}`);
            onSaved();
            onClose();
        },
        onError: () => toast.error('Failed to save permissions'),
    });

    // Grouping
    const grouped = useMemo(() => {
        const groups: Record<string, any[]> = {};
        allPerms.forEach(p => {
            const key = p.resource || 'other';
            if (!groups[key]) groups[key] = [];
            groups[key].push(p);
        });
        return groups;
    }, [allPerms]);

    const resources = Object.keys(grouped).sort();
    const total = allPerms.length;
    const grantedCount = selected.size;
    const pct = total > 0 ? Math.round((grantedCount / total) * 100) : 0;

    const toggleGroup = (resource: string) =>
        setCollapsed(prev => { const n = new Set(prev); n.has(resource) ? n.delete(resource) : n.add(resource); return n; });

    const toggleGroupSelect = (resource: string) => {
        const perms = grouped[resource] || [];
        const allChecked = perms.every(p => selected.has(p.id));
        setSelected(prev => {
            const n = new Set(prev);
            perms.forEach(p => allChecked ? n.delete(p.id) : n.add(p.id));
            return n;
        });
    };

    const togglePerm = (id: string) =>
        setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[24px] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">

                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${colors.bg} ${colors.text}`}>
                            <FaShieldAlt size={18} />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                                {role.replace(/_/g, ' ')}
                                {isSuperAdmin && (
                                    <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                                        Immutable
                                    </span>
                                )}
                            </h2>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                                {isLoading ? 'Loading…' : `${grantedCount} of ${total} permissions granted (${pct}%)`}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
                        <FaTimes />
                    </button>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-slate-100">
                    <div className={`h-full ${colors.dot} transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>

                {/* Permissions list */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <FaSpinner className="animate-spin text-[#2c5173] text-2xl" />
                        </div>
                    ) : (
                        <>
                            {isSuperAdmin && (
                                <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-100 rounded-xl text-xs text-purple-700 font-semibold">
                                    <FaLock size={11} />
                                    SUPER_ADMIN has all permissions by default and cannot be modified.
                                </div>
                            )}
                            {resources.length === 0 ? (
                                <div className="text-center py-10 text-slate-400 text-sm">No permissions found.</div>
                            ) : (
                                resources.map(resource => {
                                    const perms = grouped[resource];
                                    const checkedInGroup = perms.filter(p => selected.has(p.id)).length;
                                    const allGroupChecked = checkedInGroup === perms.length;
                                    const isCollapsed = collapsed.has(resource);
                                    return (
                                        <div key={resource} className="border border-slate-100 rounded-2xl overflow-hidden">
                                            {/* Group header */}
                                            <div
                                                className="flex items-center justify-between px-4 py-3 bg-slate-50/80 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                                onClick={() => toggleGroup(resource)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {isCollapsed
                                                        ? <FaChevronRight size={11} className="text-slate-400" />
                                                        : <FaChevronDown size={11} className="text-slate-400" />
                                                    }
                                                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">{resource}</span>
                                                    <span className="text-[9px] bg-white border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                                                        {checkedInGroup}/{perms.length}
                                                    </span>
                                                </div>
                                                {!isSuperAdmin && (
                                                    <button
                                                        onClick={e => { e.stopPropagation(); toggleGroupSelect(resource); }}
                                                        className={`text-[10px] font-black px-3 py-1 rounded-lg transition-colors ${
                                                            allGroupChecked
                                                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                                : 'bg-[#2c5173]/10 text-[#2c5173] hover:bg-[#2c5173]/20'
                                                        }`}
                                                    >
                                                        {allGroupChecked ? 'Deselect All' : 'Select All'}
                                                    </button>
                                                )}
                                            </div>
                                            {/* Permission rows */}
                                            {!isCollapsed && (
                                                <div className="divide-y divide-slate-50">
                                                    {perms.map(p => {
                                                        const checked = isSuperAdmin ? true : selected.has(p.id);
                                                        return (
                                                            <label
                                                                key={p.id}
                                                                className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                                                                    !isSuperAdmin ? 'cursor-pointer hover:bg-slate-50' : 'cursor-not-allowed opacity-70'
                                                                } ${checked ? 'bg-emerald-50/40' : ''}`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    disabled={isSuperAdmin}
                                                                    onChange={() => !isSuperAdmin && togglePerm(p.id)}
                                                                    className="w-4 h-4 rounded border-slate-300 text-[#2c5173] focus:ring-[#2c5173] focus:ring-offset-0 flex-shrink-0 cursor-pointer disabled:cursor-not-allowed"
                                                                />
                                                                <div className="min-w-0 flex-1">
                                                                    <span className="text-xs font-bold text-slate-700 font-mono">
                                                                        {p.name || `${p.resource}.${p.action}`}
                                                                    </span>
                                                                    {p.description && (
                                                                        <p className="text-[10px] text-slate-400 mt-0.5">{p.description}</p>
                                                                    )}
                                                                </div>
                                                                {checked && (
                                                                    <span className="flex-shrink-0 text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                                                        Granted
                                                                    </span>
                                                                )}
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-4">
                    <p className="text-xs text-slate-400">
                        {isSuperAdmin ? (
                            <span className="text-purple-600 font-semibold flex items-center gap-1.5"><FaLock size={10} /> Read-only</span>
                        ) : isDirty ? (
                            <span className="text-amber-600 font-bold">⚠ Unsaved changes</span>
                        ) : (
                            'No changes'
                        )}
                    </p>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-200 transition-colors">
                            {isSuperAdmin ? 'Close' : 'Cancel'}
                        </button>
                        {!isSuperAdmin && (
                            <button
                                onClick={() => bulkAssign(Array.from(selected))}
                                disabled={isSaving || !isDirty}
                                className="px-5 py-2.5 bg-[#2c5173] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#1e3850] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                            >
                                {isSaving
                                    ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                                    : <><FaCheck size={11} /> Save Changes</>
                                }
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

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
    // ── Role detail modal state ────────────────────────────────────────────
    const [activeRoleModal, setActiveRoleModal] = useState<string | null>(null);

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

    // ── All permissions (full list) from rawMatrix.permissions ───────────────
    // rawMatrix.permissions contains every permission in the system.
    // Fallback to the listAllPermissions query result if not present.
    const allPermissionsForModal: Permission[] = useMemo(() => {
        if (!rawMatrix) return permissions as Permission[];
        const fromMatrix: any[] = rawMatrix.permissions ?? rawMatrix.data?.permissions ?? [];
        if (fromMatrix.length > 0) {
            // Ensure each permission has a .name field (resource.action)
            return fromMatrix.map((p: any) => ({
                ...p,
                name: p.name ?? `${p.resource}.${p.action}`,
            }));
        }
        return permissions as Permission[];
    }, [rawMatrix, permissions]);

    // ── Map role name → role id (for bulk-assign endpoint) ───────────────────
    const roleIdMap = useMemo((): Record<string, string> => {
        if (!rawMatrix || Array.isArray(rawMatrix)) return {};
        const rolesList: any[] = rawMatrix.roles ?? rawMatrix.data?.roles ?? [];
        const map: Record<string, string> = {};
        rolesList.forEach((r: any) => { if (r.id && r.name) map[r.name] = r.id; });
        return map;
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

            {/* ── Role Detail Modal (opened from column header) ─────────────── */}
            {activeRoleModal && (
                <RoleDetailModal
                    role={activeRoleModal}
                    onClose={() => setActiveRoleModal(null)}
                    onSaved={() => queryClient.invalidateQueries({ queryKey: ['admin-role-matrix'] })}
                />
            )}

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
                                            <button
                                                onClick={() => setActiveRoleModal(role)}
                                                title={`View / edit ${role} permissions`}
                                                className="text-sm hover:text-indigo-600 hover:underline transition-colors"
                                            >
                                                {role.replace('_', ' ')}
                                            </button>
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
