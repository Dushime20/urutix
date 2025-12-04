import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  MapPin, 
  Clock, 
  Truck, 
  DollarSign, 
  Shield, 
  Navigation, 
  MessageSquare, 
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Route,
  User,
  Settings,
  Package
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { driverApi } from '../../services/driverApi';
import { DriverStats } from './DriverStats';
import { CurrentTrip } from './CurrentTrip';
import { EarningsOverview } from './EarningsOverview';
import { SafetyMetrics } from './SafetyMetrics';
import { UpcomingTrips } from './UpcomingTrips';
import { QuickActions } from './QuickActions';
import { NotificationsPanel } from './NotificationsPanel';
import { CargoManagement } from './CargoManagement';
import DriverTrips from './DriverTrips';

const DriverDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [driverId, setDriverId] = useState<string>('');
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
    }
  }, [location.pathname]);

  // Fetch driver data
  const { data: driver, isLoading: driverLoading } = useQuery({
    queryKey: ['driver', driverId],
    queryFn: () => driverApi.getDriverProfile(driverId),
    enabled: !!driverId,
  });

  // Fetch current trip
  const { data: currentTrip, isLoading: tripLoading } = useQuery({
    queryKey: ['driver-current-trip', driverId],
    queryFn: () => driverApi.getCurrentTrip(driverId),
    enabled: !!driverId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch driver stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['driver-stats', driverId],
    queryFn: () => driverApi.getDriverStats(driverId),
    enabled: !!driverId,
  });

  // Fetch upcoming trips
  const { data: upcomingTrips, isLoading: upcomingLoading } = useQuery({
    queryKey: ['driver-upcoming-trips', driverId],
    queryFn: () => driverApi.getUpcomingTrips(driverId),
    enabled: !!driverId,
  });

  // Fetch notifications
  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ['driver-notifications', driverId],
    queryFn: () => driverApi.getNotifications(driverId),
    enabled: !!driverId,
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Truck },
    { id: 'cargo', label: 'Cargo Management', icon: Package },
    { id: 'trips', label: 'Trips', icon: Route },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'safety', label: 'Safety', icon: Shield },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (driverLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {driver?.firstName} {driver?.lastName}
                  </h1>
                  <p className="text-sm text-gray-500">Driver Dashboard</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{driver?.currentLocation || 'Location unavailable'}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
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
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Current Trip Status */}
            {currentTrip && (
              <CurrentTrip trip={currentTrip} />
            )}

            {/* Quick Stats */}
            <DriverStats stats={stats} loading={statsLoading} />

            {/* Quick Actions */}
            <QuickActions driverId={driverId} />

            {/* Upcoming Trips */}
            <UpcomingTrips trips={upcomingTrips} loading={upcomingLoading} />

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

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Settings & Preferences</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-500">Settings features coming soon...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;
