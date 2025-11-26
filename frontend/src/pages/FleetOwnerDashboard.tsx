import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaTruck, 
  FaUsers, 
  FaDollarSign, 
  FaRoute,
  FaChartLine,
  FaChartPie,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaMapMarkerAlt,
  FaBox,
  FaUser,
  FaSync,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaPlus,
  FaCalendarAlt,
  FaTachometerAlt,
  FaShieldAlt,
  FaCreditCard
} from 'react-icons/fa';
import { fleetApi, type FleetItem, type Driver, type FleetAnalytics } from '../services/fleetApi';
import { tripsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import logoUrutiX from '../assets/logo-urutix.svg';

interface DashboardStats {
  totalTrucks: number;
  trucksInTransit: number;
  trucksAvailable: number;
  trucksInMaintenance: number;
  totalDrivers: number;
  activeDrivers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
  activeTrips: number;
  completedTrips: number;
  utilizationRate: number;
}

interface RecentActivity {
  id: string;
  type: 'trip_completed' | 'payment_received' | 'maintenance_due' | 'driver_assigned' | 'trip_started';
  title: string;
  description: string;
  timestamp: string;
  icon: any;
  color: string;
}

const FleetOwnerDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalTrucks: 0,
    trucksInTransit: 0,
    trucksAvailable: 0,
    trucksInMaintenance: 0,
    totalDrivers: 0,
    activeDrivers: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    activeTrips: 0,
    completedTrips: 0,
    utilizationRate: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [trucks, setTrucks] = useState<FleetItem[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Load trucks
      const trucksData = await fleetApi.getTrucks();
      setTrucks(trucksData);

      // Load drivers
      const driversData = await fleetApi.getDrivers();
      setDrivers(driversData);

      // Load trips
      let tripsData: any[] = [];
      try {
        const tripsResponse = await tripsAPI.getAll({});
        tripsData = tripsResponse.data?.data || tripsResponse.data?.trips || tripsResponse.data || [];
        if (!Array.isArray(tripsData)) tripsData = [];
      } catch (e) {
        console.warn('Failed to load trips:', e);
      }

      // Calculate stats
      const trucksInTransit = trucksData.filter(t => 
        t.status?.toLowerCase() === 'intransit' || 
        t.status?.toLowerCase() === 'in_transit' ||
        t.status?.toLowerCase() === 'in-transit'
      ).length;

      const trucksAvailable = trucksData.filter(t => 
        t.status?.toLowerCase() === 'available' || 
        t.status?.toLowerCase() === 'idle'
      ).length;

      const trucksInMaintenance = trucksData.filter(t => 
        t.status?.toLowerCase() === 'maintenance' || 
        t.status?.toLowerCase() === 'repair'
      ).length;

      const activeTrips = tripsData.filter(t => 
        ['IN_TRANSIT', 'IN_PROGRESS', 'ACTIVE', 'ONGOING'].includes(t.status?.toUpperCase())
      ).length;

      const completedTrips = tripsData.filter(t => 
        t.status?.toUpperCase() === 'COMPLETED'
      ).length;

      // Calculate revenue (dummy for now)
      const totalRevenue = trucksData.reduce((sum, truck) => sum + (truck.totalRevenue || 0), 0);
      const monthlyRevenue = totalRevenue * 0.3; // Approximate 30% of total as monthly
      const pendingPayments = trucksInTransit * 5000; // Dummy calculation

      const utilizationRate = trucksData.length > 0 
        ? (trucksInTransit / trucksData.length) * 100 
        : 0;

      setStats({
        totalTrucks: trucksData.length,
        trucksInTransit,
        trucksAvailable,
        trucksInMaintenance,
        totalDrivers: driversData.length,
        activeDrivers: driversData.filter(d => d.status === 'ACTIVE').length,
        totalRevenue,
        monthlyRevenue,
        pendingPayments,
        activeTrips,
        completedTrips,
        utilizationRate: Math.round(utilizationRate),
      });

      // Generate recent activities
      const activities: RecentActivity[] = [
        ...tripsData.slice(0, 3).map((trip, idx) => ({
          id: `trip-${trip.id}`,
          type: 'trip_completed' as const,
          title: 'Trip Completed',
          description: `Trip ${trip.tripNumber || trip.id} completed successfully`,
          timestamp: new Date(Date.now() - idx * 2 * 60 * 60 * 1000).toISOString(),
          icon: FaCheckCircle,
          color: 'text-green-600',
        })),
        ...trucksData.filter(t => trucksInMaintenance > 0).slice(0, 2).map((truck, idx) => ({
          id: `maintenance-${truck.id}`,
          type: 'maintenance_due' as const,
          title: 'Maintenance Due',
          description: `${truck.plateNumber} requires scheduled maintenance`,
          timestamp: new Date(Date.now() - (idx + 3) * 2 * 60 * 60 * 1000).toISOString(),
          icon: FaExclamationTriangle,
          color: 'text-orange-600',
        })),
      ].slice(0, 5).sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setRecentActivities(activities);
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const statCards = [
    {
      title: 'Total Trucks',
      value: stats.totalTrucks,
      subtitle: `${stats.trucksAvailable} available`,
      icon: FaTruck,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      link: '/dashboard/fleet/trucks',
    },
    {
      title: 'In Transit',
      value: stats.trucksInTransit,
      subtitle: `${stats.activeTrips} active trips`,
      icon: FaRoute,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      link: '/dashboard/fleet/payments',
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats.monthlyRevenue),
      subtitle: `${stats.completedTrips} trips completed`,
      icon: FaDollarSign,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      link: '/dashboard/fleet/analytics',
    },
    {
      title: 'Pending Payments',
      value: formatCurrency(stats.pendingPayments),
      subtitle: `${stats.trucksInTransit} trucks awaiting payment`,
      icon: FaCreditCard,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      link: '/dashboard/fleet/payments',
    },
    {
      title: 'Active Drivers',
      value: stats.activeDrivers,
      subtitle: `${stats.totalDrivers} total drivers`,
      icon: FaUsers,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      link: '/dashboard/fleet/drivers',
    },
    {
      title: 'Fleet Utilization',
      value: `${stats.utilizationRate}%`,
      subtitle: `${stats.trucksInTransit} of ${stats.totalTrucks} trucks active`,
      icon: FaChartLine,
      color: 'bg-teal-500',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-600',
      link: '/dashboard/fleet/analytics',
    },
  ];

  const quickActions = [
    {
      title: 'Add Truck',
      description: 'Register a new truck',
      icon: FaPlus,
      action: () => navigate('/dashboard/fleet/trucks'),
    },
    {
      title: 'Add Driver',
      description: 'Register a new driver',
      icon: FaUser,
      action: () => navigate('/dashboard/fleet/drivers'),
    },
    {
      title: 'View Payments',
      description: 'Manage payments',
      icon: FaCreditCard,
      action: () => navigate('/dashboard/fleet/payments'),
    },
    {
      title: 'View Analytics',
      description: 'Fleet performance',
      icon: FaChartLine,
      action: () => navigate('/dashboard/fleet/analytics'),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSync className="w-8 h-8 text-primary-600 animate-spin mr-3" />
        <span className="text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Background Logo */}
      <img 
        src={logoUrutiX} 
        alt="UrutiX Logo Background" 
        className="pointer-events-none select-none fixed inset-0 w-full h-full object-cover opacity-5 z-0" 
        style={{objectPosition: 'center'}} 
      />
      {/* Content */}
      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Dashboard</h1>
              <p className="text-xs text-gray-600">Welcome back! Here's your fleet overview</p>
            </div>
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 disabled:opacity-50"
            >
              <FaSync className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              onClick={() => navigate(card.link)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`${card.bgColor} p-1.5 rounded-md`}>
                  <Icon className={`w-4 h-4 ${card.textColor}`} />
                </div>
                <FaEye className="w-3 h-3 text-gray-400 group-hover:text-primary-600 transition-colors" />
              </div>
              <h3 className="text-xs font-medium text-gray-500 mb-0.5">{card.title}</h3>
              <p className="text-lg font-bold text-gray-900 mb-0.5">{card.value}</p>
              <p className="text-[10px] text-gray-500 leading-tight">{card.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <h2 className="text-xs font-semibold text-gray-900 mb-2">Quick Actions</h2>
            <div className="space-y-1.5">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={action.action}
                    className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-md px-2.5 py-1.5 flex items-center gap-2 transition-all hover:border-gray-300 hover:shadow-sm"
                  >
                    <Icon className="w-3 h-3 text-gray-600 flex-shrink-0" />
                    <div className="text-left flex-1 min-w-0">
                      <div className="font-medium text-xs text-gray-900 truncate">{action.title}</div>
                      <div className="text-[10px] text-gray-500 truncate">{action.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Recent Activity</h2>
              <button
                onClick={() => navigate('/dashboard/fleet/notifications')}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                View All
              </button>
            </div>
            <div className="space-y-2">
              {recentActivities.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <FaClock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-xs">No recent activity</p>
                </div>
              ) : (
                recentActivities.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div key={activity.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`${activity.color} p-1.5 rounded-md`}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-gray-900">{activity.title}</h4>
                        <p className="text-xs text-gray-600">{activity.description}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{formatTimeAgo(activity.timestamp)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fleet Status Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Fleet Status Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="border-l-2 border-blue-500 pl-3">
            <div className="text-xs text-gray-500">Available</div>
            <div className="text-xl font-bold text-gray-900">{stats.trucksAvailable}</div>
            <div className="text-[10px] text-gray-400">Ready for assignment</div>
          </div>
          <div className="border-l-2 border-purple-500 pl-3">
            <div className="text-xs text-gray-500">In Transit</div>
            <div className="text-xl font-bold text-gray-900">{stats.trucksInTransit}</div>
            <div className="text-[10px] text-gray-400">Currently on trips</div>
          </div>
          <div className="border-l-2 border-orange-500 pl-3">
            <div className="text-xs text-gray-500">Maintenance</div>
            <div className="text-xl font-bold text-gray-900">{stats.trucksInMaintenance}</div>
            <div className="text-[10px] text-gray-400">Requires attention</div>
          </div>
          <div className="border-l-2 border-gray-400 pl-3">
            <div className="text-xs text-gray-500">Other</div>
            <div className="text-xl font-bold text-gray-900">
              {stats.totalTrucks - stats.trucksAvailable - stats.trucksInTransit - stats.trucksInMaintenance}
            </div>
            <div className="text-[10px] text-gray-400">Other statuses</div>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Revenue Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <h2 className="text-xs font-semibold text-gray-900 mb-2">Revenue Summary</h2>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md border border-gray-200">
              <div>
                <div className="text-xs text-gray-500">Total Revenue</div>
                <div className="text-base font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</div>
              </div>
              <FaDollarSign className="w-4 h-4 text-gray-600 flex-shrink-0" />
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md border border-gray-200">
              <div>
                <div className="text-xs text-gray-500">This Month</div>
                <div className="text-base font-bold text-gray-900">{formatCurrency(stats.monthlyRevenue)}</div>
              </div>
              <FaChartLine className="w-4 h-4 text-gray-600 flex-shrink-0" />
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md border border-gray-200">
              <div>
                <div className="text-xs text-gray-500">Pending Payments</div>
                <div className="text-base font-bold text-gray-900">{formatCurrency(stats.pendingPayments)}</div>
              </div>
              <FaCreditCard className="w-4 h-4 text-gray-600 flex-shrink-0" />
            </div>
          </div>
        </div>

        {/* Trip Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <h2 className="text-xs font-semibold text-gray-900 mb-2">Trip Summary</h2>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md border border-gray-200">
              <div>
                <div className="text-xs text-gray-500">Active Trips</div>
                <div className="text-base font-bold text-gray-900">{stats.activeTrips}</div>
              </div>
              <FaRoute className="w-4 h-4 text-gray-600 flex-shrink-0" />
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md border border-gray-200">
              <div>
                <div className="text-xs text-gray-500">Completed</div>
                <div className="text-base font-bold text-gray-900">{stats.completedTrips}</div>
              </div>
              <FaCheckCircle className="w-4 h-4 text-gray-600 flex-shrink-0" />
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md border border-gray-200">
              <div>
                <div className="text-xs text-gray-500">Utilization Rate</div>
                <div className="text-base font-bold text-gray-900">{stats.utilizationRate}%</div>
              </div>
              <FaTachometerAlt className="w-4 h-4 text-gray-600 flex-shrink-0" />
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default FleetOwnerDashboard;

