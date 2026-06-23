import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { monitoringApi } from '../../services/monitoringApi';
import { useSocket } from '../../contexts/SocketContext';
import {
    Activity, Database, Cpu, HardDrive,
    Users, AlertTriangle, CheckCircle, Loader2,
    Download, RefreshCw, BarChart2, Globe
} from 'lucide-react';
import { TranslatedText } from '../../components/translated-text';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import { StatCard } from '../../components/EnliteUI';
import ModernLoader from '../../components/common/ModernLoader';

const SystemMonitoring: React.FC = () => {
    const [auditPage, setAuditPage] = useState(1);
    const [auditFilters, setAuditFilters] = useState({
        action: '',
        resource: '',
        userId: ''
    });
    const [autoRefresh, setAutoRefresh] = useState(true);
    const { socket } = useSocket();

    // Fetch system health
    const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'text-emerald-600 bg-emerald-50';
            case 'degraded': return 'text-amber-600 bg-amber-50';
            case 'unhealthy': return 'text-red-600 bg-red-50';
            default: return 'text-slate-600 bg-slate-50';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy': return <CheckCircle className="text-emerald-600 w-5 h-5" />;
            case 'degraded': return <AlertTriangle className="text-amber-600 w-5 h-5" />;
            case 'unhealthy': return <AlertTriangle className="text-red-600 w-5 h-5" />;
            default: return <Loader2 className="animate-spin text-slate-600 w-5 h-5" />;
        }
    };

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
            {/* System Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard
                    title={<TranslatedText text="System Status" />}
                    value={health?.status?.toUpperCase() || 'UNKNOWN'}
                    icon={getStatusIcon(health?.status || 'unknown')}
                    color="primary"
                    variant="classic"
                    subtitle={`Uptime: ${health?.uptime.formatted || 'N/A'}`}
                />
                <StatCard
                    title={<TranslatedText text="Database" />}
                    value={health?.services.database.status?.toUpperCase() || 'UNKNOWN'}
                    icon={<Database className="w-5 h-5" />}
                    color="primary"
                    variant="classic"
                    subtitle={`Response: ${health?.services.database.responseTime || 'N/A'}`}
                />
                <StatCard
                    title={<TranslatedText text="Memory" />}
                    value={`${health?.resources.memory.system.usagePercent || 0}%`}
                    icon={<HardDrive className="w-5 h-5" />}
                    color="primary"
                    variant="classic"
                    subtitle={`${health?.resources.memory.system.used || 0}GB Used / ${health?.resources.memory.system.total || 0}GB Total`}
                />
                <StatCard
                    title={<TranslatedText text="CPU" />}
                    value={`${health?.resources.cpu.cores || 0} Cores`}
                    icon={<Cpu className="w-5 h-5" />}
                    color="primary"
                    variant="classic"
                    subtitle={`Model: ${health?.resources.cpu.model || 'Unknown'}`}
                />
            </div>

            {/* Performance & Network Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 mt-6">
                {/* Traffic Stats */}
                <div className="bg-white rounded-[24px] p-8 border border-slate-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-cyan-50 rounded-lg">
                            <Globe className="text-cyan-600 w-6 h-6" />
                        </div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Network Traffic</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-8">
                        <div>
                            <div className="text-3xl font-black text-slate-800 leading-none tracking-tight mb-2">
                                {metrics?.requests?.perSecond || 0}
                            </div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Req/Sec</div>
                        </div>
                        <div className="border-l border-r border-slate-100 px-8">
                            <div className="text-3xl font-black text-slate-800 leading-none tracking-tight mb-2">
                                {metrics?.requests?.avgResponseTime || 0}<span className="text-sm font-normal text-slate-400 ml-1">ms</span>
                            </div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Avg Latency</div>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-slate-800 leading-none tracking-tight mb-2">
                                {metrics?.requests?.total?.toLocaleString() || 0}
                            </div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Req</div>
                        </div>
                    </div>
                </div>

                {/* Error Rates */}
                <div className="bg-white rounded-[24px] p-8 border border-slate-100">
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
                            <div className="text-3xl font-black text-slate-800 leading-none tracking-tight mb-2">
                                {metrics?.errors?.total || 0}
                            </div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Errors</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Activity Stats */}
            <div className="bg-white rounded-[24px] border border-slate-100 overflow-hidden mb-6">
                <div className="px-8 py-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <Users className="text-indigo-600 w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-black text-slate-800">User Activity</h2>
                    </div>
                </div>
                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <StatCard
                            title={<TranslatedText text="Active (24h)" />}
                            value={userActivity?.activeUsers.last24h || 0}
                            icon={<Users className="w-5 h-5" />}
                            color="primary"
                            variant="classic"
                        />
                        <StatCard
                            title={<TranslatedText text="Active (7d)" />}
                            value={userActivity?.activeUsers.last7d || 0}
                            icon={<Users className="w-5 h-5" />}
                            color="primary"
                            variant="classic"
                        />
                        <StatCard
                            title={<TranslatedText text="Active (30d)" />}
                            value={userActivity?.activeUsers.last30d || 0}
                            icon={<Users className="w-5 h-5" />}
                            color="primary"
                            variant="classic"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Users by Status */}
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Users by Status</h3>
                            <div className="space-y-3">
                                {userActivity?.usersByStatus.map(item => (
                                    <div key={item.status} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="font-bold text-slate-700 text-sm">{item.status}</span>
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
                                    <div key={item.role} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="font-bold text-slate-700 text-sm capitalize">{item.role.replace('_', ' ')}</span>
                                        <span className="font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-lg text-sm">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Audit Logs */}
            <div className="bg-white rounded-[24px] border border-slate-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg">
                            <BarChart2 className="text-slate-600 w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-black text-slate-800">Audit Logs</h2>
                    </div>
                    <button className="px-5 py-2.5 bg-[#2c5173] text-white rounded-xl hover:bg-[#1e3850] flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all">
                        <Download size={14} /> Export CSV
                    </button>
                </div>

                {/* Filters */}
                <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            type="text"
                            placeholder="Filter by user ID..."
                            className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2c5173] text-sm bg-white font-medium outline-none"
                            value={auditFilters.userId}
                            onChange={(e) => setAuditFilters({ ...auditFilters, userId: e.target.value })}
                        />
                        <select
                            className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2c5173] text-sm bg-white font-medium outline-none cursor-pointer"
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
                            className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2c5173] text-sm bg-white font-medium outline-none"
                            value={auditFilters.resource}
                            onChange={(e) => setAuditFilters({ ...auditFilters, resource: e.target.value })}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-white border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Permission</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {auditLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-6">
                                        <ModernLoader isLoading={true} type="table" rows={5} columns={6} />
                                    </td>
                                </tr>
                            ) : auditLogs?.data?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-12 text-center text-slate-500 font-medium">
                                        No audit logs found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                auditLogs?.data?.map((log: any) => (
                                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-8 py-4 text-slate-600 font-medium text-xs">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-8 py-4 text-slate-700 font-bold text-xs">
                                            {log.admin_email || 'System'}
                                        </td>
                                        <td className="px-8 py-4 text-slate-600 text-xs">
                                            {log.user_email || log.user_id}
                                        </td>
                                        <td className="px-8 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${log.action === 'GRANT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                log.action === 'REVOKE' ? 'bg-red-50 text-red-700 border border-red-100' :
                                                    'bg-amber-50 text-amber-700 border border-amber-100'
                                                }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 font-mono text-xs text-[#2c5173] bg-slate-100 rounded-lg px-2 py-1 inline-block">
                                            {log.permission}
                                        </td>
                                        <td className="px-8 py-4 text-slate-600 max-w-xs truncate text-xs">
                                            {log.reason || '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {auditLogs?.pagination && (
                    <div className="px-8 py-5 bg-white border-t border-slate-100 flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Page {auditLogs.pagination.page} of {auditLogs.pagination.totalPages} <span className="text-slate-300 mx-2">|</span> {auditLogs.pagination.total} Records
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                                disabled={auditPage === 1}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setAuditPage(p => p + 1)}
                                disabled={auditPage >= (auditLogs.pagination.totalPages || 1)}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
            </div>
        </AdminPageLayout>
    );
};

export default SystemMonitoring;
