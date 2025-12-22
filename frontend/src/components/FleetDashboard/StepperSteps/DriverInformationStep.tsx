import React from 'react';
import { FaUser, FaIdCard, FaPhone, FaEnvelope } from 'react-icons/fa';

interface DriverInformationStepProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
}

const DriverInformationStep: React.FC<DriverInformationStepProps> = ({
  formData,
  handleInputChange
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <FaUser className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Driver Information</h3>
      </div>

      {/* Personal Information */}
      <div className="space-y-4">
        <h4 className="text-base font-medium text-gray-800 flex items-center mb-4">
          <FaUser className="w-5 h-5 mr-2 text-gray-600" />
          Personal Information
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              value={formData.firstName || ''}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              required
              placeholder="Enter first name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              value={formData.lastName || ''}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              required
              placeholder="Enter last name"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth *
            </label>
            <input
              type="date"
              value={formData.dateOfBirth || ''}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address *
            </label>
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              required
              placeholder="Street, City, Country"
            />
          </div>
        </div>
      </div>

      {/* License Information */}
      <div className="space-y-4">
        <h4 className="text-base font-medium text-gray-800 flex items-center mb-4">
          <FaIdCard className="w-5 h-5 mr-2 text-gray-600" />
          License Information
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              License Number *
            </label>
            <input
              type="text"
              value={formData.licenseNumber || ''}
              onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              required
              placeholder="Enter license number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              License Type *
            </label>
            <select
              value={formData.licenseType || ''}
              onChange={(e) => handleInputChange('licenseType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              required
            >
              <option value="">Select license type</option>
              <option value="CLASS_A">Class A - Heavy Combination</option>
              <option value="CLASS_B">Class B - Heavy Rigid</option>
              <option value="CLASS_C">Class C - Medium Rigid</option>
              <option value="CLASS_D">Class D - Light Rigid</option>
              <option value="CLASS_E">Class E - Car</option>
              <option value="CLASS_F">Class F - Tractor</option>
              <option value="CLASS_G">Class G - Motorcycle</option>
              <option value="CLASS_H">Class H - Moped</option>
              <option value="CLASS_I">Class I - Special Purpose</option>
              <option value="CLASS_J">Class J - Learner</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Years of Experience *
            </label>
            <input
              type="number"
              value={formData.experience || ''}
              onChange={(e) => handleInputChange('experience', parseInt(e.target.value) || '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              required
              min={0}
              max={50}
              placeholder="Enter years of experience"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              License Issue Date *
            </label>
            <input
              type="date"
              value={formData.licenseIssueDate || ''}
              onChange={(e) => handleInputChange('licenseIssueDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              License Expiry Date *
            </label>
            <input
              type="date"
              value={formData.licenseExpiry || ''}
              onChange={(e) => handleInputChange('licenseExpiry', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              License State *
            </label>
            <input
              type="text"
              value={formData.licenseState || ''}
              onChange={(e) => handleInputChange('licenseState', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              required
              placeholder="State/Province"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              License Country *
            </label>
            <input
              type="text"
              value={formData.licenseCountry || ''}
              onChange={(e) => handleInputChange('licenseCountry', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              required
              placeholder="Country"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-800 flex items-center">
          <FaPhone className="w-5 h-5 mr-2 text-gray-600" />
          Contact Information
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.contactInfo?.phone || ''}
              onChange={(e) => handleInputChange('contactInfo', { ...formData.contactInfo, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              required
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.contactInfo?.email || ''}
              onChange={(e) => handleInputChange('contactInfo', { ...formData.contactInfo, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              required
              placeholder="Enter email address"
            />
          </div>
        </div>
      </div>

      {/* Employment */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-800">Employment</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type *</label>
            <select
              value={formData.employmentType || ''}
              onChange={(e) => handleInputChange('employmentType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              required
            >
              <option value="">Select employment type</option>
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="CONTRACT">Contract</option>
              <option value="OWNER_OPERATOR">Owner Operator</option>
              <option value="FREELANCE">Freelance</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hire Date *</label>
            <input
              type="date"
              value={formData.hireDate || ''}
              onChange={(e) => handleInputChange('hireDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
            <select
              value={formData.status || ''}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              required
            >
              <option value="">Select status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="ON_LEAVE">On Leave</option>
            </select>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-800">Additional Information</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Special Certifications
          </label>
          <textarea
            value={formData.specialCertifications || ''}
            onChange={(e) => handleInputChange('specialCertifications', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            rows={3}
            placeholder="Enter any special certifications (e.g., Hazmat, Tanker, etc.)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={formData.driverNotes || ''}
            onChange={(e) => handleInputChange('driverNotes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            rows={3}
            placeholder="Enter any additional notes about the driver"
          />
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-800">Emergency Contact</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emergency Contact Name
            </label>
            <input
              type="text"
              value={formData.emergencyContact?.name || ''}
              onChange={(e) => handleInputChange('emergencyContact', { ...formData.emergencyContact, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              placeholder="Enter emergency contact name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emergency Contact Phone
            </label>
            <input
              type="tel"
              value={formData.emergencyContact?.phone || ''}
              onChange={(e) => handleInputChange('emergencyContact', { ...formData.emergencyContact, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              placeholder="Enter emergency contact phone"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Relationship
            </label>
            <input
              type="text"
              value={formData.emergencyContact?.relationship || ''}
              onChange={(e) => handleInputChange('emergencyContact', { ...formData.emergencyContact, relationship: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              placeholder="e.g., Spouse, Parent, etc."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverInformationStep; 
