import React, { useState } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaBuilding, FaMapMarkerAlt, FaSave, FaCamera } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const ProfileSettings: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: user?.email || '',
    phone: '+250 788 123 456',
    companyName: 'Transport Solutions Ltd',
    address: 'Kigali, Rwanda',
    bio: 'Experienced logistics professional with 10+ years in fleet management.',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    // TODO: Save to API
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-3xl">
                  {formData.firstName.charAt(0)}{formData.lastName.charAt(0)}
                </span>
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 border border-gray-200">
                <FaCamera className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* User Info */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {formData.firstName} {formData.lastName}
              </h2>
              <p className="text-gray-600 mt-1">{formData.email}</p>
              <p className="text-sm text-gray-500 mt-1">Tenant Admin</p>
            </div>
          </div>

          {/* Edit Button */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaUser className="inline w-4 h-4 mr-2 text-gray-400" />
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaUser className="inline w-4 h-4 mr-2 text-gray-400" />
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaEnvelope className="inline w-4 h-4 mr-2 text-gray-400" />
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaPhone className="inline w-4 h-4 mr-2 text-gray-400" />
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaBuilding className="inline w-4 h-4 mr-2 text-gray-400" />
              Company Name
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaMapMarkerAlt className="inline w-4 h-4 mr-2 text-gray-400" />
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
        </div>

        {/* Bio */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            disabled={!isEditing}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>

        {/* Save Button */}
        {isEditing && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <FaSave className="w-4 h-4 mr-2" />
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Account Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-sm text-gray-500 mb-1">Member Since</div>
          <div className="text-xl font-bold text-gray-900">Jan 2024</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-sm text-gray-500 mb-1">Total Users</div>
          <div className="text-xl font-bold text-gray-900">47</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-sm text-gray-500 mb-1">Active Sessions</div>
          <div className="text-xl font-bold text-gray-900">3</div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
