import { DashboardSkeleton } from '../../components/common/LoadingSkeletons';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type BrokerDispute, type CreateDisputeData, type ResolveDisputeData } from '../../services/brokerApi';
import { AlertTriangle, Plus, Search, Filter, MessageSquare, CheckCircle2, Clock, Loader2, Eye, Gavel, Shield, Activity, X } from 'lucide-react';
import toast from 'react-hot-toast';

const DisputeResolution: React.FC = () => {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<BrokerDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<BrokerDispute | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: '',
  });

  useEffect(() => {
    if (user && user.role === 'BROKER') {
      fetchDisputes();
    }
  }, [user, filters.status, filters.category]);

  const fetchDisputes = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await brokerAPI.getDisputes({
        status: filters.status || undefined,
        category: filters.category || undefined,
      });
      const disputesData = response.data || response || [];
      setDisputes(Array.isArray(disputesData) ? disputesData : []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch disputes');
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDispute = async (data: CreateDisputeData) => {
    try {
      await brokerAPI.createDispute(data);
      toast.success('Dispute created successfully');
      setShowCreateModal(false);
      fetchDisputes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create dispute');
    }
  };

  const handleStartMediation = async (disputeId: string) => {
    try {
      await brokerAPI.startMediation(disputeId, 'Broker starting mediation process');
      toast.success('Mediation started');
      fetchDisputes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start mediation');
    }
  };

  const handleResolveDispute = async (disputeId: string, data: ResolveDisputeData) => {
    try {
      await brokerAPI.resolveDispute(disputeId, data);
      toast.success('Dispute resolved successfully');
      setShowResolveModal(false);
      setSelectedDispute(null);
      fetchDisputes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resolve dispute');
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'MEDIATION':
        return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'OPEN':
      case 'UNDER_REVIEW':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'ESCALATED':
        return 'bg-rose-50 text-rose-600 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  if (loading && disputes.length === 0) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 animate-fade-in pb-24">
      {/* Ultra-Compact Disputes Header */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl flex items-center justify-between group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-600/10 rounded-full -mr-48 -mt-48 blur-[80px]"></div>
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-xl">
            <Gavel size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none mb-1">Disputes</h1>
            <p className="text-slate-400 text-sm font-bold uppercase">Resolution & Mediation</p>
          </div>
        </div>

        <div className="relative z-10 hidden md:flex items-center gap-12 mr-4 text-white">
          <div className="text-center">
            <p className="text-xl font-bold leading-none">{disputes.length}</p>
            <p className="text-xs font-bold text-slate-500 uppercase mt-0.5">Total Cases</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold leading-none text-emerald-400">{disputes.filter(d => d.status === 'RESOLVED').length}</p>
            <p className="text-xs font-bold text-slate-500 uppercase mt-0.5">Resolved</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-600 hover:bg-primary-500 text-white font-bold uppercase px-8 py-2.5 rounded-xl shadow-xl shadow-primary-900/20 active:scale-95 transition-all flex items-center gap-2 text-sm"
          >
            <Plus size={14} /> Open Case
          </button>
        </div>
      </div>

      {/* Terminal Grid Filters */}
      <div className="bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm flex flex-col lg:flex-row gap-8 items-end relative group overflow-hidden">
        <div className="flex-1 space-y-4">
          <label className="text-sm font-bold text-slate-400 uppercase ml-4">Filter Resolutions</label>
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input
              type="text"
              placeholder="Search case descriptions..."
              className="w-full bg-slate-50 border border-slate-50 rounded-2xl pl-16 pr-8 py-5 text-sm font-bold text-slate-900 outline-none focus:bg-white transition-all placeholder:text-slate-300"
            />
          </div>
        </div>
        <div className="flex gap-4 w-full lg:w-auto">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="bg-slate-50 border border-slate-100 rounded-2xl px-8 py-5 text-sm font-bold uppercase text-slate-600 outline-none focus:bg-white transition-all cursor-pointer flex-1 lg:flex-none"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="MEDIATION">Mediation</option>
            <option value="RESOLVED">Resolved</option>
          </select>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="bg-slate-50 border border-slate-100 rounded-2xl px-8 py-5 text-sm font-bold uppercase text-slate-600 outline-none focus:bg-white transition-all cursor-pointer flex-1 lg:flex-none"
          >
            <option value="">All Categories</option>
            <option value="DAMAGE">Damage</option>
            <option value="DELAY">Delay</option>
            <option value="PAYMENT">Payment</option>
          </select>
        </div>
      </div>

      {/* Case Core */}
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden animate-slide-up">
        {disputes.length === 0 ? (
          <div className="py-48 text-center space-y-8 opacity-50">
            <AlertTriangle className="w-24 h-24 text-slate-100 mx-auto" />
            <p className="text-xs font-bold text-slate-400 uppercase">No disputes found in record core.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-10">
            {disputes.map((dispute) => (
              <div key={dispute.id} className="group bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-sm">
                        <AlertTriangle size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 uppercase italic">Case #{dispute.id.slice(0, 6)}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase mt-0.5">{dispute.category}</p>
                      </div>
                    </div>
                    <span className={`px-4 py-2 rounded-xl text-xs font-bold uppercase border ${getStatusStyle(dispute.status)}`}>
                      {dispute.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-slate-900 leading-relaxed mb-8 line-clamp-3 min-h-[3rem]">{dispute.description}</p>
                </div>

                <div className="space-y-6 pt-8 border-t border-slate-50">
                  <div className="flex justify-between items-center text-sm font-bold uppercase text-slate-400">
                    <span>Claimed Amount</span>
                    <span className="text-slate-900">{dispute.claimedAmount?.toLocaleString() || 0} KES</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setSelectedDispute(dispute)}
                      className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-sm font-bold uppercase shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                    >
                      <Eye size={14} /> Review Case
                    </button>
                    {dispute.status === 'OPEN' && (
                      <button 
                        onClick={() => handleStartMediation(dispute.id)}
                        className="py-4 px-6 bg-primary-600 text-white rounded-2xl text-sm font-bold uppercase shadow-xl hover:bg-primary-700 transition-all flex items-center justify-center"
                        title="Mediate"
                      >
                        <Gavel size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && <CreateDisputeModal onClose={() => setShowCreateModal(false)} onSubmit={handleCreateDispute} />}
      {selectedDispute && <ViewDisputeModal dispute={selectedDispute} onClose={() => { setSelectedDispute(null); setShowResolveModal(false); }} onResolve={showResolveModal ? (data) => handleResolveDispute(selectedDispute.id, data) : undefined} />}
    </div>
  );
};

const CreateDisputeModal: React.FC<{ onClose: () => void, onSubmit: (data: CreateDisputeData) => void }> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState<CreateDisputeData>({ loadId: '', disputedWithId: '', category: 'OTHER', severity: 'MEDIUM', description: '', claimedAmount: 0 });
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setSubmitting(true); await onSubmit(formData); setSubmitting(false); };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-fade-in" onClick={onClose}></div>
      <div className="relative w-full max-w-4xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        <div className="p-12 bg-slate-900 text-white flex justify-between items-center overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="space-y-2 relative z-10">
            <h2 className="text-3xl font-bold uppercase italic">Open <span className="text-white">Case</span></h2>
            <p className="text-slate-400 text-sm font-bold uppercase">Initiate professional dispute resolution protocol</p>
          </div>
          <button onClick={onClose} className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-white relative z-10 hover:bg-white hover:text-slate-900 transition-all"><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-12 md:p-16 overflow-y-auto space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
               <label className="text-sm font-bold uppercase text-slate-400 ml-4">Load Reference</label>
               <input type="text" required value={formData.loadId} onChange={(e) => setFormData({ ...formData, loadId: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-10 py-6 text-sm font-bold text-slate-900 outline-none" />
            </div>
            <div className="space-y-4">
               <label className="text-sm font-bold uppercase text-slate-400 ml-4">Disputed Party ID</label>
               <input type="text" required value={formData.disputedWithId} onChange={(e) => setFormData({ ...formData, disputedWithId: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-10 py-6 text-sm font-bold text-slate-900 outline-none" />
            </div>
          </div>
          <div className="space-y-4">
             <label className="text-sm font-bold uppercase text-slate-400 ml-4">Issue Description</label>
             <textarea required rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-10 py-6 text-sm font-bold text-slate-900 outline-none" placeholder="Provide objective details of the occurrence..." />
          </div>
          <div className="flex justify-end pt-12 border-t border-slate-100">
             <button type="submit" disabled={submitting} className="px-16 py-6 bg-slate-900 text-white rounded-[2rem] text-sm font-bold uppercase shadow-2xl hover:bg-rose-600 transition-all flex items-center gap-4">
               {submitting ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />} Open Investigation
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ViewDisputeModal: React.FC<{ dispute: BrokerDispute, onClose: () => void, onResolve?: (data: ResolveDisputeData) => void }> = ({ dispute, onClose, onResolve }) => {
  const [resolution, setResolution] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const handleResolve = async (e: React.FormEvent) => { e.preventDefault(); if (!onResolve) return; setSubmitting(true); await onResolve({ resolution, resolvedAmount: dispute.claimedAmount }); setSubmitting(false); };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-fade-in" onClick={onClose}></div>
      <div className="relative w-full max-w-4xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        <div className="p-12 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="space-y-2 relative z-10">
            <h2 className="text-3xl font-bold uppercase italic">Case <span className="text-white">Details</span></h2>
            <p className="text-slate-400 text-sm font-bold uppercase">Active investigation reference #{dispute.id.slice(0, 8)}</p>
          </div>
          <button onClick={onClose} className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all relative z-10"><X size={24} /></button>
        </div>

        <div className="p-12 md:p-16 overflow-y-auto space-y-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
             {[
               { label: 'Status', value: dispute.status.replace('_', ' '), icon: Activity },
               { label: 'Category', value: dispute.category, icon: Shield },
               { label: 'Severity', value: dispute.severity, icon: AlertTriangle },
               { label: 'Identifier', value: dispute.loadId.slice(0, 8), icon: Clock },
             ].map((meta, i) => (
               <div key={i} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:bg-white hover:shadow-2xl transition-all">
                 <meta.icon size={18} className="text-slate-300 mb-6 group-hover:text-primary-600 transition-colors" />
                 <p className="text-sm font-bold text-slate-400 uppercase mb-1">{meta.label}</p>
                 <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">{meta.value}</p>
               </div>
             ))}
          </div>

          <div className="p-10 bg-slate-900 rounded-[3rem] text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5"><MessageSquare size={120} /></div>
             <p className="text-sm font-bold text-slate-500 uppercase mb-4">Case Statement</p>
             <p className="text-lg font-bold leading-relaxed relative z-10">{dispute.description}</p>
          </div>

          {onResolve && (
            <form onSubmit={handleResolve} className="space-y-10 pt-12 border-t border-slate-100">
               <div className="space-y-4">
                  <label className="text-sm font-bold uppercase text-slate-400 ml-4">Final Resolution Protocol</label>
                  <textarea required rows={4} value={resolution} onChange={(e) => setResolution(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-10 py-6 text-sm font-bold text-slate-900 outline-none" placeholder="State the final ruling and agreement..." />
               </div>
               <div className="flex justify-end">
                  <button type="submit" disabled={submitting} className="px-16 py-6 bg-emerald-600 text-white rounded-[2rem] text-sm font-bold uppercase shadow-2xl hover:bg-emerald-700 transition-all flex items-center gap-4">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Close Case Successfully
                  </button>
               </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default DisputeResolution;
