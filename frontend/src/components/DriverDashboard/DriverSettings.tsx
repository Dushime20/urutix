import React, { useState } from 'react';
import {
  Bell,
  Lock,
  Globe,
  Moon,
  Smartphone,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  UserCheck,
  Languages,
  Check
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { TranslatedText } from '../translated-text';
import { motion } from 'framer-motion';

export const DriverSettings: React.FC = () => {
  const { logout } = useAuth();
  const [notifications, setNotifications] = useState({
    push: true,
    sms: false,
    email: true,
    trips: true,
    safety: true
  });

  const [language, setLanguage] = useState('en');
  const [darkMode, setDarkMode] = useState(false);

  // Premium Toggle Component
  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative w-12 h-7 rounded-full transition-colors duration-300 focus:outline-none ${checked ? 'bg-[#345E85]' : 'bg-slate-200'
        }`}
    >
      <motion.div
        initial={false}
        animate={{ x: checked ? 22 : 2 }}
        className="absolute top-1 left-0 w-5 h-5 bg-white rounded-full shadow-sm flex items-center justify-center"
      >
        {checked && <Check className="w-3 h-3 text-[#345E85]" strokeWidth={3} />}
      </motion.div>
    </button>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Notifications Card */}
        <section className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#345E85]">
              <Bell className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Notifications</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Manage Alerts</p>
            </div>
          </div>

          <div className="space-y-6">
            {Object.entries(notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between group">
                <div>
                  <p className="text-sm font-bold text-slate-700 capitalize group-hover:text-[#345E85] transition-colors">{key} Notifications</p>
                  <p className="text-xs text-slate-400 font-medium">Receive {key} alerts about your tasks</p>
                </div>
                <Toggle
                  checked={value}
                  onChange={() => setNotifications({ ...notifications, [key]: !value })}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Preferences Card */}
        <section className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Globe className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">App Preferences</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Localization & Theme</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-700">
                <Languages className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-bold">Display Language</span>
              </div>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full h-12 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer hover:bg-slate-100"
                >
                  <option value="en">English (US)</option>
                  <option value="sw">Swahili</option>
                  <option value="fr">French</option>
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Dark Mode</p>
                  <p className="text-xs text-slate-400 font-medium">Coming soon</p>
                </div>
              </div>
              <Toggle checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
            </div>
          </div>
        </section>

        {/* Security Card */}
        <section className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Lock className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Security</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Protection</p>
            </div>
          </div>

          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-transparent hover:bg-emerald-50 hover:border-emerald-100 group transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Change Password</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide group-hover:text-emerald-600/70">Update credentials</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
            </button>

            <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-transparent hover:bg-emerald-50 hover:border-emerald-100 group transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Two-Factor Auth</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide group-hover:text-emerald-600/70">Secure login</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </section>

        {/* Support & Account Card */}
        <section className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <HelpCircle className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Support & Account</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Help & Actions</p>
            </div>
          </div>

          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-transparent hover:bg-blue-50 hover:border-blue-100 group transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-600 group-hover:scale-110 transition-transform">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">Privacy Policy</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide group-hover:text-blue-600/70">Terms & Conditions</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={logout}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-rose-50 border border-transparent hover:bg-rose-100 hover:border-rose-200 group transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
                  <LogOut className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-rose-700">Sign Out</p>
                  <p className="text-[10px] font-bold text-rose-400/80 uppercase tracking-wide">End session</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-300 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </section>

      </div>
    </div>
  );
};
