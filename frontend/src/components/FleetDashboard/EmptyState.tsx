import React from 'react';
import { FaPlus, FaTruck, FaUsers, FaChartBar, FaFileAlt } from 'react-icons/fa';
import { TranslatedText } from '../translated-text';

interface EmptyStateProps {
  type: 'trucks' | 'drivers' | 'analytics' | 'documents' | 'maintenance' | 'inspections';
  onAction?: () => void;
  actionLabel?: string;
  title?: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  onAction,
  actionLabel,
  title,
  description
}) => {
  const configs = {
    trucks: {
      icon: FaTruck,
      defaultTitle: 'No Trucks Yet',
      defaultDescription: 'Get started by adding your first truck to the fleet. You can add trucks, manage their details, and track their status.',
      defaultActionLabel: 'Add Your First Truck',
      color: 'blue'
    },
    drivers: {
      icon: FaUsers,
      defaultTitle: 'No Drivers Yet',
      defaultDescription: 'Add drivers to your fleet to assign them to trucks and track their performance.',
      defaultActionLabel: 'Add Your First Driver',
      color: 'green'
    },
    analytics: {
      icon: FaChartBar,
      defaultTitle: 'No Analytics Data Yet',
      defaultDescription: 'Analytics will appear here once you start adding trucks and completing trips.',
      defaultActionLabel: 'Add Trucks to Get Started',
      color: 'purple'
    },
    documents: {
      icon: FaFileAlt,
      defaultTitle: 'No Documents Yet',
      defaultDescription: 'Upload important documents like registration, insurance, and inspection certificates.',
      defaultActionLabel: 'Upload Document',
      color: 'blue'
    },
    maintenance: {
      icon: FaTruck,
      defaultTitle: 'No Maintenance Records',
      defaultDescription: 'Schedule maintenance to keep your trucks in optimal condition and avoid unexpected breakdowns.',
      defaultActionLabel: 'Schedule Maintenance',
      color: 'orange'
    },
    inspections: {
      icon: FaFileAlt,
      defaultTitle: 'No Inspection Records',
      defaultDescription: 'Schedule inspections to ensure compliance and maintain safety standards.',
      defaultActionLabel: 'Schedule Inspection',
      color: 'yellow'
    }
  };
  
  // Helper to translate text
  const translate = (text: string) => text;

  const config = configs[type];
  const IconComponent = config.icon;

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    yellow: 'bg-yellow-100 text-yellow-600'
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className={`p-6 rounded-full ${colorClasses[config.color as keyof typeof colorClasses]} mb-4`}>
        <IconComponent className="w-12 h-12" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        <TranslatedText text={title || config.defaultTitle} />
      </h3>
      <p className="text-gray-600 text-center max-w-md mb-6">
        <TranslatedText text={description || config.defaultDescription} />
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 font-medium shadow-lg"
        >
          <FaPlus className="w-4 h-4" />
          <TranslatedText text={actionLabel || config.defaultActionLabel} />
        </button>
      )}
    </div>
  );
};

