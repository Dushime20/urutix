import React, { useState } from 'react';
import {
  User, Mail, Phone, Lock, Shield, Eye, EyeOff,
  RefreshCw, CheckCircle2, Settings, ClipboardList,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import CurrencySelector from '../../components/common/CurrencySelector';
import toast from 'react-hot-toast';

// ─── types ────────────────────────────────────────────────────────────────────
type Tab = 'profile' | 'password' | 'preferences';

// ─── component ────────────────────────────────────────────────────────────────
const CustomsOfficerProfilePage: React.FC = () => {
  const { user } = useAuth();

  const [tab, setTab] = useState<Tab>('profile');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: (user as any)?.phone || '',
  });

  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwSaving, setPwSaving] = useState(false);

  const initials = [user?.firstName?.[0], user?.lastName?.[0]]
    .filter(Boolean).join('').toUpperCase() || 'CO';

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Customs Officer';

  // ── save profile ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.email.trim()) { toast.error('Email is required'); return; }
    if (!form.firstName.trim()) { toast.error('First name is required'); return; }
    try {
      setSaving(true);
      await authAPI.updateProfile(form as any);
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: (user as any)?.phone || '',
    });
    setEditing(false);
  };

  // ── change password ───────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!pwForm.currentPassword) { toast.error('Enter your current password'); return; }
    if (pwForm.newPassword.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    try {
      setPwSaving(true);
      await authAPI.changePassword(pwForm);
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  const pwStrength = pwForm.newPassword.length === 0 ? null
    : pwForm.newPassword.length < 8 ? 'weak'
    : pwForm.newPassword.length < 12 ? 'fair'
    : 'strong';

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile',     label: 'Profile Info',    icon: <User size={14} /> },
    { key: 'password',    label: 'Change Password', icon: <Lock size={14} /> },
    { key: 'preferences', label: 'Preferences',     icon: <Settings size={14} /> },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in duration-400">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm">
        <div className="h-28 bg-gradient-to-r from-[#1e3a5f] via-[#2c5173] to-[#345E85] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5" />
        </div>
        <div className="px-6 sm:px-8 pb-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-lg flex items-center justify-center text-2xl font-black text-[#345E85] -mt-10 select-none flex-shrink-0">
                {initials}
              </div>
              <div className="mb-1">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">{fullName}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <ClipboardList size={13} className="text-[#345E85]" />
                  <p className="text-sm text-[#345E85] dark:text-blue-400 font-semibold">Customs Officer</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest text-[#345E85] bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30">
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" /> Customs Officer
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/30">
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" /> Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-1 w-fit flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setEditing(false); }}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg transition-all ${
              tab === t.key
                ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Profile tab ───────────────────────────────────────────────────── */}
      {tab === 'profile' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Personal Information</h3>
            {editing ? (
              <div className="flex gap-2">
                <button onClick={handleCancel} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#345E85] hover:bg-[#2c5173] rounded-xl transition-colors disabled:opacity-60">
                  {saving ? <><RefreshCw size={13} className="animate-spin" /> Saving…</> : <><CheckCircle2 size={13} /> Save Changes</>}
                </button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#345E85] hover:bg-[#2c5173] rounded-xl transition-colors">
                Edit Profile
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'First Name', key: 'firstName', icon: <User size={16} /> },
              { label: 'Last Name',  key: 'lastName',  icon: <User size={16} /> },
              { label: 'Email',      key: 'email',     icon: <Mail size={16} /> },
              { label: 'Phone',      key: 'phone',     icon: <Phone size={16} /> },
            ].map(f => (
              <div key={f.key} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl">
                <div className="w-9 h-9 rounded-xl bg-[#345E85]/10 text-[#345E85] dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                  {f.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">{f.label}</p>
                  {editing ? (
                    <input
                      type={f.key === 'email' ? 'email' : 'text'}
                      value={(form as any)[f.key]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full px-2 py-1 text-sm font-semibold border border-gray-200 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-[#345E85] outline-none"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {(form as any)[f.key] || <span className="text-gray-400 italic font-normal">Not provided</span>}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Read-only account info */}
          <div className="pt-4 border-t border-gray-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Role', value: 'Customs Officer', icon: <Shield size={16} /> },
              { label: 'Account Status', value: user?.status || 'Active', icon: <CheckCircle2 size={16} /> },
            ].map(f => (
              <div key={f.label} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl">
                <div className="w-9 h-9 rounded-xl bg-[#345E85]/10 text-[#345E85] dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                  {f.icon}
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">{f.label}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{f.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Password tab ──────────────────────────────────────────────────── */}
      {tab === 'password' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 max-w-lg space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-[#345E85]/10 text-[#345E85] dark:text-blue-400 flex items-center justify-center">
              <Lock size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 dark:text-white">Change Password</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">Choose a strong password you haven't used before</p>
            </div>
          </div>

          {[
            { label: 'Current Password', key: 'currentPassword', show: showCurrent, toggle: () => setShowCurrent(p => !p) },
            { label: 'New Password',     key: 'newPassword',     show: showNew,     toggle: () => setShowNew(p => !p) },
            { label: 'Confirm Password', key: 'confirmPassword', show: showConfirm,  toggle: () => setShowConfirm(p => !p) },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">{f.label}</label>
              <div className="relative">
                <input
                  type={f.show ? 'text' : 'password'}
                  value={(pwForm as any)[f.key]}
                  onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full px-4 py-3 pr-11 text-sm border border-gray-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-[#345E85] outline-none"
                />
                <button type="button" onClick={f.toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {f.show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}

          {pwStrength && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Strength</span>
                <span className={`text-[10px] font-black uppercase ${pwStrength === 'weak' ? 'text-red-500' : pwStrength === 'fair' ? 'text-orange-500' : 'text-emerald-500'}`}>{pwStrength}</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${pwStrength === 'weak' ? 'bg-red-400 w-1/4' : pwStrength === 'fair' ? 'bg-orange-400 w-2/4' : 'bg-emerald-500 w-full'}`} />
              </div>
            </div>
          )}

          {pwForm.confirmPassword.length > 0 && (
            <p className={`text-xs font-bold flex items-center gap-1.5 ${pwForm.newPassword === pwForm.confirmPassword ? 'text-emerald-600' : 'text-red-500'}`}>
              <CheckCircle2 size={13} />
              {pwForm.newPassword === pwForm.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
            </p>
          )}

          <button
            onClick={handleChangePassword}
            disabled={pwSaving || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#345E85] hover:bg-[#2c5173] text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pwSaving ? <><RefreshCw size={16} className="animate-spin" /> Changing…</> : <><Lock size={16} /> Change Password</>}
          </button>
        </div>
      )}

      {/* ── Preferences tab ───────────────────────────────────────────────── */}
      {tab === 'preferences' && (
        <div className="max-w-lg space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800">
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Settings size={15} className="text-[#345E85]" /> Display Preferences
            </h3>
            <div className="space-y-2">
              <CurrencySelector variant="settings" />
              <p className="text-[10px] text-gray-400 dark:text-slate-500 leading-relaxed">
                All monetary values across the platform will display in your selected currency. Changes take effect immediately.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomsOfficerProfilePage;
