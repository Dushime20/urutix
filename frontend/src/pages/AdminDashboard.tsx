import React from 'react';
import { 
  FaUsers, FaTruck, FaBox, FaDollarSign,
  FaCheckCircle, FaExclamationTriangle, FaSync
} from 'react-icons/fa';
import { TranslatedText } from '../components/translated-text';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
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
} from 'chart.js';

import { useAuth } from '../contexts/AuthContext';
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const stats = [
    { 
      label: 'Total Users', 
      value: 1284, 
      change: '+12%',
      changeType: 'positive',
      icon: FaUsers, 
      color: 'from-blue-500 to-blue-600',
      description: 'Active platform users'
    },
    { 
      label: 'Active Trucks', 
      value: 428, 
      change: '+8%',
      changeType: 'positive',
      icon: FaTruck, 
      color: 'from-green-500 to-green-600',
      description: 'Trucks in service'
    },
    { 
      label: 'Total Cargos', 
      value: 876, 
      change: '+15%',
      changeType: 'positive',
      icon: FaBox, 
      color: 'from-purple-500 to-purple-600',
      description: 'Managed shipments'
    },
    { 
      label: 'Revenue', 
      value: '$45.2K', 
      change: '+23%',
      changeType: 'positive',
      icon: FaDollarSign, 
      color: 'from-yellow-500 to-yellow-600',
      description: 'Monthly earnings'
    },
  ];

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue (K$)',
        data: [12.5, 19.2, 15.8, 25.3, 22.7, 30.1],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const barData = {
    labels: ['New Users', 'Active Trucks', 'Completed Orders', 'Revenue Growth'],
    datasets: [
      {
        label: 'This Month',
        data: [128, 87, 156, 203],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
        borderRadius: 8,
      },
    ],
  };

  const doughnutData = {
    labels: ['In Transit', 'Delivered', 'Pending Pickup', 'Cancelled'],
    datasets: [
      {
        data: [45, 35, 15, 5],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderWidth: 0,
        cutout: '60%',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          padding: 10,
          font: {
            size: 10,
          },
          boxWidth: 10,
          boxHeight: 10,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        cornerRadius: 6,
        titleFont: { size: 11 },
        bodyFont: { size: 10 },
        padding: 8,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 10 },
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        beginAtZero: true,
        ticks: {
          font: { size: 10 },
        },
      },
    },
  };

  const recentActivities = [
    { icon: FaCheckCircle, color: 'text-green-500', text: 'New cargo shipment completed', time: '2 min ago' },
    { icon: FaUsers, color: 'text-blue-500', text: 'New user registered: john@example.com', time: '5 min ago' },
    { icon: FaTruck, color: 'text-yellow-500', text: 'Truck TRK-001 maintenance scheduled', time: '10 min ago' },
    { icon: FaExclamationTriangle, color: 'text-red-500', text: 'High priority cargo requires attention', time: '15 min ago' },
    { icon: FaBox, color: 'text-purple-500', text: 'Cargo batch processed successfully', time: '20 min ago' },
  ];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 mb-6">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Search Bar */}
          <div className="flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg">
              <div className="w-8 h-8 bg-navy-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.firstName?.charAt(0) || 'A'}
              </div>
            </button>
          </div>
        </div>

        {/* Menu Tabs */}
        <div className="flex items-center gap-8 px-6">
          <button className="pb-3 border-b-2 border-navy-600 text-navy-600 font-medium">
            <TranslatedText text="Overview" />
          </button>
          <button className="pb-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
            <TranslatedText text="Users" />
          </button>
          <button className="pb-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
            <TranslatedText text="Analytics" />
          </button>
          <button className="pb-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
            <TranslatedText text="Settings" />
          </button>
          <button className="pb-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
            <TranslatedText text="Reports" />
          </button>
          <button className="pb-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
            <TranslatedText text="Help" />
          </button>
        </div>
      </div>

      {/* Greeting Section */}
      <div className="px-6 pb-2">
            {(() => {
              const hour = new Date().getHours();
              const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
              // Get firstName from user object, fallback to profile.firstName, then to 'Admin'
              const firstName = (user?.firstName && user.firstName.trim()) || 
                                ((user as any)?.profile?.firstName && (user as any).profile.firstName.trim()) || 
                                'Admin';
              return (
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{greeting}, {firstName}</h1>
                     <p className="text-gray-500 text-sm">Welcome to the administration panel</p>
                  </div>
              );
            })()}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 hover:shadow-md transition-all duration-200 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity" style={{
                background: stat.color === 'from-blue-500 to-blue-600' ? 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.05), transparent)' :
                           stat.color === 'from-green-500 to-green-600' ? 'linear-gradient(to bottom right, rgba(16, 185, 129, 0.05), transparent)' :
                           stat.color === 'from-purple-500 to-purple-600' ? 'linear-gradient(to bottom right, rgba(168, 85, 247, 0.05), transparent)' :
                           'linear-gradient(to bottom right, rgba(245, 158, 11, 0.05), transparent)'
              }}></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`w-10 h-10 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="text-white text-sm" />
                  </div>
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                    stat.changeType === 'positive' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <div className="text-lg font-bold text-gray-900 mb-0.5">{stat.value}</div>
                <div className="text-xs font-medium text-gray-600 mb-0.5">
                  <TranslatedText text={stat.label} />
                </div>
                <div className="text-[10px] text-gray-500">
                  <TranslatedText text={stat.description} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-900">
              <TranslatedText text="Revenue Trend" />
            </h3>
            <div className="flex space-x-1.5">
              <button className="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-md font-medium">6M</button>
              <button className="px-2 py-0.5 text-xs text-gray-500 rounded-md hover:bg-gray-100">1Y</button>
            </div>
          </div>
          <div className="h-64">
            <Line data={chartData} options={{ 
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                legend: {
                  ...chartOptions.plugins.legend,
                  labels: {
                    ...chartOptions.plugins.legend.labels,
                    padding: 10,
                    font: { size: 10 }
                  }
                }
              }
            }} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
          <h3 className="text-xs font-semibold text-gray-900 mb-2">
            <TranslatedText text="Cargo Status" />
          </h3>
          <div className="h-64">
            <Doughnut data={doughnutData} options={{ 
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                legend: {
                  ...chartOptions.plugins.legend,
                  labels: {
                    ...chartOptions.plugins.legend.labels,
                    padding: 10,
                    font: { size: 10 }
                  }
                }
              }
            }} />
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
          <h3 className="text-xs font-semibold text-gray-900 mb-2">
            <TranslatedText text="Performance Metrics" />
          </h3>
          <div className="h-64">
            <Bar data={barData} options={{ 
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                legend: {
                  ...chartOptions.plugins.legend,
                  labels: {
                    ...chartOptions.plugins.legend.labels,
                    padding: 10,
                    font: { size: 10 }
                  }
                }
              }
            }} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-900">
              <TranslatedText text="Recent Activity" />
            </h3>
            <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">
              <TranslatedText text="View All" />
            </button>
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {recentActivities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-start gap-1.5 p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <Icon className={`${activity.color} text-sm mt-0.5 flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-900 font-medium">{activity.text}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
