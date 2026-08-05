import React, { useState, useEffect } from 'react';
import { 
  FaUsers, FaTruck, FaBox, FaDollarSign,
  FaCheckCircle, FaExclamationTriangle, FaClock,
  FaArrowUp, FaArrowDown, FaMinus, FaSync,
  FaCalendar
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

// Type definitions
interface StatItem {
  label: string;
  value: number | string;
  change: string;
  changeType: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  trend: string;
}

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
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Enhanced chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
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
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  };

  // Enhanced data with more realistic values and trends
  const [lineData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Revenue (RWF)',
        data: [1250000, 1890000, 1500000, 2500000, 2200000, 3000000, 2800000],
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
      },
      {
        label: 'Shipments',
        data: [45, 67, 52, 89, 76, 98, 84],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  });

  const [barData] = useState({
    labels: ['Active Users', 'Fleet Owners', 'Cargo Owners', 'Admins', 'Drivers'],
    datasets: [
      {
        label: 'User Count',
        data: [1284, 342, 892, 15, 567],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderRadius: 8,
        borderSkipped: false,
      }
    ]
  });

  const [doughnutData] = useState({
    labels: ['In Transit', 'Delivered', 'Pending', 'Cancelled', 'Returned'],
    datasets: [
      {
        data: [45, 35, 15, 3, 2],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
        borderWidth: 2,
        borderColor: 'white',
        hoverOffset: 4
      }
    ]
  });

  const [stats, setStats] = useState<StatItem[]>([
    { 
      label: 'Total Users', 
      value: 1284, 
      change: '+12%',
      changeType: 'positive',
      icon: FaUsers, 
      color: 'from-blue-500 to-blue-600',
      description: 'Active platform users',
      trend: 'up'
    },
    { 
      label: 'Active Fleet', 
      value: 342, 
      change: '+8%',
      changeType: 'positive',
      icon: FaTruck, 
      color: 'from-green-500 to-green-600',
      description: 'Registered trucks',
      trend: 'up'
    },
    { 
      label: 'Cargo Shipments', 
      value: 1567, 
      change: '+23%',
      changeType: 'positive',
      icon: FaBox, 
      color: 'from-purple-500 to-purple-600',
      description: 'Total shipments',
      trend: 'up'
    },
    { 
      label: 'Monthly Revenue', 
      value: 'RWF 12.5M', 
      change: '+15%',
      changeType: 'positive',
      icon: FaDollarSign, 
      color: 'from-yellow-500 to-yellow-600',
      description: 'Platform earnings',
      trend: 'up'
    }
  ]);

  const [recentActivities] = useState([
    {
      icon: FaUsers,
      color: 'text-blue-500',
      text: 'New cargo owner registered: TransCorp Ltd',
      time: '2 minutes ago',
      status: 'success'
    },
    {
      icon: FaTruck,
      color: 'text-green-500',
      text: 'Fleet "FastTrans" added 3 new trucks',
      time: '15 minutes ago',
      status: 'info'
    },
    {
      icon: FaCheckCircle,
      color: 'text-green-500',
      text: 'Shipment CRG-1234 delivered successfully',
      time: '1 hour ago',
      status: 'success'
    },
    {
      icon: FaExclamationTriangle,
      color: 'text-yellow-500',
      text: 'Payment dispute opened for shipment CRG-5678',
      time: '2 hours ago',
      status: 'warning'
    },
    {
      icon: FaClock,
      color: 'text-purple-500',
      text: 'Scheduled maintenance for truck TR-890',
      time: '3 hours ago',
      status: 'info'
    }
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (isLoading) return;
      
      setLastUpdated(new Date());
      
      // Update some metrics randomly
      setStats(prev => prev.map(stat => {
        if (stat.label === 'Cargo Shipments' && typeof stat.value === 'number') {
          return {
            ...stat,
            value: Math.floor(stat.value + Math.random() * 10 - 5)
          };
        }
        return stat;
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isLoading]);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setLastUpdated(new Date());
    }, 1000);
  };

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    // Here you would typically fetch new data based on the time range
    handleRefresh();
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <FaArrowUp className="text-green-500" />;
      case 'down': return <FaArrowDown className="text-red-500" />;
      default: return <FaMinus className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-slate-300">Welcome to the UrutiX administration panel</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <FaCalendar />
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <FaSync className={`${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-4 border border-gray-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Time Range</h3>
          <div className="flex space-x-2">
            {['1d', '7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => handleTimeRangeChange(range)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 dark:text-slate-300 hover:bg-gray-200'
                }`}
              >
                {range === '1d' ? '24h' : range === '7d' ? '7 days' : range === '30d' ? '30 days' : '90 days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-slate-800 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-800 mb-2">{stat.value}</p>
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(stat.trend)}
                    <span className={`text-sm font-semibold ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500">vs last period</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center ml-4 shadow-lg`}>
                  <Icon className="text-white text-xl" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enhanced Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Revenue & Shipments Trend</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-slate-300">Revenue</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-slate-300">Shipments</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <Line data={lineData} options={chartOptions} />
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Cargo Status Distribution</h3>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View Details</button>
          </div>
          <div className="h-80">
            <Doughnut data={doughnutData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Enhanced Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">User Distribution</h3>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Export Data</button>
          </div>
          <div className="h-80">
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View All</button>
          </div>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {recentActivities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div 
                  key={index} 
                  className={`flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${getStatusColor(activity.status)}`}
                >
                  <Icon className={`${activity.color} text-lg mt-0.5`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 font-medium">{activity.text}</p>
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
