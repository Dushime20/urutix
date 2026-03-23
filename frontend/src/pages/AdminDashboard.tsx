import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaUsers, FaTruck, FaBox, FaRoute, FaBuilding, FaChartLine,
  FaCreditCard, FaHistory, FaShieldAlt, FaGavel, FaMoneyBillWave,
  FaHandshake, FaFileInvoiceDollar
} from 'react-icons/fa';
import { TranslatedText } from '../components/translated-text';
import { useAuth } from '../contexts/AuthContext';
import AdminPageLayout from '../components/Admin/AdminPageLayout';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const adminCards = [
    {
      title: 'Users',
      description: 'Manage platform users and permissions',
      icon: FaUsers,
      color: 'from-blue-500 to-blue-600',
      path: '/admin/users',
      stats: '1,284 users',
    },
    {
      title: 'Trucks',
      description: 'View and manage all trucks',
      icon: FaTruck,
      color: 'from-green-500 to-green-600',
      path: '/admin/trucks',
      stats: '428 trucks',
    },
    {
      title: 'Loads',
      description: 'Monitor cargo loads and shipments',
      icon: FaBox,
      color: 'from-orange-500 to-orange-600',
      path: '/admin/loads',
      stats: '876 loads',
    },
    {
      title: 'Routes',
      description: 'Manage delivery routes',
      icon: FaRoute,
      color: 'from-indigo-500 to-indigo-600',
      path: '/admin/routes',
      stats: '342 routes',
    },
    {
      title: 'Tenants',
      description: 'Manage tenant organizations',
      icon: FaBuilding,
      color: 'from-teal-500 to-teal-600',
      path: '/admin/tenants',
      stats: '12 tenants',
    },
    {
      title: 'Analytics',
      description: 'View platform analytics and reports',
      icon: FaChartLine,
      color: 'from-pink-500 to-pink-600',
      path: '/admin/analytics',
      stats: 'Real-time',
    },
  ];

  return (
    <AdminPageLayout
      title="Super Admin Dashboard"
      description="Manage all aspects of the Urutix platform"
    >
      <div className="space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">1,284</p>
                <p className="text-xs text-green-600 mt-1">↑ 12% this month</p>
              </div>
              <FaUsers className="text-4xl text-blue-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Trucks</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">428</p>
                <p className="text-xs text-green-600 mt-1">↑ 8% this month</p>
              </div>
              <FaTruck className="text-4xl text-green-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Loads</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">876</p>
                <p className="text-xs text-green-600 mt-1">↑ 15% this month</p>
              </div>
              <FaBox className="text-4xl text-orange-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">$45.2K</p>
                <p className="text-xs text-green-600 mt-1">↑ 23% this month</p>
              </div>
              <FaMoneyBillWave className="text-4xl text-yellow-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            <TranslatedText text="Management Sections" />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {adminCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={index}
                  onClick={() => navigate(card.path)}
                  className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer group overflow-hidden border-2 border-transparent hover:border-indigo-500"
                >
                  <div className={`h-2 bg-gradient-to-r ${card.color}`}></div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-4 bg-gradient-to-r ${card.color} rounded-xl group-hover:scale-110 transition-transform`}>
                        <Icon className="text-3xl text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                      <TranslatedText text={card.title} />
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      <TranslatedText text={card.description} />
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {card.stats}
                      </span>
                      <span className="text-indigo-600 group-hover:translate-x-2 transition-transform">
                        →
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity Preview */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              <TranslatedText text="Recent Activity" />
            </h3>
            <button
              onClick={() => navigate('/admin/activity-logs')}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-2"
            >
              View All <FaHistory />
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">New tenant registered: Acme Logistics</span>
              <span className="text-xs text-gray-500 ml-auto">2 min ago</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Subscription renewed: Beta Transport</span>
              <span className="text-xs text-gray-500 ml-auto">15 min ago</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Credits purchased: 5000 credits</span>
              <span className="text-xs text-gray-500 ml-auto">1 hour ago</span>
            </div>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default AdminDashboard;