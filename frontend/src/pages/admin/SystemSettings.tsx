import React, { useState, useEffect } from 'react';
import { 
  FaCog, FaBell, FaDatabase, FaShieldAlt,
  FaPalette, FaCode, FaUsers, FaKey, FaHistory,
  FaEdit, FaSave, FaUndo, FaExclamationTriangle,
  FaEye, FaEyeSlash, FaCopy, FaSync, FaUpload,
  FaDownload, FaTrash, FaCheck, FaTimes
} from 'react-icons/fa';

const SystemSettings: React.FC = () => {
  const [activeSection, setActiveSection] = useState('general');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const settingSections = [
    { id: 'general', label: 'General Settings', icon: FaCog },
    { id: 'users', label: 'User Management', icon: FaUsers },
    { id: 'security', label: 'Security & Privacy', icon: FaShieldAlt },
    { id: 'notifications', label: 'Notifications', icon: FaBell },
    { id: 'database', label: 'Database Config', icon: FaDatabase },
    { id: 'api', label: 'API Settings', icon: FaCode },
    { id: 'appearance', label: 'Appearance', icon: FaPalette },
    { id: 'backup', label: 'Backup & Recovery', icon: FaHistory },
    { id: 'integrations', label: 'Integrations', icon: FaCode },
    { id: 'maintenance', label: 'Maintenance', icon: FaCog },
  ];

  const [settings, setSettings] = useState({
    general: {
      siteName: 'UrutiX Cargo Platform',
      siteDescription: 'Advanced cargo matching and logistics platform',
      timezone: 'Africa/Kigali',
      language: 'English',
      currency: 'RWF',
      maintenanceMode: false,
      contactEmail: 'admin@urutix.com',
      supportPhone: '+250 788 123 456',
      businessHours: '24/7',
    },
    security: {
      twoFactorAuth: true,
      sessionTimeout: 30,
      passwordMinLength: 8,
      loginAttempts: 5,
      ipWhitelist: true,
      encryptionLevel: 'AES-256',
      sslRequired: true,
      passwordExpiry: 90,
      accountLockout: true,
      lockoutDuration: 15,
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      adminAlerts: true,
      userWelcomeEmail: true,
      systemUpdates: true,
      shipmentUpdates: true,
      paymentNotifications: true,
      disputeAlerts: true,
    },
    api: {
      rateLimitEnabled: true,
      requestsPerMinute: 100,
      apiVersion: 'v2.1',
      corsEnabled: true,
      apiKey: 'urutix_api_key_2024_secret_12345',
      webhooksEnabled: true,
      apiDocumentation: true,
      sandboxMode: false,
      maxPayloadSize: '10MB',
    },
    appearance: {
      primaryColor: '#3B82F6',
      secondaryColor: '#8B5CF6',
      theme: 'light',
      logoUrl: '/logo-urutix.svg',
      faviconUrl: '/favicon.ico',
      customCSS: '',
      enableDarkMode: true,
      showBranding: true,
    },
    database: {
      connectionPool: 20,
      queryTimeout: 30,
      backupFrequency: 'daily',
      backupRetention: 30,
      enableLogging: true,
      slowQueryThreshold: 1000,
      maxConnections: 100,
    },
    integrations: {
      googleMaps: true,
      stripe: true,
      twilio: false,
      sendgrid: true,
      slack: false,
      webhookEndpoints: ['https://api.example.com/webhook'],
    },
    maintenance: {
      scheduledMaintenance: false,
      maintenanceStart: '2024-08-15T02:00:00',
      maintenanceDuration: 2,
      maintenanceMessage: 'System maintenance in progress. Please check back later.',
      enableBackupMode: false,
      showMaintenancePage: true,
    }
  });

  const [backupHistory, setBackupHistory] = useState([
    {
      id: '1',
      filename: 'backup_2024_08_09_120000.sql',
      size: '2.4 GB',
      status: 'completed',
      timestamp: '2024-08-09 12:00:00',
      type: 'full'
    },
    {
      id: '2',
      filename: 'backup_2024_08_08_120000.sql',
      size: '2.3 GB',
      status: 'completed',
      timestamp: '2024-08-08 12:00:00',
      type: 'full'
    },
    {
      id: '3',
      filename: 'backup_2024_08_07_120000.sql',
      size: '2.2 GB',
      status: 'failed',
      timestamp: '2024-08-07 12:00:00',
      type: 'full'
    }
  ]);

  const handleInputChange = (section: keyof typeof settings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setUnsavedChanges(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setUnsavedChanges(false);
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Error saving settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all changes?')) {
      setUnsavedChanges(false);
      // Reset to original values
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(settings.api.apiKey);
    alert('API key copied to clipboard!');
  };

  const regenerateApiKey = () => {
    if (confirm('Are you sure you want to regenerate the API key? This will invalidate all existing integrations.')) {
      const newKey = 'urutix_api_key_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      handleInputChange('api', 'apiKey', newKey);
    }
  };

  const createBackup = () => {
    setIsLoading(true);
    setTimeout(() => {
      const newBackup = {
        id: Date.now().toString(),
        filename: `backup_${new Date().toISOString().slice(0, 19).replace(/:/g, '_')}.sql`,
        size: '2.5 GB',
        status: 'completed',
        timestamp: new Date().toLocaleString(),
        type: 'full'
      };
      setBackupHistory(prev => [newBackup, ...prev]);
      setIsLoading(false);
      alert('Backup created successfully!');
    }, 3000);
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
          <input
            type="text"
            value={settings.general.siteName}
            onChange={(e) => handleInputChange('general', 'siteName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
          <input
            type="email"
            value={settings.general.contactEmail}
            onChange={(e) => handleInputChange('general', 'contactEmail', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Site Description</label>
        <textarea
          value={settings.general.siteDescription}
          onChange={(e) => handleInputChange('general', 'siteDescription', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
          <select
            value={settings.general.timezone}
            onChange={(e) => handleInputChange('general', 'timezone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="Africa/Kigali">Africa/Kigali</option>
            <option value="UTC">UTC</option>
            <option value="Africa/Nairobi">Africa/Nairobi</option>
            <option value="Africa/Dar_es_Salaam">Africa/Dar es Salaam</option>
            <option value="Africa/Kampala">Africa/Kampala</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
          <select
            value={settings.general.language}
            onChange={(e) => handleInputChange('general', 'language', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="English">English</option>
            <option value="Kinyarwanda">Kinyarwanda</option>
            <option value="French">French</option>
            <option value="Swahili">Swahili</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
          <select
            value={settings.general.currency}
            onChange={(e) => handleInputChange('general', 'currency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="RWF">Rwandan Franc (RWF)</option>
            <option value="USD">US Dollar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="KES">Kenyan Shilling (KES)</option>
            <option value="UGX">Ugandan Shilling (UGX)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-800">Maintenance Mode</h4>
            <p className="text-sm text-gray-600">Temporarily disable the platform</p>
          </div>
          <input
            type="checkbox"
            id="maintenanceMode"
            checked={settings.general.maintenanceMode}
            onChange={(e) => handleInputChange('general', 'maintenanceMode', e.target.checked)}
            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
        </div>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-800">Business Hours</h4>
            <p className="text-sm text-gray-600">Platform availability</p>
          </div>
          <select
            value={settings.general.businessHours}
            onChange={(e) => handleInputChange('general', 'businessHours', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="24/7">24/7</option>
            <option value="8AM-6PM">8AM-6PM</option>
            <option value="9AM-5PM">9AM-5PM</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <FaExclamationTriangle className="text-yellow-600 mr-2" />
          <span className="text-sm text-yellow-800">
            Changes to security settings will affect all users immediately.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-800">Two-Factor Authentication</h4>
              <p className="text-sm text-gray-600">Require 2FA for all admin accounts</p>
            </div>
            <input
              type="checkbox"
              checked={settings.security.twoFactorAuth}
              onChange={(e) => handleInputChange('security', 'twoFactorAuth', e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-800">IP Whitelist</h4>
              <p className="text-sm text-gray-600">Restrict admin access by IP</p>
            </div>
            <input
              type="checkbox"
              checked={settings.security.ipWhitelist}
              onChange={(e) => handleInputChange('security', 'ipWhitelist', e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-800">SSL Required</h4>
              <p className="text-sm text-gray-600">Force HTTPS connections</p>
            </div>
            <input
              type="checkbox"
              checked={settings.security.sslRequired}
              onChange={(e) => handleInputChange('security', 'sslRequired', e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-800">Account Lockout</h4>
              <p className="text-sm text-gray-600">Lock accounts after failed attempts</p>
            </div>
            <input
              type="checkbox"
              checked={settings.security.accountLockout}
              onChange={(e) => handleInputChange('security', 'accountLockout', e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
            <input
              type="number"
              value={settings.security.sessionTimeout}
              onChange={(e) => handleInputChange('security', 'sessionTimeout', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password Min Length</label>
            <input
              type="number"
              value={settings.security.passwordMinLength}
              onChange={(e) => handleInputChange('security', 'passwordMinLength', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
            <input
              type="number"
              value={settings.security.loginAttempts}
              onChange={(e) => handleInputChange('security', 'loginAttempts', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password Expiry (days)</label>
            <input
              type="number"
              value={settings.security.passwordExpiry}
              onChange={(e) => handleInputChange('security', 'passwordExpiry', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lockout Duration (minutes)</label>
            <input
              type="number"
              value={settings.security.lockoutDuration}
              onChange={(e) => handleInputChange('security', 'lockoutDuration', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">System Notifications</h3>
          
          {Object.entries(settings.notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </h4>
                <p className="text-sm text-gray-600">
                  {key === 'emailNotifications' && 'Send notifications via email'}
                  {key === 'smsNotifications' && 'Send notifications via SMS'}
                  {key === 'pushNotifications' && 'Send browser push notifications'}
                  {key === 'adminAlerts' && 'Send alerts to administrators'}
                  {key === 'userWelcomeEmail' && 'Send welcome email to new users'}
                  {key === 'systemUpdates' && 'Notify about system updates'}
                  {key === 'shipmentUpdates' && 'Notify about shipment status changes'}
                  {key === 'paymentNotifications' && 'Send payment confirmations'}
                  {key === 'disputeAlerts' && 'Alert about payment disputes'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={value as boolean}
                onChange={(e) => handleInputChange('notifications', key, e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Email Templates</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800">Welcome Email</span>
                <FaEdit className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mt-1">Email sent to new users</p>
            </button>
            
            <button className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800">Password Reset</span>
                <FaEdit className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mt-1">Password reset instructions</p>
            </button>
            
            <button className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800">Shipment Updates</span>
                <FaEdit className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mt-1">Cargo status notifications</p>
            </button>

            <button className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800">Payment Confirmations</span>
                <FaEdit className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mt-1">Payment success notifications</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAPISettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
          <div className="flex">
            <div className="relative flex-1">
              <input
                type={showApiKey ? "text" : "password"}
                value={settings.api.apiKey}
                onChange={(e) => handleInputChange('api', 'apiKey', e.target.value)}
                className="w-full pl-4 pr-20 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-purple-500"
                readOnly
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <button 
              onClick={copyApiKey}
              className="px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 transition-colors"
            >
              <FaCopy />
            </button>
            <button 
              onClick={regenerateApiKey}
              className="px-4 py-2 bg-purple-600 text-white rounded-r-lg hover:bg-purple-700 transition-colors"
            >
              <FaSync />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Keep this key secure. Regenerating will invalidate all existing integrations.</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Requests per Minute</label>
          <input
            type="number"
            value={settings.api.requestsPerMinute}
            onChange={(e) => handleInputChange('api', 'requestsPerMinute', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-800">Rate Limiting</h4>
            <p className="text-sm text-gray-600">Limit API requests</p>
          </div>
          <input
            type="checkbox"
            checked={settings.api.rateLimitEnabled}
            onChange={(e) => handleInputChange('api', 'rateLimitEnabled', e.target.checked)}
            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
        </div>
        
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-800">CORS</h4>
            <p className="text-sm text-gray-600">Cross-origin requests</p>
          </div>
          <input
            type="checkbox"
            checked={settings.api.corsEnabled}
            onChange={(e) => handleInputChange('api', 'corsEnabled', e.target.checked)}
            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
        </div>
        
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-800">Webhooks</h4>
            <p className="text-sm text-gray-600">Event notifications</p>
          </div>
          <input
            type="checkbox"
            checked={settings.api.webhooksEnabled}
            onChange={(e) => handleInputChange('api', 'webhooksEnabled', e.target.checked)}
            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">API Version</label>
          <input
            type="text"
            value={settings.api.apiVersion}
            onChange={(e) => handleInputChange('api', 'apiVersion', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Max Payload Size</label>
          <select
            value={settings.api.maxPayloadSize}
            onChange={(e) => handleInputChange('api', 'maxPayloadSize', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="1MB">1MB</option>
            <option value="5MB">5MB</option>
            <option value="10MB">10MB</option>
            <option value="25MB">25MB</option>
            <option value="50MB">50MB</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h4 className="font-medium text-gray-800">Sandbox Mode</h4>
          <p className="text-sm text-gray-600">Enable for testing and development</p>
        </div>
        <input
          type="checkbox"
          checked={settings.api.sandboxMode}
          onChange={(e) => handleInputChange('api', 'sandboxMode', e.target.checked)}
          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
        />
      </div>
    </div>
  );

  const renderBackupSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Backup & Recovery</h3>
        <button
          onClick={createBackup}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          {isLoading ? <FaSync className="animate-spin" /> : <FaDownload />}
          <span>{isLoading ? 'Creating...' : 'Create Backup'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
          <select
            value={settings.database.backupFrequency}
            onChange={(e) => handleInputChange('database', 'backupFrequency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Retention Period (days)</label>
          <input
            type="number"
            value={settings.database.backupRetention}
            onChange={(e) => handleInputChange('database', 'backupRetention', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Connection Pool</label>
          <input
            type="number"
            value={settings.database.connectionPool}
            onChange={(e) => handleInputChange('database', 'connectionPool', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="font-medium text-gray-800">Backup History</h4>
        </div>
        <div className="divide-y divide-gray-200">
          {backupHistory.map((backup) => (
            <div key={backup.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">{backup.filename}</p>
                <p className="text-sm text-gray-500">
                  {backup.timestamp} • {backup.size} • {backup.type}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  backup.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {backup.status}
                </span>
                <button className="text-blue-600 hover:text-blue-800 p-1">
                  <FaDownload />
                </button>
                <button className="text-red-600 hover:text-red-800 p-1">
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'general':
        return renderGeneralSettings();
      case 'security':
        return renderSecuritySettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'api':
        return renderAPISettings();
      case 'backup':
        return renderBackupSettings();
      default:
        return (
          <div className="text-center py-12">
            <FaCog className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800">Settings Section</h3>
            <p className="text-gray-600">This section is under development.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">System Settings</h2>
          <p className="text-gray-600">Configure platform settings and preferences</p>
        </div>
        {unsavedChanges && (
          <div className="flex space-x-3">
            <button
              onClick={handleReset}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <FaUndo />
              <span>Reset</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              {isLoading ? <FaSync className="animate-spin" /> : <FaSave />}
              <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 bg-white rounded-xl shadow-lg p-4">
          <nav className="space-y-2">
            {settingSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                    activeSection === section.id
                      ? 'bg-purple-100 text-purple-700 border-l-4 border-purple-500'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="mr-3" />
                  <span className="font-medium">{section.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-xl shadow-lg p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800">
              {settingSections.find(s => s.id === activeSection)?.label}
            </h3>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
