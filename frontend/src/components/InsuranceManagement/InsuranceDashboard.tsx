import React from 'react';
import { FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaClock, FaDollarSign, FaTruck, FaPlus, FaDownload } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const InsuranceDashboard: React.FC = () => {
  // Mock data for charts
  const premiumData = [
    { month: 'Jan', premium: 4500, claims: 1200 },
    { month: 'Feb', premium: 4800, claims: 800 },
    { month: 'Mar', premium: 5200, claims: 1500 },
    { month: 'Apr', premium: 4900, claims: 900 },
    { month: 'May', premium: 5100, claims: 1100 },
    { month: 'Jun', premium: 5400, claims: 1300 },
  ];

  const coverageData = [
    { name: 'Liability', value: 40, color: '#3B82F6' },
    { name: 'Collision', value: 25, color: '#10B981' },
    { name: 'Comprehensive', value: 20, color: '#F59E0B' },
    { name: 'Cargo', value: 15, color: '#8B5CF6' },
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'policy_renewed',
      message: 'Policy #INS-2024-001 renewed successfully',
      time: '2 hours ago',
      status: 'success',
      icon: FaCheckCircle,
    },
    {
      id: 2,
      type: 'claim_submitted',
      message: 'New claim submitted for Policy #INS-2024-003',
      time: '1 day ago',
      status: 'warning',
      icon: FaExclamationTriangle,
    },
    {
      id: 3,
      type: 'renewal_reminder',
      message: 'Policy #INS-2024-005 expires in 30 days',
      time: '2 days ago',
      status: 'info',
      icon: FaClock,
    },
    {
      id: 4,
      type: 'coverage_updated',
      message: 'Coverage limits updated for Policy #INS-2024-002',
      time: '3 days ago',
      status: 'success',
      icon: FaShieldAlt,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'info':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="p-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center">
            <FaShieldAlt className="h-8 w-8 text-blue-200" />
            <div className="ml-4">
              <p className="text-blue-200 text-sm">Total Coverage</p>
              <p className="text-2xl font-bold">$2,500,000</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center">
            <FaDollarSign className="h-8 w-8 text-green-200" />
            <div className="ml-4">
              <p className="text-green-200 text-sm">Monthly Premium</p>
              <p className="text-2xl font-bold">$5,400</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
          <div className="flex items-center">
            <FaExclamationTriangle className="h-8 w-8 text-yellow-200" />
            <div className="ml-4">
              <p className="text-yellow-200 text-sm">Open Claims</p>
              <p className="text-2xl font-bold">3</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center">
            <FaTruck className="h-8 w-8 text-purple-200" />
            <div className="ml-4">
              <p className="text-purple-200 text-sm">Insured Trucks</p>
              <p className="text-2xl font-bold">8</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Premium vs Claims Chart */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Premium vs Claims Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={premiumData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="premium" stroke="#3B82F6" strokeWidth={2} name="Premium" />
              <Line type="monotone" dataKey="claims" stroke="#EF4444" strokeWidth={2} name="Claims" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Coverage Distribution Chart */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Coverage Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={coverageData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {coverageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
        <div className="space-y-4">
          {recentActivities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className={`p-2 rounded-full ${getStatusColor(activity.status)}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
                <div className="text-xs text-gray-400">
                  {activity.type.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors">
          <FaPlus className="h-6 w-6 text-gray-400 mr-2" />
          <span className="text-gray-600">Add New Policy</span>
        </button>
        <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors">
          <FaExclamationTriangle className="h-6 w-6 text-gray-400 mr-2" />
          <span className="text-gray-600">File New Claim</span>
        </button>
        <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors">
          <FaDownload className="h-6 w-6 text-gray-400 mr-2" />
          <span className="text-gray-600">Download Report</span>
        </button>
      </div>
    </div>
  );
};

export default InsuranceDashboard;
