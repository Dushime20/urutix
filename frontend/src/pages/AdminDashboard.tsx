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

const AdminDashboard: React.FC = () => {
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
        grid: { color: '#f1f5f9' },
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
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.05)',
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
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.05)',
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
          '#4f46e5',
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
          '#4f46e5', // Indigo for active/completed
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <AdminPageLayout
      title="Platform Overview"
      description="Welcome back. Here's a summary of what's happening across your platform today."
      actions={
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            System Healthy: 99.9% Uptime
          </div>
          <AdminQuickActions />
        </div>
      }
    >
      {/* Top Banner & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-600" />
            Performance Trends
          </h2>
          <p className="text-sm text-slate-500 font-medium">Insights based on latest data</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          {[
            { id: '24h', label: 'Last 24h' },
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: '1y', label: '1 Year' }
          ].map((range) => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${timeRange === range.id
                ? 'bg-white text-indigo-600 border border-slate-200'
                : 'text-slate-500 hover:text-slate-700'
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
          title="Total Users"
          value="1,284"
          icon={<Users size={20} />}
          trend="+12%"
          trendDirection="up"
          color="primary"
          subtitle="Recent registrations"
          onClick={() => navigate('/admin/users')}
        />

        <StatCard
          title="Fleet Pulse"
          value="84%"
          icon={<Truck size={20} />}
          trend="+3%"
          trendDirection="up"
          color="primary"
          subtitle="Vehicles in operation"
          onClick={() => navigate('/admin/trucks')}
        />

        <StatCard
          title="Active Orders"
          value="876"
          icon={<Layers size={20} />}
          trend="+15%"
          trendDirection="up"
          color="primary"
          subtitle="Currently in transit"
          onClick={() => navigate('/admin/loads')}
        />

        <StatCard
          title="Revenue"
          value="$45,280"
          icon={<Activity size={20} />}
          trend="+23%"
          trendDirection="up"
          color="primary"
          subtitle="Month to date"
          onClick={() => navigate('/admin/financial')}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        {/* Main Analytics Section */}
        <div className="xl:col-span-2 space-y-8">
          {/* Revenue Performance */}
          <DataCard
            title="Revenue Trajectory"
            subtitle="Historical performance overview"
          >
            <div className="h-[320px]">
              <Line data={revenueData} options={chartOptions} />
            </div>
          </DataCard>

          {/* Regional Activity Map */}
          <DataCard
            title="Geographic Hub Distribution"
            subtitle="Platform census across key hubs"
            actions={
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-bold transition-all">
                <MapIcon size={14} /> View Map
              </button>
            }
          >
            <AdminGeographicMap />
          </DataCard>

          {/* Secondary Analytics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <DataCard title="User Growth" subtitle="New platform members" >
              <div className="h-[200px]">
                <Line data={userGrowthData} options={chartOptions} />
              </div>
            </DataCard>
            <DataCard title="Fleet Status" subtitle="Resource allocation" >
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
          </div>
        </div>

        {/* Side Panel: Management & Activity */}
        <div className="space-y-8">
          {/* Real-time Health */}
          <SystemHealthWidget />

          {/* Platform Event Log */}
          <DataCard
            title="Recent Activity"
            subtitle="Latest system and user events"
            actions={
              <button
                onClick={() => navigate('/admin/activity-logs')}
                className="text-xs font-bold text-indigo-600 hover:underline transition-all"
              >
                Full Log
              </button>
            }
          >
            <AdminActivityFeed />
          </DataCard>

          {/* Quick Stats/Donut */}
          <DataCard
            title="Shipment Pipeline"
            subtitle="Current status distribution"
          >
            <div className="relative w-[180px] h-[180px] mx-auto">
              <Doughnut data={statusData} options={donutOptions} />
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-3xl font-black text-slate-800">876</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Orders</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              {[
                { label: 'Active', val: '45%', color: 'bg-indigo-600' },
                { label: 'Pending', val: '15%', color: 'bg-slate-400' },
                { label: 'Issues', val: '5%', color: 'bg-red-500' },
                { label: 'Success', val: '35%', color: 'bg-emerald-500' }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{item.label}</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">{item.val}</span>
                </div>
              ))}
            </div>
          </DataCard>
        </div>
      </div>

      {/* Management Widgets Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
        <UserManagementWidget />
        <TenantManagementWidget />
      </div>
    </AdminPageLayout>
  );
};

export default AdminDashboard;

