<<<<<<< Updated upstream
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminPageLayout from '../components/Admin/AdminPageLayout';
import { StatCard, DataCard } from '../components/EnliteUI';
import UserManagementWidget from '../components/Admin/Widgets/UserManagementWidget';
import TenantManagementWidget from '../components/Admin/Widgets/TenantManagementWidget';
import SystemHealthWidget from '../components/Admin/Widgets/SystemHealthWidget';
import AdminQuickActions from '../components/Admin/AdminQuickActions';
import AdminActivityFeed from '../components/Admin/AdminActivityFeed';
import AdminGeographicMap from '../components/Admin/Widgets/AdminGeographicMap';
import LowCreditTenantsWidget from '../components/Admin/Widgets/LowCreditTenantsWidget';
import { TranslatedText } from '../components/translated-text';
import {
  Activity, Layers,
  Users, Truck, Map as MapIcon,
  TrendingUp
} from 'lucide-react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);
=======
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaUsers, FaTruck, FaBox, FaRoute, FaBuilding, FaChartLine,
  FaCreditCard, FaHistory, FaShieldAlt, FaGavel, FaMoneyBillWave,
  FaHandshake, FaFileInvoiceDollar
} from 'react-icons/fa';
import { TranslatedText } from '../components/translated-text';
import { useAuth } from '../contexts/AuthContext';
import AdminPageLayout from '../components/Admin/AdminPageLayout';
>>>>>>> Stashed changes


const AdminDashboard: React.FC = () => {
<<<<<<< Updated upstream
  const [timeRange, setTimeRange] = useState('7d');
  const navigate = useNavigate();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#f8fafc',
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 10 } }
      },
      y: {
        grid: { color: 'rgba(226, 232, 240, 0.1)' },
        ticks: { color: '#64748b', font: { size: 10 } }
      }
    }
  };

  const revenueData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        fill: true,
        label: 'Revenue',
        data: [12500, 19200, 15800, 25300, 22700, 30100, 28500],
        borderColor: '#345E85',
        backgroundColor: 'rgba(52, 94, 133, 0.05)',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  };

  const userGrowthData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'New Users',
        data: [120, 150, 180, 210, 250, 290],
        borderColor: '#345E85',
        backgroundColor: 'rgba(52, 94, 133, 0.05)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
      }
    ]
  };

  const fleetUtilizationData = {
    labels: ['Active', 'Maintenance', 'Standby', 'Reserved'],
    datasets: [
      {
        label: 'Fleet Distribution',
        data: [280, 45, 68, 35],
        backgroundColor: [
          '#345E85', // Primary for Active
          '#94a3b8',
          '#cbd5e1',
          '#f1f5f9'
        ],
        borderRadius: 6,
      }
    ]
  };

  const donutOptions = {
    cutout: '75%',
    plugins: {
      legend: { display: false }
    }
  };

  const statusData = {
    labels: ['Active', 'Pending', 'Issues', 'Completed'],
    datasets: [
      {
        data: [45, 15, 5, 35],
        backgroundColor: [
          '#10b981', // Emerald for success
          '#94a3b8', // Slate for neutral
          '#ef4444', // Red for issues
          '#345E85', // Primary for active/completed (previous indigo)
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <AdminPageLayout
      title={<TranslatedText text="Admin Dashboard" />}
      description={<TranslatedText text="Welcome back. Here's a summary of what's happening across your platform today." />}
      actions={
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 dark:bg-primary-700 text-slate-100 text-xs font-bold border border-primary-700 dark:border-primary-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <TranslatedText text="System Status: 99.9% Uptime" />
          </div>
          <AdminQuickActions />
        </div>
      }
    >
      {/* Top Banner & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary-600 dark:text-primary-400" />
            <TranslatedText text="Performance" />
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium"><TranslatedText text="Insights based on latest data" /></p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          {[
            { id: '24h', label: <TranslatedText text="Last 24h" /> },
            { id: '7d', label: <TranslatedText text="7 Days" /> },
            { id: '30d', label: <TranslatedText text="30 Days" /> },
            { id: '1y', label: <TranslatedText text="1 Year" /> }
          ].map((range) => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${timeRange === range.id
                ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 border border-slate-200 dark:border-slate-600 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          variant="premium"
          title={<TranslatedText text="Total Users" />}
          value="1,284"
          icon={<Users size={20} />}
          trend="+12%"
          trendDirection="up"
          color="primary"
          subtitle={<TranslatedText text="Recent registrations" />}
          onClick={() => navigate('/admin/users')}
        />

        <StatCard
          variant="premium"
          title={<TranslatedText text="Fleet Pulse" />}
          value="84%"
          icon={<Truck size={20} />}
          trend="+3%"
          trendDirection="up"
          color="primary"
          subtitle={<TranslatedText text="Vehicles in operation" />}
          onClick={() => navigate('/admin/trucks')}
        />

        <StatCard
          variant="premium"
          title={<TranslatedText text="Active Orders" />}
          value="876"
          icon={<Layers size={20} />}
          trend="+15%"
          trendDirection="up"
          color="primary"
          subtitle={<TranslatedText text="Currently in transit" />}
          onClick={() => navigate('/admin/loads')}
        />

        <StatCard
          variant="premium"
          title={<TranslatedText text="Revenue" />}
          value="$45,280"
          icon={<Activity size={20} />}
          trend="+23%"
          trendDirection="up"
          color="emerald"
          subtitle={<TranslatedText text="Month to date" />}
          onClick={() => navigate('/admin/financial')}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        {/* Main Analytics Section */}
        <div className="xl:col-span-2 space-y-8">
          {/* Revenue Performance */}
          <DataCard
            title={<TranslatedText text="Revenue" />}
            subtitle={<TranslatedText text="Historical performance" />}
            headerColor="secondary"
            icon={<TrendingUp size={20} />}
          >
            <div className="h-[320px]">
              <Line data={revenueData} options={chartOptions} />
            </div>
          </DataCard>

          {/* Regional Activity Map */}
          <DataCard
            title={<TranslatedText text="Activity Map" />}
            subtitle={<TranslatedText text="Platform census" />}
            headerColor="secondary"
            icon={<MapIcon size={20} />}
            actions={
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-all backdrop-blur-sm border border-white/10">
                <MapIcon size={14} /> <TranslatedText text="Explore Node Network" />
              </button>
            }
          >
            <AdminGeographicMap />
          </DataCard>

          {/* Secondary Analytics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <DataCard 
              title={<TranslatedText text="User Growth" />} 
              subtitle={<TranslatedText text="New platform members" />}
              headerColor="secondary"
              icon={<Users size={18} />}
            >
              <div className="h-[200px]">
                <Line data={userGrowthData} options={chartOptions} />
              </div>
            </DataCard>
            <DataCard 
              title={<TranslatedText text="Fleet Status" />} 
              subtitle={<TranslatedText text="Resource allocation" />}
              headerColor="secondary"
              icon={<Truck size={18} />}
            >
              <div className="h-[200px]">
                <Bar
                  data={fleetUtilizationData}
                  options={{
                    ...chartOptions,
                    scales: {
                      ...chartOptions.scales,
                      y: { ...chartOptions.scales.y, beginAtZero: true }
                    }
                  }}
                />
              </div>
            </DataCard>
=======
  const { user } = useAuth();
  const navigate = useNavigate();
  const navigate = useNavigate();

  const adminCards = [
    {
      title: 'Users',
      description: 'Manage platform users and permissions',
      icon: FaUsers,
      color: 'from-blue-500 to-blue-600',
      path: '/admin/users',
      stats: '1,284 users',
    },
    {
      title: 'Trucks',
      description: 'View and manage all trucks',
      icon: FaTruck,
      color: 'from-green-500 to-green-600',
      path: '/admin/trucks',
      stats: '428 trucks',
    },
    {
      title: 'Loads',
      description: 'Monitor cargo loads and shipments',
      icon: FaBox,
      color: 'from-orange-500 to-orange-600',
      path: '/admin/loads',
      stats: '876 loads',
    },
    {
      title: 'Routes',
      description: 'Manage delivery routes',
      icon: FaRoute,
      color: 'from-indigo-500 to-indigo-600',
      path: '/admin/routes',
      stats: '342 routes',
    },
    {
      title: 'Tenants',
      description: 'Manage tenant organizations',
      icon: FaBuilding,
      color: 'from-teal-500 to-teal-600',
      path: '/admin/tenants',
      stats: '12 tenants',
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
      title: 'Subscriptions',
      description: 'Manage tenant subscriptions and billing',
      icon: FaCreditCard,
      color: 'from-purple-500 to-purple-600',
      path: '/admin/billing',
      stats: 'Billing & Credits',
    },
    {
      title: 'Activity Logs',
      description: 'Monitor user activities and sessions',
      icon: FaHistory,
      color: 'from-cyan-500 to-cyan-600',
      path: '/admin/activity-logs',
      stats: 'Live tracking',
    },
    {
      title: 'Disputes',
      description: 'Handle disputes and resolutions',
      icon: FaGavel,
      color: 'from-red-500 to-red-600',
      path: '/admin/disputes',
      stats: 'Resolution center',
    },
    {
      title: 'Financial',
      description: 'Financial overview and transactions',
      icon: FaMoneyBillWave,
      color: 'from-yellow-500 to-yellow-600',
      path: '/admin/financial',
      stats: '$45.2K revenue',
    },
    {
      title: 'Lenders',
      description: 'Manage lending partners',
      icon: FaHandshake,
      color: 'from-emerald-500 to-emerald-600',
      path: '/admin/lenders/register',
      stats: 'Partnerships',
    },
    {
      title: 'Borrowers',
      description: 'View borrower information',
      icon: FaFileInvoiceDollar,
      color: 'from-violet-500 to-violet-600',
      path: '/admin/borrowers',
      stats: 'Loan tracking',
    },
  ];

  return (
    <AdminPageLayout
      title="Super Admin Dashboard"
      description="Manage all aspects of the Urutix platform"
    >
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {(() => {
                  const hour = new Date().getHours();
                  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
                  const firstName = (user?.firstName && user.firstName.trim()) || 
                                    ((user as any)?.profile?.firstName && (user as any).profile.firstName.trim()) || 
                                    'Admin';
                  return `${greeting}, ${firstName}!`;
                })()}
              </h1>
              <p className="text-indigo-100 text-lg">
                Welcome to the Super Admin Dashboard
              </p>
            </div>
            <div className="hidden md:block">
              <FaShieldAlt className="text-8xl opacity-20" />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">1,284</p>
                <p className="text-xs text-green-600 mt-1">↑ 12% this month</p>
              </div>
              <FaUsers className="text-4xl text-blue-500 opacity-50" />
            </div>
>>>>>>> Stashed changes
          </div>

<<<<<<< Updated upstream
        {/* Side Panel: Management & Activity */}
        <div className="space-y-8">
          {/* Real-time Health */}
          <SystemHealthWidget />

          {/* Platform Event Log */}
          <DataCard
            title={<TranslatedText text="Recent Activity" />}
            subtitle={<TranslatedText text="Latest system and user events" />}
            headerColor="secondary"
            icon={<Activity size={18} />}
            actions={
              <button
                onClick={() => navigate('/admin/activity-logs')}
                className="text-xs font-black text-white hover:text-primary-200 transition-all uppercase tracking-widest"
              >
                <TranslatedText text="Full Log" />
              </button>
            }
          >
            <AdminActivityFeed />
          </DataCard>

          {/* Quick Stats/Donut */}
          <DataCard
            title={<TranslatedText text="Shipment Pipeline" />}
            subtitle={<TranslatedText text="Current status distribution" />}
            headerColor="secondary"
            icon={<Layers size={18} />}
          >
            <div className="relative w-[180px] h-[180px] mx-auto">
              <Doughnut data={statusData} options={donutOptions} />
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-3xl font-black text-slate-800 dark:text-white">876</span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Orders" /></span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              {[
                { label: <TranslatedText text="Active" />, val: '45%', color: 'bg-primary-600' },
                { label: <TranslatedText text="Pending" />, val: '15%', color: 'bg-slate-400' },
                { label: <TranslatedText text="Issues" />, val: '5%', color: 'bg-red-500' },
                { label: <TranslatedText text="Success" />, val: '35%', color: 'bg-emerald-500' }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">{item.label}</span>
=======
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Trucks</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">428</p>
                <p className="text-xs text-green-600 mt-1">↑ 8% this month</p>
              </div>
              <FaTruck className="text-4xl text-green-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Subscriptions</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">12</p>
                <p className="text-xs text-green-600 mt-1">All active</p>
              </div>
              <FaCreditCard className="text-4xl text-purple-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">$45.2K</p>
                <p className="text-xs text-green-600 mt-1">↑ 23% this month</p>
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
>>>>>>> Stashed changes
                  </div>
                  <span className="text-xs font-black text-slate-900 dark:text-white">{item.val}</span>
                </div>
              ))}
            </div>
          </DataCard>
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
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">New tenant registered: Acme Logistics</span>
              <span className="text-xs text-gray-500 ml-auto">2 min ago</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Subscription renewed: Beta Transport</span>
              <span className="text-xs text-gray-500 ml-auto">15 min ago</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Credits purchased: 5000 credits</span>
              <span className="text-xs text-gray-500 ml-auto">1 hour ago</span>
            </div>
          </div>
        </div>
      </div>
<<<<<<< Updated upstream

      {/* Management Widgets Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-12">
        <UserManagementWidget />
        <TenantManagementWidget />
        <LowCreditTenantsWidget />
      </div>
=======
>>>>>>> Stashed changes
    </AdminPageLayout>
  );
};

export default AdminDashboard;

