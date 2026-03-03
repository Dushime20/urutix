import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTenant, getTenantById, activateTenant, suspendTenant } from '../services/adminApi';
import toast from 'react-hot-toast';
import {
  FaTimes, FaSave, FaCog, FaCreditCard, FaBell,
  FaCheckCircle, FaTimesCircle, FaGlobe, FaUsers,
  FaTruck, FaUser, FaBox, FaShieldAlt, FaChartLine,
  FaBan, FaPlay, FaPause, FaExclamationTriangle, FaSync
} from 'react-icons/fa';

interface TenantSettingsModalProps {
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface TenantData {
  id: string;
  name: string;
  subdomain?: string;
  domain?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  websiteUrl?: string;
  subscriptionPlan?: string;
  maxUsers?: number;
  maxTrucks?: number;
  maxDrivers?: number;
  maxLoadsPerMonth?: number;
  status?: string;
  isActive?: boolean;
  updatedAt?: string;
  settings?: {
    timezone?: string;
    language?: string;
    currency?: string;
    dateFormat?: string;
    notifications?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
    };
  };
  features?: {
    loads?: boolean;
    tracking?: boolean;
    payments?: boolean;
    analytics?: boolean;
    api_access?: boolean;
    multi_user?: boolean;
    fleet_management?: boolean;
    document_management?: boolean;
    insurance_management?: boolean;
    loan_management?: boolean;
  };
  billingInfo?: {
    plan?: string;
    billing_cycle?: string;
    payment_method?: string;
  };
}

const TenantSettingsModal: React.FC<TenantSettingsModalProps> = ({
  tenantId,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('status');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [tenantData, setTenantData] = useState<TenantData | null>(null);

  // Fetch tenant data when modal opens - always get fresh data from database
  useEffect(() => {
    if (isOpen && tenantId) {
      fetchTenantData();
    }
  }, [isOpen, tenantId]);

  const fetchTenantData = async () => {
    try {
      setIsLoading(true);
      const response = await getTenantById(tenantId);
      // Backend returns: { success: true, data: tenant, message: "...", ... }
      // Extract tenant from response.data or response.tenant or response itself
      const tenant = response?.data || response?.tenant || response;
      
      // Ensure we have the actual status from database
      if (tenant) {
        setTenantData({
          ...tenant,
          status: tenant.status || 'PENDING_ACTIVATION', // Ensure status is always set
        });
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to load tenant data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<TenantData>) => {
      return await updateTenant(tenantId, data);
    },
    onSuccess: () => {
      toast.success('Tenant settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update tenant settings');
    },
  });

  const handleSave = async () => {
    if (!tenantData) return;

    try {
      setIsSaving(true);
      await updateMutation.mutateAsync(tenantData);
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivate = async () => {
    if (!tenantData) return;
    try {
      setIsChangingStatus(true);
      const response = await activateTenant(tenantId);
      toast.success('Tenant activated successfully');
      await fetchTenantData(); // Refresh data
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
    } catch (error: any) {
      console.error('❌ Tenant activation failed:', error);
      
      // Extract detailed error message from backend
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to activate tenant';
      
      // Show detailed error with helpful context
      if (errorMessage.includes('Missing requirements')) {
        toast.error(
          <div>
            <div className="font-semibold">Cannot activate tenant</div>
            <div className="text-sm mt-1">{errorMessage}</div>
            <div className="text-xs mt-2 opacity-80">Please ensure all required fields are filled and at least one admin user is assigned.</div>
          </div>,
          { duration: 6000 }
        );
      } else if (errorMessage.includes('admin user')) {
        toast.error(
          <div>
            <div className="font-semibold">No admin user found</div>
            <div className="text-sm mt-1">This tenant must have at least one admin user before activation.</div>
            <div className="text-xs mt-2 opacity-80">Contact support to assign an admin user to this tenant.</div>
          </div>,
          { duration: 6000 }
        );
      } else {
        toast.error(errorMessage, { duration: 5000 });
      }
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleSuspend = async () => {
    if (!tenantData) return;
    try {
      setIsChangingStatus(true);
      const response = await suspendTenant(tenantId, suspendReason || undefined);
      toast.success('Tenant suspended successfully');
      setShowSuspendModal(false);
      setSuspendReason('');
      await fetchTenantData(); // Refresh data
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to suspend tenant');
    } finally {
      setIsChangingStatus(false);
    }
  };

  const updateField = (field: string, value: any) => {
    if (!tenantData) return;
    setTenantData({ ...tenantData, [field]: value });
  };

  const updateNestedField = (parent: string, field: string, value: any) => {
    if (!tenantData) return;
    setTenantData({
      ...tenantData,
      [parent]: {
        ...(tenantData[parent as keyof TenantData] as any),
        [field]: value,
      },
    });
  };

  const updateNestedNestedField = (parent: string, child: string, field: string, value: any) => {
    if (!tenantData) return;
    const parentData = tenantData[parent as keyof TenantData] as any;
    setTenantData({
      ...tenantData,
      [parent]: {
        ...parentData,
        [child]: {
          ...(parentData?.[child] || {}),
          [field]: value,
        },
      },
    });
  };

  const getStatusColor = (status?: string) => {
    const statusMap: Record<string, string> = {
      'ACTIVE': 'bg-green-100 text-green-800 border-green-200',
      'PENDING_ACTIVATION': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'SUSPENDED': 'bg-red-100 text-red-800 border-red-200',
      'DEACTIVATED': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return statusMap[status || 'PENDING_ACTIVATION'] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return <FaCheckCircle className="w-5 h-5 text-green-600" />;
      case 'PENDING_ACTIVATION':
        return <FaExclamationTriangle className="w-5 h-5 text-yellow-600" />;
      case 'SUSPENDED':
        return <FaBan className="w-5 h-5 text-red-600" />;
      case 'DEACTIVATED':
        return <FaTimesCircle className="w-5 h-5 text-gray-600" />;
      default:
        return <FaExclamationTriangle className="w-5 h-5 text-yellow-600" />;
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'status', label: 'Status', icon: FaCheckCircle },
    { id: 'settings', label: 'System Settings', icon: FaGlobe },
    { id: 'subscription', label: 'Subscription & Limits', icon: FaUsers },
    { id: 'features', label: 'Features', icon: FaCheckCircle },
    { id: 'billing', label: 'Billing', icon: FaCreditCard },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-5xl p-0 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Tenant Settings</h3>
              <p className="text-sm text-gray-500 mt-1">{tenantData?.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : tenantData ? (
              <>
                {/* Status Management Tab */}
                {activeTab === 'status' && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 mb-6">
                      <h4 className="text-sm font-semibold text-blue-900 mb-1">Tenant Status Management</h4>
                      <p className="text-xs text-blue-700">Manage tenant activation status. Tenants start as PENDING_ACTIVATION and must be activated to become operational.</p>
                    </div>

                    {/* Current Status */}
                    <div className="bg-white border-2 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">Current Status</h4>
                          <p className="text-sm text-gray-500">
                            Tenant is currently <span className="font-semibold">{tenantData.status?.replace('_', ' ').toLowerCase() || 'pending activation'}</span>
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Last updated: {tenantData.updatedAt ? new Date(tenantData.updatedAt).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                        <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 ${getStatusColor(tenantData.status)}`}>
                          {getStatusIcon(tenantData.status)}
                          <span className="font-semibold">{tenantData.status?.replace('_', ' ') || 'PENDING_ACTIVATION'}</span>
                        </div>
                      </div>

                      {tenantData.isActive !== undefined && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Active Flag:</span>
                            {tenantData.isActive ? (
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center space-x-1">
                                <FaCheckCircle className="w-3 h-3" />
                                <span>Active</span>
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium flex items-center space-x-1">
                                <FaTimesCircle className="w-3 h-3" />
                                <span>Inactive</span>
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Update Status Section */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">Update Status</h4>
                        <button
                          onClick={fetchTenantData}
                          disabled={isLoading}
                          className="flex items-center space-x-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Refresh status from database"
                        >
                          <FaSync className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                          <span>Refresh</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Change Status
                          </label>
                          <select
                            value={tenantData.status || 'PENDING_ACTIVATION'}
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              setTenantData({ ...tenantData, status: newStatus });
                            }}
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="PENDING_ACTIVATION">Pending Activation</option>
                            <option value="ACTIVE">Active</option>
                            <option value="SUSPENDED">Suspended</option>
                            <option value="DEACTIVATED">Deactivated</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-1.5">
                            Current database status: <span className="font-semibold">{tenantData.status || 'PENDING_ACTIVATION'}</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Select a new status and click "Update Status" to save changes.
                          </p>
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={async () => {
                              if (!tenantData) return;
                              try {
                                setIsChangingStatus(true);
                                await updateTenant(tenantId, { status: tenantData.status });
                                toast.success('Tenant status updated successfully');
                                // Force refresh from database
                                await fetchTenantData();
                                queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
                                queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
                              } catch (error: any) {
                                toast.error(error?.response?.data?.message || 'Failed to update tenant status');
                                // Refresh to get actual status on error
                                await fetchTenantData();
                              } finally {
                                setIsChangingStatus(false);
                              }
                            }}
                            disabled={isChangingStatus || !tenantData.status}
                            className="w-full px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                          >
                            {isChangingStatus ? (
                              <>
                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                                <span>Updating...</span>
                              </>
                            ) : (
                              <>
                                <FaSave className="w-3.5 h-3.5" />
                                <span>Update Status</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Status Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tenantData.status === 'PENDING_ACTIVATION' && (
                        <button
                          onClick={handleActivate}
                          disabled={isChangingStatus}
                          className="flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                          {isChangingStatus ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>Activating...</span>
                            </>
                          ) : (
                            <>
                              <FaPlay className="w-5 h-5" />
                              <span className="font-semibold">Activate Tenant</span>
                            </>
                          )}
                        </button>
                      )}

                      {tenantData.status === 'ACTIVE' && (
                        <button
                          onClick={() => setShowSuspendModal(true)}
                          disabled={isChangingStatus}
                          className="flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                          <FaBan className="w-5 h-5" />
                          <span className="font-semibold">Suspend Tenant</span>
                        </button>
                      )}

                      {tenantData.status === 'SUSPENDED' && (
                        <button
                          onClick={handleActivate}
                          disabled={isChangingStatus}
                          className="flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                          {isChangingStatus ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>Reactivating...</span>
                            </>
                          ) : (
                            <>
                              <FaPlay className="w-5 h-5" />
                              <span className="font-semibold">Reactivate Tenant</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Status Information */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Status Information</h5>
                      <div className="space-y-2 text-xs text-gray-600">
                        <div className="flex items-start space-x-2">
                          <FaCheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                          <div>
                            <span className="font-medium">ACTIVE:</span> Tenant is operational and users can access the system.
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <FaExclamationTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                          <div>
                            <span className="font-medium">PENDING_ACTIVATION:</span> New tenant awaiting admin approval. Users cannot access the system.
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <FaBan className="w-4 h-4 text-red-600 mt-0.5" />
                          <div>
                            <span className="font-medium">SUSPENDED:</span> Tenant is temporarily disabled. Can be reactivated.
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <FaTimesCircle className="w-4 h-4 text-gray-600 mt-0.5" />
                          <div>
                            <span className="font-medium">DEACTIVATED:</span> Tenant is permanently deactivated (soft deleted).
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* System Settings Tab */}
                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <h4 className="text-sm font-semibold text-blue-900 mb-1">System Configuration</h4>
                      <p className="text-xs text-blue-700">Configure timezone, language, currency, and notification preferences for this tenant.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Timezone
                        </label>
                        <select
                          value={tenantData.settings?.timezone || 'UTC'}
                          onChange={(e) => updateNestedField('settings', 'timezone', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="UTC">UTC</option>
                          <option value="Africa/Nairobi">Africa/Nairobi</option>
                          <option value="Africa/Kigali">Africa/Kigali</option>
                          <option value="America/New_York">America/New_York</option>
                          <option value="Europe/London">Europe/London</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Language
                        </label>
                        <select
                          value={tenantData.settings?.language || 'en'}
                          onChange={(e) => updateNestedField('settings', 'language', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="en">English</option>
                          <option value="fr">French</option>
                          <option value="sw">Swahili</option>
                          <option value="rw">Kinyarwanda</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Currency
                        </label>
                        <select
                          value={tenantData.settings?.currency || 'USD'}
                          onChange={(e) => updateNestedField('settings', 'currency', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="USD">USD</option>
                          <option value="KES">KES</option>
                          <option value="RWF">RWF</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Date Format
                        </label>
                        <select
                          value={tenantData.settings?.dateFormat || 'MM/DD/YYYY'}
                          onChange={(e) => updateNestedField('settings', 'dateFormat', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                        <FaBell className="w-5 h-5" />
                        <span>Notification Preferences</span>
                      </h4>
                      <div className="space-y-4">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={tenantData.settings?.notifications?.email ?? true}
                            onChange={(e) => updateNestedNestedField('settings', 'notifications', 'email', e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Email Notifications</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={tenantData.settings?.notifications?.sms ?? false}
                            onChange={(e) => updateNestedNestedField('settings', 'notifications', 'sms', e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">SMS Notifications</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={tenantData.settings?.notifications?.push ?? true}
                            onChange={(e) => updateNestedNestedField('settings', 'notifications', 'push', e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Push Notifications</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Subscription Tab */}
                {activeTab === 'subscription' && (
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                      <h4 className="text-sm font-semibold text-green-900 mb-1">Subscription & Resource Limits</h4>
                      <p className="text-xs text-green-700">Manage subscription plan and set limits for users, trucks, drivers, and monthly loads.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Subscription Plan
                        </label>
                        <select
                          value={tenantData.subscriptionPlan || 'starter'}
                          onChange={(e) => updateField('subscriptionPlan', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="starter">Starter</option>
                          <option value="professional">Professional</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Max Users
                        </label>
                        <input
                          type="number"
                          value={tenantData.maxUsers || ''}
                          onChange={(e) => updateField('maxUsers', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Unlimited (leave empty)"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Max Trucks
                        </label>
                        <input
                          type="number"
                          value={tenantData.maxTrucks || ''}
                          onChange={(e) => updateField('maxTrucks', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Unlimited (leave empty)"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Max Drivers
                        </label>
                        <input
                          type="number"
                          value={tenantData.maxDrivers || ''}
                          onChange={(e) => updateField('maxDrivers', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Unlimited (leave empty)"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Max Loads Per Month
                        </label>
                        <input
                          type="number"
                          value={tenantData.maxLoadsPerMonth || ''}
                          onChange={(e) => updateField('maxLoadsPerMonth', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Unlimited (leave empty)"
                        />
                      </div>
                    </div>
                  </div>
                )}


                {/* Features Tab */}
                {activeTab === 'features' && (
                  <div className="space-y-6">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                      <h4 className="text-sm font-semibold text-purple-900 mb-1">Feature Management</h4>
                      <p className="text-xs text-purple-700">Enable or disable specific features for this tenant. Disabled features will not be accessible to tenant users.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { key: 'loads', label: 'Loads Management', icon: FaBox },
                        { key: 'tracking', label: 'Tracking', icon: FaGlobe },
                        { key: 'payments', label: 'Payments', icon: FaCreditCard },
                        { key: 'analytics', label: 'Analytics', icon: FaChartLine },
                        { key: 'api_access', label: 'API Access', icon: FaCog },
                        { key: 'multi_user', label: 'Multi-User', icon: FaUsers },
                        { key: 'fleet_management', label: 'Fleet Management', icon: FaTruck },
                        { key: 'document_management', label: 'Document Management', icon: FaShieldAlt },
                        { key: 'insurance_management', label: 'Insurance Management', icon: FaShieldAlt },
                        { key: 'loan_management', label: 'Loan Management', icon: FaCreditCard },
                      ].map((feature) => {
                        const Icon = feature.icon;
                        return (
                          <label
                            key={feature.key}
                            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={tenantData.features?.[feature.key as keyof typeof tenantData.features] ?? false}
                              onChange={(e) => updateNestedField('features', feature.key, e.target.checked)}
                              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <Icon className="w-5 h-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">{feature.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Billing Tab */}
                {activeTab === 'billing' && (
                  <div className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                      <h4 className="text-sm font-semibold text-yellow-900 mb-1">Billing Configuration</h4>
                      <p className="text-xs text-yellow-700">Configure billing plan, cycle, and payment method for this tenant.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Billing Plan
                        </label>
                        <select
                          value={tenantData.billingInfo?.plan || 'starter'}
                          onChange={(e) => updateNestedField('billingInfo', 'plan', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="starter">Starter</option>
                          <option value="professional">Professional</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Billing Cycle
                        </label>
                        <select
                          value={tenantData.billingInfo?.billing_cycle || 'monthly'}
                          onChange={(e) => updateNestedField('billingInfo', 'billing_cycle', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="annual">Annual</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Payment Method
                        </label>
                        <select
                          value={tenantData.billingInfo?.payment_method || ''}
                          onChange={(e) => updateNestedField('billingInfo', 'payment_method', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Not Set</option>
                          <option value="credit_card">Credit Card</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="paypal">PayPal</option>
                          <option value="stripe">Stripe</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">No tenant data available</div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FaSave className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Suspend Confirmation Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowSuspendModal(false)}></div>

            <div className="inline-block w-full max-w-md p-0 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                  <FaBan className="w-5 h-5 text-red-600" />
                  <span>Suspend Tenant</span>
                </h3>
              </div>

              <div className="p-6">
                <p className="text-xs text-gray-600 mb-3">
                  Are you sure you want to suspend this tenant? Suspended tenants will not be able to access the system.
                </p>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Reason (Optional)
                </label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter reason for suspension..."
                />
              </div>

              <div className="flex items-center justify-end space-x-2 px-4 py-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    setShowSuspendModal(false);
                    setSuspendReason('');
                  }}
                  className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSuspend}
                  disabled={isChangingStatus}
                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isChangingStatus ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                      <span>Suspending...</span>
                    </>
                  ) : (
                    <>
                      <FaBan className="w-3.5 h-3.5" />
                      <span>Suspend Tenant</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantSettingsModal;

