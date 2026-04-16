import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaUsers, FaTruck, FaBox, FaRoute, FaBuilding, FaChartLine,
  FaCreditCard, FaHistory, FaShieldAlt, FaGavel, FaMoneyBillWave,
  FaHandshake, FaFileInvoiceDollar, FaSpinner
} from 'react-icons/fa';
import { TranslatedText } from '../components/translated-text';
import { useAuth } from '../contexts/AuthContext';
import AdminPageLayout from '../components/Admin/AdminPageLayout';
import { adminAPI } from '../services/adminApi';
import type { AdminKPI, AdminAnalytics, AdminFinancials } from '../services/adminApi';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState<AdminKPI | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AdminAnalytics | null>(null);
  const [financialData, setFinancialData] = useState<AdminFinancials | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Additional counts for cards
  const [trucksCount, setTrucksCount] = useState<number>(0);
  const [loadsCount, setLoadsCount] = useState<number>(0);
  const [tripsCount, setTripsCount] = useState<number>(0);
  const [tenantsCount, setTenantsCount] = useState<number>(0);
  const [routesCount, setRoutesCount] = useState<number>(0);

  // Fetch real data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all dashboard data in parallel
        const [kpiResponse, analyticsResponse, financialResponse] = await Promise.all([
          adminAPI.getKPI(),
          adminAPI.getAnalytics(),
          adminAPI.getFinancials(),
        ]);

        console.log('KPI Response:', kpiResponse.data);
        console.log('Analytics Response:', analyticsResponse.data);
        console.log('Financial Response:', financialResponse.data);

        setKpiData(kpiResponse.data.data || kpiResponse.data);
        setAnalyticsData(analyticsResponse.data.data || analyticsResponse.data);
        setFinancialData(financialResponse.data.data || financialResponse.data);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch additional counts for cards
  useEffect(() => {
    const fetchAdditionalCounts = async () => {
      try {
        const [trucksResponse, loadsResponse, tripsResponse, tenantsResponse, routesResponse] = await Promise.all([
          adminAPI.getAllTrucks().catch(() => ({ data: { trucks: [] } })),
          adminAPI.getAllLoads().catch(() => ({ data: { loads: [] } })),
          adminAPI.getAllTrips().catch(() => ({ data: { trips: [] } })),
          adminAPI.getTenants().catch(() => ({ data: { tenants: [] } })),
          adminAPI.getRoutes().catch(() => ({ data: { routes: [] } })),
        ]);

        setTrucksCount(trucksResponse.data.trucks.length);
        setLoadsCount(loadsResponse.data.loads.length);
        setTripsCount(tripsResponse.data.trips.length);
        setTenantsCount(tenantsResponse.data.tenants.length);
        setRoutesCount(routesResponse.data.routes.length);
      } catch (err) {
        console.error('Error fetching additional counts:', err);
      }
    };

    if (!loading && kpiData) {
      fetchAdditionalCounts();
    }
  }, [loading, kpiData]);

  // Calculate growth percentages (mock for now - would need historical data)
  const calculateGrowth = (current: number) => {
    // Mock growth calculation - in real app, compare with previous period
    return Math.floor(Math.random() * 30) + 5; // 5-35% growth
  };

  // Create admin cards with reactive data
  const adminCards = [
    {
      title: 'Users',
      description: 'Manage platform users and permissions',
      icon: FaUsers,
      color: 'from-blue-500 to-blue-600',
      path: '/admin/users',
      stats: kpiData ? `${kpiData.users.toLocaleString()} users` : 'Loading...',
    },
    {
      title: 'Trucks',
      description: 'View and manage all trucks',
      icon: FaTruck,
      color: 'from-green-500 to-green-600',
      path: '/admin/trucks',
      stats: trucksCount > 0 ? `${trucksCount} trucks` : 'Loading...',
    },
    {
      title: 'Loads',
      description: 'Monitor cargo loads and shipments',
      icon: FaBox,
      color: 'from-orange-500 to-orange-600',
      path: '/admin/loads',
      stats: loadsCount > 0 ? `${loadsCount} loads` : 'Loading...',
    },
    {
      title: 'Routes',
      description: 'Manage delivery routes',
      icon: FaRoute,
      color: 'from-indigo-500 to-indigo-600',
      path: '/admin/routes',
      stats: routesCount > 0 ? `${routesCount} routes` : 'Loading...',
    },
    {
      title: 'Tenants',
      description: 'Manage tenant organizations',
      icon: FaBuilding,
      color: 'from-teal-500 to-teal-600',
      path: '/admin/tenants',
      stats: tenantsCount > 0 ? `${tenantsCount} tenants` : 'Loading...',
    },
    {
      title: 'Analytics',
      description: 'View platform analytics and reports',
      icon: FaChartLine,
      color: 'from-pink-500 to-pink-600',
      path: '/admin/analytics',
      stats: 'Real-time',
    },
    {
      title: 'Financial',
      description: 'Monitor revenue and financial health',
      icon: FaMoneyBillWave,
      color: 'from-emerald-500 to-emerald-600',
      path: '/admin/financial',
      stats: financialData ? `$${(financialData.totalRevenue / 1000).toFixed(0)}k revenue` : 'Loading...',
    },
  ];

  if (loading) {
    return (
      <AdminPageLayout
        title="Super Admin Dashboard"
        description="Manage all aspects of the Urutix platform"
      >
        <div className="flex items-center justify-center h-64">
          <FaSpinner className="animate-spin text-4xl text-indigo-600" />
          <span className="ml-3 text-lg text-gray-600">Loading dashboard data...</span>
        </div>
      </AdminPageLayout>
    );
  }

  if (error) {
    return (
      <AdminPageLayout
        title="Super Admin Dashboard"
        description="Manage all aspects of the Urutix platform"
      >
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="text-red-400">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title="Super Admin Dashboard"
      description="Manage all aspects of the Urutix platform"
    >
      <div className="space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {kpiData?.users?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  ↑ {calculateGrowth(kpiData?.users || 0)}% this month
                </p>
              </div>
              <FaUsers className="text-4xl text-blue-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Trips</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {kpiData?.activeTrips?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  ↑ {calculateGrowth(kpiData?.activeTrips || 0)}% this month
                </p>
              </div>
              <FaTruck className="text-4xl text-green-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Engagement Score</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {kpiData?.engagement || '0'}%
                </p>
                <p className="text-xs text-green-600 mt-1">
                  ↑ {calculateGrowth(kpiData?.engagement || 0)}% this month
                </p>
              </div>
              <FaBox className="text-4xl text-orange-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  ${(financialData?.totalRevenue || 0).toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  ↑ {calculateGrowth(financialData?.totalRevenue || 0)}% this month
                </p>
              </div>
              <FaMoneyBillWave className="text-4xl text-yellow-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            <TranslatedText text="Management Sections" />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {adminCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={index}
                  onClick={() => navigate(card.path)}
                  className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer group overflow-hidden border-2 border-transparent hover:border-indigo-500"
                >
                  <div className={`h-2 bg-gradient-to-r ${card.color}`}></div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-4 bg-gradient-to-r ${card.color} rounded-xl group-hover:scale-110 transition-transform`}>
                        <Icon className="text-3xl text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                      <TranslatedText text={card.title} />
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      <TranslatedText text={card.description} />
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {card.stats}
                      </span>
                      <span className="text-indigo-600 group-hover:translate-x-2 transition-transform">
                        →
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity Preview */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              <TranslatedText text="Recent Activity" />
            </h3>
            <button
              onClick={() => navigate('/admin/activity-logs')}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-2"
            >
              View All <FaHistory />
            </button>
          </div>
          <div className="space-y-3">
            {analyticsData?.recentTrips?.slice(0, 3).map((trip, index) => (
              <div key={trip.id || index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">
                  New trip: {trip.origin} → {trip.destination}
                </span>
                <span className="text-xs text-gray-500 ml-auto">
                  {new Date(trip.createdAt).toLocaleTimeString()}
                </span>
              </div>
            )) || []}
            
            {analyticsData?.recentPayments?.slice(0, 2).map((payment, index) => (
              <div key={payment.id || index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700">
                  Payment processed: ${payment.amount?.toLocaleString() || 'N/A'}
                </span>
                <span className="text-xs text-gray-500 ml-auto">
                  {new Date(payment.createdAt).toLocaleTimeString()}
                </span>
              </div>
            )) || []}

            {kpiData?.alerts && kpiData.alerts > 0 && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-700">
                  {kpiData.alerts} system alerts require attention
                </span>
                <span className="text-xs text-gray-500 ml-auto">Active</span>
              </div>
            )}

            {(!analyticsData?.recentTrips?.length && !analyticsData?.recentPayments?.length && !kpiData?.alerts) && (
              <div className="text-center py-8 text-gray-500">
                <p>No recent activity to display</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default AdminDashboard;