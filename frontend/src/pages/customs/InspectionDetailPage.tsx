import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ShieldCheck, ArrowLeft, CheckCircle, XCircle, AlertTriangle,
  Clock, FileText, Truck, User, MapPin, Package, Flag,
} from 'lucide-react';
import { customsApi } from '../../services/customsApi';
import { cn } from '../../utils/cn';

const BRAND = '#345E85';

const statusBadge: Record<string, string> = {
  PENDING:     'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  CLEARED:     'bg-emerald-100 text-emerald-700',
  REJECTED:    'bg-rose-100 text-rose-700',
  ON_HOLD:     'bg-purple-100 text-purple-700',
  HIGH_RISK:   'bg-red-100 text-red-700',
};

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

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#345E85]" />
    </div>
  );

  if (!ins) return (
    <div className="text-center py-20 text-slate-400">Inspection not found</div>
  );

  const InfoRow = ({ label, value }: { label: string; value?: string | number | null }) => value != null ? (
    <div className="flex items-start justify-between py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="text-xs font-bold text-slate-800 dark:text-white text-right max-w-[60%]">{String(value)}</span>
    </div>
  ) : null;

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: BRAND }}>
            <ShieldCheck size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Inspection — {ins.plateNumber || ins.shipmentReference || ins.id.slice(0, 8)}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wide', statusBadge[ins.status] || 'bg-slate-100 text-slate-600')}>
                {ins.status?.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-slate-400">{new Date(ins.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details panels */}
        <div className="lg:col-span-2 space-y-5">

          {/* Truck & Driver */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <Truck size={13} /> Vehicle & Driver
            </h3>
            <InfoRow label="Plate Number" value={ins.plateNumber} />
            <InfoRow label="Truck Type" value={ins.truckType} />
            <InfoRow label="Driver Name" value={ins.driverName} />
            <InfoRow label="Container No." value={ins.containerNumber} />
            <InfoRow label="Seal Number" value={ins.sealNumber} />
            <InfoRow label="Shipping Company" value={ins.shippingCompany} />
          </div>

          {/* Cargo */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <Package size={13} /> Cargo Details
            </h3>
            <InfoRow label="Cargo Type" value={ins.cargoType} />
            <InfoRow label="Category" value={ins.cargoCategory} />
            <InfoRow label="HS Code" value={ins.hsCode} />
            <InfoRow label="Declared Weight" value={ins.declaredWeight != null ? `${ins.declaredWeight} kg` : null} />
            <InfoRow label="Actual Weight" value={ins.actualWeight != null ? `${ins.actualWeight} kg` : null} />
            <InfoRow label="Declared Qty" value={ins.declaredQuantity} />
            <InfoRow label="Actual Qty" value={ins.actualQuantity} />
            {ins.hasDangerousGoods && (
              <div className="mt-2 flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-50 rounded-xl px-3 py-2">
                <AlertTriangle size={13} /> DANGEROUS GOODS DECLARED
              </div>
            )}
            {ins.isRestrictedGoods && (
              <div className="mt-2 flex items-center gap-2 text-xs font-bold text-purple-700 bg-purple-50 rounded-xl px-3 py-2">
                <Flag size={13} /> RESTRICTED GOODS
              </div>
            )}
          </div>

          {/* Route */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <MapPin size={13} /> Route & Checkpoint
            </h3>
            <InfoRow label="Origin Country" value={ins.originCountry} />
            <InfoRow label="Destination" value={ins.destinationCountry} />
            <InfoRow label="Shipment Ref" value={ins.shipmentReference} />
            <InfoRow label="Checkpoint" value={ins.checkpointName} />
          </div>

          {/* Notes */}
          {ins.inspectionNotes && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                <FileText size={13} /> Inspection Notes
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{ins.inspectionNotes}</p>
            </div>
          )}

          {ins.rejectionReason && (
            <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-200 p-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-rose-600 mb-2">Rejection Reason</h3>
              <p className="text-sm text-rose-800 dark:text-rose-300">{ins.rejectionReason}</p>
            </div>
          )}
        </div>

        {/* Right: Actions panel */}
        <div className="space-y-5">
          {/* Risk level */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Risk Level</h3>
            <div className={cn('text-center py-3 rounded-xl font-black text-sm', {
              'bg-emerald-100 text-emerald-700': ins.riskLevel === 'LOW',
              'bg-amber-100 text-amber-700': ins.riskLevel === 'MEDIUM',
              'bg-rose-100 text-rose-700': ins.riskLevel === 'HIGH',
              'bg-red-900 text-white': ins.riskLevel === 'CRITICAL',
            })}>
              {ins.riskLevel}
            </div>
          </div>

          {/* Action buttons */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => openAction('CLEARED')}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-bold hover:bg-emerald-100 transition-colors"
              >
                <CheckCircle size={14} /> Approve & Clear
              </button>
              <button
                onClick={() => openAction('REJECTED')}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 text-rose-700 text-sm font-bold hover:bg-rose-100 transition-colors"
              >
                <XCircle size={14} /> Reject
              </button>
              <button
                onClick={() => openAction('ON_HOLD')}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 text-purple-700 text-sm font-bold hover:bg-purple-100 transition-colors"
              >
                <Clock size={14} /> Hold for Investigation
              </button>
              <button
                onClick={() => openAction('FLAG')}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-700 text-sm font-bold hover:bg-red-100 transition-colors"
              >
                <Flag size={14} /> Flag as High Risk
              </button>
            </div>
          </div>

          {/* Officer info */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
              <User size={13} /> Officer
            </h3>
            <p className="text-sm font-bold text-slate-700 dark:text-white">{ins.officer?.email || '—'}</p>
            <p className="text-xs text-slate-400 mt-1">Inspected: {new Date(ins.createdAt).toLocaleString()}</p>
            {ins.completedAt && (
              <p className="text-xs text-slate-400 mt-0.5">Completed: {new Date(ins.completedAt).toLocaleString()}</p>
            )}
          </div>
        </div>
      </div>

      {/* Action Confirmation Panel */}
      {showActionPanel && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-base font-black text-slate-900 dark:text-white mb-4">
              {pendingAction === 'CLEARED' && 'Approve & Clear Cargo'}
              {pendingAction === 'REJECTED' && 'Reject Cargo'}
              {pendingAction === 'ON_HOLD' && 'Hold for Investigation'}
              {pendingAction === 'FLAG' && 'Flag as High Risk'}
            </h3>

            {pendingAction === 'REJECTED' && (
              <div className="mb-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rejection Reason *</label>
                <textarea
                  className="w-full mt-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#345E85]/30"
                  rows={3}
                  placeholder="State the reason for rejection..."
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                />
              </div>
            )}

            <div className="mb-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notes (optional)</label>
              <textarea
                className="w-full mt-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#345E85]/30"
                rows={3}
                placeholder="Additional notes..."
                value={actionNotes}
                onChange={e => setActionNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowActionPanel(false); setPendingAction(null); }}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={mutation.isPending || flagMutation.isPending}
                className="px-5 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
                style={{ background: BRAND }}
              >
                {mutation.isPending || flagMutation.isPending ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionDetailPage;
