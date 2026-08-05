import React, { useState } from 'react';
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
  Zap,
} from 'lucide-react';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import { TranslatedText } from '../../components/translated-text';

const AdvancedSettings: React.FC = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications]   = useState(true);
  const [twoFactorAuth, setTwoFactorAuth]           = useState(false);
  const [maintenanceMode, setMaintenanceMode]       = useState(false);

  return (
    <AdminPageLayout
      title={<TranslatedText text="Advanced Settings" />}
      description={<TranslatedText text="Configure system-wide settings and preferences" />}
    >
      <div className="safe-bottom space-y-6">
        {/* Notification Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-gray-100 dark:border-slate-800 overflow-hidden animate-enter">
          <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-center text-[#2c5173]">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
                <TranslatedText text="Notification Settings" />
              </h3>
              <p className="text-xs text-slate-500"><TranslatedText text="Configure system notifications" /></p>
            </div>
          </div>
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white"><TranslatedText text="Email Notifications" /></h4>
                <p className="text-xs text-slate-500 mt-0.5"><TranslatedText text="Receive email alerts for important events" /></p>
              </div>
              <Toggle checked={emailNotifications} onChange={setEmailNotifications} />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white"><TranslatedText text="Push Notifications" /></h4>
                <p className="text-xs text-slate-500 mt-0.5"><TranslatedText text="Receive push notifications in browser" /></p>
              </div>
              <Toggle checked={pushNotifications} onChange={setPushNotifications} />
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-gray-100 dark:border-slate-800 overflow-hidden animate-enter" style={{ animationDelay: '100ms' }}>
          <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-center text-[#2c5173]">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
                <TranslatedText text="Security Settings" />
              </h3>
              <p className="text-xs text-slate-500"><TranslatedText text="Manage security and authentication" /></p>
            </div>
          </div>
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white"><TranslatedText text="Two-Factor Authentication" /></h4>
                <p className="text-xs text-slate-500 mt-0.5"><TranslatedText text="Add an extra layer of security" /></p>
              </div>
              <Toggle checked={twoFactorAuth} onChange={setTwoFactorAuth} />
            </div>
            <div>
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                <Clock size={12} />
                <TranslatedText text="Session Timeout" />
              </label>
              <select className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2c5173] focus:border-transparent outline-none bg-gray-50 dark:bg-slate-800/50">
                <option><TranslatedText text="15 minutes" /></option>
                <option><TranslatedText text="30 minutes" /></option>
                <option><TranslatedText text="1 hour" /></option>
                <option><TranslatedText text="2 hours" /></option>
              </select>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-gray-100 dark:border-slate-800 overflow-hidden animate-enter" style={{ animationDelay: '200ms' }}>
          <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-center text-[#2c5173]">
              <SettingsIcon size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
                <TranslatedText text="System Settings" />
              </h3>
              <p className="text-xs text-slate-500"><TranslatedText text="Configure system behavior" /></p>
            </div>
          </div>
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg mt-0.5">
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white"><TranslatedText text="Maintenance Mode" /></h4>
                  <p className="text-xs text-slate-500 mt-0.5"><TranslatedText text="Put system in maintenance mode" /></p>
                </div>
              </div>
              <Toggle checked={maintenanceMode} onChange={setMaintenanceMode} />
            </div>
            <div>
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                <Globe size={12} />
                <TranslatedText text="Timezone" />
              </label>
              <select className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2c5173] focus:border-transparent outline-none bg-gray-50 dark:bg-slate-800/50">
                <option>UTC</option>
                <option>Africa/Nairobi (EAT)</option>
                <option>America/New_York (EST)</option>
                <option>Europe/London (GMT)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-gray-100 dark:border-slate-800 overflow-hidden animate-enter" style={{ animationDelay: '300ms' }}>
          <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-center text-[#2c5173]">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
                <TranslatedText text="Quick Actions" />
              </h3>
              <p className="text-xs text-slate-500"><TranslatedText text="Common administrative tasks" /></p>
            </div>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: <Database size={20} />, title: 'Backup Database',  sub: 'Create a comprehensive system backup' },
                { icon: <Mail size={20} />,     title: 'Test Email',       sub: 'Send a test email to verify SMTP settings' },
                { icon: <Trash2 size={20} />,   title: 'Clear Cache',      sub: 'Flush system cache and temporary files' },
              ].map(action => (
                <button
                  key={action.title}
                  className="p-6 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800 hover:border-gray-200 dark:border-slate-700 transition-all group text-left"
                >
                  <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800/50 text-[#2c5173] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    {action.icon}
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white"><TranslatedText text={action.title} /></h4>
                  <p className="text-xs text-slate-500 mt-1"><TranslatedText text={action.sub} /></p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
};

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({
  checked, onChange, disabled,
}) => (
  <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
    <input type="checkbox" checked={checked} disabled={disabled}
      onChange={e => onChange(e.target.checked)} className="sr-only peer" />
    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-slate-900 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2c5173]" />
  </label>
);

export default AdvancedSettings;
