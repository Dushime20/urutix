import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FaBuilding, FaTruck, FaUsers, FaChartLine, 
  FaCoins, FaCreditCard, FaExclamationTriangle, FaCheckCircle 
} from 'react-icons/fa';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import { StatCard, DataCard, EnhancedTable, Column } from '../../components/EnliteUI';
import api from '../../services/api';
import { TranslatedText } from '../../components/translated-text';

interface DashboardStats {
  totalTenants: number;
  activeTrucks: number;
  totalUsers: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  totalCredits: number;
  pendingApprovals: number;
  systemHealth: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

const AdminDashboardEnlite: React.FC = () => {
  const [sortKey, setSortKey] = useState<string>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      // Replace with your actual API call
      const response = await api.get('/admin/dashboard/stats');
      return response.data;
    },
  });

  // Fetch recent activities
  const { data: activities, isLoading: activitiesLoading } = useQuery<RecentActivity[]>({
    queryKey: ['admin-recent-activities'],
    queryFn: async () => {
      // Replace with your actual API call
      const response = await api.get('/admin/dashboard/activities');
      return response.data;
    },
  });

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Table columns
  const columns: Column<RecentActivity>[] = [
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (value) => (
        <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-semibold">
          {value}
        </span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      sortable: false,
    },
    {
      key: 'timestamp',
      label: 'Time',
      sortable: true,
      render: (value) => new Date(value).toLocaleString(),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      align: 'center',
      render: (value) => {
        const statusConfig = {
          success: { bg: 'bg-green-100', text: 'text-green-800', icon: <FaCheckCircle /> },
          warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <FaExclamationTriangle /> },
          error: { bg: 'bg-red-100', text: 'text-red-800', icon: <FaExclamationTriangle /> },
        };
        const config = statusConfig[value as keyof typeof statusConfig];
        return (
          <span className={`inline-flex items-center gap-1 px-3 py-1 ${config.bg} ${config.text} rounded-full text-xs font-semibold`}>
            {config.icon}
            {value}
          </span>
        );
      },
    },
  ];

  return (
    <AdminPageLayout
      title={<TranslatedText text="Dashboard" />}
      description={<TranslatedText text="Overview of your system performance and metrics" />}
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title={<TranslatedText text="Total Tenants" />}
            value={stats?.totalTenants || 0}
            icon={<FaBuilding />}
            trend="+12%"
            trendDirection="up"
            color="primary"
            subtitle={<TranslatedText text="Last 30 days" />}
            loading={statsLoading}
          />

          <StatCard
            title={<TranslatedText text="Active Trucks" />}
            value={stats?.activeTrucks || 0}
            icon={<FaTruck />}
            trend="+8%"
            trendDirection="up"
            color="success"
            subtitle={<TranslatedText text="Currently active" />}
            loading={statsLoading}
          />

          <StatCard
            title={<TranslatedText text="Total Users" />}
            value={stats?.totalUsers || 0}
            icon={<FaUsers />}
            trend="+15%"
            trendDirection="up"
            color="info"
            subtitle={<TranslatedText text="Registered users" />}
            loading={statsLoading}
          />

          <StatCard
            title={<TranslatedText text="Monthly Revenue" />}
            value={`$${stats?.monthlyRevenue?.toLocaleString() || 0}`}
            icon={<FaChartLine />}
            trend="+23%"
            trendDirection="up"
            color="warning"
            subtitle={<TranslatedText text="This month" />}
            loading={statsLoading}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title={<TranslatedText text="Active Subscriptions" />}
            value={stats?.activeSubscriptions || 0}
            icon={<FaCreditCard />}
            color="secondary"
            subtitle={<TranslatedText text="Current subscriptions" />}
            loading={statsLoading}
          />

          <StatCard
            title={<TranslatedText text="Total Credits" />}
            value={stats?.totalCredits?.toLocaleString() || 0}
            icon={<FaCoins />}
            trend="-5%"
            trendDirection="down"
            color="warning"
            subtitle={<TranslatedText text="Available credits" />}
            loading={statsLoading}
          />

          <StatCard
            title={<TranslatedText text="Pending Approvals" />}
            value={stats?.pendingApprovals || 0}
            icon={<FaExclamationTriangle />}
            color="error"
            subtitle={<TranslatedText text="Requires attention" />}
            loading={statsLoading}
          />

          <StatCard
            title={<TranslatedText text="System Health" />}
            value={`${stats?.systemHealth || 0}%`}
            icon={<FaCheckCircle />}
            trend="Excellent"
            trendDirection="up"
            color="success"
            subtitle={<TranslatedText text="All systems operational" />}
            loading={statsLoading}
          />
        </div>

        {/* Recent Activities Table */}
        <DataCard
          title={<TranslatedText text="Recent Activities" />}
          subtitle={<TranslatedText text="Latest system activities and events" />}
          icon={<FaChartLine />}
          headerColor="primary"
          actions={
            <button className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-semibold text-sm">
              <TranslatedText text="View All" />
            </button>
          }
        >
          <EnhancedTable
            columns={columns}
            data={activities || []}
            onSort={handleSort}
            sortKey={sortKey}
            sortDirection={sortDirection}
            loading={activitiesLoading}
            emptyMessage={<TranslatedText text="No recent activities" />}
            hoverable
            striped
          />
        </DataCard>

        {/* Quick Actions */}
        <DataCard
          title={<TranslatedText text="Quick Actions" />}
          subtitle={<TranslatedText text="Common administrative tasks" />}
          icon={<FaUsers />}
          headerColor="secondary"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all">
              <FaBuilding className="text-2xl mb-2" />
              <p className="font-semibold"><TranslatedText text="Add Tenant" /></p>
            </button>
            <button className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all">
              <FaTruck className="text-2xl mb-2" />
              <p className="font-semibold"><TranslatedText text="Register Truck" /></p>
            </button>
            <button className="p-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all">
              <FaUsers className="text-2xl mb-2" />
              <p className="font-semibold"><TranslatedText text="Manage Users" /></p>
            </button>
          </div>
        </DataCard>
      </div>
    </AdminPageLayout>
  );
};

export default AdminDashboardEnlite;
