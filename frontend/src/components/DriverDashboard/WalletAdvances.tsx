import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  DollarSign,
  ChevronDown,
  Eye,
  X
} from 'lucide-react';
import { fuelApi } from '../../services/fuelApi';
import { driverApi } from '../../services/driverApi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface WalletAdvancesProps {
  driverId: string;
}

export const WalletAdvances: React.FC<WalletAdvancesProps> = ({ driverId }) => {
  const queryClient = useQueryClient();
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<any>(null);
  
  // State for advance request
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [advanceNotes, setAdvanceNotes] = useState<string>('');
  const [tripId, setTripId] = useState<string>('');

  // Fetch wallet
  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['driver-wallet', driverId],
    queryFn: () => fuelApi.getDriverWallet(driverId),
    enabled: !!driverId,
  });

  // Fetch advances
  const { data: advances, isLoading: advancesLoading } = useQuery({
    queryKey: ['driver-advances', driverId],
    queryFn: () => fuelApi.getDriverAdvances(driverId),
    enabled: !!driverId,
  });

  // Fetch current active trip
  const { data: currentTrip } = useQuery({
    queryKey: ['driver-current-trip', driverId],
    queryFn: () => driverApi.getCurrentTrip(driverId),
    enabled: !!driverId,
  });

  // Fetch upcoming trips for the dropdown
  const { data: upcomingTrips } = useQuery({
    queryKey: ['driver-upcoming-trips', driverId],
    queryFn: () => driverApi.getUpcomingTrips(driverId),
    enabled: !!driverId,
  });

  // Combine current and upcoming trips
  const allAvailableTrips = useMemo(() => {
    const trips = [];
    if (currentTrip) trips.push(currentTrip);
    if (upcomingTrips) trips.push(...upcomingTrips);
    
    // Remove duplicates if any (though unlikely)
    return Array.from(new Map(trips.map(item => [item.id, item])).values());
  }, [currentTrip, upcomingTrips]);

  const requestAdvanceMutation = useMutation({
    mutationFn: (data: { tripId?: string, amount: number, notes: string }) => 
      fuelApi.requestAdvance(data.tripId || '', data.amount, data.notes),
    onSuccess: () => {
      toast.success('Advance request submitted successfully!');
      setShowAdvanceForm(false);
      setAdvanceAmount(0);
      setAdvanceNotes('');
      setTripId('');
      queryClient.invalidateQueries({ queryKey: ['driver-advances'] });
    },
    onError: () => {
      toast.error('Failed to submit advance request');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (advanceAmount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    requestAdvanceMutation.mutate({ tripId: tripId || undefined, amount: advanceAmount, notes: advanceNotes });
  };

  const formatCurrency = (amount: number | string) => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numericAmount || 0);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border border-emerald-100">
              Financial
            </span>
          </div>
          <h2 className="text-3xl font-black text-[#0f172a] uppercase tracking-tight">Driver Wallet</h2>
          <p className="text-slate-400 font-medium mt-1">Manage your funds, pending earnings, and cash advances</p>
        </div>

        <button 
          onClick={() => setShowAdvanceForm(true)}
          className="h-14 px-8 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-slate-900 transition-all shadow-lg active:scale-95 shadow-blue-900/10"
        >
          <DollarSign size={18} />
          Request Advance
        </button>
      </div>

      {/* Wallet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Main Balance Card - Brand Blue Foundation with Teal Accents */}
        {walletLoading ? (
            <div className="bg-[#345E85]/50 rounded-[2rem] p-8 h-48 animate-pulse border border-[#345E85]/20" />
        ) : (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative bg-gradient-to-br from-[#345E85] via-[#2a4b6d] to-[#1e3a5a] rounded-[2rem] p-6 border border-white/10 shadow-xl shadow-[#345E85]/20 overflow-hidden"
          >
            {/* Background lighting accents */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400/10 rounded-full blur-2xl -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/10 rounded-full blur-2xl -ml-12 -mb-12" />
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-teal-400 italic font-mono">{formatCurrency(wallet?.balance || 0)}</h3>
                    <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest">USD</span>
                  </div>

                </div>
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 text-white shadow-lg backdrop-blur-md">
                   <CreditCard size={24} />
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 backdrop-blur-sm group hover:bg-white/10 transition-all cursor-default">
                  <p className="text-[7px] font-black uppercase tracking-widest text-blue-300 mb-1">Weekly Earnings</p>
                  <p className="text-base font-black text-white italic tracking-tight">{formatCurrency(wallet?.weeklyEarnings || 0)}</p>
                </div>
                <div className="bg-teal-500/10 p-4 rounded-xl border border-teal-400/10 backdrop-blur-sm group hover:bg-teal-500/20 transition-all cursor-default">
                  <p className="text-[7px] font-black uppercase tracking-widest text-teal-300 mb-1">Total Paid</p>
                  <p className="text-base font-black text-teal-400 italic tracking-tight">{formatCurrency(wallet?.totalEarnings || 0)}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Secondary Stats Card - Compact */}
        <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm flex items-center gap-4 group hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Clock size={22} />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending Clearance</p>
              <h4 className="text-xl font-black text-[#0f172a] italic leading-none">{formatCurrency(wallet?.pendingAmount || 0)}</h4>
              <p className="text-[7px] font-bold uppercase text-amber-600 mt-2 tracking-widest">Est. 3-5 Days</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm flex items-center gap-4 group hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#345E85] shrink-0">
              <TrendingUp size={22} />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Utilization Rate</p>
              <h4 className="text-xl font-black text-[#0f172a] italic leading-none">84%</h4>
              <p className="text-[7px] font-bold uppercase text-emerald-500 mt-2 tracking-widest">High Efficiency</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Advance Request Modal */}
      <AnimatePresence>
        {showAdvanceForm && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowAdvanceForm(false)}
              className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] md:max-h-[90vh]"
            >
              <div className="bg-[#345E85] p-6 md:p-10 text-white shrink-0">
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight">Request Cash Advance</h3>
                <p className="text-blue-100/70 text-xs md:text-sm font-medium mt-1">Get an advance against your active load</p>
              </div>
              
              <div className="overflow-y-auto custom-scrollbar p-6 md:p-10">
                <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Link to Trip (Optional)</label>
                      <div className="relative">
                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 pointer-events-none" />
                        <select
                          className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl pl-6 pr-12 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#345E85] transition-all appearance-none"
                          value={tripId}
                          onChange={(e) => setTripId(e.target.value)}
                        >
                          <option value="">No trip linked</option>
                          {(allAvailableTrips || []).map((trip: any) => (
                            <option key={trip.id} value={trip.id}>
                              {trip.tripNumber} — {trip.origin?.city || ''} → {trip.destination?.city || ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Advance Amount ($)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 pointer-events-none" />
                        <input 
                          type="number" 
                          required
                          className="w-full h-16 md:h-20 bg-slate-50 border border-slate-100 rounded-[1.5rem] md:rounded-[2rem] pl-14 pr-6 text-2xl md:text-3xl font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#345E85] transition-all"
                          placeholder="0.00"
                          value={advanceAmount || ''}
                          onChange={(e) => setAdvanceAmount(parseFloat(e.target.value))}
                        />
                      </div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#345E85] px-2 text-right">Maximum Limit: $500.00</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Justification / Notes</label>
                      <textarea 
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 md:p-6 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#345E85] transition-all min-h-[100px]"
                        placeholder="Why do you need this advance?"
                        value={advanceNotes}
                        onChange={(e) => setAdvanceNotes(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100">
                    <button 
                      type="button" 
                      onClick={() => setShowAdvanceForm(false)}
                      className="order-2 sm:order-1 flex-1 h-16 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all font-black"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={requestAdvanceMutation.isPending}
                      className="order-1 sm:order-2 flex-[2] h-16 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-900/10 hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {requestAdvanceMutation.isPending ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Advance Request History */}
      <section>
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Advance & Transaction History</h3>
            <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
              {advances?.length || 0}
            </span>
          </div>
        </div>

        {advancesLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-24 bg-slate-50 rounded-[2rem] animate-pulse" />)}
          </div>
        ) : advances && advances.length > 0 ? (
          <div className="grid gap-4">
            {advances.map((advance: any) => (
              <div 
                key={advance.id} 
                className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-blue-100 transition-all duration-300 group"
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center ${
                      advance.type === 'DEBIT' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      {advance.type === 'DEBIT' ? <ArrowUpRight size={24} /> : <ArrowDownLeft size={24} />}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-[#0f172a] uppercase tracking-tight">{advance.description || 'Advance Request'}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Ref: {advance.id.slice(0, 8)}</p>
                    </div>
                  </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-50 justify-between sm:justify-end">
                        <div className="text-left sm:text-right">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center sm:justify-end gap-1.5">
                            <Clock size={10} />
                            Timestamp
                          </p>
                          <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">{new Date(advance.createdAt).toLocaleDateString()}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1">{new Date(advance.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
  
                        <div className="text-left sm:text-right">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Amount</p>
                          <p className={`text-xl font-black tracking-tight ${advance.type === 'DEBIT' ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {advance.type === 'DEBIT' ? '-' : '+'}{formatCurrency(advance.amount || advance.advanceAmount)}
                          </p>
                          <div className="mt-2 flex sm:justify-end items-center gap-3">
                            <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${
                              advance.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              advance.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                              'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                              {advance.status === 'APPROVED' ? <CheckCircle size={10} /> : 
                               advance.status === 'REJECTED' ? <AlertCircle size={10} /> : 
                               <Clock size={10} />}
                              {advance.status}
                            </div>
                            <button 
                              onClick={() => {
                                setSelectedAdvance(advance);
                                setShowDetailsModal(true);
                              }}
                              className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#345E85] hover:bg-white hover:border-[#345E85]/30 transition-all shadow-sm"
                              title="View Details"
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        </div>
                      </div>

                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] border border-dashed border-slate-200 p-20 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <CreditCard className="text-slate-300" size={32} />
            </div>
            <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">No Transactions</h4>
            <p className="text-sm font-medium text-slate-400 mt-1">Your wallet activity and advances will be visible here</p>
          </div>
        )}
      </section>

      {/* Advance Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedAdvance && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailsModal(false)}
              className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
            >
              <div className="bg-slate-50 p-6 md:p-10 flex items-center justify-between border-b border-slate-100 shrink-0">
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-[#0f172a] uppercase tracking-tight">Request Details</h3>
                  <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">Ref: {selectedAdvance.id}</p>
                </div>
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-600 transition-all hover:shadow-lg"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="overflow-y-auto custom-scrollbar p-6 md:p-10 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                      <div className={`inline-flex px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border items-center gap-1.5 ${
                        selectedAdvance.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        selectedAdvance.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                        'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                         {selectedAdvance.status}
                      </div>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Type</p>
                      <p className="text-xs font-black text-[#0f172a] uppercase">{selectedAdvance.type}</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-dashed border-slate-100">
                   <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Date & Time</p>
                      <p className="text-xs font-bold text-slate-700">
                        {new Date(selectedAdvance.createdAt).toLocaleDateString()} at {new Date(selectedAdvance.createdAt).toLocaleTimeString()}
                      </p>
                   </div>
                   {selectedAdvance.tripId && (
                     <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Linked Trip</p>
                        <p className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">Ref: {selectedAdvance.tripId.slice(0, 8)}</p>
                     </div>
                   )}
                </div>

                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">Amount Requested</p>
                   <p className="text-3xl font-black text-[#0f172a] tracking-tight">{formatCurrency(selectedAdvance.amount || selectedAdvance.advanceAmount)}</p>
                </div>

                <div className="space-y-3">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Reasoning / Justification</p>
                   <div className="p-5 bg-white border border-slate-100 rounded-2xl text-xs font-medium text-slate-600 italic leading-relaxed">
                      "{selectedAdvance.notes || 'No justification provided.'}"
                   </div>
                </div>
              </div>

              <div className="p-6 md:p-10 pt-0 shrink-0">
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="w-full h-16 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-[0.98]"
                >
                  Close Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
