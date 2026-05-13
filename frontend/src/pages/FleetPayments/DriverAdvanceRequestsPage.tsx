import React, { useState } from 'react';
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
  Wallet,
  ShieldCheck,
  CreditCard,
  Smartphone,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { fuelApi } from '../../services/fuelApi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';

type FilterStatus = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'RECONCILED';
type PaymentMethod = 'card' | 'mtn' | 'airtel' | 'mpesa' | 'orange' | null;

const MOBILE_PROVIDERS = [
  { id: 'mtn',    label: 'MTN Mobile Money', short: 'MTN MoMo',   color: '#FFCC00', bg: '#FFFBEB', border: '#FDE68A', prefix: '+250 78' },
  { id: 'airtel', label: 'Airtel Money',      short: 'Airtel',     color: '#E4002B', bg: '#FFF1F2', border: '#FECDD3', prefix: '+250 73' },
  { id: 'mpesa',  label: 'M-Pesa',            short: 'M-Pesa',     color: '#4CAF50', bg: '#F0FDF4', border: '#BBF7D0', prefix: '+254 7'  },
  { id: 'orange', label: 'Orange Money',      short: 'Orange',     color: '#FF6600', bg: '#FFF7ED', border: '#FED7AA', prefix: '+221 7'  },
] as const;

const DriverAdvanceRequestsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('PENDING');
  const [selectedAdvance, setSelectedAdvance] = useState<any>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [advanceToReject, setAdvanceToReject] = useState<any>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [advanceToApprove, setAdvanceToApprove] = useState<any>(null);
  const [paymentStep, setPaymentStep] = useState<'select' | 'details' | 'confirm'>('select');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

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
    setPaymentStep('select');
    setPaymentMethod(null);
    setCardNumber(''); setCardExpiry(''); setCardCvc(''); setCardHolder(''); setMobileNumber('');
    setShowApproveModal(true);
  };

  const formatCardNumber = (v: string) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})/g, '$1 ').trim();

  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length >= 3 ? `${d.slice(0,2)}/${d.slice(2)}` : d;
  };

  const selectedProvider = MOBILE_PROVIDERS.find(p => p.id === paymentMethod);

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

      {/* ── PROFESSIONAL PAYMENT MODAL ───────────────────────────────────── */}
      <AnimatePresence>
        {showApproveModal && advanceToApprove && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { if (!approveMutation.isPending) { setShowApproveModal(false); setAdvanceToApprove(null); } }}
              className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 24 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
            >
              {/* ── HEADER ── */}
              <div className="bg-[#0f172a] p-7 text-white shrink-0">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                      <ShieldCheck size={18} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Secure Payment</p>
                      <h3 className="text-lg font-black uppercase tracking-tight leading-tight">Approve Advance</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => { if (!approveMutation.isPending) { setShowApproveModal(false); setAdvanceToApprove(null); } }}
                    className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
                {/* Amount banner */}
                <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Crediting to Driver Wallet</p>
                    <p className="text-[9px] font-black text-slate-300 mt-0.5 uppercase">
                      {advanceToApprove.driver
                        ? `${advanceToApprove.driver.firstName} ${advanceToApprove.driver.lastName}`
                        : 'Driver'}
                    </p>
                  </div>
                  <p className="text-2xl font-black text-emerald-400">{formatCurrency(advanceToApprove.advanceAmount)}</p>
                </div>
                {/* Step indicator */}
                <div className="flex items-center gap-2 mt-5">
                  {(['select','details','confirm'] as const).map((s, i) => (
                    <React.Fragment key={s}>
                      <div className={cn(
                        'flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest transition-all',
                        paymentStep === s ? 'text-white' : i < ['select','details','confirm'].indexOf(paymentStep) ? 'text-emerald-400' : 'text-slate-600'
                      )}>
                        <div className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black border transition-all',
                          paymentStep === s ? 'bg-white text-[#0f172a] border-white' :
                          i < ['select','details','confirm'].indexOf(paymentStep) ? 'bg-emerald-400 text-[#0f172a] border-emerald-400' : 'bg-transparent border-slate-600 text-slate-600'
                        )}>{i < ['select','details','confirm'].indexOf(paymentStep) ? '✓' : i + 1}</div>
                        <span className="hidden sm:inline">{s === 'select' ? 'Method' : s === 'details' ? 'Details' : 'Confirm'}</span>
                      </div>
                      {i < 2 && <div className={cn('flex-1 h-px', i < ['select','details','confirm'].indexOf(paymentStep) ? 'bg-emerald-400' : 'bg-slate-700')} />}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* ── STEP 1: SELECT METHOD ── */}
              <AnimatePresence mode="wait">
              {paymentStep === 'select' && (
                <motion.div key="select" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="p-7 space-y-4 overflow-y-auto">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Payment Method</p>

                  {/* Card */}
                  <button
                    onClick={() => { setPaymentMethod('card'); setPaymentStep('details'); }}
                    className={cn(
                      'w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all hover:border-[#345E85] hover:shadow-lg group text-left',
                      paymentMethod === 'card' ? 'border-[#345E85] bg-blue-50/50' : 'border-slate-100 bg-white'
                    )}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#345E85] to-blue-700 flex items-center justify-center shrink-0 shadow-lg">
                      <CreditCard size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">Debit / Credit Card</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Visa · Mastercard · Amex</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-[#345E85] transition-colors" />
                  </button>

                  {/* Mobile providers */}
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Smartphone size={11} /> Mobile Money
                    </p>
                    <div className="space-y-2">
                      {MOBILE_PROVIDERS.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => { setPaymentMethod(p.id as PaymentMethod); setPaymentStep('details'); }}
                          className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-slate-300 transition-all hover:shadow-md group text-left"
                          style={{ borderColor: paymentMethod === p.id ? p.color : undefined }}
                        >
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xs font-black"
                            style={{ background: p.bg, border: `2px solid ${p.border}`, color: p.color }}
                          >
                            {p.short.split(' ')[0]}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">{p.label}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{p.prefix}...</p>
                          </div>
                          <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 2: PAYMENT DETAILS ── */}
              {paymentStep === 'details' && (
                <motion.div key="details" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="p-7 space-y-4 overflow-y-auto">
                  {paymentMethod === 'card' ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#345E85] to-blue-700 flex items-center justify-center">
                          <CreditCard size={14} className="text-white" />
                        </div>
                        <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">Card Details</p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Cardholder Name</label>
                          <input
                            type="text"
                            placeholder="JOHN DOE"
                            value={cardHolder}
                            onChange={e => setCardHolder(e.target.value.toUpperCase())}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#345E85]/20 focus:border-[#345E85] transition-all uppercase tracking-widest"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Card Number</label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="0000 0000 0000 0000"
                              value={cardNumber}
                              onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                              maxLength={19}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm font-bold text-[#0f172a] tracking-widest focus:outline-none focus:ring-2 focus:ring-[#345E85]/20 focus:border-[#345E85] transition-all"
                            />
                            <CreditCard size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Expiry</label>
                            <input
                              type="text"
                              placeholder="MM/YY"
                              value={cardExpiry}
                              onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                              maxLength={5}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-[#0f172a] tracking-widest focus:outline-none focus:ring-2 focus:ring-[#345E85]/20 focus:border-[#345E85] transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">CVC</label>
                            <input
                              type="password"
                              placeholder="•••"
                              value={cardCvc}
                              onChange={e => setCardCvc(e.target.value.replace(/\D/g,'').slice(0,4))}
                              maxLength={4}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-[#0f172a] tracking-widest focus:outline-none focus:ring-2 focus:ring-[#345E85]/20 focus:border-[#345E85] transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-[9px] font-black"
                          style={{ background: selectedProvider?.bg, border: `2px solid ${selectedProvider?.border}`, color: selectedProvider?.color }}
                        >
                          {selectedProvider?.short.split(' ')[0]}
                        </div>
                        <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">{selectedProvider?.label}</p>
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Mobile Number</label>
                        <div className="relative">
                          <input
                            type="tel"
                            placeholder={`${selectedProvider?.prefix}... `}
                            value={mobileNumber}
                            onChange={e => setMobileNumber(e.target.value.replace(/[^\d+\s-]/g,'').slice(0,17))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm font-bold text-[#0f172a] tracking-widest focus:outline-none focus:ring-2 focus:ring-[#345E85]/20 focus:border-[#345E85] transition-all"
                          />
                          <Smartphone size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 mt-1.5">A payment prompt will be sent to this number.</p>
                      </div>
                    </>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setPaymentStep('select')}
                      className="flex-1 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all border border-slate-100"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => {
                        if (paymentMethod === 'card') {
                          if (!cardHolder.trim() || cardNumber.replace(/\s/g,'').length < 16 || cardExpiry.length < 5 || cardCvc.length < 3) {
                            toast.error('Please fill in all card details correctly'); return;
                          }
                        } else {
                          if (!mobileNumber.trim() || mobileNumber.replace(/[^\d]/g,'').length < 9) {
                            toast.error('Please enter a valid mobile number'); return;
                          }
                        }
                        setPaymentStep('confirm');
                      }}
                      className="flex-[2] h-12 bg-[#0f172a] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                    >
                      Continue <ChevronRight size={13} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 3: CONFIRM ── */}
              {paymentStep === 'confirm' && (
                <motion.div key="confirm" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="p-7 space-y-4 overflow-y-auto">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Review & Confirm</p>

                  <div className="bg-slate-50 rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount</span>
                      <span className="text-sm font-black text-emerald-600">{formatCurrency(advanceToApprove.advanceAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between px-5 py-3.5">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recipient</span>
                      <span className="text-xs font-black text-[#0f172a] uppercase">
                        {advanceToApprove.driver
                          ? `${advanceToApprove.driver.firstName} ${advanceToApprove.driver.lastName}`
                          : 'Driver'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-5 py-3.5">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Via</span>
                      <span className="text-xs font-black text-[#0f172a] uppercase">
                        {paymentMethod === 'card'
                          ? `Card ···· ${cardNumber.replace(/\s/g,'').slice(-4)}`
                          : `${selectedProvider?.label} · ${mobileNumber}`}
                      </span>
                    </div>
                    {advanceToApprove.trip && (
                      <div className="flex items-center justify-between px-5 py-3.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Trip</span>
                        <span className="text-xs font-black text-[#0f172a] uppercase">
                          {advanceToApprove.trip.origin?.city || '?'} → {advanceToApprove.trip.destination?.city || '?'}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between px-5 py-3.5">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fee</span>
                      <span className="text-xs font-black text-slate-500">No charge</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                    <Lock size={12} className="text-[#345E85] shrink-0" />
                    <p className="text-[9px] font-bold text-[#345E85]">This transaction is secured and will immediately credit the driver's fuel wallet.</p>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => setPaymentStep('details')}
                      disabled={approveMutation.isPending}
                      className="flex-1 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all border border-slate-100 disabled:opacity-40"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => approveMutation.mutate(advanceToApprove.id)}
                      disabled={approveMutation.isPending}
                      className="flex-[2] h-12 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200/60 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {approveMutation.isPending ? (
                        <><RefreshCw size={13} className="animate-spin" /> Processing...</>
                      ) : (
                        <><CheckCircle size={13} /> Pay & Approve</>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
