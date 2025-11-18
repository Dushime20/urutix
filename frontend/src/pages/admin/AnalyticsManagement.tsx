import React, { useState, useEffect } from 'react';
import { 
  FaChartLine, FaUsers, FaTruck, FaBox, FaDollarSign,
  FaExclamationTriangle, FaCheckCircle, FaClock, FaMapMarkerAlt,
  FaThermometerHalf, FaShieldAlt, FaRoute, FaCalendarAlt
} from 'react-icons/fa';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
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
  RadialLinearScale,
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
  ArcElement,
  RadialLinearScale
);

const AnalyticsManagement: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [isRealTime, setIsRealTime] = useState(false);

  // Real-time data simulation
  useEffect(() => {
    if (isRealTime) {
      const interval = setInterval(() => {
        // Simulate real-time updates
        console.log('Updating real-time data...');
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isRealTime]);

  // Enhanced chart data
  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
    datasets: [
      {
        label: 'Revenue',
        data: [12000, 19000, 15000, 25000, 22000, 30000, 28000, 32000],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Profit',
        data: [8000, 12000, 10000, 18000, 15000, 22000, 20000, 24000],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
      }
    ]
  };

  const userGrowthData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
    datasets: [
      {
        label: 'New Users',
        data: [45, 52, 38, 65, 58, 72, 68, 85],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: 4,
      },
      {
        label: 'Active Users',
        data: [120, 135, 128, 145, 138, 152, 148, 165],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderRadius: 4,
      }
    ]
  };

  const performanceMetrics = {
    labels: ['Load Matching', 'Driver Efficiency', 'Route Optimization', 'Customer Satisfaction', 'Safety Score', 'Financial Performance'],
    datasets: [
      {
        label: 'Current Performance',
        data: [85, 78, 92, 88, 95, 82],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(59, 130, 246)'
      },
      {
        label: 'Target Performance',
        data: [90, 85, 95, 90, 98, 88],
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(34, 197, 94)'
      }
    ]
  };

  const loadDistributionData = {
    labels: ['Electronics', 'Medical', 'Food', 'Chemicals', 'Construction', 'Other'],
    datasets: [{
      data: [25, 18, 22, 15, 12, 8],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(107, 114, 128, 0.8)',
      ],
      borderWidth: 2,
      borderColor: '#fff',
    }]
  };

  const kpiCards = [
    {
      title: 'Total Revenue',
      value: '$245,000',
      change: '+15.3%',
      changeType: 'positive',
      icon: FaDollarSign,
      color: 'from-green-500 to-green-600',
      description: 'vs last month'
    },
    {
      title: 'Active Users',
      value: '2,847',
      change: '+8.2%',
      changeType: 'positive',
      icon: FaUsers,
      color: 'from-blue-500 to-blue-600',
      description: 'vs last month'
    },
    {
      title: 'Load Success Rate',
      value: '94.2%',
      change: '+2.1%',
      changeType: 'positive',
      icon: FaBox,
      color: 'from-purple-500 to-purple-600',
      description: 'vs last month'
    },
    {
      title: 'Fleet Utilization',
      value: '87.5%',
      change: '+5.7%',
      changeType: 'positive',
      icon: FaTruck,
      color: 'from-orange-500 to-orange-600',
      description: 'vs last month'
    }
  ];

  const alertMetrics = [
    { type: 'critical', count: 3, label: 'Critical Issues', icon: FaExclamationTriangle, color: 'text-red-600' },
    { type: 'warning', count: 12, label: 'Warnings', icon: FaClock, color: 'text-yellow-600' },
    { type: 'success', count: 156, label: 'Resolved', icon: FaCheckCircle, color: 'text-green-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Analytics & Insights</h2>
          <p className="text-gray-600">Comprehensive platform analytics and performance metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <button
            onClick={() => setIsRealTime(!isRealTime)}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
              isRealTime 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            <FaChartLine />
            <span>{isRealTime ? 'Live' : 'Real-time'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`text-sm font-medium ${
                    card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {card.change}
                  </span>
                  <span className="text-sm text-gray-500">{card.description}</span>
                </div>
              </div>
              <div className={`p-3 rounded-full bg-gradient-to-r ${card.color}`}>
                <card.icon className="text-white text-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alert Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {alertMetrics.map((alert, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full bg-gray-100`}>
                <alert.icon className={`text-2xl ${alert.color}`} />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{alert.count}</p>
                <p className="text-sm text-gray-600">{alert.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & Profit Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue & Profit Trends</h3>
          <Line 
            data={revenueData} 
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                title: { display: false }
              },
              scales: {
                y: { beginAtZero: true }
              }
            }}
          />
        </div>

        {/* User Growth Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">User Growth</h3>
          <Bar 
            data={userGrowthData} 
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                title: { display: false }
              },
              scales: {
                y: { beginAtZero: true }
              }
            }}
          />
        </div>

        {/* Performance Radar Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Metrics</h3>
          <Radar 
            data={performanceMetrics} 
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                title: { display: false }
              },
              scales: {
                r: { 
                  beginAtZero: true,
                  max: 100,
                  ticks: { stepSize: 20 }
                }
              }
            }}
          />
        </div>

        {/* Load Distribution Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Load Type Distribution</h3>
          <Doughnut 
            data={loadDistributionData} 
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'bottom' },
                title: { display: false }
              }
            }}
          />
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Geographic Distribution</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FaMapMarkerAlt className="text-blue-600" />
                <span>Kigali Region</span>
              </div>
              <span className="font-semibold">42%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FaMapMarkerAlt className="text-green-600" />
                <span>Southern Province</span>
              </div>
              <span className="font-semibold">28%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FaMapMarkerAlt className="text-purple-600" />
                <span>Western Province</span>
              </div>
              <span className="font-semibold">18%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FaMapMarkerAlt className="text-orange-600" />
                <span>Other Regions</span>
              </div>
              <span className="font-semibold">12%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Response Time</span>
              <span className="text-sm font-medium text-green-600">45ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database Performance</span>
              <span className="text-sm font-medium text-green-600">98%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Uptime</span>
              <span className="text-sm font-medium text-green-600">99.9%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Sessions</span>
              <span className="text-sm font-medium text-blue-600">1,247</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsManagement;
