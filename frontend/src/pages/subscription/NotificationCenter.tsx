import React, { useState } from 'react';
import { FaBell, FaCog, FaHistory, FaChartBar } from 'react-icons/fa';
import CreditAlerts from '../../components/Notifications/CreditAlerts';
import NotificationPreferences from '../../components/Notifications/NotificationPreferences';

const NotificationCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'preferences' | 'history'>('alerts');

  const tabs = [
    {
      key: 'alerts',
      label: 'Alerts & Forecasts',
      icon: <FaBell />,
      description: 'View current alerts and usage forecasts',
    },
    {
      key: 'preferences',
      label: 'Preferences',
      icon: <FaCog />,
      description: 'Configure notification settings',
    },
    {
      key: 'history',
      label: 'History',
      icon: <FaHistory />,
      description: 'View notification history and statistics',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FaBell className="text-2xl text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Notification Center</h1>
          </div>
          <p className="text-gray-600">
            Manage your alerts, preferences, and stay informed about your account status
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Tab Description */}
          <div className="px-6 py-3 bg-gray-50">
            <p className="text-sm text-gray-600">
              {tabs.find(tab => tab.key === activeTab)?.description}
            </p>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'alerts' && <CreditAlerts />}
          {activeTab === 'preferences' && <NotificationPreferences />}
          {activeTab === 'history' && <NotificationHistory />}
        </div>
      </div>
    </div>
  );
};

// Placeholder component for notification history
const NotificationHistory: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="text-center py-12">
        <FaHistory className="mx-auto text-4xl text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Notification History</h3>
        <p className="text-gray-600">
          This feature will show your notification history and delivery statistics.
        </p>
        <p className="text-sm text-gray-500 mt-2">Coming soon...</p>
      </div>
    </div>
  );
};

export default NotificationCenter;