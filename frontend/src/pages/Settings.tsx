import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings as SettingsIcon,
  Bell,
  Lock,
  Palette,
  Users,
  UserPlus,
  Edit,
  Trash2,
  Check,
  Globe,
  Shield,
  Mail,
  Eye,
  EyeOff,
  DollarSign,
  Plus,
  RefreshCw,
  TrendingUp,
  Search,
  X,
  Phone,
  MapPin,
  Save,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import currencyApi from '../services/currencyApi';
import type {
  AdminCurrency,
  CreateCurrencyPayload,
  UpdateCurrencyPayload,
} from '../services/currencyApi';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { authAPI } from '../services/api';
import { fetchAllUsers, createTenantUser, updateUser, deleteUser } from '../services/adminApi';
import { TranslatedText } from '../components/translated-text';
import AdminPageLayout from '../components/Admin/AdminPageLayout';
import CurrencySelector from '../components/common/CurrencySelector';
import toast from 'react-hot-toast';
import { Dialog, DialogContent } from '../components/ui/Dialog';
import axios from 'axios';


const Settings: React.FC = () => {
  const { user } = useAuth();
  // const { setCurrency, availableCurrencies } = useCurrency(); // Removed
  const [activeTab, setActiveTab] = useState('general');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [contactSettings, setContactSettings] = useState({
    phone: '+250788309463',
    email: 'hello@urutix.com',
    address: 'Kigali, Rwanda · Nairobi, Kenya',
  });
  const [isSavingContact, setIsSavingContact] = useState(false);

  useEffect(() => {
    loadUserProfile();
    fetchContactSettings();
  }, [user]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getProfile();
      const userData = response.data?.data?.user || response.data?.user || response.data;
      setUserProfile(userData || user);

      // Initialize states from profile if available
      if (userData) {
        if (userData.preferences) setPreferences(userData.preferences);
        if (userData.notifications) setNotifications(userData.notifications);
        if (userData.security) setSecurity(userData.security);
      }
    } catch (err: any) {
      console.error('Error loading user profile:', err);
      setUserProfile(user);
    } finally {
      setLoading(false);
    }
  };

  const fetchContactSettings = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3005'}/api/settings/public/contact`);
      setContactSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch contact settings:', error);
    }
  };

  const handleSaveContactSettings = async () => {
    setIsSavingContact(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3005'}/api/admin/settings/category/contact`,
        contactSettings,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Contact settings saved successfully!');
    } catch (error) {
      console.error('Failed to save contact settings:', error);
      toast.error('Failed to save contact settings. Please try again.');
    } finally {
      setIsSavingContact(false);
    }
  };

  const loadReceivers = async () => {
    try {
      if (!user?.tenantId) return;
      const users = await fetchAllUsers(user.tenantId);
      // Filter or map users as needed. For now, assuming all tenant users are part of team
      setReceivers(users);
    } catch (err: any) {
      console.error('Error loading receivers:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'team') {
      loadReceivers();
    }
  }, [activeTab]);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    cargoUpdates: true,
    priceAlerts: true,
    systemUpdates: false,
  });

  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordChangeRequired: false,
  });

  const [preferences, setPreferences] = useState({
    language: 'en',
    timezone: 'Africa/Nairobi',
    currency: 'USD',
    theme: 'light',
  });

  // Cargo Receiver Management
  const [receivers, setReceivers] = useState<any[]>([]);

  const [showAddReceiver, setShowAddReceiver] = useState(false);
  const [editingReceiver, setEditingReceiver] = useState<any>(null);
  const [receiverForm, setReceiverForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '', // Needed for new users
    role: 'CARGO_RECEIVER',
    permissions: ['view_cargo'],
    // Payment workflow permissions
    paymentPermissions: {
      canInitiatePayments: false,
      canApprovePayments: false,
      canRequestPayments: false,
      canViewTransactions: true,
      canManageFinancing: false,
      canHandleInsurance: false,
      canProcessRefunds: false,
      canGenerateReports: false,
      canManageTeamPermissions: false,
      canHandleEscrow: false,
      canProcessThirdPartyPayments: false,
      canManageBankAccounts: false,
      canHandleMobileMoney: false,
      canProcessPlatformServices: false,
      canManageDocuments: false,
      canHandleCompliance: false,
    },
    // Document handling permissions
    documentPermissions: {
      canUploadDocuments: false,
      canViewDocuments: true,
      canEditDocuments: false,
      canDeleteDocuments: false,
      canShareDocuments: false,
      canGenerateReports: false,
      canHandleCompliance: false,
    },
    // Workflow permissions
    workflowPermissions: {
      canCreateWorkflows: false,
      canEditWorkflows: false,
      canDeleteWorkflows: false,
      canAssignTasks: false,
      canApproveSteps: false,
      canViewWorkflowHistory: true,
      canManageApprovals: false,
    },
  });
  
  // Password Change State
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSecurityChange = (key: string, value: any) => {
    setSecurity(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const { setTheme } = useTheme();

  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
    
    if (key === 'theme') {
      setTheme(value);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      await authAPI.updateProfile({
        preferences,
        notifications,
        security,
      } as any);
      toast.success('Settings saved successfully');
    } catch (err: any) {
      console.error('Error saving settings:', err);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  // Team Management Functions
  const handleAddReceiver = () => {
    setShowAddReceiver(true);
    setEditingReceiver(null);
    const isTruckOwner = user?.role === 'TRUCK_OWNER';
    setReceiverForm({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: isTruckOwner ? 'FLEET_MANAGER' : 'CARGO_RECEIVER',
      permissions: isTruckOwner ? ['manage_fleet'] : ['view_cargo'],
      paymentPermissions: {
        canInitiatePayments: false,
        canApprovePayments: false,
        canRequestPayments: false,
        canViewTransactions: true,
        canManageFinancing: false,
        canHandleInsurance: false,
        canProcessRefunds: false,
        canGenerateReports: false,
        canManageTeamPermissions: false,
        canHandleEscrow: false,
        canProcessThirdPartyPayments: false,
        canManageBankAccounts: false,
        canHandleMobileMoney: false,
        canProcessPlatformServices: false,
        canManageDocuments: false,
        canHandleCompliance: false,
      },
      documentPermissions: {
        canUploadDocuments: false,
        canViewDocuments: true,
        canEditDocuments: false,
        canDeleteDocuments: false,
        canShareDocuments: false,
        canGenerateReports: false,
        canHandleCompliance: false,
      },
      workflowPermissions: {
        canCreateWorkflows: false,
        canEditWorkflows: false,
        canDeleteWorkflows: false,
        canAssignTasks: false,
        canApproveSteps: false,
        canViewWorkflowHistory: true,
        canManageApprovals: false,
      },
    });
  };

  const handleEditReceiver = (receiver: any) => {
    setEditingReceiver(receiver);
    setShowAddReceiver(true);
    setReceiverForm({
      firstName: receiver.profile?.firstName || '',
      lastName: receiver.profile?.lastName || '',
      email: receiver.email,
      password: '', // Don't show password
      role: receiver.role,
      permissions: receiver.permissions || [],
      paymentPermissions: receiver.paymentPermissions || {
        canInitiatePayments: false,
        canApprovePayments: false,
        canRequestPayments: false,
        canViewTransactions: true,
        canManageFinancing: false,
        canHandleInsurance: false,
        canProcessRefunds: false,
        canGenerateReports: false,
        canManageTeamPermissions: false,
        canHandleEscrow: false,
        canProcessThirdPartyPayments: false,
        canManageBankAccounts: false,
        canHandleMobileMoney: false,
        canProcessPlatformServices: false,
        canManageDocuments: false,
        canHandleCompliance: false,
      },
      documentPermissions: receiver.documentPermissions || {
        canUploadDocuments: false,
        canViewDocuments: true,
        canEditDocuments: false,
        canDeleteDocuments: false,
        canShareDocuments: false,
        canGenerateReports: false,
        canHandleCompliance: false,
      },
      workflowPermissions: receiver.workflowPermissions || {
        canCreateWorkflows: false,
        canEditWorkflows: false,
        canDeleteWorkflows: false,
        canAssignTasks: false,
        canApproveSteps: false,
        canViewWorkflowHistory: true,
        canManageApprovals: false,
      },
    });
  };

  const handleDeleteReceiver = async (receiverId: string) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      try {
        await deleteUser(receiverId);
        toast.success('Team member removed');
        loadReceivers();
      } catch (err) {
        toast.error('Failed to remove team member');
      }
    }
  };

  const handleSaveReceiver = async () => {
    if (!receiverForm.firstName || !receiverForm.email || (!editingReceiver && !receiverForm.password)) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      if (editingReceiver) {
        await updateUser(editingReceiver.id, {
          firstName: receiverForm.firstName,
          lastName: receiverForm.lastName,
          role: receiverForm.role,
          // Only update email if changed? usually safer to keep fixed or separate flow
        });
        toast.success('Team member updated');
      } else {
        if (!user?.tenantId) return;
        await createTenantUser(user.tenantId, {
          firstName: receiverForm.firstName,
          lastName: receiverForm.lastName,
          email: receiverForm.email,
          password: receiverForm.password,
          role: receiverForm.role,
          permissions: receiverForm.permissions,
          paymentPermissions: receiverForm.paymentPermissions,
          documentPermissions: receiverForm.documentPermissions,
          workflowPermissions: receiverForm.workflowPermissions,
        } as any);
        toast.success('Team member added');
      }
      setShowAddReceiver(false);
      loadReceivers();
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await authAPI.changePassword(passwordForm);
      toast.success('Password changed successfully');
      setShowChangePassword(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      console.error('Error changing password:', err);
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setReceiverForm(prev => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, permission]
        : prev.permissions.filter(p => p !== permission)
    }));
  };

  const handleNestedPermissionChange = (category: string, field: string, checked: boolean) => {
    setReceiverForm(prev => ({
      ...prev,
      [category]: {
        ...(prev as any)[category],
        [field]: checked
      }
    }));
  };

  const renderPermissionGroup = (title: string, data: any, category: string) => (
    <div className="mt-8 pt-8 border-t border-gray-100 dark:border-slate-800">
      <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 italic">
        {title}
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Object.entries(data).map(([field, value]) => (
          <label key={field} className="flex items-center gap-3 p-3 border border-gray-100 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors group">
            <input
              type="checkbox"
              checked={value as boolean}
              onChange={(e) => handleNestedPermissionChange(category, field, e.target.checked)}
              className="w-4 h-4 text-[#2c5173] border-gray-300 dark:border-slate-700 rounded focus:ring-[#2c5173]"
            />
            <span className="text-[10px] font-black text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-white uppercase tracking-widest leading-tight italic">
              {field.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
            </span>
          </label>
        ))}
      </div>
    </div>
  );

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'team', label: 'Team Management', icon: Users },
    { id: 'system', label: 'System Settings', icon: Globe },
  ];

  const settingsContent = (
    <>
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="border-b border-gray-100 dark:border-slate-800">
            <nav className="flex px-6 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-6 px-4 font-bold text-xs uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${isActive
                      ? 'border-[#2c5173] text-[#2c5173]'
                      : 'border-transparent text-slate-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-200 dark:hover:border-slate-700'
                      }`}
                  >
                    <Icon size={14} />
                    <span><TranslatedText text={tab.label} /></span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-8">
            {activeTab === 'general' && (
              <div className="space-y-8 animate-enter">
                {loading && !userProfile ? (
                  <div className="space-y-8">
                    <div>
                      <div className="h-4 w-32 bg-gray-100 rounded mb-6 animate-pulse" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i}>
                            <div className="h-3 w-24 bg-gray-100 rounded mb-2 animate-pulse" />
                            <div className="h-12 w-full bg-gray-50 rounded-xl animate-pulse" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                      <SettingsIcon size={16} className="text-[#2c5173]" />
                      <TranslatedText text="Account Information" />
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                          Account Type
                        </label>
                        <div className="relative group">
                          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
                          <input
                            type="text"
                            value={userProfile?.role ? userProfile.role.replace('_', ' ') : (user?.role ? user.role.replace('_', ' ') : '')}
                            disabled
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-500 dark:text-slate-400 cursor-not-allowed"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                          Member Since
                        </label>
                        <div className="relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 text-[10px] flex items-center justify-center font-bold">MS</div>
                          <input
                            type="text"
                            value={userProfile?.createdAt || userProfile?.emailVerifiedAt
                              ? new Date(userProfile.createdAt || userProfile.emailVerifiedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                              : (user?.emailVerifiedAt
                                ? new Date(user.emailVerifiedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                                : '')}
                            disabled
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-500 dark:text-slate-400 cursor-not-allowed"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                          Email
                        </label>
                        <div className="relative group">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
                          <input
                            type="text"
                            value={userProfile?.email || user?.email || ''}
                            disabled
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-500 dark:text-slate-400 cursor-not-allowed"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={userProfile?.firstName || ''}
                          onChange={(e) => setUserProfile((prev: any) => ({ ...prev, firstName: e.target.value }))}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2c5173] focus:border-transparent transition-all outline-none"
                          placeholder="First Name"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={userProfile?.lastName || ''}
                          onChange={(e) => setUserProfile((prev: any) => ({ ...prev, lastName: e.target.value }))}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2c5173] focus:border-transparent transition-all outline-none"
                          placeholder="Last Name"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                          Company / Tenant Name
                        </label>
                        <input
                          type="text"
                          value={userProfile?.tenantName || user?.tenantName || ''}
                          disabled
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-500 dark:text-slate-400 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex justify-end mt-8">
                      <button
                        onClick={async () => {
                          try {
                            setLoading(true);
                            await updateUser(userProfile.id, {
                              firstName: userProfile.firstName,
                              lastName: userProfile.lastName
                            });
                            toast.success('Profile updated');
                          } catch (err) {
                            toast.error('Failed to update profile');
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                        className="px-8 py-3 bg-[#2c5173] text-white rounded-xl hover:bg-[#1e3850] font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#2c5173]/20"
                      >
                        {loading ? 'Saving...' : 'Save Profile'}
                      </button>
                    </div>
 
                    <div className="pt-12 border-t border-gray-100 dark:border-slate-800">
                      <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6">Account Actions</h3>
                      <div className="flex flex-col md:flex-row gap-4">
                        <button className="px-6 py-3 bg-[#2c5173] text-white rounded-xl hover:bg-[#1e3850] font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#2c5173]/20 flex items-center justify-center gap-2">
                          <Check size={14} />
                          Download My Data
                        </button>
                        <button className="px-6 py-3 bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                          <Trash2 size={14} />
                          Deactivate Account
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}




            {activeTab === 'notifications' && (
              <div className="space-y-8 animate-enter">
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                    <Mail size={16} className="text-[#2c5173]" />
                    Email Notifications
                  </h3>
                  <div className="space-y-4">
                    {[
                      { key: 'cargoUpdates', label: 'Cargo Updates', desc: 'Get notified when your cargo status changes' },
                      { key: 'priceAlerts', label: 'Price Alerts', desc: 'Receive alerts about price changes' },
                      { key: 'systemUpdates', label: 'System Updates', desc: 'Receive notifications about system maintenance' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-100 dark:border-slate-800">
                        <div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white">{item.label}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications[item.key as keyof typeof notifications]}
                            onChange={(e) => handleNotificationChange(item.key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2c5173]"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                    <Bell size={16} className="text-[#2c5173]" />
                    Push Notifications
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-100 dark:border-slate-800">
                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">Enable Push Notifications</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Receive notifications in your browser</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.push}
                          onChange={(e) => handleNotificationChange('push', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2c5173]"></div>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={saveSettings}
                    disabled={loading}
                    className="px-8 py-3 bg-[#2c5173] text-white rounded-xl hover:bg-[#1e3850] font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#2c5173]/20"
                  >
                    {loading ? 'Saving...' : 'Update Notification Settings'}
                  </button>
                </div>
              </div>
            )}


            {activeTab === 'security' && (
              <div className="space-y-8 animate-enter">
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                    <Shield size={16} className="text-[#2c5173]" />
                    Security Settings
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-100 dark:border-slate-800">
                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">Two-Factor Authentication</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Add an extra layer of security to your account</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={security.twoFactorAuth}
                          onChange={(e) => handleSecurityChange('twoFactorAuth', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2c5173]"></div>
                      </label>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                        Session Timeout (minutes)
                      </label>
                      <select
                        value={security.sessionTimeout}
                        onChange={(e) => handleSecurityChange('sessionTimeout', parseInt(e.target.value))}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2c5173] focus:border-transparent transition-all outline-none"
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={120}>2 hours</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-100 dark:border-slate-800">
                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">Require Password Change</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Force password change on next login</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={security.passwordChangeRequired}
                          onChange={(e) => handleSecurityChange('passwordChangeRequired', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2c5173]"></div>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                    <Lock size={16} className="text-[#2c5173]" />
                    Password
                  </h3>
                   <button 
                    onClick={() => setShowChangePassword(true)}
                    className="px-6 py-3 bg-[#2c5173] text-white rounded-xl hover:bg-[#1e3850] font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#2c5173]/20 flex items-center gap-2"
                  >
                    <Edit size={14} />
                    Change Password
                  </button>
                </div>
                <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={saveSettings}
                    disabled={loading}
                    className="px-8 py-3 bg-[#2c5173] text-white rounded-xl hover:bg-[#1e3850] font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#2c5173]/20"
                  >
                    {loading ? 'Saving...' : 'Update Security Settings'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-8 animate-enter">
                {/* ── Display preferences (existing) ─────────────────────── */}
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                    <Palette size={16} className="text-[#2c5173]" />
                    Display Preferences
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                        Language
                      </label>
                      <div className="relative group">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
                        <select
                          value={preferences.language}
                          onChange={(e) => handlePreferenceChange('language', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2c5173] focus:border-transparent transition-all outline-none appearance-none"
                        >
                          <option value="en">English</option>
                          <option value="sw">Swahili</option>
                          <option value="fr">French</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                        Timezone
                      </label>
                      <select
                        value={preferences.timezone}
                        onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2c5173] focus:border-transparent transition-all outline-none"
                      >
                        <option value="Africa/Nairobi">Nairobi (UTC+3)</option>
                        <option value="Africa/Dar_es_Salaam">Dar es Salaam (UTC+3)</option>
                        <option value="Africa/Kampala">Kampala (UTC+3)</option>
                      </select>
                    </div>
                    <div>
                      <CurrencySelector variant="settings" />
                      <p className="text-[10px] text-slate-400 mt-1.5">
                        All monetary values across the platform will display in your selected currency.
                      </p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                        Theme
                      </label>
                      <select
                        value={preferences.theme}
                        onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2c5173] focus:border-transparent transition-all outline-none"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={saveSettings}
                    disabled={loading}
                    className="px-8 py-3 bg-[#2c5173] text-white rounded-xl hover:bg-[#1e3850] font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#2c5173]/20"
                  >
                    {loading ? 'Saving...' : 'Update Preferences'}
                  </button>
                </div>

                {/* ── Currency Management — super admin only ──────────────── */}
                {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
                  <CurrencyManagementSection />
                )}
              </div>
            )}


            {activeTab === 'team' && (
              <div className="space-y-8 animate-enter">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                      <Users size={16} className="text-[#2c5173]" />
                      Team Members
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-6">Manage cargo receivers and team members</p>
                  </div>
                  <button
                    onClick={handleAddReceiver}
                    className="px-4 py-2 bg-[#2c5173] text-white rounded-xl hover:bg-[#1e3850] font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-[#2c5173]/20 flex items-center gap-2"
                  >
                    <UserPlus size={14} />
                    <span>Add Member</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {receivers.map((receiver) => (
                    <div key={receiver.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-[#2c5173]/10 text-[#2c5173] rounded-2xl flex items-center justify-center">
                            <Users size={20} />
                          </div>
                          <div>
                            <div className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none mb-1.5">
                              {receiver.profile?.firstName} {receiver.profile?.lastName}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{receiver.role.replace('_', ' ')}</span>
                              <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                              <span className="text-[10px] font-black text-[#2c5173] uppercase tracking-widest">{receiver.email}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => handleEditReceiver(receiver)}
                            className="p-2 text-slate-400 hover:text-[#2c5173] hover:bg-[#2c5173]/10 rounded-lg transition-all"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteReceiver(receiver.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-50 dark:border-slate-800">
                        <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Permissions</div>
                        <div className="flex flex-wrap gap-2">
                          {receiver.permissions?.map((permission: string) => (
                            <span
                              key={permission}
                              className="px-2 py-0.5 bg-gray-50 dark:bg-slate-950 text-gray-600 dark:text-slate-400 border border-gray-100 dark:border-slate-800 text-[10px] font-medium rounded-md uppercase tracking-wide"
                            >
                              {permission.replace('_', ' ')}
                            </span>
                          )) || <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">No special permissions</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showAddReceiver} onOpenChange={setShowAddReceiver}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-none bg-transparent">
          <div className="relative w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
                {editingReceiver ? 'Edit Team Member' : 'Add Team Member'}
              </h3>
              <button
                onClick={() => setShowAddReceiver(false)}
                className="p-2 text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                <div className="sr-only">Close</div>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={receiverForm.firstName}
                      onChange={(e) => setReceiverForm(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2c5173] focus:border-transparent outline-none"
                      placeholder="e.g. John"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={receiverForm.lastName}
                      onChange={(e) => setReceiverForm(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2c5173] focus:border-transparent outline-none"
                      placeholder="e.g. Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={receiverForm.email}
                      disabled={!!editingReceiver}
                      onChange={(e) => setReceiverForm(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2c5173] focus:border-transparent outline-none ${editingReceiver ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="e.g. john@example.com"
                    />
                  </div>
                  {!editingReceiver && (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                        Initial Password
                      </label>
                      <input
                        type="password"
                        value={receiverForm.password}
                        onChange={(e) => setReceiverForm(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2c5173] focus:border-transparent outline-none"
                        placeholder="••••••••"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                    Role
                  </label>
                  <select
                    value={receiverForm.role}
                    onChange={(e) => setReceiverForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2c5173] focus:border-transparent outline-none"
                  >
                    {user?.role === 'TRUCK_OWNER' ? (
                      <>
                        <option value="FLEET_MANAGER">Fleet Manager</option>
                        <option value="FLEET_DISPATCHER">Fleet Dispatcher</option>
                        <option value="FLEET_ACCOUNTANT">Fleet Accountant</option>
                        <option value="FLEET_SAFETY_OFFICER">Fleet Safety Officer</option>
                        <option value="DRIVER">Driver</option>
                        <option value="VIEWER">Viewer</option>
                      </>
                    ) : (
                      <>
                        <option value="CARGO_RECEIVER">Cargo Receiver</option>
                        <option value="TENANT_ADMIN">Tenant Admin</option>
                        <option value="TRUCK_OWNER">Truck Owner (Manager)</option>
                        <option value="FLEET_MANAGER">Fleet Manager</option>
                        <option value="FLEET_DISPATCHER">Fleet Dispatcher</option>
                        <option value="FLEET_ACCOUNTANT">Fleet Accountant</option>
                        <option value="FLEET_SAFETY_OFFICER">Fleet Safety Officer</option>
                        <option value="DRIVER">Driver</option>
                        <option value="VIEWER">Viewer</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                    Permissions
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      'view_cargo',
                      'create_cargo',
                      'edit_cargo',
                      'delete_cargo',
                      'manage_fleet',
                      'manage_drivers',
                      'manage_trucks',
                      'manage_fuel',
                      'manage_maintenance',
                      'manage_bids',
                      'manage_loads',
                      'manage_trips',
                      'approve_trips',
                      'manage_expenses',
                      'manage_financials',
                      'view_financials',
                      'manage_safety',
                      'manage_inspections',
                      'manage_incident_reports',
                      'manage_compliance',
                      'manage_routes',
                      'manage_communications',
                      'view_reports',
                      'manage_onboarding'
                    ]
                      .filter((permission) => {
                        if (user?.role === 'TRUCK_OWNER') {
                          return !permission.includes('cargo');
                        }
                        return true;
                      })
                      .map((permission) => (
                        <label key={permission} className="flex items-center gap-3 p-3 border border-gray-100 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={receiverForm.permissions.includes(permission)}
                            onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                            className="w-4 h-4 text-[#2c5173] border-gray-300 dark:border-slate-700 rounded focus:ring-[#2c5173]"
                          />
                          <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest leading-none">
                            {permission.replace('_', ' ')}
                          </span>
                        </label>
                      ))}
                  </div>
                </div>

                {renderPermissionGroup('Payment & Financial Capabilities', receiverForm.paymentPermissions, 'paymentPermissions')}
                {renderPermissionGroup('Document Management Access', receiverForm.documentPermissions, 'documentPermissions')}
                {renderPermissionGroup('Workflow & Approval Permissions', receiverForm.workflowPermissions, 'workflowPermissions')}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3 bg-gray-50 dark:bg-slate-950 rounded-b-2xl">
              <button
                onClick={() => setShowAddReceiver(false)}
                className="px-6 py-3 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 font-bold text-xs uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReceiver}
                className="px-6 py-3 bg-[#2c5173] text-white rounded-xl hover:bg-[#1e3850] font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#2c5173]/20"
              >
                {editingReceiver ? 'Save Changes' : 'Add Member'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

            {activeTab === 'system' && (
              <div className="space-y-8 animate-enter">
                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4 rounded-lg mb-6">
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-1">
                        <TranslatedText text="Public Contact Information" />
                      </h4>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        <TranslatedText text="These settings control the contact information displayed on the public website (header and footer). Changes will be visible immediately to all visitors." />
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#2c5173]" />
                    <TranslatedText text="Website Contact Settings" />
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        <TranslatedText text="Contact Phone Number" />
                      </label>
                      <input
                        type="tel"
                        value={contactSettings.phone}
                        onChange={(e) => setContactSettings({ ...contactSettings, phone: e.target.value })}
                        placeholder="+250788309463"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2c5173] focus:border-transparent transition-all outline-none"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        <TranslatedText text="This phone number will be clickable on mobile devices (tel: link)" />
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        <TranslatedText text="Contact Email" />
                      </label>
                      <input
                        type="email"
                        value={contactSettings.email}
                        onChange={(e) => setContactSettings({ ...contactSettings, email: e.target.value })}
                        placeholder="hello@urutix.com"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2c5173] focus:border-transparent transition-all outline-none"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        <TranslatedText text="Primary contact email displayed on the website" />
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        <TranslatedText text="Business Address" />
                      </label>
                      <input
                        type="text"
                        value={contactSettings.address}
                        onChange={(e) => setContactSettings({ ...contactSettings, address: e.target.value })}
                        placeholder="Kigali, Rwanda · Nairobi, Kenya"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2c5173] focus:border-transparent transition-all outline-none"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        <TranslatedText text="Business locations displayed in the footer" />
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between mt-8">
                    <button
                      onClick={fetchContactSettings}
                      disabled={isSavingContact}
                      className="px-6 py-3 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${isSavingContact ? 'animate-spin' : ''}`} />
                      <TranslatedText text="Reset" />
                    </button>
                    
                    <button
                      onClick={handleSaveContactSettings}
                      disabled={isSavingContact}
                      className="px-8 py-3 bg-[#2c5173] text-white rounded-xl hover:bg-[#1e3850] font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#2c5173]/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className={`w-4 h-4 ${isSavingContact ? 'animate-spin' : ''}`} />
                      <TranslatedText text={isSavingContact ? "Saving..." : "Save Changes"} />
                    </button>
                  </div>
                </div>
              </div>
            )}

      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none bg-transparent">
          <div className="relative w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
                Change Password
              </h3>
              <button
                onClick={() => setShowChangePassword(false)}
                className="p-2 text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                <div className="sr-only">Close</div>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-4 py-3 pr-10 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2c5173] focus:border-transparent outline-none transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-4 py-3 pr-10 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2c5173] focus:border-transparent outline-none transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-4 py-3 pr-10 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2c5173] focus:border-transparent outline-none transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3 bg-gray-50 dark:bg-slate-950 rounded-b-2xl">
              <button
                onClick={() => setShowChangePassword(false)}
                className="px-6 py-3 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 font-bold text-xs uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={loading}
                className="px-6 py-3 bg-[#2c5173] text-white rounded-xl hover:bg-[#1e3850] font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#2c5173]/20"
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') {
    if (loading) {
      return (
        <AdminPageLayout
          title={<TranslatedText text="Settings" />}
          description={<TranslatedText text="Manage your account settings and preferences" />}
        >
          <div className="space-y-4 animate-pulse">
            <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-[16px] w-2/3" />
            {[1,2,3,4].map(i => (
              <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-[24px]" />
            ))}
          </div>
        </AdminPageLayout>
      );
    }
    return (
      <AdminPageLayout
        title={<TranslatedText text="Settings" />}
        description={<TranslatedText text="Manage your account settings and preferences" />}
      >
        {settingsContent}
      </AdminPageLayout>
    );
  }

  // Tenant Admin View with custom header
  return (
    <div className="space-y-6 transition-colors">
      <div className="bg-white dark:bg-slate-900 rounded-[24px] shadow-sm p-8 border border-slate-100 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Settings</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
              Manage your account configurations and platform preferences
            </p>
          </div>
        </div>
      </div>
      {settingsContent}
    </div>
  );
};

export default Settings;

// ─────────────────────────────────────────────────────────────────────────────
// CurrencyManagementSection — rendered inside the Preferences tab for admins
// ─────────────────────────────────────────────────────────────────────────────

interface CurrencyFormState {
  code: string;
  name: string;
  symbol: string;
  locale: string;
  decimals: number;
  flag: string;
  isActive: boolean;
  manualRate: string;
}

const EMPTY_CURRENCY_FORM: CurrencyFormState = {
  code: '', name: '', symbol: '', locale: 'en-US',
  decimals: 2, flag: '🏳', isActive: true, manualRate: '',
};

const CurrencyManagementSection: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreate, setShowCreate]     = useState(false);
  const [editTarget, setEditTarget]     = useState<AdminCurrency | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCurrency | null>(null);
  const [viewTarget, setViewTarget]     = useState<AdminCurrency | null>(null);
  const [form, setForm]                 = useState<CurrencyFormState>(EMPTY_CURRENCY_FORM);

  const { data: currencies = [], isLoading } = useQuery<AdminCurrency[]>({
    queryKey: ['admin-currencies'],
    queryFn: () => currencyApi.adminGetAll(),
  });

  const { data: ratesData } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: () => currencyApi.getRates(),
    staleTime: 60 * 60 * 1000,
  });
  const rates = ratesData?.rates ?? {};

  const { mutate: createCurrency, isPending: isCreating } = useMutation({
    mutationFn: (p: CreateCurrencyPayload) => currencyApi.adminCreate(p),
    onSuccess: c => {
      qc.invalidateQueries({ queryKey: ['admin-currencies'] });
      qc.invalidateQueries({ queryKey: ['supported-currencies'] });
      toast.success(`Currency '${c.code}' created`);
      setShowCreate(false); setForm(EMPTY_CURRENCY_FORM);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to create currency'),
  });

  const { mutate: updateCurrency, isPending: isUpdating } = useMutation({
    mutationFn: ({ code, payload }: { code: string; payload: UpdateCurrencyPayload }) =>
      currencyApi.adminUpdate(code, payload),
    onSuccess: c => {
      qc.invalidateQueries({ queryKey: ['admin-currencies'] });
      qc.invalidateQueries({ queryKey: ['supported-currencies'] });
      qc.invalidateQueries({ queryKey: ['exchange-rates'] });
      toast.success(`Currency '${c.code}' updated`);
      setEditTarget(null); setForm(EMPTY_CURRENCY_FORM);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to update currency'),
  });

  const { mutate: deleteCurrency, isPending: isDeleting } = useMutation({
    mutationFn: (code: string) => currencyApi.adminDelete(code),
    onSuccess: (_, code) => {
      qc.invalidateQueries({ queryKey: ['admin-currencies'] });
      qc.invalidateQueries({ queryKey: ['supported-currencies'] });
      toast.success(`Currency '${code}' deleted`);
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to delete currency'),
  });

  const { mutate: refreshRates, isPending: isRefreshing } = useMutation({
    mutationFn: () => currencyApi.forceRefresh(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exchange-rates'] });
      toast.success('Rates refreshed from external provider');
    },
    onError: () => toast.error('Failed to refresh rates'),
  });

  const toggleActive = (c: AdminCurrency) =>
    updateCurrency({ code: c.code, payload: { isActive: !c.isActive } });

  const openEdit = (c: AdminCurrency) => {
    setEditTarget(c);
    setForm({
      code: c.code, name: c.name, symbol: c.symbol, locale: c.locale,
      decimals: c.decimals, flag: c.flag, isActive: c.isActive,
      manualRate: c.manualRate !== null ? String(c.manualRate) : '',
    });
  };

  const fc = (field: keyof CurrencyFormState, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const buildPayload = () => {
    const manualRate = form.manualRate.trim() !== '' ? parseFloat(form.manualRate) : null;
    if (manualRate !== null && isNaN(manualRate)) { toast.error('Manual rate must be a valid number'); return null; }
    return { manualRate, name: form.name.trim(), symbol: form.symbol.trim(),
             locale: form.locale.trim() || 'en-US', decimals: Number(form.decimals),
             flag: form.flag.trim() || '🏳', isActive: form.isActive };
  };

  const handleCreate = () => {
    if (!form.code.trim() || !form.name.trim() || !form.symbol.trim()) { toast.error('Code, name and symbol are required'); return; }
    const p = buildPayload(); if (!p) return;
    createCurrency({ code: form.code.trim().toUpperCase(), ...p } as CreateCurrencyPayload);
  };

  const handleUpdate = () => {
    if (!editTarget || !form.name.trim() || !form.symbol.trim()) { toast.error('Name and symbol are required'); return; }
    const p = buildPayload(); if (!p) return;
    updateCurrency({ code: editTarget.code, payload: p });
  };

  const filtered = useMemo(() =>
    currencies
      .filter(c => {
        const q = search.toLowerCase();
        return (c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q))
          && (filterStatus === 'all' || (filterStatus === 'active' && c.isActive) || (filterStatus === 'inactive' && !c.isActive));
      })
      .sort((a, b) => a.code.localeCompare(b.code)),
    [currencies, search, filterStatus],
  );

  const stats = useMemo(() => ({
    total:          currencies.length,
    active:         currencies.filter(c => c.isActive).length,
    withManualRate: currencies.filter(c => c.manualRate !== null).length,
    lastUpdated:    ratesData?.updatedAt ? new Date(ratesData.updatedAt).toLocaleTimeString() : '—',
  }), [currencies, ratesData]);

  return (
    <div className="pt-8 border-t border-gray-100 dark:border-slate-800 space-y-5">
      {/* Section header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-[#2c5173]">
            <DollarSign size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
              Currency Management
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              Add, edit or deactivate platform currencies and set manual rate overrides
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshRates()}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh Rates
          </button>
          <button
            onClick={() => { setEditTarget(null); setForm(EMPTY_CURRENCY_FORM); setShowCreate(true); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#2c5173] text-white text-xs font-bold rounded-xl hover:bg-[#1e3850] transition-colors"
          >
            <Plus size={12} />
            Add Currency
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',           value: stats.total,          icon: <Globe size={13} /> },
          { label: 'Active',          value: stats.active,         icon: <Check size={13} /> },
          { label: 'Manual Overrides',value: stats.withManualRate, icon: <Lock size={13} /> },
          { label: 'Rates Updated',   value: stats.lastUpdated,    icon: <TrendingUp size={13} /> },
        ].map(s => (
          <div key={s.label} className="bg-gray-50 dark:bg-slate-950 rounded-xl px-4 py-3 flex items-center gap-2.5 border border-gray-100 dark:border-slate-800">
            <div className="text-[#2c5173]">{s.icon}</div>
            <div>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100">{s.value}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search currencies…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2c5173]/20 focus:border-[#2c5173]"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as any)}
          className="px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2c5173]/20"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <span className="text-xs text-slate-400">{filtered.length} currencies</span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="h-32 flex items-center justify-center text-xs text-slate-400">Loading currencies…</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-slate-800">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800">
              <tr>
                {['Currency','Symbol','Locale','Dec','Live Rate','Manual Override','Status','Actions'].map(h => (
                  <th key={h} className="px-3 py-3 text-left font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-xs">No currencies found</td>
                </tr>
              )}
              {filtered.map(c => {
                const isBase   = c.code === 'USD';
                const liveRate = isBase ? 1 : (rates[c.code] ?? null);
                return (
                  <tr key={c.code} className={`hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${!c.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm leading-none">{c.flag}</span>
                        <div>
                          <p className="font-black text-slate-800 dark:text-slate-100">{c.code}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[100px]">{c.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-300">{c.symbol}</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{c.locale}</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{c.decimals}</td>
                    <td className="px-3 py-2.5">
                      {isBase
                        ? <span className="text-slate-400 italic text-[10px]">base</span>
                        : liveRate !== null
                          ? <span className="font-bold text-slate-700 dark:text-slate-200">{Number(liveRate).toFixed(4)}</span>
                          : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {c.manualRate !== null
                        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-md font-bold">
                            <Lock size={9} />{Number(c.manualRate).toFixed(4)}
                          </span>
                        : <span className="text-slate-300 text-[10px]">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => !isBase && toggleActive(c)}
                        disabled={isBase}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] transition-colors
                          ${c.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                                       : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'}
                          ${isBase ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        {c.isActive ? <><Check size={9} />Active</> : <><EyeOff size={9} />Inactive</>}
                      </button>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewTarget(c)}
                          className="p-1.5 text-slate-400 hover:text-[#2c5173] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="View">
                          <Eye size={12} />
                        </button>
                        <button onClick={() => openEdit(c)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Edit">
                          <Edit size={12} />
                        </button>
                        {!isBase
                          ? <button onClick={() => setDeleteTarget(c)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Delete">
                              <Trash2 size={12} />
                            </button>
                          : <span className="p-1.5 text-slate-200 dark:text-slate-700" title="Base currency — protected"><Lock size={12} /></span>
                        }
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create modal ──────────────────────────────────────────────────── */}
      {showCreate && (
        <CurrencyFormModal
          title="Add New Currency"
          form={form} onChange={fc}
          onSubmit={handleCreate}
          onClose={() => { setShowCreate(false); setForm(EMPTY_CURRENCY_FORM); }}
          isLoading={isCreating} isCreate
        />
      )}

      {/* ── Edit modal ────────────────────────────────────────────────────── */}
      {editTarget && (
        <CurrencyFormModal
          title={`Edit ${editTarget.code} — ${editTarget.name}`}
          form={form} onChange={fc}
          onSubmit={handleUpdate}
          onClose={() => { setEditTarget(null); setForm(EMPTY_CURRENCY_FORM); }}
          isLoading={isUpdating}
          isBase={editTarget.code === 'USD'}
        />
      )}

      {/* ── Delete confirm ────────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="text-red-500 w-5 h-5" />
            </div>
            <h3 className="text-center text-sm font-black text-slate-800 dark:text-white mb-1">
              Delete {deleteTarget.flag} {deleteTarget.code}?
            </h3>
            <p className="text-center text-xs text-slate-500 dark:text-slate-400 mb-5">
              Removes <strong>{deleteTarget.name}</strong> from the platform. Users with this as their preferred currency fall back to USD.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
                Cancel
              </button>
              <button onClick={() => deleteCurrency(deleteTarget.code)} disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600 disabled:opacity-50">
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View details ──────────────────────────────────────────────────── */}
      {viewTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="text-3xl leading-none">{viewTarget.flag}</span>
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-white">{viewTarget.code}</h3>
                  <p className="text-xs text-slate-400">{viewTarget.name}</p>
                </div>
              </div>
              <button onClick={() => setViewTarget(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2">
              {[
                ['Symbol',             viewTarget.symbol],
                ['Locale',             viewTarget.locale],
                ['Decimals',           String(viewTarget.decimals)],
                ['Status',             viewTarget.isActive ? 'Active' : 'Inactive'],
                ['Live Rate (per USD)',viewTarget.code === 'USD' ? '1 (base)' : String(rates[viewTarget.code] ?? '—')],
                ['Manual Override',    viewTarget.manualRate !== null ? String(viewTarget.manualRate) : 'None'],
                ['Created',            new Date(viewTarget.createdAt).toLocaleDateString()],
                ['Updated',            new Date(viewTarget.updatedAt).toLocaleDateString()],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{value}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setViewTarget(null)}
              className="mt-5 w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Currency form modal ────────────────────────────────────────────────────────

interface CurrencyFormModalProps {
  title: string;
  form: CurrencyFormState;
  onChange: (field: keyof CurrencyFormState, value: any) => void;
  onSubmit: () => void;
  onClose: () => void;
  isLoading: boolean;
  isCreate?: boolean;
  isBase?: boolean;
}

const CurrencyFormModal: React.FC<CurrencyFormModalProps> = ({
  title, form, onChange, onSubmit, onClose, isLoading, isCreate = false, isBase = false,
}) => {
  const INPUT = 'w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2c5173]/20 focus:border-[#2c5173]';
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 pb-24 lg:pb-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center">
              <DollarSign size={15} className="text-[#2c5173]" />
            </div>
            <h2 className="text-sm font-black text-slate-800 dark:text-white">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X size={15} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {isCreate && (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Currency Code *</label>
              <input type="text" value={form.code}
                onChange={e => onChange('code', e.target.value.toUpperCase().slice(0, 3))}
                maxLength={3} placeholder="e.g. GHS" className={INPUT} />
              <p className="mt-1 text-[10px] text-slate-400">ISO 4217 — exactly 3 uppercase letters</p>
            </div>
          )}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Currency Name *</label>
            <input type="text" value={form.name}
              onChange={e => onChange('name', e.target.value)}
              placeholder="e.g. Ghanaian Cedi" className={INPUT} />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Symbol *</label>
            <input type="text" value={form.symbol}
              onChange={e => onChange('symbol', e.target.value)}
              placeholder="e.g. ₵" className={INPUT} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">BCP-47 Locale</label>
              <input type="text" value={form.locale}
                onChange={e => onChange('locale', e.target.value)}
                placeholder="e.g. en-GH" className={INPUT} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Decimal Digits</label>
              <select value={form.decimals}
                onChange={e => onChange('decimals', Number(e.target.value))}
                className={INPUT}>
                <option value={0}>0 — e.g. JPY</option>
                <option value={2}>2 — most</option>
                <option value={3}>3 — e.g. KWD</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Flag Emoji</label>
            <input type="text" value={form.flag}
              onChange={e => onChange('flag', e.target.value)}
              placeholder="e.g. 🇬🇭" className={INPUT} />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
              Manual Rate Override (per 1 USD)
            </label>
            <input type="number" value={form.manualRate}
              onChange={e => onChange('manualRate', e.target.value)}
              placeholder="Leave blank to use live rate"
              step="any" min="0" className={INPUT} />
            <p className="mt-1 text-[10px] text-slate-400">Overrides the auto-fetched rate. Clear to restore live rates.</p>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-100 dark:border-slate-800">
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Active</p>
              <p className="text-[10px] text-slate-400">Visible to users in currency selectors</p>
            </div>
            <button type="button" disabled={isBase}
              onClick={() => onChange('isActive', !form.isActive)}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? 'bg-[#2c5173]' : 'bg-slate-300 dark:bg-slate-700'} ${isBase ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
            Cancel
          </button>
          <button onClick={onSubmit} disabled={isLoading}
            className="flex-1 py-2.5 bg-[#2c5173] text-white text-xs font-bold rounded-xl hover:bg-[#1e3850] disabled:opacity-50 transition-colors">
            {isLoading ? (isCreate ? 'Creating…' : 'Saving…') : (isCreate ? 'Create Currency' : 'Save Changes')}
          </button>
        </div>
      </div>
    </div>
  );
};