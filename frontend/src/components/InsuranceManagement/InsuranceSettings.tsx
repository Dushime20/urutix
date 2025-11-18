import React, { useState } from 'react';
import { FaSave, FaBell, FaShieldAlt, FaCog, FaEnvelope, FaSms, FaDesktop, FaMobile, FaCalendarAlt, FaExclamationTriangle, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const InsuranceSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      companyName: 'CargoAI Transport',
      defaultDeductible: 1000,
      autoRenewal: true,
      paymentMethod: 'automatic',
      currency: 'USD',
      timezone: 'UTC-5',
    },
    notifications: {
      email: true,
      sms: false,
      push: true,
      renewalReminders: {
        enabled: true,
        daysInAdvance: [30, 15, 7, 1],
      },
      claimUpdates: {
        enabled: true,
        types: ['status', 'payment', 'document'],
      },
      policyChanges: {
        enabled: true,
        types: ['coverage', 'premium', 'expiration'],
      },
    },
    coverage: {
      defaultLiability: 1000000,
      defaultCollision: 500000,
      defaultComprehensive: 500000,
      defaultCargo: 250000,
      defaultUninsuredMotorist: 500000,
      defaultRoadside: 1000,
      defaultMedical: 10000,
    },
    risk: {
      highRiskThreshold: 70,
      mediumRiskThreshold: 40,
      autoRiskAssessment: true,
      riskUpdateFrequency: 'monthly',
      alertOnRiskIncrease: true,
    },
    integration: {
      accountingSystem: 'QuickBooks',
      fleetManagement: 'Fleetio',
      documentStorage: 'Dropbox',
      apiEnabled: true,
      webhookUrl: '',
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const handleSettingChange = (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value,
      },
    }));
  };

  const handleNestedSettingChange = (section: string, subsection: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [subsection]: {
          ...(prev[section as keyof typeof prev] as any)[subsection],
          [key]: value,
        },
      },
    }));
  };

  const handleArraySettingChange = (section: string, subsection: string, key: string, value: any[]) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [subsection]: {
          ...(prev[section as keyof typeof prev] as any)[subsection],
          [key]: value,
        },
      },
    }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const getSaveButtonContent = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <>
            <FaCog className="animate-spin mr-2" />
            Saving...
          </>
        );
      case 'success':
        return (
          <>
            <FaCheckCircle className="mr-2" />
            Saved!
          </>
        );
      case 'error':
        return (
          <>
            <FaTimesCircle className="mr-2" />
            Error!
          </>
        );
      default:
        return (
          <>
            <FaSave className="mr-2" />
            Save Settings
          </>
        );
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Insurance Settings</h1>
          <p className="text-gray-600">Configure insurance management preferences and system settings</p>
        </div>
        
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
            saveStatus === 'success' 
              ? 'bg-green-600 hover:bg-green-700' 
              : saveStatus === 'error'
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          {getSaveButtonContent()}
        </button>
      </div>

      {/* Settings Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'general', name: 'General', icon: FaCog },
            { id: 'notifications', name: 'Notifications', icon: FaBell },
            { id: 'coverage', name: 'Coverage Defaults', icon: FaShieldAlt },
            { id: 'risk', name: 'Risk Management', icon: FaExclamationTriangle },
            { id: 'integration', name: 'Integrations', icon: FaCog },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm inline-flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="mr-2 h-4 w-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                <input
                  type="text"
                  value={settings.general.companyName}
                  onChange={(e) => handleSettingChange('general', 'companyName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Default Deductible</label>
                <input
                  type="number"
                  value={settings.general.defaultDeductible}
                  onChange={(e) => handleSettingChange('general', 'defaultDeductible', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Auto-Renewal</label>
                <select
                  value={settings.general.autoRenewal ? 'enabled' : 'disabled'}
                  onChange={(e) => handleSettingChange('general', 'autoRenewal', e.target.value === 'enabled')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="enabled">Enabled</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select
                  value={settings.general.paymentMethod}
                  onChange={(e) => handleSettingChange('general', 'paymentMethod', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                <select
                  value={settings.general.currency}
                  onChange={(e) => handleSettingChange('general', 'currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD (C$)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Channels</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="email-notifications"
                  checked={settings.notifications.email}
                  onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="email-notifications" className="ml-2 flex items-center">
                  <FaEnvelope className="mr-2 text-gray-400" />
                  Email Notifications
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sms-notifications"
                  checked={settings.notifications.sms}
                  onChange={(e) => handleSettingChange('notifications', 'sms', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="sms-notifications" className="ml-2 flex items-center">
                  <FaSms className="mr-2 text-gray-400" />
                  SMS Notifications
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="push-notifications"
                  checked={settings.notifications.push}
                  onChange={(e) => handleSettingChange('notifications', 'push', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="push-notifications" className="ml-2 flex items-center">
                  <FaDesktop className="mr-2 text-gray-400" />
                  Push Notifications
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Renewal Reminders</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="renewal-reminders"
                  checked={settings.notifications.renewalReminders.enabled}
                  onChange={(e) => handleNestedSettingChange('notifications', 'renewalReminders', 'enabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="renewal-reminders" className="ml-2">Enable Renewal Reminders</label>
              </div>
              
              {settings.notifications.renewalReminders.enabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Remind me (days in advance)</label>
                  <div className="flex flex-wrap gap-2">
                    {[1, 3, 7, 15, 30, 60].map((days) => (
                      <label key={days} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.notifications.renewalReminders.daysInAdvance.includes(days)}
                          onChange={(e) => {
                            const current = settings.notifications.renewalReminders.daysInAdvance;
                            const newValue = e.target.checked
                              ? [...current, days].sort((a, b) => a - b)
                              : current.filter(d => d !== days);
                            handleArraySettingChange('notifications', 'renewalReminders', 'daysInAdvance', newValue);
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{days} days</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Claim Updates</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="claim-updates"
                  checked={settings.notifications.claimUpdates.enabled}
                  onChange={(e) => handleNestedSettingChange('notifications', 'claimUpdates', 'enabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="claim-updates" className="ml-2">Enable Claim Update Notifications</label>
              </div>
              
              {settings.notifications.claimUpdates.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['status', 'payment', 'document'].map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.notifications.claimUpdates.types.includes(type)}
                        onChange={(e) => {
                          const current = settings.notifications.claimUpdates.types;
                          const newValue = e.target.checked
                            ? [...current, type]
                            : current.filter(t => t !== type);
                          handleArraySettingChange('notifications', 'claimUpdates', 'types', newValue);
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">{type} Updates</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Coverage Defaults */}
      {activeTab === 'coverage' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Default Coverage Limits</h3>
            <p className="text-sm text-gray-600 mb-4">These values will be used as defaults when creating new policies</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Liability Coverage</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={settings.coverage.defaultLiability}
                    onChange={(e) => handleSettingChange('coverage', 'defaultLiability', parseInt(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Collision Coverage</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={settings.coverage.defaultCollision}
                    onChange={(e) => handleSettingChange('coverage', 'defaultCollision', parseInt(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comprehensive Coverage</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={settings.coverage.defaultComprehensive}
                    onChange={(e) => handleSettingChange('coverage', 'defaultComprehensive', parseInt(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cargo Coverage</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={settings.coverage.defaultCargo}
                    onChange={(e) => handleSettingChange('coverage', 'defaultCargo', parseInt(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Risk Management */}
      {activeTab === 'risk' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">High Risk Threshold (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.risk.highRiskThreshold}
                  onChange={(e) => handleSettingChange('risk', 'highRiskThreshold', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Policies above this threshold are considered high risk</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Medium Risk Threshold (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.risk.mediumRiskThreshold}
                  onChange={(e) => handleSettingChange('risk', 'mediumRiskThreshold', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Policies above this threshold are considered medium risk</p>
              </div>
            </div>
            
            <div className="mt-6 space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="auto-risk-assessment"
                  checked={settings.risk.autoRiskAssessment}
                  onChange={(e) => handleSettingChange('risk', 'autoRiskAssessment', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="auto-risk-assessment" className="ml-2">Enable Automatic Risk Assessment</label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Risk Update Frequency</label>
                <select
                  value={settings.risk.riskUpdateFrequency}
                  onChange={(e) => handleSettingChange('risk', 'riskUpdateFrequency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="alert-risk-increase"
                  checked={settings.risk.alertOnRiskIncrease}
                  onChange={(e) => handleSettingChange('risk', 'alertOnRiskIncrease', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="alert-risk-increase" className="ml-2">Alert on Risk Increase</label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Integrations */}
      {activeTab === 'integration' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Third-Party Integrations</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Accounting System</label>
                <select
                  value={settings.integration.accountingSystem}
                  onChange={(e) => handleSettingChange('integration', 'accountingSystem', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="QuickBooks">QuickBooks</option>
                  <option value="Xero">Xero</option>
                  <option value="Sage">Sage</option>
                  <option value="FreshBooks">FreshBooks</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fleet Management</label>
                <select
                  value={settings.integration.fleetManagement}
                  onChange={(e) => handleSettingChange('integration', 'fleetManagement', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Fleetio">Fleetio</option>
                  <option value="Samsara">Samsara</option>
                  <option value="Geotab">Geotab</option>
                  <option value="Verizon Connect">Verizon Connect</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Document Storage</label>
                <select
                  value={settings.integration.documentStorage}
                  onChange={(e) => handleSettingChange('integration', 'documentStorage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Dropbox">Dropbox</option>
                  <option value="Google Drive">Google Drive</option>
                  <option value="OneDrive">OneDrive</option>
                  <option value="Box">Box</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">API Access</label>
                <select
                  value={settings.integration.apiEnabled ? 'enabled' : 'disabled'}
                  onChange={(e) => handleSettingChange('integration', 'apiEnabled', e.target.value === 'enabled')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="enabled">Enabled</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>
            
            {settings.integration.apiEnabled && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
                <input
                  type="url"
                  value={settings.integration.webhookUrl}
                  onChange={(e) => handleSettingChange('integration', 'webhookUrl', e.target.value)}
                  placeholder="https://your-domain.com/webhook"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">URL to receive real-time insurance updates</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InsuranceSettings;
