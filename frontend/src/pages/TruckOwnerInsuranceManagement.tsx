import React, { useState } from 'react';
import { FaShieldAlt, FaFileContract, FaExclamationTriangle, FaCalendarAlt, FaPlus, FaDownload, FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import InsuranceDashboard from '../components/InsuranceManagement/InsuranceDashboard';
import PolicyManagement from '../components/InsuranceManagement/PolicyManagement';
import ClaimsManagement from '../components/InsuranceManagement/ClaimsManagement';
import RenewalManagement from '../components/InsuranceManagement/RenewalManagement';

const TruckOwnerInsuranceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: FaShieldAlt },
    { id: 'policies', label: 'Policies', icon: FaFileContract },
    { id: 'claims', label: 'Claims', icon: FaExclamationTriangle },
    { id: 'renewals', label: 'Renewals', icon: FaCalendarAlt },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <InsuranceDashboard />;
      case 'policies':
        return <PolicyManagement />;
      case 'claims':
        return <ClaimsManagement />;
      case 'renewals':
        return <RenewalManagement />;
      default:
        return <InsuranceDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Insurance Management</h1>
              <p className="text-sm text-gray-600">Manage your truck insurance policies, claims, and renewals</p>
            </div>
            <div className="flex space-x-3">
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <FaPlus className="mr-2" />
                New Policy
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <FaDownload className="mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaShieldAlt className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Active Policies</p>
                <p className="text-lg font-semibold text-gray-900">12</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Open Claims</p>
                <p className="text-lg font-semibold text-gray-900">3</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaCalendarAlt className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Due Renewals</p>
                <p className="text-lg font-semibold text-gray-900">2</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaFileContract className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Coverage</p>
                <p className="text-lg font-semibold text-gray-900">$2.5M</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="inline-block mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default TruckOwnerInsuranceManagement;
