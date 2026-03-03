import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { monitoringApi } from '../../services/monitoringApi';
import { useSocket } from '../../contexts/SocketContext';
import {
    Activity, Database, Cpu, HardDrive,
    Users, AlertTriangle, CheckCircle, Loader2,
    Download, RefreshCw, BarChart2, Globe
} from 'lucide-react';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';

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
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600 text-5xl" />
            </div>
        );
    }

    return (
        <AdminPageLayout
            title="System Monitoring"
            description="Real-time system health, performance metrics, and audit logs across the platform."
            actions={
                <div className="flex gap-3">
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all ${autoRefresh
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                            : 'bg-slate-700 hover:bg-slate-600 text-white shadow-slate-700/20'
                            }`}
                    >
                        <Activity size={14} className={autoRefresh ? 'animate-pulse' : ''} />
                        Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
                    </button>
                    <button
                        onClick={() => refetchHealth()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/20 transition-all"
                    >
                        <RefreshCw size={14} /> Refresh Now
                    </button>
                </div>
            }
        >
            {/* System Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {/* Overall Status */}
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                {getStatusIcon(health?.status || 'unknown')}
                            </div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Status</h3>
                        </div>
                    </div>
                    <div className={`text-2xl font-black mb-1 leading-none tracking-tight ${getStatusColor(health?.status || 'unknown')} bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-400`}>
                        {health?.status?.toUpperCase() || 'UNKNOWN'}
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-2">
                        Uptime: {health?.uptime.formatted || 'N/A'}
                    </div>
                </div>

                {/* Database */}
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Database className="text-blue-600 w-5 h-5" />
                        </div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Database</h3>
                    </div>
                    <div className={`text-2xl font-black mb-1 leading-none tracking-tight ${health?.services.database.status === 'healthy' ? 'text-emerald-600' : 'text-slate-600'}`}>
                        {health?.services.database.status?.toUpperCase() || 'UNKNOWN'}
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-2">
                        Response: {health?.services.database.responseTime || 'N/A'}
                    </div>
                </div>

                {/* Memory Usage */}
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <HardDrive className="text-purple-600 w-5 h-5" />
                        </div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Memory</h3>
                    </div>
                    <div className="text-2xl font-black text-purple-600 mb-1 leading-none tracking-tight">
                        {health?.resources.memory.system.usagePercent || 0}%
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-2 flex justify-between">
                        <span>{health?.resources.memory.system.used || 0}GB Used</span>
                        <span>{health?.resources.memory.system.total || 0}GB Total</span>
                    </div>
                    <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                            style={{ width: `${health?.resources.memory.system.usagePercent || 0}%` }}
                        />
                    </div>
                </div>

                {/* CPU */}
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-orange-50 rounded-lg">
                            <Cpu className="text-orange-600 w-5 h-5" />
                        </div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CPU</h3>
                    </div>
                    <div className="text-2xl font-black text-orange-600 mb-1 leading-none tracking-tight">
                        {health?.resources.cpu.cores || 0} Cores
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none truncate mt-2">
                        {health?.resources.cpu.model || 'Unknown'}
                    </div>
                </div>
            </div>

            {/* Performance & Network Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 mt-6">
                {/* Traffic Stats */}
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100">
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
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100">
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
            <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden mb-6">
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
                        <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl border border-blue-100">
                            <div className="text-4xl font-black text-blue-600 mb-2 tracking-tight">
                                {userActivity?.activeUsers.last24h || 0}
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-blue-400">Active (24h)</div>
                        </div>
                        <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl border border-purple-100">
                            <div className="text-4xl font-black text-purple-600 mb-2 tracking-tight">
                                {userActivity?.activeUsers.last7d || 0}
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-purple-400">Active (7d)</div>
                        </div>
                        <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-2xl border border-pink-100">
                            <div className="text-4xl font-black text-pink-600 mb-2 tracking-tight">
                                {userActivity?.activeUsers.last30d || 0}
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-pink-400">Active (30d)</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Users by Status */}
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Users by Status</h3>
                            <div className="space-y-3">
                                {userActivity?.usersByStatus.map(item => (
                                    <div key={item.status} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="font-bold text-slate-700 text-sm">{item.status}</span>
                                        <span className="font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg text-sm">{item.count}</span>
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
            <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg">
                            <BarChart2 className="text-slate-600 w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-black text-slate-800">Audit Logs</h2>
                    </div>
                    <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-2 text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-200 transition-all">
                        <Download size={14} /> Export CSV
                    </button>
                </div>

                {/* Filters */}
                <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            type="text"
                            placeholder="Filter by user ID..."
                            className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm bg-white font-medium outline-none"
                            value={auditFilters.userId}
                            onChange={(e) => setAuditFilters({ ...auditFilters, userId: e.target.value })}
                        />
                        <select
                            className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm bg-white font-medium outline-none cursor-pointer"
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
                            className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm bg-white font-medium outline-none"
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
                                    <td colSpan={6} className="px-8 py-12 text-center">
                                        <Loader2 className="animate-spin text-indigo-600 text-3xl mx-auto" />
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
                                        <td className="px-8 py-4 font-mono text-xs text-indigo-600 bg-indigo-50/50 rounded-lg px-2 py-1 inline-block">
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
        </AdminPageLayout>
    );
};

export default SystemMonitoring;
