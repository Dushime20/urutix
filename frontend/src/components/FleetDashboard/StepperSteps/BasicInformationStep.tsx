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
              onChange={(e) => handleInputChange('vin', e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              required
              maxLength={17}
              placeholder="Enter VIN number"
            />
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
                onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                required
                min="1900"
                max="2030"
                placeholder="e.g., 2023"
              />
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

      {/* Capacity Information */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-gray-700 flex items-center mb-2">
          <FaWeight className="w-3.5 h-3.5 mr-1.5 text-gray-600" />
          Capacity Information
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Weight Capacity (kg) *
            </label>
            <input
              type="number"
              value={formData.capacityWeight || ''}
              onChange={(e) => handleInputChange('capacityWeight', parseFloat(e.target.value))}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              required
              min="1"
              placeholder="e.g., 25000"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Volume Capacity (m³) *
            </label>
            <input
              type="number"
              value={formData.capacityVolume || ''}
              onChange={(e) => handleInputChange('capacityVolume', parseFloat(e.target.value))}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              required
              min="1"
              placeholder="e.g., 100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Current Mileage (km)
            </label>
            <input
              type="number"
              value={formData.mileage || ''}
              onChange={(e) => handleInputChange('mileage', e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              min="0"
              placeholder="e.g., 150000"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Fuel Type *
            </label>
            <select
              value={formData.fuelType || ''}
              onChange={(e) => handleInputChange('fuelType', e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
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
