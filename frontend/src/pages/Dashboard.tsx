import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  Package, 
  Truck, 
  CreditCard, 
  Users, 
  MapPin,
  Clock,
  CheckCircle,
  Navigation,
  Settings
} from 'lucide-react';
// Dynamically import recharts to reduce initial bundle size
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { fleetAPI } from '../services/api';
import { useCargoOwnerLayout } from '../contexts/CargoOwnerLayoutContext';

const Dashboard = () => {
  const layoutContext = useCargoOwnerLayout();
  const isSidebarCollapsed = layoutContext?.sidebarCollapsed ?? false;

  const [stats, setStats] = useState({
    totalRevenue: 125000,
    totalTrips: 45,
    totalLoads: 60,
    totalPayments: 50,
    activeUsers: 120,
    fleetUtilization: 68
  });

  // Fetch trucks with IN_TRANSIT status
  const { data: inTransitTrucks, isLoading: inTransitLoading } = useQuery({
    queryKey: ['trucks', 'in-transit'],
    queryFn: () => fleetAPI.getTrucks({ status: 'IN_TRANSIT' }),
  });

  const [recentActivity, setRecentActivity] = useState([
    {
      id: 1,
      type: 'trip',
      title: 'Trip TRIP-2024-001 completed',
      description: 'Cargo delivered from LA to NYC',
      time: '2 hours ago',
      status: 'completed'
    },
    {
      id: 2,
      type: 'payment',
      title: 'Payment received',
      description: '$2,500 for trip TRIP-2024-001',
      time: '3 hours ago',
      status: 'completed'
    },
    {
      id: 3,
      type: 'load',
      title: 'New load assigned',
      description: 'Electronics shipment to Chicago',
      time: '5 hours ago',
      status: 'pending'
    }
  ]);

  const revenueData = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 2000 },
    { name: 'Apr', value: 2780 },
    { name: 'May', value: 1890 },
    { name: 'Jun', value: 2390 },
  ];

  const tripStatusData = [
    { name: 'Completed', value: 40, color: '#22c55e' },
    { name: 'In Progress', value: 3, color: '#3b82f6' },
    { name: 'Planned', value: 2, color: '#f59e0b' },
  ];

  const StatCard = ({ title, value, icon: Icon, change, changeType }: any) => (
    <div className="group relative bg-white rounded-xl shadow-sm border border-gray-200/60 p-4 hover:shadow-md hover:border-primary-200/50 transition-all duration-300 overflow-hidden">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 to-primary-50/0 group-hover:from-primary-50/50 group-hover:to-transparent transition-all duration-300 pointer-events-none" />
      
      <div className="relative flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{title}</p>
          <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
          {change && (
            <div className="flex items-center mt-1.5">
              <span className={`text-xs font-semibold flex items-center ${
                changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {changeType === 'positive' ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingUp className="w-3 h-3 mr-1 rotate-180" />
                )}
                {changeType === 'positive' ? '+' : ''}{change}%
              </span>
              <span className="text-xs text-gray-400 ml-1">vs last month</span>
            </div>
          )}
        </div>
        <div className="ml-3 p-2.5 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg group-hover:from-primary-100 group-hover:to-primary-200 transition-all duration-300">
          <Icon className="w-5 h-5 text-primary-600" />
        </div>
      </div>
    </div>
  );

  const ActivityItem = ({ activity }: any) => {
    const getActivityIcon = () => {
      switch (activity.type) {
        case 'trip':
          return <Truck className="w-4 h-4" />;
        case 'payment':
          return <CreditCard className="w-4 h-4" />;
        case 'load':
          return <Package className="w-4 h-4" />;
        default:
          return <CheckCircle className="w-4 h-4" />;
      }
    };

    return (
      <div className="flex items-start space-x-3 p-3 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent rounded-lg transition-all duration-200 group cursor-pointer">
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 ${
          activity.status === 'completed' 
            ? 'bg-green-100 text-green-600 group-hover:bg-green-200' 
            : 'bg-yellow-100 text-yellow-600 group-hover:bg-yellow-200'
        } transition-colors`}>
          {getActivityIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
            {activity.title}
          </p>
          <p className="text-xs text-gray-600 mt-0.5">{activity.description}</p>
          <div className="flex items-center mt-1.5 space-x-2">
            <Clock className="w-3 h-3 text-gray-400" />
            <p className="text-xs text-gray-500">{activity.time}</p>
          </div>
        </div>
        <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
          activity.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
        }`} />
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-50 via-white to-primary-50 rounded-xl p-5 border border-primary-100/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome back! Here's what's happening with your cargo operations.</p>
          </div>
          <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-600">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${
          isSidebarCollapsed ? 'xl:grid-cols-6' : 'xl:grid-cols-3'
        }`}
      >
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={TrendingUp}
          change={12.5}
          changeType="positive"
        />
        <StatCard
          title="Total Trips"
          value={stats.totalTrips}
          icon={Truck}
          change={8.2}
          changeType="positive"
        />
        <StatCard
          title="Total Loads"
          value={stats.totalLoads}
          icon={Package}
          change={-2.1}
          changeType="negative"
        />
        <StatCard
          title="Total Payments"
          value={stats.totalPayments}
          icon={CreditCard}
          change={15.3}
          changeType="positive"
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={Users}
          change={5.7}
          changeType="positive"
        />
        <StatCard
          title="Fleet Utilization"
          value={`${stats.fleetUtilization}%`}
          icon={MapPin}
          change={3.2}
          changeType="positive"
        />
      </div>

      {/* Quick Access - Documents & Notifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Documents Quick Access */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-4 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 flex items-center">
              <Package className="w-4 h-4 mr-2 text-primary-600" />
              Document Management
            </h3>
            <a 
              href="/dashboard/documents" 
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              View All →
            </a>
          </div>
          <div className="space-y-2">
            <a 
              href="/dashboard/documents/CARGO" 
              className="group flex items-center p-2.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-200"
            >
              <div className="p-1.5 bg-blue-100 rounded-lg mr-2.5 group-hover:bg-blue-200 transition-colors">
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-900 group-hover:text-blue-700">Cargo Documents</div>
                <div className="text-[10px] text-gray-500">Manage cargo manifests, contracts</div>
              </div>
            </a>
            <a 
              href="/dashboard/documents/TRIP" 
              className="group flex items-center p-2.5 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-gradient-to-r hover:from-green-50 hover:to-transparent transition-all duration-200"
            >
              <div className="p-1.5 bg-green-100 rounded-lg mr-2.5 group-hover:bg-green-200 transition-colors">
                <Truck className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-900 group-hover:text-green-700">Trip Documents</div>
                <div className="text-[10px] text-gray-500">Route plans, delivery confirmations</div>
              </div>
            </a>
            <a 
              href="/dashboard/documents/FINANCIAL" 
              className="group flex items-center p-2.5 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent transition-all duration-200"
            >
              <div className="p-1.5 bg-purple-100 rounded-lg mr-2.5 group-hover:bg-purple-200 transition-colors">
                <CreditCard className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-900 group-hover:text-purple-700">Financial Documents</div>
                <div className="text-[10px] text-gray-500">Invoices, receipts, contracts</div>
              </div>
            </a>
          </div>
        </div>

        {/* Notifications Quick Access */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-4 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 flex items-center">
              <Settings className="w-4 h-4 mr-2 text-primary-600" />
              Notification Center
            </h3>
            <a 
              href="/dashboard/notification-center" 
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              View All →
            </a>
          </div>
          <div className="space-y-2">
            <a 
              href="/dashboard/notification-center?category=SYSTEM" 
              className="group flex items-center p-2.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all duration-200"
            >
              <div className="p-1.5 bg-gray-100 rounded-lg mr-2.5 group-hover:bg-gray-200 transition-colors">
                <Settings className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-900">System Updates</div>
                <div className="text-[10px] text-gray-500">Platform notifications and updates</div>
              </div>
            </a>
            <a 
              href="/dashboard/notification-center?category=CARGO" 
              className="group flex items-center p-2.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-200"
            >
              <div className="p-1.5 bg-blue-100 rounded-lg mr-2.5 group-hover:bg-blue-200 transition-colors">
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-900 group-hover:text-blue-700">Cargo Alerts</div>
                <div className="text-[10px] text-gray-500">Status updates and delivery notifications</div>
              </div>
            </a>
            <a 
              href="/dashboard/notification-center?category=FINANCIAL" 
              className="group flex items-center p-2.5 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent transition-all duration-200"
            >
              <div className="p-1.5 bg-purple-100 rounded-lg mr-2.5 group-hover:bg-purple-200 transition-colors">
                <CreditCard className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-900 group-hover:text-purple-700">Financial Alerts</div>
                <div className="text-[10px] text-gray-500">Payment confirmations and alerts</div>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-4 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-primary-600" />
              Revenue Trend
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Trip Status Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-4 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 flex items-center">
              <Package className="w-4 h-4 mr-2 text-primary-600" />
              Trip Status Distribution
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={tripStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {tripStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trucks In Transit */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-primary-50/50 to-transparent">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center">
              <Navigation className="w-4 h-4 mr-2 text-primary-600" />
              Trucks In Transit
            </h3>
            <div className="flex items-center space-x-2 px-2.5 py-1 bg-primary-100 rounded-lg">
              <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold text-primary-700">
                {inTransitTrucks?.length || 0} Active
              </span>
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {inTransitLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-xs text-gray-500 mt-2">Loading trucks...</p>
            </div>
          ) : inTransitTrucks?.length > 0 ? (
            inTransitTrucks.map((truck: any) => (
              <div key={truck.id} className="p-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all duration-200 group">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-sm font-bold text-gray-900">
                        {truck.plateNumber}
                      </h4>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary-100 text-primary-700 border border-primary-200">
                        IN TRANSIT
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-600">
                      <div className="flex items-center space-x-1.5">
                        <Truck className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate">{truck.make} {truck.model}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate">{truck.currentLocation || 'Unknown location'}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate">{truck.currentDriver?.name || 'No driver assigned'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 ml-3">
                    <button className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200">
                      <Clock className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                <Truck className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-xs font-medium text-gray-500">No trucks currently in transit</p>
              <p className="text-[10px] text-gray-400 mt-1">Trucks will appear here when they start a trip</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-primary-50/50 to-transparent">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-primary-600" />
              Recent Activity
            </h3>
            <a 
              href="/dashboard/notification-center" 
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              View All →
            </a>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))
          ) : (
            <div className="p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-xs font-medium text-gray-500">No recent activity</p>
              <p className="text-[10px] text-gray-400 mt-1">Activity will appear here as it happens</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 