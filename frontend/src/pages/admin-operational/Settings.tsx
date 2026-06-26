import React, { useState } from 'react';
import {
  Bell, Globe, Monitor, LayoutDashboard, Shield,
  Save, RotateCcw, Mail, MessageSquare, Smartphone,
  Sun, Moon, Languages, Clock, RefreshCw,
  ChevronRight, ToggleLeft, ToggleRight,
} from 'lucide-react';
import OperationalPageLayout from '../../components/Admin/OperationalPageLayout';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../config/errorMessages';
/* ── Types ───────────────────────────────────────────────────────── */

interface NotificationSettings {
  email:         boolean;
  sms:           boolean;
  app:           boolean;
  disputeAlerts: boolean;
  tripDelays:    boolean;
  loadUpdates:   boolean;
  bidActivity:   boolean;
}

interface LocalizationSettings {
  language: string;
  timezone: string;
  currency: string;
  dateFormat: string;
}

interface DisplaySettings {
  theme:           'light' | 'dark' | 'system';
  compactMode:     boolean;
  showAnimations:  boolean;
}

interface DashboardSettings {
  defaultRange:    '7d' | '30d';
  autoRefresh:     boolean;
  refreshInterval: number;
}

/* ── Reusable components ─────────────────────────────────────────── */

const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <div className="flex items-center gap-4 pb-4 mb-5 border-b border-gray-100 dark:border-slate-800">
    <div className="w-11 h-11 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div>
      <h2 className="text-base font-black text-gray-900 dark:text-white">{title}</h2>
      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{description}</p>
    </div>
  </div>
);

const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}> = ({ checked, onChange, label, description }) => (
  <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group">
    <div className="flex-1 pr-4">
      <p className="text-sm font-bold text-gray-900 dark:text-white">{label}</p>
      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{description}</p>
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex-shrink-0 transition-colors ${checked ? 'text-primary-600 dark:text-primary-400' : 'text-gray-300 dark:text-slate-600'}`}
    >
      {checked
        ? <ToggleRight size={32} strokeWidth={1.5} />
        : <ToggleLeft  size={32} strokeWidth={1.5} />
      }
    </button>
  </label>
);

const SelectField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}> = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">
      {label}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none appearance-none"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" />
    </div>
  </div>
);

/* ── Main component ──────────────────────────────────────────────── */

const OperationalAdminSettings: React.FC = () => {
  const [saving, setSaving] = useState(false);

  const [notifications, setNotifications] = useState<NotificationSettings>({
    email:         true,
    sms:           false,
    app:           true,
    disputeAlerts: true,
    tripDelays:    true,
    loadUpdates:   false,
    bidActivity:   false,
  });

  const [localization, setLocalization] = useState<LocalizationSettings>({
    language:   'en',
    timezone:   'UTC',
    currency:   'USD',
    dateFormat: 'MM/DD/YYYY',
  });

  const [display, setDisplay] = useState<DisplaySettings>({
    theme:          'system',
    compactMode:    false,
    showAnimations: true,
  });

  const [dashboard, setDashboard] = useState<DashboardSettings>({
    defaultRange:    '7d',
    autoRefresh:     false,
    refreshInterval: 30,
  });

  const setN = (key: keyof NotificationSettings) => (v: boolean) =>
    setNotifications(p => ({ ...p, [key]: v }));

  const handleSave = async () => {
    try {
      setSaving(true);
      // Simulate API call — replace with real endpoint when available
      await new Promise(r => setTimeout(r, 600));
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setNotifications({ email: true, sms: false, app: true, disputeAlerts: true, tripDelays: true, loadUpdates: false, bidActivity: false });
    setLocalization({ language: 'en', timezone: 'UTC', currency: 'USD', dateFormat: 'MM/DD/YYYY' });
    setDisplay({ theme: 'system', compactMode: false, showAnimations: true });
    setDashboard({ defaultRange: '7d', autoRefresh: false, refreshInterval: 30 });
    toast('Settings reset to defaults', { icon: '↩️' });
  };

  return (
    <OperationalPageLayout
      title="Settings"
      description="Configure your operational preferences, notifications, and display options"
      actions={
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors disabled:opacity-60"
          >
            {saving
              ? <><RefreshCw size={14} className="animate-spin" /> Saving…</>
              : <><Save size={14} /> Save Settings</>
            }
          </button>
        </div>
      }
    >
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Notifications ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800">
          <SectionHeader
            icon={<Bell size={20} />}
            title="Notification Preferences"
            description="Choose how and when you receive operational alerts"
          />

          {/* Channels */}
          <div className="mb-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Channels</p>
            <div className="space-y-2">
              <Toggle
                checked={notifications.email}
                onChange={setN('email')}
                label="Email Notifications"
                description="Daily digests and critical alert emails"
              />
              <Toggle
                checked={notifications.sms}
                onChange={setN('sms')}
                label="SMS Alerts"
                description="Text messages for urgent trip delays or emergencies"
              />
              <Toggle
                checked={notifications.app}
                onChange={setN('app')}
                label="In-App Notifications"
                description="Real-time toast and bell icon updates within the dashboard"
              />
            </div>
          </div>

          {/* Event types */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Event Types</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Toggle
                checked={notifications.disputeAlerts}
                onChange={setN('disputeAlerts')}
                label="Dispute Alerts"
                description="When a new dispute is raised"
              />
              <Toggle
                checked={notifications.tripDelays}
                onChange={setN('tripDelays')}
                label="Trip Delays"
                description="When a trip is marked delayed"
              />
              <Toggle
                checked={notifications.loadUpdates}
                onChange={setN('loadUpdates')}
                label="Load Updates"
                description="Load status changes (assigned, delivered)"
              />
              <Toggle
                checked={notifications.bidActivity}
                onChange={setN('bidActivity')}
                label="Bid Activity"
                description="New bids and auction results"
              />
            </div>
          </div>
        </div>

        {/* ── Localization ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800">
          <SectionHeader
            icon={<Globe size={20} />}
            title="Localization"
            description="Language, region, and format preferences"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SelectField
              label="Display Language"
              value={localization.language}
              onChange={v => setLocalization(p => ({ ...p, language: v }))}
              options={[
                { value: 'en', label: 'English' },
                { value: 'fr', label: 'French' },
                { value: 'sw', label: 'Swahili' },
                { value: 'rw', label: 'Kinyarwanda' },
              ]}
            />
            <SelectField
              label="Timezone"
              value={localization.timezone}
              onChange={v => setLocalization(p => ({ ...p, timezone: v }))}
              options={[
                { value: 'UTC',       label: 'UTC — Universal Time' },
                { value: 'Africa/Nairobi',  label: 'EAT — East Africa Time (UTC+3)' },
                { value: 'Africa/Kigali',   label: 'CAT — Central Africa Time (UTC+2)' },
                { value: 'Africa/Lagos',    label: 'WAT — West Africa Time (UTC+1)' },
                { value: 'America/New_York', label: 'EST — Eastern Time (UTC-5)' },
              ]}
            />
            <SelectField
              label="Currency"
              value={localization.currency}
              onChange={v => setLocalization(p => ({ ...p, currency: v }))}
              options={[
                { value: 'USD', label: 'USD — US Dollar' },
                { value: 'KES', label: 'KES — Kenyan Shilling' },
                { value: 'RWF', label: 'RWF — Rwandan Franc' },
                { value: 'UGX', label: 'UGX — Ugandan Shilling' },
                { value: 'TZS', label: 'TZS — Tanzanian Shilling' },
                { value: 'EUR', label: 'EUR — Euro' },
              ]}
            />
            <SelectField
              label="Date Format"
              value={localization.dateFormat}
              onChange={v => setLocalization(p => ({ ...p, dateFormat: v }))}
              options={[
                { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY  (12/31/2025)' },
                { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY  (31/12/2025)' },
                { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD  (2025-12-31)' },
                { value: 'DD MMM YYYY', label: 'DD MMM YYYY  (31 Dec 2025)' },
              ]}
            />
          </div>
        </div>

        {/* ── Display ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800">
          <SectionHeader
            icon={<Monitor size={20} />}
            title="Display"
            description="Appearance and visual preferences for your dashboard"
          />

          {/* Theme */}
          <div className="mb-5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Theme</p>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: 'light',  icon: <Sun  size={18} />, label: 'Light'  },
                { value: 'dark',   icon: <Moon size={18} />, label: 'Dark'   },
                { value: 'system', icon: <Monitor size={18} />, label: 'System' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDisplay(p => ({ ...p, theme: opt.value }))}
                  className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all text-sm font-bold ${
                    display.theme === opt.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-600'
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Toggle
              checked={display.compactMode}
              onChange={v => setDisplay(p => ({ ...p, compactMode: v }))}
              label="Compact Mode"
              description="Reduce padding and spacing for a denser layout"
            />
            <Toggle
              checked={display.showAnimations}
              onChange={v => setDisplay(p => ({ ...p, showAnimations: v }))}
              label="Animations"
              description="Enable motion animations and transitions"
            />
          </div>
        </div>

        {/* ── Dashboard Preferences ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800">
          <SectionHeader
            icon={<LayoutDashboard size={20} />}
            title="Dashboard Preferences"
            description="Defaults for the overview dashboard charts and data refresh"
          />
          <div className="space-y-5">
            <SelectField
              label="Default Date Range"
              value={dashboard.defaultRange}
              onChange={v => setDashboard(p => ({ ...p, defaultRange: v as '7d' | '30d' }))}
              options={[
                { value: '7d',  label: 'Last 7 Days' },
                { value: '30d', label: 'Last 30 Days' },
              ]}
            />

            <Toggle
              checked={dashboard.autoRefresh}
              onChange={v => setDashboard(p => ({ ...p, autoRefresh: v }))}
              label="Auto-Refresh Dashboard"
              description="Automatically reload chart data at a set interval"
            />

            {dashboard.autoRefresh && (
              <SelectField
                label="Refresh Interval"
                value={String(dashboard.refreshInterval)}
                onChange={v => setDashboard(p => ({ ...p, refreshInterval: Number(v) }))}
                options={[
                  { value: '15',  label: 'Every 15 seconds' },
                  { value: '30',  label: 'Every 30 seconds' },
                  { value: '60',  label: 'Every 1 minute' },
                  { value: '300', label: 'Every 5 minutes' },
                ]}
              />
            )}
          </div>
        </div>

        {/* ── Security (read-only info) ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800">
          <SectionHeader
            icon={<Shield size={20} />}
            title="Security"
            description="Account security settings managed by your system administrator"
          />
          <div className="space-y-3">
            {[
              { label: 'Two-Factor Authentication', status: 'Contact admin to enable', statusColor: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400' },
              { label: 'Session Timeout',           status: 'Managed by admin policy',  statusColor: 'text-blue-600   bg-blue-50   dark:bg-blue-900/20   dark:text-blue-400'   },
              { label: 'Password Policy',           status: 'Enforced system-wide',     statusColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{item.label}</p>
                <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${item.statusColor}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Save / Reset footer ── */}
        <div className="flex items-center justify-between pt-2 pb-4">
          <p className="text-xs text-gray-400 dark:text-slate-500">
            Changes are applied immediately after saving.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              <RotateCcw size={14} /> Reset to Defaults
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-6 py-2.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors disabled:opacity-60"
            >
              {saving
                ? <><RefreshCw size={14} className="animate-spin" /> Saving…</>
                : <><Save size={14} /> Save Settings</>
              }
            </button>
          </div>
        </div>

      </div>
    </OperationalPageLayout>
  );
};

export default OperationalAdminSettings;
