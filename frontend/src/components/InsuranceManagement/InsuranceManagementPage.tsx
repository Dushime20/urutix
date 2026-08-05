import React, { useState } from 'react';
import { 
  FaShieldAlt, 
  FaFileAlt, 
  FaExclamationTriangle, 
  FaCalendarAlt, 
  FaChartBar, 
  FaSearch, 
  FaCog,
  FaTruck,
  FaDollarSign,
  FaBell
} from 'react-icons/fa';
import InsuranceDashboard from './InsuranceDashboard';
import PolicyManagement from './PolicyManagement';
import ClaimsManagement from './ClaimsManagement';
import RenewalManagement from './RenewalManagement';
import InsuranceReports from './InsuranceReports';
import CoverageAnalysis from './CoverageAnalysis';
import InsuranceSettings from './InsuranceSettings';

const InsuranceManagementPage: React.FC = () => {
  const [activeComponent, setActiveComponent] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  const navigationItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: FaShieldAlt,
      description: 'Overview and key metrics',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'policies',
      name: 'Policies',
      icon: FaFileAlt,
      description: 'Manage insurance policies',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'claims',
      name: 'Claims',
      icon: FaExclamationTriangle,
      description: 'Track and manage claims',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      id: 'renewals',
      name: 'Renewals',
      icon: FaCalendarAlt,
      description: 'Monitor policy renewals',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'reports',
      name: 'Reports',
      icon: FaChartBar,
      description: 'Analytics and reporting',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      id: 'coverage',
      name: 'Coverage Analysis',
      icon: FaSearch,
      description: 'Analyze coverage gaps',
      color: 'from-red-500 to-red-600'
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: FaCog,
      description: 'System configuration',
      color: 'from-gray-500 to-gray-600'
    }
  ];

  const quickStats = [
    {
      label: 'Active Policies',
      value: '24',
      icon: FaFileAlt,
      color: 'text-green-600',
      change: '+2',
      changeType: 'positive'
    },
    {
      label: 'Open Claims',
      value: '8',
      icon: FaExclamationTriangle,
      color: 'text-yellow-600',
      change: '-1',
      changeType: 'negative'
    },
    {
      label: 'Renewals Due',
      value: '5',
      icon: FaCalendarAlt,
      color: 'text-red-600',
      change: '+3',
      changeType: 'positive'
    },
    {
      label: 'Monthly Premium',
      value: '$12,450',
      icon: FaDollarSign,
      color: 'text-blue-600',
      change: '+$450',
      changeType: 'positive'
    }
  ];

  const recentAlerts = [
    {
      id: 1,
      type: 'renewal',
      message: 'Policy #INS-2024-005 expires in 7 days',
      priority: 'high',
      time: '2 hours ago'
    },
    {
      id: 2,
      type: 'claim',
      message: 'New claim submitted for Policy #INS-2024-003',
      priority: 'medium',
      time: '1 day ago'
    },
    {
      id: 3,
      type: 'coverage',
      message: 'Coverage gap detected for Truck TRK-002',
      priority: 'high',
      time: '2 days ago'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🔵';
      default:
        return '⚪';
    }
  };

  const renderActiveComponent = () => {
    switch (activeComponent) {
      case 'dashboard':
        return <InsuranceDashboard />;
      case 'policies':
        return <PolicyManagement />;
      case 'claims':
        return <ClaimsManagement />;
      case 'renewals':
        return <RenewalManagement />;
      case 'reports':
        return <InsuranceReports />;
      case 'coverage':
        return <CoverageAnalysis />;
      case 'settings':
        return <InsuranceSettings />;
      default:
        return <InsuranceDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Insurance Management</h1>
              <p className="text-gray-600 dark:text-slate-300">Comprehensive insurance management system</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search insurance..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <button className="relative p-2 text-gray-400 hover:text-gray-500">
                <FaBell className="h-6 w-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Navigation</h2>
              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeComponent === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveComponent(item.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r ' + item.color + ' text-white shadow-md transform scale-105'
                          : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className={`text-sm ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                            {item.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h2>
              <div className="space-y-4">
                {quickStats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                        <span className="text-sm text-gray-600 dark:text-slate-300">{stat.label}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 dark:text-white">{stat.value}</div>
                        <div className={`text-xs ${
                          stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stat.change}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Alerts</h2>
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${getPriorityColor(alert.priority)}`}
                  >
                    <div className="flex items-start space-x-2">
                      <span className="text-sm">{getPriorityIcon(alert.priority)}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className="text-xs opacity-75">{alert.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
                View All Alerts →
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border">
              {renderActiveComponent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsuranceManagementPage;
