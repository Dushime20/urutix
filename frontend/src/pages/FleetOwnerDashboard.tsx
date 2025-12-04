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
import { cargoOwnerAPI } from '../services/cargoApi';
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
  const [assignedLoads, setAssignedLoads] = useState<any[]>([]);
  const [loadingLoads, setLoadingLoads] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Load trucks - fleetApi.getTrucks() already returns the trucks array directly
      const trucksData = await fleetApi.getTrucks();
      console.log('🚛 FleetOwnerDashboard - Trucks data:', trucksData);
      console.log('🚛 FleetOwnerDashboard - Trucks length:', Array.isArray(trucksData) ? trucksData.length : 'N/A');
      setTrucks(Array.isArray(trucksData) ? trucksData : []);

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

  const loadAssignedLoads = useCallback(async () => {
    if (!user || user.role !== 'TRUCK_OWNER') return;
    
    setLoadingLoads(true);
    try {
      const response = await cargoOwnerAPI.getAssignedLoads({
        page: 1,
        limit: 10,
        sortBy: 'pickupDate',
        sortOrder: 'ASC',
      });
      const loads = response.data?.data || response.data || [];
      setAssignedLoads(Array.isArray(loads) ? loads : []);
    } catch (error: any) {
      console.error('Error loading assigned loads:', error);
      // Don't show error toast as this is optional data
    } finally {
      setLoadingLoads(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboardData();
    loadAssignedLoads();
  }, [loadDashboardData, loadAssignedLoads]);

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
      <div className="relative z-10 space-y-3">
        {/* Header */}
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900 mb-0.5">Dashboard</h1>
              <p className="text-xs text-gray-600">Welcome back! Here's your fleet overview</p>
            </div>
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="px-2.5 py-1.5 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-1.5 disabled:opacity-50"
            >
              <FaSync className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              onClick={() => navigate(card.link)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className={`${card.bgColor} p-1.5 rounded-md`}>
                  <Icon className={`w-3.5 h-3.5 ${card.textColor}`} />
                </div>
                <FaEye className="w-3 h-3 text-gray-400 group-hover:text-primary-600 transition-colors" />
              </div>
              <h3 className="text-xs font-medium text-gray-500 mb-0.5">{card.title}</h3>
              <p className="text-base font-bold text-gray-900 mb-0.5">{card.value}</p>
              <p className="text-[10px] text-gray-500 leading-tight">{card.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
            <h2 className="text-xs font-semibold text-gray-900 mb-1.5">Quick Actions</h2>
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold text-gray-900">Recent Activity</h2>
              <button
                onClick={() => navigate('/dashboard/fleet/notifications')}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                View All
              </button>
            </div>
            <div className="space-y-1.5">
              {recentActivities.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <FaClock className="w-6 h-6 mx-auto mb-1.5 text-gray-400" />
                  <p className="text-xs">No recent activity</p>
                </div>
              ) : (
                recentActivities.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div key={activity.id} className="flex items-start gap-1.5 p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`${activity.color} p-1 rounded-md`}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-xs text-gray-900">{activity.title}</h4>
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
        <h2 className="text-xs font-semibold text-gray-900 mb-2">Fleet Status Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <div className="border-l-2 border-blue-500 pl-2">
            <div className="text-xs text-gray-500">Available</div>
            <div className="text-lg font-bold text-gray-900">{stats.trucksAvailable}</div>
            <div className="text-[10px] text-gray-400">Ready for assignment</div>
          </div>
          <div className="border-l-2 border-purple-500 pl-2">
            <div className="text-xs text-gray-500">In Transit</div>
            <div className="text-lg font-bold text-gray-900">{stats.trucksInTransit}</div>
            <div className="text-[10px] text-gray-400">Currently on trips</div>
          </div>
          <div className="border-l-2 border-orange-500 pl-2">
            <div className="text-xs text-gray-500">Maintenance</div>
            <div className="text-lg font-bold text-gray-900">{stats.trucksInMaintenance}</div>
            <div className="text-[10px] text-gray-400">Requires attention</div>
          </div>
          <div className="border-l-2 border-gray-400 pl-2">
            <div className="text-xs text-gray-500">Other</div>
            <div className="text-lg font-bold text-gray-900">
              {stats.totalTrucks - stats.trucksAvailable - stats.trucksInTransit - stats.trucksInMaintenance}
            </div>
            <div className="text-[10px] text-gray-400">Other statuses</div>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Revenue Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
          <h2 className="text-xs font-semibold text-gray-900 mb-1.5">Revenue Summary</h2>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between p-1.5 bg-gray-50 rounded-md border border-gray-200">
              <div>
                <div className="text-xs text-gray-500">Total Revenue</div>
                <div className="text-sm font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</div>
              </div>
              <FaDollarSign className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
            </div>
            <div className="flex items-center justify-between p-1.5 bg-gray-50 rounded-md border border-gray-200">
              <div>
                <div className="text-xs text-gray-500">This Month</div>
                <div className="text-sm font-bold text-gray-900">{formatCurrency(stats.monthlyRevenue)}</div>
              </div>
              <FaChartLine className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
            </div>
            <div className="flex items-center justify-between p-1.5 bg-gray-50 rounded-md border border-gray-200">
              <div>
                <div className="text-xs text-gray-500">Pending Payments</div>
                <div className="text-sm font-bold text-gray-900">{formatCurrency(stats.pendingPayments)}</div>
              </div>
              <FaCreditCard className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
            </div>
          </div>
        </div>

        {/* Trip Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
          <h2 className="text-xs font-semibold text-gray-900 mb-1.5">Trip Summary</h2>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between p-1.5 bg-gray-50 rounded-md border border-gray-200">
              <div>
                <div className="text-xs text-gray-500">Active Trips</div>
                <div className="text-sm font-bold text-gray-900">{stats.activeTrips}</div>
              </div>
              <FaRoute className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
            </div>
            <div className="flex items-center justify-between p-1.5 bg-gray-50 rounded-md border border-gray-200">
              <div>
                <div className="text-xs text-gray-500">Completed</div>
                <div className="text-sm font-bold text-gray-900">{stats.completedTrips}</div>
              </div>
              <FaCheckCircle className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
            </div>
            <div className="flex items-center justify-between p-1.5 bg-gray-50 rounded-md border border-gray-200">
              <div>
                <div className="text-xs text-gray-500">Utilization Rate</div>
                <div className="text-sm font-bold text-gray-900">{stats.utilizationRate}%</div>
              </div>
              <FaTachometerAlt className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* Assigned Loads Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-gray-900">Assigned Loads</h2>
          {assignedLoads.length > 0 && (
            <button
              onClick={() => navigate('/fleet/loads')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              View All
            </button>
          )}
        </div>
        {loadingLoads ? (
          <div className="text-center py-4 text-gray-500">
            <FaSync className="w-4 h-4 mx-auto mb-1 animate-spin" />
            <p className="text-xs">Loading assigned loads...</p>
          </div>
        ) : assignedLoads.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <FaBox className="w-6 h-6 mx-auto mb-1.5 text-gray-400" />
            <p className="text-xs">No assigned loads yet</p>
            <p className="text-[10px] text-gray-400 mt-1">Accepted bids will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {assignedLoads.slice(0, 5).map((load: any) => (
              <div
                key={load.id}
                className="flex items-start gap-2 p-2 bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => navigate(`/loads/${load.id}`)}
              >
                <FaBox className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-medium text-gray-900 truncate">
                    {load.title || 'Untitled Load'}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      load.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-700' :
                      load.status === 'IN_TRANSIT' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {load.status || 'ASSIGNED'}
                    </span>
                    {load.pickupDate && (
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <FaCalendarAlt className="w-2.5 h-2.5" />
                        {new Date(load.pickupDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {load.pickupLocation || load.deliveryLocation ? (
                    <p className="text-[10px] text-gray-600 mt-0.5 truncate">
                      {load.pickupLocation?.name || load.pickupLocation?.address || 'Pickup'} → {load.deliveryLocation?.name || load.deliveryLocation?.address || 'Delivery'}
                    </p>
                  ) : null}
                </div>
                <FaEye className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default FleetOwnerDashboard;

