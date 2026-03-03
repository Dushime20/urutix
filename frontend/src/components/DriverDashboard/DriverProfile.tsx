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
  Target
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';

interface DriverProfileProps {
  driver: any;
  loading?: boolean;
}

export const DriverProfile: React.FC<DriverProfileProps> = ({ driver, loading }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: driver?.firstName || '',
    lastName: driver?.lastName || '',
    phone: driver?.phone || '',
    address: driver?.address || '',
    emergencyContact: driver?.emergencyContact || '',
    emergencyPhone: driver?.emergencyPhone || '',
  });

  const handleSave = async () => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1000)),
      {
        loading: 'Saving Profile...',
        success: 'Profile Updated',
        error: 'Update Failed',
      }
    );
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 animate-pulse h-[600px]" />
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-[#0f172a] flex items-center justify-center text-white">
            <User size={24} />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">My Profile</h3>
            <h2 className="text-xl font-black text-[#0f172a] uppercase tracking-tight">Driver Information</h2>
          </div>
        </div>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={cn(
            "flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg",
            isEditing
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100'
              : 'bg-[#345E85] text-white hover:bg-[#0f172a] shadow-blue-100'
          )}
        >
          {isEditing ? (
            <><Save size={16} /> Save Changes</>
          ) : (
            <><Edit2 size={16} /> Edit Profile</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-10">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-2xl shadow-slate-200/40 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#345E85] to-indigo-500" />

            <div className="relative inline-block mb-8">
              <div className="w-40 h-40 rounded-[2.5rem] bg-slate-50 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-500">
                <User className="w-20 h-20 text-slate-200" />
              </div>
              {isEditing && (
                <button className="absolute -bottom-2 -right-2 w-12 h-12 bg-white border border-slate-100 text-[#345E85] rounded-2xl shadow-xl flex items-center justify-center hover:bg-slate-50 transition-colors active:scale-90">
                  <Camera size={18} />
                </button>
              )}
            </div>

            <h3 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight mb-2">
              {driver?.firstName} {driver?.lastName}
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">{driver?.licenseNumber || 'LIC-0000000'}</p>

            <div className="flex flex-wrap justify-center gap-3 mb-10">
              <span className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-black uppercase tracking-widest rounded-xl">
                Status: {driver?.status || 'Active'}
              </span>
              <span className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-100 text-[9px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2">
                <Award size={12} />
                Rating: {driver?.rating || '5.0'}
              </span>
            </div>

            <div className="space-y-4 text-left border-t border-slate-50 pt-10">
              {[
                { label: 'Email', val: user?.email, icon: Mail },
                { label: 'Phone', val: driver?.phone || '+254 --- --- ---', icon: Phone },
                { label: 'Address', val: driver?.address || 'Nairobi, Kenya', icon: MapPin }
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-4 group/item">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#345E85] border border-slate-100 group-hover/item:bg-[#345E85] group-hover/item:text-white transition-all">
                    <item.icon size={16} />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{item.label}</p>
                    <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight leading-none">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Integrity */}
          <div className="bg-[#0f172a] rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10">
              <Shield size={100} />
            </div>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                <Shield size={20} className="text-blue-400" />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-0.5">Safety Record</h4>
                <p className="text-sm font-black text-white uppercase tracking-tight leading-none">Driver Stats</p>
              </div>
            </div>
            <div className="space-y-8">
              {[
                { label: 'Joined', val: new Date(driver?.createdAt || Date.now()).toLocaleDateString(), col: 'text-blue-400' },
                { label: 'Total Trips', val: driver?.totalTrips || '0', col: 'text-emerald-400' },
                { label: 'Safe Miles', val: `${driver?.safeMiles || '0'} KM`, col: 'text-purple-400' }
              ].map((stat) => (
                <div key={stat.label} className="relative z-10">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className={cn("text-xl font-black tracking-tight", stat.col)}>{stat.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Info */}
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-200/40">
            <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-[#345E85] shadow-sm">
                  <Target size={20} />
                </div>
                <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-tight">Personal Information</h3>
              </div>
            </div>
            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
              {[
                { label: 'First Name', key: 'firstName', type: 'text' },
                { label: 'Last Name', key: 'lastName', type: 'text' },
                { label: 'License Type', val: 'Heavy Commercial', type: 'info' },
                { label: 'License Expiry', val: '2026-12-31', type: 'date', icon: CalendarIcon }
              ].map((field) => (
                <div key={field.label} className="space-y-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">{field.label}</label>
                  {isEditing && field.key ? (
                    <input
                      type={field.type}
                      value={formData[field.key as keyof typeof formData]}
                      onChange={(e) => setFormData({ ...formData, [field.key!]: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#0f172a] focus:ring-4 focus:ring-blue-500/10 focus:border-[#345E85] outline-none transition-all"
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      {field.icon && <field.icon size={14} className="text-slate-400" />}
                      <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">{field.val || (driver ? driver[field.key!] : 'UNSPECIFIED')}</p>
                    </div>
                  )}
                </div>
              ))}
              <div className="md:col-span-2 space-y-3">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Vehicle Information</label>
                <div className="flex items-center gap-6 p-8 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-white hover:shadow-xl transition-all duration-500 group">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-white border border-slate-100 flex items-center justify-center text-[#345E85] shadow-sm group-hover:rotate-12 transition-transform">
                    <Truck size={32} />
                  </div>
                  <div>
                    <p className="text-lg font-black text-[#0f172a] uppercase tracking-tight">{driver?.vehiclePlate || 'KCA 123X'}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Model: {driver?.vehicleModel || 'Isuzu FSR 33'}</p>
                  </div>
                  <div className="ml-auto">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                      <Zap size={18} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Protocols */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-200/40">
            <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-rose-500 shadow-sm">
                  <Activity size={20} />
                </div>
                <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-tight">Emergency Contact</h3>
              </div>
            </div>
            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
              {[
                { label: 'Contact Name', key: 'emergencyContact', pl: 'e.g. Mary Doe' },
                { label: 'Phone Number', key: 'emergencyPhone', pl: 'e.g. +254 --- --- ---' }
              ].map((field) => (
                <div key={field.label} className="space-y-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">{field.label}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData[field.key as keyof typeof formData]}
                      onChange={(e) => setFormData({ ...formData, [field.key!]: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#0f172a] focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all"
                      placeholder={field.pl}
                    />
                  ) : (
                    <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">{driver ? driver[field.key!] : 'NOT CONFIGURED'}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Certification Matrix */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-200/40">
            <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-indigo-500 shadow-sm">
                  <FileText size={20} />
                </div>
                <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-tight">Certifications & Training</h3>
              </div>
            </div>
            <div className="p-10">
              <div className="grid grid-cols-1 gap-4">
                {[
                  { name: 'Defensive Driving Certificate', date: '2024-05-15', status: 'Valid' },
                  { name: 'First Aid Training', date: '2024-08-20', status: 'Valid' },
                  { name: 'Dangerous Goods Handling', date: '2024-02-10', status: 'Expiring Soon' }
                ].map((cert, i) => (
                  <div key={i} className="flex items-center justify-between p-6 bg-slate-50/50 hover:bg-white border border-slate-100 rounded-[2rem] hover:shadow-xl transition-all duration-500 group/cert">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-400 group-hover/cert:text-indigo-500 shadow-sm transition-colors">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-[#0f172a] uppercase tracking-tight group-hover/cert:translate-x-1 transition-transform">{cert.name}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Issued: {cert.date}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "px-4 py-2 text-[8px] font-black uppercase tracking-widest rounded-xl border",
                      cert.status === 'Valid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                    )}>
                      {cert.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
