import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Award, 
  Calendar as CalendarIcon,
  Shield,
  Edit2,
  Save,
  X,
  Camera,
  Truck,
  FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { TranslatedText } from '../translated-text';
import toast from 'react-hot-toast';

interface DriverProfileProps {
  driver: any;
  loading?: boolean;
}

export const DriverProfile: React.FC<DriverProfileProps> = ({ driver, loading }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: driver?.firstName || '',
    lastName: driver?.lastName || '',
    phone: driver?.phone || '',
    address: driver?.address || '',
    emergencyContact: driver?.emergencyContact || '',
    emergencyPhone: driver?.emergencyPhone || '',
  });

  const handleSave = async () => {
    // In a real app, this would call an API
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1000)),
      {
        loading: 'Saving profile...',
        success: 'Profile updated successfully',
        error: 'Failed to update profile',
      }
    );
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          <TranslatedText text="My Profile" />
        </h2>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            isEditing 
            ? 'bg-green-600 text-white hover:bg-green-700' 
            : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isEditing ? (
            <>
              <Save className="w-4 h-4" />
              <span><TranslatedText text="Save Changes" /></span>
            </>
          ) : (
            <>
              <Edit2 className="w-4 h-4" />
              <span><TranslatedText text="Edit Profile" /></span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="relative inline-block">
              <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-md">
                <User className="w-16 h-16 text-gray-400" />
              </div>
              {isEditing && (
                <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <h3 className="mt-4 text-xl font-bold text-gray-900">
              {driver?.firstName} {driver?.lastName}
            </h3>
            <p className="text-gray-500 text-sm">{driver?.licenseNumber || 'LIC-0000000'}</p>
            
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                {driver?.status || 'Active'}
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full flex items-center space-x-1">
                <Award className="w-3 h-3" />
                <span>{driver?.rating || '5.0'} Rating</span>
              </span>
            </div>

            <div className="mt-6 border-t pt-6 text-left space-y-4">
              <div className="flex items-center space-x-3 text-gray-600">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{user?.email}</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-600">
                <Phone className="w-4 h-4" />
                <span className="text-sm">{driver?.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{driver?.address || 'Nairobi, Kenya'}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span>Experience & Compliance</span>
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Joined</span>
                <span className="text-sm font-medium">{new Date(driver?.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Trips</span>
                <span className="text-sm font-medium">{driver?.totalTrips || '0'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Safe Miles</span>
                <span className="text-sm font-medium">{driver?.safeMiles || '0'} km</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">Personal & Vehicle Information</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{driver?.firstName}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{driver?.lastName}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">License Type</label>
                <p className="text-gray-900 font-medium">{driver?.licenseType || 'Heavy Commercial'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">License Expiry</label>
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-900 font-medium">{driver?.licenseExpiryDate || '2026-12-31'}</p>
                </div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Current Vehicle</label>
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <Truck className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-900">{driver?.vehiclePlate || 'KCA 123X'}</p>
                    <p className="text-xs text-blue-700">{driver?.vehicleModel || 'Isuzu FSR 33'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">Emergency Contact</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Name</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Mary Doe"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{driver?.emergencyContact || 'Not specified'}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</label>
                {isEditing ? (
                  <input 
                    type="tel" 
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({...formData, emergencyPhone: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. +254 700 000 000"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{driver?.emergencyPhone || 'Not specified'}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">Certifications & Training</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {[
                  { name: 'Defensive Driving Certificate', date: '2024-05-15', status: 'Valid' },
                  { name: 'First Aid Training', date: '2024-08-20', status: 'Valid' },
                  { name: 'Dangerous Goods Handling', date: '2024-02-10', status: 'Expiring Soon' }
                ].map((cert, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{cert.name}</p>
                        <p className="text-xs text-gray-500">Issued: {cert.date}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${
                      cert.status === 'Valid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {cert.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
