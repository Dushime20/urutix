import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ClipboardCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  FileText,
  Truck,
  User,
  Send,
  RefreshCw,
  ArrowRight,
  PenLine,
  ShieldCheck,
  ListChecks,
  Eye,
} from 'lucide-react';
import {
  cargoInspectionApi,
  type ShipmentInspectionOverview,
  type InspectionRecord,
  type MarkReadyForReInspectionPayload,
} from '../../../services/cargoInspectionApi';
import { cn } from '@/utils/cn';
import { useAuth } from '../../../contexts/AuthContext';
import ModernLoader from '../../../components/common/ModernLoader';
import {
  StandardDataTable,
  StatusBadge,
  type Column,
  type TableAction,
  type StatusBadgeVariant,
} from '../../../components/EnliteUI/Tables';

type TypeFilter = 'all' | 'pre' | 'post' | 'action';

function preTripBadgeVariant(status: string): StatusBadgeVariant {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'FAILED':
    case 'AWAITING_RESOLUTION':
      return 'error';
    case 'READY_FOR_RE_INSPECTION':
      return 'info';
    case 'AWAITING_CARGO_OWNER_APPROVAL':
      return 'purple';
    case 'IN_PROGRESS':
    case 'TRUCK_INSPECTION_COMPLETED':
      return 'warning';
    default:
      return 'neutral';
  }
}

function postTripBadgeVariant(status: string): StatusBadgeVariant {
  switch (status) {
    case 'COMPLETED':
    case 'APPROVED':
      return 'success';
    case 'DISPUTED':
    case 'FAILED':
      return 'error';
    case 'IN_PROGRESS':
    case 'PENDING':
      return 'warning';
    default:
      return 'neutral';
  }
}

const PRE_TRIP_STATUS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: 'Draft', color: 'bg-gray-100 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700', icon: <Clock className="w-3.5 h-3.5" /> },
  TRUCK_INSPECTION_COMPLETED: { label: 'Truck Inspection Completed', color: 'bg-sky-100 text-sky-800 border-sky-200', icon: <Truck className="w-3.5 h-3.5" /> },
  IN_PROGRESS: { label: 'Cargo Inspection In Progress', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Clock className="w-3.5 h-3.5" /> },
  FAILED: { label: 'Issue Reported', color: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle className="w-3.5 h-3.5" /> },
  AWAITING_RESOLUTION: { label: 'Awaiting Resolution', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  READY_FOR_RE_INSPECTION: { label: 'Ready for Re-Inspection', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: <RefreshCw className="w-3.5 h-3.5" /> },
  AWAITING_CARGO_OWNER_APPROVAL: { label: 'Waiting for Approval', color: 'bg-violet-100 text-violet-800 border-violet-200', icon: <Clock className="w-3.5 h-3.5" /> },
  APPROVED: { label: 'Approved — Ready to Start Trip', color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle className="w-3.5 h-3.5" /> },
};

const POST_STATUS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  NOT_STARTED: { label: 'Not Started', color: 'bg-gray-100 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700', icon: <Clock className="w-3.5 h-3.5" /> },
  PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Clock className="w-3.5 h-3.5" /> },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <ClipboardCheck className="w-3.5 h-3.5" /> },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  DISPUTED: { label: 'Disputed', color: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle className="w-3.5 h-3.5" /> },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle className="w-3.5 h-3.5" /> },
};

function getDocUrl(url: string) {
  if (url.startsWith('http')) return url;
  const base = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ?? 'http://localhost:3001';
  return `${base}/${url}`;
}

function needsResolution(status: string) {
  return status === 'AWAITING_RESOLUTION' || status === 'FAILED';
}

function getOpenIssues(history: InspectionRecord[]) {
  const latestFailed = history.find(
    (record) => record.decision === 'FAILED' || record.status === 'FAILED',
  );
  return (latestFailed?.issues ?? []).filter((issue) => !issue.resolved);
}

function formatIssueType(type: string) {
  return type.replace(/_/g, ' ');
}

function IssueResolutionPanel({
  issues,
  resolutionNotes,
  onResolutionNotesChange,
  acknowledgedIssues,
  onToggleIssue,
  correctiveActions,
  onCorrectiveActionChange,
  onSubmit,
  isPending,
  compact,
  className,
}: {
  issues: NonNullable<InspectionRecord['issues']>;
  resolutionNotes: string;
  onResolutionNotesChange: (value: string) => void;
  acknowledgedIssues: Set<string>;
  onToggleIssue: (issueId: string) => void;
  correctiveActions: Record<string, string>;
  onCorrectiveActionChange: (issueId: string, value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  compact?: boolean;
  className?: string;
}) {
  const allAcknowledged =
    issues.length === 0 || issues.every((issue) => acknowledgedIssues.has(issue.id));
  const canSubmit = resolutionNotes.trim().length >= 10 && allAcknowledged;

  return (
    <div className={cn(
      'border border-amber-200 rounded-xl overflow-hidden flex flex-col max-h-[min(62vh,560px)]',
      className,
    )}>
      <div className="bg-amber-50 px-4 py-3 shrink-0">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 rounded-lg shrink-0">
            <ShieldCheck className="w-4 h-4 text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900">Corrective Action Required</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Review each reported issue, document corrective actions taken, then release the shipment for driver re-inspection.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="px-4 py-4 space-y-4 bg-white dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 sticky top-0 bg-white dark:bg-slate-900 pb-2 z-10">
          <span className={cn('flex items-center gap-1', issues.length > 0 && allAcknowledged ? 'text-amber-700' : '')}>
            <ListChecks className="w-3.5 h-3.5" /> 1. Acknowledge Issues
          </span>
          <ArrowRight className="w-3 h-3" />
          <span className={cn('flex items-center gap-1', resolutionNotes.trim() ? 'text-amber-700' : '')}>
            <PenLine className="w-3.5 h-3.5" /> 2. Document Actions
          </span>
          <ArrowRight className="w-3 h-3" />
          <span className={cn('flex items-center gap-1', canSubmit ? 'text-amber-700' : '')}>
            3. Release for Re-Inspection
          </span>
        </div>

        {issues.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Reported Issues ({issues.length})
            </p>
            <div className="max-h-72 overflow-y-auto overscroll-contain space-y-3 pr-1 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 p-2">
              {issues.map((issue) => {
              const acknowledged = acknowledgedIssues.has(issue.id);
              return (
                <div
                  key={issue.id}
                  className={cn(
                    'rounded-xl border p-3 transition-colors',
                    acknowledged ? 'border-green-200 bg-green-50/50' : 'border-rose-100 bg-rose-50/40',
                  )}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acknowledged}
                      onChange={() => onToggleIssue(issue.id)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2c5173] focus:ring-[#2c5173]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-gray-800">{formatIssueType(issue.type)}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-rose-200 text-rose-800 rounded font-bold">
                          {issue.severity}
                        </span>
                        {acknowledged && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-bold">
                            Acknowledged
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-slate-300 mt-1">{issue.description}</p>
                      {issue.actionRequired && (
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                          <span className="font-semibold">Required action: </span>
                          {issue.actionRequired}
                        </p>
                      )}
                    </div>
                  </label>

                  {acknowledged && (
                    <div className="mt-3 ml-7">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Corrective action taken
                      </label>
                      <input
                        type="text"
                        value={correctiveActions[issue.id] ?? ''}
                        onChange={(e) => onCorrectiveActionChange(issue.id, e.target.value)}
                        placeholder="e.g. Replaced damaged straps, updated manifest weight..."
                        className="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                  )}
                </div>
              );
            })}
              </div>
            </div>
          )}

        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Corrective Action Summary <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={compact ? 2 : 3}
            value={resolutionNotes}
            onChange={(e) => onResolutionNotesChange(e.target.value)}
            placeholder="Summarize all corrective actions taken. This is recorded in the inspection audit trail and shared with the driver."
            className="mt-1.5 w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Minimum 10 characters. Include what was corrected and any supporting documentation references.
          </p>
        </div>

        {!compact && (
          <button
            onClick={onSubmit}
            disabled={isPending || !canSubmit}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2c5173] hover:bg-[#234261] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {isPending
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Recording corrective actions…</>
              : <><Send className="w-4 h-4" /> Release for Driver Re-Inspection</>
            }
          </button>
        )}
        </div>
      </div>
    </div>
  );
}

function TimelineStep({
  label,
  sublabel,
  status,
  statusConfig,
  isLast,
  active,
}: {
  label: string;
  sublabel?: string;
  status: string;
  statusConfig: typeof PRE_TRIP_STATUS;
  isLast?: boolean;
  active?: boolean;
}) {
  const cfg = statusConfig[status] ?? statusConfig.PENDING ?? statusConfig.NOT_STARTED;
  return (
    <div className={cn('flex gap-3', !isLast && 'pb-4')}>
      <div className="flex flex-col items-center">
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center border-2',
          active ? 'border-[#2c5173] bg-[#2c5173]/10' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900',
        )}>
          {cfg.icon}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 mt-1 min-h-[24px]" />}
      </div>
      <div className="flex-1 pt-0.5">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
        {sublabel && <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{sublabel}</p>}
        <span className={cn('inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border', cfg.color)}>
          {cfg.icon}
          {cfg.label}
        </span>
      </div>
    </div>
  );
}

export default function CargoCustomsInspectionsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isBroker = user?.role === 'BROKER';
  const basePath = isBroker ? '/dashboard/broker' : '/dashboard';
  const { id: urlLoadId } = useParams<{ id: string }>();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [selectedShipment, setSelectedShipment] = useState<ShipmentInspectionOverview | null>(null);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['cargoOwnerInspectionOverview'],
    queryFn: async () => {
      const res = await cargoInspectionApi.getOverview();
      return res.data?.data;
    },
  });

  const shipments = data?.shipments ?? [];
  useEffect(() => {
    if (urlLoadId && shipments.length > 0 && !selectedShipment) {
      const match = shipments.find((s) => s.loadId === urlLoadId);
      if (match) setSelectedShipment(match);
    }
  }, [urlLoadId, shipments, selectedShipment]);

  const filtered = useMemo(() => {
    return shipments.filter((s) => {
      if (typeFilter === 'pre') {
        return s.preTrip.historyCount > 0 || s.preTrip.workflowStatus !== 'PENDING';
      }
      if (typeFilter === 'post') {
        return s.postTrip.status !== 'NOT_STARTED';
      }
      if (typeFilter === 'action') {
        return s.requiresAction;
      }
      return true;
    });
  }, [shipments, typeFilter]);

  const handleExport = () => {
    if (filtered.length === 0) return;

    const headers = [
      'Cargo',
      'Reference',
      'Load Status',
      'Pre-Trip Status',
      'Post-Delivery Status',
      'Driver',
      'Receiver',
      'Action Required',
      'Updated',
    ];
    const rows = filtered.map((s) => [
      s.loadTitle || '',
      s.loadReference || '',
      s.loadStatus || '',
      PRE_TRIP_STATUS[s.preTrip.workflowStatus]?.label ?? s.preTrip.workflowStatus,
      POST_STATUS[s.postTrip.status]?.label ?? s.postTrip.status,
      s.driver?.name || '',
      s.receiver?.name || '',
      s.requiresAction ? 'Yes' : 'No',
      s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : '',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cargo-inspections-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openShipment = (shipment: ShipmentInspectionOverview) => {
    setSelectedShipment(shipment);
  };

  const columns: Column<ShipmentInspectionOverview>[] = [
    {
      key: 'loadTitle',
      label: 'CARGO IDENTITY',
      sortable: true,
      render: (_: unknown, shipment: ShipmentInspectionOverview) => {
        const title = shipment.loadTitle || 'Unnamed Shipment';
        const initial = (title[0] || 'C').toUpperCase();
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0',
                shipment.requiresAction ? 'bg-amber-500' : 'bg-[#345E85]',
              )}
            >
              {initial}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-[11px] truncate">
                {title}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">
                {shipment.loadReference
                  ? `Ref · ${shipment.loadReference}`
                  : `Load · ${shipment.loadId.slice(0, 8)}`}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'preTrip.workflowStatus',
      label: 'PRE-TRIP',
      sortable: true,
      render: (_: unknown, shipment: ShipmentInspectionOverview) => {
        const status = shipment.preTrip.workflowStatus;
        const label = PRE_TRIP_STATUS[status]?.label ?? status;
        return (
          <div className="flex flex-col gap-1.5">
            {shipment.requiresAction && (
              <StatusBadge
                label="Action Required"
                variant="warning"
                icon={<AlertTriangle size={10} />}
              />
            )}
            <StatusBadge label={label} variant={preTripBadgeVariant(status)} />
          </div>
        );
      },
    },
    {
      key: 'postTrip.status',
      label: 'POST-DELIVERY',
      sortable: true,
      render: (_: unknown, shipment: ShipmentInspectionOverview) => {
        const status = shipment.postTrip.status;
        const label = POST_STATUS[status]?.label ?? status;
        return <StatusBadge label={label} variant={postTripBadgeVariant(status)} />;
      },
    },
    {
      key: 'driver.name',
      label: 'PARTIES',
      sortable: true,
      render: (_: unknown, shipment: ShipmentInspectionOverview) => (
        <div className="flex flex-col gap-1">
          {shipment.driver?.name ? (
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <Truck size={12} className="text-slate-400 shrink-0" />
              <span className="text-[11px] font-bold truncate max-w-[180px]">{shipment.driver.name}</span>
            </div>
          ) : (
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No driver</span>
          )}
          {shipment.receiver?.name && (
            <div className="flex items-center gap-2 text-slate-500">
              <User size={12} className="text-slate-400 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-widest truncate max-w-[180px]">
                {shipment.receiver.name}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'updatedAt',
      label: 'UPDATED',
      sortable: true,
      render: (_: unknown, shipment: ShipmentInspectionOverview) => (
        <div className="flex flex-col">
          <span className="font-black text-slate-900 dark:text-white text-[11px]">
            {shipment.updatedAt
              ? new Date(shipment.updatedAt).toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
            <Clock size={10} />
            {shipment.loadStatus?.replace(/_/g, ' ') || 'Status'}
          </span>
        </div>
      ),
    },
  ];

  const rowActions: TableAction<ShipmentInspectionOverview>[] = [
    {
      key: 'view',
      label: 'View Details',
      icon: <Eye size={14} />,
      onClick: (shipment) => openShipment(shipment),
    },
  ];

  if (isLoading && shipments.length === 0) {
    return <ModernLoader isLoading={true} text="Synchronizing_Inspections" />;
  }

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-8 md:p-12 space-y-8 sm:space-y-12 overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 flex items-center justify-center shadow-sm">
              <ClipboardCheck className="w-5 h-5 sm:w-7 sm:h-7 text-[#345E85]" />
            </div>
            <h1 className="text-xl sm:text-4xl md:text-5xl font-black text-[#0f172a] tracking-tight">
              Cargo <span className="text-[#345E85]">Inspections</span>
            </h1>
          </div>
          <p className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest sm:tracking-[0.2em] max-w-xl">
            {isBroker
              ? 'Track pre-trip and post-delivery inspections on your brokered loads'
              : 'Track pre-trip and post-delivery inspections on your cargo'}
          </p>
        </div>
      </div>

      <div className="space-y-8 animate-in fade-in duration-500">
        {error ? (
          <div className="text-center py-20 text-red-500 text-sm">
            Failed to load inspections. Please try again.
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 block mx-auto text-[#345E85] font-bold uppercase tracking-widest text-[10px]"
            >
              Retry
            </button>
          </div>
        ) : (
          <StandardDataTable
            title="Inspection Management Console"
            headerColor="primary"
            columns={columns}
            data={filtered}
            loading={isLoading || isFetching}
            getRowId={(row) => row.loadId}
            searchable
            searchPlaceholder="Search cargo, reference, driver or receiver…"
            searchKeys={['loadTitle', 'loadReference', 'loadStatus', 'driver.name', 'receiver.name']}
            toolbarExtra={
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                className="h-9 px-3 text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#345E85]/30"
              >
                <option value="all">All Inspections</option>
                <option value="pre">Pre-Trip (Driver)</option>
                <option value="post">Post-Delivery (Receiver)</option>
                <option value="action">Needs My Action</option>
              </select>
            }
            pagination
            pageSize={10}
            columnVisibility
            stickyHeader
            striped
            hoverable
            emptyMessage={
              shipments.length === 0
                ? 'No cargo inspections yet. When drivers or receivers submit inspections, they will appear here.'
                : 'No shipments match your filters.'
            }
            onExport={handleExport}
            exportLabel="Export Inspections"
            onRefresh={() => {
              queryClient.invalidateQueries({ queryKey: ['cargoOwnerInspectionOverview'] });
              refetch();
            }}
            onRowClick={(row) => openShipment(row)}
            rowClassName={(row) =>
              row.requiresAction ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
            }
            rowActions={rowActions}
            ariaLabel="Inspection Management Console"
          />
        )}
      </div>

      {selectedShipment && (
        <ShipmentDetailModal
          shipment={selectedShipment}
          autoOpenAction={!!urlLoadId}
          onClose={() => {
            setSelectedShipment(null);
            if (urlLoadId) navigate(`${basePath}/customs-inspections`);
          }}
        />
      )}
    </div>
  );
}

function ShipmentDetailModal({
  shipment,
  onClose,
  autoOpenAction,
}: {
  shipment: ShipmentInspectionOverview;
  onClose: () => void;
  autoOpenAction?: boolean;
}) {
  const qc = useQueryClient();
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showApprovalForm, setShowApprovalForm] = useState(
    autoOpenAction && shipment.preTrip.workflowStatus === 'AWAITING_CARGO_OWNER_APPROVAL',
  );
  const [acknowledgedIssues, setAcknowledgedIssues] = useState<Set<string>>(new Set());
  const [correctiveActions, setCorrectiveActions] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'timeline' | 'pre' | 'post'>(
    autoOpenAction && needsResolution(shipment.preTrip.workflowStatus) ? 'pre' : 'timeline',
  );

  const openIssues = useMemo(
    () => getOpenIssues(shipment.preTrip.history),
    [shipment.preTrip.history],
  );

  const canResolve = needsResolution(shipment.preTrip.workflowStatus);
  const canApprove = shipment.preTrip.workflowStatus === 'AWAITING_CARGO_OWNER_APPROVAL';
  const isReadyForReInspection = shipment.preTrip.workflowStatus === 'READY_FOR_RE_INSPECTION';

  const allIssuesAcknowledged =
    openIssues.length === 0 || openIssues.every((issue) => acknowledgedIssues.has(issue.id));
  const canSubmitResolution = resolutionNotes.trim().length >= 10 && allIssuesAcknowledged;

  const resolveMutation = useMutation({
    mutationFn: (payload: MarkReadyForReInspectionPayload) =>
      cargoInspectionApi.markReadyForReInspection(shipment.loadId, payload),
    onSuccess: () => {
      toast.success('Corrective actions recorded. The assigned driver has been notified to re-inspect.');
      setResolutionNotes('');
      setAcknowledgedIssues(new Set());
      setCorrectiveActions({});
      qc.invalidateQueries({ queryKey: ['cargoOwnerInspectionOverview'] });
      onClose();
    },
    onError: (error: { response?: { data?: { message?: string | string[] } } }) => {
      const message = error.response?.data?.message;
      toast.error(
        Array.isArray(message) ? message.join(', ') : message || 'Failed to submit resolution. Please try again.',
      );
    },
  });

  const approveMutation = useMutation({
    mutationFn: (notes?: string) =>
      cargoInspectionApi.approvePreTripInspection(shipment.loadId, notes),
    onSuccess: () => {
      toast.success('Green light given. Driver has been notified they may start shipping.');
      setApprovalNotes('');
      setShowApprovalForm(false);
      qc.invalidateQueries({ queryKey: ['cargoOwnerInspectionOverview'] });
      onClose();
    },
    onError: () => toast.error('Failed to approve inspection. Please try again.'),
  });

  const toggleIssue = (issueId: string) => {
    setAcknowledgedIssues((current) => {
      const next = new Set(current);
      if (next.has(issueId)) {
        next.delete(issueId);
      } else {
        next.add(issueId);
      }
      return next;
    });
  };

  const handleCorrectiveActionChange = (issueId: string, value: string) => {
    setCorrectiveActions((current) => ({ ...current, [issueId]: value }));
  };

  const handleResolve = () => {
    if (!canSubmitResolution) {
      if (!allIssuesAcknowledged) {
        toast.error('Please acknowledge all reported issues before continuing.');
        return;
      }
      toast.error('Please provide a corrective action summary (minimum 10 characters).');
      return;
    }

    resolveMutation.mutate({
      resolutionNotes: resolutionNotes.trim(),
      resolvedIssues: openIssues.map((issue) => ({
        issueId: issue.id,
        correctiveAction: correctiveActions[issue.id]?.trim() || undefined,
      })),
    });
  };

  const handleApprove = () => {
    const notes = approvalNotes.trim();
    approveMutation.mutate(notes || undefined);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">{shipment.loadTitle}</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {shipment.loadReference ? `Ref: ${shipment.loadReference}` : `Load ID: ${shipment.loadId.slice(0, 8)}`}
              {' · '}
              Status: {shipment.loadStatus}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:text-slate-300 dark:hover:text-slate-300">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        {canResolve && (
          <IssueResolutionPanel
            className="mx-6 mt-4"
            issues={openIssues}
            resolutionNotes={resolutionNotes}
            onResolutionNotesChange={setResolutionNotes}
            acknowledgedIssues={acknowledgedIssues}
            onToggleIssue={toggleIssue}
            correctiveActions={correctiveActions}
            onCorrectiveActionChange={handleCorrectiveActionChange}
            onSubmit={handleResolve}
            isPending={resolveMutation.isPending}
          />
        )}

        {isReadyForReInspection && (
          <div className="mx-6 mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
            <div className="flex items-start gap-3">
              <RefreshCw className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-indigo-900">Released for Driver Re-Inspection</p>
                <p className="text-xs text-indigo-700 mt-1">
                  Corrective actions were recorded
                  {shipment.preTrip.readyForReInspectionAt
                    ? ` on ${new Date(shipment.preTrip.readyForReInspectionAt).toLocaleString()}`
                    : ''}.
                  The driver has been notified to perform a new pre-trip inspection.
                </p>
                {shipment.preTrip.resolutionNotes && (
                  <p className="text-xs text-indigo-800 mt-2 bg-white/70 rounded-lg p-2 border border-indigo-100">
                    <span className="font-semibold">Corrective action summary: </span>
                    {shipment.preTrip.resolutionNotes}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action banner — driver submitted, awaiting green light */}
        {canApprove && (
          <div className="mx-6 mt-4 border border-violet-200 rounded-xl overflow-hidden">
            <div className="bg-violet-50 px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-violet-600" />
                <span className="text-sm font-semibold text-violet-800">
                  Driver Pre-Trip Inspection Complete — Give Green Light
                </span>
              </div>
              <button
                onClick={() => setShowApprovalForm((f) => !f)}
                className="text-xs font-bold text-violet-700 bg-violet-100 hover:bg-violet-200 px-3 py-1 rounded-lg transition-colors shrink-0"
              >
                {showApprovalForm ? 'Cancel' : 'Approve & Start Shipping'}
              </button>
            </div>
            {showApprovalForm && (
              <div className="px-4 py-3 space-y-3 bg-white dark:bg-slate-900">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Review the driver&apos;s pre-trip inspection in the Pre-Trip tab. Once satisfied, give the green light so the driver can load cargo and start the trip.
                </p>
                <textarea
                  rows={2}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Optional notes for the driver (e.g. Proceed with loading at Gate 3...)"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                />
                <button
                  onClick={handleApprove}
                  disabled={approveMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {approveMutation.isPending
                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> Approving…</>
                    : <><CheckCircle className="w-4 h-4" /> Give Green Light — Start Shipping</>
                  }
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="px-6 pt-4 flex gap-2 border-b border-gray-100 dark:border-slate-800">
          {(['timeline', 'pre', 'post'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-colors',
                activeTab === tab
                  ? 'bg-[#2c5173] text-white'
                  : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100',
              )}
            >
              {tab === 'timeline' ? 'Process Timeline' : tab === 'pre' ? 'Pre-Trip (Driver)' : 'Post-Delivery (Receiver)'}
            </button>
          ))}
        </div>

        <div className="px-6 py-4">
          {activeTab === 'timeline' && (
            <div className="space-y-1">
              <TimelineStep
                label="Pre-Trip Inspection"
                sublabel={shipment.driver?.name ? `Driver: ${shipment.driver.name}` : 'Submitted by driver before trip start'}
                status={shipment.preTrip.workflowStatus}
                statusConfig={PRE_TRIP_STATUS}
                active={shipment.preTrip.workflowStatus !== 'PENDING'}
              />
              <TimelineStep
                label="In Transit"
                sublabel={`Load status: ${shipment.loadStatus}`}
                status={shipment.preTrip.workflowStatus === 'APPROVED' ? 'APPROVED' : 'PENDING'}
                statusConfig={PRE_TRIP_STATUS}
              />
              <TimelineStep
                label="Post-Delivery Inspection"
                sublabel={shipment.receiver?.name ? `Receiver: ${shipment.receiver.name}` : 'Submitted by cargo receiver at delivery'}
                status={shipment.postTrip.status}
                statusConfig={POST_STATUS}
                isLast
                active={shipment.postTrip.status !== 'NOT_STARTED'}
              />

              {shipment.preTrip.resolutionNotes && (
                <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-800">
                  <span className="font-semibold">Corrective action summary: </span>
                  {shipment.preTrip.resolutionNotes}
                </div>
              )}

              {shipment.preTrip.approvalNotes && (
                <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-100 text-sm text-green-800">
                  <span className="font-semibold">Your approval notes: </span>
                  {shipment.preTrip.approvalNotes}
                </div>
              )}
            </div>
          )}

          {activeTab === 'pre' && (
            <InspectionHistoryPanel
              title="Pre-Trip Inspection History"
              subtitle="Driver inspections before loading and trip start"
              history={shipment.preTrip.history}
              emptyMessage="No pre-trip inspection submitted yet. Driver will inspect cargo before starting the trip."
            />
          )}

          {activeTab === 'post' && (
            <InspectionHistoryPanel
              title="Post-Delivery Inspection History"
              subtitle="Receiver inspections at delivery"
              history={shipment.postTrip.history}
              emptyMessage="No post-delivery inspection yet. Receiver will inspect cargo upon delivery."
              showReceiver
              receiver={shipment.receiver}
            />
          )}
        </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-white dark:bg-slate-900 rounded-b-2xl">
          <div className="text-xs text-gray-500 dark:text-slate-400">
            {canResolve && 'Complete corrective actions above to release the driver for re-inspection.'}
            {canApprove && 'Review the inspection and approve when ready to start shipping.'}
          </div>
          <div className="flex items-center gap-2">
            {canResolve && (
              <button
                onClick={handleResolve}
                disabled={resolveMutation.isPending || !canSubmitResolution}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#2c5173] hover:bg-[#234261] disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2"
              >
                {resolveMutation.isPending
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Submitting…</>
                  : <><Send className="w-4 h-4" /> Release for Re-Inspection</>
                }
              </button>
            )}
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 rounded-lg transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InspectionHistoryPanel({
  title,
  subtitle,
  history,
  emptyMessage,
  showReceiver,
  receiver,
}: {
  title: string;
  subtitle: string;
  history: InspectionRecord[];
  emptyMessage: string;
  showReceiver?: boolean;
  receiver?: ShipmentInspectionOverview['receiver'];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(history[0]?.id ?? null);

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <ClipboardCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-xs text-gray-500 dark:text-slate-400">{subtitle}</p>
      </div>

      {showReceiver && receiver && (
        <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Receiver</p>
          <div className="flex flex-wrap gap-3 text-sm text-gray-700 dark:text-slate-300">
            {receiver.name && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{receiver.name}</span>}
            {receiver.email && <span>{receiver.email}</span>}
            {receiver.phone && <span>{receiver.phone}</span>}
          </div>
        </div>
      )}

      {history.map((record) => {
        const isExpanded = expandedId === record.id;
        const statusCfg = record.inspectionType === 'PRE_TRIP'
          ? PRE_TRIP_STATUS[record.status] ?? PRE_TRIP_STATUS.PENDING
          : POST_STATUS[record.status] ?? POST_STATUS.PENDING;

        return (
          <div key={record.id} className="border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden">
            <button
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-left"
              onClick={() => setExpandedId(isExpanded ? null : record.id)}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border', statusCfg.color)}>
                    Attempt #{record.attemptNumber} · {statusCfg.label}
                  </span>
                  {record.decision && (
                    <span className="text-[10px] text-gray-400 uppercase">{record.decision}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  {new Date(record.completedAt || record.createdAt).toLocaleString()}
                </p>
              </div>
              <ChevronRight className={cn('w-4 h-4 text-gray-400 transition-transform', isExpanded && 'rotate-90')} />
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 border-t border-gray-50 space-y-4">
                {record.overallNotes && (
                  <div className="pt-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Notes</p>
                    <p className="text-sm text-gray-700 dark:text-slate-300 bg-amber-50 rounded-lg p-3 border border-amber-100">{record.overallNotes}</p>
                  </div>
                )}

                {record.issues && record.issues.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Issues ({record.issues.length})
                    </p>
                    <div className="space-y-2">
                      {record.issues.map((issue) => (
                        <div
                          key={issue.id}
                          className={cn(
                            'p-3 rounded-lg border',
                            issue.resolved
                              ? 'bg-green-50 border-green-100'
                              : 'bg-rose-50 border-rose-100',
                          )}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn('text-xs font-bold', issue.resolved ? 'text-green-800' : 'text-rose-700')}>
                              {formatIssueType(issue.type)}
                            </span>
                            <span className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded font-bold',
                              issue.resolved ? 'bg-green-200 text-green-800' : 'bg-rose-200 text-rose-800',
                            )}>
                              {issue.severity}
                            </span>
                            {issue.resolved && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-bold flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Resolved
                              </span>
                            )}
                          </div>
                          <p className={cn('text-sm mt-1', issue.resolved ? 'text-green-800' : 'text-rose-700')}>
                            {issue.description}
                          </p>
                          {issue.actionRequired && !issue.resolved && (
                            <p className="text-xs text-rose-600 mt-1">
                              <span className="font-semibold">Action: </span>
                              {issue.actionRequired}
                            </p>
                          )}
                          {issue.resolved && issue.resolutionNotes && (
                            <p className="text-xs text-green-700 mt-2 bg-white/60 rounded-lg p-2 border border-green-100">
                              <span className="font-semibold">Corrective action: </span>
                              {issue.resolutionNotes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {record.checklist?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Checklist ({record.verifiedCount}/{record.totalItems} verified)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {record.checklist.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            'flex items-start gap-2 p-2.5 rounded-lg border text-xs',
                            item.verified ? 'bg-green-50/50 border-green-100' : item.discrepancy ? 'bg-rose-50/50 border-rose-100' : 'bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-800',
                          )}
                        >
                          {item.verified ? <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" /> : item.discrepancy ? <XCircle className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" /> : <Clock className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />}
                          <div>
                            <p className="font-bold text-gray-700 dark:text-slate-300">{item.label}</p>
                            {item.notes && <p className="text-gray-500 dark:text-slate-400 italic mt-0.5">"{item.notes}"</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {record.discrepancies && record.discrepancies.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">Discrepancies</p>
                    {record.discrepancies.map((d, i) => (
                      <div key={i} className="p-3 bg-rose-50 rounded-lg border border-rose-100 mb-2">
                        <p className="text-xs font-bold text-rose-700">{d.itemLabel}</p>
                        <p className="text-[10px] text-rose-600 mt-1">Expected: {String(d.originalValue)}</p>
                        {d.notes && <p className="text-[10px] text-rose-600 italic mt-1">"{d.notes}"</p>}
                      </div>
                    ))}
                  </div>
                )}

                {record.documents && record.documents.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Evidence ({record.documents.length})
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {record.documents.map((doc, i) => (
                        <a key={doc.id || i} href={getDocUrl(doc.url)} target="_blank" rel="noreferrer" className="group">
                          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden hover:border-[#2c5173] transition-all">
                            {doc.type === 'photo' ? (
                              <div className="h-20 overflow-hidden">
                                <img src={getDocUrl(doc.url)} alt={doc.label || 'Photo'} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              </div>
                            ) : doc.type === 'signature' ? (
                              <div className="h-20 bg-gray-50 dark:bg-slate-800/50 flex items-center justify-center"><PenLine className="w-5 h-5 text-gray-400" /></div>
                            ) : (
                              <div className="h-20 bg-gray-50 dark:bg-slate-800/50 flex items-center justify-center"><FileText className="w-5 h-5 text-gray-400" /></div>
                            )}
                            <p className="text-[9px] font-bold text-gray-600 dark:text-slate-300 p-1.5 truncate">{doc.label || doc.type}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
