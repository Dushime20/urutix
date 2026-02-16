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
  Building2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { TranslatedText } from '../components/translated-text';
import AdminPageLayout from '../components/Admin/AdminPageLayout';


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
    } catch (err: any) {
      console.error('Error loading user profile:', err);
      setUserProfile(user);
    } finally {
      setLoading(false);
    }
  };
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
  const [receivers, setReceivers] = useState([
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@doelogistics.com',
      role: 'Cargo Receiver',
      status: 'active',
      permissions: ['view_cargo', 'create_cargo', 'edit_cargo'],
      createdAt: '2024-01-10T00:00:00Z',
      // Payment workflow permissions
      paymentPermissions: {
        canInitiatePayments: true,
        canApprovePayments: false,
        canRequestPayments: true,
        canViewTransactions: true,
        canManageFinancing: false,
        canHandleInsurance: false,
        canProcessRefunds: false,
        canGenerateReports: false,
        canManageTeamPermissions: false,
        canHandleEscrow: false,
        canProcessThirdPartyPayments: false,
        canManageBankAccounts: false,
        canHandleMobileMoney: true,
        canProcessPlatformServices: false,
        canManageDocuments: false,
        canHandleCompliance: false,
      },
      // Document handling permissions
      documentPermissions: {
        canUploadDocuments: true,
        canViewDocuments: true,
        canEditDocuments: false,
        canDeleteDocuments: false,
        canShareDocuments: true,
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
    },
    {
      id: '2',
      name: 'Michael Chen',
      email: 'michael.chen@doelogistics.com',
      role: 'Assistant Manager',
      status: 'active',
      permissions: ['view_cargo', 'create_cargo', 'edit_cargo', 'delete_cargo', 'publish_cargo'],
      createdAt: '2024-01-15T00:00:00Z',
      // Payment workflow permissions
      paymentPermissions: {
        canInitiatePayments: true,
        canApprovePayments: true,
        canRequestPayments: true,
        canViewTransactions: true,
        canManageFinancing: true,
        canHandleInsurance: true,
        canProcessRefunds: true,
        canGenerateReports: true,
        canManageTeamPermissions: false,
        canHandleEscrow: true,
        canProcessThirdPartyPayments: true,
        canManageBankAccounts: true,
        canHandleMobileMoney: true,
        canProcessPlatformServices: true,
        canManageDocuments: true,
        canHandleCompliance: false,
      },
      // Document handling permissions
      documentPermissions: {
        canUploadDocuments: true,
        canViewDocuments: true,
        canEditDocuments: true,
        canDeleteDocuments: false,
        canShareDocuments: true,
        canGenerateReports: true,
        canHandleCompliance: false,
      },
      // Workflow permissions
      workflowPermissions: {
        canCreateWorkflows: true,
        canEditWorkflows: true,
        canDeleteWorkflows: false,
        canAssignTasks: true,
        canApproveSteps: true,
        canViewWorkflowHistory: true,
        canManageApprovals: true,
      },
    },
  ]);

  const [showAddReceiver, setShowAddReceiver] = useState(false);
  const [editingReceiver, setEditingReceiver] = useState<any>(null);
  const [receiverForm, setReceiverForm] = useState({
    name: '',
    email: '',
    role: 'Cargo Receiver',
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

  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // Team Management Functions
  const handleAddReceiver = () => {
    setShowAddReceiver(true);
    setEditingReceiver(null);
    setReceiverForm({
      name: '',
      email: '',
      role: 'Cargo Receiver',
      permissions: ['view_cargo'],
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
      name: receiver.name,
      email: receiver.email,
      role: receiver.role,
      permissions: receiver.permissions,
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

  const handleDeleteReceiver = (receiverId: string) => {
    if (window.confirm('Are you sure you want to remove this team member?')) { // TODO: Translate
      setReceivers(prev => prev.filter(r => r.id !== receiverId));
    }
  };

  const handleSaveReceiver = () => {
    if (!receiverForm.name || !receiverForm.email) {
      alert('Please fill in all required fields'); // TODO: Translate
      return;
    }

    if (editingReceiver) {
      // Update existing receiver
      setReceivers(prev => prev.map(r =>
        r.id === editingReceiver.id
          ? { ...r, ...receiverForm, updatedAt: new Date().toISOString() }
          : r
      ));
    } else {
      // Add new receiver
      const newReceiver = {
        id: Date.now().toString(),
        ...receiverForm,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      setReceivers(prev => [...prev, newReceiver]);
    }

    setShowAddReceiver(false);
    setEditingReceiver(null);
    setReceiverForm({
      name: '',
      email: '',
      role: 'Cargo Receiver',
      permissions: ['view_cargo'],
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

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setReceiverForm(prev => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, permission]
        : prev.permissions.filter(p => p !== permission)
    }));
  };

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'team', label: 'Team Management', icon: Users },
  ];

  return (
    <AdminPageLayout
      title="Settings"
      description="Manage your account settings and preferences"
    >
      <div className="space-y-6">
        {/* Settings Tabs */}
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="border-b border-gray-100">
            <nav className="flex px-6 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-6 px-4 font-bold text-xs uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${isActive
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-400 hover:text-gray-900 hover:border-gray-200'
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
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-8 animate-enter">
                {loading ? (
                  // Skeleton Loader
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
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-6 flex items-center gap-2">
                      <SettingsIcon size={16} className="text-indigo-600" />
                      <TranslatedText text="Account Information" />
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                          Account Type
                        </label>
                        <div className="relative group">
                          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <input
                            type="text"
                            value={userProfile?.role ? userProfile.role.replace('_', ' ') : (user?.role ? user.role.replace('_', ' ') : '')}
                            disabled
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-500 cursor-not-allowed"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                          Member Since
                        </label>
                        <div className="relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 text-[10px] flex items-center justify-center font-bold">MS</div>
                          <input
                            type="text"
                            value={userProfile?.createdAt || userProfile?.emailVerifiedAt
                              ? new Date(userProfile.createdAt || userProfile.emailVerifiedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                              : (user?.emailVerifiedAt
                                ? new Date(user.emailVerifiedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                                : '')}
                            disabled
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-500 cursor-not-allowed"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                          Email
                        </label>
                        <div className="relative group">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <input
                            type="text"
                            value={userProfile?.email || user?.email || ''}
                            disabled
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-500 cursor-not-allowed"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                          Company/Tenant
                        </label>
                        <div className="relative group">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <input
                            type="text"
                            value={userProfile?.tenantName || user?.tenantName || ''}
                            disabled
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-500 cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!loading && (
                  <div className="pt-6 border-t border-gray-100">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-6">Account Actions</h3>
                    <div className="flex flex-col md:flex-row gap-4">
                      <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
                        <Check size={14} />
                        Download My Data
                      </button>
                      <button className="px-6 py-3 bg-white text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-50 font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                        <Trash2 size={14} />
                        Deactivate Account
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-8 animate-enter">
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-6 flex items-center gap-2">
                    <Mail size={16} className="text-indigo-600" />
                    Email Notifications
                  </h3>
                  <div className="space-y-4">
                    {[
                      { key: 'cargoUpdates', label: 'Cargo Updates', desc: 'Get notified when your cargo status changes' },
                      { key: 'priceAlerts', label: 'Price Alerts', desc: 'Receive alerts about price changes' },
                      { key: 'systemUpdates', label: 'System Updates', desc: 'Receive notifications about system maintenance' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div>
                          <div className="text-sm font-bold text-gray-900">{item.label}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications[item.key as keyof typeof notifications]}
                            onChange={(e) => handleNotificationChange(item.key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-6 flex items-center gap-2">
                    <Bell size={16} className="text-indigo-600" />
                    Push Notifications
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div>
                        <div className="text-sm font-bold text-gray-900">Enable Push Notifications</div>
                        <div className="text-xs text-slate-500 mt-0.5">Receive notifications in your browser</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.push}
                          onChange={(e) => handleNotificationChange('push', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-8 animate-enter">
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-6 flex items-center gap-2">
                    <Shield size={16} className="text-indigo-600" />
                    Security Settings
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div>
                        <div className="text-sm font-bold text-gray-900">Two-Factor Authentication</div>
                        <div className="text-xs text-slate-500 mt-0.5">Add an extra layer of security to your account</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={security.twoFactorAuth}
                          onChange={(e) => handleSecurityChange('twoFactorAuth', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Session Timeout (minutes)
                      </label>
                      <select
                        value={security.sessionTimeout}
                        onChange={(e) => handleSecurityChange('sessionTimeout', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={120}>2 hours</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div>
                        <div className="text-sm font-bold text-gray-900">Require Password Change</div>
                        <div className="text-xs text-slate-500 mt-0.5">Force password change on next login</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={security.passwordChangeRequired}
                          onChange={(e) => handleSecurityChange('passwordChangeRequired', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-6 flex items-center gap-2">
                    <Lock size={16} className="text-indigo-600" />
                    Password
                  </h3>
                  <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 flex items-center gap-2">
                    <Edit size={14} />
                    Change Password
                  </button>
                </div>
              </div>
            )}

            {/* Preferences Settings */}
            {activeTab === 'preferences' && (
              <div className="space-y-8 animate-enter">
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-6 flex items-center gap-2">
                    <Palette size={16} className="text-indigo-600" />
                    Display Preferences
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Language
                      </label>
                      <div className="relative group">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <select
                          value={preferences.language}
                          onChange={(e) => handlePreferenceChange('language', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none appearance-none"
                        >
                          <option value="en">English</option>
                          <option value="sw">Swahili</option>
                          <option value="fr">French</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Timezone
                      </label>
                      <select
                        value={preferences.timezone}
                        onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                      >
                        <option value="Africa/Nairobi">Nairobi (UTC+3)</option>
                        <option value="Africa/Dar_es_Salaam">Dar es Salaam (UTC+3)</option>
                        <option value="Africa/Kampala">Kampala (UTC+3)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Currency
                      </label>
                      <select
                        value={preferences.currency}
                        onChange={(e) => handlePreferenceChange('currency', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="KES">KES (KSh)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Theme
                      </label>
                      <select
                        value={preferences.theme}
                        onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Team Management Settings */}
            {activeTab === 'team' && (
              <div className="space-y-8 animate-enter">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                      <Users size={16} className="text-indigo-600" />
                      Team Members
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 pl-6">Manage cargo receivers and team members</p>
                  </div>
                  <button
                    onClick={handleAddReceiver}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                  >
                    <UserPlus size={14} />
                    <span>Add Member</span>
                  </button>
                </div>

                {/* Team Members List */}
                <div className="grid grid-cols-1 gap-4">
                  {receivers.map((receiver) => (
                    <div key={receiver.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                            <Users size={20} />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-sm">{receiver.name}</div>
                            <div className="text-xs text-slate-500">{receiver.email}</div>
                            <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">{receiver.role}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${receiver.status === 'active'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : 'bg-gray-50 text-gray-500 border-gray-100'
                            }`}>
                            {receiver.status}
                          </span>
                          <div className="flex items-center gap-1 pl-2 border-l border-gray-100">
                            <button
                              onClick={() => handleEditReceiver(receiver)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Edit"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteReceiver(receiver.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Remove"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-50">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Permissions</div>
                        <div className="flex flex-wrap gap-2">
                          {receiver.permissions.map((permission) => (
                            <span
                              key={permission}
                              className="px-2 py-0.5 bg-gray-50 text-gray-600 border border-gray-100 text-[10px] font-medium rounded-md uppercase tracking-wide"
                            >
                              {permission.replace('_', ' ')}
                            </span>
                          ))}
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

      {/* Add/Edit Receiver Modal */}
      {showAddReceiver && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowAddReceiver(false)}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                {editingReceiver ? 'Edit Team Member' : 'Add Team Member'}
              </h3>
              <button
                onClick={() => setShowAddReceiver(false)}
                className="p-2 text-slate-400 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-50"
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
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={receiverForm.name}
                      onChange={(e) => setReceiverForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={receiverForm.email}
                      onChange={(e) => setReceiverForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      placeholder="e.g. john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Role
                  </label>
                  <select
                    value={receiverForm.role}
                    onChange={(e) => setReceiverForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  >
                    <option value="Cargo Receiver">Cargo Receiver</option>
                    <option value="Assistant Manager">Assistant Manager</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Permissions
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      'view_cargo',
                      'create_cargo',
                      'edit_cargo',
                      'delete_cargo',
                      'publish_cargo'
                    ].map((permission) => (
                      <label key={permission} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={receiverForm.permissions.includes(permission)}
                          onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="text-xs font-medium text-gray-700 capitalize">
                          {permission.replace('_', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setShowAddReceiver(false)}
                className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 font-bold text-xs uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReceiver}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-100"
              >
                {editingReceiver ? 'Save Changes' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default Settings;