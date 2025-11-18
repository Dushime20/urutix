import React, { useState, useEffect } from 'react';
import { lendingApi } from '../services/lending/lendingApi';
import { 
  FaUser,
  FaBuilding,
  FaCog,
  FaBell,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCamera,
  FaEdit,
  FaTimes,
  FaExclamationTriangle,
  FaUniversity,
  FaPlus,
  FaDollarSign} from 'react-icons/fa';

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

interface SocialMedia {
  platform: string;
  url: string;
  verified: boolean;
}

const LenderProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<LenderProfile>({
    personal: {
      firstName: 'John',
      lastName: 'Davidson',
      email: 'john.davidson@lendingfirm.com',
      phone: '+1 (555) 123-4567',
      dateOfBirth: '1980-05-15',
      profileImage: '',
      title: 'Senior Lending Manager',
      bio: 'Experienced lending professional with over 15 years in commercial financing and risk assessment.'
    },
    business: {
      companyName: 'Davidson Capital Partners',
      registrationNumber: 'REG-123456789',
      taxId: 'TAX-987654321',
      businessType: 'Financial Services',
      industry: 'Commercial Lending',
      foundedYear: '2010',
      website: 'https://davidsoncapital.com',
      address: {
        street: '123 Financial District Ave',
        city: 'New York',
        state: 'NY',
        zipCode: '10013',
        country: 'United States'
      },
      description: 'Leading commercial lending firm specializing in logistics and transportation financing.',
      operationalCountries: ['United States', 'Canada', 'Mexico', 'United Kingdom', 'Germany'],
      supportedCurrencies: ['USD', 'CAD', 'EUR', 'GBP', 'MXN'],
      lendingCapacity: {
        minLoanAmount: 10000,
        maxLoanAmount: 5000000,
        totalCapacity: 50000000,
        availableCapacity: 35000000
      },
      specializations: ['Transportation & Logistics', 'Import/Export', 'Fleet Financing', 'Warehouse Financing'],
      certifications: ['ISO 9001:2015', 'SOC 2 Type II', 'PCI DSS Compliant']
    },
    banking: {
      accountName: 'Davidson Capital Partners',
      accountNumber: '****1234',
      routingNumber: '021000021',
      bankName: 'Chase Bank',
      swiftCode: 'CHASUS33'
    },
    preferences: {
      language: 'English',
      timezone: 'America/New_York',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      emailNotifications: true,
      smsNotifications: false,
      marketingEmails: true,
      twoFactorAuth: true
    },
    security: {
      lastPasswordChange: '2024-01-01',
      loginSessions: 3,
      securityQuestions: ['What was your first pet\'s name?', 'What city were you born in?']
    }
  });

  const [socialMedia, setSocialMedia] = useState<SocialMedia[]>([
    { platform: 'LinkedIn', url: 'https://linkedin.com/in/johndavidson', verified: true },
    { platform: 'Twitter', url: 'https://twitter.com/johndavidson', verified: false }
  ]);

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
        
        // Get lender ID from localStorage or context
        const lenderId = localStorage.getItem('lenderId') || 'default-lender-id';
        
        try {
          // Try to fetch comprehensive profile data from new API
          const profileData = await lendingApi.getLenderProfile(lenderId);
          
          if (profileData) {
            setProfile({
              personal: profileData.personal || profile.personal,
              business: profileData.business || profile.business,
              banking: profileData.banking || profile.banking,
              preferences: profileData.preferences || profile.preferences,
              security: profileData.security || profile.security
            });
          }
        } catch (profileError) {
          console.warn('Comprehensive profile API not available, trying basic lender data:', profileError);
          
          // Fallback to basic lender API
          const lenderData = await lendingApi.getLender(lenderId);
          
          if (lenderData) {
            setProfile(prev => ({
              ...prev,
              personal: {
                ...prev.personal,
                firstName: lenderData.name?.split(' ')[0] || prev.personal.firstName,
                lastName: lenderData.name?.split(' ').slice(1).join(' ') || prev.personal.lastName,
                email: lenderData.contact_email || prev.personal.email,
              },
              business: {
                ...prev.business,
                companyName: lenderData.name || prev.business.companyName,
              }
            }));
          }
        }
      } catch (error) {
        console.warn('Failed to load lender profile from API, using mock data:', error);
        setError('Failed to load profile data. Using demo data.');
        // Keep existing mock data as fallback
      } finally {
        setLoading(false);
      }
    };

    loadLenderProfile();
  }, []);

  const tabs = [
    { id: 'personal', name: 'Personal Info', icon: <FaUser className="h-4 w-4" /> },
    { id: 'business', name: 'Business Details', icon: <FaBuilding className="h-4 w-4" /> },
    { id: 'banking', name: 'Banking Info', icon: <FaUniversity className="h-4 w-4" /> },
    { id: 'preferences', name: 'Preferences', icon: <FaCog className="h-4 w-4" /> },
    { id: 'security', name: 'Security', icon: <FaLock className="h-4 w-4" /> },
    { id: 'notifications', name: 'Notifications', icon: <FaBell className="h-4 w-4" /> }
  ];

  const handleInputChange = (section: keyof LenderProfile, field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleNestedInputChange = (section: keyof LenderProfile, nestedSection: string, field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [nestedSection]: {
          ...(prev[section] as any)[nestedSection],
          [field]: value
        }
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const lenderId = localStorage.getItem('lenderId') || 'default-lender-id';
      
      try {
        // Try to use the comprehensive profile update API
        await lendingApi.updateLenderProfile(lenderId, {
          personal: profile.personal,
          business: profile.business,
          banking: profile.banking,
          preferences: profile.preferences
        });
        
        setHasUnsavedChanges(false);
        setIsEditing(null);
        setError(null);
        alert('Profile updated successfully!');
        
      } catch (comprehensiveError) {
        console.warn('Comprehensive profile update not available, trying section-specific updates:', comprehensiveError);
        
        // Fallback to section-specific updates
        const updatePromises = [];
        
        if (isEditing === 'personal' || !isEditing) {
          updatePromises.push(lendingApi.updateLenderPersonal(lenderId, profile.personal));
        }
        
        if (isEditing === 'business' || !isEditing) {
          updatePromises.push(lendingApi.updateLenderBusiness(lenderId, profile.business));
        }
        
        if (isEditing === 'banking' || !isEditing) {
          updatePromises.push(lendingApi.updateLenderBanking(lenderId, profile.banking));
        }
        
        if (isEditing === 'preferences' || !isEditing) {
          updatePromises.push(lendingApi.updateLenderPreferences(lenderId, profile.preferences));
        }
        
        await Promise.all(updatePromises);
        
        setHasUnsavedChanges(false);
        setIsEditing(null);
        setError(null);
        alert('Profile updated successfully!');
      }
      
    } catch (error) {
      console.error('Failed to save profile:', error);
      setError('Failed to save profile. Please try again.');
      alert('Failed to save profile. Please try again.');
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

  const renderPersonalTab = () => (
    <div className="space-y-6">
      {/* Profile Image */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h3>
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center">
              {profile.personal.profileImage ? (
                <img
                  src={profile.personal.profileImage}
                  alt="Profile"
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <FaUser className="h-12 w-12 text-blue-600" />
              )}
            </div>
            <button className="absolute bottom-0 right-0 h-8 w-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700">
              <FaCamera className="h-4 w-4" />
            </button>
          </div>
          <div>
            <h4 className="text-lg font-medium text-gray-900">
              {profile.personal.firstName} {profile.personal.lastName}
            </h4>
            <p className="text-gray-600">{profile.personal.title}</p>
            <div className="mt-3 flex gap-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Upload New Photo
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Remove Photo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
          <button
            onClick={() => setIsEditing(isEditing === 'personal' ? null : 'personal')}
            className="text-blue-600 hover:text-blue-800"
          >
            {isEditing === 'personal' ? <FaTimes className="h-4 w-4" /> : <FaEdit className="h-4 w-4" />}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            {isEditing === 'personal' ? (
              <input
                type="text"
                value={profile.personal.firstName}
                onChange={(e) => handleInputChange('personal', 'firstName', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-900">{profile.personal.firstName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            {isEditing === 'personal' ? (
              <input
                type="text"
                value={profile.personal.lastName}
                onChange={(e) => handleInputChange('personal', 'lastName', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-900">{profile.personal.lastName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            {isEditing === 'personal' ? (
              <input
                type="email"
                value={profile.personal.email}
                onChange={(e) => handleInputChange('personal', 'email', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-900">{profile.personal.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            {isEditing === 'personal' ? (
              <input
                type="tel"
                value={profile.personal.phone}
                onChange={(e) => handleInputChange('personal', 'phone', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-900">{profile.personal.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
            {isEditing === 'personal' ? (
              <input
                type="date"
                value={profile.personal.dateOfBirth}
                onChange={(e) => handleInputChange('personal', 'dateOfBirth', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-900">{new Date(profile.personal.dateOfBirth).toLocaleDateString()}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
            {isEditing === 'personal' ? (
              <input
                type="text"
                value={profile.personal.title}
                onChange={(e) => handleInputChange('personal', 'title', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-900">{profile.personal.title}</p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
          {isEditing === 'personal' ? (
            <textarea
              rows={4}
              value={profile.personal.bio}
              onChange={(e) => handleInputChange('personal', 'bio', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <p className="text-gray-900">{profile.personal.bio}</p>
          )}
        </div>

        {isEditing === 'personal' && (
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

  const renderBusinessTab = () => (
    <div className="space-y-6">
      {/* Company Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
          <button
            onClick={() => setIsEditing(isEditing === 'business' ? null : 'business')}
            className="text-blue-600 hover:text-blue-800"
          >
            {isEditing === 'business' ? <FaTimes className="h-4 w-4" /> : <FaEdit className="h-4 w-4" />}
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
            {isEditing === 'address' ? <FaTimes className="h-4 w-4" /> : <FaEdit className="h-4 w-4" />}
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
            {isEditing === 'operations' ? <FaTimes className="h-4 w-4" /> : <FaEdit className="h-4 w-4" />}
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
                      <FaTimes className="h-4 w-4" />
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
                  <FaPlus className="h-4 w-4" />
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
                      <FaTimes className="h-4 w-4" />
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
                  <FaPlus className="h-4 w-4" />
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
            {isEditing === 'capacity' ? <FaTimes className="h-4 w-4" /> : <FaEdit className="h-4 w-4" />}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Loan Amount</label>
            {isEditing === 'capacity' ? (
              <div className="relative">
                <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
                <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
                <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
            {isEditing === 'specializations' ? <FaTimes className="h-4 w-4" /> : <FaEdit className="h-4 w-4" />}
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
                      <FaTimes className="h-4 w-4" />
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
                  <FaPlus className="h-4 w-4" />
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
                      <FaTimes className="h-4 w-4" />
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
                  <FaPlus className="h-4 w-4" />
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

  const renderBankingTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Banking Information</h3>
          <button
            onClick={() => setIsEditing(isEditing === 'banking' ? null : 'banking')}
            className="text-blue-600 hover:text-blue-800"
          >
            {isEditing === 'banking' ? <FaTimes className="h-4 w-4" /> : <FaEdit className="h-4 w-4" />}
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

  const renderPreferencesTab = () => (
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

  const renderSecurityTab = () => (
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
                {showPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
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

  const renderNotificationsTab = () => (
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading profile...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <FaExclamationTriangle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!loading && (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaUser className="h-5 w-5 text-blue-600" />
                </div>
                <div>
              <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-gray-600">Manage your personal information and account preferences</p>
            </div>
          </div>

          {hasUnsavedChanges && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <FaExclamationTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-yellow-800">You have unsaved changes</span>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {renderTabContent()}
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LenderProfilePage;
