import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle as FaExclamationTriangle,
  Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';

import TenantHeader from './TenantHeader';
import QuickStats from './QuickStats';
import FleetOverview from './FleetOverview';
import CargoAnalytics from './CargoAnalytics';
import FinancialMetrics from './FinancialMetrics';
import OperationalInsights from './OperationalInsights';
import PerformanceMetrics from './PerformanceMetrics';
import RecentActivity from './RecentActivity';
import SkeletonDashboard from './SkeletonDashboard';
import TenantUserManagement from './TenantUserManagement';
import ActiveTrips from './ActiveTrips';
import TenantSettings from './TenantSettings';
import TenantBidding from './TenantBidding';
import TruckOwnerBilling from '../../pages/tenant-admin/TruckOwnerBilling';
import { tenantApi, mockTenantData } from '../../services/tenantApi';
import { useAuth } from '../../contexts/AuthContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface TenantDashboardProps {
  tenantId?: string;
  className?: string;
}

const TenantDashboard: React.FC<TenantDashboardProps> = ({
  tenantId,
  className = ''
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = useState('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedView, setSelectedView] = useState<'overview' | 'fleet' | 'cargo' | 'financial' | 'operations' | 'users' | 'truck-owners' | 'trips' | 'settings' | 'bidding'>('overview');

  // Create tenant data object from authenticated user
  const currentTenant = useMemo(() => {
    if (user) {
      return {
        id: user.tenantId,
        name: user.tenantName && user.tenantName !== user.tenantId ? user.tenantName : 'Default Tenant',
        status: 'active' as const,
        type: 'fleet-operator'
      };
    }
    return {
      id: mockTenantData.id,
      name: mockTenantData.name,
      status: mockTenantData.status as 'active' | 'inactive' | 'suspended',
      type: mockTenantData.type
    };
  }, [user]);

  // Use React Query for data fetching with fallback to mock data
  const { data: tenantData, isLoading, error, refetch } = useQuery({
    queryKey: ['tenant', tenantId, timeRange],
    queryFn: async () => {
      try {
        const [metrics, trends, activity] = await Promise.all([
          tenantApi.getTenantMetrics(tenantId || 'default-tenant', timeRange),
          tenantApi.getTenantTrends(tenantId || 'default-tenant', timeRange),
          tenantApi.getRecentActivity(tenantId || 'default-tenant', 10)
        ]);
        return { metrics, trends, activity };
      } catch (error) {
        console.warn('Using mock data due to API error:', error);
        return {
          metrics: mockTenantData.metrics,
          trends: mockTenantData.trends,
          activity: mockTenantData.recentActivity
        };
      }
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Fallback to mock data if API fails
  const data = tenantData || {
    metrics: mockTenantData.metrics,
    trends: mockTenantData.trends,
    activity: mockTenantData.recentActivity
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Invalidate all tenant-related queries to force a refresh across all components
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ['tenant'] }),
        queryClient.invalidateQueries({ queryKey: ['tenant-notifications'] }),
        queryClient.invalidateQueries({ queryKey: ['activeTrips'] }),
        // Add a small delay to let the animation show for at least a moment feels better
        new Promise(resolve => setTimeout(resolve, 800))
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    // In real app, this would update data based on time range
  };

  const handleExportData = async (format: 'csv' | 'excel' | 'pdf' = 'csv') => {
    try {
      const blob = await tenantApi.exportTenantData(tenantId || 'default-tenant', format, {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        dataType: 'dashboard'
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tenant - dashboard - ${format} -${new Date().toISOString().split('T')[0]}.${format} `;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      // In a real app, you would show a toast notification
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12, weight: 'bold' as const }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        displayColors: true
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
        ticks: { color: '#94a3b8', font: { size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 10 } }
      }
    }
  };

  // Revenue Gradient Helper
  const revenueGradient = (ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
    return gradient;
  };

  // Fleet Gradient Helper
  const fleetGradient = (ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
    return gradient;
  };

  const revenueData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Revenue (RWF)',
        data: data.trends.revenue,
        borderColor: '#6366f1',
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(99, 102, 241, 0.1)';
          return revenueGradient(ctx);
        },
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#6366f1',
        pointHoverBorderColor: 'white',
        pointHoverBorderWidth: 3,
      }
    ]
  };

  const fleetUtilizationData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Fleet Utilization (%)',
        data: data.trends.fleetUtilization,
        borderColor: '#10b981',
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(16, 185, 129, 0.1)';
          return fleetGradient(ctx);
        },
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#10b981',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#10b981',
        pointHoverBorderColor: 'white',
        pointHoverBorderWidth: 3,
      }
    ]
  };

  const performanceData = {
    labels: ['Revenue', 'Shipments', 'Fleet Util.', 'Fuel Eff.', 'On-Time', 'Satisfaction'],
    datasets: [
      {
        label: 'Performance Metrics',
        data: [
          (data.metrics.totalRevenue / 15000000) * 100,
          (data.metrics.totalShipments / 1500) * 100,
          data.metrics.averageLoadUtilization,
          (data.metrics.fuelEfficiency / 10) * 100,
          data.metrics.onTimeDelivery,
          (data.metrics.customerSatisfaction / 5) * 100,
        ],
        backgroundColor: [
          'rgba(99, 102, 241, 0.85)',
          'rgba(16, 185, 129, 0.85)',
          'rgba(245, 158, 11, 0.85)',
          'rgba(239, 68, 68, 0.85)',
          'rgba(139, 92, 246, 0.85)',
          'rgba(20, 184, 166, 0.85)',
        ],
        borderRadius: 8,
        barThickness: 12,
      }
    ]
  };

  return (
    <div className={`min - h - screen bg - white ${className} `}>
      {/* Header */}
      <TenantHeader
        tenant={currentTenant}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        selectedView={selectedView}
        setSelectedView={setSelectedView}
      />



      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State - Premium Skeleton */}
        {isLoading && <SkeletonDashboard />}

        {/* Error State */}
        {error && (
          <div className="bg-amber-50 border border-amber-100 rounded-[20px] p-6 mb-8 flex items-center">
            <div className="p-3 bg-amber-100 rounded-xl mr-4">
              <FaExclamationTriangle className="text-amber-600 w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-amber-900 uppercase tracking-tight">Intelligence Offline</h3>
              <p className="text-[13px] text-amber-700 mt-0.5 font-medium">Using local backup data. Reconnecting to node...</p>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {!isLoading && selectedView === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-10"
            >
              {/* Quick Stats */}
              <QuickStats metrics={data.metrics} />

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Chart */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Financial Momentum</h3>
                      <h4 className="text-xl font-black text-slate-800 tracking-tight">Weekly Revenue</h4>
                    </div>
                    <div className="flex items-center space-x-3">
                      <select
                        value={timeRange}
                        onChange={(e) => handleTimeRangeChange(e.target.value)}
                        className="text-[11px] font-bold text-slate-600 bg-gray-50 border-none rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="7d">Last 7d</option>
                        <option value="30d">Last 30d</option>
                        <option value="90d">Last 90d</option>
                      </select>
                      <button
                        onClick={() => handleExportData('csv')}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Export Data"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="h-72">
                    <Line data={revenueData} options={chartOptions} />
                  </div>
                </motion.div>

                {/* Fleet Utilization Chart */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Asset Optimization</h3>
                      <h4 className="text-xl font-black text-slate-800 tracking-tight">Fleet Utilization</h4>
                    </div>
                    <div className="px-3 py-1 bg-emerald-50 rounded-full">
                      <span className="text-[11px] font-black text-emerald-600 uppercase tracking-wider">Avg: {data.metrics.averageLoadUtilization}%</span>
                    </div>
                  </div>
                  <div className="h-72">
                    <Line data={fleetUtilizationData} options={chartOptions} />
                  </div>
                </motion.div>
              </div>

              {/* Performance Metrics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8"
              >
                <div className="mb-8">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Operational Health</h3>
                  <h4 className="text-xl font-black text-slate-800 tracking-tight">Performance Radar</h4>
                </div>
                <div className="h-80">
                  <Bar data={performanceData} options={{
                    ...chartOptions,
                    indexAxis: 'y' as const,
                    plugins: {
                      ...chartOptions.plugins,
                      legend: { display: false }
                    }
                  }} />
                </div>
              </motion.div>

              {/* Detailed Performance Metrics */}
              <PerformanceMetrics tenantId={tenantId} />

              {/* Recent Activity */}
              <RecentActivity activities={data.activity} />
            </motion.div>
          )}

          {!isLoading && selectedView === 'fleet' && (
            <motion.div key="fleet" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <FleetOverview tenantId={tenantId} />
            </motion.div>
          )}

          {!isLoading && selectedView === 'cargo' && (
            <motion.div key="cargo" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <CargoAnalytics tenantId={tenantId} />
            </motion.div>
          )}

          {!isLoading && selectedView === 'financial' && (
            <motion.div key="financial" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <FinancialMetrics tenantId={tenantId} />
            </motion.div>
          )}

          {!isLoading && selectedView === 'operations' && (
            <motion.div key="operations" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <OperationalInsights />
            </motion.div>
          )}

          {!isLoading && selectedView === 'users' && tenantId && (
            <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <TenantUserManagement tenantId={tenantId} />
            </motion.div>
          )}

          {!isLoading && selectedView === 'truck-owners' && (
            <motion.div key="truck-owners" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <TruckOwnerBilling />
            </motion.div>
          )}

          {!isLoading && selectedView === 'trips' && tenantId && (
            <motion.div key="trips" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <ActiveTrips tenantId={tenantId} />
            </motion.div>
          )}

          {!isLoading && selectedView === 'settings' && tenantId && (
            <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <TenantSettings tenantId={tenantId} />
            </motion.div>
          )}

          {!isLoading && selectedView === 'bidding' && tenantId && (
            <motion.div key="bidding" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <TenantBidding tenantId={tenantId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div >
  );
};

export default TenantDashboard;
