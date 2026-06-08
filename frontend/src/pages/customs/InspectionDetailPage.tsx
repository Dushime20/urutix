import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ShieldCheck, ArrowLeft, CheckCircle, XCircle, AlertTriangle,
  Clock, FileText, Truck, User, MapPin, Package, Flag, Hash,
  Calendar, Building2, Weight, DollarSign, Zap, Globe,
  ChevronRight, Loader2, BadgeCheck, ShieldAlert, PauseCircle,
  MessageSquare, ThumbsUp, ThumbsDown,
} from 'lucide-react';
import { customsApi } from '../../services/customsApi';
import { cn } from '../../utils/cn';
import { StatCard } from '@/components/EnliteUI/Cards/StatCard';

const BRAND = '#2c5173';

const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  PENDING:     { label: 'Pending',      badge: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-400' },
  IN_PROGRESS: { label: 'In Progress',  badge: 'bg-blue-100 text-blue-700 border-blue-200',      dot: 'bg-blue-500' },
  CLEARED:     { label: 'Cleared',      badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  REJECTED:    { label: 'Rejected',     badge: 'bg-rose-100 text-rose-700 border-rose-200',      dot: 'bg-rose-500' },
  ON_HOLD:     { label: 'On Hold',      badge: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  HIGH_RISK:   { label: 'High Risk',    badge: 'bg-red-100 text-red-700 border-red-200',         dot: 'bg-red-600' },
};

const RISK_CONFIG: Record<string, { bg: string; text: string; bar: string; label: string; pct: number }> = {
  LOW:      { bg: 'bg-emerald-50',  text: 'text-emerald-700', bar: 'bg-emerald-400', label: 'Low Risk',      pct: 20 },
  MEDIUM:   { bg: 'bg-amber-50',    text: 'text-amber-700',   bar: 'bg-amber-400',   label: 'Medium Risk',   pct: 55 },
  HIGH:     { bg: 'bg-rose-50',     text: 'text-rose-700',    bar: 'bg-rose-500',    label: 'High Risk',     pct: 80 },
  CRITICAL: { bg: 'bg-red-900',     text: 'text-white',       bar: 'bg-red-600',     label: 'Critical Risk', pct: 100 },
};

const fmt = (n: number | null | undefined, currency = 'USD') =>
  n != null ? `${currency} ${Number(n).toLocaleString()}` : null;

const InspectionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [actionNotes, setActionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['customs-inspection', id],
    queryFn: () => customsApi.getInspectionById(id!),
    enabled: !!id,
  });

  const ins = data?.data?.data;

  const mutation = useMutation({
    mutationFn: (payload: any) => customsApi.updateInspectionStatus(id!, payload),
    onSuccess: () => {
      toast.success('Inspection status updated');
      qc.invalidateQueries({ queryKey: ['customs-inspection', id] });
      qc.invalidateQueries({ queryKey: ['customs-inspections'] });
      qc.invalidateQueries({ queryKey: ['customs-stats'] });
      setShowActionPanel(false);
      setPendingAction(null);
      setActionNotes('');
      setRejectionReason('');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const flagMutation = useMutation({
    mutationFn: (payload: { riskLevel: string; notes?: string }) =>
      customsApi.flagInspection(id!, payload.riskLevel, payload.notes),
    onSuccess: () => {
      toast.success('Inspection flagged as high risk');
      qc.invalidateQueries({ queryKey: ['customs-inspection', id] });
      qc.invalidateQueries({ queryKey: ['customs-stats'] });
      setShowActionPanel(false);
    },
    onError: () => toast.error('Failed to flag inspection'),
  });

  const handleAction = () => {
    if (!pendingAction) return;
    if (pendingAction === 'FLAG') {
      flagMutation.mutate({ riskLevel: 'HIGH', notes: actionNotes });
      return;
    }
    if (pendingAction === 'REJECTED' && !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    mutation.mutate({
      status: pendingAction,
      inspectionNotes: actionNotes,
      rejectionReason: pendingAction === 'REJECTED' ? rejectionReason : undefined,
    });
  };

  const openAction = (action: string) => {
    setPendingAction(action);
    setShowActionPanel(true);
  };

  const isBusy = mutation.isPending || flagMutation.isPending;

  /* ── Loading ── */
  if (isLoading) return (
    <div className="space-y-4 animate-pulse p-6">
      <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
      <div className="grid grid-cols-2 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl" />)}
      </div>
      <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
    </div>
  );

  if (!ins) return (
    <div className="flex flex-col items-center justify-center h-72 gap-3">
      <ShieldAlert size={40} className="text-slate-300" />
      <p className="text-sm font-bold text-slate-400">Inspection record not found</p>
      <button onClick={() => navigate(-1)} className="text-xs text-[#2c5173] font-bold hover:underline">← Go back</button>
    </div>
  );

  const statusCfg = STATUS_CONFIG[ins.status] || { label: ins.status, badge: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
  const riskCfg = ins.riskLevel ? RISK_CONFIG[ins.riskLevel] : null;
  const cur = ins.currency || 'USD';

  /* ── Sub-components ── */
  const SectionHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
    <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${BRAND}15` }}>
        <span className="text-[#2c5173]">{icon}</span>
      </div>
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">{title}</h3>
    </div>
  );

  const InfoRow = ({ icon, label, value, accent }: { icon?: React.ReactNode; label: string; value?: string | number | null; accent?: boolean }) =>
    value != null ? (
      <div className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-800/60 last:border-0 group">
        <div className="flex items-center gap-2">
          {icon && <span className="text-slate-300 group-hover:text-slate-400 transition-colors">{icon}</span>}
          <span className="text-xs font-semibold text-slate-400">{label}</span>
        </div>
        <span className={cn('text-xs font-bold text-right max-w-[55%]', accent ? 'text-[#2c5173]' : 'text-slate-800 dark:text-slate-100')}>
          {String(value)}
        </span>
      </div>
    ) : null;

  const ACTION_META: Record<string, { icon: React.ReactNode; label: string; desc: string; classes: string; confirmClasses: string }> = {
    CLEARED:  { icon: <BadgeCheck size={16} />,  label: 'Approve & Clear',       desc: 'Release cargo for transit',      classes: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200', confirmClasses: 'bg-emerald-600 hover:bg-emerald-700' },
    REJECTED: { icon: <XCircle size={16} />,     label: 'Reject Shipment',       desc: 'Deny clearance with reason',     classes: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200',           confirmClasses: 'bg-rose-600 hover:bg-rose-700' },
    ON_HOLD:  { icon: <PauseCircle size={16} />, label: 'Hold for Investigation',desc: 'Pause pending further review',   classes: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200',   confirmClasses: 'bg-purple-600 hover:bg-purple-700' },
    FLAG:     { icon: <Flag size={16} />,        label: 'Flag as High Risk',     desc: 'Mark shipment as critical',      classes: 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200',             confirmClasses: 'bg-red-600 hover:bg-red-700' },
  };

  const currentAction = pendingAction ? ACTION_META[pendingAction] : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Hero Header ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          {/* Accent bar */}
          <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${BRAND}, #5b8ab5)` }} />

          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Left: Back + identity */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(-1)}
                  className="flex-shrink-0 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                >
                  <ArrowLeft size={16} className="text-slate-600 dark:text-slate-300" />
                </button>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0" style={{ background: BRAND }}>
                  <ShieldCheck size={22} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      {ins.plateNumber || ins.shipmentReference || `INS-${ins.id.slice(0, 8).toUpperCase()}`}
                    </h1>
                    <span className={cn('inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest', statusCfg.badge)}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', statusCfg.dot)} />
                      {statusCfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {ins.declarationNumber && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Hash size={10} /> {ins.declarationNumber}
                      </span>
                    )}
                    {ins.checkpointName && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin size={10} /> {ins.checkpointName}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar size={10} /> {new Date(ins.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: breadcrumb */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 flex-shrink-0">
                <span>Customs</span>
                <ChevronRight size={12} />
                <span>Inspections</span>
                <ChevronRight size={12} />
                <span className="text-slate-700 dark:text-slate-200 font-semibold">Detail</span>
              </div>
            </div>

            {/* Financial summary strip */}
            {(ins.declaredValue || ins.dutyAmount || ins.taxAmount) && (
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ins.declaredValue && (
                  <StatCard title="Declared Value" value={fmt(ins.declaredValue, cur) ?? '—'} icon={<DollarSign size={16} />} color="primary" variant="classic" />
                )}
                {ins.dutyAmount && (
                  <StatCard title="Duty Amount" value={fmt(ins.dutyAmount, cur) ?? '—'} icon={<DollarSign size={16} />} color="primary" variant="classic" />
                )}
                {ins.taxAmount && (
                  <StatCard title="Tax Amount" value={fmt(ins.taxAmount, cur) ?? '—'} icon={<DollarSign size={16} />} color="primary" variant="classic" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Alert banners ── */}
        {ins.hasDangerousGoods && (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl px-5 py-4">
            <AlertTriangle size={18} className="text-rose-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-black text-rose-700">Dangerous Goods Declared</p>
              {ins.imdgClass && <p className="text-xs text-rose-500 mt-0.5">IMDG Class {ins.imdgClass}{ins.unNumber ? ` · UN ${ins.unNumber}` : ''}</p>}
            </div>
          </div>
        )}
        {ins.isRestrictedGoods && (
          <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-2xl px-5 py-4">
            <Flag size={18} className="text-purple-600 flex-shrink-0" />
            <p className="text-sm font-black text-purple-700">Restricted Goods — Special Handling Required</p>
          </div>
        )}
        {ins.rejectionReason && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 rounded-2xl px-5 py-4">
            <p className="text-xs font-black uppercase tracking-widest text-rose-500 mb-1">Rejection Reason</p>
            <p className="text-sm text-rose-800 dark:text-rose-300">{ins.rejectionReason}</p>
          </div>
        )}

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT: 2/3 ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Trade & Declaration */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
              <SectionHeader icon={<FileText size={14} />} title="Trade & Declaration" />
              <InfoRow icon={<Hash size={11} />}      label="Declaration No."    value={ins.declarationNumber} accent />
              <InfoRow icon={<Truck size={11} />}     label="Mode of Transport"  value={ins.modeOfTransport} />
              <InfoRow icon={<Globe size={11} />}     label="Country of Origin"  value={ins.countryOfOrigin} />
              <InfoRow icon={<Hash size={11} />}      label="Shipment Ref"       value={ins.shipmentReference} />
              <InfoRow icon={<MapPin size={11} />}    label="Checkpoint"         value={ins.checkpointName} />
              <InfoRow icon={<Building2 size={11} />} label="AEO Number"         value={ins.aeoNumber} />
              {ins.estimatedReleaseAt && (
                <InfoRow icon={<Calendar size={11} />} label="Est. Release" value={new Date(ins.estimatedReleaseAt).toLocaleString()} />
              )}
            </div>

            {/* Vehicle & Driver */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
              <SectionHeader icon={<Truck size={14} />} title="Vehicle & Driver" />
              <InfoRow icon={<Hash size={11} />}      label="Plate Number"       value={ins.plateNumber} accent />
              <InfoRow icon={<Truck size={11} />}     label="Truck Type"         value={ins.truckType} />
              <InfoRow icon={<User size={11} />}      label="Driver Name"        value={ins.driverName} />
              <InfoRow icon={<Hash size={11} />}      label="Container No."      value={ins.containerNumber} />
              <InfoRow icon={<Hash size={11} />}      label="Seal Number"        value={ins.sealNumber} />
              <InfoRow icon={<Building2 size={11} />} label="Shipping Company"   value={ins.shippingCompany} />
            </div>

            {/* Cargo Details */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
              <SectionHeader icon={<Package size={14} />} title="Cargo Details" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <div>
                  <InfoRow icon={<Package size={11} />}  label="Cargo Type"        value={ins.cargoType} />
                  <InfoRow icon={<Package size={11} />}  label="Category"          value={ins.cargoCategory} />
                  <InfoRow icon={<Hash size={11} />}     label="HS Code"           value={ins.hsCode} accent />
                </div>
                <div>
                  <InfoRow icon={<Weight size={11} />}   label="Declared Weight"   value={ins.declaredWeight != null ? `${ins.declaredWeight} kg` : null} />
                  <InfoRow icon={<Weight size={11} />}   label="Actual Weight"     value={ins.actualWeight != null ? `${ins.actualWeight} kg` : null} />
                  <InfoRow icon={<Package size={11} />}  label="Declared Qty"      value={ins.declaredQuantity} />
                  <InfoRow icon={<Package size={11} />}  label="Actual Qty"        value={ins.actualQuantity} />
                </div>
              </div>
            </div>

            {/* Route */}
            {(ins.originCountry || ins.destinationCountry) && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                <SectionHeader icon={<MapPin size={14} />} title="Route" />
                <div className="flex items-center gap-4 py-3">
                  <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Origin</p>
                    <p className="text-base font-black text-slate-800 dark:text-white">{ins.originCountry || '—'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-8 h-px bg-slate-300" />
                    <ChevronRight size={16} className="text-slate-400" />
                    <div className="w-8 h-px bg-slate-300" />
                  </div>
                  <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Destination</p>
                    <p className="text-base font-black text-slate-800 dark:text-white">{ins.destinationCountry || '—'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Inspection Classification */}
            {(ins.examType || ins.holdType || ins.inspectionChannel) && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                <SectionHeader icon={<ShieldCheck size={14} />} title="Inspection Classification" />

                <div className="space-y-3">
                  {ins.examType && ins.examType !== 'NONE' && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">Exam Type</span>
                      <span className={cn('text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide', {
                        'bg-blue-100 text-blue-700':    ins.examType === 'DOCUMENT',
                        'bg-purple-100 text-purple-700': ins.examType === 'X_RAY',
                        'bg-amber-100 text-amber-700':  ins.examType === 'TAILGATE',
                        'bg-rose-100 text-rose-700':    ins.examType === 'INTENSIVE',
                      })}>
                        {ins.examType.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}
                  {ins.holdType && ins.holdType !== 'NONE' && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">Hold Type</span>
                      <span className="text-xs font-black text-rose-700 bg-rose-50 px-3 py-1 rounded-full uppercase tracking-wide">
                        {ins.holdType.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}
                  {ins.inspectionChannel && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">WCO Lane</span>
                      <span className={cn('text-xs font-black px-3 py-1 rounded-full border', {
                        'bg-emerald-50 text-emerald-700 border-emerald-200': ins.inspectionChannel === 'GREEN',
                        'bg-amber-50 text-amber-700 border-amber-200':       ins.inspectionChannel === 'YELLOW',
                        'bg-rose-50 text-rose-700 border-rose-200':          ins.inspectionChannel === 'RED',
                      })}>
                        {ins.inspectionChannel === 'GREEN'  && '● Green Lane'}
                        {ins.inspectionChannel === 'YELLOW' && '● Yellow Lane'}
                        {ins.inspectionChannel === 'RED'    && '● Red Lane'}
                      </span>
                    </div>
                  )}
                </div>

                {(ins.sanctionsScreened || ins.deniedPartyFlag) && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    {ins.sanctionsScreened && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                        <CheckCircle size={10} /> Sanctions Screened
                      </span>
                    )}
                    {ins.deniedPartyFlag && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 bg-red-100 text-red-700 rounded-full border border-red-200">
                        <XCircle size={10} /> Denied Party Match
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Inspection Notes */}
            {ins.inspectionNotes && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                <SectionHeader icon={<FileText size={14} />} title="Inspection Notes" />
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {ins.inspectionNotes}
                </p>
              </div>
            )}

            {/* ── Compliance Responses (officer review panel) ── */}
            <ComplianceResponsesPanel inspectionId={id!} qc={qc} />
          </div>

          {/* ── RIGHT: 1/3 ── */}
          <div className="space-y-5">

            {/* Risk Level Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
              <SectionHeader icon={<Zap size={14} />} title="Risk Assessment" />
              {riskCfg ? (
                <div className={cn('rounded-xl p-4', riskCfg.bg)}>
                  <div className="flex items-center justify-between mb-3">
                    <p className={cn('text-sm font-black', riskCfg.text)}>{riskCfg.label}</p>
                    <ShieldAlert size={18} className={riskCfg.text} />
                  </div>
                  <div className="w-full bg-black/10 rounded-full h-2">
                    <div
                      className={cn('h-2 rounded-full transition-all', riskCfg.bar)}
                      style={{ width: `${riskCfg.pct}%` }}
                    />
                  </div>
                  <p className={cn('text-[10px] font-bold mt-1.5 opacity-70', riskCfg.text)}>{riskCfg.pct}% risk score</p>
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">No risk data</p>
              )}
            </div>

            {/* Assigned Officer */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
              <SectionHeader icon={<User size={14} />} title="Assigned Officer" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm text-white"
                  style={{ background: BRAND }}>
                  {ins.officer?.email?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{ins.officer?.email || '—'}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Customs Officer</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Opened</span>
                  <span className="text-slate-700 dark:text-slate-200 font-bold">{new Date(ins.createdAt).toLocaleDateString()}</span>
                </div>
                {ins.completedAt && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Completed</span>
                    <span className="text-slate-700 dark:text-slate-200 font-bold">{new Date(ins.completedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
              <SectionHeader icon={<ShieldCheck size={14} />} title="Actions" />
              <div className="space-y-2.5">
                {Object.entries(ACTION_META).map(([key, meta]) => (
                  <button
                    key={key}
                    onClick={() => openAction(key)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all group',
                      meta.classes,
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      {meta.icon}
                      <div className="text-left">
                        <p className="text-xs font-black">{meta.label}</p>
                        <p className="text-[10px] opacity-60 font-semibold">{meta.desc}</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="opacity-40 group-hover:opacity-80 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Action Confirmation Modal ── */}
      {showActionPanel && currentAction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 w-full max-w-lg shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center gap-3 mb-5">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', currentAction.confirmClasses)}>
                <span className="text-white">{currentAction.icon}</span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">{currentAction.label}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{currentAction.desc}</p>
              </div>
            </div>

            {/* Shipment reference */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 mb-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Applying to</p>
              <p className="text-sm font-black text-slate-800 dark:text-white">
                {ins.plateNumber || ins.shipmentReference || `INS-${ins.id.slice(0, 8).toUpperCase()}`}
              </p>
            </div>

            {pendingAction === 'REJECTED' && (
              <div className="mb-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Rejection Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  className="w-full mt-1.5 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2c5173]/30 focus:border-[#2c5173] transition-all"
                  rows={3}
                  placeholder="Describe the reason for rejection…"
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                />
              </div>
            )}

            <div className="mb-6">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Additional Notes <span className="text-slate-300">(optional)</span>
              </label>
              <textarea
                className="w-full mt-1.5 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2c5173]/30 focus:border-[#2c5173] transition-all"
                rows={3}
                placeholder="Any additional notes for the record…"
                value={actionNotes}
                onChange={e => setActionNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowActionPanel(false); setPendingAction(null); }}
                className="flex-1 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={isBusy}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-black transition-all disabled:opacity-60',
                  currentAction.confirmClasses,
                )}
              >
                {isBusy ? (
                  <><Loader2 size={14} className="animate-spin" /> Processing…</>
                ) : (
                  <>{currentAction.icon} Confirm</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Compliance Responses Panel (Officer View) ─────────────────────────────────

const responseStatusConfig: Record<string, { label: string; color: string }> = {
  SUBMITTED: { label: 'Awaiting Review', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  REVIEWED:  { label: 'Reviewed',        color: 'bg-blue-100 text-blue-700 border-blue-200' },
  ACCEPTED:  { label: 'Accepted',        color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  REJECTED:  { label: 'Rejected',        color: 'bg-rose-100 text-rose-700 border-rose-200' },
};

function ComplianceResponsesPanel({ inspectionId, qc }: { inspectionId: string; qc: any }) {
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const { data, refetch } = useQuery({
    queryKey: ['compliance-responses', inspectionId],
    queryFn: () => customsApi.getComplianceResponses(inspectionId),
  });
  const responses: any[] = data?.data?.data ?? [];

  const reviewMutation = useMutation({
    mutationFn: ({ responseId, status, notes }: { responseId: string; status: 'ACCEPTED' | 'REJECTED'; notes: string }) =>
      customsApi.reviewComplianceResponse(inspectionId, responseId, { status, reviewNotes: notes }),
    onSuccess: (_, vars) => {
      toast.success(`Response ${vars.status === 'ACCEPTED' ? 'accepted' : 'rejected'} — cargo owner notified`);
      setReviewingId(null);
      setReviewNotes('');
      refetch();
      qc.invalidateQueries({ queryKey: ['customs-inspection', inspectionId] });
      qc.invalidateQueries({ queryKey: ['customs-stats'] });
    },
    onError: () => toast.error('Failed to submit review'),
  });

  if (responses.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-800 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={14} className="text-amber-600" />
        <h3 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">
          Compliance Responses
        </h3>
        <span className="ml-auto text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
          {responses.length}
        </span>
      </div>

      <div className="space-y-4">
        {responses.map((r: any) => {
          const cfg = responseStatusConfig[r.status] ?? responseStatusConfig['SUBMITTED'];
          const isPending = r.status === 'SUBMITTED';
          const isReviewing = reviewingId === r.id;

          return (
            <div key={r.id} className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 space-y-3">
              {/* Response header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400">
                    {new Date(r.createdAt).toLocaleString()} · by cargo owner
                  </p>
                </div>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', cfg.color)}>
                  {cfg.label}
                </span>
              </div>

              {/* Notes */}
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{r.notes}</p>

              {/* Document count */}
              {r.documentIds?.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-1.5">
                  <FileText size={12} />
                  {r.documentIds.length} document(s) referenced
                </div>
              )}

              {/* Previous review notes */}
              {r.reviewNotes && !isReviewing && (
                <div className={cn(
                  'text-xs rounded-lg px-3 py-2',
                  r.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                )}>
                  <span className="font-semibold">Your review: </span>{r.reviewNotes}
                </div>
              )}

              {/* Review actions — only for SUBMITTED responses */}
              {isPending && !isReviewing && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => { setReviewingId(r.id); setReviewNotes(''); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Review Response
                  </button>
                </div>
              )}

              {/* Inline review form */}
              {isReviewing && (
                <div className="pt-1 space-y-3 border-t border-slate-100 dark:border-slate-800">
                  <textarea
                    rows={3}
                    value={reviewNotes}
                    onChange={e => setReviewNotes(e.target.value)}
                    placeholder="Optional notes for the cargo owner…"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none dark:bg-slate-800 dark:border-slate-700"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => reviewMutation.mutate({ responseId: r.id, status: 'ACCEPTED', notes: reviewNotes })}
                      disabled={reviewMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      <ThumbsUp size={12} /> Accept
                    </button>
                    <button
                      onClick={() => reviewMutation.mutate({ responseId: r.id, status: 'REJECTED', notes: reviewNotes })}
                      disabled={reviewMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      <ThumbsDown size={12} /> Reject
                    </button>
                    <button
                      onClick={() => { setReviewingId(null); setReviewNotes(''); }}
                      className="px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default InspectionDetailPage;
