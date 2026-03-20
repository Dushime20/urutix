import React from 'react';
import { TranslatedText } from '../translated-text';
import {
    CheckCircle,
    Bell,
    AlertTriangle,
    Info,
    Shield,
    DollarSign,
    Truck,
    ArrowRight
} from 'lucide-react';

interface ActivityItem {
    id: string;
    type: 'security' | 'financial' | 'operations' | 'system';
    title: string;
    description: string;
    timestamp: string;
    status: 'success' | 'warning' | 'error' | 'info';
}

const AdminActivityFeed: React.FC = () => {
    const activities: ActivityItem[] = [
        {
            id: '1',
            type: 'operations',
            title: 'Shipment #SH-8821 Completed',
            description: 'Successfully delivered to Mombasa Port by Fleet ABC',
            timestamp: '2 min ago',
            status: 'success'
        },
        {
            id: '2',
            type: 'security',
            title: 'New Tenant Registered',
            description: 'ABC Logistics joined the platform with Premium plan',
            timestamp: '15 min ago',
            status: 'info'
        },
        {
            id: '3',
            type: 'operations',
            title: 'Maintenance Alert',
            description: 'Truck KCA-452 requires urgent service (Engine Overheating)',
            timestamp: '1 hr ago',
            status: 'warning'
        },
        {
            id: '4',
            type: 'financial',
            title: 'Large Transaction Detected',
            description: 'Disbursement of $12,500 processed for Tenant XYZ',
            timestamp: '3 hr ago',
            status: 'success'
        },
        {
            id: '5',
            type: 'security',
            title: 'Failed Login Attempt',
            description: 'Unauthorized access attempt from IP 192.168.1.45',
            timestamp: '5 hr ago',
            status: 'error'
        }
    ];

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success': return CheckCircle;
            case 'warning': return AlertTriangle;
            case 'error': return Shield;
            default: return Info;
        }
    };

    const getStatusColors = (status: string) => {
        switch (status) {
            case 'success': return 'text-emerald-500 bg-emerald-50';
            case 'warning': return 'text-amber-500 bg-amber-50';
            case 'error': return 'text-rose-500 bg-rose-50';
            default: return 'text-slate-400 bg-slate-50';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'financial': return DollarSign;
            case 'operations': return Truck;
            case 'security': return Shield;
            default: return Bell;
        }
    };

    return (
        <div className="space-y-4">
            {activities.map((activity) => {
                const StatusIcon = getStatusIcon(activity.status);
                const TypeIcon = getTypeIcon(activity.type);
                const statusColors = getStatusColors(activity.status);

                return (
                    <div
                        key={activity.id}
                        className="flex gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all group cursor-pointer border border-transparent hover:border-slate-100"
                    >
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-100 text-slate-500 transition-colors group-hover:bg-primary-500 group-hover:text-white">
                                <TypeIcon size={18} />
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${statusColors}`}>
                                <StatusIcon size={10} strokeWidth={3} />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate group-hover:text-primary-600 transition-colors">
                                    {activity.title}
                                </h4>
                                <span className="text-[9px] font-black text-slate-400 whitespace-nowrap bg-slate-100 px-2 py-0.5 rounded-lg uppercase tracking-widest">
                                    <TranslatedText text={activity.timestamp} />
                                </span>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 mt-1 line-clamp-1 uppercase tracking-widest opacity-80">{activity.description}</p>
                            <div className="mt-2 flex items-center justify-between">
                                <span className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-[0.2em] bg-slate-100 text-slate-500 border border-slate-200">
                                    <TranslatedText text={activity.type} />
                                </span>
                                <button className="text-[9px] font-black text-slate-400 hover:text-primary-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all uppercase tracking-widest">
                                    <TranslatedText text="Details" /> <ArrowRight size={10} />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default AdminActivityFeed;
