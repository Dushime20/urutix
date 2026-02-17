import React, { useMemo } from 'react';
import {
  CheckCircle2,
  Truck,
  DollarSign,
  AlertTriangle,
  Users,
  Fuel,
  MapPin,
  Clock,
  ChevronRight,
  Shield,
  Activity
} from 'lucide-react';

interface Activity {
  id: string;
  type: 'trip_completed' | 'trip_started' | 'payment_received' | 'maintenance_due' | 'driver_assigned' | 'fuel_logged' | 'expense_recorded' | 'route_assigned';
  title: string;
  description: string;
  timestamp: Date | string;
  icon?: React.ReactNode;
  color?: string;
  amount?: number;
  status?: 'completed' | 'pending' | 'warning';
}

interface TruckOwnerRecentActivitiesProps {
  activities?: Activity[];
  isLoading?: boolean;
}

const getActivityIcon = (type: string): React.ReactNode => {
  switch (type) {
    case 'trip_completed':
      return <CheckCircle2 className="size-5" />;
    case 'trip_started':
      return <Truck className="size-5" />;
    case 'payment_received':
      return <DollarSign className="size-5" />;
    case 'maintenance_due':
      return <AlertTriangle className="size-5" />;
    case 'driver_assigned':
      return <Users className="size-5" />;
    case 'fuel_logged':
      return <Fuel className="size-5" />;
    case 'expense_recorded':
      return <DollarSign className="size-5" />;
    case 'route_assigned':
      return <MapPin className="size-5" />;
    default:
      return <Activity className="size-5" />;
  }
};

const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return dateObj.toLocaleDateString();
};

// Mock data for demonstration
const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'trip_completed',
    title: 'Trip Vector Terminated',
    description: 'Cargo delivery to Mombasa logistics terminal confirmed.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'completed',
  },
  {
    id: '2',
    type: 'payment_received',
    title: 'Treasury Inbound Confirm',
    description: 'Contract payment for Nairobi-Kisumu corridor processed.',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    amount: 8500,
    status: 'completed',
  },
  {
    id: '3',
    type: 'fuel_logged',
    title: 'Energy Resource Sync',
    description: 'Asset E-92 logged 45 liters of diesel consumed.',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    status: 'completed',
  },
  {
    id: '4',
    type: 'trip_started',
    title: 'Trip Vector Initiated',
    description: 'Asset deployment: Nairobi to Nakuru via Highway-A1',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: 'completed',
  },
  {
    id: '5',
    type: 'maintenance_due',
    title: 'Mechanical Health Alert',
    description: 'System diagnostic recommends service within 500km.',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'warning',
  },
];

export const TruckOwnerRecentActivities: React.FC<TruckOwnerRecentActivitiesProps> = ({
  activities = mockActivities,
  isLoading = false,
}) => {
  const displayedActivities = useMemo(() => {
    return activities.slice(0, 5);
  }, [activities]);

  return (
    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
      {/* List Header */}
      <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center text-[#345E85] shadow-inner">
            <Clock size={16} />
          </div>
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Chronology</h3>
            <h4 className="text-lg font-black text-slate-900 tracking-tight">Recent Activity Vector</h4>
          </div>
        </div>
        <button className="h-10 w-10 bg-slate-50 hover:bg-[#345E85] hover:text-white rounded-xl flex items-center justify-center transition-all group">
          <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Activities Grid */}
      <div className="divide-y divide-slate-50">
        {isLoading ? (
          // Loading skeleton
          <div className="p-8 space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-6 animate-pulse">
                <div className="w-12 h-12 bg-slate-100 rounded-[18px] flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-slate-100 rounded-full w-1/3" />
                  <div className="h-3 bg-slate-50 rounded-full w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedActivities.length > 0 ? (
          displayedActivities.map((activity) => (
            <div
              key={activity.id}
              className={`p-6 px-8 hover:bg-slate-50/50 transition-all cursor-pointer group relative`}
            >
              <div className="flex items-start gap-6">
                {/* Visual Anchor */}
                <div
                  className={`size-12 rounded-[18px] flex-shrink-0 flex items-center justify-center transition-all shadow-sm ${activity.type === 'maintenance_due'
                      ? 'bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white'
                      : activity.type === 'payment_received'
                        ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
                        : 'bg-blue-50 text-[#345E85] group-hover:bg-[#345E85] group-hover:text-white'
                    }`}
                >
                  {getActivityIcon(activity.type)}
                </div>

                {/* Content Matrix */}
                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-black text-slate-900 text-sm tracking-tight">{activity.title}</p>
                        {activity.status === 'warning' && (
                          <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-500 leading-relaxed truncate">{activity.description}</p>
                    </div>
                    {activity.amount && (
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-emerald-600 text-sm italic">
                          + KES {activity.amount.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Meta Vector */}
                  <div className="flex items-center gap-4 mt-3">
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <Clock size={12} className="opacity-60" />
                      {formatDate(activity.timestamp)}
                    </span>
                    <div className="h-1 w-1 rounded-full bg-slate-200" />
                    <span
                      className={`text-[9px] font-black uppercase tracking-[0.2em] ${activity.status === 'completed'
                          ? 'text-emerald-500'
                          : activity.status === 'warning'
                            ? 'text-rose-500'
                            : 'text-[#345E85]'
                        }`}
                    >
                      {activity.status} PROTOCOL
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          // System Empty State
          <div className="p-20 text-center flex flex-col items-center">
            <div className="size-16 bg-slate-50 rounded-[28px] flex items-center justify-center text-slate-200 mb-6">
              <Activity size={32} />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">No Historical Data</p>
            <p className="text-sm font-medium text-slate-400 mt-2">Operational chronology will populate upon asset deployment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TruckOwnerRecentActivities;
