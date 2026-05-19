import React, { useState, useEffect } from 'react';
import {
  Bell,
  Shield,
  Settings as SettingsIcon,
  Database,
  Mail,
  Trash2,
  AlertTriangle,
  Clock,
  Globe,
  Server,
  Zap
} from 'lucide-react';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import { TranslatedText } from '../../components/translated-text';
import ModernLoader from '../../components/common/ModernLoader';

const AdvancedSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  if (loading) {
    return (
      <AdminPageLayout
        title={<TranslatedText text="Advanced Settings" />}
        description={<TranslatedText text="Configure system-wide settings and preferences" />}
      >
        <ModernLoader isLoading={true} type="page" showStats={false} />
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={<TranslatedText text="Advanced Settings" />}
      description={<TranslatedText text="Configure system-wide settings and preferences" />}
    >
      <div className="space-y-6">
        {/* Notification Settings */}
        <div className="bg-white rounded-[24px] border border-gray-100 overflow-hidden animate-enter">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-[#2c5173]">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight"><TranslatedText text="Notification Settings" /></h3>
              <p className="text-xs text-slate-500"><TranslatedText text="Configure system notifications" /></p>
            </div>
          </div>
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <h4 className="text-sm font-bold text-gray-900"><TranslatedText text="Email Notifications" /></h4>
                <p className="text-xs text-slate-500 mt-0.5"><TranslatedText text="Receive email alerts for important events" /></p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2c5173]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <h4 className="text-sm font-bold text-gray-900"><TranslatedText text="Push Notifications" /></h4>
                <p className="text-xs text-slate-500 mt-0.5"><TranslatedText text="Receive push notifications in browser" /></p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={pushNotifications}
                  onChange={(e) => setPushNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2c5173]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-[24px] border border-gray-100 overflow-hidden animate-enter" style={{ animationDelay: '100ms' }}>
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-[#2c5173]">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight"><TranslatedText text="Security Settings" /></h3>
              <p className="text-xs text-slate-500"><TranslatedText text="Manage security and authentication" /></p>
            </div>
          </div>
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <h4 className="text-sm font-bold text-gray-900"><TranslatedText text="Two-Factor Authentication" /></h4>
                <p className="text-xs text-slate-500 mt-0.5"><TranslatedText text="Add an extra layer of security" /></p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={twoFactorAuth}
                  onChange={(e) => setTwoFactorAuth(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2c5173]"></div>
              </label>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Clock size={12} />
                <TranslatedText text="Session Timeout" />
              </label>
              <select className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2c5173] focus:border-transparent transition-all outline-none bg-gray-50">
                <option><TranslatedText text="15 minutes" /></option>
                <option><TranslatedText text="30 minutes" /></option>
                <option><TranslatedText text="1 hour" /></option>
                <option><TranslatedText text="2 hours" /></option>
              </select>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-white rounded-[24px] border border-gray-100 overflow-hidden animate-enter" style={{ animationDelay: '200ms' }}>
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-[#2c5173]">
              <SettingsIcon size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight"><TranslatedText text="System Settings" /></h3>
              <p className="text-xs text-slate-500"><TranslatedText text="Configure system behavior" /></p>
            </div>
          </div>
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg mt-0.5">
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900"><TranslatedText text="Maintenance Mode" /></h4>
                  <p className="text-xs text-slate-500 mt-0.5"><TranslatedText text="Put system in maintenance mode" /></p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2c5173]"></div>
              </label>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Globe size={12} />
                <TranslatedText text="Timezone" />
              </label>
              <select className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2c5173] focus:border-transparent transition-all outline-none bg-gray-50">
                <option>UTC</option>
                <option>Africa/Nairobi (EAT)</option>
                <option>America/New_York (EST)</option>
                <option>Europe/London (GMT)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-[24px] border border-gray-100 overflow-hidden animate-enter" style={{ animationDelay: '300ms' }}>
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-[#2c5173]">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight"><TranslatedText text="Quick Actions" /></h3>
              <p className="text-xs text-slate-500"><TranslatedText text="Common administrative tasks" /></p>
            </div>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-6 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 hover:border-gray-200 transition-all group text-left">
                <div className="w-10 h-10 bg-slate-50 text-[#2c5173] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Database size={20} />
                </div>
                <h4 className="text-sm font-bold text-gray-900"><TranslatedText text="Backup Database" /></h4>
                <p className="text-xs text-slate-500 mt-1"><TranslatedText text="Create a comprehensive system backup" /></p>
              </button>

              <button className="p-6 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 hover:border-gray-200 transition-all group text-left">
                <div className="w-10 h-10 bg-slate-50 text-[#2c5173] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Mail size={20} />
                </div>
                <h4 className="text-sm font-bold text-gray-900"><TranslatedText text="Test Email" /></h4>
                <p className="text-xs text-slate-500 mt-1"><TranslatedText text="Send a test email to verify SMTP settings" /></p>
              </button>

              <button className="p-6 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 hover:border-gray-200 transition-all group text-left">
                <div className="w-10 h-10 bg-slate-50 text-[#2c5173] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Trash2 size={20} />
                </div>
                <h4 className="text-sm font-bold text-gray-900"><TranslatedText text="Clear Cache" /></h4>
                <p className="text-xs text-slate-500 mt-1"><TranslatedText text="Flush system cache and temporary files" /></p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default AdvancedSettings;
