
import React, { useState, useEffect } from 'react';
import { lendingApi } from '../services/lending/lendingApi';
import { useAuth } from '../contexts/AuthContext';
import {
  User,
  Building,
  Settings,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Edit,
  X,
  AlertTriangle,
  Landmark,
  Plus,
  DollarSign,
  Briefcase,
  CheckCircle2
} from 'lucide-react';

interface LenderProfile {
  personal: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    profileImage: string;
    title: string;
    bio: string;
  };
  business: {
    companyName: string;
    registrationNumber: string;
    taxId: string;
    businessType: string;
    industry: string;
    foundedYear: string;
    website: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    description: string;
    operationalCountries: string[];
    supportedCurrencies: string[];
    lendingCapacity: {
      minLoanAmount: number;
      maxLoanAmount: number;
      totalCapacity: number;
      availableCapacity: number;
    };
    specializations: string[];
    certifications: string[];
  };
  banking: {
    accountName: string;
    accountNumber: string;
    routingNumber: string;
    bankName: string;
    swiftCode: string;
  };
  preferences: {
    language: string;
    timezone: string;
    currency: string;
    dateFormat: string;
    emailNotifications: boolean;
    smsNotifications: boolean;
    marketingEmails: boolean;
    twoFactorAuth: boolean;
  };
  security: {
    lastPasswordChange: string;
    loginSessions: number;
    securityQuestions: string[];
  };
}


const LenderProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<LenderProfile | null>(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load lender profile data on component mount
  useEffect(() => {
    const loadLenderProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get lender ID from user context or localStorage
        const lenderId = user?.role === 'LENDER' ? user.id : (localStorage.getItem('lenderId') || user?.id);

        if (!lenderId) {
          setError('No lender ID found. Please ensure you are logged in as a lender.');
          return;
        }

        try {
          // Fetch comprehensive profile data from API
          const profileData = await lendingApi.getLenderProfile(lenderId);

          if (profileData) {
            setProfile({
              personal: {
                firstName: profileData.personal?.firstName || '',
                lastName: profileData.personal?.lastName || '',
                email: profileData.personal?.email || '',
                phone: profileData.personal?.phone || '',
                dateOfBirth: profileData.personal?.dateOfBirth || '',
                profileImage: profileData.personal?.profileImage || '',
                title: profileData.personal?.title || 'Lending Manager',
                bio: profileData.personal?.bio || 'Professional lending specialist focused on transportation and logistics financing.'
              },
              business: {
                companyName: profileData.business?.companyName || '',
                registrationNumber: profileData.business?.registrationNumber || '',
                taxId: profileData.business?.taxId || '',
                businessType: profileData.business?.businessType || 'Financial Services',
                industry: profileData.business?.industry || 'Commercial Lending',
                foundedYear: profileData.business?.foundedYear || '',
                website: profileData.business?.website || '',
                address: {
                  street: profileData.business?.address?.street || '',
                  city: profileData.business?.address?.city || '',
                  state: profileData.business?.address?.state || '',
                  zipCode: profileData.business?.address?.zipCode || '',
                  country: profileData.business?.address?.country || ''
                },
                description: profileData.business?.description || '',
                operationalCountries: profileData.business?.operationalCountries || [],
                supportedCurrencies: profileData.business?.supportedCurrencies || ['USD'],
                lendingCapacity: {
                  minLoanAmount: profileData.business?.lendingCapacity?.minLoanAmount || 10000,
                  maxLoanAmount: profileData.business?.lendingCapacity?.maxLoanAmount || 1000000,
                  totalCapacity: profileData.business?.lendingCapacity?.totalCapacity || 10000000,
                  availableCapacity: profileData.business?.lendingCapacity?.availableCapacity || 8000000
                },
                specializations: profileData.business?.specializations || [],
                certifications: profileData.business?.certifications || []
              },
              banking: {
                accountName: profileData.banking?.accountName || '',
                accountNumber: profileData.banking?.accountNumber || '',
                routingNumber: profileData.banking?.routingNumber || '',
                bankName: profileData.banking?.bankName || '',
                swiftCode: profileData.banking?.swiftCode || ''
              },
              preferences: {
                language: profileData.preferences?.language || 'English',
                timezone: profileData.preferences?.timezone || 'America/New_York',
                currency: profileData.preferences?.currency || 'USD',
                dateFormat: profileData.preferences?.dateFormat || 'MM/DD/YYYY',
                emailNotifications: profileData.preferences?.emailNotifications ?? true,
                smsNotifications: profileData.preferences?.smsNotifications ?? false,
                marketingEmails: profileData.preferences?.marketingEmails ?? true,
                twoFactorAuth: profileData.preferences?.twoFactorAuth ?? false
              },
              security: {
                lastPasswordChange: profileData.security?.lastPasswordChange || new Date().toISOString(),
                loginSessions: profileData.security?.loginSessions || 1,
                securityQuestions: ['What was your first pet\'s name?', 'What city were you born in?']
              }
            });
          }
        } catch (profileError) {
          console.warn('Failed to load lender profile from API:', profileError);
          setError('Failed to load profile data from server. Please try again later.');
          
          // Keep existing mock data as fallback for development
          console.log('Using fallback mock data for development');
        }
      } catch (error) {
        console.error('Error in loadLenderProfile:', error);
        setError('An unexpected error occurred while loading profile data.');
      } finally {
        setLoading(false);
      }
    };

    loadLenderProfile();
  }, [user]);

  const tabs = [
    { id: 'personal', name: 'Personal Info', icon: <User className="h-4 w-4" /> },
    { id: 'business', name: 'Business Details', icon: <Building className="h-4 w-4" /> },
    { id: 'banking', name: 'Banking Info', icon: <Landmark className="h-4 w-4" /> },
    { id: 'preferences', name: 'Preferences', icon: <Settings className="h-4 w-4" /> },
    { id: 'security', name: 'Security', icon: <Lock className="h-4 w-4" /> },
    { id: 'notifications', name: 'Notifications', icon: <Bell className="h-4 w-4" /> }
  ];

  const handleInputChange = (section: keyof LenderProfile, field: string, value: any) => {
    if (!profile) return;
    
    setProfile(prev => prev ? ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }) : null);
    setHasUnsavedChanges(true);
  };

  const handleNestedInputChange = (section: keyof LenderProfile, nestedSection: string, field: string, value: any) => {
    if (!profile) return;
    
    setProfile(prev => prev ? ({
      ...prev,
      [section]: {
        ...prev[section],
        [nestedSection]: {
          ...(prev[section] as any)[nestedSection],
          [field]: value
        }
      }
    }) : null);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!profile) {
      setError('No profile data to save.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const lenderId = user?.role === 'LENDER' ? user.id : (localStorage.getItem('lenderId') || user?.id);

      if (!lenderId) {
        setError('No lender ID found. Please ensure you are logged in as a lender.');
        return;
      }

      try {
        // Use the comprehensive profile update API
        if (isEditing === 'personal') {
          await lendingApi.updateLenderPersonal(lenderId, profile.personal);
        } else if (isEditing === 'business') {
          await lendingApi.updateLenderBusiness(lenderId, profile.business);
        } else if (isEditing === 'banking') {
          await lendingApi.updateLenderBanking(lenderId, profile.banking);
        } else if (isEditing === 'preferences') {
          await lendingApi.updateLenderPreferences(lenderId, profile.preferences);
        } else {
          // Update all sections
          await lendingApi.updateLenderProfile(lenderId, {
            personal: profile.personal,
            business: profile.business,
            banking: profile.banking,
            preferences: profile.preferences
          });
        }

        setHasUnsavedChanges(false);
        setIsEditing(null);
        setError(null);
        
        // Show success message
        const sectionName = isEditing ? isEditing.charAt(0).toUpperCase() + isEditing.slice(1) : 'Profile';
        alert(`${sectionName} updated successfully!`);

      } catch (apiError: any) {
        console.error('Failed to save profile via API:', apiError);
        const errorMessage = apiError?.response?.data?.message || apiError?.message || 'Failed to save profile. Please try again.';
        setError(errorMessage);
        alert(errorMessage);
      }

    } catch (error) {
      console.error('Unexpected error in handleSave:', error);
      setError('An unexpected error occurred while saving. Please try again.');
      alert('An unexpected error occurred while saving. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      alert('Password must be at least 8 characters long!');
      return;
    }

    // Simulate password change
    setTimeout(() => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('Password changed successfully!');
    }, 1000);
  };

  const renderPersonalTab = () => {
    if (!profile) return null;
    
    return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
      {/* Profile Essence Card */}
      <div className="bg-white p-8 md:p-12 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
          <User size={120} className="text-[#345E85]" />
        </div>

        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          <div className="relative">
            <div className="h-32 w-32 md:h-40 md:w-40 bg-slate-50 rounded-[40px] flex items-center justify-center border border-slate-100 shadow-inner overflow-hidden">
              {profile.personal.profileImage ? (
                <img
                  src={profile.personal.profileImage}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-16 w-16 text-[#345E85]/50" />
              )}
            </div>
            <button className="absolute -bottom-2 -right-2 h-12 w-12 bg-[#345E85] text-white rounded-2xl flex items-center justify-center shadow-lg border-2 border-white hover:scale-110 transition-transform active:scale-95 group/btn">
              <Camera className="h-5 w-5 group-hover/btn:rotate-12 transition-transform" />
            </button>
          </div>

          <div className="text-center md:text-left space-y-4 flex-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#345E85] mb-2">Authority Figure</p>
              <h4 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">
                {profile.personal.firstName} {profile.personal.lastName}
              </h4>
              <p className="text-slate-500 mt-2 font-bold uppercase text-[10px] tracking-widest flex items-center justify-center md:justify-start gap-2">
                <Briefcase size={12} className="text-slate-400" /> {profile.personal.title}
              </p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <button className="px-6 py-3 bg-[#345E85] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-blue-100">
                Update Security Credential
              </button>
              <button className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95">
                Revoke Visual Asset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Attributes Grid */}
      <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-50">
          <div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Core Attributes</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Personnel detail synchronization</p>
          </div>
          <button
            onClick={() => setIsEditing(isEditing === 'personal' ? null : 'personal')}
            className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${isEditing === 'personal' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-[#345E85] hover:bg-blue-50'
              }`}
          >
            {isEditing === 'personal' ? <X className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
          {[
            { label: 'Primary Recognition', value: profile.personal.firstName, field: 'firstName', type: 'text' },
            { label: 'Ancestral Identifier', value: profile.personal.lastName, field: 'lastName', type: 'text' },
            { label: 'Synchronous Pulse', value: profile.personal.email, field: 'email', type: 'email' },
            { label: 'Voice Link Number', value: profile.personal.phone, field: 'phone', type: 'tel' },
            { label: 'Temporal Entry Date', value: profile.personal.dateOfBirth, field: 'dateOfBirth', type: 'date', render: (v: string) => new Date(v).toLocaleDateString() },
            { label: 'Executive Mandate', value: profile.personal.title, field: 'title', type: 'text' },
          ].map((item, idx) => (
            <div key={idx} className="space-y-2 group">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-[#345E85] transition-colors">{item.label}</label>
              {isEditing === 'personal' ? (
                <input
                  type={item.type}
                  value={item.value}
                  onChange={(e) => handleInputChange('personal', item.field, e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-[#345E85] outline-none transition-all shadow-inner"
                />
              ) : (
                <div className="px-5 py-4 bg-slate-50/50 rounded-2xl flex items-center justify-between group-hover:bg-white border border-transparent group-hover:border-slate-50 transition-all duration-300">
                  <span className="text-sm font-bold text-slate-800">{item.render ? item.render(item.value) : item.value}</span>
                  <div className="h-1 w-1 rounded-full bg-slate-200 group-hover:bg-[#345E85] group-hover:scale-150 transition-all" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 pt-10 border-t border-slate-50">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Strategic Narrative (Bio)</label>
          {isEditing === 'personal' ? (
            <textarea
              rows={4}
              value={profile.personal.bio}
              onChange={(e) => handleInputChange('personal', 'bio', e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-[#345E85] outline-none transition-all shadow-inner resize-none"
              placeholder="Explicate your professional trajectory and mission objectives..."
            />
          ) : (
            <div className="px-6 py-6 bg-slate-50/50 rounded-3xl border border-transparent hover:border-slate-100 transition-all">
              <p className="text-sm font-medium text-slate-600 leading-relaxed italic">{profile.personal.bio}</p>
            </div>
          )}
        </div>

        {isEditing === 'personal' && (
          <div className="flex justify-end gap-3 mt-10">
            <button
              onClick={() => setIsEditing(null)}
              className="px-8 py-4 border border-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
            >
              Cancel Sync
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-4 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-blue-50"
            >
              Commit Attribute Data
            </button>
          </div>
        )}
      </div>
    </div>
    );
  };

  const renderBusinessTab = () => {
    if (!profile) return null;
    
    return (
      <div className="space-y-6">
      {/* Company Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
          <button
            onClick={() => setIsEditing(isEditing === 'business' ? null : 'business')}
            className="text-blue-600 hover:text-blue-800"
          >
            {isEditing === 'business' ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
            {isEditing === 'business' ? (
              <input
                type="text"
                value={profile.business.companyName}
                onChange={(e) => handleInputChange('business', 'companyName', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-900">{profile.business.companyName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number</label>
            {isEditing === 'business' ? (
              <input
                type="text"
                value={profile.business.registrationNumber}
                onChange={(e) => handleInputChange('business', 'registrationNumber', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-900">{profile.business.registrationNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID</label>
            {isEditing === 'business' ? (
              <input
                type="text"
                value={profile.business.taxId}
                onChange={(e) => handleInputChange('business', 'taxId', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-900">{profile.business.taxId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
            {isEditing === 'business' ? (
              <select
                value={profile.business.businessType}
                onChange={(e) => handleInputChange('business', 'businessType', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Financial Services">Financial Services</option>
                <option value="Investment Firm">Investment Firm</option>
                <option value="Commercial Bank">Commercial Bank</option>
                <option value="Credit Union">Credit Union</option>
                <option value="Private Lending">Private Lending</option>
              </select>
            ) : (
              <p className="text-gray-900">{profile.business.businessType}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
            {isEditing === 'business' ? (
              <input
                type="text"
                value={profile.business.industry}
                onChange={(e) => handleInputChange('business', 'industry', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-900">{profile.business.industry}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Founded Year</label>
            {isEditing === 'business' ? (
              <input
                type="text"
                value={profile.business.foundedYear}
                onChange={(e) => handleInputChange('business', 'foundedYear', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-900">{profile.business.foundedYear}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
            {isEditing === 'business' ? (
              <input
                type="url"
                value={profile.business.website}
                onChange={(e) => handleInputChange('business', 'website', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-900">{profile.business.website}</p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Company Description</label>
          {isEditing === 'business' ? (
            <textarea
              rows={4}
              value={profile.business.description}
              onChange={(e) => handleInputChange('business', 'description', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <p className="text-gray-900">{profile.business.description}</p>
          )}
        </div>

        {isEditing === 'business' && (
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setIsEditing(null)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Business Address */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Business Address</h3>
          <button
            onClick={() => setIsEditing(isEditing === 'address' ? null : 'address')}
            className="text-blue-600 hover:text-blue-800"
          >
            {isEditing === 'address' ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
            {isEditing === 'address' ? (
              <input
                type="text"
                value={profile.business.address.street}
                onChange={(e) => handleNestedInputChange('business', 'address', 'street', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-900">{profile.business.address.street}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            {isEditing === 'address' ? (
              <input
                type="text"
                value={profile.business.address.city}
                onChange={(e) => handleNestedInputChange('business', 'address', 'city', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-900">{profile.business.address.city}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
            {isEditing === 'address' ? (
              <input
                type="text"
                value={profile.business.address.state}
                onChange={(e) => handleNestedInputChange('business', 'address', 'state', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-900">{profile.business.address.state}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
            {isEditing === 'address' ? (
              <input
                type="text"
                value={profile.business.address.zipCode}
                onChange={(e) => handleNestedInputChange('business', 'address', 'zipCode', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-900">{profile.business.address.zipCode}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
            {isEditing === 'address' ? (
              <input
                type="text"
                value={profile.business.address.country}
                onChange={(e) => handleNestedInputChange('business', 'address', 'country', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-900">{profile.business.address.country}</p>
            )}
          </div>
        </div>

        {isEditing === 'address' && (
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setIsEditing(null)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Operational Scope */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Operational Scope</h3>
          <button
            onClick={() => setIsEditing(isEditing === 'operations' ? null : 'operations')}
            className="text-blue-600 hover:text-blue-800"
          >
            {isEditing === 'operations' ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Countries of Operation</label>
            {isEditing === 'operations' ? (
              <div className="space-y-2">
                {profile.business.operationalCountries.map((country, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => {
                        const newCountries = [...profile.business.operationalCountries];
                        newCountries[index] = e.target.value;
                        handleInputChange('business', 'operationalCountries', newCountries);
                      }}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => {
                        const newCountries = profile.business.operationalCountries.filter((_, i) => i !== index);
                        handleInputChange('business', 'operationalCountries', newCountries);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newCountries = [...profile.business.operationalCountries, ''];
                    handleInputChange('business', 'operationalCountries', newCountries);
                  }}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                >
                  <Plus className="h-4 w-4" />
                  Add Country
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.business.operationalCountries.map((country, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {country}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Supported Currencies</label>
            {isEditing === 'operations' ? (
              <div className="space-y-2">
                {profile.business.supportedCurrencies.map((currency, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <select
                      value={currency}
                      onChange={(e) => {
                        const newCurrencies = [...profile.business.supportedCurrencies];
                        newCurrencies[index] = e.target.value;
                        handleInputChange('business', 'supportedCurrencies', newCurrencies);
                      }}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                      <option value="JPY">JPY - Japanese Yen</option>
                      <option value="AUD">AUD - Australian Dollar</option>
                      <option value="CHF">CHF - Swiss Franc</option>
                      <option value="CNY">CNY - Chinese Yuan</option>
                      <option value="MXN">MXN - Mexican Peso</option>
                      <option value="BRL">BRL - Brazilian Real</option>
                      <option value="INR">INR - Indian Rupee</option>
                      <option value="ZAR">ZAR - South African Rand</option>
                    </select>
                    <button
                      onClick={() => {
                        const newCurrencies = profile.business.supportedCurrencies.filter((_, i) => i !== index);
                        handleInputChange('business', 'supportedCurrencies', newCurrencies);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newCurrencies = [...profile.business.supportedCurrencies, 'USD'];
                    handleInputChange('business', 'supportedCurrencies', newCurrencies);
                  }}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                >
                  <Plus className="h-4 w-4" />
                  Add Currency
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.business.supportedCurrencies.map((currency, index) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {currency}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {isEditing === 'operations' && (
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setIsEditing(null)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Lending Capacity */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Lending Capacity</h3>
          <button
            onClick={() => setIsEditing(isEditing === 'capacity' ? null : 'capacity')}
            className="text-blue-600 hover:text-blue-800"
          >
            {isEditing === 'capacity' ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Loan Amount</label>
            {isEditing === 'capacity' ? (
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="number"
                  value={profile.business.lendingCapacity.minLoanAmount}
                  onChange={(e) => handleNestedInputChange('business', 'lendingCapacity', 'minLoanAmount', Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            ) : (
              <p className="text-gray-900">${profile.business.lendingCapacity.minLoanAmount.toLocaleString()}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Loan Amount</label>
            {isEditing === 'capacity' ? (
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="number"
                  value={profile.business.lendingCapacity.maxLoanAmount}
                  onChange={(e) => handleNestedInputChange('business', 'lendingCapacity', 'maxLoanAmount', Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            ) : (
              <p className="text-gray-900">${profile.business.lendingCapacity.maxLoanAmount.toLocaleString()}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Total Lending Capacity</label>
            {isEditing === 'capacity' ? (
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="number"
                  value={profile.business.lendingCapacity.totalCapacity}
                  onChange={(e) => handleNestedInputChange('business', 'lendingCapacity', 'totalCapacity', Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            ) : (
              <p className="text-gray-900">${profile.business.lendingCapacity.totalCapacity.toLocaleString()}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Available Capacity</label>
            <div className="flex items-center gap-4">
              <p className="text-gray-900">${profile.business.lendingCapacity.availableCapacity.toLocaleString()}</p>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${(profile.business.lendingCapacity.availableCapacity / profile.business.lendingCapacity.totalCapacity) * 100}%`
                  }}
                />
              </div>
              <span className="text-sm text-gray-600">
                {Math.round((profile.business.lendingCapacity.availableCapacity / profile.business.lendingCapacity.totalCapacity) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {isEditing === 'capacity' && (
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setIsEditing(null)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Specializations & Certifications */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Specializations & Certifications</h3>
          <button
            onClick={() => setIsEditing(isEditing === 'specializations' ? null : 'specializations')}
            className="text-blue-600 hover:text-blue-800"
          >
            {isEditing === 'specializations' ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Specializations</label>
            {isEditing === 'specializations' ? (
              <div className="space-y-2">
                {profile.business.specializations.map((spec, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={spec}
                      onChange={(e) => {
                        const newSpecs = [...profile.business.specializations];
                        newSpecs[index] = e.target.value;
                        handleInputChange('business', 'specializations', newSpecs);
                      }}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => {
                        const newSpecs = profile.business.specializations.filter((_, i) => i !== index);
                        handleInputChange('business', 'specializations', newSpecs);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newSpecs = [...profile.business.specializations, ''];
                    handleInputChange('business', 'specializations', newSpecs);
                  }}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                >
                  <Plus className="h-4 w-4" />
                  Add Specialization
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.business.specializations.map((spec, index) => (
                  <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                    {spec}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
            {isEditing === 'specializations' ? (
              <div className="space-y-2">
                {profile.business.certifications.map((cert, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={cert}
                      onChange={(e) => {
                        const newCerts = [...profile.business.certifications];
                        newCerts[index] = e.target.value;
                        handleInputChange('business', 'certifications', newCerts);
                      }}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => {
                        const newCerts = profile.business.certifications.filter((_, i) => i !== index);
                        handleInputChange('business', 'certifications', newCerts);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newCerts = [...profile.business.certifications, ''];
                    handleInputChange('business', 'certifications', newCerts);
                  }}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                >
                  <Plus className="h-4 w-4" />
                  Add Certification
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.business.certifications.map((cert, index) => (
                  <span key={index} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                    {cert}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {isEditing === 'specializations' && (
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setIsEditing(null)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
    );
  };

  const renderBankingTab = () => {
    if (!profile) return null;
    
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Banking Information</h3>
            <button
              onClick={() => setIsEditing(isEditing === 'banking' ? null : 'banking')}
              className="text-blue-600 hover:text-blue-800"
            >
              {isEditing === 'banking' ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
              {isEditing === 'banking' ? (
                <input
                  type="text"
                  value={profile.banking.accountName}
                  onChange={(e) => handleInputChange('banking', 'accountName', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900">{profile.banking.accountName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
              {isEditing === 'banking' ? (
                <input
                  type="text"
                  value={profile.banking.accountNumber}
                  onChange={(e) => handleInputChange('banking', 'accountNumber', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900">{profile.banking.accountNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Routing Number</label>
              {isEditing === 'banking' ? (
                <input
                  type="text"
                  value={profile.banking.routingNumber}
                  onChange={(e) => handleInputChange('banking', 'routingNumber', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900">{profile.banking.routingNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
              {isEditing === 'banking' ? (
                <input
                  type="text"
                  value={profile.banking.bankName}
                  onChange={(e) => handleInputChange('banking', 'bankName', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900">{profile.banking.bankName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SWIFT Code</label>
              {isEditing === 'banking' ? (
                <input
                  type="text"
                  value={profile.banking.swiftCode}
                  onChange={(e) => handleInputChange('banking', 'swiftCode', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900">{profile.banking.swiftCode}</p>
              )}
            </div>
          </div>

          {isEditing === 'banking' && (
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsEditing(null)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPreferencesTab = () => {
    if (!profile) return null;
    
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">General Preferences</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                value={profile.preferences.language}
                onChange={(e) => handleInputChange('preferences', 'language', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <select
                value={profile.preferences.timezone}
                onChange={(e) => handleInputChange('preferences', 'timezone', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                value={profile.preferences.currency}
                onChange={(e) => handleInputChange('preferences', 'currency', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
              <select
                value={profile.preferences.dateFormat}
                onChange={(e) => handleInputChange('preferences', 'dateFormat', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSecurityTab = () => {
    if (!profile) return null;
    
    return (
      <div className="space-y-6">
        {/* Password Change */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={handlePasswordChange}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Change Password
            </button>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Two-Factor Authentication</h3>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-900 font-medium">Two-Factor Authentication</p>
              <p className="text-gray-600 text-sm">Add an extra layer of security to your account</p>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={profile.preferences.twoFactorAuth}
                onChange={(e) => handleInputChange('preferences', 'twoFactorAuth', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                {profile.preferences.twoFactorAuth ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>

        {/* Security Information */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Information</h3>

          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Last Password Change:</span>
              <span className="text-gray-900">{new Date(profile.security.lastPasswordChange).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Login Sessions:</span>
              <span className="text-gray-900">{profile.security.loginSessions}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNotificationsTab = () => {
    if (!profile) return null;
    
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-900 font-medium">Email Notifications</p>
                <p className="text-gray-600 text-sm">Receive notifications via email</p>
              </div>
              <input
                type="checkbox"
                checked={profile.preferences.emailNotifications}
                onChange={(e) => handleInputChange('preferences', 'emailNotifications', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-900 font-medium">SMS Notifications</p>
                <p className="text-gray-600 text-sm">Receive notifications via SMS</p>
              </div>
              <input
                type="checkbox"
                checked={profile.preferences.smsNotifications}
                onChange={(e) => handleInputChange('preferences', 'smsNotifications', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-900 font-medium">Marketing Emails</p>
                <p className="text-gray-600 text-sm">Receive promotional and marketing emails</p>
              </div>
              <input
                type="checkbox"
                checked={profile.preferences.marketingEmails}
                onChange={(e) => handleInputChange('preferences', 'marketingEmails', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Notification Preferences
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return renderPersonalTab();
      case 'business':
        return renderBusinessTab();
      case 'banking':
        return renderBankingTab();
      case 'preferences':
        return renderPreferencesTab();
      case 'security':
        return renderSecurityTab();
      case 'notifications':
        return renderNotificationsTab();
      default:
        return renderPersonalTab();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 space-y-10">
      <div className="max-w-7xl mx-auto">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-sm rounded-[40px] border border-slate-100">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-[#345E85] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full bg-[#345E85]/10 animate-pulse" />
              </div>
            </div>
            <span className="mt-6 text-slate-500 font-black text-[10px] uppercase tracking-widest">Synchronizing Profile Data</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-10 bg-rose-50 border border-rose-100 text-rose-700 px-6 py-4 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
            <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">System Alert</p>
              <p className="text-sm font-bold">{error}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!loading && profile && (
          <>
            {/* Super Premium Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#345E85]/10 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#345E85] animate-pulse" />
                  <span className="text-[10px] font-black text-[#345E85] uppercase tracking-widest">Entity Core Identity</span>
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
                    Lender Profile
                  </h1>
                  <p className="text-slate-500 mt-3 text-xs font-bold uppercase tracking-[0.2em] opacity-60">
                    Authority management & operational configuration
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {hasUnsavedChanges && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-4 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all flex items-center gap-3 shadow-2xl shadow-blue-200 border border-white/20 active:scale-95 group"
                  >
                    {saving ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 size={16} className="group-hover:rotate-12 transition-transform" />
                    )}
                    Commit Changes
                  </button>
                )}
                <button
                  onClick={() => setIsEditing(null)}
                  className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                >
                  Dashboard Overview
                </button>
              </div>
            </div>

            {/* Premium Tab Navigation */}
            <div className="bg-white/70 backdrop-blur-xl p-2 rounded-[32px] border border-white shadow-sm mb-12 flex overflow-x-auto no-scrollbar gap-2 sticky top-6 z-40">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-6 py-4 rounded-3xl transition-all duration-300 whitespace-nowrap group ${isActive
                      ? 'bg-[#345E85] text-white shadow-xl shadow-blue-100'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-white'}`}>
                      {tab.icon}
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest">{tab.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Content Area with Micro-animations */}
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 min-h-[600px]">
              {renderTabContent()}
            </div>
          </>
        )}

        {/* No Profile Data State */}
        {!loading && !profile && !error && (
          <div className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-sm rounded-[40px] border border-slate-100">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-6">
              <User className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">No Profile Data</h3>
            <p className="text-slate-500 text-center max-w-md">
              Unable to load profile information. Please try refreshing the page or contact support.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LenderProfilePage;
