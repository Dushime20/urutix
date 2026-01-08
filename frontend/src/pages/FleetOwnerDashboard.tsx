import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaTruck, 
  FaUsers, 
  FaDollarSign, 
  FaRoute,
  FaChartLine,
  FaClock,
  FaBox,
  FaEye,
  FaSync,
  FaSpinner,
  FaArrowUp,
  FaArrowDown,
  FaCalendarAlt,
  FaTachometerAlt,
  FaShieldAlt,
  FaCreditCard,
  FaFileAlt,
  FaHistory,
  FaPlus,
  FaUser,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import { 
  Clock, 
  Layout, 
  Truck, 
  Users, 
  FileText, 
  BarChart3, 
  Wallet, 
  History, 
  HelpCircle,
  Mic,
  Camera,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { fleetApi, type FleetItem, type Driver, type FleetAnalytics as FleetAnalyticsType } from '../services/fleetApi';
import { tripsAPI } from '../services/api';
import { cargoOwnerAPI } from '../services/cargoApi';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import logoUrutiX from '../assets/logo-urutix.svg';
import DashboardHeader from '../components/Layout/DashboardHeader';
import DashboardFooter from '../components/Layout/DashboardFooter';
import { cn } from '../utils/cn';
import { TranslatedText } from '../components/translated-text';

// Feature Components
const UnifiedFleetManagement = React.lazy(() => import('./UnifiedFleetManagement'));
const UnifiedDriverManagement = React.lazy(() => import('./UnifiedDriverManagement'));
const UnifiedFinancialManagement = React.lazy(() => import('./dashboard/financial/UnifiedFinancialManagement'));
const UnifiedDocumentManagement = React.lazy(() => import('./dashboard/documents/UnifiedDocumentManagement'));
const FleetAnalytics = React.lazy(() => import('./FleetAnalytics'));
const FleetHelpSupport = React.lazy(() => import('./FleetHelpSupport'));

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
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState('Overview');
  const tabs = [
    { name: 'Overview', icon: Layout },
    { name: 'Fleet', icon: Truck },
    { name: 'Drivers', icon: Users },
    { name: 'Analytics', icon: BarChart3 },
    { name: 'Financial', icon: Wallet },
    { name: 'Documents', icon: FileText },
    { name: 'Support', icon: HelpCircle },
  ];

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
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <FaSpinner className="animate-spin text-primary-600 text-3xl mx-auto mb-4" />
          <p className="text-sm text-gray-500 font-medium">Loading your fleet dashboard...</p>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="relative z-10 space-y-4">
      {/* 1. Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              onClick={() => {
                if (card.title === 'Total Trucks') setActiveTab('Fleet');
                else if (card.title === 'Active Drivers') setActiveTab('Drivers');
                else if (card.title === 'Monthly Revenue') setActiveTab('Financial');
                else navigate(card.link);
              }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 hover:shadow-md transition-all cursor-pointer group hover:border-primary-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`${card.bgColor} p-2 rounded-lg`}>
                  <Icon className={`w-4 h-4 ${card.textColor}`} />
                </div>
                <FaEye className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-600 transition-colors" />
              </div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{card.title}</h3>
              <p className="text-lg font-extrabold text-gray-900 mb-0.5">{card.value}</p>
              <p className="text-[10px] text-gray-500 font-medium leading-tight">{card.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* 2. Advanced Features Section (The "Everything" part) */}
      <section aria-label="Advanced Features">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary-500" />
            Advanced Fleet Tools
          </h2>
          <span className="text-[10px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-bold">PREMIUM</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveTab('Fleet')}
            className="p-5 bg-white border border-gray-200 rounded-2xl text-left hover:shadow-lg transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
              <Mic className="w-16 h-16" />
            </div>
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-sm font-bold text-gray-900">Voice Logs</h3>
              <div className="bg-gray-50 rounded-lg p-2 group-hover:bg-primary-50 transition-colors">
                <Mic className="w-5 h-5 text-gray-600 group-hover:text-primary-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">Speak to record trip updates or maintenance notes</p>
          </button>

          <button
            onClick={() => setActiveTab('Documents')}
            className="p-5 bg-white border border-gray-200 rounded-2xl text-left hover:shadow-lg transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
              <Camera className="w-16 h-16" />
            </div>
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-sm font-bold text-gray-900">Scan Receipts</h3>
              <div className="bg-gray-50 rounded-lg p-2 group-hover:bg-primary-50 transition-colors">
                <Camera className="w-5 h-5 text-gray-600 group-hover:text-primary-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">Instant OCR for fuel receipts and toll invoices</p>
          </button>

          <button
            onClick={() => setActiveTab('Analytics')}
            className="p-5 bg-gradient-to-br from-indigo-500 to-primary-600 rounded-2xl text-left shadow-lg hover:shadow-xl transition-all group text-white border-none"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-sm font-bold">Smart Insights</h3>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-indigo-50 leading-relaxed">AI-powered analytics for fleet performance optimization</p>
          </button>

          <button
            onClick={() => navigate('/dashboard/fleet/routes')}
            className="p-5 bg-white border border-gray-200 rounded-2xl text-left hover:shadow-lg transition-all group relative overflow-hidden"
          >
             <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
              <FaRoute className="w-16 h-16" />
            </div>
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-sm font-bold text-gray-900">Route AI</h3>
              <div className="bg-gray-50 rounded-lg p-2 group-hover:bg-primary-50 transition-colors">
                <FaRoute className="w-5 h-5 text-gray-600 group-hover:text-primary-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">Optimize multi-stop routes for maximum fuel efficiency</p>
          </button>
        </div>
      </section>

      {/* 3. Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 h-full">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={action.action}
                    className="w-full bg-gray-50 hover:bg-white hover:shadow-md border border-gray-200 text-gray-700 rounded-xl p-3 flex items-center gap-3 transition-all hover:border-primary-300"
                  >
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 group-hover:bg-primary-50 transition-colors">
                      <Icon className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="font-bold text-xs text-gray-900 truncate">{action.title}</div>
                      <div className="text-[10px] text-gray-400 truncate font-medium">{action.description}</div>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-gray-300" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary-500" />
                Live Fleet Activity
              </h2>
              <button
                onClick={() => navigate('/dashboard/fleet/notifications')}
                className="text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1 rounded-full transition-colors"
              >
                View Logs
              </button>
            </div>
            <div className="space-y-3">
              {recentActivities.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs font-medium text-gray-500">No recent activity detected</p>
                </div>
              ) : (
                recentActivities.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                      <div className={`${activity.color.replace('text-', 'bg-').replace('-600', '-100')} ${activity.color} p-2 rounded-lg`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-xs text-gray-900">{activity.title}</h4>
                          <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{formatTimeAgo(activity.timestamp)}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 font-medium">{activity.description}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {/* Fleet Status Overview */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary-500" />
              Fleet Composition
            </h2>
            <div className="flex gap-1">
               <div className="w-2 h-2 rounded-full bg-blue-500"></div>
               <div className="w-2 h-2 rounded-full bg-purple-500"></div>
               <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
              <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Available</div>
              <div className="text-3xl font-black text-blue-900">{stats.trucksAvailable}</div>
              <div className="text-[10px] text-blue-500 font-bold mt-1">READY FOR LOADS</div>
            </div>
            <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
              <div className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-1">In Transit</div>
              <div className="text-3xl font-black text-purple-900">{stats.trucksInTransit}</div>
              <div className="text-[10px] text-purple-500 font-bold mt-1">GENERATE REVENUE</div>
            </div>
            <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 col-span-2">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1">Maintenance</div>
                  <div className="text-3xl font-black text-orange-900">{stats.trucksInMaintenance}</div>
                </div>
                <div className="text-right">
                   <div className="text-[10px] text-orange-500 font-bold">REQUIRES ATTENTION</div>
                   <div className="text-[9px] text-orange-400 mt-1 uppercase">Next service due: 2 days</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Performance Highlights */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
           <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary-500" />
              Financial Pulse
            </h2>
            <button 
              onClick={() => setActiveTab('Financial')}
              className="text-[10px] font-bold text-primary-600 hover:underline flex items-center gap-1"
            >
              FULL REPORT <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:bg-white hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-xl text-green-600">
                  <FaDollarSign className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Total Revenue</div>
                  <div className="text-lg font-black text-gray-900">{formatCurrency(stats.totalRevenue)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-green-600 flex items-center gap-0.5">
                   <TrendingUp className="w-3 h-3" /> 14%
                </div>
                <div className="text-[9px] text-gray-400">vs last period</div>
              </div>
            </div>

             <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:bg-white hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-xl text-orange-600">
                  <FaCreditCard className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Pending Payments</div>
                  <div className="text-lg font-black text-gray-900">{formatCurrency(stats.pendingPayments)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                   DUE SOON
                </div>
                <div className="text-[9px] text-gray-400 mt-1">3 invoices open</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:bg-white hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Utilization Rate</div>
                  <div className="text-lg font-black text-gray-900">{stats.utilizationRate}%</div>
                </div>
              </div>
               <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                 <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${stats.utilizationRate}%` }}></div>
               </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
      {/* Background Logo Overlay */}
      <img 
        src={logoUrutiX} 
        alt="UrutiX Logo Background" 
        className="pointer-events-none select-none fixed inset-0 w-full h-full object-cover opacity-5 z-0 grayscale" 
        style={{objectPosition: 'center'}} 
      />

      <DashboardHeader />

      <main className="flex-1 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Dashboard Title & Quick Nav */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-1 bg-primary-600 rounded-full"></div>
                <span className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em]">Command Center</span>
              </div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                Fleet <span className="text-primary-600">Overview</span>
              </h1>
              <p className="text-gray-500 text-sm font-medium mt-1">
                Welcome back, {user?.firstName}. Managing <span className="text-gray-900 font-bold">{stats.totalTrucks} vehicles</span> across all routes.
              </p>
            </div>

            {/* Premium Tab Selection */}
            <div className="bg-white p-1 rounded-2xl shadow-sm border border-gray-200 inline-flex overflow-x-auto scrollbar-hide max-w-full">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.name;
                return (
                  <button
                    key={tab.name}
                    onClick={() => setActiveTab(tab.name)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap",
                      isActive 
                        ? "bg-gray-900 text-white shadow-lg scale-105" 
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", isActive ? "text-primary-400" : "text-gray-400")} />
                    <span className="text-xs font-bold uppercase tracking-tight">{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Unified Tab Content Section */}
          <div className="mt-6">
            <React.Suspense fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Initializing Component...</p>
                </div>
              </div>
            }>
              {activeTab === 'Overview' && renderOverview()}
              
              {activeTab === 'Fleet' && <UnifiedFleetManagement />}
              
              {activeTab === 'Drivers' && <UnifiedDriverManagement />}
              
              {activeTab === 'Analytics' && <FleetAnalytics />}
              
              {activeTab === 'Financial' && <UnifiedFinancialManagement />}
              
              {activeTab === 'Documents' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                       <FileText className="w-6 h-6 text-primary-500" />
                       Document Library
                    </h2>
                    <p className="text-sm text-gray-500 mb-6">Access and manage all fleet-related legal, compliance, and transaction documents.</p>
                    <UnifiedDocumentManagement />
                  </div>
                </div>
              )}
              
              {activeTab === 'Support' && <FleetHelpSupport />}
            </React.Suspense>
          </div>
        </div>
      </main>

      <DashboardFooter />
    </div>
  );
};

export default FleetOwnerDashboard;

