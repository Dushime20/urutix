import React from 'react';
import { FaTruck, FaIdCard, FaCalendar, FaWeight } from 'react-icons/fa';

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
      <div className="flex items-center space-x-3 mb-6">
        <FaTruck className="w-5 h-5 text-primary-600" />
        <h3 className="text-lg font-semibold text-gray-900">Basic Truck Information</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vehicle Identification */}
        <div className="space-y-4">
          <h4 className="text-base font-medium text-gray-800 flex items-center mb-4">
            <FaIdCard className="w-5 h-5 mr-2 text-primary-600" />
            Vehicle Identification
          </h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plate Number *
            </label>
            <input
              type="text"
              value={formData.plateNumber || ''}
              onChange={(e) => handleInputChange('plateNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              maxLength={20}
              placeholder="Enter plate number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              VIN Number *
            </label>
            <input
              type="text"
              value={formData.vin || ''}
              onChange={(e) => handleInputChange('vin', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              maxLength={17}
              placeholder="Enter VIN number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Registration Number *
            </label>
            <input
              type="text"
              value={formData.registrationNumber || ''}
              onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              maxLength={50}
              placeholder="Enter registration number"
            />
          </div>
        </div>

        {/* Vehicle Details */}
        <div className="space-y-4">
          <h4 className="text-base font-medium text-gray-800 mb-4">Vehicle Details</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Make *
              </label>
              <input
                type="text"
                value={formData.make || ''}
                onChange={(e) => handleInputChange('make', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                placeholder="e.g., Volvo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model *
              </label>
              <input
                type="text"
                value={formData.model || ''}
                onChange={(e) => handleInputChange('model', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                placeholder="e.g., FH16"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year *
              </label>
              <input
                type="number"
                value={formData.year || ''}
                onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                min="1900"
                max="2030"
                placeholder="e.g., 2023"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <input
                type="text"
                value={formData.color || ''}
                onChange={(e) => handleInputChange('color', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., White"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Capacity Information */}
      <div className="space-y-4">
        <h4 className="text-base font-medium text-gray-800 flex items-center mb-4">
          <FaWeight className="w-5 h-5 mr-2 text-primary-600" />
          Capacity Information
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight Capacity (kg) *
            </label>
            <input
              type="number"
              value={formData.capacityWeight || ''}
              onChange={(e) => handleInputChange('capacityWeight', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              min="1"
              placeholder="e.g., 25000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Volume Capacity (m³) *
            </label>
            <input
              type="number"
              value={formData.capacityVolume || ''}
              onChange={(e) => handleInputChange('capacityVolume', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              min="1"
              placeholder="e.g., 100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Mileage (km)
            </label>
            <input
              type="number"
              value={formData.mileage || ''}
              onChange={(e) => handleInputChange('mileage', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              min="0"
              placeholder="e.g., 150000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fuel Type *
            </label>
            <select
              value={formData.fuelType || ''}
              onChange={(e) => handleInputChange('fuelType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">Select fuel type</option>
              <option value="DIESEL">Diesel</option>
              <option value="GASOLINE">Gasoline</option>
              <option value="ELECTRIC">Electric</option>
              <option value="HYBRID">Hybrid</option>
              <option value="NATURAL_GAS">Natural Gas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Insurance Information */}
      <div className="space-y-4">
        <h4 className="text-base font-medium text-gray-800 flex items-center mb-4">
          <FaCalendar className="w-5 h-5 mr-2 text-primary-600" />
          Insurance & Registration
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Insurance Policy Number *
            </label>
            <input
              type="text"
              value={formData.insurancePolicy || ''}
              onChange={(e) => handleInputChange('insurancePolicy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              maxLength={50}
              placeholder="Enter insurance policy number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Insurance Expiry Date *
            </label>
            <input
              type="date"
              value={formData.insuranceExpiry || ''}
              onChange={(e) => handleInputChange('insuranceExpiry', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Registration Expiry Date *
            </label>
            <input
              type="date"
              value={formData.registrationExpiry || ''}
              onChange={(e) => handleInputChange('registrationExpiry', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Roadworthy Certificate Expiry
            </label>
            <input
              type="date"
              value={formData.roadworthyCertExpiry || ''}
              onChange={(e) => handleInputChange('roadworthyCertExpiry', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicInformationStep; 