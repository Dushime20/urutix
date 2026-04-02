import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { authAPI } from '../services/api';
import { fetchAllUsers, createTenantUser, updateUser, deleteUser } from '../services/adminApi';
import { TranslatedText } from '../components/translated-text';
import AdminPageLayout from '../components/Admin/AdminPageLayout';
import toast from 'react-hot-toast';
import { Dialog, DialogContent } from '../components/ui/Dialog';


const Settings: React.FC = () => {
  const { user } = useAuth();
  // const { setCurrency, availableCurrencies } = useCurrency(); // Removed
  const [activeTab, setActiveTab] = useState('general');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
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
      await updateUser(userProfile.id, {
        preferences,
        notifications,
        security
      });
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
        });
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
              className="w-4 h-4 text-indigo-600 dark:text-blue-500 border-gray-300 dark:border-slate-700 rounded focus:ring-indigo-500 dark:focus:ring-blue-500"
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
                      ? 'border-indigo-600 dark:border-blue-500 text-indigo-600 dark:text-blue-400'
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
                      <SettingsIcon size={16} className="text-indigo-600 dark:text-blue-500" />
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
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-blue-500 focus:border-transparent transition-all outline-none"
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
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-blue-500 focus:border-transparent transition-all outline-none"
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
                        className="px-8 py-3 bg-indigo-600 dark:bg-blue-600 text-white rounded-xl hover:bg-indigo-700 dark:hover:bg-blue-700 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 dark:shadow-blue-900/10"
                      >
                        {loading ? 'Saving...' : 'Save Profile'}
                      </button>
                    </div>
 
                    <div className="pt-12 border-t border-gray-100 dark:border-slate-800">
                      <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6">Account Actions</h3>
                      <div className="flex flex-col md:flex-row gap-4">
                        <button className="px-6 py-3 bg-indigo-600 dark:bg-blue-600 text-white rounded-xl hover:bg-indigo-700 dark:hover:bg-blue-700 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 dark:shadow-blue-900/10 flex items-center justify-center gap-2">
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
                    <Mail size={16} className="text-indigo-600 dark:text-blue-500" />
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
                          <div className="w-11 h-6 bg-gray-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 dark:peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                    <Bell size={16} className="text-indigo-600 dark:text-blue-500" />
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
                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 dark:peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={saveSettings}
                    disabled={loading}
                    className="px-8 py-3 bg-indigo-600 dark:bg-blue-600 text-white rounded-xl hover:bg-indigo-700 dark:hover:bg-blue-700 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 dark:shadow-blue-900/10"
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
                    <Shield size={16} className="text-indigo-600 dark:text-blue-500" />
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
                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 dark:peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                        Session Timeout (minutes)
                      </label>
                      <select
                        value={security.sessionTimeout}
                        onChange={(e) => handleSecurityChange('sessionTimeout', parseInt(e.target.value))}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-blue-500 focus:border-transparent transition-all outline-none"
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
                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 dark:peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                    <Lock size={16} className="text-indigo-600 dark:text-blue-500" />
                    Password
                  </h3>
                   <button 
                    onClick={() => setShowChangePassword(true)}
                    className="px-6 py-3 bg-indigo-600 dark:bg-blue-600 text-white rounded-xl hover:bg-indigo-700 dark:hover:bg-blue-700 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 dark:shadow-blue-900/10 flex items-center gap-2"
                  >
                    <Edit size={14} />
                    Change Password
                  </button>
                </div>
                <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={saveSettings}
                    disabled={loading}
                    className="px-8 py-3 bg-indigo-600 dark:bg-blue-600 text-white rounded-xl hover:bg-indigo-700 dark:hover:bg-blue-700 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 dark:shadow-blue-900/10"
                  >
                    {loading ? 'Saving...' : 'Update Security Settings'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-8 animate-enter">
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                    <Palette size={16} className="text-indigo-600 dark:text-blue-500" />
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
                          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-blue-500 focus:border-transparent transition-all outline-none appearance-none"
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
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                      >
                        <option value="Africa/Nairobi">Nairobi (UTC+3)</option>
                        <option value="Africa/Dar_es_Salaam">Dar es Salaam (UTC+3)</option>
                        <option value="Africa/Kampala">Kampala (UTC+3)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                        Currency
                      </label>
                      <select
                        value={preferences.currency}
                        onChange={(e) => handlePreferenceChange('currency', e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="KES">KES (KSh)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                        Theme
                      </label>
                      <select
                        value={preferences.theme}
                        onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-blue-500 focus:border-transparent transition-all outline-none"
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
                    className="px-8 py-3 bg-indigo-600 dark:bg-blue-600 text-white rounded-xl hover:bg-indigo-700 dark:hover:bg-blue-700 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 dark:shadow-blue-900/10"
                  >
                    {loading ? 'Saving...' : 'Update Preferences'}
                  </button>
                </div>
              </div>
            )}


            {activeTab === 'team' && (
              <div className="space-y-8 animate-enter">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                      <Users size={16} className="text-indigo-600 dark:text-blue-500" />
                      Team Members
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-6">Manage cargo receivers and team members</p>
                  </div>
                  <button
                    onClick={handleAddReceiver}
                    className="px-4 py-2 bg-indigo-600 dark:bg-blue-600 text-white rounded-xl hover:bg-indigo-700 dark:hover:bg-blue-700 font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 dark:shadow-blue-900/10 flex items-center gap-2"
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
                          <div className="w-12 h-12 bg-indigo-50 dark:bg-blue-900/20 text-indigo-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                            <Users size={20} />
                          </div>
                          <div>
                            <div className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none mb-1.5">
                              {receiver.profile?.firstName} {receiver.profile?.lastName}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{receiver.role.replace('_', ' ')}</span>
                              <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                              <span className="text-[10px] font-black text-indigo-500 dark:text-blue-400 uppercase tracking-widest">{receiver.email}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => handleEditReceiver(receiver)}
                            className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-blue-400 hover:bg-indigo-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
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
                      className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-blue-500 focus:border-transparent outline-none"
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
                      className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-blue-500 focus:border-transparent outline-none"
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
                      className={`w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-blue-500 focus:border-transparent outline-none ${editingReceiver ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-blue-500 focus:border-transparent outline-none"
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
                    className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-blue-500 focus:border-transparent outline-none"
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
                            className="w-4 h-4 text-indigo-600 dark:text-blue-500 border-gray-300 dark:border-slate-700 rounded focus:ring-indigo-500 dark:focus:ring-blue-500"
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
                className="px-6 py-3 bg-indigo-600 dark:bg-blue-600 text-white rounded-xl hover:bg-indigo-700 dark:hover:bg-blue-700 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 dark:shadow-blue-900/10"
              >
                {editingReceiver ? 'Save Changes' : 'Add Member'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                      className="w-full px-4 py-3 pr-10 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-blue-500 focus:border-transparent outline-none transition-all"
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
                      className="w-full px-4 py-3 pr-10 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-blue-500 focus:border-transparent outline-none transition-all"
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
                      className="w-full px-4 py-3 pr-10 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-blue-500 focus:border-transparent outline-none transition-all"
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
                className="px-6 py-3 bg-indigo-600 dark:bg-blue-600 text-white rounded-xl hover:bg-indigo-700 dark:hover:bg-blue-700 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 dark:shadow-blue-900/10"
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  if (user?.role === 'SUPER_ADMIN') {
    return (
      <AdminPageLayout
        title="Settings"
        description="Manage your account settings and preferences"
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