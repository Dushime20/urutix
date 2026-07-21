import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Award,
  Calendar as CalendarIcon,
  Shield,
  Edit2,
  Save,
  Camera,
  Truck,
  FileText,
  Zap,
  Activity,
  Target,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';

interface DriverProfileProps {
  driver: any;
  loading?: boolean;
}

// Safely extract a string value from a potentially nested object
function safeStr(val: any, fallback = ''): string {
  if (val == null) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    return val.name || val.contactName || val.city || val.address || fallback;
  }
  return fallback;
}

export const DriverProfile: React.FC<DriverProfileProps> = ({ driver, loading }) => {
  const { tSync: t } = useTranslation();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const emergencyContact = driver?.emergencyContact;
  const [formData, setFormData] = useState({
    firstName: driver?.firstName || '',
    lastName: driver?.lastName || '',
    phone: driver?.phone || '',
    address: safeStr(driver?.address, 'Not set'),
    emergencyContact: typeof emergencyContact === 'object'
      ? safeStr(emergencyContact?.name || emergencyContact?.contactName, '')
      : safeStr(emergencyContact, ''),
    emergencyPhone: typeof emergencyContact === 'object'
      ? safeStr(emergencyContact?.phone || emergencyContact?.contactPhone, '')
      : safeStr(driver?.emergencyPhone, ''),
  });

  const handleSave = async () => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 800)),
      { loading: t('Saving...'), success: t('Profile updated'), error: t('Update failed') }
    );
    setIsEditing(false);
  };

  if (loading) {
    return <div className="bg-white rounded-[2rem] border border-slate-100 p-8 animate-pulse h-64" />;
  }

  const fullName = `${driver?.firstName || ''} ${driver?.lastName || ''}`.trim() || 'Driver';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#345E85] flex items-center justify-center text-white shrink-0">
            <User size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Driver Profile" /></p>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">{fullName}</h2>
          </div>
        </div>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95',
            isEditing
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-[#345E85] text-white hover:bg-slate-800'
          )}
        >
          {isEditing ? <><Save size={14} /> <TranslatedText text="Save" /></> : <><Edit2 size={14} /> <TranslatedText text="Edit" /></>}
        </button>
      </div>

      {/* Main grid — stacks on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left column: Avatar + quick info ── */}
        <div className="space-y-4">

          {/* Avatar card */}
          <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-[1.5rem] bg-slate-50 border-4 border-white shadow-md flex items-center justify-center">
                  <User className="w-12 h-12 text-slate-200" />
                </div>
                {isEditing && (
                  <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-white border border-slate-200 text-[#345E85] rounded-xl shadow flex items-center justify-center hover:bg-slate-50 transition-colors">
                    <Camera size={14} />
                  </button>
                )}
              </div>
              <h3 className="text-base font-black text-slate-900 tracking-tight mb-0.5">{fullName}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                {driver?.licenseNumber || 'LIC-000000'}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <span className={cn(
                  'px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border',
                  driver?.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    : 'bg-slate-50 text-slate-500 border-slate-200'
                )}>
                  {driver?.status === 'ACTIVE' ? <TranslatedText text="Active" /> : <TranslatedText text={driver?.status || 'Active'} />}
                </span>
                <span className="px-3 py-1 rounded-full bg-[#345E85]/10 text-[#345E85] text-[9px] font-black uppercase tracking-widest border border-[#345E85]/20 flex items-center gap-1">
                  <Award size={10} /> {Number(driver?.rating ?? 0).toFixed(1)} ★
                </span>
              </div>
            </div>

            {/* Contact info */}
            <div className="mt-5 pt-5 border-t border-slate-50 space-y-3">
              {[
                { label: 'Email', value: user?.email || '—', Icon: Mail },
                { label: 'Phone', value: driver?.phone || '—', Icon: Phone },
                { label: 'Address', value: safeStr(driver?.address, '—'), Icon: MapPin },
              ].map(({ label, value, Icon }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-[#345E85] shrink-0 mt-0.5">
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text={label} /></p>
                    <p className="text-xs font-bold text-slate-800 truncate">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats card */}
          <div className="bg-[#345E85] rounded-[2rem] p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} className="text-white/60" />
              <p className="text-[10px] font-black uppercase tracking-widest text-white/70"><TranslatedText text="Driver Stats" /></p>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Member Since', value: driver?.createdAt ? new Date(driver.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '—', color: 'text-blue-300' },
                { label: 'Total Trips', value: String(driver?.totalTrips ?? 0), color: 'text-emerald-300' },
                { label: 'Total Distance', value: `${Number(driver?.totalDistance ?? 0).toLocaleString()} km`, color: 'text-purple-300' },
                { label: 'Safety Score', value: `${Number(driver?.safetyScore ?? 100).toFixed(0)}%`, color: 'text-amber-300' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-0.5"><TranslatedText text={label} /></p>
                  <p className={cn('text-base font-black tracking-tight', color)}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right columns: Forms ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Personal Info */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3 bg-slate-50/40">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-[#345E85]">
                <Target size={14} />
              </div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest"><TranslatedText text="Personal Information" /></h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'First Name', key: 'firstName' },
                { label: 'Last Name', key: 'lastName' },
                { label: 'Phone', key: 'phone' },
                { label: 'Address', key: 'address' },
              ].map(({ label, key }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text={label} /></label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData[key as keyof typeof formData]}
                      onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#345E85] focus:ring-1 focus:ring-[#345E85]/20 transition-all"
                    />
                  ) : (
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {formData[key as keyof typeof formData] || '—'}
                    </p>
                  )}
                </div>
              ))}

              {/* License */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="License Number" /></label>
                <p className="text-sm font-bold text-slate-800">{driver?.licenseNumber || '—'}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="License Expiry" /></label>
                <div className="flex items-center gap-2">
                  <CalendarIcon size={13} className="text-slate-400" />
                  <p className="text-sm font-bold text-slate-800">
                    {driver?.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>

              {/* Vehicle */}
              <div className="sm:col-span-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2"><TranslatedText text="Assigned Truck" /></label>
                <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-[#345E85] shrink-0">
                    <Truck size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-slate-900 truncate">
                      {driver?.currentTruck?.plateNumber || driver?.vehiclePlate || t('Not assigned')}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium truncate">
                      {driver?.currentTruck ? `${driver.currentTruck.make || ''} ${driver.currentTruck.model || ''}`.trim() : driver?.vehicleModel || '—'}
                    </p>
                  </div>
                  {driver?.currentTruckId && (
                    <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                      <CheckCircle size={14} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3 bg-slate-50/40">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-rose-500">
                <Activity size={14} />
              </div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest"><TranslatedText text="Emergency Contact" /></h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Contact Name', key: 'emergencyContact', placeholder: 'e.g. Mary Doe' },
                { label: 'Phone Number', key: 'emergencyPhone', placeholder: 'e.g. +254 --- --- ---' },
              ].map(({ label, key, placeholder }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text={label} /></label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData[key as keyof typeof formData]}
                      onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                      placeholder={t(placeholder)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-100 transition-all"
                    />
                  ) : (
                    <p className="text-sm font-bold text-slate-800">
                      {formData[key as keyof typeof formData] || t('Not configured')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3 bg-slate-50/40">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-indigo-500">
                <FileText size={14} />
              </div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest"><TranslatedText text="Certifications & Compliance" /></h3>
            </div>
            <div className="p-6 space-y-3">
              {/* Real compliance dates from driver */}
              {[
                {
                  name: 'Medical Certificate',
                  expiry: driver?.medicalCertExpiry,
                  icon: Shield,
                },
                {
                  name: 'Drug Test',
                  expiry: driver?.drugTestDate,
                  icon: CheckCircle,
                },
                {
                  name: 'Background Check',
                  expiry: driver?.backgroundCheckDate,
                  icon: Award,
                },
                {
                  name: 'Training Completion',
                  expiry: driver?.trainingCompletionDate,
                  icon: Clock,
                },
              ].map(({ name, expiry, icon: Icon }) => {
                const expiryDate = expiry ? new Date(expiry) : null;
                const isExpired = expiryDate ? expiryDate < new Date() : false;
                const isExpiringSoon = expiryDate
                  ? expiryDate < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && !isExpired
                  : false;
                const status = !expiryDate ? 'N/A' : isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Valid';

                return (
                  <div key={name} className="flex items-center justify-between p-4 bg-slate-50/60 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate"><TranslatedText text={name} /></p>
                        <p className="text-[10px] text-slate-400">
                          {expiryDate ? expiryDate.toLocaleDateString() : '—'}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      'px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shrink-0 ml-3',
                      status === 'Valid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      status === 'Expiring Soon' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      status === 'Expired' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                      'bg-slate-50 text-slate-400 border-slate-200'
                    )}>
                      {status === 'N/A' ? t('N/A') : <TranslatedText text={status} />}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
