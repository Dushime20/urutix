import React, { useState, useEffect } from 'react';
import { FaChartBar, FaTruck, FaBox, FaDollarSign, FaMapMarkedAlt, FaCalendar } from 'react-icons/fa';

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
      color: 'blue'
    },
    {
      title: 'Active Shipments',
      value: '8',
      change: '+3%',
      changeType: 'positive',
      icon: FaTruck,
      color: 'green'
    },
    {
      title: 'Total Revenue',
      value: '$45,230',
      change: '+8%',
      changeType: 'positive',
      icon: FaDollarSign,
      color: 'yellow'
    },
    {
      title: 'Avg Delivery Time',
      value: '3.2 days',
      change: '-0.5 days',
      changeType: 'positive',
      icon: FaCalendar,
      color: 'purple'
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
      <div className="flex items-center justify-center h-48 sm:h-64">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 sm:p-3 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="bg-gray-50 p-1.5 rounded-md flex-shrink-0">
                  <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
                </div>
              </div>
              <h3 className="text-xs font-medium text-gray-500 mb-0.5 break-words">{stat.title}</h3>
              <p className="text-base sm:text-lg font-bold text-gray-900 mb-0.5 truncate">{stat.value}</p>
              <div className="flex items-center gap-1 flex-wrap">
                <span className={`text-[10px] font-medium ${
                  stat.changeType === 'positive' ? 'text-gray-600' : 'text-gray-500'
                }`}>
                  {stat.change}
                </span>
                <span className="text-[10px] text-gray-500">from last month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
        {/* Cargo Growth Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 sm:p-3">
          <h3 className="text-xs font-semibold text-gray-900 mb-2 sm:mb-3">Cargo Growth</h3>
          <div className="space-y-1.5 sm:space-y-2">
            {monthlyData.map((data, index) => (
              <div key={index} className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-600 flex-shrink-0 w-8 sm:w-auto">{data.month}</span>
                <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0 flex-1">
                  <div className="w-full sm:w-24 bg-gray-200 rounded-full h-1.5 flex-1 sm:flex-initial">
                    <div 
                      className="bg-gray-400 h-1.5 rounded-full" 
                      style={{ width: `${(data.cargo / 30) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-gray-900 w-8 sm:w-8 text-right flex-shrink-0">{data.cargo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 sm:p-3">
          <h3 className="text-xs font-semibold text-gray-900 mb-2 sm:mb-3">Revenue Trend</h3>
          <div className="space-y-1.5 sm:space-y-2">
            {monthlyData.map((data, index) => (
              <div key={index} className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-600 flex-shrink-0 w-8 sm:w-auto">{data.month}</span>
                <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0 flex-1">
                  <div className="w-full sm:w-24 bg-gray-200 rounded-full h-1.5 flex-1 sm:flex-initial">
                    <div 
                      className="bg-gray-500 h-1.5 rounded-full" 
                      style={{ width: `${(data.revenue / 50000) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-gray-900 w-12 sm:w-16 text-right flex-shrink-0 whitespace-nowrap">${(data.revenue / 1000).toFixed(0)}k</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Routes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 sm:p-3">
        <h3 className="text-xs font-semibold text-gray-900 mb-2 sm:mb-3">Top Routes</h3>
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-2 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <FaMapMarkedAlt className="w-3 h-3 text-gray-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-900 break-words">Nairobi → Mombasa</p>
                <p className="text-[10px] text-gray-500">12 shipments this month</p>
              </div>
            </div>
            <div className="text-left sm:text-right flex-shrink-0 ml-5 sm:ml-0">
              <p className="text-xs font-medium text-gray-900">$8,450</p>
              <p className="text-[10px] text-gray-500">Total revenue</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-2 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <FaMapMarkedAlt className="w-3 h-3 text-gray-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-900 break-words">Kisumu → Nairobi</p>
                <p className="text-[10px] text-gray-500">8 shipments this month</p>
              </div>
            </div>
            <div className="text-left sm:text-right flex-shrink-0 ml-5 sm:ml-0">
              <p className="text-xs font-medium text-gray-900">$5,230</p>
              <p className="text-[10px] text-gray-500">Total revenue</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-2 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <FaMapMarkedAlt className="w-3 h-3 text-gray-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-900 break-words">Nakuru → Eldoret</p>
                <p className="text-[10px] text-gray-500">6 shipments this month</p>
              </div>
            </div>
            <div className="text-left sm:text-right flex-shrink-0 ml-5 sm:ml-0">
              <p className="text-xs font-medium text-gray-900">$3,120</p>
              <p className="text-[10px] text-gray-500">Total revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 sm:p-3">
          <h4 className="text-xs font-semibold text-gray-900 mb-2 sm:mb-3">Delivery Performance</h4>
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 break-words">On-time delivery</span>
              <span className="text-xs font-medium text-gray-900 flex-shrink-0 ml-2">94%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 break-words">Average rating</span>
              <span className="text-xs font-medium text-gray-900 flex-shrink-0 ml-2">4.8/5</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 break-words">Customer satisfaction</span>
              <span className="text-xs font-medium text-gray-900 flex-shrink-0 ml-2">96%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 sm:p-3">
          <h4 className="text-xs font-semibold text-gray-900 mb-2 sm:mb-3">Cost Analysis</h4>
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 break-words">Fuel costs</span>
              <span className="text-xs font-medium text-gray-900 flex-shrink-0 ml-2 whitespace-nowrap">$2,340</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 break-words">Maintenance</span>
              <span className="text-xs font-medium text-gray-900 flex-shrink-0 ml-2 whitespace-nowrap">$1,120</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 break-words">Insurance</span>
              <span className="text-xs font-medium text-gray-900 flex-shrink-0 ml-2 whitespace-nowrap">$890</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 sm:p-3">
          <h4 className="text-xs font-semibold text-gray-900 mb-2 sm:mb-3">Efficiency Metrics</h4>
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 break-words">Load utilization</span>
              <span className="text-xs font-medium text-gray-900 flex-shrink-0 ml-2">87%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 break-words">Route optimization</span>
              <span className="text-xs font-medium text-gray-900 flex-shrink-0 ml-2">92%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 break-words">Fuel efficiency</span>
              <span className="text-xs font-medium text-gray-900 flex-shrink-0 ml-2 whitespace-nowrap">8.5 km/L</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 