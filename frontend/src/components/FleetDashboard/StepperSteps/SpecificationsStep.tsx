import React from 'react';
import { FaRuler, FaGasPump, FaCogs } from 'react-icons/fa';

interface SpecificationsStepProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
}

const inputClass =
  'w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-none appearance-none';
const labelClass =
  'block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1';

export const SpecificationsStep: React.FC<SpecificationsStepProps> = ({
  formData,
  handleInputChange,
}) => {
  const fuelTypes = [
    { value: 'DIESEL', label: 'Diesel' },
    { value: 'GASOLINE', label: 'Petrol / Gasoline' },
    { value: 'ELECTRIC', label: 'Electric' },
    { value: 'HYBRID', label: 'Hybrid' },
    { value: 'CNG', label: 'CNG' },
    { value: 'LNG', label: 'LNG' },
  ];

  const chassisConfigurations = [
    { value: 'TRACTOR', label: 'Tractor Unit' },
    { value: 'RIGID', label: 'Rigid Truck' },
    { value: 'ARTICULATED', label: 'Articulated' },
    { value: 'DRAWBAR', label: 'Drawbar Combination' },
    { value: 'DOLLY', label: 'Dolly' },
    { value: 'TRAILER_ONLY', label: 'Trailer Only' },
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
    'CURTAIN_SIDE',
    'SPECIALIZED',
  ];

  const axleOptions = ['4x2', '6x2', '6x4', '8x4', '8x6', '10x4', 'OTHER'];
  const transmissionOptions = [
    { value: 'MANUAL', label: 'Manual' },
    { value: 'AUTOMATIC', label: 'Automatic' },
    { value: 'AMT', label: 'Automated Manual (AMT)' },
    { value: 'DUAL_CLUTCH', label: 'Dual Clutch' },
  ];

  const handleNumericChange = (field: string, value: string) => {
    handleInputChange(field, value === '' ? '' : value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <FaCogs className="w-4 h-4 text-blue-600 dark:text-blue-500" />
        <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Vehicle Specifications
        </h3>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Configure the technical specifications and capabilities of the vehicle.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Primary Chassis Configuration *</label>
          <select
            value={formData.chassisConfiguration || ''}
            onChange={(e) => handleInputChange('chassisConfiguration', e.target.value)}
            className={inputClass}
            required
          >
            <option value="" className="dark:bg-gray-900">
              Select configuration...
            </option>
            {chassisConfigurations.map((option) => (
              <option key={option.value} value={option.value} className="dark:bg-gray-900">
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Architecture Type *</label>
          <select
            value={formData.trailerType || ''}
            onChange={(e) => handleInputChange('trailerType', e.target.value)}
            className={inputClass}
            required
          >
            <option value="" className="dark:bg-gray-900">
              Select trailer / body type...
            </option>
            {trailerTypes.map((type) => (
              <option key={type} value={type} className="dark:bg-gray-900">
                {type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
          Capacity
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={`${labelClass} flex items-center justify-between`}>
              Payload Capacity (kg) *
              <span className="text-[9px] text-blue-600 dark:text-blue-500 font-bold italic">Matching</span>
            </label>
            <input
              type="number"
              value={formData.capacityWeight || ''}
              onChange={(e) => handleNumericChange('capacityWeight', e.target.value)}
              placeholder="e.g. 20000"
              className={inputClass}
              required
              min="1"
              step="0.01"
            />
          </div>
          <div>
            <label className={`${labelClass} flex items-center justify-between`}>
              Volumetric Space (m³) *
              <span className="text-[9px] text-blue-600 dark:text-blue-500 font-bold italic">Matching</span>
            </label>
            <input
              type="number"
              value={formData.capacityVolume || ''}
              onChange={(e) => handleNumericChange('capacityVolume', e.target.value)}
              placeholder="e.g. 100"
              className={inputClass}
              required
              min="1"
              step="0.01"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center">
          <FaRuler className="w-3.5 h-3.5 mr-2 text-blue-600 dark:text-blue-500" />
          Dimensions
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Length (m)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={formData.maxLength || ''}
              onChange={(e) => handleNumericChange('maxLength', e.target.value)}
              placeholder="e.g. 16.5"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Width (m)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={formData.maxWidth || ''}
              onChange={(e) => handleNumericChange('maxWidth', e.target.value)}
              placeholder="e.g. 2.6"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Height (m)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={formData.maxHeight || ''}
              onChange={(e) => handleNumericChange('maxHeight', e.target.value)}
              placeholder="e.g. 4.1"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center">
          <FaGasPump className="w-3.5 h-3.5 mr-2 text-blue-600 dark:text-blue-500" />
          Powertrain & Operations
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Propulsion System *</label>
            <select
              value={formData.fuelType || ''}
              onChange={(e) => handleInputChange('fuelType', e.target.value)}
              className={inputClass}
              required
            >
              <option value="" className="dark:bg-gray-900">
                Select propulsion...
              </option>
              {fuelTypes.map((type) => (
                <option key={type.value} value={type.value} className="dark:bg-gray-900">
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Axle Configuration</label>
            <select
              value={formData.axleConfiguration || ''}
              onChange={(e) => handleInputChange('axleConfiguration', e.target.value)}
              className={inputClass}
            >
              <option value="" className="dark:bg-gray-900">
                Select axle layout...
              </option>
              {axleOptions.map((option) => (
                <option key={option} value={option} className="dark:bg-gray-900">
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Fuel Tank Capacity (litres)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={formData.fuelTankCapacity || ''}
              onChange={(e) => handleNumericChange('fuelTankCapacity', e.target.value)}
              placeholder="e.g. 400"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Odometer (km)</label>
            <input
              type="number"
              min="0"
              value={formData.mileage || ''}
              onChange={(e) => handleNumericChange('mileage', e.target.value)}
              placeholder="e.g. 150000"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Engine Model</label>
            <input
              type="text"
              value={formData.engineModel || ''}
              onChange={(e) => handleInputChange('engineModel', e.target.value)}
              placeholder="e.g. D16K"
              className={inputClass}
              maxLength={100}
            />
          </div>
          <div>
            <label className={labelClass}>Horsepower (hp)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={formData.horsepower || ''}
              onChange={(e) => handleNumericChange('horsepower', e.target.value)}
              placeholder="e.g. 540"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Torque (Nm)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={formData.torque || ''}
              onChange={(e) => handleNumericChange('torque', e.target.value)}
              placeholder="e.g. 2600"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Transmission</label>
            <select
              value={formData.transmission || ''}
              onChange={(e) => handleInputChange('transmission', e.target.value)}
              className={inputClass}
            >
              <option value="" className="dark:bg-gray-900">
                Select transmission...
              </option>
              {transmissionOptions.map((option) => (
                <option key={option.value} value={option.value} className="dark:bg-gray-900">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Fuel Efficiency (L/100km)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={formData.fuelEfficiency || ''}
              onChange={(e) => handleNumericChange('fuelEfficiency', e.target.value)}
              placeholder="e.g. 25.5"
              className={inputClass}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
