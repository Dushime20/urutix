import React, { useState } from 'react';
import {
  Settings, Bell, Database, Shield,
  Palette, Code, Users, History,
  Edit2, Save, RotateCcw, AlertTriangle,
  Eye, EyeOff, Copy, RefreshCw,
  Download, Trash2
} from 'lucide-react';
import { TranslatedText } from '../../components/translated-text';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import ModernLoader from '../../components/common/ModernLoader';

const SystemSettings: React.FC = () => {
  const [pageLoading, setPageLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('general');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const settingSections = [
    { id: 'general', label: 'General Settings', icon: Settings },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'security', label: 'Security & Privacy', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'database', label: 'Database Config', icon: Database },
    { id: 'api', label: 'API Settings', icon: Code },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'backup', label: 'Backup & Recovery', icon: History },
    { id: 'integrations', label: 'Integrations', icon: Code },
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
      logoUrl: '/assets/urutiX Logistics Logo (1).svg',
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
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2"><TranslatedText text="Site Name" /></label>
          <input
            type="text"
            value={settings.general.siteName}
            onChange={(e) => handleInputChange('general', 'siteName', e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2c5173] focus:border-transparent outline-none transition-all font-medium text-slate-700"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2"><TranslatedText text="Contact Email" /></label>
          <input
            type="email"
            value={settings.general.contactEmail}
            onChange={(e) => handleInputChange('general', 'contactEmail', e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2c5173] focus:border-transparent outline-none transition-all font-medium text-slate-700"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2"><TranslatedText text="Site Description" /></label>
        <textarea
          value={settings.general.siteDescription}
          onChange={(e) => handleInputChange('general', 'siteDescription', e.target.value)}
          rows={3}
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2c5173] focus:border-transparent outline-none transition-all font-medium text-slate-700"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Timezone</label>
          <select
            value={settings.general.timezone}
            onChange={(e) => handleInputChange('general', 'timezone', e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2c5173] focus:border-transparent outline-none transition-all font-medium text-slate-700 pointer-cursor"
          >
            <option value="Africa/Kigali">Africa/Kigali</option>
            <option value="UTC">UTC</option>
            <option value="Africa/Nairobi">Africa/Nairobi</option>
            <option value="Africa/Dar_es_Salaam">Africa/Dar es Salaam</option>
            <option value="Africa/Kampala">Africa/Kampala</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Language</label>
          <select
            value={settings.general.language}
            onChange={(e) => handleInputChange('general', 'language', e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2c5173] focus:border-transparent outline-none transition-all font-medium text-slate-700"
          >
            <option value="English">English</option>
            <option value="Kinyarwanda">Kinyarwanda</option>
            <option value="French">French</option>
            <option value="Swahili">Swahili</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Currency</label>
          <select
            value={settings.general.currency}
            onChange={(e) => handleInputChange('general', 'currency', e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2c5173] focus:border-transparent outline-none transition-all font-medium text-slate-700"
          >
            <option value="RWF">Rwandan Franc (RWF)</option>
            <option value="USD">US Dollar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="KES">Kenyan Shilling (KES)</option>
            <option value="UGX">Ugandan Shilling (UGX)</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
        <AlertTriangle className="text-amber-600 w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium text-amber-800">
          Changes to security settings will affect all users immediately. Please proceed with caution.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {[
            { key: 'twoFactorAuth', label: 'Two-Factor Authentication', desc: 'Require 2FA for all admin accounts' },
            { key: 'ipWhitelist', label: 'IP Whitelist', desc: 'Restrict admin access by IP' },
            { key: 'sslRequired', label: 'SSL Required', desc: 'Force HTTPS connections' },
            { key: 'accountLockout', label: 'Account Lockout', desc: 'Lock accounts after failed attempts' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">{item.label}</h4>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                <input
                  type="checkbox"
                  checked={settings.security[item.key as keyof typeof settings.security] as boolean}
                  onChange={(e) => handleInputChange('security', item.key, e.target.checked)}
                  className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"
                  style={{ right: settings.security[item.key as keyof typeof settings.security] ? '0' : 'auto', left: settings.security[item.key as keyof typeof settings.security] ? 'auto' : '0' }}
                />
                {/*  checkbox styling would ideally use a proper Switch component if available, sticking to simple input for now but styled containers */}
                <input
                  type="checkbox"
                  checked={settings.security[item.key as keyof typeof settings.security] as boolean}
                  onChange={(e) => handleInputChange('security', item.key, e.target.checked)}
                  className="w-5 h-5 text-[#2c5173] rounded focus:ring-[#2c5173] border-gray-300"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {[
            { key: 'sessionTimeout', label: 'Session Timeout (minutes)' },
            { key: 'passwordMinLength', label: 'Password Min Length' },
            { key: 'loginAttempts', label: 'Max Login Attempts' },
            { key: 'passwordExpiry', label: 'Password Expiry (days)' },
            { key: 'lockoutDuration', label: 'Lockout Duration (minutes)' }
          ].map((item) => (
            <div key={item.key}>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{item.label}</label>
              <input
                type="number"
                value={settings.security[item.key as keyof typeof settings.security] as number}
                onChange={(e) => handleInputChange('security', item.key, parseInt(e.target.value))}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2c5173] focus:border-transparent outline-none transition-all font-medium text-slate-700"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">System Notifications</h3>

          {Object.entries(settings.notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <h4 className="font-bold text-slate-800 text-sm capitalize">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </h4>
                <p className="text-xs text-slate-500">
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
                className="w-5 h-5 text-[#2c5173] rounded focus:ring-[#2c5173] border-gray-300"
              />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Email Templates</h3>
          <div className="space-y-3">
            {[
              { label: 'Welcome Email', desc: 'Email sent to new users' },
              { label: 'Password Reset', desc: 'Password reset instructions' },
              { label: 'Shipment Updates', desc: 'Cargo status notifications' },
              { label: 'Payment Confirmations', desc: 'Payment success notifications' }
            ].map((item, idx) => (
              <button key={idx} className="w-full text-left p-4 bg-white border border-gray-200 rounded-xl hover:border-primary-300 transition-all group">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 group-hover:text-[#2c5173] transition-colors">{item.label}</span>
                  <Edit2 className="text-gray-400 w-4 h-4 group-hover:text-[#2c5173]" />
                </div>
                <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAPISettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">API Key</label>
          <div className="flex">
            <div className="relative flex-1">
              <input
                type={showApiKey ? "text" : "password"}
                value={settings.api.apiKey}
                onChange={(e) => handleInputChange('api', 'apiKey', e.target.value)}
                className="w-full pl-4 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-l-xl focus:ring-2 focus:ring-[#2c5173] focus:border-transparent outline-none transition-all font-mono text-sm text-slate-700"
                readOnly
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#2c5173] transition-colors"
              >
                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button
              onClick={copyApiKey}
              className="px-4 bg-slate-700 text-white hover:bg-slate-600 transition-colors flex items-center justify-center border-r border-slate-600"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={regenerateApiKey}
              className="px-4 bg-[#2c5173] text-white rounded-r-xl hover:bg-[#1e3850] transition-colors flex items-center justify-center"
            >
              <RefreshCw size={16} />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Keep this key secure. Regenerating will invalidate all existing integrations.</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Requests per Minute</label>
          <input
            type="number"
            value={settings.api.requestsPerMinute}
            onChange={(e) => handleInputChange('api', 'requestsPerMinute', parseInt(e.target.value))}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2c5173] focus:border-transparent outline-none transition-all font-medium text-slate-700"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { key: 'rateLimitEnabled', label: 'Rate Limiting', desc: 'Limit API requests' },
          { key: 'corsEnabled', label: 'CORS', desc: 'Cross-origin requests' },
          { key: 'webhooksEnabled', label: 'Webhooks', desc: 'Event notifications' }
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">{item.label}</h4>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </div>
            <input
              type="checkbox"
              checked={settings.api[item.key as keyof typeof settings.api] as boolean}
              onChange={(e) => handleInputChange('api', item.key, e.target.checked)}
              className="w-5 h-5 text-[#2c5173] rounded focus:ring-[#2c5173] border-gray-300"
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">API Version</label>
          <input
            type="text"
            value={settings.api.apiVersion}
            onChange={(e) => handleInputChange('api', 'apiVersion', e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2c5173] focus:border-transparent outline-none transition-all font-medium text-slate-700"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Max Payload Size</label>
          <select
            value={settings.api.maxPayloadSize}
            onChange={(e) => handleInputChange('api', 'maxPayloadSize', e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2c5173] focus:border-transparent outline-none transition-all font-medium text-slate-700"
          >
            <option value="1MB">1MB</option>
            <option value="5MB">5MB</option>
            <option value="10MB">10MB</option>
            <option value="25MB">25MB</option>
            <option value="50MB">50MB</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderBackupSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Backup & Recovery</h3>
        <button
          onClick={createBackup}
          disabled={isLoading}
          className="bg-[#2c5173] hover:bg-[#1e3850] disabled:bg-slate-400 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold text-xs uppercase tracking-wider"
        >
          {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
          <span>{isLoading ? 'Creating...' : 'Create Backup'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Backup Frequency</label>
          <select
            value={settings.database.backupFrequency}
            onChange={(e) => handleInputChange('database', 'backupFrequency', e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2c5173] focus:border-transparent outline-none transition-all font-medium text-slate-700"
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Retention Period (days)</label>
          <input
            type="number"
            value={settings.database.backupRetention}
            onChange={(e) => handleInputChange('database', 'backupRetention', parseInt(e.target.value))}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2c5173] focus:border-transparent outline-none transition-all font-medium text-slate-700"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Connection Pool</label>
          <input
            type="number"
            value={settings.database.connectionPool}
            onChange={(e) => handleInputChange('database', 'connectionPool', parseInt(e.target.value))}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2c5173] focus:border-transparent outline-none transition-all font-medium text-slate-700"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="font-bold text-slate-800 text-sm">Backup History</h4>
        </div>
        <div className="divide-y divide-gray-100">
          {backupHistory.map((backup) => (
            <div key={backup.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <p className="font-medium text-slate-800 text-sm">{backup.filename}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {backup.timestamp} • {backup.size} • {backup.type}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${backup.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                  }`}>
                  {backup.status}
                </span>
                <button className="text-slate-400 hover:text-[#2c5173] p-1.5 rounded-lg hover:bg-slate-100 transition-all">
                  <Download size={14} />
                </button>
                <button className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all">
                  <Trash2 size={14} />
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
            <Settings className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800">
              <TranslatedText text="Settings Section" />
            </h3>
            <p className="text-slate-500 mt-2">
              <TranslatedText text="This section is under development." />
            </p>
          </div>
        );
    }
  };

  if (pageLoading) {
    return (
      <AdminPageLayout
        title={<TranslatedText text="System Settings" />}
        description={<TranslatedText text="Configure platform settings and preferences" />}
      >
        <ModernLoader isLoading={true} type="page" showStats={false} />
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={<TranslatedText text="System Settings" />}
      description={<TranslatedText text="Configure platform settings and preferences" />}
      actions={
        unsavedChanges && (
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="bg-white border border-gray-200 text-slate-700 hover:bg-gray-50 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold text-xs uppercase tracking-wider"
            >
              <RotateCcw size={14} />
              <span><TranslatedText text="Reset" /></span>
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-[#2c5173] hover:bg-[#1e3850] disabled:bg-slate-400 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold text-xs uppercase tracking-wider"
            >
              {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              <span>{isLoading ? <TranslatedText text="Saving..." /> : <TranslatedText text="Save Changes" />}</span>
            </button>
          </div>
        )
      }
    >

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-72 bg-white rounded-[24px] border border-slate-100 p-4 h-fit">
          <nav className="space-y-1">
            {settingSections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                   key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center px-4 py-3.5 rounded-xl transition-all ${isActive
                    ? 'bg-slate-100 text-[#2c5173]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                >
                  <Icon className={`mr-3 w-5 h-5 ${isActive ? 'text-[#2c5173]' : 'text-slate-400'}`} />
                  <span className={`font-bold text-sm ${isActive ? 'text-[#2c5173]' : 'text-slate-600'}`}>
                    <TranslatedText text={section.label} />
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-[24px] border border-slate-100 p-8 min-h-[600px]">
          <div className="mb-8 pb-4 border-b border-slate-100">
            <h3 className="text-xl font-black text-slate-800">
              <TranslatedText text={settingSections.find(s => s.id === activeSection)?.label || ''} />
            </h3>
            <p className="text-slate-500 text-sm mt-1">Manage your {activeSection} preferences</p>
          </div>
          {renderContent()}
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default SystemSettings;
