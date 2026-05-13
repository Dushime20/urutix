import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  User,
  Truck,
  Route,
  RefreshCw,
} from 'lucide-react';
import { FaTimes, FaShieldAlt } from 'react-icons/fa';
import { fuelApi } from '../../services/fuelApi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';

type FilterStatus = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'RECONCILED';

const DriverAdvanceRequestsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('PENDING');
  const [selectedAdvance, setSelectedAdvance] = useState<any>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [advanceToReject, setAdvanceToReject] = useState<any>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [advanceToApprove, setAdvanceToApprove] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile_money'>('card');
  const [paymentData, setPaymentData] = useState({
    cardNumber: '', cardName: '', expiryDate: '', cvv: '',
    phoneNumber: '', mobileProvider: 'mtn',
  });

  const { data: advances, isLoading } = useQuery({
    queryKey: ['fleet-driver-advances'],
    queryFn: () => fuelApi.getAllAdvancesForMyDrivers(),
    refetchInterval: 30000,
  });

  const { data: stats } = useQuery({
    queryKey: ['fleet-advance-stats'],
    queryFn: () => fuelApi.getAdvanceStats(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => fuelApi.approveAdvance(id),
    onSuccess: () => {
      toast.success('Advance approved — driver wallet credited');
      queryClient.invalidateQueries({ queryKey: ['fleet-driver-advances'] });
      queryClient.invalidateQueries({ queryKey: ['fleet-advance-stats'] });
      queryClient.invalidateQueries({ queryKey: ['fleet-advance-stats-hub'] });
      setShowApproveModal(false);
      setAdvanceToApprove(null);
      setSelectedAdvance(null);
    },
    onError: () => toast.error('Failed to approve advance'),
  });

  const openApproveModal = (advance: any) => {
    setAdvanceToApprove(advance);
    setPaymentMethod('card');
    setPaymentData({ cardNumber: '', cardName: '', expiryDate: '', cvv: '', phoneNumber: '', mobileProvider: 'mtn' });
    setShowApproveModal(true);
  };

  const handleApprovePayment = () => {
    if (paymentMethod === 'card') {
      if (!paymentData.cardNumber || !paymentData.cardName || !paymentData.expiryDate || !paymentData.cvv) {
        toast.error('Please fill in all card details'); return;
      }
    } else {
      if (!paymentData.phoneNumber) {
        toast.error('Please enter your phone number'); return;
      }
    }
    approveMutation.mutate(advanceToApprove.id);
  };

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      fuelApi.rejectAdvance(id, reason),
    onSuccess: () => {
      toast.success('Advance request rejected');
      queryClient.invalidateQueries({ queryKey: ['fleet-driver-advances'] });
      queryClient.invalidateQueries({ queryKey: ['fleet-advance-stats'] });
      setShowRejectModal(false);
      setRejectReason('');
      setAdvanceToReject(null);
      setSelectedAdvance(null);
    },
    onError: () => toast.error('Failed to reject advance'),
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount) || 0);

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':   return { label: 'Pending',    icon: Clock,         cls: 'bg-amber-50 text-amber-600 border-amber-100' };
      case 'APPROVED':  return { label: 'Approved',   icon: CheckCircle,   cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
      case 'REJECTED':  return { label: 'Rejected',   icon: XCircle,       cls: 'bg-rose-50 text-rose-600 border-rose-100' };
      case 'RECONCILED':return { label: 'Reconciled', icon: CheckCircle,   cls: 'bg-blue-50 text-blue-600 border-blue-100' };
      default:          return { label: status,        icon: AlertCircle,   cls: 'bg-slate-50 text-slate-600 border-slate-100' };
    }
  };

  const filtered = (advances || []).filter((a: any) =>
    filterStatus === 'all' || a.status === filterStatus
  );

  const filterTabs: { id: FilterStatus; label: string }[] = [
    { id: 'PENDING',    label: `Pending (${(advances || []).filter((a: any) => a.status === 'PENDING').length})` },
    { id: 'APPROVED',   label: 'Approved' },
    { id: 'REJECTED',   label: 'Rejected' },
    { id: 'RECONCILED', label: 'Reconciled' },
    { id: 'all',        label: 'All' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending',    value: stats?.pendingCount   ?? 0, amount: stats?.pendingAmount   ?? 0, color: 'amber'   },
          { label: 'Approved',   value: stats?.approvedCount  ?? 0, amount: stats?.approvedAmount  ?? 0, color: 'emerald' },
          { label: 'Reconciled', value: stats?.reconciledCount?? 0, amount: stats?.totalReconciled ?? 0, color: 'blue'    },
          { label: 'Rejected',   value: stats?.rejectedCount  ?? 0, amount: 0,                          color: 'rose'    },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <p className={`text-[8px] font-black uppercase tracking-widest text-${s.color}-500 mb-1`}>{s.label}</p>
            <p className="text-2xl font-black text-[#0f172a]">{s.value}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-1">{formatCurrency(s.amount)}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-50 border border-slate-100 rounded-2xl w-fit shadow-inner">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={cn(
              'px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200',
              filterStatus === tab.id
                ? 'bg-white text-[#345E85] shadow-md border border-slate-200'
                : 'text-slate-400 hover:text-slate-600 hover:bg-white/60'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <RefreshCw className="w-8 h-8 text-[#345E85] animate-spin" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Requests...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-dashed border-slate-200 p-16 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <DollarSign className="text-slate-300" size={28} />
          </div>
          <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">No Requests Found</h4>
          <p className="text-sm font-medium text-slate-400 mt-1">
            {filterStatus === 'PENDING' ? 'No pending advance requests from your drivers.' : 'No records match this filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header row — desktop only */}
          <div className="hidden md:grid grid-cols-12 px-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <div className="col-span-3">Driver</div>
            <div className="col-span-3">Trip</div>
            <div className="col-span-2 text-center">Amount</div>
            <div className="col-span-2 text-center">Date</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {filtered.map((advance: any) => {
            const statusCfg = getStatusConfig(advance.status);
            const StatusIcon = statusCfg.icon;
            const driverName = advance.driver
              ? `${advance.driver.firstName} ${advance.driver.lastName}`
              : 'Unknown Driver';
            const tripRef = advance.trip?.tripNumber || advance.tripId?.slice(0, 8) || '—';

            return (
              <motion.div
                key={advance.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[1.5rem] border border-slate-100 p-6 shadow-sm hover:shadow-lg hover:border-blue-100 transition-all group"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Driver */}
                  <div className="md:col-span-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#345E85]/10 flex items-center justify-center text-[#345E85] shrink-0">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight leading-tight">{driverName}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {advance.driverId?.slice(0, 8)}</p>
                    </div>
                  </div>

                  {/* Trip */}
                  <div className="md:col-span-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                      <Route size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight leading-tight">
                        {advance.trip ? `${advance.trip.origin?.city || '?'} → ${advance.trip.destination?.city || '?'}` : 'Not linked'}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ref: {tripRef}</p>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="md:col-span-2 text-left md:text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 md:hidden">Amount</p>
                    <p className="text-lg font-black text-[#0f172a]">{formatCurrency(advance.advanceAmount)}</p>
                    <div className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase mt-1', statusCfg.cls)}>
                      <StatusIcon size={9} />
                      {statusCfg.label}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="md:col-span-2 text-left md:text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 md:hidden">Requested</p>
                    <p className="text-[10px] font-bold text-slate-600">{formatDate(advance.advanceDate || advance.createdAt)}</p>
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-2 flex items-center justify-start md:justify-end gap-2">
                    <button
                      onClick={() => setSelectedAdvance(advance)}
                      className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-all"
                    >
                      Details
                    </button>
                    {advance.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => openApproveModal(advance)}
                          className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 transition-all shadow-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => { setAdvanceToReject(advance); setShowRejectModal(true); }}
                          className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-white bg-rose-500 rounded-xl hover:bg-rose-600 transition-all shadow-sm"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Notes preview */}
                {advance.notes && (
                  <div className="mt-4 pt-4 border-t border-slate-50">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Driver's Reason</p>
                    <p className="text-xs text-slate-500 italic">"{advance.notes}"</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedAdvance && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedAdvance(null)}
              className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-[#345E85] p-8 text-white flex items-center justify-between shrink-0">
                <div>
                  <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Advance Request</p>
                  <h3 className="text-xl font-black uppercase tracking-tight mt-1">
                    {formatCurrency(selectedAdvance.advanceAmount)}
                  </h3>
                </div>
                <button onClick={() => setSelectedAdvance(null)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                  <X size={18} />
                </button>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><User size={10} /> Driver</p>
                    <p className="text-sm font-black text-[#0f172a] uppercase">
                      {selectedAdvance.driver ? `${selectedAdvance.driver.firstName} ${selectedAdvance.driver.lastName}` : 'Unknown'}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Truck size={10} /> Status</p>
                    <div className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[9px] font-black uppercase', getStatusConfig(selectedAdvance.status).cls)}>
                      {selectedAdvance.status}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Route size={10} /> Linked Trip</p>
                  {selectedAdvance.trip ? (
                    <div>
                      <p className="text-sm font-black text-[#0f172a] uppercase">
                        {selectedAdvance.trip.origin?.city || '?'} → {selectedAdvance.trip.destination?.city || '?'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">#{selectedAdvance.trip.tripNumber}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No trip linked</p>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Requested On</p>
                  <p className="text-sm font-bold text-[#0f172a]">{formatDate(selectedAdvance.advanceDate || selectedAdvance.createdAt)}</p>
                </div>

                {selectedAdvance.notes && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Driver's Reason</p>
                    <p className="text-sm text-slate-600 italic">"{selectedAdvance.notes}"</p>
                  </div>
                )}

                {selectedAdvance.rejectionReason && (
                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                    <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-2">Rejection Reason</p>
                    <p className="text-sm text-rose-600">"{selectedAdvance.rejectionReason}"</p>
                  </div>
                )}
              </div>

              {selectedAdvance.status === 'PENDING' && (
                <div className="p-8 pt-0 flex gap-3 shrink-0">
                  <button
                    onClick={() => { setAdvanceToReject(selectedAdvance); setShowRejectModal(true); }}
                    className="flex-1 h-14 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => openApproveModal(selectedAdvance)}
                    className="flex-[2] h-14 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200"
                  >
                    Approve & Credit Wallet
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── PAYMENT MODAL (same pattern as BuyCredits) ── */}
      {showApproveModal && advanceToApprove && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border-2 border-slate-100">

            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Approve Advance Payment</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Crediting{' '}
                    <strong>
                      {advanceToApprove.driver
                        ? `${advanceToApprove.driver.firstName} ${advanceToApprove.driver.lastName}`
                        : 'Driver'}
                    </strong>{' '}
                    — {formatCurrency(advanceToApprove.advanceAmount)}
                  </p>
                </div>
                <button
                  onClick={() => { setShowApproveModal(false); setAdvanceToApprove(null); }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">

              {/* Order Summary */}
              <div className="bg-blue-50 rounded-2xl p-8 border-2 border-blue-100">
                <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-6">Payment Summary</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-800/60 uppercase">Driver:</span>
                    <span className="text-base font-black text-blue-900 uppercase">
                      {advanceToApprove.driver
                        ? `${advanceToApprove.driver.firstName} ${advanceToApprove.driver.lastName}`
                        : '—'}
                    </span>
                  </div>
                  {advanceToApprove.trip && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-800/60 uppercase">Trip:</span>
                      <span className="text-base font-black text-blue-900 uppercase">
                        {advanceToApprove.trip.origin?.city || '?'} → {advanceToApprove.trip.destination?.city || '?'}
                      </span>
                    </div>
                  )}
                  {advanceToApprove.notes && (
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-xs font-bold text-blue-800/60 uppercase shrink-0">Reason:</span>
                      <span className="text-xs font-bold text-blue-800 italic text-right">"{advanceToApprove.notes}"</span>
                    </div>
                  )}
                  <div className="pt-4 border-t-2 border-dashed border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black text-blue-900 uppercase">Total Amount:</span>
                      <span className="text-3xl font-black text-[#345E85]">{formatCurrency(advanceToApprove.advanceAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Toggle */}
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Payment Method</h3>
                <div className="grid grid-cols-2 gap-6">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-6 rounded-2xl border-2 transition-all ${
                      paymentMethod === 'card' ? 'border-[#345E85] bg-blue-50' : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-3">💳</div>
                      <div className="text-xs font-black text-slate-900 uppercase tracking-widest">Credit Card</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('mobile_money')}
                    className={`p-6 rounded-2xl border-2 transition-all ${
                      paymentMethod === 'mobile_money' ? 'border-[#345E85] bg-blue-50' : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-3">📱</div>
                      <div className="text-xs font-black text-slate-900 uppercase tracking-widest">Mobile Money</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Card Form */}
              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Card Number</label>
                    <input
                      type="text"
                      placeholder="XXXX XXXX XXXX XXXX"
                      maxLength={19}
                      value={paymentData.cardNumber}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\s/g, '');
                        setPaymentData({ ...paymentData, cardNumber: v.match(/.{1,4}/g)?.join(' ') || v });
                      }}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Cardholder Name</label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={paymentData.cardName}
                      onChange={(e) => setPaymentData({ ...paymentData, cardName: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        maxLength={5}
                        value={paymentData.expiryDate}
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, '');
                          if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2, 4);
                          setPaymentData({ ...paymentData, expiryDate: v });
                        }}
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">CVV</label>
                      <input
                        type="text"
                        placeholder="CVV"
                        maxLength={4}
                        value={paymentData.cvv}
                        onChange={(e) => setPaymentData({ ...paymentData, cvv: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Money Form */}
              {paymentMethod === 'mobile_money' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Mobile Provider</label>
                    <select
                      value={paymentData.mobileProvider}
                      onChange={(e) => setPaymentData({ ...paymentData, mobileProvider: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all appearance-none"
                    >
                      <option value="mtn">MTN Mobile Money</option>
                      <option value="airtel">Airtel Money</option>
                      <option value="mpesa">M-Pesa</option>
                      <option value="orange">Orange Money</option>
                      <option value="tigo">Tigo Cash</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+250 7XX XXX XXX"
                      value={paymentData.phoneNumber}
                      onChange={(e) => setPaymentData({ ...paymentData, phoneNumber: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      You will receive a prompt on your phone to confirm the payment
                    </p>
                  </div>
                </div>
              )}

              {/* Security Notice */}
              <div className="flex items-start gap-4 bg-emerald-50 rounded-2xl p-6 border-2 border-emerald-100">
                <FaShieldAlt className="w-6 h-6 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-black text-emerald-900 mb-1 uppercase tracking-tight">Secure Payment Protocol</div>
                  <p className="text-[11px] font-bold text-emerald-700 leading-relaxed">
                    Your payment information is encrypted and secure. We never store your sensitive card details or PIN codes.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t-2 border-slate-100 bg-slate-50 flex justify-between items-center gap-6">
              <button
                onClick={() => { setShowApproveModal(false); setAdvanceToApprove(null); }}
                className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-200 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleApprovePayment}
                disabled={approveMutation.isPending}
                className="flex-1 px-8 py-4 text-xs font-black bg-[#345E85] hover:bg-[#2a4d6d] text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest border-b-4 border-indigo-900/20"
              >
                {approveMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  `Confirm Payment • ${formatCurrency(advanceToApprove.advanceAmount)}`
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && advanceToReject && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
              className="absolute inset-0 bg-[#0f172a]/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <h3 className="text-lg font-black text-[#0f172a] uppercase tracking-tight mb-1">Reject Request</h3>
                <p className="text-xs text-slate-400 mb-6">
                  Rejecting advance of <strong>{formatCurrency(advanceToReject.advanceAmount)}</strong> from{' '}
                  {advanceToReject.driver ? `${advanceToReject.driver.firstName} ${advanceToReject.driver.lastName}` : 'driver'}.
                </p>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Reason for Rejection *</label>
                <textarea
                  required
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none"
                  placeholder="Explain why this request is being rejected..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
                    className="flex-1 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all border border-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!rejectReason.trim()) { toast.error('Please provide a rejection reason'); return; }
                      rejectMutation.mutate({ id: advanceToReject.id, reason: rejectReason });
                    }}
                    disabled={rejectMutation.isPending}
                    className="flex-[2] h-12 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 disabled:opacity-50"
                  >
                    {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DriverAdvanceRequestsPage;
