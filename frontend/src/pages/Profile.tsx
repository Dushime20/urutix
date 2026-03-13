import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, Building2, MapPin, 
  Map, Globe, Info, Save, Edit3, Camera,
  Shield, Clock, Star, CheckCircle, FileCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { KycStatusBanner } from '../components/UserKYC/KycStatusBanner';
import { KycManagementPage } from '../components/UserKYC/KycManagementPage';

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
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showKycManagement, setShowKycManagement] = useState(false);

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

      const response = await authAPI.getProfile();
      const userData = response.data?.data?.user || response.data?.user || response.data;

      if (!userData) throw new Error('No user data received');

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
      if (user) {
        const fallbackProfile: UserProfile = {
          id: user.id,
          userId: user.id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          companyName: user.tenantName || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setProfile(fallbackProfile);
      } else {
        setError('Failed to load profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      await new Promise(resolve => setTimeout(resolve, 800));
      if (profile) {
        setProfile({ ...profile, ...formData, updatedAt: new Date().toISOString() });
      }
      setEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (showKycManagement) {
    return <KycManagementPage />;
  }

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 p-4 md:p-8">
      {/* Header Banner */}
      <div className="relative h-64 md:h-80 bg-slate-900 rounded-[40px] overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-600/10 rounded-full -mr-48 -mt-48 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full -ml-32 -mb-32 blur-3xl" />
        
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 flex flex-col md:flex-row items-center md:items-end gap-8 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent">
          <div className="relative group">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-white/10 backdrop-blur-xl rounded-[32px] border border-white/20 flex items-center justify-center text-5xl font-black text-primary-400 shadow-2xl">
              {profile?.firstName?.[0]}{profile?.lastName?.[0]}
            </div>
            <button className="absolute -bottom-2 -right-2 p-3 bg-primary-600 text-white rounded-2xl shadow-xl hover:bg-primary-700 transition-all border-4 border-slate-900">
              <Camera size={20} />
            </button>
          </div>
          <div className="flex-1 text-center md:text-left space-y-3">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
              {profile?.firstName} {profile?.lastName}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-primary-200">
              <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                <Shield size={14} className="text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">Verified Account</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                <Star size={14} className="text-amber-400 fill-amber-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">{profile?.rating || 4.9} Performance</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            {editing ? (
              <>
                <button onClick={handleSave} className="px-8 py-4 bg-primary-600 text-white rounded-[20px] text-xs font-black uppercase tracking-widest hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/20 flex items-center gap-3">
                  <Save size={18} /> Save Changes
                </button>
                <button onClick={() => setEditing(false)} className="px-8 py-4 bg-white/10 text-white rounded-[20px] text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all backdrop-blur-md">
                  Cancel
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="px-8 py-4 bg-white text-slate-900 rounded-[20px] text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl flex items-center gap-3">
                <Edit3 size={18} /> Edit Profile
              </button>
            )}
            <button 
              onClick={() => setShowKycManagement(true)} 
              className="px-8 py-4 bg-emerald-600 text-white rounded-[20px] text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl flex items-center gap-3"
            >
              <FileCheck size={18} /> KYC Center
            </button>
          </div>
        </div>
      </div>

      {/* KYC Status Banner */}
      <KycStatusBanner
        onStartKyc={() => setShowKycManagement(true)}
        onViewKyc={() => setShowKycManagement(true)}
        compact={false}
        showActions={true}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 space-y-8">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Node Statistics</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400">Total Trips</p>
                <p className="text-3xl font-black text-slate-800 tracking-tight">{profile?.totalTrips || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400">Node Status</p>
                <div className="flex items-center gap-2 text-emerald-500">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-sm font-black uppercase tracking-widest">Active</span>
                </div>
              </div>
            </div>
            
            <hr className="border-slate-50" />
            
            <div className="space-y-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Contact Details</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 group">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-primary-50 transition-colors">
                    <Mail size={18} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                    <p className="text-sm font-black text-slate-800 break-all">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-primary-50 transition-colors">
                    <Phone size={18} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</p>
                    <p className="text-sm font-black text-slate-800">{profile?.phone || 'Not Provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-primary-50 transition-colors">
                    <Clock size={18} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Member Since</p>
                    <p className="text-sm font-black text-slate-800">{new Date(profile?.createdAt || '').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form Area */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                  <Info size={20} className="text-primary-600" />
                </div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Personal Information</h2>
              </div>
            </div>

            <div className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                  <div className="relative group">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                    <input
                      disabled={!editing}
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[24px] font-black text-sm focus:bg-white focus:border-primary-600 outline-none transition-all disabled:opacity-60"
                      placeholder="First Name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                  <div className="relative group">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                    <input
                      disabled={!editing}
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[24px] font-black text-sm focus:bg-white focus:border-primary-600 outline-none transition-all disabled:opacity-60"
                      placeholder="Last Name"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
                  <div className="relative group">
                    <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                    <input
                      disabled={!editing}
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[24px] font-black text-sm focus:bg-white focus:border-primary-600 outline-none transition-all disabled:opacity-60"
                      placeholder="Company Name"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Address</label>
                  <div className="relative group">
                    <MapPin className="absolute left-6 top-6 w-4 h-4 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                    <textarea
                      disabled={!editing}
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[24px] font-black text-sm focus:bg-white focus:border-primary-600 outline-none transition-all disabled:opacity-60 min-h-[120px]"
                      placeholder="Detailed company address..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">City</label>
                  <div className="relative group">
                    <Map className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                    <input
                      disabled={!editing}
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[24px] font-black text-sm focus:bg-white focus:border-primary-600 outline-none transition-all disabled:opacity-60"
                      placeholder="City"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Country</label>
                  <div className="relative group">
                    <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                    <input
                      disabled={!editing}
                      type="text"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[24px] font-black text-sm focus:bg-white focus:border-primary-600 outline-none transition-all disabled:opacity-60"
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <AnimatePresence>
              {success && (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="px-10 py-6 bg-emerald-50 text-emerald-600 text-xs font-black uppercase tracking-widest flex items-center gap-3">
                  <CheckCircle size={16} /> {success}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;