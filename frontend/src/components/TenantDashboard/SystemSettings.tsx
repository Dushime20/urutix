import React, { useState } from 'react';
import { 
  FaBell, FaLock, FaGlobe, FaPalette, FaDatabase, 
  FaShieldAlt, FaSave, FaToggleOn, FaToggleOff 
} from 'react-icons/fa';

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    // Notifications
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    weeklyReports: true,
    
    // Security
    twoFactorAuth: false,
    sessionTimeout: '30',
    passwordExpiry: '90',
    
    // Preferences
    language: 'en',
    timezone: 'Africa/Kigali',
    dateFormat: 'DD/MM/YYYY',
    currency: 'RWF',
    
    // System
    autoBackup: true,
    maintenanceMode: false,
  });

  const handleToggle = (key: string) => {
    setSettings({
      ...settings,
      [key]: !settings[key as keyof typeof settings],
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings({
      ...settings,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    // TODO: Save to API
    console.log('Saving settings:', settings);
  };

  const ToggleSwitch = ({ enabled, onClick }: { enabled: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-blue-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Notifications Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center mb-6">
          <FaBell className="w-5 h-5 text-blue-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive notifications via email</p>
            </div>
            <ToggleSwitch 
              enabled={settings.emailNotifications} 
              onClick={() => handleToggle('emailNotifications')} 
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">SMS Notifications</p>
              <p className="text-sm text-gray-500">Receive notifications via SMS</p>
            </div>
            <ToggleSwitch 
              enabled={settings.smsNotifications} 
              onClick={() => handleToggle('smsNotifications')} 
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Push Notifications</p>
              <p className="text-sm text-gray-500">Receive push notifications in browser</p>
            </div>
            <ToggleSwitch 
              enabled={settings.pushNotifications} 
              onClick={() => handleToggle('pushNotifications')} 
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Weekly Reports</p>
              <p className="text-sm text-gray-500">Receive weekly summary reports</p>
            </div>
            <ToggleSwitch 
              enabled={settings.weeklyReports} 
              onClick={() => handleToggle('weeklyReports')} 
            />
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center mb-6">
          <FaShieldAlt className="w-5 h-5 text-blue-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500">Add an extra layer of security</p>
            </div>
            <ToggleSwitch 
              enabled={settings.twoFactorAuth} 
              onClick={() => handleToggle('twoFactorAuth')} 
            />
          </div>

          <div className="py-3 border-b border-gray-100">
            <label className="block font-medium text-gray-900 mb-2">
              Session Timeout (minutes)
            </label>
            <select
              name="sessionTimeout"
              value={settings.sessionTimeout}
              onChange={handleChange}
              className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
            </select>
          </div>

          <div className="py-3">
            <label className="block font-medium text-gray-900 mb-2">
              Password Expiry (days)
            </label>
            <select
              name="passwordExpiry"
              value={settings.passwordExpiry}
              onChange={handleChange}
              className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
              <option value="never">Never</option>
            </select>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center mb-6">
          <FaGlobe className="w-5 h-5 text-blue-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Preferences</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-medium text-gray-900 mb-2">Language</label>
            <select
              name="language"
              value={settings.language}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="rw">Kinyarwanda</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-900 mb-2">Timezone</label>
            <select
              name="timezone"
              value={settings.timezone}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Africa/Kigali">Africa/Kigali (CAT)</option>
              <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-900 mb-2">Date Format</label>
            <select
              name="dateFormat"
              value={settings.dateFormat}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-900 mb-2">Currency</label>
            <select
              name="currency"
              value={settings.currency}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="RWF">RWF - Rwandan Franc</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </div>
        </div>
      </div>

      {/* System Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center mb-6">
          <FaDatabase className="w-5 h-5 text-blue-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">System Settings</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Automatic Backup</p>
              <p className="text-sm text-gray-500">Daily automatic data backup</p>
            </div>
            <ToggleSwitch 
              enabled={settings.autoBackup} 
              onClick={() => handleToggle('autoBackup')} 
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Maintenance Mode</p>
              <p className="text-sm text-gray-500">Temporarily disable user access</p>
            </div>
            <ToggleSwitch 
              enabled={settings.maintenanceMode} 
              onClick={() => handleToggle('maintenanceMode')} 
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm"
        >
          <FaSave className="w-4 h-4 mr-2" />
          Save All Settings
        </button>
      </div>
    </div>
  );
};

export default SystemSettings;
