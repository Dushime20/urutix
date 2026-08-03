import { DashboardSkeleton } from '../../components/common/LoadingSkeletons';
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type BrokerCommission } from '../../services/brokerApi';
import { 
  DollarSign, 
  Wallet,
  Zap,
  Shield,
  Activity,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { StandardDataTable, StatusBadge, type Column } from '../../components/EnliteUI/Tables';

const PayoutsPage: React.FC = () => {
  const { format: fmtFull, compact: fmtMoney } = useCurrencyFormat();
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
        currency: user?.preferredCurrency || 'USD'
      });
      toast.success('Payout request submitted');
      setShowRequestModal(false);
      setSelectedCommission(null);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit payout request');
    }
  };

  const payoutColumns: Column<any>[] = useMemo(() => [
    {
      key: 'id',
      label: 'Ref',
      render: (_v, row) => (
        <span className="text-xs font-bold text-slate-900 uppercase italic dark:text-white">
          PAY-{row.id.substring(0, 8)}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Value',
      sortable: true,
      render: (_v, row) => (
        <span className="text-sm font-bold text-slate-900 dark:text-white">{fmtFull(row.amount)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Stage',
      sortable: true,
      render: (_v, row) => <StatusBadge status={row.status} label={row.status} />,
    },
    {
      key: 'createdAt',
      label: 'Logged',
      sortable: true,
      align: 'right',
      render: (_v, row) => (
        <span className="text-xs font-bold text-slate-400 uppercase">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ], [fmtFull]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 animate-fade-in pb-24">
      {/* Ultra-Compact Payout Header */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-slate-100/60 dark:bg-primary-600/10 rounded-full -mr-48 -mt-48 blur-[80px]"></div>
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-[#345E85]/10 dark:bg-white/10 border border-[#345E85]/20 dark:border-white/20 flex items-center justify-center">
            <Wallet size={24} className="text-[#345E85] dark:text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none mb-1 text-slate-900 dark:text-white">Payouts</h1>
            <p className="text-slate-400 text-sm font-bold uppercase">Liquidity Management</p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-12 mr-4 text-right">
           <div className="text-center hidden md:block">
             <p className="text-xl font-bold leading-none text-primary-400">{fmtMoney(commissions.reduce((sum, c) => sum + c.commissionAmount, 0))}</p>
             <p className="text-xs font-bold text-slate-500 uppercase mt-0.5 dark:text-slate-400">Available Balance</p>
           </div>
           <div className="h-10 w-px bg-white/10 mx-2 hidden md:block"></div>
           <div className="text-center hidden md:block">
             <p className="text-xl font-bold leading-none text-emerald-400">{payoutRequests.length}</p>
             <p className="text-xs font-bold text-slate-500 uppercase mt-0.5 dark:text-slate-400">History Count</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Settlement Pipeline */}
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-white rounded-[3.5rem] border border-slate-100 p-10 shadow-sm relative overflow-hidden group dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-3 dark:text-white">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div> Available Yield
              </h3>
              <span className="px-4 py-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-400 uppercase border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">{commissions.length} APPROVED</span>
            </div>

            {commissions.length === 0 ? (
              <div className="py-24 text-center space-y-6 opacity-50">
                <Zap className="w-16 h-16 text-slate-100 mx-auto" />
                <p className="text-xs font-bold text-slate-300 uppercase tracking-[0.3em]">No yield records currently approved for withdrawal.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {commissions.map((comm) => (
                  <div key={comm.id} className="group/item flex items-center justify-between p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:shadow-2xl transition-all duration-500 dark:bg-slate-800/50 dark:border-slate-800">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-primary-600 group-hover/item:bg-slate-900 group-hover/item:text-white transition-all shadow-sm dark:bg-slate-900 dark:border-slate-800">
                        <DollarSign size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 uppercase italic dark:text-white">Load #{comm.loadId.substring(0, 8)}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase mt-0.5">{new Date(comm.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-10">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{fmtFull(comm.commissionAmount)}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase">Yield Net</p>
                      </div>
                      <button onClick={() => { setSelectedCommission(comm); setShowRequestModal(true); }} className="px-8 py-4 bg-primary-600 text-white rounded-2xl text-sm font-bold uppercase shadow-xl shadow-primary-900/10 hover:scale-105 active:scale-95 transition-all">Draw</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-[3.5rem] border border-slate-100 p-10 shadow-sm space-y-6 dark:bg-slate-900 dark:border-slate-800">
             <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-3 dark:text-white">
               <div className="w-2 h-2 bg-slate-400 rounded-full"></div> History
             </h3>
             <StandardDataTable
               columns={payoutColumns}
               data={payoutRequests}
               getRowId={(row) => row.id}
               searchPlaceholder="Search payouts..."
               searchKeys={['id', 'status', 'amount']}
               emptyMessage="No payout history yet"
               ariaLabel="Payout history"
               embedded
             />
          </div>
        </div>

        {/* Sidebar Intelligence */}
        <div className="space-y-10 lg:sticky lg:top-24">
           <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group dark:bg-slate-950">
              <div className="absolute top-0 right-0 p-8 opacity-5"><Zap size={100} /></div>
              <p className="text-sm font-bold text-slate-500 uppercase mb-6 dark:text-slate-400">Aggregate Balance</p>
              <h3 className="text-5xl font-bold text-white mb-12">
                {fmtMoney(commissions.reduce((sum, c) => sum + c.commissionAmount, 0))}
              </h3>
              <div className="pt-8 border-t border-white/10 flex items-center justify-between">
                 <div>
                    <p className="text-xs font-bold text-slate-500 uppercase dark:text-slate-400">Lifecycle</p>
                    <p className="text-xs font-bold text-primary-400">Weekly Settlements</p>
                 </div>
                 <Activity size={24} className="text-primary-500 animate-pulse" />
              </div>
           </div>

           <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm space-y-8 dark:bg-slate-900 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-3 dark:text-white">
                <Shield size={18} className="text-amber-500" /> Policy Terms
              </h3>
              <div className="space-y-6">
                 {[
                   'Commissions must be fully APPROVED.',
                   `Minimum draw amount: ${fmtFull(100)}.`,
                   'Cycle: 2-3 Business Days.'
                 ].map((term, i) => (
                   <div key={i} className="flex gap-4">
                      <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-amber-200 shrink-0"></div>
                      <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-tight dark:text-slate-400">{term}</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Draw Transaction Modal */}
      {showRequestModal && selectedCommission && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-fade-in">
           <div className="w-full max-w-lg bg-white rounded-[3.5rem] shadow-2xl overflow-hidden animate-slide-up dark:bg-slate-900">
              <div className="p-10 bg-slate-900 text-white flex items-center justify-between dark:bg-slate-950">
                 <div>
                    <h2 className="text-2xl font-bold uppercase italic">Confirm <span className="text-primary-400">Draw</span></h2>
                    <p className="text-sm font-bold text-slate-500 uppercase mt-1 dark:text-slate-400">Authorization Phase</p>
                 </div>
                 <button onClick={() => setShowRequestModal(false)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-rose-600 transition-all"><X size={20} /></button>
              </div>
              
              <div className="p-12 space-y-10">
                 <div className="bg-slate-50 p-10 rounded-[2rem] border border-slate-100 space-y-6 dark:bg-slate-800/50 dark:border-slate-800">
                    <div className="flex justify-between items-center text-sm font-bold text-slate-400 uppercase">
                       <span>Yield Target</span>
                       <span className="text-slate-900 dark:text-white">{fmtFull(selectedCommission.commissionAmount)}</span>
                    </div>
                    <div className="h-px bg-slate-200"></div>
                    <div className="flex justify-between items-center">
                       <span className="text-sm font-bold text-slate-900 uppercase dark:text-white">Net Liquidity</span>
                       <span className="text-4xl font-bold text-primary-600">{fmtFull(selectedCommission.commissionAmount)}</span>
                    </div>
                 </div>

                 <div className="flex gap-4">
                    <button onClick={() => setShowRequestModal(false)} className="flex-1 py-6 bg-slate-50 text-slate-400 rounded-2xl text-sm font-bold uppercase hover:text-slate-900 transition-all dark:bg-slate-800/50">Abort</button>
                    <button onClick={handleRequestPayout} className="flex-[2] py-6 bg-primary-600 text-white rounded-2xl text-sm font-bold uppercase shadow-xl shadow-primary-900/20 hover:scale-105 transition-all">Authorize Draw</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PayoutsPage;
