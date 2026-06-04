import React, { useState } from 'react';
import {
  User, Mail, Phone, Building2, Shield,
  Calendar, Edit3, Save, X, CheckCircle2,
  Key, Clock, Activity,
} from 'lucide-react';
import OperationalPageLayout from '../../components/Admin/OperationalPageLayout';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

/* ── helpers ──────────────────────────────────────────────────────── */

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
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-all">
        {value || <span className="text-gray-400 dark:text-slate-500 italic font-normal">Not provided</span>}
      </p>
    </div>
  </div>
);

const Badge: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest ${color}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
    {label}
  </span>
);

/* ── component ────────────────────────────────────────────────────── */

const OperationalAdminProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName:  user?.lastName  || '',
    phone:     (user as any)?.phone || '',
  });

  const initials = [user?.firstName?.[0], user?.lastName?.[0]]
    .filter(Boolean).join('').toUpperCase() || 'U';

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Unknown User';

  const memberSince = user?.emailVerifiedAt
    ? new Date(user.emailVerifiedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'N/A';

  const handleSave = async () => {
    try {
      setSaving(true);
      const ok = await updateProfile(form);
      if (ok) {
        toast.success('Profile updated successfully');
        setEditing(false);
      } else {
        toast.error('Failed to update profile');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      firstName: user?.firstName || '',
      lastName:  user?.lastName  || '',
      phone:     (user as any)?.phone || '',
    });
    setEditing(false);
  };

  return (
    <OperationalPageLayout
      title="My Profile"
      description="View and manage your operational admin account details"
      actions={
        editing ? (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              <X size={15} /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors disabled:opacity-60"
            >
              <Save size={15} />
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors"
          >
            <Edit3 size={15} /> Edit Profile
          </button>
        )
      }
    >
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Hero card ── */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm">
          {/* Cover */}
          <div className="h-36 bg-gradient-to-r from-[#2c5173] to-[#3d7ab5] relative">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
            />
          </div>

          {/* Avatar + name */}
          <div className="px-8 pb-8 relative">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="flex items-end gap-4">
                <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-lg flex items-center justify-center text-3xl font-black text-primary-600 -mt-12 select-none">
                  {initials}
                </div>
                <div className="mb-1">
                  {editing ? (
                    <div className="flex gap-2">
                      <input
                        value={form.firstName}
                        onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                        placeholder="First name"
                        className="px-3 py-1.5 text-sm font-bold border border-gray-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none w-32"
                      />
                      <input
                        value={form.lastName}
                        onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                        placeholder="Last name"
                        className="px-3 py-1.5 text-sm font-bold border border-gray-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none w-32"
                      />
                    </div>
                  ) : (
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                      {fullName}
                    </h2>
                  )}
                  <p className="text-sm text-primary-600 dark:text-primary-400 font-semibold mt-0.5">
                    Operational Admin
                  </p>
                </div>
              </div>

              {/* Status badges */}
              <div className="flex flex-wrap gap-2 mb-1">
                <Badge label="Admin" color="text-primary-700 bg-primary-50 dark:text-primary-300 dark:bg-primary-900/30" />
                {user?.status === 'active' || !user?.status
                  ? <Badge label="Active" color="text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/30" />
                  : <Badge label={user.status} color="text-orange-700 bg-orange-50 dark:text-orange-300 dark:bg-orange-900/30" />
                }
                {user?.emailVerifiedAt && (
                  <Badge label="Verified" color="text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Account info — 2/3 */}
          <div className="lg:col-span-2 space-y-6">

            {/* Contact & identity */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4">
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  icon={<Mail size={18} />}
                  label="Email Address"
                  value={user?.email}
                />
                <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl">
                  <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0">
                    <Phone size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">
                      Phone Number
                    </p>
                    {editing ? (
                      <input
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="+1 234 567 8900"
                        className="w-full px-2 py-1 text-sm font-semibold border border-gray-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {(user as any)?.phone || <span className="text-gray-400 italic font-normal">Not provided</span>}
                      </p>
                    )}
                  </div>
                </div>
                <Field
                  icon={<Building2 size={18} />}
                  label="Organization"
                  value={user?.tenantName || 'N/A'}
                  span
                />
              </div>
            </div>

            {/* Account details */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4">
                Account Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  icon={<Shield size={18} />}
                  label="Role"
                  value={user?.role?.replace(/_/g, ' ')}
                />
                <Field
                  icon={<Key size={18} />}
                  label="Tenant ID"
                  value={
                    <span className="font-mono text-xs bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                      {user?.tenantId || 'N/A'}
                    </span>
                  }
                />
                <Field
                  icon={<Calendar size={18} />}
                  label="Member Since"
                  value={memberSince}
                />
                <Field
                  icon={<CheckCircle2 size={18} />}
                  label="Email Verified"
                  value={user?.emailVerifiedAt ? 'Yes' : 'No'}
                />
              </div>
            </div>
          </div>

          {/* Sidebar — 1/3 */}
          <div className="space-y-6">

            {/* Quick stats */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4">
                Quick Stats
              </h3>
              <div className="space-y-3">
                {[
                  { icon: <Activity size={15} />, label: 'Role',   value: 'Admin',              color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' },
                  { icon: <Shield  size={15} />, label: 'Access',  value: 'Operational',        color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
                  { icon: <Clock   size={15} />, label: 'Status',  value: user?.status || 'Active', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
                ].map(s => (
                  <div key={s.label} className={`flex items-center justify-between px-4 py-3 rounded-xl ${s.color}`}>
                    <div className="flex items-center gap-2">
                      {s.icon}
                      <span className="text-xs font-bold uppercase tracking-widest">{s.label}</span>
                    </div>
                    <span className="text-xs font-black capitalize">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Security notice */}
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-5 border border-amber-100 dark:border-amber-800/30">
              <div className="flex items-start gap-3">
                <Key size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-widest mb-1">
                    Security
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    To change your password or enable two-factor authentication, contact your system administrator.
                  </p>
                </div>
              </div>
            </div>

            {/* User ID */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800">
              <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                User ID
              </p>
              <p className="font-mono text-xs text-gray-600 dark:text-slate-400 break-all">
                {user?.id || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </OperationalPageLayout>
  );
};

export default OperationalAdminProfile;
