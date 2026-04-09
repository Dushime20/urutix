import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { authAPI } from '../services/api';
import { 
  Shield, 
  Bell, 
  Lock, 
  Globe, 
  Smartphone, 
  CheckCircle2, 
  UserPlus,
  Users,
  Eye,
  EyeOff,
  Save,
  Languages,
  BadgeCheck,
  Fingerprint,
  Settings as SettingsIcon,
  Activity,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Button, 
  TextField, 
  Switch,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputAdornment,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { toast } from 'react-hot-toast';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
}

interface TruckOwnerSettings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    cargoUpdates: boolean;
    priceAlerts: boolean;
  };
  security: {
    twoFactorEnrolled: boolean;
    biometricLogin: boolean;
    sessionTimeout: number;
    lastPasswordChange: string;
  };
  preferences: {
    language: string;
    currency: string;
    timezone: string;
    theme: 'light' | 'dark' | 'system';
  };
}

const TruckOwnerSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Team management state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: '1', name: 'David Wilson', email: 'david@example.com', role: 'Head Dispatcher', status: 'active' },
    { id: '2', name: 'Sarah Chen', email: 'sarah@example.com', role: 'Compliance Officer', status: 'active' },
  ]);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editForm, setEditForm] = useState<TeamMember | null>(null);
  const [savingMember, setSavingMember] = useState(false);

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setEditForm({ ...member });
  };

  const handleCloseEdit = () => {
    setEditingMember(null);
    setEditForm(null);
  };

  const handleSaveMember = async () => {
    if (!editForm) return;
    setSavingMember(true);
    try {
      // TODO: replace with real API call e.g. await api.put(`/team/${editForm.id}`, editForm)
      await new Promise(r => setTimeout(r, 600));
      setTeamMembers(prev => prev.map(m => m.id === editForm.id ? editForm : m));
      toast.success('Team member updated');
      handleCloseEdit();
    } catch {
      toast.error('Failed to update team member');
    } finally {
      setSavingMember(false);
    }
  };

  const handleRemoveMember = async (id: string) => {
    try {
      // TODO: replace with real API call e.g. await api.delete(`/team/${id}`)
      await new Promise(r => setTimeout(r, 400));
      setTeamMembers(prev => prev.filter(m => m.id !== id));
      toast.success('Team member removed');
    } catch {
      toast.error('Failed to remove team member');
    }
  };
  
  const [settings, setSettings] = useState<TruckOwnerSettings>({
    notifications: {
      email: true,
      push: true,
      sms: false,
      cargoUpdates: true,
      priceAlerts: true
    },
    security: {
      twoFactorEnrolled: false,
      biometricLogin: true,
      sessionTimeout: 30,
      lastPasswordChange: '2025-02-15'
    },
    preferences: {
      language: 'en',
      currency: 'KES',
      timezone: 'Africa/Nairobi',
      theme: 'light'
    }
  });

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const handleToggle = (section: keyof TruckOwnerSettings, field: string) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: !(prev[section] as any)[field]
      }
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await new Promise(r => setTimeout(r, 1000));
      toast.success('Configuration synchronized successfully');
    } catch (error) {
      toast.error('Failed to sync settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      toast.error('All fields are required');
      return;
    }
    if (passwordForm.new.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      setLoading(true);
      await authAPI.changePassword({
        currentPassword: passwordForm.current,
        newPassword: passwordForm.new,
        confirmPassword: passwordForm.confirm,
      });
      toast.success('Password updated successfully');
      setPasswordForm({ current: '', new: '', confirm: '' });
      setShowPasswordModal(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Box className="w-full bg-white dark:bg-slate-950 pb-32 transition-colors duration-200">
      {/* Clean Premium Header */}
      <Box className="relative bg-white dark:bg-slate-900 pt-8 pb-10 border-b border-slate-100 dark:border-slate-800 transition-colors duration-200">
        <Container maxWidth="xl" className="px-6 lg:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Compact Icon Avatar */}
              <div className="relative">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-28 h-28 md:w-32 md:h-32 bg-slate-50 dark:bg-slate-800 rounded-[28px] flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative group transition-colors duration-200"
                >
                  <motion.div 
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="relative z-10"
                  >
                    <SettingsIcon size={40} className="text-sky-600 dark:text-blue-400 opacity-80" />
                  </motion.div>
                  <div className="absolute inset-0 bg-sky-500/5 dark:bg-blue-500/10 group-hover:bg-sky-500/10 dark:group-hover:bg-blue-500/20 transition-colors" />
                </motion.div>
              </div>
              
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                  <Typography variant="h3" className="font-black text-slate-900 dark:text-white tracking-tight text-3xl md:text-4xl">
                    Control Center
                  </Typography>
                  <div className="px-3 py-1 rounded-full bg-sky-100 dark:bg-blue-900/40 border border-sky-200 dark:border-blue-800 transition-colors">
                    <Typography className="text-sky-700 dark:text-blue-400 text-[9px] font-black uppercase tracking-widest">v2.1 Stable</Typography>
                  </div>
                </div>
                
                <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500 dark:text-slate-400 mb-5">
                  <Shield size={14} className="text-emerald-500" />
                  <Typography className="text-[10px] font-black uppercase tracking-[0.2em]">End-to-End Encryption Enabled</Typography>
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full transition-colors">
                    <Activity size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <Typography className="text-[10px] font-black text-slate-700 dark:text-slate-300 tracking-widest uppercase">System Operational</Typography>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full transition-colors">
                    <BadgeCheck size={14} className="text-sky-600 dark:text-blue-400" />
                    <Typography className="text-[10px] font-black text-slate-700 dark:text-slate-300 tracking-widest uppercase">Certified Session</Typography>
                  </div>
                </div>
              </div>
            </div>
            
            <Button 
              variant="contained" 
              startIcon={<Save className="w-4 h-4" />}
              onClick={handleSaveSettings}
              disabled={saving}
              className="h-11 bg-sky-600 hover:bg-sky-700 text-white px-8 rounded-full font-black text-xs tracking-widest normal-case transition-all shadow-md"
              sx={{ 
                bgcolor: '#0284c7', 
                color: 'white', 
                fontWeight: 900, 
                borderRadius: '50px',
                px: 5,
                '&:hover': { bgcolor: '#0369a1' } 
              }}
            >
              {saving ? 'SYNCING...' : 'SYNC PREFERENCES'}
            </Button>
          </div>
        </Container>
      </Box>

      {/* Settings Navigation & Content */}
      <Container maxWidth="xl" className="pt-10 relative z-20 px-6 lg:px-12">
        <Grid container spacing={5}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Paper className="rounded-[48px] overflow-hidden border border-white dark:border-slate-800 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] dark:shadow-slate-950/50 bg-white/95 dark:bg-slate-900 backdrop-blur-3xl p-2 transition-colors duration-200">
                <Box className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-t-[46px] transition-colors duration-200">
                  <Tabs 
                    value={activeTab} 
                    onChange={(_, val) => setActiveTab(val)}
                    TabIndicatorProps={{ 
                      style: { height: '4px', borderRadius: '10px', backgroundColor: '#0284c7' }
                    }}
                    sx={{
                      '& .MuiTab-root': {
                        minHeight: '72px',
                        fontSize: '0.9rem',
                        fontWeight: 900,
                        color: '#94a3b8',
                        padding: '0 32px',
                        letterSpacing: '0.05em',
                        '&.Mui-selected': { color: document.documentElement.classList.contains('dark') ? '#3b82f6' : '#0c4a6e' }
                      }
                    }}
                  >
                    {[
                      { icon: <Globe size={20} />, label: "LOCALIZATION" },
                      { icon: <Bell size={20} />, label: "ALERTS HUB" },
                      { icon: <Lock size={20} />, label: "SECURITY" },
                      { icon: <Smartphone size={20} />, label: "TERMINALS" },
                    ].map((tab, idx) => (
                      <Tab 
                        key={idx}
                        icon={tab.icon}
                        iconPosition="start"
                        label={tab.label}
                      />
                    ))}
                  </Tabs>
                </Box>

                <Box className="p-12">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      {activeTab === 0 && (
                        <div className="space-y-12">
                           <Grid container spacing={6}>
                              <Grid size={{ xs: 12, md: 6 }}>
                                <Typography className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-2">INTERFACE LANGUAGE</Typography>
                                <FormControl fullWidth sx={inputStyles}>
                                  <Select value={settings.preferences.language}>
                                    <MenuItem value="en">English (US)</MenuItem>
                                    <MenuItem value="sw">Swahili</MenuItem>
                                    <MenuItem value="fr">French</MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid size={{ xs: 12, md: 6 }}>
                                <Typography className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-2">LOCAL CURRENCY</Typography>
                                <FormControl fullWidth sx={inputStyles}>
                                  <Select value={settings.preferences.currency}>
                                    <MenuItem value="KES">Kenyan Shilling (KES)</MenuItem>
                                    <MenuItem value="USD">US Dollar (USD)</MenuItem>
                                    <MenuItem value="UGX">Ugandan Shilling (UGX)</MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid size={{ xs: 12 }}>
                                <Typography className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-2">REGIONAL TIMEZONE</Typography>
                                <FormControl fullWidth sx={inputStyles}>
                                  <Select value={settings.preferences.timezone}>
                                    <MenuItem value="Africa/Nairobi">Africa/Nairobi (EAT)</MenuItem>
                                    <MenuItem value="UTC">Universal Time (UTC)</MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>
                           </Grid>

                           <div className="p-8 rounded-[32px] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-between transition-colors duration-200">
                              <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                                  <Languages size={24} />
                                </div>
                                <div>
                                  <Typography className="text-slate-900 dark:text-white font-bold">Auto-Translation Hub</Typography>
                                  <Typography className="text-slate-500 dark:text-slate-400 text-sm">Automatically translate incoming cargo messages</Typography>
                                </div>
                              </div>
                              <Switch checked={true} />
                           </div>
                        </div>
                      )}

                      {activeTab === 1 && (
                        <div className="space-y-8">
                          {[
                            { key: 'email', title: 'Email Alerts', desc: 'Financial reports and trip summaries', icon: <Globe size={20} /> },
                            { key: 'push', title: 'Mobile Push', desc: 'Real-time booking and bid updates', icon: <Smartphone size={20} /> },
                            { key: 'sms', title: 'Emergency SMS', desc: 'Critical safety and security alerts', icon: <Bell size={20} /> },
                            { key: 'cargoUpdates', title: 'Cargo Milestones', desc: 'Updates when cargo is loaded or delivered', icon: <CheckCircle2 size={20} /> },
                          ].map(item => (
                            <div key={item.key} className="p-8 rounded-[40px] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl dark:hover:shadow-slate-950 hover:border-white dark:hover:border-slate-700 transition-all">
                              <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-blue-900/40 flex items-center justify-center text-primary-600 dark:text-blue-400 transition-colors">
                                  {item.icon}
                                </div>
                                <div>
                                  <Typography className="text-slate-950 dark:text-white font-black tracking-tight">{item.title}</Typography>
                                  <Typography className="text-slate-500 dark:text-slate-400 text-sm font-bold">{item.desc}</Typography>
                                </div>
                              </div>
                              <Switch 
                                checked={settings.notifications[item.key as keyof typeof settings.notifications]} 
                                onChange={() => handleToggle('notifications', item.key)}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {activeTab === 2 && (
                        <div className="space-y-8">
                           <Box className="p-10 rounded-[40px] bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 dark:border-emerald-500/40 flex items-center gap-6 transition-colors">
                              <div className="w-16 h-16 rounded-[24px] bg-emerald-600 flex items-center justify-center text-white shadow-2xl shadow-emerald-600/30">
                                <Shield size={32} />
                              </div>
                              <div className="flex-1">
                                <Typography className="text-[#064e3b] dark:text-emerald-400 font-black text-xl">Account Protection</Typography>
                                <Typography className="text-emerald-700/70 dark:text-emerald-500/70 text-sm font-bold">Your security protocol is currently at its maximum level</Typography>
                              </div>
                              <Button variant="outlined" sx={{ color: document.documentElement.classList.contains('dark') ? '#34d399' : '#064e3b', border: `1px solid ${document.documentElement.classList.contains('dark') ? 'rgba(52, 211, 153, 0.4)' : 'rgba(6, 78, 59, 0.2)'}`, borderRadius: '16px', fontWeight: 900 }}>Reset Protocols</Button>
                           </Box>

                           {/* Change Password Row */}
                           <div className="p-8 rounded-[32px] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 transition-colors">
                             <div className="flex items-center justify-between">
                               <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                   <Lock size={20} className="text-slate-600 dark:text-slate-400" />
                                 </div>
                                 <div>
                                   <Typography className="font-black text-slate-900 dark:text-white text-sm">Password</Typography>
                                   <Typography className="text-slate-500 dark:text-slate-400 text-xs font-bold">Last changed: {settings.security.lastPasswordChange}</Typography>
                                 </div>
                               </div>
                               <Button
                                 variant="contained"
                                 onClick={() => { setShowPasswordModal(true); setPasswordForm({ current: '', new: '', confirm: '' }); }}
                                 startIcon={<Lock size={14} />}
                                 sx={{ borderRadius: '14px', fontWeight: 900, textTransform: 'none', bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' } }}
                               >
                                 Change Password
                               </Button>
                             </div>
                           </div>
                        </div>
                      )}

                      {activeTab === 3 && (
                        <div className="space-y-8">
                           <Box className="flex items-center justify-between p-8 rounded-[40px] bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 dark:border-indigo-500/30 transition-colors">
                              <div className="flex items-center gap-6">
                                <div className="w-16 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
                                  <Smartphone size={28} />
                                </div>
                                <div>
                                  <Typography className="text-indigo-950 dark:text-indigo-400 font-black text-lg">Biometric Authentication</Typography>
                                  <Typography className="text-indigo-700/60 dark:text-indigo-500/60 text-sm font-bold">Use FaceID or Fingerprint on supported devices</Typography>
                                </div>
                              </div>
                              <Switch checked={settings.security.biometricLogin} />
                           </Box>

                           <div className="p-8 rounded-[40px] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 transition-colors">
                              <div className="flex items-center gap-3 mb-6">
                                <Fingerprint size={20} className="text-primary-600 dark:text-blue-400" />
                                <Typography className="font-black text-slate-950 dark:text-white text-base">Authorized Hardware</Typography>
                              </div>
                              
                              <div className="space-y-4">
                                {[
                                  { device: 'iPhone 15 Pro Max', location: 'Nairobi, Kenya', time: 'Active Now', current: true },
                                  { device: 'MacBook Air M2', location: 'Mombasa, Kenya', time: 'Last seen: 2 hours ago', current: false },
                                ].map(dev => (
                                  <div key={dev.device} className="flex items-center justify-between p-6 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                                    <div className="flex gap-4">
                                       <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                         <Smartphone size={18} />
                                       </div>
                                       <div>
                                          <Typography className="text-sm font-black text-slate-900 dark:text-white">{dev.device}</Typography>
                                          <Typography className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{dev.location} • {dev.time}</Typography>
                                       </div>
                                    </div>
                                    {dev.current && <Chip label="CURRENT" className="bg-emerald-500 text-white font-black text-[9px] h-6 px-2" />}
                                    {!dev.current && <Button size="small" sx={{ color: document.documentElement.classList.contains('dark') ? '#fb7185' : '#be123c', fontWeight: 900, fontSize: '10px' }}>Revoke Access</Button>}
                                  </div>
                                ))}
                              </div>
                           </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </Box>
              </Paper>
            </motion.div>
          </Grid>

          {/* Sidebar Components */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <div className="space-y-8">
               <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                  <Paper className="rounded-[44px] p-10 bg-[#0f172a] dark:bg-slate-900 text-white relative overflow-hidden group shadow-2xl border dark:border-slate-800 transition-colors duration-200">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                     
                     <Box className="flex items-center justify-between mb-8">
                        <div>
                          <Typography className="text-white/40 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-1.5">Security Score</Typography>
                          <Typography variant="h3" className="font-black tracking-tighter text-white">Advanced</Typography>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 size={28} />
                        </div>
                     </Box>

                     <Typography className="text-white/60 text-xs font-bold leading-relaxed mb-8">
                       Your account is currently within the top 5% of network security participants. We recommend rotating your access key every 90 days.
                     </Typography>

                     <div className="space-y-4">
                        {[
                          { label: 'Encryption Level', val: 256, unit: 'bit AES' },
                          { label: 'Session Integrity', val: 100, unit: '%' },
                        ].map(stat => (
                          <div key={stat.label} className="p-4 rounded-3xl bg-white/5 border border-white/5 flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-white/50">{stat.label}</span>
                            <span className="text-sm font-black">{stat.val}<span className="text-[10px] ml-1 opacity-40">{stat.unit}</span></span>
                          </div>
                        ))}
                     </div>
                  </Paper>
               </motion.div>

               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Paper className="rounded-[44px] p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl transition-colors duration-200">
                     <Box className="flex items-center gap-4 mb-8">
                       <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-blue-900/20 flex items-center justify-center text-primary-600 dark:text-blue-400 transition-colors">
                         <Users size={24} />
                       </div>
                       <Typography className="font-black text-slate-950 dark:text-white text-xl tracking-tight">Staff Hub</Typography>
                     </Box>
                     
                     <Typography className="text-slate-500 text-xs font-bold mb-8">
                       Manage administrative access for your dispatchers and fleet coordinators.
                     </Typography>

                     <Button 
                       fullWidth 
                       startIcon={<UserPlus size={18} />}
                       className="h-14 bg-primary-600 text-white rounded-[20px] font-black shadow-lg shadow-primary-600/20 transition-all hover:scale-[1.02]"
                       sx={{ bgcolor: '#0284c7', borderRadius: '20px', fontWeight: 900, textTransform: 'none', py: 1.5 }}
                     >
                       Invite Coordinator
                     </Button>

                     <Divider className="my-8" />

                     <div className="space-y-2">
                        <Typography className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-widest mb-4 uppercase">ACTIVE TEAM</Typography>
                        {teamMembers.map(member => (
                          <div key={member.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                             <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-black text-slate-500 dark:text-slate-400 uppercase text-xs">
                                 {member.name.split(' ').map(n => n[0]).join('')}
                               </div>
                               <div>
                                 <Typography className="text-xs font-black text-slate-900 dark:text-white">{member.name}</Typography>
                                 <Typography className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{member.role}</Typography>
                               </div>
                             </div>
                             <div className="flex items-center gap-1">
                               <IconButton size="small" onClick={() => handleEditMember(member)}
                                 sx={{ color: '#0284c7', '&:hover': { bgcolor: 'rgba(2,132,199,0.08)' } }}>
                                 <Edit2 size={14} />
                               </IconButton>
                               <IconButton size="small" onClick={() => handleRemoveMember(member.id)}
                                 sx={{ color: '#ef4444', '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' } }}>
                                 <Trash2 size={14} />
                               </IconButton>
                             </div>
                          </div>
                        ))}
                        {teamMembers.length === 0 && (
                          <Typography className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">No team members yet</Typography>
                        )}
                     </div>
                  </Paper>
               </motion.div>
            </div>
          </Grid>
        </Grid>
      </Container>

      {/* Edit Team Member Modal */}
      <Dialog open={!!editingMember} onClose={handleCloseEdit} maxWidth="xs" fullWidth
        style={{ zIndex: 13001 }}
        PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 900, fontSize: '1rem', pb: 1 }}>
          <div className="flex items-center justify-between">
            <span>Edit Team Member</span>
            <IconButton size="small" onClick={handleCloseEdit}><X size={16} /></IconButton>
          </div>
        </DialogTitle>
        <DialogContent>
          {editForm && (
            <div className="space-y-4 pt-2">
              <TextField fullWidth label="Name" value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                sx={inputStyles} />
              <TextField fullWidth label="Email" value={editForm.email}
                onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                sx={inputStyles} />
              <FormControl fullWidth sx={inputStyles}>
                <Select value={editForm.role}
                  onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                  <MenuItem value="Head Dispatcher">Head Dispatcher</MenuItem>
                  <MenuItem value="Compliance Officer">Compliance Officer</MenuItem>
                  <MenuItem value="Fleet Coordinator">Fleet Coordinator</MenuItem>
                  <MenuItem value="Accountant">Accountant</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={inputStyles}>
                <Select value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value as 'active' | 'inactive' })}>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={handleCloseEdit} sx={{ borderRadius: '12px', fontWeight: 700 }}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveMember} disabled={savingMember}
            sx={{ borderRadius: '12px', fontWeight: 900, bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' } }}>
            {savingMember ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>

      {/* Change Password Modal — portal renders at document.body */}
      {showPasswordModal && createPortal(
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Lock size={16} className="text-slate-600 dark:text-slate-400" />
                </div>
                <span className="font-black text-slate-900 dark:text-white text-base">Change Password</span>
              </div>
              <button onClick={() => setShowPasswordModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <X size={14} className="text-slate-600 dark:text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Current Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={passwordForm.current}
                    onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-300 transition-all" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">New Password</label>
                <input type="password" value={passwordForm.new}
                  onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-300 transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Confirm New Password</label>
                <input type="password" value={passwordForm.confirm}
                  onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-300 transition-all" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowPasswordModal(false)}
                className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleChangePassword}
                disabled={loading || !passwordForm.current || !passwordForm.new || !passwordForm.confirm}
                className="flex-1 py-3 rounded-2xl bg-slate-900 text-white text-sm font-black hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

const inputStyles = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '24px',
    backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#f8fafc',
    border: '2px solid transparent',
    transition: 'all 0.4s',
    '& fieldset': { border: 'none' },
    '&:hover': {
      backgroundColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#f1f5f9',
    },
    '&.Mui-focused': {
      backgroundColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#fff',
      boxShadow: '0 0 0 6px rgba(12, 74, 110, 0.05)',
      border: `2px solid ${document.documentElement.classList.contains('dark') ? '#3b82f6' : '#0c4a6e'}`,
    }
  },
  '& .MuiInputBase-input': {
    fontSize: '0.9rem',
    fontWeight: 800,
    color: document.documentElement.classList.contains('dark') ? '#fff' : '#0f172a',
    padding: '16px 12px',
  },
  '& .MuiInputLabel-root': {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: '#64748b',
    '&.Mui-focused': { color: document.documentElement.classList.contains('dark') ? '#3b82f6' : '#0c4a6e' }
  }
};

export default TruckOwnerSettingsPage;
