import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FaTruck, FaBox, FaDollarSign, FaChartLine, 
  FaRoute, FaExclamationTriangle,
  FaDownload, FaUsers
} from 'react-icons/fa';
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
import UserManagement from './UserManagement/UserManagement';
import BidManagement from './BidManagement/BidManagement';
import BillingManagement from './BillingManagement/BillingManagement';
import ProfileSettings from './ProfileSettings';
import SystemSettings from './SystemSettings';
import { tenantApi, mockTenantData } from '../../services/tenantApi';
import type { TenantMetrics, TenantTrends, TenantActivity } from '../../services/tenantApi';
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
  const [timeRange, setTimeRange] = useState('7d');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedView, setSelectedView] = useState<'overview' | 'fleet' | 'cargo' | 'financial' | 'operations' | 'users' | 'bids' | 'billing' | 'profile' | 'settings'>('overview');

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
  const { data: tenantData, isLoading, error, refetch } = useQuery<{
    metrics: TenantMetrics;
    trends: TenantTrends;
    activity: TenantActivity[];
  }>({
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

  const handleRefresh = () => {
    setLastUpdated(new Date());
    refetch();
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
      a.download = `tenant-dashboard-${format}-${new Date().toISOString().split('T')[0]}.${format}`;
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' }
      },
      x: {
        grid: { color: 'rgba(0, 0, 0, 0.05)' }
      }
    }
  };

  const revenueData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Revenue (RWF)',
        data: data.trends.revenue,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  };

  const fleetUtilizationData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Fleet Utilization (%)',
        data: data.trends.fleetUtilization,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
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
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
          'rgb(251, 191, 36)',
          'rgb(239, 68, 68)',
          'rgb(168, 85, 247)',
          'rgb(16, 185, 129)',
        ],
        borderWidth: 2
      }
    ]
  };

  const handleViewChange = (view: string) => {
    setSelectedView(view as 'overview' | 'fleet' | 'cargo' | 'financial' | 'operations' | 'users' | 'bids' | 'billing' | 'profile' | 'settings');
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <TenantHeader 
        tenant={currentTenant}
        onRefresh={handleRefresh}
        lastUpdated={lastUpdated}
        onViewChange={handleViewChange}
      />

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-[180px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto scrollbar-hide">
            {[
              { id: 'overview', label: 'Overview', icon: FaChartLine },
              { id: 'users', label: 'Users', icon: FaUsers },
              { id: 'bids', label: 'Bids', icon: FaRoute },
              { id: 'billing', label: 'Billing', icon: FaDollarSign },
              { id: 'fleet', label: 'Fleet', icon: FaTruck },
              { id: 'cargo', label: 'Cargo', icon: FaBox },
              { id: 'financial', label: 'Financial', icon: FaDollarSign },
              { id: 'operations', label: 'Operations', icon: FaRoute },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedView(tab.id as any)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0
                    ${selectedView === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="inline-block w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-lg text-gray-600">Loading dashboard data...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <FaExclamationTriangle className="text-red-400 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-red-800">Error Loading Data</h3>
                <p className="text-red-700 mt-1">Using mock data. Please check your connection and try again.</p>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'overview' && (
          <div className="space-y-8">
            {/* Quick Stats */}
            <QuickStats metrics={data.metrics} />

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Revenue Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Weekly Revenue</h3>
                  <div className="flex items-center space-x-2">
                    <select
                      value={timeRange}
                      onChange={(e) => handleTimeRangeChange(e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="7d">7 Days</option>
                      <option value="30d">30 Days</option>
                      <option value="90d">90 Days</option>
                    </select>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleExportData('csv')}
                        className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
                        title="Export as CSV"
                      >
                        <FaDownload className="w-3 h-3 mr-1" />
                        CSV
                      </button>
                      <button
                        onClick={() => handleExportData('excel')}
                        className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
                        title="Export as Excel"
                      >
                        <FaDownload className="w-3 h-3 mr-1" />
                        Excel
                      </button>
                      <button
                        onClick={() => handleExportData('pdf')}
                        className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
                        title="Export as PDF"
                      >
                        <FaDownload className="w-3 h-3 mr-1" />
                        PDF
                      </button>
                    </div>
                  </div>
                </div>
                <div className="h-64">
                  <Line data={revenueData} options={chartOptions} />
                </div>
              </div>

              {/* Fleet Utilization Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Fleet Utilization</h3>
                  <div className="text-sm text-gray-500">
                    Average: {data.metrics.averageLoadUtilization}%
                  </div>
                </div>
                <div className="h-64">
                  <Line data={fleetUtilizationData} options={chartOptions} />
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
              <div className="h-64">
                <Bar data={performanceData} options={chartOptions} />
              </div>
            </div>

            {/* Detailed Performance Metrics */}
            <PerformanceMetrics tenantId={tenantId} />

            {/* Recent Activity */}
            <RecentActivity activities={data.activity} />
          </div>
        )}

        {selectedView === 'users' && (
          <UserManagement tenantId={currentTenant.id} />
        )}

        {selectedView === 'bids' && (
          <BidManagement tenantId={currentTenant.id} />
        )}

        {selectedView === 'billing' && (
          <BillingManagement tenantId={currentTenant.id} />
        )}

        {selectedView === 'fleet' && (
          <FleetOverview tenantId={tenantId || currentTenant.id} />
        )}

        {selectedView === 'cargo' && (
          <CargoAnalytics tenantId={tenantId || currentTenant.id} />
        )}

        {selectedView === 'financial' && (
          <FinancialMetrics tenantId={tenantId || currentTenant.id} />
        )}

        {selectedView === 'operations' && (
          <OperationalInsights tenantId={tenantId || currentTenant.id} />
        )}

        {selectedView === 'profile' && (
          <ProfileSettings />
        )}

        {selectedView === 'settings' && (
          <SystemSettings />
        )}
      </div>
    </div>
  );
};

export default TenantDashboard;
