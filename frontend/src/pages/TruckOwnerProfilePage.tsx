import React, { useState, useEffect, useRef } from 'react';
import { authAPI, fleetAPI } from '../services/api';
import { documentApi } from '../services/documents/documentApi';
import { useAuth } from '../contexts/AuthContext';
import ModernLoader from '../components/common/ModernLoader';
import CurrencySelector from '../components/common/CurrencySelector';
import { 
  User, 
  Building, 
  ShieldCheck as Shield, 
  CreditCard,
  Camera,
  CheckCircle2,
  ChevronRight,
  Activity,
  Edit,
  Award,
  Mail,
  Phone,
  FileText,
  MapPin,
  Globe,
  Briefcase,
  Star,
  Target,
  UploadCloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, 
  Typography, 
  TextField, 
  IconButton,
  InputAdornment,
  MenuItem
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { toast } from 'react-hot-toast';
import { getApiErrorMessage } from '../config/errorMessages';
import { cn } from '../utils/cn';
interface TruckOwnerProfile {
  personal: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    bio: string;
    avatarUrl?: string;
  };
  business: {
    companyName: string;
    taxId: string;
    businessLicense: string;
    websiteUrl: string;
    address: string;
    city: string;
    postalCode: string;
    countryCode: string;
  };
  fleet: {
    totalTrucks: number;
    activeTrucks: number;
    totalDrivers: number;
    fleetAge: string;
    serviceRegions: string[];
    specializations: string[];
  };
  insurance: {
    policyNumber: string;
    provider: string;
    expiryDate: string;
    coverageAmount: string;
    status: 'Valid' | 'Expired' | 'Expiring Soon';
  };
  banking: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    routingNumber: string;
  };
  kyc: {
    status: string;
    level: string;
    verifiedAt?: string;
  };
  preferences: {
    currency: string;
  };
}

const AFRICAN_COUNTRIES = [
  { code: 'KE', name: 'Kenya' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'UG', name: 'Uganda' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'BI', name: 'Burundi' },
  { code: 'SS', name: 'South Sudan' },
  { code: 'CD', name: 'DR Congo' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'NG', name: 'Nigeria' },
];

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar (USD)' },
  { code: 'KES', name: 'Kenyan Shilling (KES)' },
  { code: 'TZS', name: 'Tanzanian Shilling (TZS)' },
  { code: 'UGX', name: 'Ugandan Shilling (UGX)' },
  { code: 'RWF', name: 'Rwandan Franc (RWF)' },
  { code: 'ZAR', name: 'South African Rand (ZAR)' },
  { code: 'EUR', name: 'Euro (EUR)' },
  { code: 'GBP', name: 'British Pound (GBP)' },
];

const TruckOwnerProfilePage: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const kycInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingKyc, setUploadingKyc] = useState(false);
  const [profile, setProfile] = useState<TruckOwnerProfile | null>(null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getProfile();
      const data = response.data;
      
      const fleetRes = await fleetAPI.getAnalytics().catch(() => ({ data: { totalTrucks: 0, activeTrucks: 0, totalDrivers: 0 } }));
      
      setProfile({
        personal: {
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.profile?.phone || '',
          bio: data.profile?.bio || '',
          avatarUrl: data.profile?.avatarUrl
        },
        business: {
          companyName: data.profile?.companyName || data.tenantName || '',
          taxId: data.profile?.taxId || '',
          businessLicense: data.profile?.businessLicense || '',
          websiteUrl: data.profile?.websiteUrl || '',
          address: data.profile?.address || '',
          city: '', 
          postalCode: data.profile?.postalCode || '',
          countryCode: data.profile?.countryCode || ''
        },
        fleet: {
          totalTrucks: fleetRes.data.totalTrucks || 0,
          activeTrucks: fleetRes.data.activeTrucks || 0,
          totalDrivers: fleetRes.data.totalDrivers || 0,
          fleetAge: '3.5 Years Average', 
          serviceRegions: ['East Africa', 'Southern Africa'],
          specializations: ['Refrigerated', 'General Cargo', 'Loose Cargo']
        },
        insurance: {
          policyNumber: data.profile?.insuranceInfo?.policyNumber || 'UX-99-00129',
          provider: data.profile?.insuranceInfo?.provider || 'Alliance Insurance',
          expiryDate: data.profile?.insuranceInfo?.expiryDate || '2025-12-20',
          coverageAmount: data.profile?.insuranceInfo?.coverage || '$250,000 PER LOAD',
          status: 'Valid'
        },
        banking: {
          accountName: data.profile?.bankAccountInfo?.accountName || '',
          accountNumber: data.profile?.bankAccountInfo?.accountNumber || '',
          bankName: data.profile?.bankAccountInfo?.bankName || '',
          routingNumber: data.profile?.bankAccountInfo?.routingNumber || ''
        },
        kyc: {
          status: data.kycStatus || 'PENDING',
          level: data.kycRequirementLevel || 'PREMIUM',
          verifiedAt: data.kycVerifiedAt
        },
        preferences: {
          currency: data.profile?.preferences?.currency || 'USD'
        }
      });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast.error(getApiErrorMessage(error));
    } finally {
      setTimeout(() => setLoading(false), 500); 
    }
  };

  const handleAvatarSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      toast.loading('Uploading avatar...', { id: 'avatar_upload' });

      const doc = await documentApi.createDocument({
        entityType: 'USER_PROFILE',
        entityId: user?.id || 'temp', // fallback if undefined
        documentType: 'AVATAR',
        category: 'PROFILE',
        title: 'Profile Picture'
      }, file);

      if (doc && doc.fileUrl) {
        setProfile(prev => prev ? {
          ...prev,
          personal: {
            ...prev.personal,
            avatarUrl: doc.fileUrl
          }
        } : null);
        
        toast.success('Avatar uploaded successfully! Click Save Changes to apply.', { id: 'avatar_upload' });
      }
    } catch (error: any) {
      console.error('Failed to upload avatar', error);
      toast.error(getApiErrorMessage(error), { id: 'avatar_upload' });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleKycUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingKyc(true);
      toast.loading('Uploading compliance document...', { id: 'kyc_upload' });

      await documentApi.createDocument({
        entityType: 'USER_PROFILE',
        entityId: user?.id || 'temp', 
        documentType: 'KYC_DOCUMENT',
        category: 'COMPLIANCE',
        title: file.name
      }, file);

      toast.success('Document uploaded successfully. It is now aligned with our Compliance team for review.', { id: 'kyc_upload' });
    } catch (error: any) {
      console.error('Failed to upload', error);
      toast.error(getApiErrorMessage(error), { id: 'kyc_upload' });
    } finally {
      setUploadingKyc(false);
      if (kycInputRef.current) kycInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    try {
      setSaving(true);
      const updateData = {
        profile: {
          firstName: profile.personal.firstName,
          lastName: profile.personal.lastName,
          phone: profile.personal.phone,
          bio: profile.personal.bio,
          companyName: profile.business.companyName,
          taxId: profile.business.taxId,
          businessLicense: profile.business.businessLicense,
          address: profile.business.address,
          postalCode: profile.business.postalCode,
          countryCode: profile.business.countryCode,
          websiteUrl: profile.business.websiteUrl,
          insuranceInfo: profile.insurance,
          bankAccountInfo: profile.banking,
          preferences: profile.preferences,
          avatarUrl: profile.personal.avatarUrl
        }
      };
      
      await authAPI.updateProfile(updateData);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (section: keyof TruckOwnerProfile, field: string, value: any) => {
    if (!profile) return;
    setProfile({
      ...profile,
      [section]: {
        ...(profile[section] as any),
        [field]: value
      }
    });
  };

  if (loading) {
    return <ModernLoader isLoading={true} type="page" />;
  }

  if (!profile) return null;

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* Profile Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 text-center md:text-left">
              {/* Avatar */}
              <div className="relative">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarSelect} 
                  accept="image/*" 
                  className="hidden" 
                />
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-24 h-24 md:w-32 md:h-32 bg-slate-50 dark:bg-slate-800/50 rounded-[28px] flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative group"
                >
                  {profile.personal.avatarUrl ? (
                    <img src={profile.personal.avatarUrl} alt="Avatar" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                  ) : (
                    <Typography className="text-4xl md:text-5xl font-black text-slate-300">
                      {profile.personal.firstName[0]}{profile.personal.lastName[0]}
                    </Typography>
                  )}
                  
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10">
                      <div className="w-8 h-8 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin"></div>
                    </div>
                  )}
                  
                  <div className="absolute bottom-2 right-2 z-20">
                    <IconButton 
                      size="small" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg p-1.5 shadow-md border border-slate-200 dark:border-slate-700 opacity-80 hover:opacity-100 transition-opacity"
                    >
                      <Camera size={14} />
                    </IconButton>
                  </div>
                </motion.div>
              </div>
          
          <div>
            <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
              <Typography variant="h3" className="font-black text-slate-900 dark:text-white tracking-tight text-2xl md:text-3xl" sx={{ color: '#0f172a' }}>
                {profile.personal.firstName} {profile.personal.lastName}
              </Typography>
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 border border-emerald-200">
                <CheckCircle2 size={14} />
              </div>
            </div>
            
            <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500 mb-5 tracking-wide">
              <Shield size={14} />
              <Typography className="text-[10px] font-black uppercase tracking-[0.2em]">TRUCK OWNER</Typography>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-full">
                <Star size={14} className="text-amber-500" fill="currentColor" />
                <Typography className="text-[10px] font-black text-slate-700 dark:text-slate-300 tracking-widest uppercase">4.85 Trust Score</Typography>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-full">
                <Activity size={14} className="text-primary-600" />
                <Typography className="text-[10px] font-black text-slate-700 dark:text-slate-300 tracking-widest uppercase">{profile.fleet.totalTrucks} Total Ops</Typography>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-4 bg-primary-500 text-white rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/20 group justify-center shrink-0"
        >
          <Edit size={14} className="group-hover:rotate-12 transition-transform" />
          {saving ? 'SAVING...' : 'SAVE CHANGES'}
        </button>
      </div>

      {/* Navigation Sub-Surface */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-2 flex flex-wrap items-center gap-1 shadow-sm">
        {[
          { id: 0, icon: User, label: "PERSONAL" },
          { id: 1, icon: Building, label: "BUSINESS" },
          { id: 2, icon: Shield, label: "COMPLIANCE" },
          { id: 3, icon: CreditCard, label: "BANKING" },
          { id: 4, icon: Target, label: "OPERATIONS" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id
              ? 'bg-primary-500 text-white shadow-xl shadow-primary-500/20'
              : 'text-slate-400 hover:text-primary-500 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Canvas */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-8 shadow-sm space-y-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 shadow-inner">
                    <User size={24} />
                  </div>
                  <div>
                    <Typography className="font-black text-slate-900 dark:text-white text-xl tracking-tight">Identity Details</Typography>
                    <Typography className="text-sm font-bold text-slate-500">Manage your primary contact information</Typography>
                  </div>
                </div>
                
                <Grid container spacing={5}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-4">FIRST NAME</Typography>
                    <TextField 
                      fullWidth 
                      value={profile.personal.firstName}
                      onChange={(e) => handleInputChange('personal', 'firstName', e.target.value)}
                      sx={inputStyles} 
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><User size={16} className="text-slate-400" /></InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-4">LAST NAME</Typography>
                    <TextField 
                      fullWidth 
                      value={profile.personal.lastName}
                      onChange={(e) => handleInputChange('personal', 'lastName', e.target.value)}
                      sx={inputStyles} 
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><User size={16} className="text-slate-400" /></InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-4">EMAIL ADDRESS</Typography>
                    <TextField 
                      fullWidth 
                      disabled 
                      value={profile.personal.email}
                      sx={inputStyles} 
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><Mail size={16} className="text-slate-300" /></InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-4">PHONE NUMBER</Typography>
                    <TextField 
                      fullWidth 
                      value={profile.personal.phone}
                      onChange={(e) => handleInputChange('personal', 'phone', e.target.value)}
                      sx={inputStyles} 
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><Phone size={16} className="text-slate-400" /></InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-4">BIOGRAPHY</Typography>
                    <TextField 
                      fullWidth 
                      multiline 
                      rows={4} 
                      value={profile.personal.bio}
                      onChange={(e) => handleInputChange('personal', 'bio', e.target.value)}
                      sx={{...inputStyles, '& .MuiOutlinedInput-root': { ...inputStyles['& .MuiOutlinedInput-root'], padding: '16px' } }} 
                      placeholder="Describe your operational background..."
                    />
                  </Grid>
                </Grid>
              </div>
            )}

            {activeTab === 1 && (
              <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-8 shadow-sm space-y-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                    <Building size={24} />
                  </div>
                  <div>
                    <Typography className="font-black text-slate-900 dark:text-white text-xl tracking-tight">Corporate Record</Typography>
                    <Typography className="text-sm font-bold text-slate-500">Official business registration details</Typography>
                  </div>
                </div>

                <Grid container spacing={5}>
                  <Grid size={{ xs: 12 }}>
                    <Typography className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-4">COMPANY REGISTERED NAME</Typography>
                    <TextField 
                      fullWidth 
                      value={profile.business.companyName}
                      onChange={(e) => handleInputChange('business', 'companyName', e.target.value)}
                      sx={inputStyles} 
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><Building size={16} className="text-slate-400" /></InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-4">TAX IDENTIFICATION (TIN)</Typography>
                    <TextField 
                      fullWidth 
                      value={profile.business.taxId}
                      onChange={(e) => handleInputChange('business', 'taxId', e.target.value)}
                      sx={inputStyles} 
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><FileText size={16} className="text-slate-400" /></InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-4">BUSINESS LICENSE NO.</Typography>
                    <TextField 
                      fullWidth 
                      value={profile.business.businessLicense}
                      onChange={(e) => handleInputChange('business', 'businessLicense', e.target.value)}
                      sx={inputStyles} 
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><Briefcase size={16} className="text-slate-400" /></InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-4">CORPORATE WEBSITE</Typography>
                    <TextField 
                      fullWidth 
                      value={profile.business.websiteUrl}
                      onChange={(e) => handleInputChange('business', 'websiteUrl', e.target.value)}
                      sx={inputStyles} 
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><Globe size={16} className="text-slate-400" /></InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-4">COUNTRY OF REGISTRATION</Typography>
                    <TextField 
                      select
                      fullWidth 
                      value={profile.business.countryCode || 'KE'}
                      onChange={(e) => handleInputChange('business', 'countryCode', e.target.value)}
                      sx={inputStyles}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><MapPin size={16} className="text-slate-400" /></InputAdornment>,
                      }}
                    >
                      {AFRICAN_COUNTRIES.map((country) => (
                        <MenuItem key={country.code} value={country.code} className="font-bold text-slate-700 dark:text-slate-300">
                          {country.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-4">PHYSICAL ADDRESS</Typography>
                    <TextField 
                      fullWidth 
                      multiline 
                      rows={2} 
                      value={profile.business.address}
                      onChange={(e) => handleInputChange('business', 'address', e.target.value)}
                      sx={{...inputStyles, '& .MuiOutlinedInput-root': { ...inputStyles['& .MuiOutlinedInput-root'], padding: '16px' } }} 
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><MapPin size={16} className="text-slate-400 self-start mt-1" /></InputAdornment>,
                      }}
                    />
                  </Grid>
                </Grid>
              </div>
            )}

            {activeTab === 2 && (
              <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-8 shadow-sm space-y-10">
                <Box className="p-8 md:p-10 rounded-[32px] bg-emerald-500/5 border border-emerald-500/10 flex flex-col md:flex-row items-center gap-6 shadow-sm">
                   <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-xl shadow-emerald-600/30 shrink-0">
                     <Shield size={40} />
                   </div>
                   <div className="text-center md:text-left">
                     <Typography className="text-emerald-950 font-black text-2xl tracking-tight mb-2">Compliance Shield Active</Typography>
                     <Typography className="text-emerald-700/80 text-sm font-bold leading-relaxed max-w-lg">
                       Your KYC status is currently <span className="uppercase font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded tracking-widest">{profile.kyc.status}</span>. You satisfy the {profile.kyc.level} level requirements.
                     </Typography>
                   </div>
                </Box>

                <Grid container spacing={5}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-4">INSURANCE PROVIDER</Typography>
                    <TextField 
                      fullWidth 
                      value={profile.insurance.provider}
                      onChange={(e) => handleInputChange('insurance', 'provider', e.target.value)}
                      sx={inputStyles} 
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><Shield size={16} className="text-slate-400" /></InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-4">POLICY NUMBER</Typography>
                    <TextField 
                      fullWidth 
                      value={profile.insurance.policyNumber}
                      onChange={(e) => handleInputChange('insurance', 'policyNumber', e.target.value)}
                      sx={inputStyles} 
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><FileText size={16} className="text-slate-400" /></InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-4">COVERAGE LIMIT</Typography>
                    <TextField 
                      fullWidth 
                      value={profile.insurance.coverageAmount}
                      onChange={(e) => handleInputChange('insurance', 'coverageAmount', e.target.value)}
                      sx={inputStyles} 
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><Award size={16} className="text-slate-400" /></InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-4">EXPIRY DATE</Typography>
                    <TextField 
                      fullWidth 
                      type="date"
                      value={profile.insurance.expiryDate}
                      onChange={(e) => handleInputChange('insurance', 'expiryDate', e.target.value)}
                      sx={inputStyles} 
                    />
                  </Grid>

                  {/* Document Uploader */}
                  <Grid size={{ xs: 12 }}>
                    <div className="mt-8 p-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[32px] bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center text-center transition-all hover:bg-white dark:bg-slate-900 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/10 group relative">
                      <input 
                        type="file" 
                        ref={kycInputRef} 
                        onChange={handleKycUpload} 
                        accept="image/*,application/pdf" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        title="Click to upload KYC document"
                        disabled={uploadingKyc}
                      />
                      <div className="w-16 h-16 rounded-[24px] bg-white dark:bg-slate-900 flex items-center justify-center text-emerald-500 shadow-sm mb-5 group-hover:scale-110 transition-transform duration-300 border border-slate-100 dark:border-slate-800 group-hover:bg-emerald-50">
                        {uploadingKyc ? (
                          <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
                        ) : (
                          <UploadCloud size={28} />
                        )}
                      </div>
                      <Typography className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight mb-2">Upload KYC Document</Typography>
                      <Typography className="text-sm font-medium text-slate-500 max-w-md mx-auto leading-relaxed">
                        Submit your Business License, Tax Registration, or National Identity documents to upgrade your verification tier. 
                        Support for PDF, JPG, and PNG formats.
                      </Typography>
                      {uploadingKyc && <Typography className="mt-4 text-emerald-600 font-bold text-xs tracking-widest uppercase">Transmitting encrypted file...</Typography>}
                    </div>
                  </Grid>
                </Grid>
              </div>
            )}

            {activeTab === 3 && (
              <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-8 shadow-sm space-y-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-inner">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <Typography className="font-black text-slate-900 dark:text-white text-xl tracking-tight">Financial Routing</Typography>
                    <Typography className="text-sm font-bold text-slate-500">Secure banking information for payouts</Typography>
                  </div>
                </div>

                <Grid container spacing={5}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-4">BANK NAME</Typography>
                    <TextField 
                      fullWidth 
                      value={profile.banking.bankName}
                      onChange={(e) => handleInputChange('banking', 'bankName', e.target.value)}
                      sx={inputStyles} 
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><Building size={16} className="text-slate-400" /></InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-4">ACCOUNT HOLDER NAME</Typography>
                    <TextField 
                      fullWidth 
                      value={profile.banking.accountName}
                      onChange={(e) => handleInputChange('banking', 'accountName', e.target.value)}
                      sx={inputStyles} 
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><User size={16} className="text-slate-400" /></InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-4">ACCOUNT NUMBER</Typography>
                    <TextField 
                      fullWidth 
                      value={profile.banking.accountNumber}
                      onChange={(e) => handleInputChange('banking', 'accountNumber', e.target.value)}
                      sx={inputStyles} 
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><CreditCard size={16} className="text-slate-400" /></InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-4">SWIFT/ROUTING CODE</Typography>
                    <TextField 
                      fullWidth 
                      value={profile.banking.routingNumber}
                      onChange={(e) => handleInputChange('banking', 'routingNumber', e.target.value)}
                      sx={inputStyles} 
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><Globe size={16} className="text-slate-400" /></InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-4">PREFERRED DISPLAY CURRENCY</Typography>
                    <CurrencySelector variant="settings" />
                    <p className="text-[10px] text-slate-400 mt-1.5 ml-2">
                      All monetary values will display in your selected currency. Changes take effect immediately.
                    </p>
                  </Grid>
                </Grid>
              </div>
            )}

            {activeTab === 4 && (
               <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-8 shadow-sm space-y-8">
                 <div className="flex items-center gap-4 mb-4">
                   <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 shadow-inner">
                     <Target size={24} />
                   </div>
                   <Typography className="font-black text-slate-950 text-xl tracking-tight leading-none">Market Reach</Typography>
                 </div>

                 <div className="space-y-4">
                   <Typography className="text-[10px] font-black text-slate-400 tracking-[0.2em] mb-4 ml-4">SERVICE DOMAINS</Typography>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {profile.fleet.serviceRegions.map(region => (
                       <div key={region} className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 hover:bg-slate-100 hover:shadow-md transition-all cursor-default">
                          <div className="flex items-center gap-3">
                            <MapPin size={16} className="text-primary-500" />
                            <Typography className="text-sm font-black text-slate-800 dark:text-slate-100">{region}</Typography>
                          </div>
                          <ChevronRight size={16} className="text-slate-300" />
                       </div>
                     ))}
                   </div>
                 </div>

                 <div className="space-y-4 pt-4">
                   <Typography className="text-[10px] font-black text-slate-400 tracking-[0.2em] mb-4 ml-4">SPECIALIZATIONS</Typography>
                   <div className="flex flex-wrap gap-2">
                     {profile.fleet.specializations.map(spec => (
                       <div key={spec} className="px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-xs font-black uppercase border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2">
                         <Shield size={14} className="text-primary-500" />
                         {spec}
                       </div>
                     ))}
                   </div>
                 </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const inputStyles = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '24px',
    backgroundColor: '#f8fafc',
    border: '2px solid transparent',
    padding: '4px 6px',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    '& fieldset': { border: 'none' },
    '&:hover': {
      backgroundColor: '#f1f5f9',
      borderColor: 'rgba(12, 74, 110, 0.05)'
    },
    '&.Mui-focused': {
      backgroundColor: undefined,
      boxShadow: '0 0 0 4px rgba(2, 132, 199, 0.1)',
      border: '2px solid #0284c7',
      '& .lucide': {
        color: '#0284c7',
        opacity: 1
      }
    }
  },
  '& .MuiInputBase-input': {
    fontSize: '0.95rem',
    fontWeight: 800,
    color: '#0f172a',
    padding: '16px 14px',
    letterSpacing: '-0.01em'
  },
  '& .MuiInputAdornment-root': {
    marginLeft: '12px',
    '& .lucide': {
      transition: 'all 0.3s'
    }
  }
};

export default TruckOwnerProfilePage;
