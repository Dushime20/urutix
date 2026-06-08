import { DashboardSkeleton } from '../../components/common/LoadingSkeletons';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type Broker } from '../../services/brokerApi';
import DocumentUpload from '../../components/broker/DocumentUpload';
import { 
  User, 
  Building2, 
  Phone, 
  Mail, 
  Percent, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  Upload,
  FileText,
  Loader2,
  Shield,
  Activity,
  Zap,
  ArrowRight
} from 'lucide-react';

const BrokerProfile: React.FC = () => {
  const { user } = useAuth();
  const [broker, setBroker] = useState<Broker | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role === 'BROKER') {
      loadBrokerProfile();
    }
  }, [user]);

  const loadBrokerProfile = async () => {
    try {
      setLoading(true);
      const response = await brokerAPI.getBroker(user!.id);
      setBroker(response.data);
    } catch (err: any) {
      console.error('Failed to load broker profile:', err);
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broker) return;

    try {
      setUpdating(true);
      setError(null);
      setSuccess(null);
      
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      const updateData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        phone: formData.get('phone'),
        defaultCommissionRate: parseFloat(formData.get('commissionRate') as string),
      };

      await brokerAPI.updateBroker(broker.id, updateData);
      setSuccess('Profile synchronized successfully!');
      loadBrokerProfile();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!broker) {
    return (
      <div className="bg-rose-50 border border-rose-100 rounded-[2rem] p-10 text-center space-y-4">
        <AlertCircle size={48} className="text-rose-600 mx-auto" />
        <h3 className="text-xl font-bold text-rose-900 uppercase">Identity Not Found</h3>
        <p className="text-xs font-bold text-rose-700 uppercase leading-relaxed">System failed to resolve broker profile reference.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-12 animate-fade-in pb-24">
      {/* Ultra-Compact Profile Header */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl flex items-center justify-between group dark:bg-slate-950">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-600/10 rounded-full -mr-48 -mt-48 blur-[80px]"></div>
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-xl">
            <User size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none mb-1">Profile</h1>
            <p className="text-slate-400 text-sm font-bold uppercase">Identity & Verification</p>
          </div>
        </div>

        <div className="relative z-10 hidden md:flex items-center gap-12 mr-4">
          <div className="text-center">
            <p className="text-xl font-bold leading-none text-emerald-400">Verified</p>
            <p className="text-xs font-bold text-slate-500 uppercase mt-0.5 dark:text-slate-400">Status</p>
          </div>
          <div className="text-center">
             <p className="text-xl font-bold leading-none text-white italic">{broker.defaultCommissionRate}%</p>
             <p className="text-xs font-bold text-slate-500 uppercase mt-0.5 dark:text-slate-400">Standard Yield</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Compliance Guard */}
        <div className="lg:col-span-1 space-y-10">
          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm space-y-8 dark:bg-slate-900 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-3 dark:text-white">
               <Shield size={18} className="text-emerald-600" /> Compliance Status
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Email Authority', status: 'Verified', icon: CheckCircle2, color: 'emerald' },
                { label: 'Identity Vault', status: 'Pending', icon: Clock, color: 'amber' },
                { label: 'Payout Terminal', status: 'Incomplete', icon: AlertCircle, color: 'rose' }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-xl transition-all dark:bg-slate-800/50 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <item.icon size={18} className={`${item.color === 'emerald' ? 'text-emerald-500' : item.color === 'amber' ? 'text-amber-500' : 'text-rose-500'}`} />
                    <p className="text-xs font-bold text-slate-900 uppercase tracking-tight dark:text-white">{item.label}</p>
                  </div>
                  <span className={`px-4 py-1.5 text-xs font-bold uppercase rounded-full border ${item.color === 'emerald' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : item.color === 'amber' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden group dark:bg-slate-950">
             <div className="absolute top-0 right-0 p-8 opacity-5"><Zap size={120} /></div>
             <p className="text-sm font-bold text-slate-500 uppercase mb-4 dark:text-slate-400">Security Protocol</p>
             <p className="text-lg font-bold leading-relaxed relative z-10">Your profile is currently limited until identity validation is confirmed.</p>
             <button className="mt-8 px-8 py-4 bg-white/10 hover:bg-white hover:text-slate-900 transition-all text-white rounded-2xl text-sm font-bold uppercase flex items-center gap-3">
               Start Validation <ArrowRight size={14} />
             </button>
          </div>
        </div>

        {/* Identity Form */}
        <div className="lg:col-span-2 space-y-12 animate-slide-up">
          <div className="bg-white rounded-[3.5rem] p-10 md:p-14 border border-slate-100 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between mb-12">
               <h3 className="text-sm font-bold text-slate-900 uppercase dark:text-white">Core Identity</h3>
            </div>

            <form onSubmit={handleUpdate} className="space-y-10">
              {error && <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-bold uppercase">{error}</div>}
              {success && <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 text-xs font-bold uppercase">{success}</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-400 uppercase ml-4">First Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input type="text" name="firstName" defaultValue={broker.profile?.firstName || ''} className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-8 py-5 text-sm font-bold text-slate-900 focus:bg-white outline-none dark:bg-slate-800/50 dark:text-white dark:border-slate-800" required />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-400 uppercase ml-4">Last Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input type="text" name="lastName" defaultValue={broker.profile?.lastName || ''} className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-8 py-5 text-sm font-bold text-slate-900 focus:bg-white outline-none dark:bg-slate-800/50 dark:text-white dark:border-slate-800" required />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-400 uppercase ml-4">Contact Phone</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input type="tel" name="phone" defaultValue={broker.profile?.phone || ''} className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-8 py-5 text-sm font-bold text-slate-900 focus:bg-white outline-none dark:bg-slate-800/50 dark:text-white dark:border-slate-800" />
                  </div>
                </div>
                <div className="space-y-3">
                   <label className="text-sm font-bold text-slate-400 uppercase ml-4">Default Comm. Rate (%)</label>
                   <div className="relative">
                     <Percent size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                     <input type="number" name="commissionRate" min="0" max="100" step="0.1" defaultValue={broker.defaultCommissionRate || 0} className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-8 py-5 text-sm font-bold text-slate-900 focus:bg-white outline-none dark:bg-slate-800/50 dark:text-white dark:border-slate-800" required />
                   </div>
                </div>
              </div>

              <div className="flex justify-end pt-8">
                <button type="submit" disabled={updating} className="px-16 py-6 bg-slate-900 text-white rounded-[2rem] text-sm font-bold uppercase shadow-2xl hover:bg-primary-600 transition-all flex items-center gap-4 dark:bg-slate-950">
                  {updating ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />} Sync Identity
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-[3.5rem] p-10 md:p-14 border border-slate-100 shadow-sm space-y-10 dark:bg-slate-900 dark:border-slate-800">
             <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase dark:text-white">Document Registry</h3>
                <span className="px-4 py-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-400 uppercase dark:bg-slate-800/50">Vault Enabled</span>
             </div>
             <DocumentUpload onUploadComplete={(files) => { setSuccess('Vault updated successfully!'); }} maxFiles={5} acceptedTypes={['image/*', 'application/pdf']} maxSizeMB={10} label="Inject identification records into the vault (ID, Passport, License)" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrokerProfile;
