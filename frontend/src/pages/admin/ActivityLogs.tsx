import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    FaDownload,
    FaExclamationTriangle, FaTimesCircle,
    FaDesktop, FaMobile, FaGlobe, FaSync
} from 'react-icons/fa';
import { FileText, Activity } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSocket } from '../../contexts/SocketContext';
import AdminHeader from '../../components/Admin/AdminHeader';

interface ActivityLog {
    id: string;
    user: { email: string; name?: string };
    action: string;
    resource: string;
    resourceId: string;
    ipAddress: string;
    userAgent: string;
    isSuspicious: boolean;
    createdAt: string;
    details: any;
}

interface UserSession {
    id: string;
    user: { email: string; name?: string };
    ipAddress: string;
    deviceInfo: { browser?: string; os?: string; device?: string; isMobile?: boolean };
    location: { country?: string; city?: string };
    lastActivity: string;
    createdAt: string;
}

const ActivityLogs: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'logs' | 'sessions'>('logs');
    const [filters, setFilters] = useState({
        action: '',
        resource: '',
        isSuspicious: '',
        startDate: '',
        endDate: '',
        page: 1,
    });

    const { socket, connected: socketConnected } = useSocket();

    // Fetch activity logs
    const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
        queryKey: ['activity-logs', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.action) params.append('action', filters.action);
            if (filters.resource) params.append('resource', filters.resource);
            if (filters.isSuspicious) params.append('isSuspicious', filters.isSuspicious);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            params.append('page', filters.page.toString());
            params.append('limit', '50');

            const response = await axios.get(`/api/admin/activity-logs?${params.toString()}`);
            return response.data;
        },
    });

    // Fetch active sessions
    const { data: sessionsData, isLoading: sessionsLoading, refetch: refetchSessions } = useQuery({
        queryKey: ['active-sessions'],
        queryFn: async () => {
            const response = await axios.get('/api/admin/activity-logs/sessions/active');
            return response.data;
        },
        enabled: activeTab === 'sessions',
    });

    // Fetch suspicious activities
    const { data: suspiciousData } = useQuery({
        queryKey: ['suspicious-activities'],
        queryFn: async () => {
            const response = await axios.get('/api/admin/activity-logs/suspicious/list?limit=10');
            return response.data;
        },
    });

    // Socket listeners
    React.useEffect(() => {
        if (!socket) return;

        const handleNewActivity = (activity: ActivityLog) => {
            // Local toast for this page specifically
            toast.custom((t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
                    <div className="flex-1 w-0 p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                                <Activity className="h-10 w-10 rounded-full text-indigo-500 bg-indigo-100 p-2" />
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                    New Activity: {activity.action}
                                </p>
                                <p className="mt-1 text-sm text-gray-500">
                                    {activity.user?.email || 'System'} - {activity.resource}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ));
            refetchLogs();
        };

        const handleSuspiciousActivity = (activity: ActivityLog) => {
            // Refetch logs on suspicious activity. 
            // Global alert is handled by SocketContext
            refetchLogs();
        };

        socket.on('new_activity', handleNewActivity);
        socket.on('suspicious_activity', handleSuspiciousActivity);

        return () => {
            socket.off('new_activity', handleNewActivity);
            socket.off('suspicious_activity', handleSuspiciousActivity);
        };
    }, [socket, refetchLogs]);

    const handleExport = async () => {
        const params = new URLSearchParams();
        if (filters.action) params.append('action', filters.action);
        if (filters.resource) params.append('resource', filters.resource);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);

        const response = await axios.get(`/api/admin/activity-logs/export/data?${params.toString()}`);

        // Convert to CSV
        const csv = convertToCSV(response.data);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-logs-${new Date().toISOString()}.csv`;
        a.click();
    };

    const convertToCSV = (data: any[]) => {
        if (!data.length) return '';
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => Object.values(row).join(',')).join('\n');
        return `${headers}\n${rows}`;
    };

    const terminateSession = async (sessionId: string) => {
        if (window.confirm('Are you sure you want to terminate this session?')) {
            await axios.delete(`/api/admin/activity-logs/sessions/${sessionId}`);
            refetchSessions();
        }
    };

    const getActionColor = (action: string) => {
        if (action.includes('DELETE')) return 'text-red-600 bg-red-50';
        if (action.includes('CREATE')) return 'text-green-600 bg-green-50';
        if (action.includes('UPDATE')) return 'text-blue-600 bg-blue-50';
        if (action.includes('LOGIN')) return 'text-purple-600 bg-purple-50';
        return 'text-gray-600 bg-gray-50';
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Dark Header */}
            <div className="bg-[#0f172a] text-white">
                <AdminHeader
                    searchPlaceholder="Search activities..."
                    customRightContent={
                        <div className={`w-3 h-3 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-red-500'} ring-2 ring-white/10`} title={socketConnected ? 'Real-time updates active' : 'Disconnected from real-time stream'}></div>
                    }
                />

                {/* Hero Section */}
                <div className="bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
                    <div className="max-w-[1536px] mx-auto px-4 md:px-8 lg:px-12 xl:px-20 py-8 pb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">Activity Logs & Sessions</h1>
                            <p className="text-slate-400 max-w-xl">Monitor user activities, track sessions, and detect suspicious behavior across the platform.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => activeTab === 'logs' ? refetchLogs() : refetchSessions()}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-600/20 transition-all"
                            >
                                <FaSync size={14} /> Refresh
                            </button>
                            {activeTab === 'logs' && (
                                <button
                                    onClick={handleExport}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg shadow-emerald-600/20 transition-all"
                                >
                                    <FaDownload size={14} /> Export CSV
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-[1536px] mx-auto px-4 md:px-8 lg:px-12 xl:px-20 -mt-8 pb-12">

                {/* Suspicious Activities Alert */}
                {suspiciousData && suspiciousData.length > 0 && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
                        <div className="flex items-center gap-3">
                            <FaExclamationTriangle className="text-red-500 text-xl" />
                            <div>
                                <h3 className="font-bold text-red-800">Suspicious Activity Detected</h3>
                                <p className="text-sm text-red-600">{suspiciousData.length} suspicious activities require your attention</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
                    <div className="border-b border-slate-200">
                        <nav className="flex gap-1 px-4">
                            <button
                                onClick={() => setActiveTab('logs')}
                                className={`py-3 px-4 border-b-2 font-bold text-sm transition-colors ${activeTab === 'logs'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <FileText size={16} />
                                    Activity Logs
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('sessions')}
                                className={`py-3 px-4 border-b-2 font-bold text-sm transition-colors ${activeTab === 'sessions'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <FaDesktop size={16} />
                                    Active Sessions ({sessionsData?.length || 0})
                                </div>
                            </button>
                        </nav>
                    </div>

                    {/* Activity Logs Tab */}
                    {activeTab === 'logs' && (
                        <div className="p-6">
                            {/* Filters */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <select
                                    value={filters.action}
                                    onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}
                                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All Actions</option>
                                    <option value="LOGIN">Login</option>
                                    <option value="LOGOUT">Logout</option>
                                    <option value="CREATE">Create</option>
                                    <option value="UPDATE">Update</option>
                                    <option value="DELETE">Delete</option>
                                </select>

                                <select
                                    value={filters.resource}
                                    onChange={(e) => setFilters({ ...filters, resource: e.target.value, page: 1 })}
                                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All Resources</option>
                                    <option value="users">Users</option>
                                    <option value="loads">Loads</option>
                                    <option value="trucks">Trucks</option>
                                    <option value="payments">Payments</option>
                                </select>

                                <select
                                    value={filters.isSuspicious}
                                    onChange={(e) => setFilters({ ...filters, isSuspicious: e.target.value, page: 1 })}
                                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All Activities</option>
                                    <option value="true">Suspicious Only</option>
                                    <option value="false">Normal Only</option>
                                </select>

                                <input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
                                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Activity List */}
                            {logsLoading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                                    <p className="mt-4 text-slate-600">Loading activities...</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {logsData?.activities?.map((log: ActivityLog) => (
                                        <div
                                            key={log.id}
                                            className={`p-4 rounded-lg border ${log.isSuspicious
                                                ? 'border-red-200 bg-red-50'
                                                : 'border-slate-200 bg-white hover:border-indigo-200'
                                                } transition-colors`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${getActionColor(log.action)}`}>
                                                            {log.action}
                                                        </span>
                                                        {log.resource && (
                                                            <span className="text-sm text-slate-600">
                                                                {log.resource} {log.resourceId && `#${log.resourceId.slice(0, 8)}`}
                                                            </span>
                                                        )}
                                                        {log.isSuspicious && (
                                                            <span className="flex items-center gap-1 text-xs text-red-600 font-bold">
                                                                <FaExclamationTriangle /> Suspicious
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-slate-600">
                                                        <span className="font-medium">{log.user?.email || 'Unknown User'}</span>
                                                        <span className="flex items-center gap-1">
                                                            <FaGlobe size={12} /> {log.ipAddress}
                                                        </span>
                                                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Pagination */}
                                    {logsData && logsData.totalPages > 1 && (
                                        <div className="flex items-center justify-between pt-4">
                                            <p className="text-sm text-slate-600">
                                                Page {logsData.page} of {logsData.totalPages} ({logsData.total} total)
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                                                    disabled={filters.page === 1}
                                                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Previous
                                                </button>
                                                <button
                                                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                                                    disabled={filters.page === logsData.totalPages}
                                                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Sessions Tab */}
                    {activeTab === 'sessions' && (
                        <div className="p-6">
                            {sessionsLoading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                                    <p className="mt-4 text-slate-600">Loading sessions...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {sessionsData?.map((session: UserSession) => (
                                        <div key={session.id} className="p-4 bg-white border border-slate-200 rounded-lg hover:border-indigo-200 transition-colors">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    {session.deviceInfo?.isMobile ? (
                                                        <FaMobile className="text-indigo-600 text-xl" />
                                                    ) : (
                                                        <FaDesktop className="text-indigo-600 text-xl" />
                                                    )}
                                                    <div>
                                                        <p className="font-bold text-slate-800">{session.user?.email}</p>
                                                        <p className="text-xs text-slate-500">
                                                            {session.deviceInfo?.browser} on {session.deviceInfo?.os}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => terminateSession(session.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Terminate session"
                                                >
                                                    <FaTimesCircle size={18} />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <p className="text-slate-500">IP Address</p>
                                                    <p className="font-medium">{session.ipAddress}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500">Location</p>
                                                    <p className="font-medium">{session.location?.city || 'Unknown'}, {session.location?.country || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500">Last Activity</p>
                                                    <p className="font-medium">{new Date(session.lastActivity).toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500">Session Started</p>
                                                    <p className="font-medium">{new Date(session.createdAt).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ActivityLogs;
