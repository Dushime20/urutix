import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaUsers, FaTruck, FaBox, FaRoute, FaChartLine,
  FaGavel, FaMoneyBillWave, FaClipboardCheck,
  FaExclamationTriangle, FaCheckCircle, FaBell, FaSearch
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { StatCard } from '../../components/EnliteUI/Cards/StatCard';
import { CardSkeleton } from '../../components/common/LoadingSkeletons';
import { adminAPI } from '../../services/adminApi';

// Admin Dashboard for ADMIN role (Tenant-level)
// Focus: Operational oversight, dispute resolution, reporting
// Route: /admin-tenant/* (separate from /admin/* for Super Admin)
const TenantOperationalDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Dashboard data states
  const [stats, setStats] = useState({
    activeTrips: 0,
    pendingLoads: 0,
    availableTrucks: 0,
    activeDisputes: 0,
    resolvedDisputes: 0,
    pendingApprovals: 0,
    revenueToday: 0,
    alertsCount: 0,
  });

  const [pendingDisputes, setPendingDisputes] = useState<any[]>([]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch operational data for this tenant
        const [tripsRes, loadsRes, trucksRes, disputesRes] = await Promise.all([
          adminAPI.getAllTrips().catch(() => ({ data: { trips: [] } })),
          adminAPI.getAllLoads().catch(() => ({ data: { loads: [] } })),
          adminAPI.getAllTrucks().catch(() => ({ data: { trucks: [] } })),
          adminAPI.getDisputes?.().catch(() => ({ data: { disputes: [] } })),
        ]);

        const trips = tripsRes.data?.trips || tripsRes.data || [];
        const loads = loadsRes.data?.loads || loadsRes.data || [];
        const trucks = trucksRes.data?.trucks || trucksRes.data || [];
        const disputes = disputesRes.data?.disputes || disputesRes.data || [];

        // Calculate stats
        const activeTrips = trips.filter((t: any) => t.status === 'IN_TRANSIT').length;
        const pendingLoads = loads.filter((l: any) => l.status === 'PENDING' || l.status === 'CREATED').length;
        const availableTrucks = trucks.filter((t: any) => t.status === 'AVAILABLE').length;
        const activeDisputes = disputes.filter((d: any) => d.status === 'PENDING').length;
        const resolvedDisputes = disputes.filter((d: any) => d.status === 'RESOLVED').length;

        // Calculate revenue from completed trips
        const completedTrips = trips.filter((t: any) => t.status === 'COMPLETED');
        const revenueToday = completedTrips.reduce((sum: number, t: any) => sum + (t.payment?.amount || 0), 0);

        setStats({
          activeTrips,
          pendingLoads,
          availableTrucks,
          activeDisputes,
          resolvedDisputes,
          pendingApprovals: pendingLoads + activeDisputes,
          revenueToday,
          alertsCount: activeDisputes + pendingLoads,
        });

        // Set pending disputes for display
        setPendingDisputes(disputes.filter((d: any) => d.status === 'PENDING').slice(0, 5));

      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Admin cards for operational tasks - using StatCard component
  const adminCards = [
    {
      id: 'disputes',
      title: 'Dispute Resolution',
      subtitle: 'Manage and resolve disputes between parties',
      icon: <FaGavel size={20} />,
      value: stats.activeDisputes,
      color: 'error' as const,
      path: '/admin/disputes',
      alert: stats.activeDisputes > 0,
    },
    {
      id: 'loads',
      title: 'Load Management',
      subtitle: 'Oversee pending loads and assignments',
      icon: <FaBox size={20} />,
      value: stats.pendingLoads,
      color: 'primary' as const,
      path: '/admin/loads',
      alert: stats.pendingLoads > 10,
    },
    {
      id: 'trips',
      title: 'Trip Monitoring',
      subtitle: 'Monitor active trips and deliveries',
      icon: <FaRoute size={20} />,
      value: stats.activeTrips,
      color: 'success' as const,
      path: '/admin/trips',
    },
    {
      id: 'fleet',
      title: 'Fleet Overview',
      subtitle: 'Track available trucks and capacity',
      icon: <FaTruck size={20} />,
      value: stats.availableTrucks,
      color: 'purple' as const,
      path: '/admin/fleet',
    },
    {
      id: 'approvals',
      title: 'Pending Approvals',
      subtitle: 'Review and approve pending requests',
      icon: <FaClipboardCheck size={20} />,
      value: stats.pendingApprovals,
      color: 'warning' as const,
      path: '/admin/approvals',
      alert: stats.pendingApprovals > 0,
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      subtitle: 'View operational reports and metrics',
      icon: <FaChartLine size={20} />,
      value: 'View',
      color: 'info' as const,
      path: '/admin/reports',
    },
    {
      id: 'financial',
      title: 'Financial Overview',
      subtitle: 'Monitor payments and transactions',
      icon: <FaMoneyBillWave size={20} />,
      value: 'View',
      color: 'emerald' as const,
      path: '/admin/financial',
    },
    {
      id: 'users',
      title: 'User Management',
      subtitle: 'Manage users and their permissions',
      icon: <FaUsers size={20} />,
      value: 'View',
      color: 'accent' as const,
      path: '/admin/users',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  // Skeleton loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2" />
          <div className="h-4 w-96 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
        
        {/* KPI Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        
        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Operational oversight, dispute resolution, and reporting
            </p>
          </div>
          <div className="flex items-center gap-4">
            {stats.alertsCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
                <FaExclamationTriangle />
                <span className="font-medium">{stats.alertsCount} alerts</span>
              </div>
            )}
            <div className="text-right">
              <p className="text-sm text-slate-500 dark:text-slate-400">Revenue Today</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                KES {stats.revenueToday.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats using StatCard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div onClick={() => navigate('/admin/trips')} className="cursor-pointer">
          <StatCard
            title="Active Trips"
            value={stats.activeTrips}
            icon={<FaRoute size={20} />}
            color="primary"
            variant="classic"
            subtitle="In transit now"
          />
        </div>
        <div onClick={() => navigate('/admin/loads')} className="cursor-pointer">
          <StatCard
            title="Pending Loads"
            value={stats.pendingLoads}
            icon={<FaBox size={20} />}
            color="warning"
            variant="classic"
            subtitle="Awaiting assignment"
          />
        </div>
        <div onClick={() => navigate('/admin/disputes')} className="cursor-pointer">
          <StatCard
            title="Active Disputes"
            value={stats.activeDisputes}
            icon={<FaGavel size={20} />}
            color="error"
            variant="classic"
            subtitle="Need resolution"
          />
        </div>
        <div onClick={() => navigate('/admin/fleet')} className="cursor-pointer">
          <StatCard
            title="Available Trucks"
            value={stats.availableTrucks}
            icon={<FaTruck size={20} />}
            color="success"
            variant="classic"
            subtitle="Ready for loads"
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Admin Cards */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
            Quick Actions
          </h2>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {adminCards.map((card) => (
              <motion.div key={card.id} variants={itemVariants}>
                <div className="relative">
                  {card.alert && (
                    <div className="absolute -top-1 -right-1 z-10 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  )}
                  <div onClick={() => navigate(card.path)} className="cursor-pointer">
                    <StatCard
                      title={card.title}
                      value={card.value}
                      icon={card.icon}
                      subtitle={card.subtitle}
                      color={card.color}
                      variant="classic"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Right Column - Pending Issues */}
        <div className="space-y-6">
          {/* Pending Disputes */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <FaGavel className="text-red-500" />
                Pending Disputes
              </h3>
              <button
                onClick={() => navigate('/admin/disputes')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </button>
            </div>
            
            {pendingDisputes.length === 0 ? (
              <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                <FaCheckCircle className="mx-auto mb-2 text-green-500" size={32} />
                <p>No pending disputes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingDisputes.map((dispute, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigate(`/admin/disputes/${dispute.id}`)}
                    className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white text-sm">
                          {dispute.title || `Dispute #${dispute.id?.slice(0, 8)}`}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {dispute.type || 'General'} • {dispute.priority || 'Medium'}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
                        Pending
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System Alerts */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <FaBell className="text-amber-500" />
              System Alerts
            </h3>
            
            <div className="space-y-3">
              {stats.pendingLoads > 0 && (
                <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <FaBox className="text-amber-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-white">
                      {stats.pendingLoads} loads awaiting assignment
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Review and assign to available trucks
                    </p>
                  </div>
                </div>
              )}
              
              {stats.activeDisputes > 0 && (
                <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <FaGavel className="text-red-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-white">
                      {stats.activeDisputes} disputes need resolution
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Requires admin attention
                    </p>
                  </div>
                </div>
              )}
              
              {stats.alertsCount === 0 && (
                <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                  <FaCheckCircle className="mx-auto mb-2 text-green-500" size={24} />
                  <p className="text-sm">No alerts at this time</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Search */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <FaSearch className="text-blue-500" />
              Quick Search
            </h3>
            
            <div className="space-y-2">
              <button
                onClick={() => navigate('/admin/search')}
                className="w-full p-3 text-left bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <p className="text-sm font-medium text-slate-800 dark:text-white">
                  Search Loads
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Find loads by ID, origin, or destination
                </p>
              </button>
              
              <button
                onClick={() => navigate('/admin/search')}
                className="w-full p-3 text-left bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <p className="text-sm font-medium text-slate-800 dark:text-white">
                  Search Trucks
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Find trucks by plate number or driver
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantOperationalDashboard;
