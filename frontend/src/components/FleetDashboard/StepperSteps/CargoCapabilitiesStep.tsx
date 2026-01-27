import React from 'react';
import { FaBox, FaThermometerHalf, FaRuler, FaWeight } from 'react-icons/fa';

interface CargoCapabilitiesStepProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
}

export const CargoCapabilitiesStep: React.FC<CargoCapabilitiesStepProps> = ({
  formData,
  handleInputChange,
}) => {
  const cargoTypes = [
    'GENERAL',
    'FRAGILE',
    'HAZARDOUS',
    'REFRIGERATED',
    'LIQUID',
    'OVERSIZED',
    'VALUABLE',
  ];

  const handleCargoTypeToggle = (cargoType: string) => {
    const currentTypes = formData.cargoCapabilities?.supportedCargoTypes || [];
    const updatedTypes = currentTypes.includes(cargoType)
      ? currentTypes.filter((type: string) => type !== cargoType)
      : [...currentTypes, cargoType];

    handleInputChange('cargoCapabilities.supportedCargoTypes', updatedTypes);
  };

  const handleCapabilityToggle = (capability: string) => {
    handleInputChange('cargoCapabilities', {
      ...formData.cargoCapabilities,
      [capability]: !formData.cargoCapabilities?.[capability],
    });
  };

  const handleTemperatureChange = (field: 'min' | 'max', value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    handleInputChange('cargoCapabilities.temperatureRange', {
      ...formData.cargoCapabilities?.temperatureRange,
      [field]: numValue,
    });
  };

  const handleDimensionChange = (field: string, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    handleInputChange('cargoCapabilities', {
      ...formData.cargoCapabilities,
      [field]: numValue,
    });
  };

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 pb-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <FaBox className="w-4 h-4 text-gray-600" />
          Cargo Capabilities Configuration
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Configure what types of cargo this truck can handle and its capabilities.
        </p>
      </div>

      {/* Supported Cargo Types */}
      <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Supported Cargo Types
            </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {cargoTypes.map((type) => (
              <label key={type} className="flex items-center space-x-1.5">
                <input
                  type="checkbox"
                  checked={formData.cargoCapabilities?.supportedCargoTypes?.includes(type) || false}
                  onChange={() => handleCargoTypeToggle(type)}
                  className="rounded border-gray-300 text-gray-600 focus:ring-gray-500 w-3.5 h-3.5"
                />
                <span className="text-xs text-gray-600">
                  {type}
                </span>
            </label>
            ))}
        </div>
      </div>

        {/* Special Handling Capabilities */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Special Handling Capabilities
            </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              'maxFragileHandling',
              'maxHazardousHandling',
              'maxRefrigeratedHandling',
              'maxLiquidHandling',
              'maxOversizedHandling',
              'maxValuableHandling',
            ].map((capability) => (
              <label key={capability} className="flex items-center space-x-1.5">
                <input
                  type="checkbox"
                  checked={formData.cargoCapabilities?.[capability] || false}
                  onChange={() => handleCapabilityToggle(capability)}
                  className="rounded border-gray-300 text-gray-600 focus:ring-gray-500 w-3.5 h-3.5"
                />
                <span className="text-xs text-gray-600">
                  {capability.replace('max', '').replace('Handling', '')}
                </span>
              </label>
            ))}
          </div>
          </div>

        {/* Temperature Range */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <FaThermometerHalf className="w-3.5 h-3.5 text-gray-500" />
            <label className="block text-xs font-medium text-gray-600">
              Temperature Range (°C)
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-gray-500 mb-1">Minimum</label>
            <input
                type="number"
                value={formData.cargoCapabilities?.temperatureRange?.min || ''}
                onChange={(e) => handleTemperatureChange('min', e.target.value)}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                placeholder="-40"
              />
          </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-1">Maximum</label>
            <input
                type="number"
                value={formData.cargoCapabilities?.temperatureRange?.max || ''}
                onChange={(e) => handleTemperatureChange('max', e.target.value)}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                placeholder="40"
              />
          </div>
        </div>
      </div>

        {/* Humidity Control */}
        <div>
          <label className="flex items-center space-x-1.5">
            <input
              type="checkbox"
              checked={formData.cargoCapabilities?.humidityControl || false}
              onChange={() => handleCapabilityToggle('humidityControl')}
              className="rounded border-gray-300 text-gray-600 focus:ring-gray-500 w-3.5 h-3.5"
            />
            <span className="text-xs font-medium text-gray-600">Humidity Control</span>
            </label>
          </div>

        {/* Dimensional Capacities */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <FaRuler className="w-3.5 h-3.5 text-gray-500" />
            <label className="block text-xs font-medium text-gray-600">
              Dimensional Capacities
            </label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { field: 'maxLengthCapacity', label: 'Max Length (m)', icon: '📏' },
              { field: 'maxWidthCapacity', label: 'Max Width (m)', icon: '📐' },
              { field: 'maxHeightCapacity', label: 'Max Height (m)', icon: '📏' },
              { field: 'maxStackableHeight', label: 'Stackable Height (m)', icon: '📦' },
            ].map(({ field, label, icon }) => (
              <div key={field}>
                <label className="block text-[10px] text-gray-500 mb-1">
                  {icon} {label}
            </label>
            <input
                  type="number"
                  step="0.01"
                  value={formData.cargoCapabilities?.[field] || ''}
                  onChange={(e) => handleDimensionChange(field, e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  placeholder="0.00"
                />
          </div>
            ))}
        </div>
      </div>

        {/* Weight Capacities */}
      <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <FaWeight className="w-3.5 h-3.5 text-gray-500" />
            <label className="block text-xs font-medium text-gray-600">
              Weight Capacities
            </label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { field: 'maxVolumeCapacity', label: 'Max Volume (m³)', icon: '📦' },
              { field: 'maxWeightPerAxle', label: 'Max Weight/Axle (kg)', icon: '⚖️' },
              { field: 'maxClearanceHeight', label: 'Max Clearance (m)', icon: '🚛' },
            ].map(({ field, label, icon }) => (
              <div key={field}>
                <label className="block text-[10px] text-gray-500 mb-1">
                  {icon} {label}
            </label>
            <input
                  type="number"
                  step="0.01"
                  value={formData.cargoCapabilities?.[field] || ''}
                  onChange={(e) => handleDimensionChange(field, e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  placeholder="0.00"
                />
          </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
