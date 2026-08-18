import React from 'react';
import { FaBox, FaThermometerHalf, FaRuler, FaWeight, FaCogs } from 'react-icons/fa';

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

    if (cargoType === 'LIQUID' && !currentTypes.includes(cargoType)) {
      handleInputChange('hasTanker', true);
      handleInputChange('cargoCapabilities.hasTanker', true);
    }
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
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <FaBox className="w-4 h-4 text-blue-600 dark:text-blue-500" />
        <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Cargo Logistics Configuration</h3>
      </div>

      {/* Supported Cargo Types */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center mb-4">Registry Classifications</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {cargoTypes.map((type) => (
            <label key={type} className="group flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-blue-600/30 transition-all shadow-none">
              <input
                type="checkbox"
                checked={formData.cargoCapabilities?.supportedCargoTypes?.includes(type) || false}
                onChange={() => handleCargoTypeToggle(type)}
                className="w-4 h-4 rounded border-gray-200 dark:border-gray-600 text-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:ring-offset-0 bg-white dark:bg-gray-700 transition-all"
              />
              <span className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                {type}
              </span>
            </label>
          ))}
        </div>
        {(formData.cargoCapabilities?.supportedCargoTypes || []).length > 0 && (
          <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1 space-y-1">
            {formData.cargoCapabilities?.supportedCargoTypes?.includes('REFRIGERATED') && (
              <p>Refrigerated cargo requires temperature limits and temperature alert monitoring.</p>
            )}
            {formData.cargoCapabilities?.supportedCargoTypes?.includes('HAZARDOUS') && (
              <p>Hazardous cargo requires Hazmat certification and safety controls.</p>
            )}
            {formData.cargoCapabilities?.supportedCargoTypes?.includes('LIQUID') && (
              <p>Liquid cargo requires tanker-compatible configuration.</p>
            )}
            {formData.cargoCapabilities?.supportedCargoTypes?.includes('VALUABLE') && (
              <p>Valuable cargo requires GPS, real-time tracking, geofencing, and insurance.</p>
            )}
            {formData.cargoCapabilities?.supportedCargoTypes?.includes('OVERSIZED') && (
              <p>Oversized cargo requires dimensions and declared weight limits.</p>
            )}
          </div>
        )}
      </div>

        {/* Special Handling Capabilities */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center mb-4">Handling Matrix</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              'maxFragileHandling',
              'maxHazardousHandling',
              'maxRefrigeratedHandling',
              'maxLiquidHandling',
              'maxOversizedHandling',
              'maxValuableHandling',
            ].map((capability) => (
              <label key={capability} className="group flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-blue-600/30 transition-all shadow-none">
                <input
                  type="checkbox"
                  checked={formData.cargoCapabilities?.[capability] || false}
                  onChange={() => handleCapabilityToggle(capability)}
                  className="w-4 h-4 rounded border-gray-200 dark:border-gray-600 text-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:ring-offset-0 bg-white dark:bg-gray-700 transition-all"
                />
                <span className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                  {capability.replace('max', '').replace('Handling', '')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Temperature Range */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center mb-4">
            <FaThermometerHalf className="w-3.5 h-3.5 mr-2 text-blue-600 dark:text-blue-500" />
            Thermal Controls
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {[
              { key: 'hasReefer', label: 'Reefer' },
              { key: 'hasFrozen', label: 'Frozen' },
              { key: 'hasChilled', label: 'Chilled' },
              { key: 'hasAmbient', label: 'Ambient' },
              { key: 'hasControlledAtmosphere', label: 'Controlled Atmosphere' },
              { key: 'hasTemperatureMonitoring', label: 'Temperature Monitoring' },
            ].map(({ key, label }) => (
              <label key={key} className="group flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-blue-600/30 transition-all shadow-none">
                <input
                  type="checkbox"
                  checked={formData.cargoCapabilities?.[key] || formData[key] || false}
                  onChange={() => {
                    handleCapabilityToggle(key);
                    handleInputChange(key, !(formData.cargoCapabilities?.[key] || formData[key]));
                  }}
                  className="w-4 h-4 rounded border-gray-200 dark:border-gray-600 text-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:ring-offset-0 bg-white dark:bg-gray-700 transition-all"
                />
                <span className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                  {label}
                </span>
              </label>
            ))}
          </div>
          {(formData.cargoCapabilities?.hasReefer || formData.hasReefer || formData.cargoCapabilities?.hasFrozen || formData.hasFrozen || formData.cargoCapabilities?.hasChilled || formData.hasChilled || formData.cargoCapabilities?.supportedCargoTypes?.includes('REFRIGERATED') || formData.cargoCapabilities?.maxRefrigeratedHandling) && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">MIN Operational (°C)</label>
                <input
                  type="number"
                  value={formData.cargoCapabilities?.temperatureRange?.min ?? ''}
                  onChange={(e) => handleTemperatureChange('min', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
                  placeholder="-40"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">MAX Operational (°C)</label>
                <input
                  type="number"
                  value={formData.cargoCapabilities?.temperatureRange?.max ?? ''}
                  onChange={(e) => handleTemperatureChange('max', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
                  placeholder="40"
                />
              </div>
            </div>
          )}
        </div>

        {/* Humidity Control */}
        <div className="flex items-center">
          <label className="group flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-blue-600/30 transition-all shadow-none">
            <input
              type="checkbox"
              checked={formData.cargoCapabilities?.humidityControl || false}
              onChange={() => handleCapabilityToggle('humidityControl')}
              className="w-4 h-4 rounded border-gray-200 dark:border-gray-600 text-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:ring-offset-0 bg-white dark:bg-gray-700 transition-all"
            />
            <span className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors">Atmospheric Humidity Control</span>
          </label>
        </div>

        {/* Dimensional Capacities */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center">
            <FaRuler className="w-3.5 h-3.5 mr-2 text-blue-600 dark:text-blue-500" />
            Static Volume Registry
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { field: 'maxLengthCapacity', label: 'LENGTH (M)', icon: '📏' },
              { field: 'maxWidthCapacity', label: 'WIDTH (M)', icon: '📐' },
              { field: 'maxHeightCapacity', label: 'HEIGHT (M)', icon: '📏' },
              { field: 'maxStackableHeight', label: 'STACK (M)', icon: '📦' },
            ].map(({ field, label, icon }) => (
              <div key={field}>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">
                  {label}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cargoCapabilities?.[field] || ''}
                  onChange={(e) => handleDimensionChange(field, e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
                  placeholder="0.00"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Weight Capacities */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center">
            <FaWeight className="w-3.5 h-3.5 mr-2 text-blue-600 dark:text-blue-500" />
            Weight & Clearance Limits
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { field: 'maxVolumeCapacity', label: 'Volume (m³)' },
              { field: 'maxWeight', label: 'Weight Limit (kg)' },
              { field: 'maxWeightPerAxle', label: 'Axle Weight Limit (kg)' },
              { field: 'maxClearanceHeight', label: 'Clearance Limit (m)' },
            ].map(({ field, label }) => (
              <div key={field}>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">
                  {label}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cargoCapabilities?.[field] || ''}
                  onChange={(e) => handleDimensionChange(field, e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
                  placeholder="0.00"
                />
              </div>
            ))}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">
                Gross Vehicle Weight (kg)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.grossVehicleWeight || ''}
                onChange={(e) => handleInputChange('grossVehicleWeight', e.target.value === '' ? '' : e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
    </div>
  );
};

