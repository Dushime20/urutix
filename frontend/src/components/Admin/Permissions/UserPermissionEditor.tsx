import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { permissionApi } from '../../../services/permissionApi';
import type { Permission, UserPermission, PermissionAuditLog } from '@/types/permission.types';
import { format } from 'date-fns';

interface UserPermissionEditorProps {
    userId: string;
    userName: string;
    userRole: string;
    onClose: () => void;
}

export const UserPermissionEditor: React.FC<UserPermissionEditorProps> = ({ userId, userName, userRole, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [userEffectivePermissions, setUserEffectivePermissions] = useState<string[]>([]);
    const [userOverrides, setUserOverrides] = useState<UserPermission[]>([]);
    const [auditLog, setAuditLog] = useState<PermissionAuditLog[]>([]);
    const [activeTab, setActiveTab] = useState<'permissions' | 'audit'>('permissions');
    const [searchTerm, setSearchTerm] = useState('');

    const [grantForm, setGrantForm] = useState({
        permission: '',
        reason: '',
        expiresAt: ''
    });

    useEffect(() => {
        loadData();
    }, [userId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [permissions, userPerms, audits] = await Promise.all([
                permissionApi.listAllPermissions(),
                permissionApi.getUserPermissions(userId),
                permissionApi.getAuditLog(userId)
            ]);
            setAllPermissions(permissions);
            setUserEffectivePermissions(userPerms.userPermissions);
            setUserOverrides(userPerms.overrides);
            setAuditLog(audits);
        } catch (error) {
            console.error('Failed to load permission data', error);
            toast.error('Failed to load permission data');
        } finally {
            setLoading(false);
        }
    };

    const handleGrant = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await permissionApi.grantPermission(
                userId,
                grantForm.permission,
                grantForm.reason,
                grantForm.expiresAt ? new Date(grantForm.expiresAt) : undefined
            );
            toast.success('Permission granted');
            setGrantForm({ permission: '', reason: '', expiresAt: '' });
            loadData();
        } catch (error) {
            toast.error('Failed to grant permission');
        }
    };

    const handleRevoke = async (permission: string) => {
        if (!confirm('Are you sure you want to revoke this permission override?')) return;
        try {
            await permissionApi.revokePermission(userId, permission);
            toast.success('Permission revoked');
            loadData();
        } catch (error) {
            toast.error('Failed to revoke permission');
        }
    };

    // Group permissions by resource
    const groupedPermissions = allPermissions.reduce((acc, perm) => {
        if (!acc[perm.resource]) {
            acc[perm.resource] = [];
        }
        acc[perm.resource].push(perm);
        return acc;
    }, {} as Record<string, Permission[]>);

    const filteredResources = Object.keys(groupedPermissions).filter(resource => {
        const perms = groupedPermissions[resource];
        const matchesSearch = resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
            perms.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description?.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch;
    });

    if (loading) return (
        <div className="p-8 flex justify-center bg-white dark:bg-slate-900 h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
    );

    return (
        <div className="bg-white dark:bg-slate-900 h-full flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-900/80">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{userName}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
                            {userRole}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {userOverrides.length} Custom Permissions
                        </span>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-500 dark:text-slate-400"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-slate-800 px-6 bg-white dark:bg-slate-900">
                <button
                    className={`px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'permissions'
                        ? 'border-b-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                    onClick={() => setActiveTab('permissions')}
                >
                    Permissions
                </button>
                <button
                    className={`px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'audit'
                        ? 'border-b-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                    onClick={() => setActiveTab('audit')}
                >
                    Audit Log
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-900">
                {activeTab === 'permissions' ? (
                    <div className="space-y-6">
                        {/* Grant New Override */}
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/40">
                            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                Grant Permission Override
                            </h3>
                            <form onSubmit={handleGrant} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                <div className="md:col-span-5">
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Permission</label>
                                    <select
                                        className="w-full border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-2"
                                        value={grantForm.permission}
                                        onChange={e => setGrantForm({ ...grantForm, permission: e.target.value })}
                                        required
                                    >
                                        <option value="">Select permission...</option>
                                        {allPermissions.map(p => (
                                            <option key={p.id} value={p.name}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-4">
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Reason (Optional)</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-2 placeholder-gray-400 dark:placeholder-slate-500"
                                        value={grantForm.reason}
                                        onChange={e => setGrantForm({ ...grantForm, reason: e.target.value })}
                                        placeholder="Reason for grant..."
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <button type="submit" className="w-full bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-sm">
                                        Grant Override
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search permissions..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <svg className="w-4 h-4 text-gray-400 dark:text-slate-500 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>

                        {/* Permissions Grid */}
                        <div className="space-y-6">
                            {filteredResources.map(resource => (
                                <div key={resource}>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-slate-600"></span>
                                        {resource}
                                    </h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        {groupedPermissions[resource].filter(p =>
                                            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            p.description?.toLowerCase().includes(searchTerm.toLowerCase())
                                        ).map(perm => {
                                            const isEffective = userEffectivePermissions.includes(perm.name);
                                            const override = userOverrides.find(o => o.permission_id === perm.id);

                                            let statusBadge = null;
                                            if (override) {
                                                if (override.is_granted) {
                                                    statusBadge = (
                                                        <span className="text-xs bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300 px-2 py-0.5 rounded border border-green-200 dark:border-green-800/50 font-medium flex items-center gap-1">
                                                            Override: Granted
                                                            <button
                                                                onClick={() => handleRevoke(perm.name)}
                                                                className="bg-white dark:bg-slate-700 rounded-full p-0.5 hover:text-red-500 dark:hover:text-red-400 ml-1"
                                                            >
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                            </button>
                                                        </span>
                                                    );
                                                } else {
                                                    statusBadge = (
                                                        <span className="text-xs bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 px-2 py-0.5 rounded border border-red-200 dark:border-red-800/50 font-medium flex items-center gap-1">
                                                            Override: Denied
                                                            <button
                                                                onClick={() => handleRevoke(perm.name)}
                                                                className="bg-white dark:bg-slate-700 rounded-full p-0.5 hover:text-red-500 dark:hover:text-red-400 ml-1"
                                                            >
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                            </button>
                                                        </span>
                                                    );
                                                }
                                            } else if (isEffective) {
                                                statusBadge = (
                                                    <span className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 px-2 py-0.5 rounded border border-gray-200 dark:border-slate-700">
                                                        Inherited from Role
                                                    </span>
                                                );
                                            }

                                            return (
                                                <div
                                                    key={perm.id}
                                                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                                        isEffective
                                                            ? 'bg-white dark:bg-slate-800/60 border-green-200 dark:border-green-800/40 shadow-sm'
                                                            : 'bg-gray-50 dark:bg-slate-800/30 border-gray-100 dark:border-slate-800 opacity-60 hover:opacity-100'
                                                    }`}
                                                >
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`w-2 h-2 rounded-full ${isEffective ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'}`}></span>
                                                            <span className={`text-sm font-medium ${isEffective ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-500'}`}>{perm.name}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-slate-500 mt-0.5 ml-4">{perm.description}</p>
                                                    </div>
                                                    <div>
                                                        {statusBadge}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-slate-700"></div>
                        <div className="space-y-6">
                            {auditLog.map(log => (
                                <div key={log.id} className="relative pl-10">
                                    <div className="absolute left-2.5 top-2 w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full border-2 border-white dark:border-slate-900 -translate-x-1/2"></div>
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-100 dark:border-slate-700 shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-gray-900 dark:text-white text-sm">{log.action}</span>
                                            <span className="text-xs text-gray-500 dark:text-slate-400">{format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}</span>
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-900/60 p-2 rounded font-mono break-all border border-transparent dark:border-slate-700/50">
                                            {JSON.stringify(log.changes, null, 2)}
                                        </div>
                                        <div className="mt-2 text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                            By: {log.user_id || 'System'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {auditLog.length === 0 && (
                                <div className="text-center text-gray-500 dark:text-slate-500 py-8">No audit history found</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
