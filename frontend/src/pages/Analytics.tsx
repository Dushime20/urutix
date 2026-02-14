import React, { useState, useEffect } from 'react';
import { FaChartBar, FaTruck, FaBox, FaDollarSign, FaMapMarkedAlt, FaCalendar, FaArrowUp, FaArrowDown, FaChartLine, FaCheckCircle, FaClock, FaExclamationTriangle, FaDownload, FaFilter } from 'react-icons/fa';
import AdminPageLayout from '../components/Admin/AdminPageLayout';

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const stats = [
    {
      title: 'Total Cargo',
      value: '24',
      change: '+12%',
      changeType: 'positive',
      icon: FaBox,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Active Shipments',
      value: '8',
      change: '+3%',
      changeType: 'positive',
      icon: FaTruck,
      color: 'green',
      gradient: 'from-green-500 to-green-600'
    },
    {
      title: 'Total Revenue',
      value: '$45,230',
      change: '+8%',
      changeType: 'positive',
      icon: FaDollarSign,
      color: 'yellow',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      title: 'Avg Delivery Time',
      value: '3.2 days',
      change: '-0.5 days',
      changeType: 'positive',
      icon: FaCalendar,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600'
    }
  ];

  const monthlyData = [
    { month: 'Jan', cargo: 12, revenue: 18000 },
    { month: 'Feb', cargo: 15, revenue: 22000 },
    { month: 'Mar', cargo: 18, revenue: 25000 },
    { month: 'Apr', cargo: 22, revenue: 32000 },
    { month: 'May', cargo: 24, revenue: 38000 },
    { month: 'Jun', cargo: 28, revenue: 45230 }
  ];

  if (loading) {
    return (
      <AdminPageLayout
        title="Analytics & Insights"
        description="Track performance metrics and business insights"
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading analytics...</span>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title="Analytics & Insights"
      description="Track performance metrics, revenue trends, and operational efficiency"
      actions={
        <div className="flex items-center gap-2">
          <button className="bg-white/10 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-white/20 transition-all duration-200 text-sm font-medium border border-white/20">
            <FaFilter className="w-3 h-3" />
            <span>Filter</span>
          </button>
          <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm text-sm font-medium">
            <FaDownload className="w-3 h-3" />
            <span>Export Report</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity" style={{
                background: stat.gradient === 'from-blue-500 to-blue-600' ? 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.05), transparent)' :
                  stat.gradient === 'from-green-500 to-green-600' ? 'linear-gradient(to bottom right, rgba(16, 185, 129, 0.05), transparent)' :
                    stat.gradient === 'from-yellow-500 to-orange-500' ? 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.05), transparent)' :
                      'linear-gradient(to bottom right, rgba(168, 85, 247, 0.05), transparent)'
              }}></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className={`bg-gradient-to-br ${stat.gradient} p-2.5 rounded-lg flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    {stat.changeType === 'positive' ? (
                      <FaArrowUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <FaArrowDown className="w-3 h-3 text-red-500" />
                    )}
                    <span className={`text-xs font-bold ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <h3 className="text-xs font-semibold text-gray-600 mb-1">{stat.title}</h3>
                <p className="text-2xl font-bold text-gray-900 mb-0.5">{stat.value}</p>
                <p className="text-[10px] text-gray-500">from last month</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cargo Growth Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">Cargo Growth</h3>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
              <FaChartLine className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="space-y-3">
            {monthlyData.map((data, index) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-gray-700 flex-shrink-0 w-10">{data.month}</span>
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 flex-1 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
                      style={{ width: `${(data.cargo / 30) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-10 text-right flex-shrink-0">{data.cargo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">Revenue Trend</h3>
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-lg">
              <FaDollarSign className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="space-y-3">
            {monthlyData.map((data, index) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-gray-700 flex-shrink-0 w-10">{data.month}</span>
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 flex-1 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
                      style={{ width: `${(data.revenue / 50000) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-14 text-right flex-shrink-0 whitespace-nowrap">${(data.revenue / 1000).toFixed(0)}k</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Routes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">Top Routes</h3>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-lg">
            <FaMapMarkedAlt className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 hover:shadow-sm transition-all">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg flex-shrink-0">
                <FaMapMarkedAlt className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900">Nairobi → Mombasa</p>
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  <FaTruck className="w-3 h-3" />
                  12 shipments this month
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right flex-shrink-0 ml-11 sm:ml-0">
              <p className="text-base font-bold text-green-600">$8,450</p>
              <p className="text-xs text-gray-500">Total revenue</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200 hover:shadow-sm transition-all">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-lg flex-shrink-0">
                <FaMapMarkedAlt className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900">Kisumu → Nairobi</p>
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  <FaTruck className="w-3 h-3" />
                  8 shipments this month
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right flex-shrink-0 ml-11 sm:ml-0">
              <p className="text-base font-bold text-green-600">$5,230</p>
              <p className="text-xs text-gray-500">Total revenue</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200 hover:shadow-sm transition-all">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-lg flex-shrink-0">
                <FaMapMarkedAlt className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900">Nakuru → Eldoret</p>
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  <FaTruck className="w-3 h-3" />
                  6 shipments this month
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right flex-shrink-0 ml-11 sm:ml-0">
              <p className="text-base font-bold text-green-600">$3,120</p>
              <p className="text-xs text-gray-500">Total revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-bold text-gray-900">Delivery Performance</h4>
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-lg">
              <FaCheckCircle className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">On-time delivery</span>
              <span className="text-base font-bold text-green-600 flex-shrink-0 ml-2">94%</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Average rating</span>
              <span className="text-base font-bold text-blue-600 flex-shrink-0 ml-2">4.8/5</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Customer satisfaction</span>
              <span className="text-base font-bold text-purple-600 flex-shrink-0 ml-2">96%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-bold text-gray-900">Cost Analysis</h4>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-lg">
              <FaDollarSign className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center p-2 bg-orange-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Fuel costs</span>
              <span className="text-base font-bold text-orange-600 flex-shrink-0 ml-2 whitespace-nowrap">$2,340</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-red-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Maintenance</span>
              <span className="text-base font-bold text-red-600 flex-shrink-0 ml-2 whitespace-nowrap">$1,120</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-yellow-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Insurance</span>
              <span className="text-base font-bold text-yellow-600 flex-shrink-0 ml-2 whitespace-nowrap">$890</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-bold text-gray-900">Efficiency Metrics</h4>
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-2 rounded-lg">
              <FaChartBar className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center p-2 bg-indigo-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Load utilization</span>
              <span className="text-base font-bold text-indigo-600 flex-shrink-0 ml-2">87%</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Route optimization</span>
              <span className="text-base font-bold text-blue-600 flex-shrink-0 ml-2">92%</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-teal-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Fuel efficiency</span>
              <span className="text-base font-bold text-teal-600 flex-shrink-0 ml-2 whitespace-nowrap">8.5 km/L</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </AdminPageLayout>
  );
};

export default Analytics; 