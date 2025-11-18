import React from 'react';
import { FaRuler, FaWeight, FaGasPump, FaCog } from 'react-icons/fa';

interface SpecificationsStepProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
}

export const SpecificationsStep: React.FC<SpecificationsStepProps> = ({
  formData,
  handleInputChange,
}) => {
  const fuelTypes = [
    'DIESEL',
    'GASOLINE',
    'ELECTRIC',
    'HYBRID',
    'NATURAL_GAS',
    'BIODIESEL',
  ];

  const truckTypes = [
    'FLATBED',
    'BOX_TRUCK',
    'REEFER',
    'TANKER',
    'CONTAINER',
    'LOWBOY',
    'STEP_DECK',
    'POWER_ONLY',
    'CAR_CARRIER',
    'DUMP_TRUCK',
  ];

  const trailerTypes = [
    'FLATBED',
    'BOX',
    'REEFER',
    'TANKER',
    'CONTAINER',
    'LOWBOY',
    'STEP_DECK',
    'POWER_ONLY',
    'CAR_CARRIER',
    'DUMP',
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-2">
          <FaCog className="w-5 h-5 mr-2 text-primary-600" />
          Technical Specifications
        </h3>
        <p className="text-sm text-gray-600">
          Configure the technical specifications and capabilities of the vehicle.
        </p>
      </div>

      {/* Vehicle Type */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Truck Type
            </label>
            <select
              value={formData.truckType || ''}
              onChange={(e) => handleInputChange('truckType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select Truck Type</option>
              {truckTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trailer Type
            </label>
            <select
              value={formData.trailerType || ''}
              onChange={(e) => handleInputChange('trailerType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select Trailer Type</option>
              {trailerTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Capacity Specifications */}
      <div className="space-y-4">
        <h4 className="text-base font-medium text-gray-800 flex items-center mb-4">
          <FaWeight className="w-5 h-5 mr-2 text-primary-600" />
          Capacity Specifications
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight Capacity (kg)
            </label>
            <input
              type="number"
              value={formData.capacityWeight || ''}
              onChange={(e) => handleInputChange('capacityWeight', e.target.value)}
              placeholder="e.g., 20000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Volume Capacity (m³)
            </label>
            <input
              type="number"
              value={formData.capacityVolume || ''}
              onChange={(e) => handleInputChange('capacityVolume', e.target.value)}
              placeholder="e.g., 100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Dimensional Specifications */}
      <div className="space-y-4">
        <h4 className="text-base font-medium text-gray-800 flex items-center mb-4">
          <FaRuler className="w-5 h-5 mr-2 text-primary-600" />
          Dimensional Specifications
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Length (m)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.maxLength || ''}
              onChange={(e) => handleInputChange('maxLength', e.target.value)}
              placeholder="e.g., 16.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Width (m)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.maxWidth || ''}
              onChange={(e) => handleInputChange('maxWidth', e.target.value)}
              placeholder="e.g., 2.6"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Height (m)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.maxHeight || ''}
              onChange={(e) => handleInputChange('maxHeight', e.target.value)}
              placeholder="e.g., 4.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Additional Specifications */}
      <div className="space-y-4">
        <h4 className="text-base font-medium text-gray-800 mb-4">
          Additional Specifications
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mileage (km)
            </label>
            <input
              type="number"
              value={formData.mileage || ''}
              onChange={(e) => handleInputChange('mileage', e.target.value)}
              placeholder="e.g., 150000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fuel Efficiency (L/100km)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.fuelEfficiency || ''}
              onChange={(e) => handleInputChange('fuelEfficiency', e.target.value)}
              placeholder="e.g., 25.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
