import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, Mail, Phone, Building2, MapPin, 
  Globe, Info, Save, Edit, Camera,
  Shield, Clock, Star, CheckCircle, FileCheck,
  Building, Bell, Lock, Activity,
  Smartphone, Languages, ShieldCheck, Settings, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { tenantApi, type TenantInfo } from '../services/tenantApi';
import { motion, AnimatePresence } from 'framer-motion';
import { KycManagementPage } from '../components/UserKYC/KycManagementPage';
import { toast } from 'react-hot-toast';
import AdminPageLayout from '../components/Admin/AdminPageLayout';
import { TranslatedText } from '../components/translated-text';
import CurrencySelector from '../components/common/CurrencySelector';

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
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showKycManagement, setShowKycManagement] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'organization' | 'security' | 'preferences'>('personal');

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

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const isTenantAdmin = useMemo(() => user?.role === 'TENANT_ADMIN', [user]);

  useEffect(() => {
    if (user) {
      loadProfile();
      if (isTenantAdmin && user.tenantId) {
        loadTenantInfo(user.tenantId);
      }
    }
  }, [user, isTenantAdmin]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getProfile();
      const userData = response.data?.data?.user || response.data?.user || response.data;

      if (!userData) throw new Error('No user data received');

      const u = userData;
      const p = userData.profile || {};
      
      const profileData: UserProfile = {
        id: u.id || user?.id || '',
        userId: u.id || user?.id || '',
        firstName: p.firstName || u.firstName || user?.firstName || '',
        lastName: p.lastName || u.lastName || user?.lastName || '',
        companyName: p.companyName || u.tenantName || '',
        phone: p.phone || u.phone || '',
        address: p.address || u.address || '',
        city: p.city || u.city || '',
        state: p.state || u.state || '',
        country: p.countryCode || p.country || u.country || '',
        postalCode: p.postalCode || u.postalCode || '',
        bio: p.bio || u.bio || '',
        websiteUrl: p.websiteUrl || u.websiteUrl || '',
        rating: p.rating || u.rating || 0,
        totalTrips: p.totalTrips || u.totalTrips || 0,
        createdAt: p.createdAt || u.createdAt || new Date().toISOString(),
        updatedAt: p.updatedAt || u.updatedAt || new Date().toISOString(),
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
      toast.error('Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  const loadTenantInfo = async (tenantId: string) => {
    try {
      const tenantData = await tenantApi.getTenantInfo(tenantId);
      setTenant(tenantData);
    } catch (err) {
      console.error('Error loading tenant info:', err);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await authAPI.updateProfile({
        profile: formData
      });
      
      const updatedUser = response.data?.data?.user || response.data?.user;
      if (updatedUser) {
        // Update local profile state
        setProfile(prev => prev ? { ...prev, ...formData, updatedAt: new Date().toISOString() } : null);
        toast.success('Profile updated successfully!');
      }
      setEditing(false);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setPasswordLoading(true);
      await authAPI.changePassword({
        currentPassword: passwordFormData.currentPassword,
        newPassword: passwordFormData.newPassword,
        confirmPassword: passwordFormData.confirmPassword,
      });
      toast.success('Password changed successfully! Please log in again.');
      setShowPasswordModal(false);
      setPasswordFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      // Optionally logout the user or redirect
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (showKycManagement) {
    return (
      <div className="relative">
        <button 
          onClick={() => setShowKycManagement(false)}
          className="absolute top-4 left-4 z-50 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-all flex items-center gap-2 text-sm font-bold"
        >
          <Info size={16} className="rotate-180" /> Back to Profile
        </button>
        <KycManagementPage />
      </div>
    );
  }

  const ProfileSkeleton = () => (
    <AdminPageLayout
      title={<TranslatedText text="Administrative Profile" />}
      description={<TranslatedText text="Manage your admin account details and preferences" />}
    >
      <div className="space-y-6 animate-pulse">
        <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-[48px]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-[24px]" />)}
        </div>
        <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-[24px]" />
      </div>
    </AdminPageLayout>
  );

  if (loading && !profile) return <ProfileSkeleton />;

  const profileContent = (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Premium Profile Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-72 md:h-96 bg-primary-950 rounded-[48px] overflow-hidden shadow-2xl border border-white/5 font-manrope"
      >
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-500/10 rounded-full -mr-64 -mt-64 blur-[140px]" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-success-500/5 rounded-full -ml-32 -mb-32 blur-[100px]" />
        
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-14 flex flex-col md:flex-row items-center md:items-end gap-10 bg-gradient-to-t from-primary-950 via-primary-950/60 to-transparent">
          <div className="relative group">
            <div className="w-36 h-36 md:w-48 md:h-48 bg-white/5 backdrop-blur-3xl rounded-[40px] border border-white/10 flex items-center justify-center text-6xl font-black text-primary-300 shadow-3xl shadow-black/40">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-[40px]" />
              ) : (
                <div className="flex">
                  {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                </div>
              )}
            </div>
            <button className="absolute -bottom-3 -right-3 p-4 bg-primary-500 text-white rounded-2xl shadow-2xl hover:bg-primary-600 transition-all border-4 border-primary-950 group-hover:scale-110">
              <Camera size={22} />
            </button>
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-center md:justify-start gap-3">
                 <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
                   {profile?.firstName} {profile?.lastName}
                 </h1>
                 <div className="hidden md:flex p-1.5 bg-emerald-500/20 rounded-full">
                    <CheckCircle size={20} className="text-emerald-400" />
                 </div>
              </div>
              <p className="text-primary-100/60 font-medium text-lg uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
                <Shield size={18} className="text-primary-300/50" /> {user?.role?.replace(/_/g, ' ')}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="px-5 py-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl flex items-center gap-2">
                <Star size={16} className="text-amber-400 fill-amber-400" />
                <span className="text-xs font-black text-white uppercase tracking-widest">{profile?.rating || 4.9} Trust Score</span>
              </div>
              <div className="px-5 py-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl flex items-center gap-2">
                <Activity size={16} className="text-primary-300" />
                <span className="text-xs font-black text-white uppercase tracking-widest">{profile?.totalTrips || 0} Total Ops</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            {editing ? (
              <div className="flex gap-3">
                <button 
                  onClick={handleSave} 
                  className="px-10 py-5 bg-primary-500 text-white rounded-[24px] text-sm font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-2xl shadow-primary-500/30 flex items-center gap-3"
                >
                  <Save size={20} /> Commit
                </button>
                <button 
                  onClick={() => setEditing(false)} 
                  className="px-8 py-5 bg-white/10 text-white rounded-[24px] text-sm font-black uppercase tracking-widest hover:bg-white/20 transition-all backdrop-blur-md"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setEditing(true)} 
                className="px-10 py-5 bg-white text-primary-900 rounded-[24px] text-sm font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-2xl flex items-center gap-3"
              >
                <Edit size={20} /> Edit Profile
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap gap-4 md:gap-8 border-b border-slate-100 dark:border-slate-800 pb-2">
        {[
          { id: 'personal', label: 'Personal Details', icon: User },
          ...(isTenantAdmin ? [{ id: 'organization', label: 'Company Info', icon: Building2 }] : []),
          { id: 'security', label: 'Security Settings', icon: ShieldCheck },
          { id: 'preferences', label: 'Site Settings', icon: Settings }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 pb-4 px-2 transition-all relative ${
              activeTab === tab.id 
                ? 'text-primary-600 dark:text-primary-400' 
                : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350'
            }`}
          >
            <tab.icon size={18} />
            <span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeProfileTab"
                className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500 rounded-t-full shadow-[0_-2px_8px_rgba(52,94,133,0.3)]"
              />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Sidebar Info Card */}
        <div className="lg:col-span-4 space-y-8">
          {/* Node Health Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden group">
            <div className="p-10 space-y-10">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Identity Verification</h3>
                <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest border border-emerald-100 dark:border-emerald-900/30">
                  Confirmed
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-5 group/item">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-[20px] border border-slate-100 dark:border-slate-800/50 group-hover/item:bg-primary-50 dark:group-hover/item:bg-primary-950/30 transition-colors">
                    <Mail size={22} className="text-primary-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Email Address</p>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-200 break-all">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5 group/item">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-[20px] border border-slate-100 dark:border-slate-800/50 group-hover/item:bg-primary-50 dark:group-hover/item:bg-primary-950/30 transition-colors">
                    <Phone size={22} className="text-primary-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Phone Number</p>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-200">{profile?.phone || 'Awaiting Input...'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5 group/item">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-[20px] border border-slate-100 dark:border-slate-800/50 group-hover/item:bg-primary-50 dark:group-hover/item:bg-primary-950/30 transition-colors">
                    <Clock size={22} className="text-primary-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Joined</p>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                      {new Date(profile?.createdAt || '').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100 dark:border-slate-800" />

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Identity Status</h3>
                   <button onClick={() => setShowKycManagement(true)} className="text-primary-500 dark:text-primary-400 text-[10px] font-black uppercase hover:underline">
                     Verification Center
                   </button>
                </div>
                <div className="p-6 bg-primary-950 dark:bg-slate-950/50 rounded-[32px] text-white relative overflow-hidden group/kyc-card border border-transparent dark:border-slate-800/80">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover/kyc-card:scale-125 transition-transform duration-500">
                    <FileCheck size={80} />
                  </div>
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-3">
                       <Shield size={20} className="text-primary-400" />
                       <span className="text-sm font-black uppercase tracking-tight">Level 2: Professional</span>
                    </div>
                    <p className="text-[10px] text-white/50 dark:text-slate-400 font-medium leading-relaxed">
                      Your identity is fully verified. You have maximum operational limits enabled.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Tab Content Area */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {activeTab === 'personal' && (
              <motion.div
                key="personal"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-xl p-12 lg:p-16 space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">First Name</label>
                      <div className="relative group/input">
                        <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-primary-500 transition-colors" />
                        <input
                          disabled={!editing}
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className="w-full pl-14 pr-7 py-5 bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-100 border-2 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 dark:focus:border-primary-400 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed rounded-[24px] font-black text-sm"
                          placeholder="Enter your first name"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Last Name</label>
                      <div className="relative group/input">
                        <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-primary-500 transition-colors" />
                        <input
                          disabled={!editing}
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className="w-full pl-14 pr-7 py-5 bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-100 border-2 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 dark:focus:border-primary-400 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed rounded-[24px] font-black text-sm"
                          placeholder="Enter your last name"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Professional Bio</label>
                      <div className="relative group/input">
                        <Info className="absolute left-6 top-6 w-4 h-4 text-slate-300 group-focus-within/input:text-primary-500 transition-colors" />
                        <textarea
                          disabled={!editing}
                          value={formData.bio}
                          onChange={(e) => handleInputChange('bio', e.target.value)}
                          className="w-full pl-14 pr-7 py-6 bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-100 border-2 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 dark:focus:border-primary-400 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed min-h-[160px] resize-none rounded-[32px] font-black text-sm"
                          placeholder="A short description about your professional background..."
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">City</label>
                      <div className="relative group/input">
                        <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-primary-500 transition-colors" />
                        <input
                          disabled={!editing}
                          type="text"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className="w-full pl-14 pr-7 py-5 bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-100 border-2 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 dark:focus:border-primary-400 outline-none transition-all disabled:opacity-60 rounded-[24px] font-black text-sm"
                          placeholder="Current Sector"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Country</label>
                      <div className="relative group/input">
                        <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-primary-500 transition-colors" />
                        <input
                          disabled={!editing}
                          type="text"
                          value={formData.country}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                          className="w-full pl-14 pr-7 py-5 bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-100 border-2 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 dark:focus:border-primary-400 outline-none transition-all disabled:opacity-60 rounded-[24px] font-black text-sm"
                          placeholder="Territorial Sovereign"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'organization' && tenant && (
              <motion.div
                key="organization"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                {/* Organization Node Card */}
                <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-xl p-12 lg:p-16 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                     <Building size={200} className="text-primary-500" />
                   </div>
                   
                   <div className="relative z-10 space-y-12">
                      <div className="flex items-center gap-8">
                         <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-[28px] flex items-center justify-center text-white text-4xl font-black shadow-3xl shadow-primary-500/20">
                             {tenant.name?.[0] || 'O'}
                         </div>
                         <div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{tenant.name || 'Organization'}</h2>
                            <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Tenant ID: {tenant.id?.split('-')[0] || 'N/A'}</p>
                         </div>
                      </div>

                      <div className="space-y-6 pt-6">
                         <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Company Contact Information</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="p-6 bg-slate-50/50 dark:bg-slate-800/40 rounded-[24px] border border-slate-50 dark:border-slate-800/50 space-y-1">
                               <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Email Address</span>
                               <p className="text-sm font-black text-slate-800 dark:text-slate-200">{tenant.contactInfo?.email || 'N/A'}</p>
                            </div>
                            <div className="p-6 bg-slate-50/50 dark:bg-slate-800/40 rounded-[24px] border border-slate-50 dark:border-slate-800/50 space-y-1">
                               <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Phone Number</span>
                               <p className="text-sm font-black text-slate-800 dark:text-slate-200">{tenant.contactInfo?.phone || 'N/A'}</p>
                            </div>
                            <div className="p-6 bg-slate-50/50 dark:bg-slate-800/40 rounded-[24px] border border-slate-50 dark:border-slate-800/50 space-y-1 md:col-span-2">
                               <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Office Address</span>
                               <p className="text-sm font-black text-slate-800 dark:text-slate-200">{tenant.contactInfo?.address || 'N/A'}</p>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-xl p-12 lg:p-16 space-y-12">
                   <div className="flex items-center gap-5">
                      <div className="p-4 bg-primary-50 dark:bg-primary-950/20 rounded-2xl">
                         <Lock size={24} className="text-primary-500" />
                      </div>
                      <div>
                         <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Security</h3>
                         <p className="text-sm font-bold text-slate-400 dark:text-slate-500">Manage your account security and authentication</p>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="p-10 border-2 border-slate-50 dark:border-slate-800 rounded-[40px] hover:border-primary-100 dark:hover:border-primary-900/50 transition-all group">
                         <div className="flex items-center justify-between">
                            <div className="space-y-1">
                               <h4 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Change Password</h4>
                               <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Update your password regularly to keep your account safe.</p>
                            </div>
                            <button 
                              onClick={() => setShowPasswordModal(true)}
                              className="px-8 py-3 bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black dark:hover:bg-slate-700 transition-all"
                            >
                               Initiate Change
                            </button>
                         </div>
                      </div>

                      <div className="p-10 border-2 border-slate-50 dark:border-slate-800 rounded-[40px] hover:border-primary-100 dark:hover:border-primary-900/50 transition-all flex items-center justify-between group">
                         <div className="flex items-center gap-6">
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl text-emerald-600 dark:text-emerald-400">
                               <Smartphone size={24} />
                            </div>
                            <div className="space-y-1">
                               <h4 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Two-Factor Authentication</h4>
                               <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Access your account with an extra layer of security.</p>
                            </div>
                         </div>
                         <div className="w-16 h-8 bg-emerald-100 dark:bg-emerald-950/40 rounded-full relative flex items-center px-1">
                            <div className="w-6 h-6 bg-emerald-600 dark:bg-emerald-500 rounded-full translate-x-8 transition-transform" />
                         </div>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'preferences' && (
              <motion.div
                key="preferences"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-xl p-12 lg:p-16 space-y-12">
                   <div className="flex items-center gap-5">
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl">
                         <Settings size={24} className="text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                         <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Preferences</h3>
                         <p className="text-sm font-bold text-slate-400 dark:text-slate-500">Customize your platform experience</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Preferred Language</label>
                         <div className="relative group">
                            <Languages className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                            <select className="w-full pl-14 pr-7 py-5 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-none rounded-[24px] font-black text-sm focus:ring-2 focus:ring-indigo-600 appearance-none">
                               <option className="dark:bg-slate-900">English (Direct)</option>
                               <option className="dark:bg-slate-900">Swahili (Regional)</option>
                               <option className="dark:bg-slate-900">French (Global)</option>
                            </select>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Timezone</label>
                         <div className="relative group">
                            <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                            <select className="w-full pl-14 pr-7 py-5 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-none rounded-[24px] font-black text-sm focus:ring-2 focus:ring-indigo-600 appearance-none">
                               <option className="dark:bg-slate-900">EAT (GMT+3:00)</option>
                               <option className="dark:bg-slate-900">UTC (GMT+0:00)</option>
                               <option className="dark:bg-slate-900">EST (GMT-5:00)</option>
                            </select>
                         </div>
                      </div>

                      <div className="space-y-2">
                         <CurrencySelector variant="settings" />
                         <p className="text-[10px] text-slate-400 dark:text-slate-500 pl-1 leading-relaxed">
                            All monetary values across the platform will display in your selected currency. Changes take effect immediately.
                         </p>
                      </div>

                      <div className="md:col-span-2">
                         <div className="p-8 bg-slate-50 dark:bg-slate-800/40 rounded-[32px] border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-5">
                               <div className="p-3 bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                  <Bell size={20} />
                               </div>
                               <div>
                                  <p className="text-sm font-black text-slate-800 dark:text-slate-200">Critical System Alerts</p>
                                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Receive desktop notifications for urgent trip reversals.</p>
                               </div>
                            </div>
                            <div className="w-12 h-6 bg-indigo-600 dark:bg-indigo-500 rounded-full relative flex items-center px-1">
                               <div className="w-4 h-4 bg-white rounded-full translate-x-6 transition-transform" />
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      {/* Password Change Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPasswordModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[40px] border border-transparent dark:border-slate-800 shadow-2xl overflow-hidden z-10"
            >
              <div className="p-8 lg:p-12 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-50 dark:bg-primary-950/20 rounded-2xl text-primary-600 dark:text-primary-400">
                      <Lock size={20} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Update Password</h3>
                  </div>
                  <button 
                    onClick={() => setShowPasswordModal(false)}
                    className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 dark:text-slate-500"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Current Password</label>
                    <input
                      type="password"
                      required
                      value={passwordFormData.currentPassword}
                      onChange={(e) => setPasswordFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-100 border-none rounded-2xl font-bold text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={passwordFormData.newPassword}
                      onChange={(e) => setPasswordFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-100 border-none rounded-2xl font-bold text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={passwordFormData.confirmPassword}
                      onChange={(e) => setPasswordFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-100 border-none rounded-2xl font-bold text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {passwordLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <ShieldCheck size={18} />
                          Update Password
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );

  if (isTenantAdmin) {
    return (
      <div className="flex flex-col h-full">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            <TranslatedText text="Tenant Admin Profile" />
          </h1>
          <p className="text-sm text-slate-400 font-medium mt-1">
            <TranslatedText text="Manage your account details and preferences" />
          </p>
        </div>
        {profileContent}
      </div>
    );
  }

  return (
    <AdminPageLayout
      title={<TranslatedText text="Administrative Profile" />}
      description={<TranslatedText text="Manage your admin account details and preferences" />}
    >
      {profileContent}
    </AdminPageLayout>
  );
};

export default Profile;