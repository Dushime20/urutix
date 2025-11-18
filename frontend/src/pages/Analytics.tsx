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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">Track your cargo performance and insights</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                  <IconComponent className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
              <div className="mt-4">
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-1">from last month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cargo Growth Chart */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cargo Growth</h3>
          <div className="space-y-3">
            {monthlyData.map((data, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{data.month}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full" 
                      style={{ width: `${(data.cargo / 30) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{data.cargo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <div className="space-y-3">
            {monthlyData.map((data, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{data.month}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(data.revenue / 50000) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">${data.revenue.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Routes */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Routes</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <FaMapMarkedAlt className="text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">Nairobi → Mombasa</p>
                <p className="text-sm text-gray-600">12 shipments this month</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">$8,450</p>
              <p className="text-sm text-gray-600">Total revenue</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <FaMapMarkedAlt className="text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">Kisumu → Nairobi</p>
                <p className="text-sm text-gray-600">8 shipments this month</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">$5,230</p>
              <p className="text-sm text-gray-600">Total revenue</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <FaMapMarkedAlt className="text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">Nakuru → Eldoret</p>
                <p className="text-sm text-gray-600">6 shipments this month</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">$3,120</p>
              <p className="text-sm text-gray-600">Total revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Delivery Performance</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">On-time delivery</span>
              <span className="text-sm font-medium text-gray-900">94%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Average rating</span>
              <span className="text-sm font-medium text-gray-900">4.8/5</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Customer satisfaction</span>
              <span className="text-sm font-medium text-gray-900">96%</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Cost Analysis</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Fuel costs</span>
              <span className="text-sm font-medium text-gray-900">$2,340</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Maintenance</span>
              <span className="text-sm font-medium text-gray-900">$1,120</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Insurance</span>
              <span className="text-sm font-medium text-gray-900">$890</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Efficiency Metrics</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Load utilization</span>
              <span className="text-sm font-medium text-gray-900">87%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Route optimization</span>
              <span className="text-sm font-medium text-gray-900">92%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Fuel efficiency</span>
              <span className="text-sm font-medium text-gray-900">8.5 km/L</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 