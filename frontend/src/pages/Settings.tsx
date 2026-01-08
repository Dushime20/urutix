import React, { useState, useEffect } from 'react';
import { FaCog, FaBell, FaLock, FaKey, FaGlobe, FaPalette, FaUsers, FaPlus, FaEdit, FaTrash, FaUserPlus } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { TranslatedText } from '../components/translated-text';

const Settings: React.FC = () => {
  const { user } = useAuth();
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
    { id: 'general', label: 'General', icon: FaCog },
    { id: 'notifications', label: 'Notifications', icon: FaBell },
    { id: 'security', label: 'Security', icon: FaLock },
    { id: 'preferences', label: 'Preferences', icon: FaPalette },
    { id: 'team', label: 'Team Management', icon: FaUsers },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          <TranslatedText text="Settings" />
        </h1>
        <p className="text-gray-600">
          <TranslatedText text="Manage your account settings and preferences" />
        </p>
      </div>

      {/* Settings Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span><TranslatedText text={tab.label} /></span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  <TranslatedText text="Account Information" />
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Type
                    </label>
                    <input
                      type="text"
                      value={userProfile?.role ? userProfile.role.replace('_', ' ') : (user?.role ? user.role.replace('_', ' ') : '')}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Member Since
                    </label>
                    <input
                      type="text"
                      value={userProfile?.createdAt || userProfile?.emailVerifiedAt 
                        ? new Date(userProfile.createdAt || userProfile.emailVerifiedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                        : (user?.emailVerifiedAt 
                          ? new Date(user.emailVerifiedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                          : '')}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="text"
                      value={userProfile?.email || user?.email || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company/Tenant
                    </label>
                    <input
                      type="text"
                      value={userProfile?.tenantName || user?.tenantName || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Actions</h3>
                <div className="space-y-3">
                  <button className="w-full md:w-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                    Download My Data
                  </button>
                  <button className="w-full md:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 ml-0 md:ml-3">
                    Deactivate Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Cargo Updates</div>
                      <div className="text-sm text-gray-500">Get notified when your cargo status changes</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.cargoUpdates}
                        onChange={(e) => handleNotificationChange('cargoUpdates', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Price Alerts</div>
                      <div className="text-sm text-gray-500">Receive alerts about price changes</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.priceAlerts}
                        onChange={(e) => handleNotificationChange('priceAlerts', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">System Updates</div>
                      <div className="text-sm text-gray-500">Receive notifications about system maintenance</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.systemUpdates}
                        onChange={(e) => handleNotificationChange('systemUpdates', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Push Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Enable Push Notifications</div>
                      <div className="text-sm text-gray-500">Receive notifications in your browser</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.push}
                        onChange={(e) => handleNotificationChange('push', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Two-Factor Authentication</div>
                      <div className="text-sm text-gray-500">Add an extra layer of security to your account</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={security.twoFactorAuth}
                        onChange={(e) => handleSecurityChange('twoFactorAuth', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session Timeout (minutes)
                    </label>
                    <select
                      value={security.sessionTimeout}
                      onChange={(e) => handleSecurityChange('sessionTimeout', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={120}>2 hours</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Require Password Change</div>
                      <div className="text-sm text-gray-500">Force password change on next login</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={security.passwordChangeRequired}
                        onChange={(e) => handleSecurityChange('passwordChangeRequired', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Password</h3>
                <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                  Change Password
                </button>
              </div>
            </div>
          )}

          {/* Preferences Settings */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Display Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <select
                      value={preferences.language}
                      onChange={(e) => handlePreferenceChange('language', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="en">English</option>
                      <option value="sw">Swahili</option>
                      <option value="fr">French</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timezone
                    </label>
                    <select
                      value={preferences.timezone}
                      onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="Africa/Nairobi">Nairobi (UTC+3)</option>
                      <option value="Africa/Dar_es_Salaam">Dar es Salaam (UTC+3)</option>
                      <option value="Africa/Kampala">Kampala (UTC+3)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={preferences.currency}
                      onChange={(e) => handlePreferenceChange('currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="KES">KES (KSh)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Theme
                    </label>
                    <select
                      value={preferences.theme}
                      onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
                  <p className="text-sm text-gray-600">Manage cargo receivers and team members</p>
                </div>
                <button
                  onClick={handleAddReceiver}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
                >
                  <FaUserPlus className="w-4 h-4" />
                  <span>Add Member</span>
                </button>
              </div>

              {/* Team Members List */}
              <div className="space-y-4">
                {receivers.map((receiver) => (
                  <div key={receiver.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <FaUsers className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{receiver.name}</div>
                          <div className="text-sm text-gray-600">{receiver.email}</div>
                          <div className="text-xs text-gray-500">{receiver.role}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          receiver.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {receiver.status}
                        </span>
                        <button
                          onClick={() => handleEditReceiver(receiver)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Edit"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteReceiver(receiver.id)}
                          className="p-1 text-red-400 hover:text-red-600"
                          title="Remove"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-xs text-gray-500 mb-1">Permissions:</div>
                      <div className="flex flex-wrap gap-1">
                        {receiver.permissions.map((permission) => (
                          <span
                            key={permission}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                          >
                            {permission.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add/Edit Receiver Modal */}
              {showAddReceiver && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {editingReceiver ? 'Edit Team Member' : 'Add Team Member'}
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={receiverForm.name}
                          onChange={(e) => setReceiverForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Enter full name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={receiverForm.email}
                          onChange={(e) => setReceiverForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Enter email address"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Role
                        </label>
                        <select
                          value={receiverForm.role}
                          onChange={(e) => setReceiverForm(prev => ({ ...prev, role: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="Cargo Receiver">Cargo Receiver</option>
                          <option value="Assistant Manager">Assistant Manager</option>
                          <option value="Operations Manager">Operations Manager</option>
                          <option value="Account Manager">Account Manager</option>
                        </select>
                      </div>

                      {/* Payment Workflow Permissions */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Payment Workflow Permissions
                        </label>
                        <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={receiverForm.paymentPermissions.canInitiatePayments}
                              onChange={(e) => setReceiverForm(prev => ({
                                ...prev,
                                paymentPermissions: { ...prev.paymentPermissions, canInitiatePayments: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Initiate Payments</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={receiverForm.paymentPermissions.canApprovePayments}
                              onChange={(e) => setReceiverForm(prev => ({
                                ...prev,
                                paymentPermissions: { ...prev.paymentPermissions, canApprovePayments: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Approve Payments</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={receiverForm.paymentPermissions.canRequestPayments}
                              onChange={(e) => setReceiverForm(prev => ({
                                ...prev,
                                paymentPermissions: { ...prev.paymentPermissions, canRequestPayments: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Request Payments</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={receiverForm.paymentPermissions.canViewTransactions}
                              onChange={(e) => setReceiverForm(prev => ({
                                ...prev,
                                paymentPermissions: { ...prev.paymentPermissions, canViewTransactions: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">View Transactions</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={receiverForm.paymentPermissions.canManageFinancing}
                              onChange={(e) => setReceiverForm(prev => ({
                                ...prev,
                                paymentPermissions: { ...prev.paymentPermissions, canManageFinancing: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Manage Financing</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={receiverForm.paymentPermissions.canHandleInsurance}
                              onChange={(e) => setReceiverForm(prev => ({
                                ...prev,
                                paymentPermissions: { ...prev.paymentPermissions, canHandleInsurance: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Handle Insurance</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={receiverForm.paymentPermissions.canProcessRefunds}
                              onChange={(e) => setReceiverForm(prev => ({
                                ...prev,
                                paymentPermissions: { ...prev.paymentPermissions, canProcessRefunds: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Process Refunds</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={receiverForm.paymentPermissions.canGenerateReports}
                              onChange={(e) => setReceiverForm(prev => ({
                                ...prev,
                                paymentPermissions: { ...prev.paymentPermissions, canGenerateReports: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Generate Reports</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={receiverForm.paymentPermissions.canHandleEscrow}
                              onChange={(e) => setReceiverForm(prev => ({
                                ...prev,
                                paymentPermissions: { ...prev.paymentPermissions, canHandleEscrow: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Handle Escrow</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={receiverForm.paymentPermissions.canProcessThirdPartyPayments}
                              onChange={(e) => setReceiverForm(prev => ({
                                ...prev,
                                paymentPermissions: { ...prev.paymentPermissions, canProcessThirdPartyPayments: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Process Third Party Payments</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={receiverForm.paymentPermissions.canManageBankAccounts}
                              onChange={(e) => setReceiverForm(prev => ({
                                ...prev,
                                paymentPermissions: { ...prev.paymentPermissions, canManageBankAccounts: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Manage Bank Accounts</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={receiverForm.paymentPermissions.canHandleMobileMoney}
                              onChange={(e) => setReceiverForm(prev => ({
                                ...prev,
                                paymentPermissions: { ...prev.paymentPermissions, canHandleMobileMoney: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Handle Mobile Money</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={receiverForm.paymentPermissions.canProcessPlatformServices}
                              onChange={(e) => setReceiverForm(prev => ({
                                ...prev,
                                paymentPermissions: { ...prev.paymentPermissions, canProcessPlatformServices: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Process Platform Services</span>
                          </label>
                        </div>
                      </div>

                      {/* Document Handling Permissions */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Document Handling Permissions
                        </label>
                        <div className="space-y-2 border border-gray-200 rounded-lg p-3">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={receiverForm.documentPermissions.canUploadDocuments}
                              onChange={(e) => setReceiverForm(prev => ({
                                ...prev,
                                documentPermissions: { ...prev.documentPermissions, canUploadDocuments: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Upload Documents</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={receiverForm.documentPermissions.canViewDocuments}
                              onChange={(e) => setReceiverForm(prev => ({
                                ...prev,
                                documentPermissions: { ...prev.documentPermissions, canViewDocuments: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">View Documents</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={receiverForm.documentPermissions.canEditDocuments}
                              onChange={(e) => setReceiverForm(prev => ({
                                ...prev,
                                documentPermissions: { ...prev.documentPermissions, canEditDocuments: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Edit Documents</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={receiverForm.documentPermissions.canShareDocuments}
                              onChange={(e) => setReceiverForm(prev => ({
                                ...prev,
                                documentPermissions: { ...prev.documentPermissions, canShareDocuments: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Share Documents</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={receiverForm.documentPermissions.canGenerateReports}
                              onChange={(e) => setReceiverForm(prev => ({
                                ...prev,
                                documentPermissions: { ...prev.documentPermissions, canGenerateReports: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Generate Document Reports</span>
                          </label>
                        </div>
                      </div>

                      {/* Workflow Permissions */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Workflow Permissions
                        </label>
                        <div className="space-y-2 border border-gray-200 rounded-lg p-3">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={receiverForm.workflowPermissions.canCreateWorkflows}
                              onChange={(e) => setReceiverForm(prev => ({
                                ...prev,
                                workflowPermissions: { ...prev.workflowPermissions, canCreateWorkflows: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Create Workflows</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={receiverForm.workflowPermissions.canEditWorkflows}
                              onChange={(e) => setReceiverForm(prev => ({
                                ...prev,
                                workflowPermissions: { ...prev.workflowPermissions, canEditWorkflows: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Edit Workflows</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={receiverForm.workflowPermissions.canAssignTasks}
                              onChange={(e) => setReceiverForm(prev => ({
                                ...prev,
                                workflowPermissions: { ...prev.workflowPermissions, canAssignTasks: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Assign Tasks</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={receiverForm.workflowPermissions.canApproveSteps}
                              onChange={(e) => setReceiverForm(prev => ({
                                ...prev,
                                workflowPermissions: { ...prev.workflowPermissions, canApproveSteps: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Approve Workflow Steps</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={receiverForm.workflowPermissions.canViewWorkflowHistory}
                              onChange={(e) => setReceiverForm(prev => ({
                                ...prev,
                                workflowPermissions: { ...prev.workflowPermissions, canViewWorkflowHistory: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">View Workflow History</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={receiverForm.workflowPermissions.canManageApprovals}
                              onChange={(e) => setReceiverForm(prev => ({
                                ...prev,
                                workflowPermissions: { ...prev.workflowPermissions, canManageApprovals: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Manage Approvals</span>
                          </label>
                        </div>
                      </div>

                      {/* Basic Permissions */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Basic Permissions
                        </label>
                        <div className="space-y-2 border border-gray-200 rounded-lg p-3">
                          {[
                            { key: 'view_cargo', label: 'View Cargo' },
                            { key: 'create_cargo', label: 'Create Cargo' },
                            { key: 'edit_cargo', label: 'Edit Cargo' },
                            { key: 'delete_cargo', label: 'Delete Cargo' },
                            { key: 'publish_cargo', label: 'Publish Cargo' },
                            { key: 'view_analytics', label: 'View Analytics' },
                            { key: 'manage_team', label: 'Manage Team' },
                          ].map((permission) => (
                            <label key={permission.key} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={receiverForm.permissions.includes(permission.key)}
                                onChange={(e) => handlePermissionChange(permission.key, e.target.checked)}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">{permission.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3 mt-6">
                      <button
                        onClick={handleSaveReceiver}
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        {editingReceiver ? 'Update' : 'Add Member'}
                      </button>
                      <button
                        onClick={() => setShowAddReceiver(false)}
                        className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings; 