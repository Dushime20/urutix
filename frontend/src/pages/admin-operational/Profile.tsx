import React, { useState } from 'react';
import {
  User, Mail, Phone, Building2, Shield,
  Calendar, Edit3, Save, X, CheckCircle2,
  Key, Clock, Activity, Lock, Eye, EyeOff,
  RefreshCw,
} from 'lucide-react';
import OperationalPageLayout from '../../components/Admin/OperationalPageLayout';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

/* ── types ───────────────────────────────────────────────────────── */
type Tab = 'info' | 'password';

/* ── helpers ─────────────────────────────────────────────────────── */

const Field: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  span?: boolean;
}> = ({ icon, label, value, span }) => (
  <div className={`flex items-start gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl${span ? ' md:col-span-2' : ''}`}>
    <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">
        {label}
      </p>
      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-all">
        {value || <span className="text-gray-400 dark:text-slate-500 italic font-normal">Not provided</span>}
      </div>
    </div>
  </div>
);

const Badge: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest ${color}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
    {label}
  </span>
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
    className="w-full px-3 py-1.5 text-sm font-semibold border border-gray-200 dark:border-slate-600 rounded-xl dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
  />
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
          className="w-full px-4 py-3 pr-11 text-sm border border-gray-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
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

/* ── main component ──────────────────────────────────────────────── */

const OperationalAdminProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();

  const [tab, setTab]         = useState<Tab>('info');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);

  /* profile form */
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName:  user?.lastName  || '',
    email:     user?.email     || '',
    phone:     (user as any)?.phone || '',
  });

  /* password form */
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  });
  const [pwSaving, setPwSaving] = useState(false);

  const initials = [user?.firstName?.[0], user?.lastName?.[0]]
    .filter(Boolean).join('').toUpperCase() || 'U';

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Unknown User';

  const memberSince = user?.emailVerifiedAt
    ? new Date(user.emailVerifiedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'N/A';

  /* save profile */
  const handleSaveProfile = async () => {
    if (!form.email.trim()) { toast.error('Email is required'); return; }
    if (!form.firstName.trim()) { toast.error('First name is required'); return; }
    try {
      setSaving(true);
      const ok = await updateProfile(form);
      if (ok) { setEditing(false); }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelProfile = () => {
    setForm({
      firstName: user?.firstName || '',
      lastName:  user?.lastName  || '',
      email:     user?.email     || '',
      phone:     (user as any)?.phone || '',
    });
    setEditing(false);
  };

  /* save password */
  const handleChangePassword = async () => {
    if (!pwForm.currentPassword) { toast.error('Enter your current password'); return; }
    if (pwForm.newPassword.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    try {
      setPwSaving(true);
      await authAPI.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
        confirmPassword: pwForm.confirmPassword,
      });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  /* tab-specific header actions */
  const headerActions = tab === 'info'
    ? editing
      ? (
        <div className="flex gap-2">
          <button onClick={handleCancelProfile} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            <X size={15} /> Cancel
          </button>
          <button onClick={handleSaveProfile} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors disabled:opacity-60">
            {saving ? <><RefreshCw size={14} className="animate-spin" /> Saving…</> : <><Save size={15} /> Save Changes</>}
          </button>
        </div>
      )
      : (
        <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors">
          <Edit3 size={15} /> Edit Profile
        </button>
      )
    : null;

  return (
    <OperationalPageLayout
      title="My Profile"
      description="View and manage your operational admin account"
      actions={headerActions}
    >
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Hero card ── */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm">
          <div className="h-36 bg-gradient-to-r from-[#2c5173] to-[#3d7ab5] relative">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          </div>
          <div className="px-8 pb-8 relative">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="flex items-end gap-4">
                <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-lg flex items-center justify-center text-3xl font-black text-primary-600 -mt-12 select-none">
                  {initials}
                </div>
                <div className="mb-1">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{fullName}</h2>
                  <p className="text-sm text-primary-600 dark:text-primary-400 font-semibold mt-0.5">Operational Admin</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-1">
                <Badge label="Admin"  color="text-primary-700 bg-primary-50 dark:text-primary-300 dark:bg-primary-900/30" />
                {(!user?.status || user.status === 'active' || user.status === 'ACTIVE')
                  ? <Badge label="Active"  color="text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/30" />
                  : <Badge label={user.status} color="text-orange-700 bg-orange-50 dark:text-orange-300 dark:bg-orange-900/30" />
                }
                {user?.emailVerifiedAt && <Badge label="Verified" color="text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30" />}
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
          {([
            { key: 'info',     label: 'Profile Info', icon: <User size={14} /> },
            { key: 'password', label: 'Change Password', icon: <Lock size={14} /> },
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

        {/* ── Profile Info tab ── */}
        {tab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left — 2/3 */}
            <div className="lg:col-span-2 space-y-6">

              {/* Contact */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Email — editable */}
                  <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl">
                    <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0">
                      <Mail size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                        Email Address
                      </p>
                      {editing
                        ? <EditInput value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="your@email.com" type="email" />
                        : <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-all">{user?.email || '—'}</p>
                      }
                    </div>
                  </div>

                  {/* Phone — editable */}
                  <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl">
                    <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0">
                      <Phone size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                        Phone Number
                      </p>
                      {editing
                        ? <EditInput value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="+1 234 567 8900" />
                        : <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{(user as any)?.phone || <span className="italic font-normal text-gray-400">Not provided</span>}</p>
                      }
                    </div>
                  </div>

                  {/* First name — editable */}
                  <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl">
                    <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0">
                      <User size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                        First Name
                      </p>
                      {editing
                        ? <EditInput value={form.firstName} onChange={v => setForm(f => ({ ...f, firstName: v }))} placeholder="First name" />
                        : <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.firstName || '—'}</p>
                      }
                    </div>
                  </div>

                  {/* Last name — editable */}
                  <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl">
                    <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0">
                      <User size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                        Last Name
                      </p>
                      {editing
                        ? <EditInput value={form.lastName} onChange={v => setForm(f => ({ ...f, lastName: v }))} placeholder="Last name" />
                        : <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.lastName || '—'}</p>
                      }
                    </div>
                  </div>

                  <Field icon={<Building2 size={18} />} label="Organization" value={user?.tenantName || 'N/A'} span />
                </div>
              </div>

              {/* Account details (read-only) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4">
                  Account Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field icon={<Shield size={18} />} label="Role" value={user?.role?.replace(/_/g, ' ')} />
                  <Field
                    icon={<Key size={18} />}
                    label="Tenant ID"
                    value={<span className="font-mono text-xs bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded">{user?.tenantId || 'N/A'}</span>}
                  />
                  <Field icon={<Calendar size={18} />} label="Member Since" value={memberSince} />
                  <Field icon={<CheckCircle2 size={18} />} label="Email Verified" value={user?.emailVerifiedAt ? 'Yes' : 'No'} />
                </div>
              </div>
            </div>

            {/* Sidebar — 1/3 */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  {[
                    { icon: <Activity size={15} />, label: 'Role',    value: 'Admin',               color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' },
                    { icon: <Shield  size={15} />, label: 'Access',   value: 'Operational',         color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
                    { icon: <Clock   size={15} />, label: 'Status',   value: user?.status || 'Active', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
                  ].map(s => (
                    <div key={s.label} className={`flex items-center justify-between px-4 py-3 rounded-xl ${s.color}`}>
                      <div className="flex items-center gap-2">{s.icon}<span className="text-xs font-bold uppercase tracking-widest">{s.label}</span></div>
                      <span className="text-xs font-black capitalize">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">User ID</p>
                <p className="font-mono text-xs text-gray-600 dark:text-slate-400 break-all">{user?.id || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Change Password tab ── */}
        {tab === 'password' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Form — 2/3 */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100 dark:border-slate-800">
                  <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
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

                  {/* Password strength indicator */}
                  {pwForm.newPassword.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Password Strength</span>
                        <span className={`text-[10px] font-black uppercase ${
                          pwForm.newPassword.length < 8 ? 'text-red-500'
                          : pwForm.newPassword.length < 12 ? 'text-orange-500'
                          : 'text-emerald-500'
                        }`}>
                          {pwForm.newPassword.length < 8 ? 'Weak' : pwForm.newPassword.length < 12 ? 'Fair' : 'Strong'}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            pwForm.newPassword.length < 8 ? 'bg-red-400 w-1/4'
                            : pwForm.newPassword.length < 12 ? 'bg-orange-400 w-2/4'
                            : 'bg-emerald-500 w-full'
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={handleChangePassword}
                      disabled={pwSaving || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                <p className="text-xs font-black text-blue-800 dark:text-blue-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Shield size={13} /> Password Tips
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
                  <Key size={15} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
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

      </div>
    </OperationalPageLayout>
  );
};

export default OperationalAdminProfile;
