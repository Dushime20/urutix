import React from 'react';
import { FaTools, FaTruck, FaCog, FaClock } from 'react-icons/fa';

interface LoadingEquipmentStepProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
}

export const LoadingEquipmentStep: React.FC<LoadingEquipmentStepProps> = ({
  formData,
  handleInputChange,
}) => {
  const handleEquipmentToggle = (equipment: string) => {
    // Use dot notation to update nested loadingCapabilities object
    const currentValue = formData.loadingCapabilities?.[equipment] || false;
    const newValue = !currentValue;
    handleInputChange(`loadingCapabilities.${equipment}`, newValue);
  };

  const handleTimeChange = (field: string, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    // Use dot notation to update nested loadingCapabilities object
    handleInputChange(`loadingCapabilities.${field}`, numValue);
  };

  const equipmentOptions = [
    { key: 'hasForklift', label: 'Forklift', icon: '🔧', description: 'On-board forklift for loading/unloading' },
    { key: 'hasCrane', label: 'Crane', icon: '🏗️', description: 'Hydraulic crane for heavy lifting' },
    { key: 'hasLoadingDock', label: 'Loading Dock', icon: '🚪', description: 'Dock-level loading capability' },
    { key: 'hasSideLift', label: 'Side Lift', icon: '⬆️', description: 'Side-mounted hydraulic lift' },
    { key: 'hasTailLift', label: 'Tail Lift', icon: '⬇️', description: 'Rear-mounted hydraulic lift' },
    { key: 'hasRollerBed', label: 'Roller Bed', icon: '📦', description: 'Roller bed for easy cargo movement' },
    { key: 'hasDropDeck', label: 'Drop Deck', icon: '📉', description: 'Lowerable deck for oversized cargo' },
    { key: 'hasExtendable', label: 'Extendable', icon: '📏', description: 'Extendable trailer length' },
    { key: 'hasLowbed', label: 'Lowbed', icon: '📐', description: 'Low-profile bed for heavy equipment' },
    { key: 'hasStepDeck', label: 'Step Deck', icon: '📋', description: 'Multi-level deck configuration' },
    { key: 'hasPowerOnly', label: 'Power Only', icon: '🔌', description: 'Tractor only, no trailer' },
    { key: 'hasContainerChassis', label: 'Container Chassis', icon: '📦', description: 'Container transport capability' },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <FaTools className="w-5 h-5 text-primary-600" />
          Loading Equipment Configuration
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Configure the loading and unloading equipment available on this truck.
        </p>
      </div>

      {/* Equipment Selection */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Available Equipment
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {equipmentOptions.map(({ key, label, icon, description }) => (
              <div key={key} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.loadingCapabilities?.[key] || false}
                    onChange={() => handleEquipmentToggle(key)}
                    className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{icon}</span>
                      <span className="font-medium text-gray-900">{label}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{description}</p>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Loading/Unloading Time Estimates */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FaClock className="w-4 h-4 text-gray-500" />
            <label className="block text-sm font-medium text-gray-700">
              Loading/Unloading Time Estimates
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Max Loading Time (minutes)</label>
              <input
                type="number"
                value={formData.loadingCapabilities?.maxLoadingTime || ''}
                onChange={(e) => handleTimeChange('maxLoadingTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="30"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Max Unloading Time (minutes)</label>
              <input
                type="number"
                value={formData.loadingCapabilities?.maxUnloadingTime || ''}
                onChange={(e) => handleTimeChange('maxUnloadingTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="30"
              />
            </div>
          </div>
        </div>

        {/* Equipment Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Selected Equipment Summary</h4>
          <div className="flex flex-wrap gap-2">
            {equipmentOptions
              .filter(({ key }) => formData.loadingCapabilities?.[key])
              .map(({ key, label, icon }) => (
                <span key={key} className="px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full flex items-center gap-1">
                  <span>{icon}</span>
                  {label}
                </span>
              ))}
            {equipmentOptions.filter(({ key }) => formData.loadingCapabilities?.[key]).length === 0 && (
              <span className="text-gray-500 text-sm">No equipment selected</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
