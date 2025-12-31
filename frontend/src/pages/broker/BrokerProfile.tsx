import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type Broker } from '../../services/brokerApi';
import DocumentUpload from '../../components/broker/DocumentUpload';
import { 
  User, 
  Building2, 
  Phone, 
  Mail, 
  Percent, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  Upload,
  FileText,
  Loader2
} from 'lucide-react';

const BrokerProfile: React.FC = () => {
  const { user } = useAuth();
  const [broker, setBroker] = useState<Broker | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role === 'BROKER') {
      loadBrokerProfile();
    }
  }, [user]);

  const loadBrokerProfile = async () => {
    try {
      setLoading(true);
      const response = await brokerAPI.getBroker(user!.id);
      setBroker(response.data);
    } catch (err: any) {
      console.error('Failed to load broker profile:', err);
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broker) return;

    try {
      setUpdating(true);
      setError(null);
      setSuccess(null);
      
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      const updateData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        phone: formData.get('phone'),
        defaultCommissionRate: parseFloat(formData.get('commissionRate') as string),
      };

      await brokerAPI.updateBroker(broker.id, updateData);
      setSuccess('Profile updated successfully!');
      loadBrokerProfile();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!broker) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Broker profile not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">Broker Profile</h1>
        <p className="text-gray-600 mt-1">Manage your profile and verification status</p>
      </div>

      {/* Verification Status */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Email Verified</p>
                <p className="text-xs text-gray-500">Your email address is verified</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Verified
            </span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">KYC Documents</p>
                <p className="text-xs text-gray-500">Upload required documents for verification</p>
              </div>
            </div>
            <button className="px-3 py-1 bg-primary-100 text-primary-800 text-xs rounded-full hover:bg-primary-200">
              Upload
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Commission Account</p>
                <p className="text-xs text-gray-500">Add bank account for commission payouts</p>
              </div>
            </div>
            <button className="px-3 py-1 bg-primary-100 text-primary-800 text-xs rounded-full hover:bg-primary-200">
              Add Account
            </button>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
        <form onSubmit={handleUpdate} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                defaultValue={broker.profile?.firstName || ''}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                defaultValue={broker.profile?.lastName || ''}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                value={broker.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                defaultValue={broker.profile?.phone || ''}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="w-4 h-4 inline mr-2" />
                Company Name
              </label>
              <input
                type="text"
                value={broker.profile?.companyName || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>

            {/* Default Commission Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Percent className="w-4 h-4 inline mr-2" />
                Default Commission Rate (%)
              </label>
              <input
                type="number"
                name="commissionRate"
                min="0"
                max="100"
                step="0.1"
                defaultValue={broker.defaultCommissionRate || 0}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updating}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update Profile</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* KYC Documents Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">KYC Documents</h2>
        <DocumentUpload
          onUploadComplete={(files) => {
            console.log('Uploaded files:', files);
            setSuccess('Documents uploaded successfully!');
          }}
          maxFiles={5}
          acceptedTypes={['image/*', 'application/pdf']}
          maxSizeMB={10}
          label="Upload identification documents (ID, Passport, Business License)"
        />
      </div>
    </div>
  );
};

export default BrokerProfile;

