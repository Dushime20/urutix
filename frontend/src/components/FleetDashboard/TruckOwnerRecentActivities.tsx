import React, { useMemo } from 'react';
import {
  FaTruck,
  FaCheckCircle,
  FaExclamationTriangle,
  FaDollarSign,
  FaMapMarkerAlt,
  FaGasPump,
  FaUsers,
  FaClock,
} from 'react-icons/fa';
import { Clock, ChevronRight } from 'lucide-react';

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
      return <FaCheckCircle className="w-5 h-5 text-green-600" />;
    case 'trip_started':
      return <FaTruck className="w-5 h-5 text-blue-600" />;
    case 'payment_received':
      return <FaDollarSign className="w-5 h-5 text-emerald-600" />;
    case 'maintenance_due':
      return <FaExclamationTriangle className="w-5 h-5 text-orange-600" />;
    case 'driver_assigned':
      return <FaUsers className="w-5 h-5 text-purple-600" />;
    case 'fuel_logged':
      return <FaGasPump className="w-5 h-5 text-yellow-600" />;
    case 'expense_recorded':
      return <FaDollarSign className="w-5 h-5 text-red-600" />;
    case 'route_assigned':
      return <FaMapMarkerAlt className="w-5 h-5 text-indigo-600" />;
    default:
      return <FaClock className="w-5 h-5 text-gray-600" />;
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
    title: 'Trip Completed',
    description: 'Trip to Mombasa completed successfully',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'completed',
  },
  {
    id: '2',
    type: 'payment_received',
    title: 'Payment Received',
    description: 'Payment for Nairobi-Kisumu trip received',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    amount: 8500,
    status: 'completed',
  },
  {
    id: '3',
    type: 'fuel_logged',
    title: 'Fuel Logged',
    description: 'Fuel consumption recorded: 45 liters',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    status: 'completed',
  },
  {
    id: '4',
    type: 'trip_started',
    title: 'Trip Started',
    description: 'Started trip from Nairobi to Nakuru',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: 'completed',
  },
  {
    id: '5',
    type: 'maintenance_due',
    title: 'Maintenance Alert',
    description: 'Truck maintenance due in 500km',
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Recent Activities</h3>
            <p className="text-sm text-gray-500 mt-0.5">Latest updates from your fleet</p>
          </div>
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors">
          View All <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Activities List */}
      <div className="divide-y divide-gray-100">
        {isLoading ? (
          // Loading skeleton
          <div className="p-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedActivities.length > 0 ? (
          displayedActivities.map((activity) => (
            <div
              key={activity.id}
              className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 ${
                activity.type === 'maintenance_due'
                  ? 'border-l-orange-500 bg-orange-50/30'
                  : 'border-l-blue-500'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`p-2.5 rounded-lg flex-shrink-0 ${
                    activity.type === 'payment_received'
                      ? 'bg-emerald-100'
                      : activity.type === 'trip_completed'
                      ? 'bg-green-100'
                      : activity.type === 'maintenance_due'
                      ? 'bg-orange-100'
                      : 'bg-blue-100'
                  }`}
                >
                  {getActivityIcon(activity.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{activity.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                    </div>
                    {activity.amount && (
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-green-700 text-sm">
                          +KES {activity.amount.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Timestamp and Status */}
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <FaClock className="w-3 h-3" />
                      {formatDate(activity.timestamp)}
                    </span>
                    {activity.status && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          activity.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : activity.status === 'pending'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          // Empty state
          <div className="p-12 text-center">
            <FaClock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No recent activities</p>
            <p className="text-sm text-gray-400 mt-1">Your activities will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TruckOwnerRecentActivities;
