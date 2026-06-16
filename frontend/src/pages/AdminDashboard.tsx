import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaUsers, FaTruck, FaBox, FaRoute, FaBuilding, FaChartLine,
  FaCreditCard, FaHistory, FaShieldAlt, FaGavel, FaMoneyBillWave,
  FaHandshake, FaFileInvoiceDollar
} from 'react-icons/fa';
import { TranslatedText } from '../components/translated-text';
import { useAuth } from '../contexts/AuthContext';
import AdminPageLayout from '../components/Admin/AdminPageLayout';
import { adminAPI } from '../services/adminApi';
import type { AdminKPI, AdminAnalytics, AdminFinancials } from '../services/adminApi';
import { StatCard } from '../components/EnliteUI/Cards/StatCard';
import ModernNavCard from '../components/Admin/ModernNavCard';
import { motion } from 'framer-motion';
import ModernLoader from '../components/common/ModernLoader';
import { useCurrencyFormat } from '../hooks/useCurrencyFormat';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { compact: fmtMoney } = useCurrencyFormat();
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
      color: 'blue',
      path: '/admin/users',
      stats: kpiData ? `${kpiData.users.toLocaleString()} users` : 'Loading...',
    },
    {
      title: 'Trucks',
      description: 'View and manage all trucks',
      icon: FaTruck,
      color: 'emerald',
      path: '/admin/trucks',
      stats: trucksCount > 0 ? `${trucksCount} trucks` : 'Loading...',
    },
    {
      title: 'Loads',
      description: 'Monitor cargo loads and shipments',
      icon: FaBox,
      color: 'orange',
      path: '/admin/loads',
      stats: loadsCount > 0 ? `${loadsCount} loads` : 'Loading...',
    },
    {
      title: 'Routes',
      description: 'Manage delivery routes',
      icon: FaRoute,
      color: 'indigo',
      path: '/admin/routes',
      stats: routesCount > 0 ? `${routesCount} routes` : 'Loading...',
    },
    {
      title: 'Tenants',
      description: 'Manage tenant organizations',
      icon: FaBuilding,
      color: 'teal',
      path: '/admin/tenants',
      stats: tenantsCount > 0 ? `${tenantsCount} tenants` : 'Loading...',
    },
    {
      title: 'Analytics',
      description: 'View platform analytics and reports',
      icon: FaChartLine,
      color: 'pink',
      path: '/admin/analytics',
      stats: 'Real-time',
    },
    {
      title: 'Financial',
      description: 'Monitor revenue and financial health',
      icon: FaMoneyBillWave,
      color: 'yellow',
      path: '/admin/financial',
      stats: financialData ? `${fmtMoney(financialData.totalRevenue)} revenue` : 'Loading...',
    },
  ];

  if (loading) {
    return (
      <AdminPageLayout
        title="Super Admin Dashboard"
        description="Manage all aspects of the Urutix platform"
      >
        <ModernLoader isLoading={true} type="dashboard" />
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
      <div className="space-y-12">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={kpiData?.users?.toLocaleString() || '0'}
            icon={<FaUsers size={22} />}
            trend={`${calculateGrowth(kpiData?.users || 0)}%`}
            trendDirection="up"
            color="primary"
            loading={loading}
            variant="classic"
          />
          <StatCard
            title="Active Trips"
            value={kpiData?.activeTrips?.toLocaleString() || '0'}
            icon={<FaTruck size={22} />}
            trend={`${calculateGrowth(kpiData?.activeTrips || 0)}%`}
            trendDirection="up"
            color="primary"
            loading={loading}
            variant="classic"
          />
          <StatCard
            title="Engagement Score"
            value={`${kpiData?.engagement || '0'}%`}
            icon={<FaBox size={22} />}
            trend={`${calculateGrowth(kpiData?.engagement || 0)}%`}
            trendDirection="up"
            color="primary"
            loading={loading}
            variant="classic"
          />
          <StatCard
            title="Revenue"
            value={fmtMoney(financialData?.totalRevenue || 0)}
            icon={<FaMoneyBillWave size={22} />}
            trend={`${calculateGrowth(financialData?.totalRevenue || 0)}%`}
            trendDirection="up"
            color="primary"
            loading={loading}
            variant="classic"
          />
        </div>

        {/* Navigation Cards */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <span className="h-8 w-1.5 bg-[#2c5173] rounded-full"></span>
              <TranslatedText text="Management Sections" />
            </h2>
            <div className="h-px flex-1 bg-gray-100 ml-6 hidden md:block"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {adminCards.map((card, index) => (
              <ModernNavCard
                key={index}
                title={card.title}
                description={card.description}
                icon={card.icon}
                stats={card.stats}
                color={card.color}
                onClick={() => navigate(card.path)}
                delay={0.1 * (index + 1)}
              />
            ))}
          </div>
        </div>

        {/* Recent Activity Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="bg-white rounded-3xl p-8 border border-gray-100 overflow-hidden relative"
        >
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-50 text-gray-400 rounded-2xl">
                <FaHistory size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                  <TranslatedText text="Recent Activity" />
                </h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Live updates from the platform</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/activity-logs')}
              className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 group"
            >
              <TranslatedText text="View Full Log" />
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>

          <div className="space-y-4 relative z-10">
            {analyticsData?.recentTrips?.slice(0, 3).map((trip, index) => (
              <div key={trip.id || index} className="flex items-center gap-4 p-4 bg-gray-50/50 hover:bg-gray-50 rounded-2xl transition-all duration-300 border border-transparent hover:border-gray-100 group">
                <div className="relative">
                  <div className="w-10 h-10 bg-white border border-gray-100 text-green-600 rounded-xl flex items-center justify-center">
                    <FaRoute size={18} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-gray-800 uppercase tracking-tight">
                    New trip scheduled
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                    {typeof trip.origin === 'object' ? (trip.origin?.city || trip.origin?.address || 'Origin') : (trip.origin || 'Origin')} → {typeof trip.destination === 'object' ? (trip.destination?.city || trip.destination?.address || 'Destination') : (trip.destination || 'Destination')}
                  </p>
                </div>
                <span className="text-[10px] font-black text-gray-300 group-hover:text-gray-500 uppercase">
                  {new Date(trip.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )) || []}
            
            {analyticsData?.recentPayments?.slice(0, 2).map((payment, index) => (
              <div key={payment.id || index} className="flex items-center gap-4 p-4 bg-gray-50/50 hover:bg-gray-50 rounded-2xl transition-all duration-300 border border-transparent hover:border-gray-100 group">
                <div className="relative">
                  <div className="w-10 h-10 bg-white border border-gray-100 text-blue-600 rounded-xl flex items-center justify-center">
                    <FaMoneyBillWave size={18} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-gray-800 uppercase tracking-tight">
                    Payment processed
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                    Amount: <span className="text-gray-700">{fmtMoney(payment.amount) || 'N/A'}</span>
                  </p>
                </div>
                <span className="text-[10px] font-black text-gray-300 group-hover:text-gray-500 uppercase">
                  {new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )) || []}

            {kpiData?.alerts && kpiData.alerts > 0 && (
              <div className="flex items-center gap-4 p-4 bg-red-50/50 hover:bg-red-50 rounded-2xl transition-all duration-300 border border-transparent hover:border-red-100 group">
                <div className="relative">
                  <div className="w-10 h-10 bg-white border border-red-100 text-red-600 rounded-xl flex items-center justify-center">
                    <FaShieldAlt size={18} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-red-800 uppercase tracking-tight">
                    System Alerts Active
                  </p>
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mt-0.5">
                    {kpiData.alerts} items require attention
                  </p>
                </div>
                <span className="text-[10px] font-black text-red-400 uppercase">
                  Required
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AdminPageLayout>
  );
};

export default AdminDashboard;