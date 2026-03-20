import React, { useState, useEffect } from 'react';
import { brokerAPI, type TransporterCredit, type UpdatePaymentTermsData } from '../../services/brokerApi';
import { CreditCard, Search, CheckCircle2, XCircle, AlertTriangle, Loader2, DollarSign, TrendingUp, Shield, Activity, Clock, FileText, X } from 'lucide-react';
import toast from 'react-hot-toast';

const CreditManagement: React.FC = () => {
  const [credits, setCredits] = useState<TransporterCredit[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTransporter, setSelectedTransporter] = useState('');
  const [selectedCredit, setSelectedCredit] = useState<TransporterCredit | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    fetchCreditRecords();
  }, []);

  const fetchCreditRecords = async () => {
    setLoading(true);
    try {
      const response = await brokerAPI.getCreditRecords();
      setCredits(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch credit records');
    } finally {
      setLoading(false);
    }
  };

  const handleCreditCheck = async () => {
    if (!selectedTransporter) {
      toast.error('Please enter a Transporter ID');
      return;
    }

    setLoading(true);
    try {
      await brokerAPI.performCreditCheck(selectedTransporter);
      toast.success('Credit check completed');
      fetchCreditRecords();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to perform credit check');
    } finally {
      setLoading(false);
    }
  };

  const getStatusPrimeStyle = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'PENDING':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'REJECTED':
      case 'SUSPENDED':
        return 'bg-rose-50 text-rose-600 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return 'text-emerald-600';
      case 'MEDIUM':
        return 'text-amber-600';
      case 'HIGH':
        return 'text-rose-600';
      default:
        return 'text-slate-600';
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 animate-fade-in pb-24 font-manrope">
      {/* Ultra-Compact Credit Header */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl flex items-center justify-between group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-600/10 rounded-full -mr-48 -mt-48 blur-[80px]"></div>
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-xl">
            <CreditCard size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none mb-1">Risk & Credit</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Financial Oversight Centre</p>
          </div>
        </div>

        <div className="relative z-10 hidden md:flex items-center gap-12 mr-4 text-white">
          <div className="text-center">
            <p className="text-xl font-black tracking-tighter leading-none">{credits.length}</p>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Records</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black tracking-tighter leading-none text-emerald-400">{credits.filter(c => c.status === 'APPROVED').length}</p>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Approved</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black tracking-tighter leading-none text-rose-400">{credits.filter(c => c.status === 'REJECTED' || c.status === 'SUSPENDED').length}</p>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Risky</p>
          </div>
        </div>
      </div>

      {/* Terminal Grid Search */}
      <div className="bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm flex flex-col lg:flex-row gap-8 items-end relative group overflow-hidden">
        <div className="flex-1 space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Analyze Specific Carrier</label>
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-600 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Enter Carrier ID (e.g. CAR-777)..."
              value={selectedTransporter}
              onChange={(e) => setSelectedTransporter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-50 rounded-2xl pl-16 pr-8 py-5 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:shadow-xl transition-all placeholder:text-slate-300"
            />
          </div>
        </div>
        <button
          onClick={handleCreditCheck}
          disabled={loading}
          className="px-12 py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 disabled:opacity-50 transition-all flex items-center gap-3 shadow-xl h-[64px]"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
          Run Credit Audit
        </button>
      </div>

      {/* Data Core */}
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden animate-slide-up">
        <div className="p-8 border-b border-slate-50">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Credit Health Index</h3>
        </div>

        {loading ? (
          <div className="py-32 text-center space-y-6">
            <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Querying Credit Registry...</p>
          </div>
        ) : credits.length === 0 ? (
          <div className="py-48 text-center space-y-8 opacity-50">
            <CreditCard className="w-24 h-24 text-slate-100 mx-auto" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No credit profiles found in audit history.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-10">
            {credits.map((credit) => (
              <div key={credit.id} className="group bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                      <Activity size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 tracking-tighter uppercase italic">#{credit.id.slice(0, 6)}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest-mt-0.5">{credit.transporterId.slice(0, 10)}</p>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${getStatusPrimeStyle(credit.status)}`}>
                    {credit.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8 pt-8 border-t border-slate-50">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Limit</p>
                    <p className="text-lg font-black text-slate-900">{credit.creditLimit.toLocaleString()} <span className="text-[10px] text-slate-300 font-bold uppercase">KES</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Balance</p>
                    <p className="text-lg font-black text-primary-600">{credit.currentBalance.toLocaleString()}</p>
                  </div>
                </div>

                {credit.creditCheck && (
                  <div className="mb-8 p-6 bg-slate-50 rounded-2xl relative">
                    <div className="flex justify-between items-center mb-2">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score Index</p>
                       <span className={`text-xl font-black ${getRiskColor(credit.creditCheck.riskLevel)}`}>{credit.creditCheck.creditScore}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                       <div className={`h-full bg-current transition-all ${getRiskColor(credit.creditCheck.riskLevel)}`} style={{ width: `${(credit.creditCheck.creditScore / 850) * 100}%` }}></div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => { setSelectedCredit(credit); setShowUpdateModal(true); }}
                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                  >
                    <TrendingUp size={14} /> Adjust Terms
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showUpdateModal && selectedCredit && (
        <UpdatePaymentTermsModal
          credit={selectedCredit}
          onClose={() => { setShowUpdateModal(false); setSelectedCredit(null); }}
          onUpdate={fetchCreditRecords}
        />
      )}
    </div>
  );
};

const UpdatePaymentTermsModal: React.FC<{
  credit: TransporterCredit;
  onClose: () => void;
  onUpdate: () => void;
}> = ({ credit, onUpdate, onClose }) => {
  const [formData, setFormData] = useState<UpdatePaymentTermsData>({
    paymentTerms: credit.paymentTerms,
    customPaymentDays: credit.customPaymentDays,
    creditLimit: credit.creditLimit,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await brokerAPI.updatePaymentTerms(credit.id, formData);
      toast.success('Terms authorized successfully');
      onUpdate();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update payment terms');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-fade-in" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-slide-up">
        <div className="p-12 bg-slate-900 text-white flex justify-between items-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter">Adjust <span className="text-white">Terms</span></h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Update carrier financial trust protocol</p>
          </div>
          <button onClick={onClose} className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-white"><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-12 space-y-10">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Payment Cycle</label>
            <select
              value={formData.paymentTerms}
              onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value as any })}
              className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-10 py-6 text-sm font-bold text-slate-900 outline-none"
            >
              <option value="NET_15">Net 15 Days</option>
              <option value="NET_30">Net 30 Days</option>
              <option value="NET_45">Net 45 Days</option>
              <option value="DUE_ON_RECEIPT">Real-time Settlement</option>
              <option value="CUSTOM">Manual Rule</option>
            </select>
          </div>
          
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Authorized Limit (KES)</label>
            <input
              type="number"
              value={formData.creditLimit || ''}
              onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || undefined })}
              className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-10 py-6 text-2xl font-black text-slate-900 outline-none"
            />
          </div>

          <button type="submit" disabled={submitting} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-primary-600 transition-all flex items-center justify-center gap-4">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />} Authorize Adjustments
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreditManagement;
