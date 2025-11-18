import React, { useState } from 'react';
import { 
  FaDollarSign, FaChartLine, FaReceipt, FaTruck, FaFileAlt, FaHome,
  FaChartBar, FaCalculator, FaDownload, FaPrint
} from 'react-icons/fa';
import TruckOwnerFinancialDashboard from './TruckOwnerFinancialDashboard';
import ExpenseManagement from '../components/FinancialManagement/ExpenseManagement';
import RevenueTracking from '../components/FinancialManagement/RevenueTracking';
import FinancialReports from '../components/FinancialManagement/FinancialReports';

type TabType = 'dashboard' | 'expenses' | 'revenue' | 'reports';

const TruckOwnerFinancialManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const tabs = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard',
      icon: FaHome,
      description: 'Financial overview and key metrics'
    },
    {
      id: 'expenses' as TabType,
      label: 'Expenses',
      icon: FaReceipt,
      description: 'Track and manage business expenses'
    },
    {
      id: 'revenue' as TabType,
      label: 'Revenue',
      icon: FaTruck,
      description: 'Monitor trip revenue and payments'
    },
    {
      id: 'reports' as TabType,
      label: 'Reports',
      icon: FaFileAlt,
      description: 'Generate financial reports and analysis'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <TruckOwnerFinancialDashboard />;
      case 'expenses':
        return <ExpenseManagement />;
      case 'revenue':
        return <RevenueTracking />;
      case 'reports':
        return <FinancialReports />;
      default:
        return <TruckOwnerFinancialDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FaDollarSign className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900">Financial Management</h1>
                <p className="text-sm text-gray-500">Manage your trucking business finances</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                <FaDownload className="w-4 h-4" />
                <span>Export Data</span>
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2">
                <FaCalculator className="w-4 h-4" />
                <span>Quick Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {renderTabContent()}
      </div>

      {/* Quick Actions Floating Button */}
      <div className="fixed bottom-6 right-6">
        <div className="relative group">
          <button className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center">
            <FaChartBar className="w-6 h-6" />
          </button>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            Financial Tools
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-6">
              <span className="flex items-center space-x-2">
                <FaDollarSign className="w-4 h-4 text-green-600" />
                <span>Total Revenue: <span className="font-semibold text-gray-900">$47,500</span></span>
              </span>
              <span className="flex items-center space-x-2">
                <FaReceipt className="w-4 h-4 text-red-600" />
                <span>Total Expenses: <span className="font-semibold text-gray-900">$38,700</span></span>
              </span>
              <span className="flex items-center space-x-2">
                <FaChartLine className="w-4 h-4 text-blue-600" />
                <span>Net Profit: <span className="font-semibold text-gray-900">$8,800</span></span>
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                <FaPrint className="w-3 h-3" />
                <span>Print Summary</span>
              </button>
              <button className="text-green-600 hover:text-green-800 flex items-center space-x-1">
                <FaDownload className="w-3 h-3" />
                <span>Export Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TruckOwnerFinancialManagement;
