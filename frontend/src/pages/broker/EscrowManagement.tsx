import { DashboardSkeleton } from '../../components/common/LoadingSkeletons';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type EscrowAccount, type CreateEscrowData, type FundEscrowData, type ReleaseEscrowData } from '../../services/brokerApi';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { Wallet, Plus, Search, DollarSign, Clock, Loader2, Eye, ArrowUpCircle, ArrowDownCircle, Shield, Activity, X } from 'lucide-react';
import toast from 'react-hot-toast';

const EscrowManagement: React.FC = () => {
  const { user } = useAuth();
  const { formatIn } = useCurrencyFormat();
  const [escrows, setEscrows] = useState<EscrowAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowAccount | null>(null);
  const [showFundModal, setShowFundModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });

  useEffect(() => {
    if (user && user.role === 'BROKER') {
      fetchEscrows();
    }
  }, [user, filters.status]);

  const fetchEscrows = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await brokerAPI.getEscrows({
        status: filters.status || undefined,
      });
      const escrowsData = response.data || response || [];
      setEscrows(Array.isArray(escrowsData) ? escrowsData : []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch escrow accounts');
      setEscrows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEscrow = async (data: CreateEscrowData) => {
    try {
      await brokerAPI.createEscrow(data);
      toast.success('Escrow account created successfully');
      setShowCreateModal(false);
      fetchEscrows();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create escrow account');
    }
  };

  const handleFundEscrow = async (escrowId: string, data: FundEscrowData) => {
    try {
      await brokerAPI.fundEscrow(escrowId, data);
      toast.success('Escrow funded successfully');
      setShowFundModal(false);
      setSelectedEscrow(null);
      fetchEscrows();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fund escrow');
    }
  };

  const handleReleaseEscrow = async (escrowId: string, data: ReleaseEscrowData) => {
    try {
      await brokerAPI.releaseEscrow(escrowId, data);
      toast.success('Funds released successfully');
      setShowReleaseModal(false);
      setSelectedEscrow(null);
      fetchEscrows();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to release funds');
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'FUNDED':
      case 'RELEASED':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'PARTIALLY_RELEASED':
        return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'PENDING':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'DISPUTED':
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-600 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  if (loading && escrows.length === 0) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 animate-fade-in pb-24">
      {/* Ultra-Compact Payments Header */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-slate-100/60 dark:bg-primary-600/10 rounded-full -mr-48 -mt-48 blur-[80px]"></div>
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-[#345E85]/10 dark:bg-white/10 border border-[#345E85]/20 dark:border-white/20 flex items-center justify-center">
            <Wallet size={24} className="text-[#345E85] dark:text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none mb-1 text-slate-900 dark:text-white">Escrow</h1>
            <p className="text-slate-400 text-sm font-bold uppercase">Payments & Settlements</p>
          </div>
        </div>

        <div className="relative z-10 hidden md:flex items-center gap-12 mr-4">
          <div className="text-center">
            <p className="text-xl font-bold leading-none text-white">{escrows.length}</p>
            <p className="text-xs font-bold text-slate-500 uppercase mt-0.5 dark:text-slate-400">Accounts</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold leading-none text-primary-400">{escrows.reduce((sum, e) => sum + (e.fundedAmount || 0), 0).toLocaleString()}</p>
            <p className="text-xs font-bold text-slate-500 uppercase mt-0.5 dark:text-slate-400">Funded</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-600 hover:bg-primary-500 text-white font-bold uppercase px-8 py-2.5 rounded-xl shadow-xl shadow-primary-900/20 active:scale-95 transition-all flex items-center gap-2 text-sm"
          >
            <Plus size={14} /> Create Escrow
          </button>
        </div>
      </div>

      {/* Terminal Grid */}
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden animate-slide-up dark:bg-slate-900 dark:border-slate-800">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6 dark:border-slate-800/50">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-600 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Filter Accounts..."
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-8 py-4 text-xs font-bold text-slate-900 placeholder:text-slate-300 outline-none focus:bg-white focus:border-primary-100 transition-all dark:bg-slate-800/50 dark:text-white dark:border-slate-800"
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="bg-slate-50 border border-slate-100 rounded-2xl px-8 py-4 text-sm font-bold uppercase text-slate-600 outline-none focus:bg-white transition-all cursor-pointer flex-1 md:flex-none dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-800"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="FUNDED">Funded</option>
              <option value="RELEASED">Released</option>
              <option value="DISPUTED">Disputed</option>
            </select>
          </div>
        </div>

        {escrows.length === 0 ? (
          <div className="p-32 text-center space-y-8">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200 dark:bg-slate-800/50">
              <Wallet size={48} />
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900 uppercase dark:text-white">No Accounts Found</h3>
              <p className="text-xs font-semibold text-slate-400 uppercase leading-relaxed max-w-xs mx-auto">You have not created any escrow accounts yet.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-10">
            {escrows.map((escrow) => (
              <div key={escrow.id} className="group bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 relative overflow-hidden dark:bg-slate-900 dark:border-slate-800">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-600 group-hover:text-white transition-all dark:bg-slate-800/50">
                      <Activity size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 uppercase italic dark:text-white">#{escrow.id.slice(0, 8)}</p>
                      <p className="text-sm font-bold text-slate-400 uppercase mt-0.5">Load ID: {escrow.loadId.slice(0, 8)}</p>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-xl text-xs font-bold uppercase border ${getStatusStyle(escrow.status)}`}>
                    {escrow.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8 pt-8 border-t border-slate-50 dark:border-slate-800/50">
                  <div>
                    <p className="text-sm font-bold text-slate-400 uppercase mb-1">Total</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{formatIn(escrow.totalAmount, escrow.currencyCode)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-400 uppercase mb-1">Funded</p>
                    <p className="text-lg font-bold text-emerald-600">{formatIn(escrow.fundedAmount, escrow.currencyCode)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setSelectedEscrow(escrow)}
                    className="flex-1 px-6 py-4 bg-slate-50 text-slate-900 rounded-2xl text-sm font-bold uppercase hover:bg-slate-900 hover:text-white transition-all border border-slate-100 flex items-center justify-center gap-2 dark:bg-slate-800/50 dark:text-white dark:border-slate-800"
                  >
                    <Eye size={14} /> Details
                  </button>
                  {escrow.status === 'PENDING' && (
                    <button 
                      onClick={() => { setSelectedEscrow(escrow); setShowFundModal(true); }}
                      className="px-6 py-4 bg-emerald-600 text-white rounded-2xl text-sm font-bold uppercase shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                    >
                      <ArrowDownCircle size={14} /> Fund
                    </button>
                  )}
                  {(escrow.status === 'FUNDED' || escrow.status === 'PARTIALLY_RELEASED') && (
                    <button 
                      onClick={() => { setSelectedEscrow(escrow); setShowReleaseModal(true); }}
                      className="px-6 py-4 bg-primary-600 text-white rounded-2xl text-sm font-bold uppercase shadow-xl hover:bg-primary-700 transition-all flex items-center justify-center gap-2"
                    >
                      <ArrowUpCircle size={14} /> Release
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && <CreateEscrowModal onClose={() => setShowCreateModal(false)} onSubmit={handleCreateEscrow} />}
      {showFundModal && selectedEscrow && <FundEscrowModal escrow={selectedEscrow} onClose={() => { setShowFundModal(false); setSelectedEscrow(null); }} onSubmit={(data) => handleFundEscrow(selectedEscrow.id, data)} />}
      {showReleaseModal && selectedEscrow && <ReleaseEscrowModal escrow={selectedEscrow} onClose={() => { setShowReleaseModal(false); setSelectedEscrow(null); }} onSubmit={(data) => handleReleaseEscrow(selectedEscrow.id, data)} />}
      {selectedEscrow && !showFundModal && !showReleaseModal && <ViewEscrowModal escrow={selectedEscrow} onClose={() => setSelectedEscrow(null)} />}
    </div>
  );
};

const CreateEscrowModal: React.FC<{ onClose: () => void, onSubmit: (data: CreateEscrowData) => void }> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState<CreateEscrowData>({
    loadId: '',
    payerId: '',
    payeeId: '',
    totalAmount: 0,
    commissionAmount: 0,
    currencyCode: 'KES',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(formData);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-fade-in" onClick={onClose}></div>
      <div className="relative w-full max-w-4xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh] dark:bg-slate-900">
        <div className="p-12 border-b border-white/5 flex items-center justify-between bg-slate-900 text-white shadow-2xl dark:bg-slate-950">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold uppercase italic">Create <span className="text-white">Escrow</span></h2>
            <p className="text-slate-400 text-sm font-bold uppercase">Setup a secure payment settlement account</p>
          </div>
          <button onClick={onClose} className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-12 md:p-16 overflow-y-auto space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-400 uppercase ml-4">Load Reference</label>
              <input
                type="text"
                required
                value={formData.loadId}
                onChange={(e) => setFormData({ ...formData, loadId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-10 py-6 text-sm font-bold tracking-tight text-slate-900 focus:bg-white focus:border-primary-600 outline-none transition-all dark:bg-slate-800/50 dark:text-white dark:border-slate-800"
                placeholder="LOAD_Reference"
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-400 uppercase ml-4">Payer ID</label>
                <input type="text" required value={formData.payerId} onChange={(e) => setFormData({ ...formData, payerId: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-6 text-sm font-bold text-slate-900 outline-none dark:bg-slate-800/50 dark:text-white dark:border-slate-800" />
              </div>
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-400 uppercase ml-4">Payee ID</label>
                <input type="text" required value={formData.payeeId} onChange={(e) => setFormData({ ...formData, payeeId: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-6 text-sm font-bold text-slate-900 outline-none dark:bg-slate-800/50 dark:text-white dark:border-slate-800" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-400 uppercase ml-4">Total Amount (KES)</label>
              <input type="number" required value={formData.totalAmount || ''} onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) })} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-10 py-6 text-xl font-bold text-slate-900 outline-none dark:bg-slate-800/50 dark:text-white dark:border-slate-800" />
            </div>
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-400 uppercase ml-4">Commission</label>
              <input type="number" required value={formData.commissionAmount || ''} onChange={(e) => setFormData({ ...formData, commissionAmount: parseFloat(e.target.value) })} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-10 py-6 text-xl font-bold text-primary-600 outline-none dark:bg-slate-800/50 dark:border-slate-800" />
            </div>
          </div>

          <div className="flex justify-end gap-6 pt-12 border-t border-slate-50 dark:border-slate-800/50">
            <button type="button" onClick={onClose} className="px-12 py-6 text-sm font-bold uppercase text-slate-400 hover:text-slate-900 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-16 py-6 bg-slate-900 text-white rounded-[2rem] text-sm font-bold uppercase shadow-2xl hover:bg-primary-600 transition-all flex items-center gap-4 dark:bg-slate-950">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
              Create Escrow
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ViewEscrowModal: React.FC<{ escrow: EscrowAccount, onClose: () => void }> = ({ escrow, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-fade-in" onClick={onClose}></div>
      <div className="relative w-full max-w-5xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh] dark:bg-slate-900">
        <div className="p-12 border-b border-white/5 flex items-center justify-between bg-slate-900 text-white shadow-2xl dark:bg-slate-950">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold uppercase italic">Escrow <span className="text-white">Details</span></h2>
            <p className="text-slate-400 text-sm font-bold uppercase">Settlement account reference #{escrow.id.slice(0, 8)}</p>
          </div>
          <button onClick={onClose} className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="p-12 md:p-16 overflow-y-auto space-y-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: 'Total Volume', value: `${escrow.totalAmount.toLocaleString()} ${escrow.currencyCode}`, icon: DollarSign },
              { label: 'Funded', value: `${escrow.fundedAmount.toLocaleString()}`, icon: ArrowDownCircle },
              { label: 'Released', value: `${escrow.releasedAmount.toLocaleString()}`, icon: ArrowUpCircle },
              { label: 'Status', value: escrow.status.replace('_', ' '), icon: Shield },
            ].map((meta, i) => (
              <div key={i} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 group hover:bg-white hover:shadow-2xl transition-all dark:bg-slate-800/50 dark:border-slate-800">
                <meta.icon size={20} className="text-slate-300 mb-6 group-hover:text-primary-600 transition-colors" />
                <p className="text-sm font-bold text-slate-400 uppercase mb-1">{meta.label}</p>
                <p className="text-sm font-bold text-slate-900 uppercase tracking-tight dark:text-white">{meta.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8 border-t border-slate-50 dark:border-slate-800/50">
            <div className="space-y-8">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-[0.4em] ml-4">Account Context</h4>
              <div className="bg-slate-900 rounded-[2.5rem] p-10 space-y-8 text-white relative overflow-hidden dark:bg-slate-950">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/20 rounded-full blur-xl -mr-16 -mt-16"></div>
                <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <span className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400">Payer ID</span>
                    <span className="text-sm font-bold text-white uppercase italic">{escrow.payerId}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <span className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400">Payee ID</span>
                    <span className="text-sm font-bold text-emerald-400 uppercase italic">{escrow.payeeId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400">Commission</span>
                    <span className="text-sm font-bold text-primary-400">{escrow.commissionAmount.toLocaleString()} {escrow.currencyCode}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-[0.4em] ml-4">Release History</h4>
              <div className="bg-slate-50 rounded-[2.5rem] p-8 space-y-4 border border-slate-100 max-h-[300px] overflow-y-auto custom-scrollbar dark:bg-slate-800/50 dark:border-slate-800">
                {escrow.releaseHistory && escrow.releaseHistory.length > 0 ? escrow.releaseHistory.map((release, idx) => (
                  <div key={idx} className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center dark:bg-slate-900 dark:border-slate-800">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{release.amount.toLocaleString()} {escrow.currencyCode}</p>
                      <p className="text-xs font-bold text-slate-400 uppercase mt-1">{new Date(release.timestamp).toLocaleDateString()}</p>
                    </div>
                    <span className="text-sm font-bold text-primary-600 uppercase">{release.trigger.replace('_', ' ')}</span>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Clock size={32} className="mb-3 opacity-20" />
                    <p className="text-sm font-bold uppercase">No releases recorded</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-10 bg-slate-900 flex items-center justify-end gap-6 dark:bg-slate-950">
          <button onClick={onClose} className="px-12 py-6 bg-white/10 text-white rounded-[2rem] text-sm font-bold uppercase hover:bg-white/20 transition-all">Close Account View</button>
        </div>
      </div>
    </div>
  );
};

const FundEscrowModal: React.FC<{ escrow: EscrowAccount, onClose: () => void, onSubmit: (data: FundEscrowData) => void }> = ({ escrow, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<FundEscrowData>({ amount: escrow.totalAmount - escrow.fundedAmount, paymentMethod: 'Bank Transfer', paymentReference: '' });
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setSubmitting(true); await onSubmit(formData); setSubmitting(false); };
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 md:p-12">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-fade-in" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-slide-up dark:bg-slate-900">
        <div className="p-12 bg-slate-900 text-white flex justify-between items-center dark:bg-slate-950">
          <h2 className="text-3xl font-bold uppercase italic">Fund <span className="text-white">Escrow</span></h2>
          <button onClick={onClose} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-12 space-y-10">
          <div className="space-y-4">
            <label className="text-sm font-bold uppercase text-slate-400 ml-4">Funding Amount</label>
            <input type="number" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-10 py-6 text-2xl font-bold text-slate-900 outline-none dark:bg-slate-800/50 dark:text-white dark:border-slate-800" />
          </div>
          <div className="space-y-4">
            <label className="text-sm font-bold uppercase text-slate-400 ml-4">Payment Reference</label>
            <input type="text" required value={formData.paymentReference} onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-10 py-6 text-sm font-bold text-slate-900 outline-none dark:bg-slate-800/50 dark:text-white dark:border-slate-800" placeholder="TRANS_REFERENCE" />
          </div>
          <button type="submit" disabled={submitting} className="w-full py-6 bg-emerald-600 text-white rounded-[2rem] text-sm font-bold uppercase shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-4">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowDownCircle size={16} />} Authorize Funding
          </button>
        </form>
      </div>
    </div>
  );
};

const ReleaseEscrowModal: React.FC<{ escrow: EscrowAccount, onClose: () => void, onSubmit: (data: ReleaseEscrowData) => void }> = ({ escrow, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<ReleaseEscrowData>({ amount: escrow.fundedAmount - escrow.releasedAmount, trigger: 'DELIVERY_CONFIRMED' });
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setSubmitting(true); await onSubmit(formData); setSubmitting(false); };
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 md:p-12">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-fade-in" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-slide-up dark:bg-slate-900">
        <div className="p-12 bg-slate-900 text-white flex justify-between items-center dark:bg-slate-950">
          <h2 className="text-3xl font-bold uppercase italic">Release <span className="text-white">Funds</span></h2>
          <button onClick={onClose} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-12 space-y-10">
          <div className="space-y-4">
            <label className="text-sm font-bold uppercase text-slate-400 ml-4">Release Amount</label>
            <input type="number" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-10 py-6 text-2xl font-bold text-slate-900 outline-none dark:bg-slate-800/50 dark:text-white dark:border-slate-800" />
          </div>
          <button type="submit" disabled={submitting} className="w-full py-6 bg-primary-600 text-white rounded-[2rem] text-sm font-bold uppercase shadow-xl hover:bg-primary-700 transition-all flex items-center justify-center gap-4">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowUpCircle size={16} />} Authorize Release
          </button>
        </form>
      </div>
    </div>
  );
};

export default EscrowManagement;
