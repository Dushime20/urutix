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
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
      {/* List Header */}
      <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Clock size={16} />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Chronology</h3>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity Vector</h4>
          </div>
        </div>
        <button className="h-10 w-10 bg-gray-100 dark:bg-gray-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all group">
          <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform text-gray-400 dark:text-gray-500 group-hover:text-white" />
        </button>
      </div>

      {/* Activities Grid */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {isLoading ? (
          // Loading skeleton
          <div className="p-8 space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-6 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedActivities.length > 0 ? (
          displayedActivities.map((activity) => (
            <div
              key={activity.id}
              className={`p-6 px-8 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer group relative`}
            >
              <div className="flex items-start gap-6">
                {/* Visual Anchor */}
                <div
                  className={`size-12 rounded-lg flex-shrink-0 flex items-center justify-center transition-all ${activity.type === 'maintenance_due'
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 group-hover:bg-red-600 group-hover:text-white'
                    : activity.type === 'payment_received'
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 group-hover:bg-green-600 group-hover:text-white'
                      : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white'
                    }`}
                >
                  {getActivityIcon(activity.type)}
                </div>

                {/* Content Matrix */}
                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{activity.title}</p>
                        {activity.status === 'warning' && (
                          <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed truncate">{activity.description}</p>
                    </div>
                    {activity.amount && (
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-green-600 dark:text-green-400 text-sm">
                          + KES {activity.amount.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Meta Vector */}
                  <div className="flex items-center gap-4 mt-3">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                      <Clock size={12} className="opacity-60" />
                      {formatDate(activity.timestamp)}
                    </span>
                    <div className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span
                      className={`text-xs font-medium ${activity.status === 'completed'
                        ? 'text-green-600 dark:text-green-400'
                        : activity.status === 'warning'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-blue-600 dark:text-blue-400'
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
            <div className="size-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-600 mb-6">
              <Activity size={32} />
            </div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">No Historical Data</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Operational chronology will populate upon asset deployment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TruckOwnerRecentActivities;
