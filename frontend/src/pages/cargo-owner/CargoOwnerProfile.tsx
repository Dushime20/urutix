import React, { useState } from 'react';
import {
  User, Mail, Phone, Building2, Shield, Calendar,
  Edit3, Save, X, CheckCircle2, Key, Clock, Activity,
  Lock, Eye, EyeOff, RefreshCw, Package, TrendingUp,
  Star, MapPin, Globe, FileText, Settings,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import CurrencySelector from '../../components/common/CurrencySelector';
import toast from 'react-hot-toast';

// ─── shared micro-components ──────────────────────────────────────────────────

const Field: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  span?: boolean;
}> = ({ icon, label, value, span }) => (
  <div className={`flex items-start gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl${span ? ' md:col-span-2' : ''}`}>
    <div className="w-10 h-10 rounded-xl bg-[#345E85]/10 text-[#345E85] dark:text-blue-400 flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">
        {label}
      </p>
      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-all">
        {value ?? <span className="text-gray-400 dark:text-slate-500 italic font-normal">Not provided</span>}
      </div>
    </div>
  </div>
);

const EditInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}> = ({ value, onChange, placeholder, type = 'text' }) => (
  <input
    type={type}
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full px-3 py-1.5 text-sm font-semibold border border-gray-200 dark:border-slate-600 rounded-xl dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-[#345E85] outline-none transition-all"
  />
);

const EditableField: React.FC<{
  icon: React.ReactNode;
  label: string;
  staticValue: React.ReactNode;
  editing: boolean;
  editNode: React.ReactNode;
  span?: boolean;
}> = ({ icon, label, staticValue, editing, editNode, span }) => (
  <div className={`flex items-start gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl${span ? ' md:col-span-2' : ''}`}>
    <div className="w-10 h-10 rounded-xl bg-[#345E85]/10 text-[#345E85] dark:text-blue-400 flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">
        {label}
      </p>
      {editing ? editNode : (
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {staticValue ?? <span className="text-gray-400 dark:text-slate-500 italic font-normal">Not provided</span>}
        </div>
      )}
    </div>
  </div>
);

const PasswordInput: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}> = ({ label, value, onChange, placeholder, hint }) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-11 text-sm border border-gray-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-[#345E85] outline-none"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {hint && <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">{hint}</p>}
    </div>
  );
};

const Badge: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest ${color}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
    {label}
  </span>
);

type Tab = 'profile' | 'password' | 'preferences';

// ─── main ─────────────────────────────────────────────────────────────────────

const CargoOwnerProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();

  const [tab, setTab]         = useState<Tab>('profile');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);

  const [form, setForm] = useState({
    firstName:   user?.firstName  || '',
    lastName:    user?.lastName   || '',
    email:       user?.email      || '',
    phone:       (user as any)?.phone       || '',
    companyName: (user as any)?.profile?.companyName || '',
    address:     (user as any)?.profile?.address     || '',
    bio:         (user as any)?.profile?.bio         || '',
    websiteUrl:  (user as any)?.profile?.websiteUrl  || '',
  });

  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  });
  const [pwSaving, setPwSaving] = useState(false);

  const initials = [user?.firstName?.[0], user?.lastName?.[0]]
    .filter(Boolean).join('').toUpperCase() || 'CO';

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Cargo Owner';

  const memberSince = (user as any)?.createdAt
    ? new Date((user as any).createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'N/A';

  const totalLoads  = (user as any)?.profile?.totalTrips ?? 0;
  const rating      = Number((user as any)?.profile?.rating ?? 0).toFixed(1);

  // ── save profile ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.email.trim())     { toast.error('Email is required');      return; }
    if (!form.firstName.trim()) { toast.error('First name is required'); return; }
    try {
      setSaving(true);
      const ok = await updateProfile(form as any);
      if (ok) { setEditing(false); toast.success('Profile updated'); }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      firstName:   user?.firstName  || '',
      lastName:    user?.lastName   || '',
      email:       user?.email      || '',
      phone:       (user as any)?.phone       || '',
      companyName: (user as any)?.profile?.companyName || '',
      address:     (user as any)?.profile?.address     || '',
      bio:         (user as any)?.profile?.bio         || '',
      websiteUrl:  (user as any)?.profile?.websiteUrl  || '',
    });
    setEditing(false);
  };

  // ── save password ───────────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!pwForm.currentPassword)          { toast.error('Enter your current password');              return; }
    if (pwForm.newPassword.length < 8)    { toast.error('New password must be at least 8 chars');   return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match');      return; }
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
    : pwForm.newPassword.length < 8  ? 'weak'
    : pwForm.newPassword.length < 12 ? 'fair'
    : 'strong';

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in duration-400">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-[#2c5173] via-[#345E85] to-[#3d7ab5] relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
          />
          {/* Decorative circles */}
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute -right-4 -bottom-8 w-32 h-32 rounded-full bg-white/5" />
        </div>

        <div className="px-6 sm:px-8 pb-7 relative">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex items-end gap-4">
              {/* Avatar */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-lg flex items-center justify-center text-2xl sm:text-3xl font-black text-[#345E85] -mt-10 select-none flex-shrink-0">
                {initials}
              </div>
              <div className="mb-1">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">{fullName}</h2>
                <p className="text-sm text-[#345E85] dark:text-blue-400 font-semibold mt-0.5">Cargo Owner</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-1">
              <Badge label="Cargo Owner" color="text-[#345E85] bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30" />
              {user?.status === 'ACTIVE' || !user?.status
                ? <Badge label="Active" color="text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/30" />
                : <Badge label={user?.status} color="text-orange-700 bg-orange-50" />
              }
              {(user as any)?.emailVerifiedAt && (
                <Badge label="Verified" color="text-violet-700 bg-violet-50 dark:text-violet-300 dark:bg-violet-900/30" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: <Package size={18} />,    label: 'Total Loads',    value: totalLoads,          color: 'text-[#345E85] bg-blue-50 dark:bg-blue-900/20' },
          { icon: <Star size={18} />,       label: 'Rating',         value: rating,              color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
          { icon: <Clock size={18} />,      label: 'Member Since',   value: memberSince,         color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20' },
          { icon: <Activity size={18} />,   label: 'Account Status', value: user?.status ?? 'Active', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
        ].map(kpi => (
          <div key={kpi.label} className={`rounded-2xl p-4 flex items-center gap-3 ${kpi.color}`}>
            <div className="flex-shrink-0">{kpi.icon}</div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-70">{kpi.label}</p>
              <p className="text-sm font-black capitalize mt-0.5 truncate">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
        {([
          { key: 'profile',     label: 'Profile Info',     icon: <User size={14} /> },
          { key: 'password',    label: 'Change Password',  icon: <Lock size={14} /> },
          { key: 'preferences', label: 'Preferences',      icon: <Settings size={14} /> },
        ] as const).map(t => (
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main — 2/3 */}
          <div className="lg:col-span-2 space-y-6">

            {/* Action buttons */}
            <div className="flex justify-end gap-2">
              {editing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <X size={14} /> Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#345E85] hover:bg-[#2c5173] rounded-xl transition-colors disabled:opacity-60"
                  >
                    {saving ? <><RefreshCw size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Save Changes</>}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#345E85] hover:bg-[#2c5173] rounded-xl transition-colors"
                >
                  <Edit3 size={14} /> Edit Profile
                </button>
              )}
            </div>

            {/* Personal Information */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-5">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EditableField
                  icon={<User size={17} />}
                  label="First Name"
                  staticValue={user?.firstName}
                  editing={editing}
                  editNode={<EditInput value={form.firstName} onChange={v => setForm(f => ({ ...f, firstName: v }))} placeholder="First name" />}
                />
                <EditableField
                  icon={<User size={17} />}
                  label="Last Name"
                  staticValue={user?.lastName}
                  editing={editing}
                  editNode={<EditInput value={form.lastName} onChange={v => setForm(f => ({ ...f, lastName: v }))} placeholder="Last name" />}
                />
                <EditableField
                  icon={<Mail size={17} />}
                  label="Email Address"
                  staticValue={user?.email}
                  editing={editing}
                  editNode={<EditInput value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="you@example.com" type="email" />}
                />
                <EditableField
                  icon={<Phone size={17} />}
                  label="Phone Number"
                  staticValue={(user as any)?.phone}
                  editing={editing}
                  editNode={<EditInput value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="+1 234 567 8900" />}
                />
                <EditableField
                  icon={<Building2 size={17} />}
                  label="Company Name"
                  staticValue={(user as any)?.profile?.companyName}
                  editing={editing}
                  editNode={<EditInput value={form.companyName} onChange={v => setForm(f => ({ ...f, companyName: v }))} placeholder="Your company" />}
                />
                <EditableField
                  icon={<MapPin size={17} />}
                  label="Address"
                  staticValue={(user as any)?.profile?.address}
                  editing={editing}
                  editNode={<EditInput value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} placeholder="Your address" />}
                />
                <EditableField
                  icon={<Globe size={17} />}
                  label="Website"
                  staticValue={(user as any)?.profile?.websiteUrl}
                  editing={editing}
                  editNode={<EditInput value={form.websiteUrl} onChange={v => setForm(f => ({ ...f, websiteUrl: v }))} placeholder="https://yoursite.com" />}
                  span
                />
                {editing ? (
                  <div className="md:col-span-2 flex items-start gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-[#345E85]/10 text-[#345E85] dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                      <FileText size={17} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Bio</p>
                      <textarea
                        value={form.bio}
                        onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                        placeholder="A short description about yourself or your business"
                        rows={3}
                        className="w-full px-3 py-2 text-sm font-semibold border border-gray-200 dark:border-slate-600 rounded-xl dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-[#345E85] outline-none resize-none"
                      />
                    </div>
                  </div>
                ) : (user as any)?.profile?.bio ? (
                  <Field icon={<FileText size={17} />} label="Bio" value={(user as any)?.profile?.bio} span />
                ) : null}
              </div>
            </div>

            {/* Account Details (read-only) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-5">
                Account Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field icon={<Shield size={17} />} label="Role" value="Cargo Owner" />
                <Field icon={<CheckCircle2 size={17} />} label="Email Verified" value={(user as any)?.emailVerifiedAt ? 'Yes' : 'No'} />
                <Field icon={<Calendar size={17} />} label="Member Since" value={memberSince} />
                <Field
                  icon={<Key size={17} />}
                  label="Tenant ID"
                  value={<span className="font-mono text-xs bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded">{user?.tenantId || 'N/A'}</span>}
                />
              </div>
            </div>
          </div>

          {/* Sidebar — 1/3 */}
          <div className="space-y-5">

            {/* Quick stats */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800">
              <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4">Quick Stats</h3>
              <div className="space-y-3">
                {[
                  { icon: <Package size={14} />,  label: 'Total Loads',  value: totalLoads,          color: 'text-[#345E85] bg-blue-50 dark:bg-blue-900/20' },
                  { icon: <Star size={14} />,      label: 'Rating',       value: rating,              color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
                  { icon: <Activity size={14} />,  label: 'Status',       value: user?.status ?? 'Active', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
                  { icon: <TrendingUp size={14} />, label: 'Role',         value: 'Cargo Owner',       color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20' },
                ].map(s => (
                  <div key={s.label} className={`flex items-center justify-between px-4 py-3 rounded-xl ${s.color}`}>
                    <div className="flex items-center gap-2">{s.icon}<span className="text-[10px] font-bold uppercase tracking-widest">{s.label}</span></div>
                    <span className="text-[11px] font-black capitalize">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* User ID */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800">
              <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">User ID</p>
              <p className="font-mono text-xs text-gray-600 dark:text-slate-400 break-all">{user?.id || 'N/A'}</p>
            </div>

            {/* Help tip */}
            <div className="bg-[#345E85]/5 dark:bg-blue-900/10 rounded-2xl p-5 border border-[#345E85]/10 dark:border-blue-800/20">
              <p className="text-xs font-black text-[#345E85] dark:text-blue-400 uppercase tracking-widest mb-2">Profile Tip</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                Keeping your profile up-to-date helps truck owners and brokers identify you faster when reviewing cargo requests.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Password tab ──────────────────────────────────────────────────── */}
      {tab === 'password' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Form — 2/3 */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100 dark:border-slate-800">
                <div className="w-11 h-11 rounded-xl bg-[#345E85]/10 text-[#345E85] dark:text-blue-400 flex items-center justify-center">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white">Change Password</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Choose a strong password you haven't used before</p>
                </div>
              </div>

              <div className="space-y-4">
                <PasswordInput
                  label="Current Password"
                  value={pwForm.currentPassword}
                  onChange={v => setPwForm(p => ({ ...p, currentPassword: v }))}
                  placeholder="Enter your current password"
                />
                <PasswordInput
                  label="New Password"
                  value={pwForm.newPassword}
                  onChange={v => setPwForm(p => ({ ...p, newPassword: v }))}
                  placeholder="Min. 8 characters"
                  hint="Use at least 8 characters with a mix of letters, numbers, and symbols."
                />
                <PasswordInput
                  label="Confirm New Password"
                  value={pwForm.confirmPassword}
                  onChange={v => setPwForm(p => ({ ...p, confirmPassword: v }))}
                  placeholder="Repeat new password"
                />

                {/* Strength indicator */}
                {pwStrength && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Strength</span>
                      <span className={`text-[10px] font-black uppercase ${
                        pwStrength === 'weak' ? 'text-red-500' : pwStrength === 'fair' ? 'text-orange-500' : 'text-emerald-500'
                      }`}>
                        {pwStrength}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${
                        pwStrength === 'weak' ? 'bg-red-400 w-1/4' : pwStrength === 'fair' ? 'bg-orange-400 w-2/4' : 'bg-emerald-500 w-full'
                      }`} />
                    </div>
                  </div>
                )}

                {/* Match indicator */}
                {pwForm.confirmPassword.length > 0 && (
                  <p className={`text-xs font-bold flex items-center gap-1.5 ${
                    pwForm.newPassword === pwForm.confirmPassword ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    <CheckCircle2 size={13} />
                    {pwForm.newPassword === pwForm.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                  </p>
                )}

                <div className="pt-2">
                  <button
                    onClick={handleChangePassword}
                    disabled={pwSaving || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#345E85] hover:bg-[#2c5173] text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {pwSaving
                      ? <><RefreshCw size={16} className="animate-spin" /> Changing Password…</>
                      : <><Lock size={16} /> Change Password</>
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tips sidebar — 1/3 */}
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 border border-blue-100 dark:border-blue-800/30">
              <p className="text-xs font-black text-[#345E85] dark:text-blue-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Shield size={12} /> Password Tips
              </p>
              <ul className="space-y-2 text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                {[
                  'Use at least 8 characters',
                  'Mix uppercase and lowercase',
                  'Include numbers and symbols',
                  "Don't reuse old passwords",
                  'Avoid personal information',
                ].map(tip => (
                  <li key={tip} className="flex items-start gap-2">
                    <CheckCircle2 size={12} className="mt-0.5 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-5 border border-amber-100 dark:border-amber-800/30">
              <div className="flex items-start gap-3">
                <Key size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-widest mb-1">Note</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    You will remain logged in after changing your password. Other active sessions may be invalidated.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Preferences tab ───────────────────────────────────────────────── */}
      {tab === 'preferences' && (
        <div className="max-w-2xl space-y-6">
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

export default CargoOwnerProfile;
