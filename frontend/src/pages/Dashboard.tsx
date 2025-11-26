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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${changeType === 'positive' ? 'text-success-600' : 'text-error-600'}`}>
              {changeType === 'positive' ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
        <div className="p-3 bg-primary-50 rounded-lg">
          <Icon className="w-6 h-6 text-primary-600" />
        </div>
      </div>
    </div>
  );

  const ActivityItem = ({ activity }: any) => (
    <div className="flex items-start space-x-3 p-4 hover:bg-gray-50 rounded-lg transition-colors">
      <div className={`w-2 h-2 rounded-full mt-2 ${
        activity.status === 'completed' ? 'bg-success-500' : 'bg-warning-500'
      }`} />
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
        <p className="text-sm text-gray-600">{activity.description}</p>
        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your cargo operations.</p>
      </div>

      {/* Stats Cards */}
      <div
        className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 ${
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

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">{stats.totalRevenue}</div>
          <div className="text-gray-600">Total Revenue</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">{stats.totalTrips}</div>
          <div className="text-gray-600">Total Trips</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-purple-600">{stats.totalLoads}</div>
          <div className="text-gray-600">Total Loads</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-orange-600">{stats.totalPayments}</div>
          <div className="text-gray-600">Total Payments</div>
        </div>
      </div>

      {/* Quick Access - Documents & Notifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Documents Quick Access */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Document Management</h3>
            <a 
              href="/dashboard/documents" 
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All →
            </a>
          </div>
          <div className="space-y-3">
            <a 
              href="/dashboard/documents/CARGO" 
              className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Cargo Documents</div>
                <div className="text-sm text-gray-500">Manage cargo manifests, contracts</div>
              </div>
            </a>
            <a 
              href="/dashboard/documents/TRIP" 
              className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <Truck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Trip Documents</div>
                <div className="text-sm text-gray-500">Route plans, delivery confirmations</div>
              </div>
            </a>
            <a 
              href="/dashboard/documents/FINANCIAL" 
              className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
            >
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Financial Documents</div>
                <div className="text-sm text-gray-500">Invoices, receipts, contracts</div>
              </div>
            </a>
          </div>
        </div>

        {/* Notifications Quick Access */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Notification Center</h3>
            <a 
              href="/dashboard/notification-center" 
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All →
            </a>
          </div>
          <div className="space-y-3">
            <a 
              href="/dashboard/notification-center?category=SYSTEM" 
              className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-gray-100 rounded-lg mr-3">
                <Settings className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">System Updates</div>
                <div className="text-sm text-gray-500">Platform notifications and updates</div>
              </div>
            </a>
            <a 
              href="/dashboard/notification-center?category=CARGO" 
              className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Cargo Alerts</div>
                <div className="text-sm text-gray-500">Status updates and delivery notifications</div>
              </div>
            </a>
            <a 
              href="/dashboard/notification-center?category=FINANCIAL" 
              className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
            >
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Financial Alerts</div>
                <div className="text-sm text-gray-500">Payment confirmations and alerts</div>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Trip Status Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={tripStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {tripStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trucks In Transit */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Trucks In Transit</h3>
            <div className="flex items-center space-x-2">
              <Navigation className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-medium text-primary-600">
                {inTransitTrucks?.length || 0} Active
              </span>
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {inTransitLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading trucks...</p>
            </div>
          ) : inTransitTrucks?.length > 0 ? (
            inTransitTrucks.map((truck: any) => (
              <div key={truck.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-gray-900">
                        {truck.plateNumber}
                      </h4>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        IN TRANSIT
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Truck className="w-4 h-4" />
                        <span>{truck.make} {truck.model}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>{truck.currentLocation || 'Unknown location'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>{truck.currentDriver?.name || 'No driver assigned'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <Clock className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center">
              <Truck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No trucks currently in transit</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivity.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 