import React, { useState, useRef, useEffect } from 'react';
import { FaQuestionCircle, FaTimes, FaSearch, FaBook, FaVideo, FaComments, FaChevronRight } from 'react-icons/fa';

interface HelpCenterProps {
  onClose?: () => void;
  onRestartTour?: () => void;
}

export const HelpCenter: React.FC<HelpCenterProps> = ({ onClose, onRestartTour }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const helpCategories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: FaBook,
      articles: [
        { id: 'add-truck', title: 'How to Add Your First Truck', content: 'Step-by-step guide to registering a new truck in the system.' },
        { id: 'add-driver', title: 'How to Add Drivers', content: 'Learn how to register drivers and assign them to trucks.' },
        { id: 'upload-documents', title: 'Uploading Documents', content: 'Upload and manage truck documents like registration and insurance.' },
        { id: 'schedule-maintenance', title: 'Schedule Maintenance', content: 'Set up maintenance schedules and track service history.' },
      ]
    },
    {
      id: 'trucks',
      title: 'Truck Management',
      icon: FaBook,
      articles: [
        { id: 'edit-truck', title: 'Editing Truck Details', content: 'Update truck information, status, and specifications.' },
        { id: 'truck-records', title: 'Viewing Truck Records', content: 'Access complete truck history, documents, and maintenance records.' },
        { id: 'truck-status', title: 'Managing Truck Status', content: 'Change truck status (Available, In Transit, Maintenance, etc.).' },
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications & Alerts',
      icon: FaComments,
      articles: [
        { id: 'view-notifications', title: 'Viewing Notifications', content: 'Check your notifications for maintenance reminders, inspections, and insurance alerts.' },
        { id: 'notification-settings', title: 'Notification Settings', content: 'Configure how and when you receive notifications.' },
      ]
    },
    {
      id: 'analytics',
      title: 'Analytics & Reports',
      icon: FaBook,
      articles: [
        { id: 'view-analytics', title: 'Understanding Analytics', content: 'Learn how to read your fleet analytics and performance metrics.' },
        { id: 'generate-reports', title: 'Generating PDF Reports', content: 'Export comprehensive reports for your records.' },
      ]
    }
  ];

  const filteredCategories = helpCategories.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.articles.some(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-100 rounded-lg text-primary-600">
              <FaQuestionCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Help Center</h2>
              <p className="text-sm text-gray-500 mt-1">Find answers and learn how to use the platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <FaSearch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No help articles found for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredCategories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setActiveCategory(activeCategory === category.id ? null : category.id)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent className="text-primary-600" />
                        <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                        <span className="text-sm text-gray-500">({category.articles.length} articles)</span>
                      </div>
                      <FaChevronRight
                        className={`text-gray-400 transition-transform ${
                          activeCategory === category.id ? 'transform rotate-90' : ''
                        }`}
                      />
                    </button>

                    {activeCategory === category.id && (
                      <div className="border-t border-gray-200 bg-white">
                        {category.articles.map((article) => (
                          <div
                            key={article.id}
                            className="p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <h4 className="font-medium text-gray-900 mb-1">{article.title}</h4>
                            <p className="text-sm text-gray-600">{article.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Need more help? <a href="/dashboard/fleet/support" className="text-primary-600 hover:underline">Contact Support</a>
            </div>
            <div className="flex items-center gap-3">
              {onRestartTour && (
                <button
                  onClick={() => {
                    localStorage.removeItem('fleetOwnerOnboardingCompleted');
                    onRestartTour();
                    onClose?.();
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Restart Tour
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

