import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Gavel,
  AlertTriangle,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Hourglass,
  Scale,
  FileText,
  Flag,
  X,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import { TranslatedText } from '../../components/translated-text';
import { adminAPI, type AdminDispute } from '../../services/adminApi';
import ModernLoader from '../../components/common/ModernLoader';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../../components/EnliteUI/Tables';

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const getTimeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
};

const getDisplayName = (user?: AdminDispute['raisedBy']) => {
  if (!user) return 'Unknown';
  if (user.firstName || user.lastName) return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return user.email || 'Unknown';
};

// ── Status config ─────────────────────────────────────────────────────────────

type StatusKey = 'OPEN' | 'RESOLVED' | 'ESCALATED' | 'REJECTED';

const STATUS_CFG: Record<StatusKey, { label: string; color: string; icon: React.ReactNode }> = {
  OPEN:      { label: 'Open',      color: 'bg-gray-100 text-gray-700 border-gray-200',      icon: <Flag className="w-3 h-3" /> },
  RESOLVED:  { label: 'Resolved',  color: 'bg-green-50 text-green-700 border-green-100',    icon: <CheckCircle className="w-3 h-3" /> },
  ESCALATED: { label: 'Escalated', color: 'bg-orange-50 text-orange-700 border-orange-100', icon: <AlertTriangle className="w-3 h-3" /> },
  REJECTED:  { label: 'Rejected',  color: 'bg-red-50 text-red-700 border-red-100',          icon: <XCircle className="w-3 h-3" /> },
};

const getStatusCfg = (s: string) =>
  STATUS_CFG[s as StatusKey] ?? {
    label: s,
    color: 'bg-gray-50 text-gray-600 border-gray-100',
    icon: <Hourglass className="w-3 h-3" />,
  };

// ── Resolve Modal ─────────────────────────────────────────────────────────────

interface ResolveModalProps {
  dispute: AdminDispute;
  onClose: () => void;
  onConfirm: (status: string, resolution: string) => void;
  loading: boolean;
}

const ResolveModal: React.FC<ResolveModalProps> = ({ dispute, onClose, onConfirm, loading }) => {
  const [status, setStatus] = useState('RESOLVED');
  const [resolution, setResolution] = useState('');

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-black text-gray-900">Update Dispute</h3>
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{dispute.id.slice(0, 20)}...</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">New Status</label>
            <div className="relative">
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2c5173] focus:border-transparent appearance-none"
              >
                <option value="RESOLVED">Resolved</option>
                <option value="ESCALATED">Escalated</option>
                <option value="REJECTED">Rejected</option>
                <option value="OPEN">Re-open</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
              Resolution Notes <span className="text-gray-300">(optional)</span>
            </label>
            <textarea
              value={resolution}
              onChange={e => setResolution(e.target.value)}
              rows={3}
              placeholder="Describe the resolution or reason for status change..."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2c5173] focus:border-transparent resize-none"
            />
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(status, resolution)}
            disabled={loading}
            className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading
              ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...</>
              : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Detail Modal ──────────────────────────────────────────────────────────────

interface DetailModalProps {
  dispute: AdminDispute;
  onClose: () => void;
  onUpdate: (dispute: AdminDispute) => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ dispute, onClose, onUpdate }) => {
  const cfg = getStatusCfg(dispute.status);
  const raisedByName = getDisplayName(dispute.raisedBy);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[24px] max-w-2xl w-full max-h-[90vh] overflow-y-auto pb-24 lg:pb-8 border border-gray-100">

        {/* Header */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
              <Gavel className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">Dispute Details</h3>
              <p className="text-[10px] text-gray-400 font-mono">{dispute.id.slice(0, 20)}...</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Quick info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Status</div>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${cfg.color}`}>
                {cfg.icon} {cfg.label}
              </span>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Raised By</div>
              <div className="text-sm font-bold text-gray-900 truncate">{raisedByName}</div>
              {dispute.raisedBy?.role && (
                <div className="text-[10px] text-gray-400 capitalize mt-0.5">{dispute.raisedBy.role.replace(/_/g, ' ')}</div>
              )}
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Trip</div>
              <div className="text-xs font-bold text-[#2c5173] bg-slate-100 px-2 py-0.5 rounded inline-block truncate max-w-full">
                {dispute.trip?.tripNumber || (dispute.tripId ? dispute.tripId.slice(0, 12) + '...' : 'N/A')}
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <div className="text-xs font-black text-gray-900 uppercase tracking-widest mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" /> Reason / Description
            </div>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
              {dispute.reason || 'No description provided.'}
            </p>
          </div>

          {/* Timeline */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Created</div>
              <div className="text-xs font-bold text-gray-900">{formatDate(dispute.createdAt)}</div>
              <div className="text-[10px] text-gray-400">{getTimeAgo(dispute.createdAt)}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Last Updated</div>
              <div className="text-xs font-bold text-gray-900">{formatDate(dispute.updatedAt)}</div>
              <div className="text-[10px] text-gray-400">{getTimeAgo(dispute.updatedAt)}</div>
            </div>
          </div>

          {/* Resolution */}
          {dispute.resolution && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="text-xs font-black text-green-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Resolution
              </div>
              <p className="text-sm text-green-700 font-medium">{dispute.resolution}</p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 border-t border-gray-100 flex gap-3">
            {dispute.status !== 'RESOLVED' && dispute.status !== 'REJECTED' ? (
              <button
                onClick={() => onUpdate(dispute)}
                className="flex-1 bg-gray-900 text-white py-3 rounded-xl hover:bg-gray-800 transition-all font-bold text-sm flex items-center justify-center gap-2"
              >
                <Scale className="w-4 h-4" /> Update Status
              </button>
            ) : (
              <div className="flex-1 bg-gray-100 text-gray-400 py-3 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2 cursor-not-allowed">
                <CheckCircle className="w-4 h-4" /> Case Closed
              </div>
            )}
            <button
              onClick={onClose}
              className="px-5 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-bold text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const disputeStatusVariant = (status: string) => {
  switch (status) {
    case 'OPEN': return 'warning' as const;
    case 'RESOLVED': return 'success' as const;
    case 'ESCALATED': return 'orange' as const;
    case 'REJECTED': return 'error' as const;
    default: return 'neutral' as const;
  }
};

const DisputeManagement: React.FC = () => {
  const qc = useQueryClient();

  const [selectedDispute, setSelectedDispute] = useState<AdminDispute | null>(null);
  const [showDetails, setShowDetails]     = useState(false);
  const [resolveTarget, setResolveTarget] = useState<AdminDispute | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-disputes'],
    queryFn: () => adminAPI.getDisputes().then(r => r.data),
    staleTime: 30_000,
  });

  const disputes: AdminDispute[] = data?.disputes || [];

  // ── Mutation ───────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ id, status, resolution }: { id: string; status: string; resolution?: string }) =>
      adminAPI.updateDisputeStatus(id, status, resolution),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-disputes'] });
      toast.success('Dispute updated successfully');
      setResolveTarget(null);
      setShowDetails(false);
      setSelectedDispute(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update dispute');
    },
  });

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const headers = ['ID', 'Status', 'Raised By', 'Trip', 'Reason', 'Resolution', 'Created'];
    const rows = disputes.map(d => [
      d.id,
      d.status,
      getDisplayName(d.raisedBy),
      d.trip?.tripNumber || d.tripId || '',
      d.reason || '',
      d.resolution || '',
      formatDate(d.createdAt),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'disputes.csv'; a.click();
    URL.revokeObjectURL(url);
  }, [disputes]);

  const columns: Column<AdminDispute>[] = useMemo(() => [
    {
      key: 'reason',
      label: 'Dispute',
      alwaysVisible: true,
      render: (_v, dispute) => (
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Gavel className="w-4 h-4 text-red-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 line-clamp-2 max-w-[220px]">
              {dispute.reason?.slice(0, 70) || 'No reason provided'}
              {(dispute.reason?.length || 0) > 70 ? '...' : ''}
            </p>
            <p className="text-[10px] font-mono text-gray-400 mt-0.5">{dispute.id.slice(0, 16)}...</p>
          </div>
        </div>
      ),
    },
    {
      key: 'raisedBy',
      label: 'Raised By',
      render: (_v, dispute) => {
        const raisedByName = getDisplayName(dispute.raisedBy);
        return (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-[#2c5173] font-bold text-[10px] flex-shrink-0">
              {raisedByName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">{raisedByName}</p>
              {dispute.raisedBy?.role && (
                <p className="text-[10px] text-gray-400 capitalize">{dispute.raisedBy.role.replace(/_/g, ' ')}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'tripId',
      label: 'Trip',
      render: (_v, dispute) => (
        <span className="text-xs font-bold text-[#2c5173] bg-slate-100 px-2 py-1 rounded-lg whitespace-nowrap">
          {dispute.trip?.tripNumber || (dispute.tripId ? dispute.tripId.slice(0, 10) + '...' : 'N/A')}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_v, dispute) => {
        const cfg = getStatusCfg(dispute.status);
        return (
          <StatusBadge
            variant={disputeStatusVariant(dispute.status)}
            label={cfg.label}
            icon={cfg.icon}
          />
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (_v, dispute) => (
        <div>
          <div className="text-[10px] text-gray-500 flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> {getTimeAgo(dispute.createdAt)}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">{formatDate(dispute.createdAt)}</div>
        </div>
      ),
    },
  ], []);

  const rowActions: TableAction<AdminDispute>[] = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: <Eye className="w-3.5 h-3.5" />,
      onClick: (dispute) => { setSelectedDispute(dispute); setShowDetails(true); },
    },
    {
      key: 'update',
      label: 'Update Status',
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      variant: 'success',
      hidden: (d) => d.status === 'RESOLVED' || d.status === 'REJECTED',
      onClick: (dispute) => setResolveTarget(dispute),
    },
  ], []);

  // ── Loading / Error ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <AdminPageLayout title="Dispute Management" description="Manage and resolve platform disputes">
        <ModernLoader isLoading type="table" />
      </AdminPageLayout>
    );
  }

  if (error) {
    return (
      <AdminPageLayout title="Dispute Management" description="Manage and resolve platform disputes">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-4">
          <AlertTriangle className="text-red-500 flex-shrink-0" size={24} />
          <div>
            <p className="font-semibold text-red-800">Failed to load disputes</p>
            <p className="text-sm text-red-600 mt-1">{(error as any)?.message}</p>
          </div>
          <button
            onClick={() => refetch()}
            className="ml-auto px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </AdminPageLayout>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AdminPageLayout
      title={<TranslatedText text="Dispute Management" />}
      description={<TranslatedText text="Manage and resolve platform disputes" />}
    >
      <div className="safe-bottom">
      <StandardDataTable
        embedded
        columns={columns}
        data={disputes}
        getRowId={(row) => row.id}
        searchPlaceholder="Search by reason, ID, user, or trip number..."
        searchKeys={['reason', 'id', 'status', 'tripId']}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'OPEN', label: 'Open' },
              { value: 'RESOLVED', label: 'Resolved' },
              { value: 'ESCALATED', label: 'Escalated' },
              { value: 'REJECTED', label: 'Rejected' },
            ],
          },
        ]}
        defaultSortKey="createdAt"
        defaultSortDirection="desc"
        rowActions={rowActions}
        onRefresh={() => refetch()}
        onExport={handleExport}
        emptyMessage="No disputes found"
        ariaLabel="Dispute management"
      />

      {/* Detail Modal */}
      {showDetails && selectedDispute && (
        <DetailModal
          dispute={selectedDispute}
          onClose={() => { setShowDetails(false); setSelectedDispute(null); }}
          onUpdate={d => { setResolveTarget(d); setShowDetails(false); }}
        />
      )}

      {/* Resolve Modal */}
      {resolveTarget && (
        <ResolveModal
          dispute={resolveTarget}
          loading={updateMutation.isPending}
          onClose={() => setResolveTarget(null)}
          onConfirm={(status, resolution) =>
            updateMutation.mutate({ id: resolveTarget.id, status, resolution })
          }
        />
      )}
      </div>
    </AdminPageLayout>
  );
};

export default DisputeManagement;
