import React from 'react';
import { FaTruck, FaIdCard, FaCalendar } from 'react-icons/fa';

interface BasicInformationStepProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
}

const BasicInformationStep: React.FC<BasicInformationStepProps> = ({
  formData,
  handleInputChange
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <FaTruck className="w-4 h-4 text-blue-600 dark:text-blue-500" />
        <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Fleet Asset Identification</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Vehicle Identification */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center mb-4">
            <FaIdCard className="w-3.5 h-3.5 mr-2 text-blue-600 dark:text-blue-500" />
            Core Identification
          </h4>
          
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">
              Plate Number *
            </label>
            <input
              type="text"
              value={formData.plateNumber || ''}
              onChange={(e) => handleInputChange('plateNumber', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-none"
              required
              maxLength={20}
              placeholder="SCAN PLATE..."
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">
              VIN Registry *
            </label>
            <input
              type="text"
              value={formData.vin || ''}
              onChange={(e) => {
                // Only allow alphanumeric characters (excluding I, O, Q as per VIN standards)
                const value = e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
                // Limit to 17 characters
                if (value.length <= 17) {
                  handleInputChange('vin', value);
                }
              }}
              className={`w-full px-4 py-3 text-sm font-semibold rounded-lg focus:outline-none focus:ring-4 transition-all bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-none ${
                formData.vin?.length === 17 
                  ? 'border-green-500/50 ring-green-500/5 focus:ring-green-500/10 focus:border-green-500' 
                  : formData.vin?.length > 0 
                  ? 'border-yellow-500/50 ring-yellow-500/5 focus:ring-yellow-500/10 focus:border-yellow-500' 
                  : 'border-gray-100 dark:border-gray-700 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500'
              }`}
              required
              maxLength={17}
              placeholder="SCAN VIN..."
            />
            <div className="mt-1.5 flex items-center justify-between px-1">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${
                formData.vin?.length === 17 
                  ? 'text-green-600 dark:text-green-500' 
                  : formData.vin?.length > 0 
                  ? 'text-yellow-600 dark:text-yellow-500' 
                  : 'text-gray-400 dark:text-gray-600'
              }`}>
                {formData.vin?.length || 0} / 17 MARKERS
              </span>
              {formData.vin?.length === 17 && (
                <span className="text-[10px] text-green-600 dark:text-green-500 font-bold uppercase tracking-widest">✓ VERIFIED</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">
              Registration Code *
            </label>
            <input
              type="text"
              value={formData.registrationNumber || ''}
              onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-none"
              required
              maxLength={50}
              placeholder="SCAN REGISTRY..."
            />
          </div>
        </div>

        {/* Vehicle Details */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center mb-4">Manufacturer Specifications</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">
                Make *
              </label>
              <input
                type="text"
                value={formData.make || ''}
                onChange={(e) => handleInputChange('make', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-none"
                required
                placeholder="E.G., VOLVO"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">
                Model *
              </label>
              <input
                type="text"
                value={formData.model || ''}
                onChange={(e) => handleInputChange('model', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-none"
                required
                placeholder="E.G., FH16"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">
                Production Year *
              </label>
              <input
                type="number"
                value={formData.year || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  handleInputChange('year', value === '' ? '' : parseInt(value));
                }}
                className={`w-full px-4 py-3 text-sm font-semibold rounded-lg focus:outline-none focus:ring-4 transition-all bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-none ${
                  formData.year && typeof formData.year === 'number' && formData.year > new Date().getFullYear()
                    ? 'border-red-500/50 ring-red-500/5 focus:ring-red-500/10 focus:border-red-500'
                    : 'border-gray-100 dark:border-gray-700 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500'
                }`}
                required
                min="1900"
                max="2030"
                placeholder="E.G., 2024"
              />
              {formData.year && typeof formData.year === 'number' && formData.year > new Date().getFullYear() && (
                <p className="mt-1.5 text-[10px] text-red-600 dark:text-red-500 font-bold uppercase tracking-widest flex items-center gap-1.5 px-1">
                  <span>⚠ TEMPORAL ANOMALY: YEAR EXCEEDS CURRENT</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">
                Color Chassis
              </label>
              <input
                type="text"
                value={formData.color || ''}
                onChange={(e) => handleInputChange('color', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-none"
                placeholder="E.G., WHITE"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Insurance Information */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center mb-4">
          <FaCalendar className="w-3.5 h-3.5 mr-2 text-blue-600 dark:text-blue-500" />
          Legal documentation
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">
              Insurance Policy ID *
            </label>
            <input
              type="text"
              value={formData.insurancePolicy || ''}
              onChange={(e) => handleInputChange('insurancePolicy', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-none"
              required
              maxLength={50}
              placeholder="SCAN POLICY..."
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">
              Insurance Expiry *
            </label>
            <input
              type="date"
              value={formData.insuranceExpiry || ''}
              onChange={(e) => handleInputChange('insuranceExpiry', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">
              Registry Expiry *
            </label>
            <input
              type="date"
              value={formData.registrationExpiry || ''}
              onChange={(e) => handleInputChange('registrationExpiry', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">
              Roadworthy Expiry
            </label>
            <input
              type="date"
              value={formData.roadworthyCertExpiry || ''}
              onChange={(e) => handleInputChange('roadworthyCertExpiry', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicInformationStep; 

