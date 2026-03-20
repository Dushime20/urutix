import React, { useEffect, useState } from 'react';
import { TranslatedText } from '../../translated-text';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Activity, ArrowRight, Loader2, CheckCircle,
    AlertCircle, Database, Server, Cpu, HardDrive
} from 'lucide-react';
import { monitoringApi } from '../../../services/monitoringApi';
import { DataCard } from '../../EnliteUI';

const SystemHealthWidget: React.FC = () => {
    const navigate = useNavigate();
    const [lastUpdate, setLastUpdate] = useState(new Date());

    const { data: health, isLoading } = useQuery({
        queryKey: ['system-health-widget'],
        queryFn: () => monitoringApi.getSystemHealth(),
        refetchInterval: 10000,
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setLastUpdate(new Date());
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const metrics = {
        serverStatus: health?.services?.api?.status || 'unknown',
        dbStatus: health?.services?.database?.status || 'unknown',
        cpuUsage: health?.resources?.cpu?.loadAverage ? Math.round(health.resources.cpu.loadAverage[0] * 100) : 0,
        memoryUsage: Math.round(health?.resources?.memory?.system?.usagePercent || 0),
        activeConnections: 0,
        responseTime: health?.services?.database?.responseTime ? parseInt(health.services.database.responseTime) : 0,
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
            case 'operational': return 'text-emerald-500 bg-emerald-50';
            case 'warning': return 'text-amber-500 bg-amber-50';
            case 'error':
            case 'down': return 'text-rose-500 bg-rose-50';
            default: return 'text-slate-500 bg-slate-50';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy':
            case 'operational': return <CheckCircle size={14} />;
            case 'warning': return <AlertCircle size={14} />;
            case 'error':
            case 'down': return <AlertCircle size={14} />;
            default: return <Loader2 className="animate-spin" size={14} />;
        }
    };

    const getUsageColor = (usage: number) => {
        if (usage < 50) return 'bg-emerald-500';
        if (usage < 80) return 'bg-amber-500';
        return 'bg-rose-500';
    };

    return (
        <DataCard
            title={<TranslatedText text="System Health" />}
            subtitle={<TranslatedText text="Real-time Node Monitoring" />}
            headerColor="secondary"
            icon={<Activity size={20} />}
            actions={
                <button
                    onClick={() => navigate('/admin/monitoring')}
                    className="text-[10px] font-black text-white hover:text-primary-200 flex items-center gap-1 uppercase tracking-widest transition-all"
                >
                    <TranslatedText text="Details" /> <ArrowRight size={10} />
                </button>
            }
        >
            {isLoading ? (
                <div className="flex items-center justify-center h-48">
                    <Loader2 className="animate-spin text-primary-600" size={24} />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Status Tiles */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'API SERVER', status: metrics.serverStatus, icon: Server },
                            { label: 'DATABASE', status: metrics.dbStatus, icon: Database }
                        ].map((item, i) => {
                            const Icon = item.icon;
                            const statusStyle = getStatusColor(item.status);
                            return (
                                <div key={i} className="p-3 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all group">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-primary-600 transition-colors">
                                            <Icon size={14} />
                                        </div>
                                        <div className={`p-1.5 rounded-lg ${statusStyle}`}>
                                            {getStatusIcon(item.status)}
                                        </div>
                                    </div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">{item.label}</div>
                                    <div className={`text-[10px] font-black uppercase tracking-tight mt-1 ${statusStyle.split(' ')[0]}`}>{item.status}</div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Resources */}
                    <div className="space-y-4">
                        {[
                            { label: 'CPU LOAD', usage: metrics.cpuUsage, icon: Cpu },
                            { label: 'MEMORY LOAD', usage: metrics.memoryUsage, icon: HardDrive }
                        ].map((res, i) => (
                            <div key={i}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <res.icon size={12} className="text-slate-400" />
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{res.label}</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-900">{res.usage}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${getUsageColor(res.usage)}`}
                                        style={{ width: `${res.usage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Meta Stats */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-50 font-black text-[9px] text-slate-400 uppercase tracking-widest">
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>LATENCY: {metrics.responseTime}MS</span>
                        </div>
                        <span>SYNC: {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                </div>
            )}
        </DataCard>
    );
};

export default SystemHealthWidget;
