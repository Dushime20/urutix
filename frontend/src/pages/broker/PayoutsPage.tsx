import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type BrokerCommission } from '../../services/brokerApi';
import { 
  DollarSign, 
  ArrowRight,
  Loader2,
  Wallet,
  AlertCircle,
  Plus,
  Activity,
  Zap,
  Shield,
  Clock,
  CheckCircle2,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

const PayoutsPage: React.FC = () => {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState<BrokerCommission[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<BrokerCommission | null>(null);

  useEffect(() => {
    if (user && user.role === 'BROKER') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [commResponse, requestsResponse] = await Promise.all([
        brokerAPI.getBrokerCommissions(user!.id, { status: 'APPROVED' }),
        brokerAPI.getPayoutRequests(user!.id)
      ]);

      const commData = commResponse.data || commResponse || {};
      setCommissions(Array.isArray(commData.commissions) ? commData.commissions : []);
      
      const reqData = requestsResponse.data || requestsResponse || [];
      setPayoutRequests(Array.isArray(reqData) ? reqData : []);
    } catch (err: any) {
      console.error('Failed to load payout data:', err);
      toast.error('Failed to load payout data');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommission) return;

    try {
      await brokerAPI.requestPayout(selectedCommission.id, {
        brokerId: user!.id,
        amount: selectedCommission.commissionAmount,
        currency: 'USD'
      });
      toast.success('Payout request submitted');
      setShowRequestModal(false);
      setSelectedCommission(null);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit payout request');
    }
  };

  const getStatusPrimeStyle = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'APPROVED': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'REJECTED':
      case 'CANCELLED': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-16 h-16 border-t-4 border-primary-600 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Liquidity...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 animate-fade-in pb-24 font-manrope">
      {/* Ultra-Compact Payout Header */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl flex items-center justify-between group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-600/10 rounded-full -mr-48 -mt-48 blur-[80px]"></div>
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-xl">
            <Wallet size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none mb-1">Payouts</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Liquidity Management</p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-12 mr-4 text-right">
           <div className="text-center hidden md:block">
             <p className="text-xl font-black tracking-tighter leading-none text-primary-400">${commissions.reduce((sum, c) => sum + c.commissionAmount, 0).toLocaleString()}</p>
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Available Balance</p>
           </div>
           <div className="h-10 w-px bg-white/10 mx-2 hidden md:block"></div>
           <div className="text-center hidden md:block">
             <p className="text-xl font-black tracking-tighter leading-none text-emerald-400">{payoutRequests.length}</p>
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">History Count</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Settlement Pipeline */}
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-white rounded-[3.5rem] border border-slate-100 p-10 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div> Available Yield
              </h3>
              <span className="px-4 py-2 bg-slate-50 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">{commissions.length} APPROVED</span>
            </div>

            {commissions.length === 0 ? (
              <div className="py-24 text-center space-y-6 opacity-50">
                <Zap className="w-16 h-16 text-slate-100 mx-auto" />
                <p className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">No yield records currently approved for withdrawal.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {commissions.map((comm) => (
                  <div key={comm.id} className="group/item flex items-center justify-between p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:shadow-2xl transition-all duration-500">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-primary-600 group-hover/item:bg-slate-900 group-hover/item:text-white transition-all shadow-sm">
                        <DollarSign size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 tracking-tighter uppercase italic">Load #{comm.loadId.substring(0, 8)}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{new Date(comm.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-10">
                      <div className="text-right">
                        <p className="text-2xl font-black text-slate-900 tracking-tighter">${comm.commissionAmount.toLocaleString()}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Yield Net</p>
                      </div>
                      <button onClick={() => { setSelectedCommission(comm); setShowRequestModal(true); }} className="px-8 py-4 bg-primary-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-900/10 hover:scale-105 active:scale-95 transition-all">Draw</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-[3.5rem] border border-slate-100 p-10 shadow-sm space-y-10">
             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
               <div className="w-2 h-2 bg-slate-400 rounded-full"></div> History
             </h3>
             <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Ref</th>
                      <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Value</th>
                      <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Stage</th>
                      <th className="px-8 py-5 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Logged</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {payoutRequests.map((req) => (
                      <tr key={req.id} className="group hover:bg-slate-50/50 transition-all">
                        <td className="px-8 py-6 text-xs font-black text-slate-900 uppercase italic">PAY-{req.id.substring(0, 8)}</td>
                        <td className="px-8 py-6 text-sm font-black text-slate-900">${req.amount.toLocaleString()}</td>
                        <td className="px-8 py-6">
                           <span className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${getStatusPrimeStyle(req.status)} border`}>
                             {req.status}
                           </span>
                        </td>
                        <td className="px-8 py-6 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(req.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        </div>

        {/* Sidebar Intelligence */}
        <div className="space-y-10 lg:sticky lg:top-24">
           <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5"><Zap size={100} /></div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Aggregate Balance</p>
              <h3 className="text-5xl font-black text-white tracking-tighter mb-12">
                ${commissions.reduce((sum, c) => sum + c.commissionAmount, 0).toLocaleString()}
              </h3>
              <div className="pt-8 border-t border-white/10 flex items-center justify-between">
                 <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Lifecycle</p>
                    <p className="text-xs font-bold text-primary-400">Weekly Settlements</p>
                 </div>
                 <Activity size={24} className="text-primary-500 animate-pulse" />
              </div>
           </div>

           <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm space-y-8">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                <Shield size={18} className="text-amber-500" /> Policy Terms
              </h3>
              <div className="space-y-6">
                 {[
                   'Commissions must be fully APPROVED.',
                   'Minimum draw amount: $100.00.',
                   'Cycle: 2-3 Business Days.'
                 ].map((term, i) => (
                   <div key={i} className="flex gap-4">
                      <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-amber-200 shrink-0"></div>
                      <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-tight">{term}</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Draw Transaction Modal */}
      {showRequestModal && selectedCommission && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-fade-in">
           <div className="w-full max-w-lg bg-white rounded-[3.5rem] shadow-2xl overflow-hidden animate-slide-up">
              <div className="p-10 bg-slate-900 text-white flex items-center justify-between">
                 <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter italic">Confirm <span className="text-primary-400">Draw</span></h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Authorization Phase</p>
                 </div>
                 <button onClick={() => setShowRequestModal(false)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-rose-600 transition-all"><X size={20} /></button>
              </div>
              
              <div className="p-12 space-y-10">
                 <div className="bg-slate-50 p-10 rounded-[2rem] border border-slate-100 space-y-6">
                    <div className="flex justify-between items-center text-sm font-black text-slate-400 uppercase tracking-widest">
                       <span>Yield Target</span>
                       <span className="text-slate-900">${selectedCommission.commissionAmount.toLocaleString()}</span>
                    </div>
                    <div className="h-px bg-slate-200"></div>
                    <div className="flex justify-between items-center">
                       <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Net Liquidity</span>
                       <span className="text-4xl font-black text-primary-600 tracking-tighter">${selectedCommission.commissionAmount.toLocaleString()}</span>
                    </div>
                 </div>

                 <div className="flex gap-4">
                    <button onClick={() => setShowRequestModal(false)} className="flex-1 py-6 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-slate-900 transition-all">Abort</button>
                    <button onClick={handleRequestPayout} className="flex-[2] py-6 bg-primary-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-900/20 hover:scale-105 transition-all">Authorize Draw</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PayoutsPage;
