import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  User,
  Shield,
  Bell,
  Palette,
  Globe,
  Lock,
  Mail,
  Phone,
  MapPin,
  Save,
  Edit,
  CheckCircle,
  ShieldCheck,
  Smartphone,
  Languages,
  X,
  Eye,
  EyeOff,
  RefreshCw,
  Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { authAPI } from '../../services/api';
import api from '../../services/api';
import { getApiBaseUrl } from '../../config/environment';
import { getApiErrorMessage } from '../../config/errorMessages';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import { TranslatedText } from '../../components/translated-text';
import CurrencySelector from '../../components/common/CurrencySelector';
import { CurrencyManagementSection } from '../../components/Admin/CurrencyManagementSection';
import { cn } from '../../utils/cn';

type HubTab = 'profile' | 'security' | 'notifications' | 'preferences' | 'platform';

const AdminAccountHub: React.FC = () => {
  const { user } = useAuth();
  const { setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = useMemo<HubTab>(() => {
    const q = searchParams.get('tab') as HubTab | null;
    if (q && ['profile', 'security', 'notifications', 'preferences', 'platform'].includes(q)) {
      return q;
    }
    if (location.pathname.includes('/settings')) return 'platform';
    return 'profile';
  }, [location.pathname, searchParams]);

  const [activeTab, setActiveTab] = useState<HubTab>(initialTab);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    city: '',
    country: '',
    bio: '',
    email: '',
    role: '',
    createdAt: '',
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    cargoUpdates: true,
    priceAlerts: true,
    systemUpdates: false,
  });

  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
  });

  const [preferences, setPreferences] = useState({
    language: 'en',
    timezone: 'Africa/Nairobi',
    theme: 'light',
  });

  const [contactSettings, setContactSettings] = useState({
    phone: '',
    email: '',
    address: '',
  });
  const [savingContact, setSavingContact] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    loadAll();
  }, [user?.id]);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [profileRes, contactRes] = await Promise.all([
        authAPI.getProfile(),
        axios.get(`${getApiBaseUrl()}/settings/public/contact`).catch(() => null),
      ]);

      const userData =
        profileRes.data?.data?.user || profileRes.data?.user || profileRes.data || {};
      const p = userData.profile || {};

      setProfile({
        firstName: p.firstName || userData.firstName || user?.firstName || '',
        lastName: p.lastName || userData.lastName || user?.lastName || '',
        phone: p.phone || userData.phone || '',
        city: p.city || userData.city || '',
        country: p.countryCode || p.country || userData.country || '',
        bio: p.bio || userData.bio || '',
        email: userData.email || user?.email || '',
        role: userData.role || user?.role || '',
        createdAt: p.createdAt || userData.createdAt || '',
      });

      if (userData.preferences) setPreferences((prev) => ({ ...prev, ...userData.preferences }));
      if (userData.notifications) setNotifications((prev) => ({ ...prev, ...userData.notifications }));
      if (userData.security) setSecurity((prev) => ({ ...prev, ...userData.security }));

      if (contactRes?.data) {
        setContactSettings({
          phone: contactRes.data.phone || '',
          email: contactRes.data.email || '',
          address: contactRes.data.address || '',
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load account details');
    } finally {
      setLoading(false);
    }
  };

  const selectTab = (tab: HubTab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'profile' ? {} : { tab }, { replace: true });
    if (location.pathname.includes('/settings') && tab === 'profile') {
      navigate('/admin/profile', { replace: true });
    } else if (location.pathname.includes('/profile') && tab === 'platform') {
      // keep on profile route with ?tab=platform — fine
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await authAPI.updateProfile({
        profile: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          city: profile.city,
          country: profile.country,
          bio: profile.bio,
        },
      });
      toast.success('Profile updated');
      setEditing(false);
    } catch (err: any) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrefs = async () => {
    try {
      setSaving(true);
      await authAPI.updateProfile({
        preferences,
        notifications,
        security,
      } as any);
      toast.success('Settings saved');
    } catch (err: any) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContact = async () => {
    try {
      setSavingContact(true);
      await api.put('/admin/settings/bulk/contact', contactSettings);
      toast.success('Public contact settings saved');
    } catch (err: any) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSavingContact(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      setPasswordLoading(true);
      await authAPI.changePassword(passwordForm);
      toast.success('Password changed successfully');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const tabs: { id: HubTab; label: string; icon: React.ElementType; hint: string }[] = [
    { id: 'profile', label: 'Profile', icon: User, hint: 'Identity & contact' },
    { id: 'security', label: 'Security', icon: ShieldCheck, hint: 'Password & access' },
    { id: 'notifications', label: 'Notifications', icon: Bell, hint: 'Alerts & channels' },
    { id: 'preferences', label: 'Preferences', icon: Palette, hint: 'Display & locale' },
    { id: 'platform', label: 'Platform', icon: Building2, hint: 'Public & currencies' },
  ];

  const inputCls =
    'w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition-all disabled:opacity-60';

  if (loading) {
    return (
      <AdminPageLayout
        title={<TranslatedText text="Account & Settings" />}
        description={<TranslatedText text="Manage your administrative identity and platform configuration" />}
      >
        <div className="space-y-4 animate-pulse">
          <div className="h-36 bg-slate-100 dark:bg-slate-800 rounded-3xl" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3 h-80 bg-slate-100 dark:bg-slate-800 rounded-3xl" />
            <div className="lg:col-span-9 h-96 bg-slate-100 dark:bg-slate-800 rounded-3xl" />
          </div>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={<TranslatedText text="Account & Settings" />}
      description={<TranslatedText text="One place for your profile, security, and platform configuration" />}
    >
      <div className="space-y-8 pb-16">
        {/* Identity strip */}
        <div className="relative overflow-hidden rounded-3xl bg-[#0f172a] text-white border border-white/5 shadow-xl">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary-500/20 blur-3xl" />
          <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-2xl font-black tracking-tight">
              {(profile.firstName?.[0] || 'A')}
              {(profile.lastName?.[0] || '')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl md:text-3xl font-black tracking-tight truncate">
                  {profile.firstName} {profile.lastName}
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                  <CheckCircle size={12} /> Verified
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1 flex items-center gap-2">
                <Shield size={14} className="text-primary-300" />
                {profile.role?.replace(/_/g, ' ') || 'Administrator'}
                <span className="text-slate-500">·</span>
                <span className="truncate">{profile.email}</span>
              </p>
            </div>
            {activeTab === 'profile' && (
              <div className="flex gap-2">
                {editing ? (
                  <>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-5 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-black uppercase tracking-widest flex items-center gap-2"
                    >
                      <Save size={14} /> {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-black uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-5 py-3 rounded-xl bg-white text-slate-900 text-xs font-black uppercase tracking-widest flex items-center gap-2"
                  >
                    <Edit size={14} /> Edit Profile
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Side nav */}
          <aside className="lg:col-span-3">
            <nav className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-2 shadow-sm sticky top-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => selectTab(tab.id)}
                    className={cn(
                      'w-full flex items-start gap-3 px-4 py-3.5 rounded-2xl text-left transition-all',
                      active
                        ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300'
                        : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/60',
                    )}
                  >
                    <Icon size={18} className="mt-0.5 shrink-0" />
                    <span>
                      <span className="block text-xs font-black uppercase tracking-widest">{tab.label}</span>
                      <span className="block text-[10px] font-medium opacity-70 mt-0.5">{tab.hint}</span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Panels */}
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <motion.section
                  key="profile"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6"
                >
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
                      Personal details
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">How you appear across the admin console</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">First name</label>
                      <input disabled={!editing} className={inputCls} value={profile.firstName} onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Last name</label>
                      <input disabled={!editing} className={inputCls} value={profile.lastName} onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input disabled className={cn(inputCls, 'pl-10')} value={profile.email} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input disabled={!editing} className={cn(inputCls, 'pl-10')} value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">City</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input disabled={!editing} className={cn(inputCls, 'pl-10')} value={profile.city} onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Country</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input disabled={!editing} className={cn(inputCls, 'pl-10')} value={profile.country} onChange={(e) => setProfile((p) => ({ ...p, country: e.target.value }))} />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Bio</label>
                      <textarea
                        disabled={!editing}
                        rows={4}
                        className={cn(inputCls, 'resize-none')}
                        value={profile.bio}
                        onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                        placeholder="Short professional summary"
                      />
                    </div>
                  </div>
                </motion.section>
              )}

              {activeTab === 'security' && (
                <motion.section
                  key="security"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6"
                >
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">Security</h3>
                    <p className="text-xs text-slate-500 mt-1">Protect your administrative account</p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 dark:border-slate-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-950/30 text-primary-600">
                        <Lock size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Password</p>
                        <p className="text-xs text-slate-500 mt-0.5">Update your credentials regularly</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest"
                    >
                      Change password
                    </button>
                  </div>

                  <div className="rounded-2xl border border-slate-100 dark:border-slate-800 p-5 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600">
                        <Smartphone size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Two-factor authentication</p>
                        <p className="text-xs text-slate-500 mt-0.5">Extra verification on sign-in</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={security.twoFactorAuth}
                        onChange={(e) => setSecurity((s) => ({ ...s, twoFactorAuth: e.target.checked }))}
                      />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-primary-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                    </label>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                      Session timeout
                    </label>
                    <select
                      className={inputCls}
                      value={security.sessionTimeout}
                      onChange={(e) => setSecurity((s) => ({ ...s, sessionTimeout: Number(e.target.value) }))}
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={120}>2 hours</option>
                    </select>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSavePrefs}
                      disabled={saving}
                      className="px-6 py-3 rounded-xl bg-primary-600 text-white text-xs font-black uppercase tracking-widest hover:bg-primary-700"
                    >
                      {saving ? 'Saving…' : 'Save security'}
                    </button>
                  </div>
                </motion.section>
              )}

              {activeTab === 'notifications' && (
                <motion.section
                  key="notifications"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-5"
                >
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">Notifications</h3>
                    <p className="text-xs text-slate-500 mt-1">Choose what reaches you</p>
                  </div>
                  {[
                    { key: 'cargoUpdates', label: 'Operational updates', desc: 'Status changes across loads and trips' },
                    { key: 'priceAlerts', label: 'Pricing alerts', desc: 'Material rate and fee changes' },
                    { key: 'systemUpdates', label: 'System maintenance', desc: 'Planned downtime and releases' },
                    { key: 'push', label: 'Browser push', desc: 'Desktop notifications while signed in' },
                    { key: 'email', label: 'Email digest', desc: 'Summaries sent to your inbox' },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{item.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={Boolean(notifications[item.key as keyof typeof notifications])}
                          onChange={(e) =>
                            setNotifications((n) => ({ ...n, [item.key]: e.target.checked }))
                          }
                        />
                        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-primary-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                      </label>
                    </div>
                  ))}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSavePrefs}
                      disabled={saving}
                      className="px-6 py-3 rounded-xl bg-primary-600 text-white text-xs font-black uppercase tracking-widest hover:bg-primary-700"
                    >
                      {saving ? 'Saving…' : 'Save notifications'}
                    </button>
                  </div>
                </motion.section>
              )}

              {activeTab === 'preferences' && (
                <motion.section
                  key="preferences"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6"
                >
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">Preferences</h3>
                    <p className="text-xs text-slate-500 mt-1">Locale, theme, and display currency</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Language</label>
                      <div className="relative">
                        <Languages className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                          className={cn(inputCls, 'pl-10 appearance-none')}
                          value={preferences.language}
                          onChange={(e) => setPreferences((p) => ({ ...p, language: e.target.value }))}
                        >
                          <option value="en">English</option>
                          <option value="sw">Swahili</option>
                          <option value="fr">French</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Timezone</label>
                      <select
                        className={inputCls}
                        value={preferences.timezone}
                        onChange={(e) => setPreferences((p) => ({ ...p, timezone: e.target.value }))}
                      >
                        <option value="Africa/Nairobi">Nairobi (UTC+3)</option>
                        <option value="Africa/Kigali">Kigali (UTC+2)</option>
                        <option value="Africa/Kampala">Kampala (UTC+3)</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Theme</label>
                      <select
                        className={inputCls}
                        value={preferences.theme}
                        onChange={(e) => {
                          const theme = e.target.value;
                          setPreferences((p) => ({ ...p, theme }));
                          setTheme(theme as any);
                        }}
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>
                    <div>
                      <CurrencySelector variant="settings" />
                      <p className="text-[10px] text-slate-400 mt-1.5">
                        Monetary values display in your selected currency.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSavePrefs}
                      disabled={saving}
                      className="px-6 py-3 rounded-xl bg-primary-600 text-white text-xs font-black uppercase tracking-widest hover:bg-primary-700"
                    >
                      {saving ? 'Saving…' : 'Save preferences'}
                    </button>
                  </div>
                </motion.section>
              )}

              {activeTab === 'platform' && (
                <motion.section
                  key="platform"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-6"
                >
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
                    <div className="rounded-2xl border-l-4 border-primary-500 bg-primary-50/60 dark:bg-primary-950/20 p-4">
                      <p className="text-sm font-bold text-primary-900 dark:text-primary-200">Public website contact</p>
                      <p className="text-xs text-primary-800/70 dark:text-primary-300/70 mt-1">
                        Shown in the marketing site header and footer. Changes apply immediately.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Phone</label>
                        <input
                          className={inputCls}
                          value={contactSettings.phone}
                          onChange={(e) => setContactSettings((c) => ({ ...c, phone: e.target.value }))}
                          placeholder="+250788309463"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Email</label>
                        <input
                          className={inputCls}
                          type="email"
                          value={contactSettings.email}
                          onChange={(e) => setContactSettings((c) => ({ ...c, email: e.target.value }))}
                          placeholder="hello@urutix.com"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Address</label>
                        <input
                          className={inputCls}
                          value={contactSettings.address}
                          onChange={(e) => setContactSettings((c) => ({ ...c, address: e.target.value }))}
                          placeholder="Kigali, Rwanda · Nairobi, Kenya"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-between gap-3 pt-2">
                      <button
                        onClick={loadAll}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-600 dark:text-slate-300"
                      >
                        <RefreshCw size={14} /> Reset
                      </button>
                      <button
                        onClick={handleSaveContact}
                        disabled={savingContact}
                        className="px-6 py-2.5 rounded-xl bg-primary-600 text-white text-xs font-black uppercase tracking-widest hover:bg-primary-700 flex items-center gap-2"
                      >
                        <Save size={14} /> {savingContact ? 'Saving…' : 'Save contact'}
                      </button>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 md:p-8 shadow-sm">
                    <CurrencyManagementSection />
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Password modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowPasswordModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  Change password
                </h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
                {[
                  { key: 'currentPassword', label: 'Current password', show: showCurrentPassword, setShow: setShowCurrentPassword },
                  { key: 'newPassword', label: 'New password', show: showNewPassword, setShow: setShowNewPassword },
                  { key: 'confirmPassword', label: 'Confirm new password', show: showConfirmPassword, setShow: setShowConfirmPassword },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                      {field.label}
                    </label>
                    <div className="relative">
                      <input
                        required
                        type={field.show ? 'text' : 'password'}
                        className={cn(inputCls, 'pr-10')}
                        value={passwordForm[field.key as keyof typeof passwordForm]}
                        onChange={(e) =>
                          setPasswordForm((p) => ({ ...p, [field.key]: e.target.value }))
                        }
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => field.setShow(!field.show)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {field.show ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full py-3 rounded-xl bg-primary-600 text-white text-xs font-black uppercase tracking-widest hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {passwordLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck size={16} /> Update password
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminPageLayout>
  );
};

export default AdminAccountHub;
