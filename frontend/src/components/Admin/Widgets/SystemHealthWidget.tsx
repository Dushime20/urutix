import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    FaServer, FaArrowRight, FaSpinner, FaCheckCircle,
    FaExclamationTriangle, FaDatabase, FaMemory
} from 'react-icons/fa';
import { Cpu, Activity } from 'lucide-react';
import { monitoringApi } from '../../../services/monitoringApi';

const SystemHealthWidget: React.FC = () => {
    const navigate = useNavigate();
    const [lastUpdate, setLastUpdate] = useState(new Date());

    const { data: health, isLoading, refetch } = useQuery({
        queryKey: ['system-health-widget'],
        queryFn: () => monitoringApi.getSystemHealth(),
        refetchInterval: 10000, // Refresh every 10s
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setLastUpdate(new Date());
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const metrics = {
        serverStatus: health?.data?.server?.status || 'unknown',
        dbStatus: health?.data?.database?.status || 'unknown',
        cpuUsage: health?.data?.cpu?.usage || 0,
        memoryUsage: health?.data?.memory?.usage || 0,
        activeConnections: health?.data?.connections?.active || 0,
        responseTime: health?.data?.performance?.avgResponseTime || 0,
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
            case 'operational':
                return 'text-emerald-500';
            case 'warning':
                return 'text-amber-500';
            case 'error':
            case 'down':
                return 'text-red-500';
            default:
                return 'text-slate-500';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy':
            case 'operational':
                return <FaCheckCircle className="text-emerald-500" size={16} />;
            case 'warning':
                return <FaExclamationTriangle className="text-amber-500" size={16} />;
            case 'error':
            case 'down':
                return <FaExclamationTriangle className="text-red-500" size={16} />;
            default:
                return <FaSpinner className="animate-spin text-slate-500" size={16} />;
        }
    };

    const getUsageColor = (usage: number) => {
        if (usage < 50) return 'bg-emerald-500';
        if (usage < 80) return 'bg-amber-500';
        return 'bg-red-500';
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                        <FaServer className="text-purple-600" size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">System Health</h3>
                        <p className="text-xs text-slate-500">Real-time monitoring</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/admin/monitoring')}
                    className="text-sm font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                >
                    Details <FaArrowRight size={12} />
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-32">
                    <FaSpinner className="animate-spin text-purple-600" size={24} />
                </div>
            ) : (
                <>
                    {/* Status Indicators */}
                    <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <FaServer className="text-slate-600" size={14} />
                                <span className="text-sm font-medium text-slate-700">Server</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {getStatusIcon(metrics.serverStatus)}
                                <span className={`text-sm font-bold capitalize ${getStatusColor(metrics.serverStatus)}`}>
                                    {metrics.serverStatus}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <FaDatabase className="text-slate-600" size={14} />
                                <span className="text-sm font-medium text-slate-700">Database</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {getStatusIcon(metrics.dbStatus)}
                                <span className={`text-sm font-bold capitalize ${getStatusColor(metrics.dbStatus)}`}>
                                    {metrics.dbStatus}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Resource Usage */}
                    <div className="space-y-3 mb-6">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Cpu size={14} className="text-slate-600" />
                                    <span className="text-xs font-medium text-slate-700">CPU Usage</span>
                                </div>
                                <span className="text-xs font-bold text-slate-800">{metrics.cpuUsage}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all ${getUsageColor(metrics.cpuUsage)}`}
                                    style={{ width: `${metrics.cpuUsage}%` }}
                                ></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <FaMemory size={14} className="text-slate-600" />
                                    <span className="text-xs font-medium text-slate-700">Memory Usage</span>
                                </div>
                                <span className="text-xs font-bold text-slate-800">{metrics.memoryUsage}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all ${getUsageColor(metrics.memoryUsage)}`}
                                    style={{ width: `${metrics.memoryUsage}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="text-center p-2 bg-blue-50 rounded-lg">
                            <div className="text-lg font-black text-blue-600">{metrics.activeConnections}</div>
                            <div className="text-[10px] text-blue-600 font-medium mt-0.5">Active Users</div>
                        </div>
                        <div className="text-center p-2 bg-emerald-50 rounded-lg">
                            <div className="text-lg font-black text-emerald-600">{metrics.responseTime}ms</div>
                            <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Response Time</div>
                        </div>
                    </div>

                    {/* Last Update */}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Auto-refresh: 10s</span>
                        <span>Updated: {lastUpdate.toLocaleTimeString()}</span>
                    </div>
                </>
            )}
        </div>
    );
};

export default SystemHealthWidget;
