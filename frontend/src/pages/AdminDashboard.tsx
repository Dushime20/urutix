import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCheckCircle, FaExclamationTriangle,
  FaArrowUp, FaArrowDown,
  FaBell,
  FaCreditCard
} from 'react-icons/fa';
import AdminPageLayout from '../components/Admin/AdminPageLayout';
import UserManagementWidget from '../components/Admin/Widgets/UserManagementWidget';
import TenantManagementWidget from '../components/Admin/Widgets/TenantManagementWidget';
import FinancialWidget from '../components/Admin/Widgets/FinancialWidget';
import SystemHealthWidget from '../components/Admin/Widgets/SystemHealthWidget';
import {
  Zap, Activity, Layers,
  Users, Truck
} from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
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

  const stats = [
    {
      label: 'Total Users',
      value: '1,284',
      change: '+12.5%',
      changeType: 'positive',
      icon: Users,
      color: 'blue',
      description: 'Active platform users',
      trend: [65, 59, 80, 81, 56, 55, 40],
      link: '/admin/users'
    },
    {
      label: 'Active Fleet',
      value: '428',
      change: '+8.2%',
      changeType: 'positive',
      icon: Truck,
      color: 'emerald',
      description: 'Trucks currently active',
      trend: [28, 48, 40, 19, 86, 27, 90],
      link: '/admin/trucks'
    },
    {
      label: 'Total Shipments',
      value: '876',
      change: '+15.3%',
      changeType: 'positive',
      icon: Layers,
      color: 'indigo',
      description: 'Managed this month',
      trend: [65, 59, 80, 81, 56, 55, 40],
      link: '/admin/loads'
    },
    {
      label: 'Total Revenue',
      value: '$45.2K',
      change: '+23.1%',
      changeType: 'positive',
      icon: Activity,
      color: 'amber',
      description: 'Monthly earnings',
      trend: [28, 48, 40, 19, 86, 27, 90],
      link: '/admin/financial'
    },
    {
      label: 'Subscriptions',
      value: '156',
      change: '+18.7%',
      changeType: 'positive',
      icon: FaCreditCard,
      color: 'purple',
      description: 'Active subscriptions',
      trend: [45, 52, 48, 65, 72, 68, 75],
      link: '/admin/subscriptions'
    },
  ];

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
        ticks: { color: '#64748b', font: { size: 11 } }
      },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: { color: '#64748b', font: { size: 11 } }
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
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
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
          '#10b981', // Emerald
          '#f59e0b', // Amber
          '#ef4444', // Red
          '#3b82f6', // Blue
        ],
        borderWidth: 0,
      },
    ],
  };

  const recentActivities = [
    { icon: FaCheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', title: 'Shipment #SH-8821 Completed', desc: 'Successfully delivered to Mombasa Port', time: '2 min ago' },
    { icon: FaBell, color: 'text-blue-500', bg: 'bg-blue-500/10', title: 'New Tenant Registered', desc: 'ABC Logistics joined the platform', time: '15 min ago' },
    { icon: FaExclamationTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', title: 'Maintenance Alert', desc: 'Truck KCA-452 requires urgent service', time: '1 hr ago' },
  ];

  return (
    <AdminPageLayout
      title="Super Admin Dashboard"
      description="Centralized control panel for managing all platform operations, users, tenants, and system health."
      actions={
        <>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            All Systems Operational
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-600/20 transition-all">
            <Zap size={16} /> Quick Actions
          </button>
        </>
      }
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              onClick={() => stat.link && navigate(stat.link)}
              className={`bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all group ${stat.link ? 'cursor-pointer hover:border-indigo-200' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:bg-${stat.color}-600 group-hover:text-white transition-colors duration-300`}>
                  <Icon size={24} />
                </div>
                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${stat.changeType === 'positive' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {stat.changeType === 'positive' ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
                  {stat.change}
                </span>
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-800 mb-1">{stat.value}</h3>
                <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        <UserManagementWidget />
        <TenantManagementWidget />
        <FinancialWidget />
        <SystemHealthWidget />

        {/* Order Status Donut */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-1">Order Status</h3>
          <p className="text-sm text-slate-500 mb-6">Distribution of current shipments</p>

          <div className="relative w-[200px] h-[200px] mx-auto">
            <Doughnut data={statusData} options={donutOptions} />
            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
              <span className="text-3xl font-black text-slate-800">876</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-sm font-medium text-slate-600">Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-sm font-medium text-slate-600">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm font-medium text-slate-600">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm font-medium text-slate-600">Issues</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Live Activity</h3>
            <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700">View All</button>
          </div>
          <div className="space-y-6">
            {recentActivities.map((activity, idx) => {
              const Icon = activity.icon;
              return (
                <div key={idx} className="flex gap-4">
                  <div className={`w-10 h-10 rounded-full ${activity.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={activity.color} size={16} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-800">{activity.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{activity.desc}</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{activity.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Revenue Chart - Full Width */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Financial Performance</h3>
            <p className="text-sm text-slate-500">Revenue trajectory over the last 7 days</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${timeRange === '7d' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`} onClick={() => setTimeRange('7d')}>7 Days</button>
            <button className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${timeRange === '30d' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`} onClick={() => setTimeRange('30d')}>30 Days</button>
            <button className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${timeRange === '1y' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`} onClick={() => setTimeRange('1y')}>Year</button>
          </div>
        </div>
        <div className="h-[300px]">
          <Line data={revenueData} options={chartOptions} />
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default AdminDashboard;
