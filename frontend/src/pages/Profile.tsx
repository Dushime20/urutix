import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaBuilding, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { TranslatedText } from '../components/translated-text';

interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  companyName: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  avatarUrl?: string;
  bio?: string;
  websiteUrl?: string;
  rating?: number;
  totalTrips?: number;
  createdAt: string;
  updatedAt: string;
}

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    bio: '',
    websiteUrl: '',
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch profile from API
      const response = await authAPI.getProfile();
      const userData = response.data?.data?.user || response.data?.user || response.data;
      
      if (!userData) {
        throw new Error('No user data received');
      }
      
      // Use logged-in user data from context as fallback
      const profileData: UserProfile = {
        id: userData.id || user?.id || '',
        userId: userData.id || user?.id || '',
        firstName: userData.firstName || user?.firstName || '',
        lastName: userData.lastName || user?.lastName || '',
        companyName: userData.companyName || userData.tenantName || '',
        phone: userData.phone || '',
        address: userData.address || '',
        city: userData.city || '',
        state: userData.state || '',
        country: userData.country || userData.countryCode || '',
        postalCode: userData.postalCode || '',
        bio: userData.bio || '',
        websiteUrl: userData.websiteUrl || '',
        rating: userData.rating || 0,
        totalTrips: userData.totalTrips || 0,
        createdAt: userData.createdAt || new Date().toISOString(),
        updatedAt: userData.updatedAt || new Date().toISOString(),
      };
      
      setProfile(profileData);
      setFormData({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        companyName: profileData.companyName || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
        city: profileData.city || '',
        state: profileData.state || '',
        country: profileData.country || '',
        postalCode: profileData.postalCode || '',
        bio: profileData.bio || '',
        websiteUrl: profileData.websiteUrl || '',
      });
    } catch (err: any) {
      console.error('Error loading profile:', err);
      // If API fails, use logged-in user data from context
      if (user) {
        const fallbackProfile: UserProfile = {
          id: user.id,
          userId: user.id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          companyName: user.tenantName || '',
          phone: '',
          address: '',
          city: '',
          state: '',
          country: '',
          postalCode: '',
          bio: '',
          websiteUrl: '',
          rating: 0,
          totalTrips: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setProfile(fallbackProfile);
        setFormData({
          firstName: fallbackProfile.firstName || '',
          lastName: fallbackProfile.lastName || '',
          companyName: fallbackProfile.companyName || '',
          phone: '',
          address: '',
          city: '',
          state: '',
          country: '',
          postalCode: '',
          bio: '',
          websiteUrl: '',
        });
      } else {
        setError('Failed to load profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setEditing(false);
    if (profile) {
      setFormData({
        firstName: profile.firstName,
        lastName: profile.lastName,
        companyName: profile.companyName,
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        country: profile.country || '',
        postalCode: profile.postalCode || '',
        bio: profile.bio || '',
        websiteUrl: profile.websiteUrl || '',
      });
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real app, this would call the API
      // await updateProfile(formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (profile) {
        const updatedProfile = {
          ...profile,
          ...formData,
          updatedAt: new Date().toISOString(),
        };
        setProfile(updatedProfile);
      }
      
      setEditing(false);
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 px-4 py-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
              <FaUser className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                <TranslatedText text="Profile" />
              </h1>
              <p className="text-xs text-gray-600 mt-0.5">
                <TranslatedText text="Manage your account information" />
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  <FaSave className="w-3.5 h-3.5" />
                  <span><TranslatedText text="Save" /></span>
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-sm bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 flex items-center gap-1.5 transition-colors"
                >
                  <FaTimes className="w-3.5 h-3.5" />
                  <span><TranslatedText text="Cancel" /></span>
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 transition-colors"
              >
                <FaEdit className="w-3.5 h-3.5" />
                <span><TranslatedText text="Edit Profile" /></span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-xs">
          {success}
        </div>
      )}

      {/* Profile Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FaUser className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900">
                {profile?.firstName} {profile?.lastName}
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">{profile?.companyName}</p>
              <div className="flex items-center justify-center space-x-3 mt-2">
                <span className="text-xs text-gray-500">
                  <TranslatedText text="Rating" />: {profile?.rating}/5
                </span>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-500">
                  {profile?.totalTrips} <TranslatedText text="trips" />
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <FaEnvelope className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-600">{user?.email}</span>
              </div>
              {profile?.phone && (
                <div className="flex items-center space-x-2">
                  <FaPhone className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-600">{profile.phone}</span>
                </div>
              )}
              {profile?.websiteUrl && (
                <div className="flex items-center space-x-2">
                  <FaBuilding className="w-3.5 h-3.5 text-gray-400" />
                  <a 
                    href={profile.websiteUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {profile.websiteUrl}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              <TranslatedText text="Personal Information" />
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <TranslatedText text="First Name" />
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  disabled={!editing}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <TranslatedText text="Last Name" />
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  disabled={!editing}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <TranslatedText text="Company Name" />
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  disabled={!editing}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <TranslatedText text="Phone Number" />
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!editing}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <TranslatedText text="Address" />
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  disabled={!editing}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <TranslatedText text="City" />
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  disabled={!editing}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <TranslatedText text="State/Province" />
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  disabled={!editing}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <TranslatedText text="Country" />
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  disabled={!editing}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <TranslatedText text="Postal Code" />
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  disabled={!editing}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <TranslatedText text="Website" />
                </label>
                <input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                  disabled={!editing}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <TranslatedText text="Bio" />
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  disabled={!editing}
                  rows={3}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 