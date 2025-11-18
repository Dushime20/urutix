import React from 'react';
import { 
  FaUsers, FaTruck, FaBox, FaDollarSign,
  FaCheckCircle, FaExclamationTriangle
} from 'react-icons/fa';
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
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        beginAtZero: true,
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
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Platform overview and key metrics</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="text-white text-lg" />
                </div>
                <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                  stat.changeType === 'positive' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                }`}>
                  {stat.change}
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-500 mb-1">{stat.label}</div>
              <div className="text-xs text-gray-400">{stat.description}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Revenue Trend</h3>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-lg">6M</button>
              <button className="px-3 py-1 text-sm text-gray-500 rounded-lg hover:bg-gray-100">1Y</button>
            </div>
          </div>
          <div className="h-80">
            <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Cargo Status</h3>
          <div className="h-80">
            <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Performance Metrics</h3>
          <div className="h-80">
            <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View All</button>
          </div>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {recentActivities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <Icon className={`${activity.color} text-lg mt-0.5 flex-shrink-0`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{activity.text}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
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
