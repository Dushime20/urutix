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
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <FaTruck className="w-4 h-4 text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-900">Basic Truck Information</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Vehicle Identification */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-gray-700 flex items-center mb-2">
            <FaIdCard className="w-3.5 h-3.5 mr-1.5 text-gray-600" />
            Vehicle Identification
          </h4>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Plate Number *
            </label>
            <input
              type="text"
              value={formData.plateNumber || ''}
              onChange={(e) => handleInputChange('plateNumber', e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              required
              maxLength={20}
              placeholder="Enter plate number"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              VIN Number *
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
              className={`w-full px-2.5 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 ${
                formData.vin?.length === 17 
                  ? 'border-green-500 bg-green-50' 
                  : formData.vin?.length > 0 
                  ? 'border-yellow-400' 
                  : 'border-gray-300'
              }`}
              required
              maxLength={17}
              placeholder="Enter 17-character VIN"
            />
            <div className="mt-1 flex items-center justify-between">
              <span className={`text-xs ${
                formData.vin?.length === 17 
                  ? 'text-green-600' 
                  : formData.vin?.length > 0 
                  ? 'text-yellow-600' 
                  : 'text-gray-500'
              }`}>
                {formData.vin?.length || 0} / 17 characters
              </span>
              {formData.vin?.length === 17 && (
                <span className="text-xs text-green-600 font-medium">✓ Valid VIN length</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Registration Number *
            </label>
            <input
              type="text"
              value={formData.registrationNumber || ''}
              onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              required
              maxLength={50}
              placeholder="Enter registration number"
            />
          </div>
        </div>

        {/* Vehicle Details */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Vehicle Details</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Make *
              </label>
              <input
                type="text"
                value={formData.make || ''}
                onChange={(e) => handleInputChange('make', e.target.value)}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                required
                placeholder="e.g., Volvo"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Model *
              </label>
              <input
                type="text"
                value={formData.model || ''}
                onChange={(e) => handleInputChange('model', e.target.value)}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                required
                placeholder="e.g., FH16"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Year *
              </label>
              <input
                type="number"
                value={formData.year || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  handleInputChange('year', value === '' ? '' : parseInt(value));
                }}
                className={`w-full px-2.5 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 ${
                  formData.year && typeof formData.year === 'number' && formData.year > new Date().getFullYear()
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                }`}
                required
                min="1900"
                max="2030"
                placeholder="e.g., 2023"
              />
              {formData.year && typeof formData.year === 'number' && formData.year > new Date().getFullYear() && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <span>⚠</span>
                  <span>Year cannot be in the future. Current year is {new Date().getFullYear()}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Color
              </label>
              <input
                type="text"
                value={formData.color || ''}
                onChange={(e) => handleInputChange('color', e.target.value)}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                placeholder="e.g., White"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Insurance Information */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-gray-700 flex items-center mb-2">
          <FaCalendar className="w-3.5 h-3.5 mr-1.5 text-gray-600" />
          Insurance & Registration
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Insurance Policy Number *
            </label>
            <input
              type="text"
              value={formData.insurancePolicy || ''}
              onChange={(e) => handleInputChange('insurancePolicy', e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              required
              maxLength={50}
              placeholder="Enter insurance policy number"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Insurance Expiry Date *
            </label>
            <input
              type="date"
              value={formData.insuranceExpiry || ''}
              onChange={(e) => handleInputChange('insuranceExpiry', e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Registration Expiry Date *
            </label>
            <input
              type="date"
              value={formData.registrationExpiry || ''}
              onChange={(e) => handleInputChange('registrationExpiry', e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Roadworthy Certificate Expiry
            </label>
            <input
              type="date"
              value={formData.roadworthyCertExpiry || ''}
              onChange={(e) => handleInputChange('roadworthyCertExpiry', e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicInformationStep; 
