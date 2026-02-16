import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Truck, 
  DollarSign, 
  Shield, 
  MessageSquare, 
  FileText,
  Route,
  User,
  Settings,
  Package,
  LogOut
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { driverApi } from '../../services/driverApi';
import { exportDriverData, type ExportData } from '../../utils/exportUtils';
import { DriverHeader } from './DriverHeader';
import { DriverQuickStats } from './DriverQuickStats';
import { TimeRangeSelector } from './TimeRangeSelector';
import { DriverSkeleton } from './DriverSkeleton';
import { DriverEarningsChart } from './DriverEarningsChart';
import { DriverPerformanceChart } from './DriverPerformanceChart';
import { CurrentTrip } from './CurrentTrip';
import { EarningsOverview } from './EarningsOverview';
import { SafetyMetrics } from './SafetyMetrics';
import { UpcomingTrips } from './UpcomingTrips';
import { QuickActions } from './QuickActions';
import { NotificationsPanel } from './NotificationsPanel';
import { CargoManagement } from './CargoManagement';
import DriverTrips from './DriverTrips';
import { DriverProfile } from './DriverProfile';
import { DriverSettings } from './DriverSettings';
import { TranslatedText } from '../translated-text';

const DriverDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [driverId, setDriverId] = useState<string>('');
  const [timeRange, setTimeRange] = useState('7d');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const location = useLocation();

  // Find driver by userId when user is available
  const { data: driverByUserId } = useQuery({
    queryKey: ['driver-by-user-id', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        // Try to find driver by userId
        const drivers = await driverApi.getDrivers({ search: user.email || '' });
        const driver = drivers.find((d: any) => d.userId === user.id || d.email === user.email);
        return driver;
      } catch (error) {
        console.error('Error finding driver:', error);
        return null;
      }
    },
    enabled: !!user?.id && !driverId,
  });

  // Set driverId when driver is found
  useEffect(() => {
    if (driverByUserId?.id) {
      setDriverId(driverByUserId.id);
    } else if (user?.id) {
      // Fallback: try using userId directly if no driver record found
      setDriverId(user.id);
    }
  }, [driverByUserId, user]);

  // Set active tab based on route
  useEffect(() => {
    if (location.pathname.endsWith('/trips')) {
      setActiveTab('trips');
    } else if (location.pathname.endsWith('/cargo')) {
      setActiveTab('cargo');
    } else if (location.pathname.endsWith('/earnings')) {
      setActiveTab('earnings');
    } else if (location.pathname.endsWith('/safety')) {
      setActiveTab('safety');
    } else if (location.pathname.endsWith('/documents')) {
      setActiveTab('documents');
    } else if (location.pathname.endsWith('/messages')) {
      setActiveTab('messages');
    } else if (location.pathname.endsWith('/settings')) {
      setActiveTab('settings');
    } else if (location.pathname.endsWith('/profile')) {
      setActiveTab('profile');
    }
  }, [location.pathname]);

  // Fetch driver data
  const { data: driver, isLoading: driverLoading } = useQuery({
    queryKey: ['driver', driverId],
    queryFn: () => driverApi.getDriverProfile(driverId),
    enabled: !!driverId,
  });

  // Fetch current trip
  const { data: currentTrip } = useQuery({
    queryKey: ['driver-current-trip', driverId],
    queryFn: () => driverApi.getCurrentTrip(driverId),
    enabled: !!driverId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch driver stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['driver-stats', driverId, timeRange],
    queryFn: () => driverApi.getDriverStats(driverId),
    enabled: !!driverId,
  });

  // Fetch upcoming trips
  const { data: upcomingTrips, isLoading: upcomingLoading } = useQuery({
    queryKey: ['driver-upcoming-trips', driverId, timeRange],
    queryFn: () => driverApi.getUpcomingTrips(driverId),
    enabled: !!driverId,
  });

  // Fetch notifications
  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ['driver-notifications', driverId],
    queryFn: () => driverApi.getNotifications(driverId),
    enabled: !!driverId,
  });

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['driver'] }),
        queryClient.invalidateQueries({ queryKey: ['driver-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['driver-trips'] }),
        queryClient.invalidateQueries({ queryKey: ['driver-current-trip'] }),
        queryClient.invalidateQueries({ queryKey: ['driver-upcoming-trips'] }),
        queryClient.invalidateQueries({ queryKey: ['driver-notifications'] }),
        new Promise(resolve => setTimeout(resolve, 800))
      ]);
      setLastUpdated(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  // Export handler
  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      // Prepare export data
      const exportData: ExportData = {
        driver: driver,
        stats: stats,
        trips: upcomingTrips,
        performance: {
          onTimeDelivery: stats?.onTimeDeliveryRate || 0,
          safetyScore: stats?.safetyScore || 0,
          customerRating: (stats?.rating || 0) * 20,
          fuelEfficiency: 85,
          loadUtilization: 90,
          responseTime: 87
        },
        timeRange: timeRange,
        exportDate: new Date().toISOString()
      };

      // Export with proper formatting
      await exportDriverData(exportData, {
        format,
        filename: `driver-${driver?.firstName}-${driver?.lastName}`,
        includeCharts: format === 'pdf'
      });

      // Show success message (you can add a toast notification here)
      console.log(`Successfully exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      // Show error message (you can add a toast notification here)
      alert(`Failed to export as ${format.toUpperCase()}. Please try again.`);
    }
  };

  // Time range change handler
  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    // Queries will automatically refetch due to queryKey dependency
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Truck },
    { id: 'cargo', label: 'Cargo Management', icon: Package },
    { id: 'trips', label: 'Trips', icon: Route },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'safety', label: 'Safety', icon: Shield },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (driverLoading) {
    return <DriverSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with new DriverHeader component */}
      <DriverHeader
        driver={driver}
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        onExport={handleExport}
      />

      {/* Logout Button - positioned in top right */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={logout}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors shadow-sm bg-white border border-gray-200"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline"><TranslatedText text="Logout" /></span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span><TranslatedText text={tab.label} /></span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Time Range Selector */}
        <div className="mb-6">
          <TimeRangeSelector
            value={timeRange}
            onChange={handleTimeRangeChange}
          />
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats with new component */}
            <DriverQuickStats 
              stats={{
                totalTrips: stats?.totalTrips,
                totalEarnings: stats?.totalEarnings,
                rating: stats?.rating,
                completionRate: stats?.onTimeDeliveryRate,
                activeTrips: currentTrip ? 1 : 0,
                hoursWorked: stats?.hoursWorkedThisWeek
              }}
              isLoading={statsLoading}
            />

            {/* Current Trip Status */}
            {currentTrip && (
              <CurrentTrip trip={currentTrip as any} />
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Earnings Chart */}
              <DriverEarningsChart
                isLoading={statsLoading}
                timeRange={timeRange}
              />

              {/* Performance Chart */}
              <DriverPerformanceChart
                data={{
                  onTimeDelivery: stats?.onTimeDeliveryRate || 0,
                  safetyScore: stats?.safetyScore || 0,
                  customerRating: (stats?.rating || 0) * 20, // Convert 5-star to percentage
                  fuelEfficiency: 85, // Mock - would come from API
                  loadUtilization: 90, // Mock - would come from API
                  responseTime: 87 // Mock - would come from API
                }}
                isLoading={statsLoading}
              />
            </div>

            {/* Quick Actions */}
            <QuickActions driverId={driverId} />

            {/* Upcoming Trips */}
            <UpcomingTrips trips={upcomingTrips as any} loading={upcomingLoading} />

            {/* Recent Notifications */}
            <NotificationsPanel notifications={notifications} loading={notificationsLoading} />
          </div>
        )}

        {activeTab === 'cargo' && (
          <div className="space-y-6">
            <CargoManagement driverId={driverId} />
          </div>
        )}

        {activeTab === 'trips' && (
          <div className="space-y-6">
            {driverId ? (
              <DriverTrips driverId={driverId} />
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500">Loading driver information...</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="space-y-6">
            {driverId ? (
              <EarningsOverview driverId={driverId} />
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500">Loading driver information...</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'safety' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Safety & Compliance</h2>
            <SafetyMetrics driverId={driverId} />
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Documents & Certifications</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-500">Document management features coming soon...</p>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Messages & Communication</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-500">Messaging features coming soon...</p>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <DriverProfile driver={driver} loading={driverLoading} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <DriverSettings />
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;
