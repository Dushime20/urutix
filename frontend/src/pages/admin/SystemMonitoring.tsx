import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { monitoringApi } from '../../services/monitoringApi';
import { useSocket } from '../../contexts/SocketContext';
import {
    Activity, AlertTriangle,
    Users, Download, RefreshCw, BarChart2, Globe
} from 'lucide-react';
import { TranslatedText } from '../../components/translated-text';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import ModernLoader from '../../components/common/ModernLoader';
import { StandardDataTable, StatusBadge, type Column } from '../../components/EnliteUI/Tables';

const SystemMonitoring: React.FC = () => {
    const [auditPage, setAuditPage] = useState(1);
    const [auditFilters, setAuditFilters] = useState({
        action: '',
        resource: '',
        userId: ''
    });
    const [autoRefresh, setAutoRefresh] = useState(true);
    const { socket } = useSocket();

    // Fetch system health (drives loading gate + refresh actions)
    const { isLoading: healthLoading, refetch: refetchHealth } = useQuery({
        queryKey: ['system-health'],
        queryFn: monitoringApi.getSystemHealth,
        refetchInterval: autoRefresh ? 30000 : false // Auto-refresh every 30s
    });

    // Fetch user activity
    const { data: userActivity, isLoading: activityLoading, refetch: refetchActivity } = useQuery({
        queryKey: ['user-activity'],
        queryFn: monitoringApi.getUserActivity,
        refetchInterval: autoRefresh ? 60000 : false
    });

    // Fetch audit logs
    const { data: auditLogs, isLoading: auditLoading, refetch: refetchAudit } = useQuery({
        queryKey: ['audit-logs', auditPage, auditFilters],
        queryFn: () => monitoringApi.getAuditLogs({
            page: auditPage,
            limit: 20,
            ...auditFilters
        })
    });

    // Fetch performance metrics
    const { data: metrics, refetch: refetchMetrics } = useQuery({
        queryKey: ['performance-metrics'],
        queryFn: monitoringApi.getPerformanceMetrics,
        refetchInterval: autoRefresh ? 30000 : false
    });

    // Socket listeners for real-time updates
    React.useEffect(() => {
        if (!socket) return;

        const handleUpdate = () => {
            if (import.meta.env.MODE === 'development') {
                console.log('Real-time update received, refreshing data...');
            }
            refetchActivity();
            refetchAudit();
            // We can also refetch metrics if the event implies system load change, 
            // but usually metrics are on a timer.
        };

        const handleSystemUpdate = () => {
            refetchHealth();
            refetchMetrics();
        };

        socket.on('new_activity', handleUpdate);
        socket.on('suspicious_activity', handleUpdate);
        socket.on('system_update', handleSystemUpdate);

        return () => {
            socket.off('new_activity', handleUpdate);
            socket.off('suspicious_activity', handleUpdate);
            socket.off('system_update', handleSystemUpdate);
        };
    }, [socket, refetchActivity, refetchAudit, refetchHealth, refetchMetrics]);

    if (healthLoading || activityLoading) {
        return (
            <AdminPageLayout
                title={<TranslatedText text="System Monitoring" />}
                description={<TranslatedText text="Real-time system health, performance metrics, and audit logs across the platform." />}
            >
                <ModernLoader isLoading={true} type="page" showStats={true} />
            </AdminPageLayout>
        );
    }

    const auditColumns = useMemo<Column<any>[]>(() => [
        {
            key: 'created_at',
            label: 'Timestamp',
            sortable: true,
            render: (v) => (
                <span className="text-slate-600 dark:text-slate-300 font-medium text-xs">{v ? new Date(String(v)).toLocaleString() : '—'}</span>
            ),
        },
        {
            key: 'admin_email',
            label: 'Admin',
            render: (_v, log) => (
                <span className="text-slate-700 dark:text-slate-300 font-bold text-xs">{log.admin_email || 'System'}</span>
            ),
        },
        {
            key: 'user_email',
            label: 'User',
            render: (_v, log) => (
                <span className="text-slate-600 dark:text-slate-300 text-xs">{log.user_email || log.user_id}</span>
            ),
        },
        {
            key: 'action',
            label: 'Action',
            sortable: true,
            render: (_v, log) => (
                <StatusBadge
                    status={log.action === 'GRANT' ? 'completed' : log.action === 'REVOKE' ? 'cancelled' : 'pending'}
                    label={log.action}
                />
            ),
        },
        {
            key: 'permission',
            label: 'Permission',
            render: (v) => (
                <span className="font-mono text-xs text-[#2c5173] bg-slate-100 rounded-lg px-2 py-1 inline-block">{String(v)}</span>
            ),
        },
        {
            key: 'reason',
            label: 'Reason',
            render: (v) => (
                <span className="text-slate-600 dark:text-slate-300 max-w-xs truncate text-xs block">{String(v || '-')}</span>
            ),
        },
    ], []);

    return (
        <AdminPageLayout
            title={<TranslatedText text="System Monitoring" />}
            description={<TranslatedText text="Real-time system health, performance metrics, and audit logs across the platform." />}
            actions={
                <div className="flex gap-3">
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${autoRefresh
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-slate-700 hover:bg-slate-600 text-white'
                            }`}
                    >
                        <Activity size={14} className={autoRefresh ? 'animate-pulse' : ''} />
                        <TranslatedText text="Auto-refresh" /> {autoRefresh ? <TranslatedText text="ON" /> : <TranslatedText text="OFF" />}
                    </button>
                    <button
                        onClick={() => refetchHealth()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                    >
                        <RefreshCw size={14} /> <TranslatedText text="Refresh Now" />
                    </button>
                </div>
            }
        >
            <div className="safe-bottom">
            {/* Performance & Network Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Traffic Stats */}
                <div className="bg-white dark:bg-slate-900 rounded-[24px] p-8 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-cyan-50 rounded-lg">
                            <Globe className="text-cyan-600 w-6 h-6" />
                        </div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Network Traffic</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-8">
                        <div>
                            <div className="text-3xl font-black text-slate-800 dark:text-slate-100 leading-none tracking-tight mb-2">
                                {metrics?.requests?.perSecond || 0}
                            </div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Req/Sec</div>
                        </div>
                        <div className="border-l border-r border-slate-100 dark:border-slate-800 px-8">
                            <div className="text-3xl font-black text-slate-800 dark:text-slate-100 leading-none tracking-tight mb-2">
                                {metrics?.requests?.avgResponseTime || 0}<span className="text-sm font-normal text-slate-400 ml-1">ms</span>
                            </div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Avg Latency</div>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-slate-800 dark:text-slate-100 leading-none tracking-tight mb-2">
                                {metrics?.requests?.total?.toLocaleString() || 0}
                            </div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Req</div>
                        </div>
                    </div>
                </div>

                {/* Error Rates */}
                <div className="bg-white dark:bg-slate-900 rounded-[24px] p-8 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-red-50 rounded-lg">
                            <AlertTriangle className="text-red-500 w-6 h-6" />
                        </div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Error Rate</h3>
                    </div>
                    <div className="flex items-center gap-12">
                        <div>
                            <div className={`text-5xl font-black leading-none tracking-tight mb-2 ${metrics?.errors?.rate && metrics.errors.rate > 1 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {metrics?.errors?.rate || 0}%
                            </div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Request Failure Rate</div>
                        </div>
                        <div className="h-16 w-px bg-slate-100"></div>
                        <div>
                            <div className="text-3xl font-black text-slate-800 dark:text-slate-100 leading-none tracking-tight mb-2">
                                {metrics?.errors?.total || 0}
                            </div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Errors</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Activity Stats */}
            <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 overflow-hidden mb-6">
                <div className="px-8 py-6 border-b border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <Users className="text-indigo-600 w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">User Activity</h2>
                    </div>
                </div>
                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Users by Status */}
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Users by Status</h3>
                            <div className="space-y-3">
                                {userActivity?.usersByStatus.map(item => (
                                    <div key={item.status} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{item.status}</span>
                                        <span className="font-black text-[#2c5173] bg-slate-100 px-3 py-1 rounded-lg text-sm">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Users by Role */}
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Users by Role</h3>
                            <div className="space-y-3">
                                {userActivity?.usersByRole.map(item => (
                                    <div key={item.role} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <span className="font-bold text-slate-700 dark:text-slate-300 text-sm capitalize">{item.role.replace('_', ' ')}</span>
                                        <span className="font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-lg text-sm">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Audit Logs */}
            <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg">
                            <BarChart2 className="text-slate-600 dark:text-slate-300 w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">Audit Logs</h2>
                    </div>
                    <button className="px-5 py-2.5 bg-[#2c5173] text-white rounded-xl hover:bg-[#1e3850] flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all">
                        <Download size={14} /> Export CSV
                    </button>
                </div>

                {/* Filters */}
                <div className="p-6 bg-slate-50/50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            type="text"
                            placeholder="Filter by user ID..."
                            className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#2c5173] text-sm bg-white dark:bg-slate-900 font-medium outline-none"
                            value={auditFilters.userId}
                            onChange={(e) => setAuditFilters({ ...auditFilters, userId: e.target.value })}
                        />
                        <select
                            className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#2c5173] text-sm bg-white dark:bg-slate-900 font-medium outline-none cursor-pointer"
                            value={auditFilters.action}
                            onChange={(e) => setAuditFilters({ ...auditFilters, action: e.target.value })}
                        >
                            <option value="">All Actions</option>
                            <option value="GRANT">Grant</option>
                            <option value="REVOKE">Revoke</option>
                            <option value="DENY">Deny</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Filter by resource..."
                            className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#2c5173] text-sm bg-white dark:bg-slate-900 font-medium outline-none"
                            value={auditFilters.resource}
                            onChange={(e) => setAuditFilters({ ...auditFilters, resource: e.target.value })}
                        />
                    </div>
                </div>

                <div className="p-2">
                    <StandardDataTable<any>
                        embedded
                        columns={auditColumns}
                        data={auditLogs?.data || []}
                        loading={auditLoading}
                        getRowId={(row) => row.id}
                        searchPlaceholder="Search audit logs…"
                        searchKeys={['admin_email', 'user_email', 'user_id', 'permission', 'reason', 'action']}
                        emptyMessage="No audit logs found matching your criteria."
                        stickyHeader
                        columnVisibility
                        pagination
                        page={auditPage}
                        totalItems={auditLogs?.pagination?.total ?? auditLogs?.total}
                        onPageChange={setAuditPage}
                        ariaLabel="Audit logs"
                    />
                </div>
            </div>
            </div>
        </AdminPageLayout>
    );
};

export default SystemMonitoring;
