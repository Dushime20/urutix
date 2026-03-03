import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import {
    FaDownload,
    FaExclamationTriangle, FaTimesCircle,
    FaDesktop, FaMobile, FaGlobe, FaSync,
    FaFilter, FaChartLine, FaUser, FaClock,
    FaSearch, FaShieldAlt, FaBuilding
} from 'react-icons/fa';
import { FileText, Activity, TrendingUp, Eye } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSocket } from '../../contexts/SocketContext';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';

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
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<'logs' | 'sessions' | 'analytics'>('logs');
    const [filters, setFilters] = useState({
        action: '',
        resource: '',
        isSuspicious: '',
        startDate: '',
        endDate: '',
        search: '',
        page: 1,
    });
    const [showFilters, setShowFilters] = useState(true);
    const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
    const [tenantFilter, setTenantFilter] = useState<{ id: string; name: string } | null>(null);

    const { socket, connected: socketConnected } = useSocket();

    // Handle incoming tenant filter from navigation
    useEffect(() => {
        if (location.state?.filterTenantId && location.state?.filterTenantName) {
            setTenantFilter({
                id: location.state.filterTenantId,
                name: location.state.filterTenantName
            });
            toast.success(`Filtering logs for tenant: ${location.state.filterTenantName}`);
        }
    }, [location.state]);

    // Fetch activity logs
    const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
        queryKey: ['activity-logs', filters, tenantFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.action) params.append('action', filters.action);
            if (filters.resource) params.append('resource', filters.resource);
            if (filters.isSuspicious) params.append('isSuspicious', filters.isSuspicious);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.search) params.append('search', filters.search);
            if (tenantFilter?.id) params.append('tenantId', tenantFilter.id);
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

    // Fetch analytics data
    const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
        queryKey: ['activity-analytics'],
        queryFn: async () => {
            const response = await axios.get('/api/admin/activity-logs/analytics');
            return response.data;
        },
        enabled: activeTab === 'analytics',
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

        const handleSuspiciousActivity = (_activity: ActivityLog) => {
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


    return (
        <AdminPageLayout
            title="Activity Logs & Sessions"
            description="Monitor user activities, track sessions, and detect suspicious behavior across the platform"
            actions={
                <div className="flex items-center gap-3">
                    {socketConnected && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium text-green-700">Live</span>
                        </div>
                    )}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-all"
                    >
                        <FaFilter size={14} /> {showFilters ? 'Hide' : 'Show'} Filters
                    </button>
                    <button
                        onClick={() => activeTab === 'logs' ? refetchLogs() : refetchSessions()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition-all"
                    >
                        <FaSync size={14} /> Refresh
                    </button>
                    {activeTab === 'logs' && (
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md transition-all"
                        >
                            <FaDownload size={14} /> Export
                        </button>
                    )}
                </div>
            }
        >

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-white rounded-[32px] p-8 border border-gray-100 hover:border-blue-100 transition-all group">
                    <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Activity className="text-blue-600" size={24} />
                        </div>
                        <span className="text-3xl font-black text-gray-900 tracking-tight leading-none">{logsData?.total || 0}</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Activities</p>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Last 24 hours</p>
                </div>

                <div className="bg-white rounded-[32px] p-8 border border-gray-100 hover:border-emerald-100 transition-all group">
                    <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FaDesktop className="text-emerald-600" size={20} />
                        </div>
                        <span className="text-3xl font-black text-gray-900 tracking-tight leading-none">{sessionsData?.length || 0}</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Sessions</p>
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Currently online</p>
                </div>

                <div className="bg-white rounded-[32px] p-8 border border-gray-100 hover:border-rose-100 transition-all group">
                    <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FaShieldAlt className="text-rose-600" size={20} />
                        </div>
                        <span className="text-3xl font-black text-gray-900 tracking-tight leading-none">{suspiciousData?.length || 0}</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anomalies Detected</p>
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Requires Attention</p>
                </div>

                <div className="bg-white rounded-[32px] p-8 border border-gray-100 hover:border-indigo-100 transition-all group">
                    <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FaUser className="text-indigo-600" size={20} />
                        </div>
                        <span className="text-3xl font-black text-gray-900 tracking-tight leading-none">{analyticsData?.uniqueUsers || 0}</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Operatives</p>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Last 24 hours</p>
                </div>
            </div>

            {/* Suspicious Activities Alert */}
            {suspiciousData && suspiciousData.length > 0 && (
                <div className="bg-rose-50 border border-rose-100 p-6 mb-10 rounded-[24px] flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                        <FaExclamationTriangle className="text-rose-500 text-xl" />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Security Protocol Alert</h3>
                        <p className="text-sm font-black text-gray-900 tracking-tight uppercase">
                            {suspiciousData.length} suspicious activities require immediate validation
                        </p>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 mb-10 overflow-hidden">
                <div className="border-b border-gray-50 bg-[#fafafa]/50">
                    <nav className="flex gap-8 px-8">
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={`py-6 border-b-2 transition-all group ${activeTab === 'logs'
                                ? 'border-indigo-600'
                                : 'border-transparent'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <FileText size={14} className={activeTab === 'logs' ? 'text-indigo-600' : 'text-slate-400'} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'logs' ? 'text-gray-900' : 'text-slate-400 group-hover:text-gray-600'}`}>
                                    Operation Logs
                                </span>
                                {logsData?.total && (
                                    <span className="ml-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black tracking-tighter">
                                        {logsData.total}
                                    </span>
                                )}
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('sessions')}
                            className={`py-6 border-b-2 transition-all group ${activeTab === 'sessions'
                                ? 'border-indigo-600'
                                : 'border-transparent'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <FaDesktop size={14} className={activeTab === 'sessions' ? 'text-indigo-600' : 'text-slate-400'} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'sessions' ? 'text-gray-900' : 'text-slate-400 group-hover:text-gray-600'}`}>
                                    Active Matrix
                                </span>
                                {sessionsData?.length > 0 && (
                                    <span className="ml-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black tracking-tighter">
                                        {sessionsData.length}
                                    </span>
                                )}
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`py-6 border-b-2 transition-all group ${activeTab === 'analytics'
                                ? 'border-indigo-600'
                                : 'border-transparent'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <FaChartLine size={14} className={activeTab === 'analytics' ? 'text-indigo-600' : 'text-slate-400'} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'analytics' ? 'text-gray-900' : 'text-slate-400 group-hover:text-gray-600'}`}>
                                    Pattern Analysis
                                </span>
                            </div>
                        </button>
                    </nav>
                </div>

                {/* Activity Logs Tab */}
                {activeTab === 'logs' && (
                    <div className="p-6">
                        {/* Filters */}
                        {showFilters && (
                            <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                {/* Search Bar */}
                                <div className="mb-4">
                                    <div className="relative">
                                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by user email, IP address, or resource..."
                                            value={filters.search}
                                            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                                            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                {/* Filter Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                    <select
                                        value={filters.action}
                                        onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}
                                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">All Actions</option>
                                        <option value="LOGIN">Login</option>
                                        <option value="LOGOUT">Logout</option>
                                        <option value="CREATE">Create</option>
                                        <option value="UPDATE">Update</option>
                                        <option value="DELETE">Delete</option>
                                        <option value="VIEW">View</option>
                                    </select>

                                    <select
                                        value={filters.resource}
                                        onChange={(e) => setFilters({ ...filters, resource: e.target.value, page: 1 })}
                                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">All Resources</option>
                                        <option value="users">Users</option>
                                        <option value="loads">Loads</option>
                                        <option value="trucks">Trucks</option>
                                        <option value="payments">Payments</option>
                                        <option value="permissions">Permissions</option>
                                        <option value="roles">Roles</option>
                                    </select>

                                    <select
                                        value={filters.isSuspicious}
                                        onChange={(e) => setFilters({ ...filters, isSuspicious: e.target.value, page: 1 })}
                                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">All Activities</option>
                                        <option value="true">Suspicious Only</option>
                                        <option value="false">Normal Only</option>
                                    </select>

                                    <input
                                        type="date"
                                        value={filters.startDate}
                                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
                                        placeholder="Start Date"
                                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                    />

                                    <input
                                        type="date"
                                        value={filters.endDate}
                                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
                                        placeholder="End Date"
                                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                {/* Quick Filters */}
                                <div className="flex items-center gap-2 mt-3 flex-wrap">
                                    <span className="text-xs font-medium text-slate-600">Quick Filters:</span>
                                    <button
                                        onClick={() => setFilters({ ...filters, startDate: new Date().toISOString().split('T')[0], endDate: '', page: 1 })}
                                        className="px-3 py-1 text-xs bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                                    >
                                        Today
                                    </button>
                                    <button
                                        onClick={() => {
                                            const date = new Date();
                                            date.setDate(date.getDate() - 7);
                                            setFilters({ ...filters, startDate: date.toISOString().split('T')[0], endDate: '', page: 1 });
                                        }}
                                        className="px-3 py-1 text-xs bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                                    >
                                        Last 7 Days
                                    </button>
                                    <button
                                        onClick={() => setFilters({ ...filters, isSuspicious: 'true', page: 1 })}
                                        className="px-3 py-1 text-xs bg-red-50 border border-red-200 text-red-700 rounded-md hover:bg-red-100 transition-colors"
                                    >
                                        Suspicious Only
                                    </button>

                                    {/* Tenant Filter Badge */}
                                    {tenantFilter && (
                                        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-md">
                                            <FaBuilding className="text-indigo-600 text-xs" />
                                            <span className="text-xs font-medium text-indigo-700">
                                                Tenant: {tenantFilter.name}
                                            </span>
                                            <button
                                                onClick={() => setTenantFilter(null)}
                                                className="ml-1 text-indigo-600 hover:text-indigo-800"
                                            >
                                                <FaTimesCircle className="text-xs" />
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => {
                                            setFilters({ action: '', resource: '', isSuspicious: '', startDate: '', endDate: '', search: '', page: 1 });
                                            setTenantFilter(null);
                                        }}
                                        className="px-3 py-1 text-xs bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors ml-auto"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            </div>
                        )}

                        {logsLoading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                                <p className="mt-4 text-slate-600">Loading activities...</p>
                            </div>
                        ) : logsData?.activities?.length === 0 ? (
                            <div className="text-center py-16">
                                <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-slate-700 mb-2">No Activities Found</h3>
                                <p className="text-slate-500">Try adjusting your filters or check back later.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {logsData?.activities?.map((log: ActivityLog) => (
                                    <div
                                        key={log.id}
                                        onClick={() => setSelectedLog(log)}
                                        className={`p-6 rounded-[24px] border border-gray-100 cursor-pointer ${log.isSuspicious
                                            ? 'bg-rose-50/50 hover:border-rose-200'
                                            : 'bg-white hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50/50'
                                            } transition-all group`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-4 mb-4 flex-wrap">
                                                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${log.action.includes('DELETE') ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                        log.action.includes('CREATE') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                            log.action.includes('UPDATE') ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                                'bg-gray-50 text-gray-600 border-gray-100'
                                                        }`}>
                                                        {log.action}
                                                    </span>
                                                    {log.resource && (
                                                        <span className="text-sm font-black text-gray-900 tracking-tight uppercase">
                                                            {log.resource} <span className="text-slate-400 font-medium">#{log.resourceId?.slice(0, 8)}</span>
                                                        </span>
                                                    )}
                                                    {log.isSuspicious && (
                                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
                                                            <FaExclamationTriangle size={10} /> Security Risk
                                                        </span>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedLog(log);
                                                        }}
                                                        className="ml-auto text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2"
                                                    >
                                                        Details <Eye size={12} />
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-slate-400">
                                                            <FaUser size={12} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Operative</p>
                                                            <p className="text-xs font-black text-gray-900 tracking-tight uppercase">{log.user?.email || 'System'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-slate-400">
                                                            <FaGlobe size={12} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Access Point</p>
                                                            <p className="text-xs font-black text-gray-900 tracking-tight uppercase font-mono">{log.ipAddress}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-slate-400">
                                                            <FaClock size={12} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Timestamp</p>
                                                            <p className="text-xs font-black text-gray-900 tracking-tight uppercase">
                                                                {new Date(log.createdAt).toLocaleString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                    second: '2-digit'
                                                                })}
                                                            </p>
                                                        </div>
                                                    </div>
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
                        ) : sessionsData?.length === 0 ? (
                            <div className="text-center py-16">
                                <FaDesktop className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-slate-700 mb-2">No Active Sessions</h3>
                                <p className="text-slate-500">There are currently no active user sessions.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {sessionsData?.map((session: UserSession) => (
                                    <div key={session.id} className="p-4 bg-white border border-slate-200 rounded-lg hover:border-indigo-200 hover:shadow-md transition-all">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                {session.deviceInfo?.isMobile ? (
                                                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                        <FaMobile className="text-indigo-600 text-lg" />
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                        <FaDesktop className="text-indigo-600 text-lg" />
                                                    </div>
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
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <p className="text-slate-500 text-xs mb-1">IP Address</p>
                                                <p className="font-medium text-slate-700">{session.ipAddress}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 text-xs mb-1">Location</p>
                                                <p className="font-medium text-slate-700">{session.location?.city || 'Unknown'}, {session.location?.country || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 text-xs mb-1">Last Activity</p>
                                                <p className="font-medium text-slate-700">{new Date(session.lastActivity).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 text-xs mb-1">Session Started</p>
                                                <p className="font-medium text-slate-700">{new Date(session.createdAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                    <div className="p-6">
                        {analyticsLoading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                                <p className="mt-4 text-slate-600">Loading analytics...</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Coming Soon Message */}
                                <div className="text-center py-16 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                                    <TrendingUp className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">Analytics Dashboard Coming Soon</h3>
                                    <p className="text-slate-600 max-w-md mx-auto">
                                        We're building comprehensive analytics to help you understand activity patterns, user behavior, and security trends.
                                    </p>
                                    <div className="mt-6 flex items-center justify-center gap-4 text-sm text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span>Activity Trends</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            <span>User Insights</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                            <span>Security Reports</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Activity Details Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedLog(null)}>
                    <div className="bg-white rounded-[32px] max-w-2xl w-full overflow-hidden shadow-2xl animate-enter" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-50 p-8 flex items-center justify-between z-10">
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Analysis Protocol</h3>
                                <p className="text-xl font-black text-gray-900 tracking-tight uppercase">Activity Matrix Details</p>
                            </div>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="w-10 h-10 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center text-slate-400 transition-colors"
                            >
                                <FaTimesCircle size={18} />
                            </button>
                        </div>
                        <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Operation Type</p>
                                    <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${selectedLog.action.includes('DELETE') ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                        selectedLog.action.includes('CREATE') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            selectedLog.action.includes('UPDATE') ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                'bg-gray-50 text-gray-600 border-gray-100'
                                        }`}>
                                        {selectedLog.action}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Subject Resource</p>
                                    <p className="text-sm font-black text-gray-900 tracking-tight uppercase">{selectedLog.resource || 'SYSTEM CORE'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Matrix Operative</p>
                                    <p className="text-sm font-black text-gray-900 tracking-tight uppercase">{selectedLog.user?.email || 'SYSTEM AUTOMATION'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Source Protocol (IP)</p>
                                    <p className="text-sm font-black text-gray-900 tracking-tight uppercase font-mono">{selectedLog.ipAddress}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Temporal Marker</p>
                                    <p className="text-sm font-black text-gray-900 tracking-tight uppercase">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Security Status</p>
                                    {selectedLog.isSuspicious ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest">
                                            <FaExclamationTriangle size={10} /> SECURITY ALERT
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                                            <FaShieldAlt size={10} /> VALIDATED
                                        </span>
                                    )}
                                </div>
                            </div>

                            {selectedLog.userAgent && (
                                <div className="p-6 bg-[#fafafa] rounded-[24px] border border-gray-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Client Interface (User Agent)</p>
                                    <p className="text-xs font-medium text-gray-600 leading-relaxed font-mono break-all italic">
                                        {selectedLog.userAgent}
                                    </p>
                                </div>
                            )}

                            {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                                <div className="p-6 bg-gray-900 rounded-[24px] border border-gray-800">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Extended Payload</p>
                                    <pre className="text-[11px] text-emerald-400 font-mono overflow-x-auto custom-scrollbar">
                                        {JSON.stringify(selectedLog.details, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AdminPageLayout>
    );
};

export default ActivityLogs;
