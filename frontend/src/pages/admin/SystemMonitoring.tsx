import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { monitoringApi } from '../../services/monitoringApi';
import { useSocket } from '../../contexts/SocketContext';
import {
    FaServer, FaDatabase, FaMemory, FaChartLine,
    FaUsers, FaExclamationTriangle, FaCheckCircle, FaSpinner,
    FaDownload, FaSync, FaBell
} from 'react-icons/fa';
import { Activity, Cpu } from 'lucide-react';
import AdminHeader from '../../components/Admin/AdminHeader';

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
            case 'healthy': return <FaCheckCircle className="text-emerald-600" />;
            case 'degraded': return <FaExclamationTriangle className="text-amber-600" />;
            case 'unhealthy': return <FaExclamationTriangle className="text-red-600" />;
            default: return <FaSpinner className="animate-spin text-slate-600" />;
        }
    };

    if (healthLoading || activityLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <FaSpinner className="animate-spin text-indigo-600 text-5xl" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Dark Header */}
            <div className="bg-[#0f172a] text-white">
                <AdminHeader
                    searchPlaceholder="Search system..."
                    customRightContent={
                        <button className="relative p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                            <FaBell size={18} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0f172a]"></span>
                        </button>
                    }
                />

                {/* Hero Section */}
                <div className="bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
                    <div className="max-w-[1536px] mx-auto px-4 md:px-8 lg:px-12 xl:px-20 py-8 pb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">System Monitoring</h1>
                            <p className="text-slate-400 max-w-xl">Real-time system health, performance metrics, and audit logs across the platform.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold shadow-lg transition-all ${autoRefresh
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                                    : 'bg-slate-700 hover:bg-slate-600 text-white shadow-slate-700/20'
                                    }`}
                            >
                                <Activity size={14} className={autoRefresh ? 'animate-pulse' : ''} />
                                Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
                            </button>
                            <button
                                onClick={() => refetchHealth()}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-600/20 transition-all"
                            >
                                <FaSync size={14} /> Refresh Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-[1536px] mx-auto px-4 md:px-8 lg:px-12 xl:px-20 -mt-8 pb-12">
                {/* System Status Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Overall Status */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                {getStatusIcon(health?.status || 'unknown')}
                                <h3 className="font-bold text-slate-700">System Status</h3>
                            </div>
                        </div>
                        <div className={`text-2xl font-black mb-2 ${getStatusColor(health?.status || 'unknown')}`}>
                            {health?.status?.toUpperCase() || 'UNKNOWN'}
                        </div>
                        <div className="text-sm text-slate-500">
                            Uptime: {health?.uptime.formatted || 'N/A'}
                        </div>
                    </div>

                    {/* Database */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <FaDatabase className="text-blue-600" size={24} />
                            <h3 className="font-bold text-slate-700">Database</h3>
                        </div>
                        <div className={`text-2xl font-black mb-2 ${getStatusColor(health?.services.database.status || 'unknown')}`}>
                            {health?.services.database.status?.toUpperCase() || 'UNKNOWN'}
                        </div>
                        <div className="text-sm text-slate-500">
                            Response: {health?.services.database.responseTime || 'N/A'}
                        </div>
                    </div>

                    {/* Memory Usage */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <FaMemory className="text-purple-600" size={24} />
                            <h3 className="font-bold text-slate-700">Memory</h3>
                        </div>
                        <div className="text-2xl font-black text-purple-600 mb-2">
                            {health?.resources.memory.system.usagePercent || 0}%
                        </div>
                        <div className="text-sm text-slate-500">
                            {health?.resources.memory.system.used || 0}GB / {health?.resources.memory.system.total || 0}GB
                        </div>
                        <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                                style={{ width: `${health?.resources.memory.system.usagePercent || 0}%` }}
                            />
                        </div>
                    </div>

                    {/* CPU */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <Cpu className="text-orange-600" size={24} />
                            <h3 className="font-bold text-slate-700">CPU</h3>
                        </div>
                        <div className="text-2xl font-black text-orange-600 mb-2">
                            {health?.resources.cpu.cores || 0} Cores
                        </div>
                        <div className="text-sm text-slate-500 truncate">
                            {health?.resources.cpu.model || 'Unknown'}
                        </div>
                    </div>
                </div>

                {/* Performance & Network Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 mt-6">
                    {/* Traffic Stats */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <FaSync className="text-cyan-600" size={24} />
                            <h3 className="font-bold text-slate-700">Network Traffic</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <div className="text-2xl font-black text-slate-800">
                                    {metrics?.requests?.perSecond || 0}
                                </div>
                                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Req/Sec</div>
                            </div>
                            <div>
                                <div className="text-2xl font-black text-slate-800">
                                    {metrics?.requests?.avgResponseTime || 0}
                                    <span className="text-sm font-normal text-slate-400 ml-1">ms</span>
                                </div>
                                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Avg Latency</div>
                            </div>
                            <div>
                                <div className="text-2xl font-black text-slate-800">
                                    {metrics?.requests?.total?.toLocaleString() || 0}
                                </div>
                                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Req</div>
                            </div>
                        </div>
                    </div>

                    {/* Error Rates */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <FaExclamationTriangle className="text-red-500" size={24} />
                            <h3 className="font-bold text-slate-700">Error Rate</h3>
                        </div>
                        <div className="flex items-center gap-8">
                            <div>
                                <div className={`text-4xl font-black ${metrics?.errors?.rate && metrics.errors.rate > 1 ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {metrics?.errors?.rate || 0}%
                                </div>
                                <div className="text-sm text-slate-500 mt-1">Request Failure Rate</div>
                            </div>
                            <div className="h-12 w-px bg-slate-100"></div>
                            <div>
                                <div className="text-2xl font-bold text-slate-700">
                                    {metrics?.errors?.total || 0}
                                </div>
                                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Errors</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Activity Stats */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-indigo-100">
                        <div className="flex items-center gap-3">
                            <FaUsers className="text-indigo-600" size={20} />
                            <h2 className="text-lg font-black text-slate-800">User Activity</h2>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                                <div className="text-3xl font-black text-blue-600 mb-1">
                                    {userActivity?.activeUsers.last24h || 0}
                                </div>
                                <div className="text-sm font-semibold text-blue-700">Active (24h)</div>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                                <div className="text-3xl font-black text-purple-600 mb-1">
                                    {userActivity?.activeUsers.last7d || 0}
                                </div>
                                <div className="text-sm font-semibold text-purple-700">Active (7d)</div>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg">
                                <div className="text-3xl font-black text-pink-600 mb-1">
                                    {userActivity?.activeUsers.last30d || 0}
                                </div>
                                <div className="text-sm font-semibold text-pink-700">Active (30d)</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Users by Status */}
                            <div>
                                <h3 className="font-bold text-slate-700 mb-3">Users by Status</h3>
                                <div className="space-y-2">
                                    {userActivity?.usersByStatus.map(item => (
                                        <div key={item.status} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <span className="font-medium text-slate-700">{item.status}</span>
                                            <span className="font-bold text-indigo-600">{item.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Users by Role */}
                            <div>
                                <h3 className="font-bold text-slate-700 mb-3">Users by Role</h3>
                                <div className="space-y-2">
                                    {userActivity?.usersByRole.map(item => (
                                        <div key={item.role} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <span className="font-medium text-slate-700">{item.role.replace('_', ' ')}</span>
                                            <span className="font-bold text-purple-600">{item.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Audit Logs */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FaChartLine className="text-slate-600" size={20} />
                                <h2 className="text-lg font-black text-slate-800">Audit Logs</h2>
                            </div>
                            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium">
                                <FaDownload /> Export CSV
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="p-4 bg-slate-50 border-b border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                type="text"
                                placeholder="Filter by user ID..."
                                className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                value={auditFilters.userId}
                                onChange={(e) => setAuditFilters({ ...auditFilters, userId: e.target.value })}
                            />
                            <select
                                className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
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
                                className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                value={auditFilters.resource}
                                onChange={(e) => setAuditFilters({ ...auditFilters, resource: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left font-bold text-slate-700">Timestamp</th>
                                    <th className="px-6 py-3 text-left font-bold text-slate-700">Admin</th>
                                    <th className="px-6 py-3 text-left font-bold text-slate-700">User</th>
                                    <th className="px-6 py-3 text-left font-bold text-slate-700">Action</th>
                                    <th className="px-6 py-3 text-left font-bold text-slate-700">Permission</th>
                                    <th className="px-6 py-3 text-left font-bold text-slate-700">Reason</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {auditLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center">
                                            <FaSpinner className="animate-spin text-indigo-600 text-2xl mx-auto" />
                                        </td>
                                    </tr>
                                ) : auditLogs?.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                            No audit logs found
                                        </td>
                                    </tr>
                                ) : (
                                    auditLogs?.data?.map((log: any) => (
                                        <tr key={log.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-3 text-slate-600">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-3 text-slate-700 font-medium">
                                                {log.admin_email || 'System'}
                                            </td>
                                            <td className="px-6 py-3 text-slate-700">
                                                {log.user_email || log.user_id}
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${log.action === 'GRANT' ? 'bg-emerald-100 text-emerald-700' :
                                                    log.action === 'REVOKE' ? 'bg-red-100 text-red-700' :
                                                        'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 font-mono text-xs text-slate-600">
                                                {log.permission}
                                            </td>
                                            <td className="px-6 py-3 text-slate-600 max-w-xs truncate">
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
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                            <div className="text-sm text-slate-600">
                                Page {auditLogs.pagination.page} of {auditLogs.pagination.totalPages}
                                ({auditLogs.pagination.total} total)
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                                    disabled={auditPage === 1}
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setAuditPage(p => p + 1)}
                                    disabled={auditPage >= (auditLogs.pagination.totalPages || 1)}
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* System Info */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl shadow-lg p-6 text-white">
                    <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                        <FaServer /> System Information
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <div className="text-slate-400 mb-1">Platform</div>
                            <div className="font-bold">{health?.platform.os}</div>
                        </div>
                        <div>
                            <div className="text-slate-400 mb-1">Architecture</div>
                            <div className="font-bold">{health?.platform.arch}</div>
                        </div>
                        <div>
                            <div className="text-slate-400 mb-1">Node Version</div>
                            <div className="font-bold">{health?.platform.nodeVersion}</div>
                        </div>
                        <div>
                            <div className="text-slate-400 mb-1">Hostname</div>
                            <div className="font-bold truncate">{health?.platform.hostname}</div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SystemMonitoring;
