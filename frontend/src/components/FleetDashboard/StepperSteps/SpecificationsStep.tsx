import React from 'react';
import { FaRuler, FaWeight, FaGasPump, FaCogs } from 'react-icons/fa';

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
    'CNG',
    'LNG',
  ];

  const truckTypes = [
    'FLATBED',
    'BOX_TRUCK',
    'REFRIGERATED',
    'TANKER',
    'CONTAINER',
    'LOWBED',
    'STEP_DECK',
    'POWER_ONLY',
    'CAR_CARRIER',
    'DUMP',
    'VAN',
    'PLATFORM',
    'BULK',
    'SPECIALIZED'
  ];

  const trailerTypes = [
    'FLATBED',
    'DRY_VAN',
    'REFRIGERATED',
    'TANKER',
    'BULK',
    'CONTAINER',
    'CAR_CARRIER',
    'LOWBED',
    'STEP_DECK',
    'POWER_ONLY',
    'PLATFORM',
    'DUMP',
    'SPECIALIZED'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <FaCogs className="w-4 h-4 text-blue-600 dark:text-blue-500" />
        <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Technical Architecture</h3>
      </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Configure the technical specifications and capabilities of the vehicle.
        </p>
      {/* Vehicle Type */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">
              Primary Chassis Configuration *
            </label>
            <select
              value={formData.truckType || ''}
              onChange={(e) => handleInputChange('truckType', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none appearance-none shadow-none"
              required
            >
              <option value="" className="dark:bg-gray-900">SELECT TRUCK TYPE...</option>
              {truckTypes.map((type) => (
                <option key={type} value={type} className="dark:bg-gray-900">
                  {type.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">
              Architecture Type *
            </label>
            <select
              value={formData.trailerType || ''}
              onChange={(e) => handleInputChange('trailerType', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none appearance-none shadow-none"
              required
            >
              <option value="" className="dark:bg-gray-900">SELECT TRAILER TYPE...</option>
              {trailerTypes.map((type) => (
                <option key={type} value={type} className="dark:bg-gray-900">
                  {type.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

        {/* Core Specs */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center mb-4">
            Mechanical Framework
          </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1 flex items-center justify-between">
              Payload Capacity (KG) *
              <span className="text-[9px] text-blue-600 dark:text-blue-500 font-bold italic">REGISTRY MATCHING</span>
            </label>
            <input
              type="number"
              value={formData.capacityWeight || ''}
              onChange={(e) => handleInputChange('capacityWeight', e.target.value)}
              placeholder="E.G., 20000"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              required
              min="1"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1 flex items-center justify-between">
              Volumetric Space (M³) *
              <span className="text-[9px] text-blue-600 dark:text-blue-500 font-bold italic">REGISTRY MATCHING</span>
            </label>
            <input
              type="number"
              value={formData.capacityVolume || ''}
              onChange={(e) => handleInputChange('capacityVolume', e.target.value)}
              placeholder="E.G., 100"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              required
              min="1"
            />
          </div>
        </div>
      </div>

      {/* Dimensional Specifications */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center mb-4">
          <FaRuler className="w-3.5 h-3.5 mr-2 text-blue-600 dark:text-blue-500" />
          Dimensional Constraints
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">
              Length Registry (M)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.maxLength || ''}
              onChange={(e) => handleInputChange('maxLength', e.target.value)}
              placeholder="E.G., 16.5"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">
              Width Registry (M)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.maxWidth || ''}
              onChange={(e) => handleInputChange('maxWidth', e.target.value)}
              placeholder="E.G., 2.6"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">
              Height Registry (M)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.maxHeight || ''}
              onChange={(e) => handleInputChange('maxHeight', e.target.value)}
              placeholder="E.G., 4.1"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
            />
          </div>
        </div>
      </div>

      {/* Additional Specifications */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center">
          <FaGasPump className="w-3.5 h-3.5 mr-2 text-blue-600 dark:text-blue-500" />
          Consumption Matrix
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">
              Propulsion System *
            </label>
            <select
              value={formData.fuelType || ''}
              onChange={(e) => handleInputChange('fuelType', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none appearance-none shadow-none"
              required
            >
              <option value="" className="dark:bg-gray-900">SELECT FUEL...</option>
              {fuelTypes.map((type) => (
                <option key={type} value={type} className="dark:bg-gray-900">
                  {type === 'NATURAL_GAS' ? 'Natural Gas' : type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">
              Odometer Reading (KM)
            </label>
            <input
              type="number"
              value={formData.mileage || ''}
              onChange={(e) => handleInputChange('mileage', e.target.value)}
              placeholder="E.G., 150000"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">
              Burn Rate (L/100KM)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.fuelEfficiency || ''}
              onChange={(e) => handleInputChange('fuelEfficiency', e.target.value)}
              placeholder="E.G., 25.5"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

