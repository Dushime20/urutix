import React, { useState } from 'react';
import { FaCog, FaBell, FaShieldAlt, FaLanguage } from 'react-icons/fa';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import toast from 'react-hot-toast';

const OperationalAdminSettings: React.FC = () => {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    app: true,
  });

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <AdminPageLayout
      title="System Settings"
      description="Configure your operational preferences and notifications"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-800 p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-slate-800">
            <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-xl flex items-center justify-center">
              <FaBell size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notification Preferences</h2>
              <p className="text-sm text-gray-500">How would you like to receive operational alerts?</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl cursor-pointer">
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Email Notifications</p>
                <p className="text-xs text-gray-500">Daily digests and critical alerts</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifications.email}
                onChange={(e) => setNotifications({...notifications, email: e.target.checked})}
                className="w-5 h-5 text-primary-600 rounded"
              />
            </label>
            <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl cursor-pointer">
              <div>
                <p className="font-bold text-gray-900 dark:text-white">SMS Alerts</p>
                <p className="text-xs text-gray-500">Urgent trip delays or emergencies</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifications.sms}
                onChange={(e) => setNotifications({...notifications, sms: e.target.checked})}
                className="w-5 h-5 text-primary-600 rounded"
              />
            </label>
            <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl cursor-pointer">
              <div>
                <p className="font-bold text-gray-900 dark:text-white">In-App Notifications</p>
                <p className="text-xs text-gray-500">Real-time dashboard updates</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifications.app}
                onChange={(e) => setNotifications({...notifications, app: e.target.checked})}
                className="w-5 h-5 text-primary-600 rounded"
              />
            </label>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-800 p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-slate-800">
            <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-xl flex items-center justify-center">
              <FaLanguage size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Localization</h2>
              <p className="text-sm text-gray-500">Language and region settings</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Display Language</label>
              <select className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-primary-500 rounded-xl outline-none">
                <option>English</option>
                <option>French</option>
                <option>Swahili</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Timezone</label>
              <select className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-primary-500 rounded-xl outline-none">
                <option>UTC (Universal Time)</option>
                <option>EAT (East Africa Time)</option>
                <option>CAT (Central Africa Time)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            onClick={handleSave}
            className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors"
          >
            <FaCog /> Save Settings
          </button>
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default OperationalAdminSettings;
