// init

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FaBox,
  FaEye,
  FaTrash
} from 'react-icons/fa';
import {
  X,
  Package,
  MapPin,
  Calendar,
  User,
  Building2,
  Truck,
  AlertTriangle,
  Scale,
  DollarSign,
  Loader2
} from 'lucide-react';
import AdminPageLayout from '../components/Admin/AdminPageLayout';
import { adminAPI, type AdminLoad } from '../services/adminApi';
import toast from 'react-hot-toast';
import ModernLoader from '../components/common/ModernLoader';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../components/EnliteUI/Tables';

// ── Helpers ───────────────────────────────────────────────────────────────────

const locStr = (loc: any): string => {
  if (!loc) return '';
  if (typeof loc === 'string') return loc;
  if (typeof loc === 'object') return loc.city || loc.address || loc.name || '';
  return String(loc);
};

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—';

const fmtNum = (n?: number) => (n != null ? n.toLocaleString() : '—');

const statusCfg: Record<string, { label: string; bg: string; dot: string }> = {
  DRAFT:                { label: 'Draft',              bg: 'bg-gray-100 text-gray-700 border-gray-200',     dot: 'bg-gray-400' },
  CREATED:              { label: 'Created',            bg: 'bg-slate-100 text-slate-700 border-slate-200',  dot: 'bg-slate-400' },
  PUBLISHED:            { label: 'Published',          bg: 'bg-blue-100 text-blue-700 border-blue-200',     dot: 'bg-blue-500' },
  PENDING_CONFIRMATION: { label: 'Pending',            bg: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
  ASSIGNED:             { label: 'Assigned',           bg: 'bg-indigo-100 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
  LOADED:               { label: 'Loaded',             bg: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  IN_TRANSIT:           { label: 'In Transit',         bg: 'bg-blue-100 text-blue-800 border-blue-200',     dot: 'bg-blue-600' },
  DELIVERED:            { label: 'Delivered',          bg: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  COMPLETED:            { label: 'Completed',          bg: 'bg-green-100 text-green-700 border-green-200',  dot: 'bg-green-500' },
  CLOSED:               { label: 'Closed',             bg: 'bg-teal-100 text-teal-700 border-teal-200',     dot: 'bg-teal-500' },
  CANCELLED:            { label: 'Cancelled',          bg: 'bg-red-100 text-red-700 border-red-200',        dot: 'bg-red-500' },
};

const getStatusCfg = (s: string) =>
  statusCfg[s?.toUpperCase()] ?? { label: s?.replace(/_/g, ' ') ?? 'Unknown', bg: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-400' };

// ── Detail Modal ──────────────────────────────────────────────────────────────

function InfoRow({ label, value, icon: Icon }: { label: string; value?: string | number | null; icon?: any }) {
  if (value == null || value === '') return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      {Icon && <Icon size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />}
      <span className="text-xs font-semibold text-gray-500 w-40 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-900 dark:text-white font-medium">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{title}</p>
      {children}
    </div>
  );
}

function Badge({ label, active }: { label: string; active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
      <AlertTriangle size={9} /> {label}
    </span>
  ) : null;
}

interface LoadDetailModalProps {
  load: AdminLoad;
  onClose: () => void;
}

const LoadDetailModal: React.FC<LoadDetailModalProps> = ({ load, onClose }) => {
  const cfg = getStatusCfg(load.status);
  const origin = locStr(load.origin);
  const destination = locStr(load.destination);
  const currency = load.currencyCode || 'RWF';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-primary-800 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <Package size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                {load.title || 'Load Details'}
              </h2>
              <p className="text-primary-200 text-sm">
                {[origin, destination].filter(Boolean).join(' → ') || 'Route not specified'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.bg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-orange-50 rounded-xl p-3 text-center">
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Weight</p>
              <p className="text-sm font-black text-orange-700 mt-1">{load.weight ? `${fmtNum(load.weight)} kg` : '—'}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-[10px] font-black text-green-400 uppercase tracking-widest">Value</p>
              <p className="text-sm font-black text-green-700 mt-1">
                {(load.loadValue || load.value) ? `${currency} ${fmtNum(load.loadValue ?? load.value)}` : '—'}
              </p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Offered Price</p>
              <p className="text-sm font-black text-blue-700 mt-1">
                {load.offeredPrice ? `${currency} ${fmtNum(load.offeredPrice)}` : '—'}
              </p>
            </div>
          </div>

          {/* Special flags */}
          {(load.isHazardous || load.isFragile || load.requiresRefrigeration) && (
            <div className="flex flex-wrap gap-2">
              <Badge label="Hazardous" active={!!load.isHazardous} />
              <Badge label="Fragile" active={!!load.isFragile} />
              <Badge label="Refrigeration Required" active={!!load.requiresRefrigeration} />
            </div>
          )}

          {/* Cargo Details */}
          <Section title="Cargo Details">
            <InfoRow label="Title"          value={load.title}          icon={Package} />
            <InfoRow label="Description"    value={load.description}    icon={Package} />
            <InfoRow label="Cargo Type"     value={load.cargoType?.replace(/_/g, ' ')}     icon={Package} />
            <InfoRow label="Load Type"      value={load.loadType?.replace(/_/g, ' ')}      icon={Package} />
            <InfoRow label="Equipment Type" value={load.equipmentType?.replace(/_/g, ' ')} icon={Truck} />
            <InfoRow label="Packaging"      value={load.packagingType?.replace(/_/g, ' ')} icon={Package} />
            <InfoRow label="Pieces"         value={load.numberOfPieces}  icon={Scale} />
            <InfoRow label="Pallets"        value={load.numberOfPallets} icon={Scale} />
            <InfoRow label="Urgency"        value={load.urgencyLevel?.replace(/_/g, ' ')}  icon={AlertTriangle} />
          </Section>

          {/* Route */}
          <Section title="Route">
            <InfoRow label="Origin"      value={origin || 'Not specified'}      icon={MapPin} />
            <InfoRow label="Destination" value={destination || 'Not specified'} icon={MapPin} />
            <InfoRow label="Pickup Date"   value={fmtDate(load.pickupDate)}   icon={Calendar} />
            <InfoRow label="Delivery Date" value={fmtDate(load.deliveryDate)} icon={Calendar} />
          </Section>

          {/* Financial */}
          <Section title="Financial">
            <InfoRow label="Load Value"    value={load.loadValue  ? `${currency} ${fmtNum(load.loadValue)}`  : undefined} icon={DollarSign} />
            <InfoRow label="Offered Price" value={load.offeredPrice ? `${currency} ${fmtNum(load.offeredPrice)}` : undefined} icon={DollarSign} />
            <InfoRow label="Payment Terms" value={load.paymentTerms?.replace(/_/g, ' ')} icon={DollarSign} />
            <InfoRow label="Currency"      value={currency} icon={DollarSign} />
          </Section>

          {/* Ownership */}
          <Section title="Ownership">
            <InfoRow label="Cargo Owner"  value={load.cargoOwnerName}  icon={User} />
            <InfoRow label="Owner Email"  value={load.cargoOwnerEmail} icon={User} />
            <InfoRow label="Tenant"       value={load.tenantName}      icon={Building2} />
            <InfoRow label="Assigned Truck" value={load.truckPlate}   icon={Truck} />
          </Section>

          {/* Dates */}
          <Section title="Timestamps">
            <InfoRow label="Created"  value={fmtDate(load.createdAt)}  icon={Calendar} />
            <InfoRow label="Updated"  value={fmtDate(load.updatedAt)}  icon={Calendar} />
          </Section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Delete Confirmation Modal ─────────────────────────────────────────────────

interface DeleteConfirmModalProps {
  load: AdminLoad;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ load, deleting, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-5 bg-red-50 border-b border-red-100">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={22} className="text-red-600" />
        </div>
        <div>
          <h2 className="text-base font-black text-gray-900 dark:text-white">Delete Load</h2>
          <p className="text-sm text-gray-500">This action cannot be undone</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
          Are you sure you want to delete{' '}
          <span className="font-bold text-gray-900 dark:text-white">"{load.title || `Load #${load.id.slice(-8)}`}"</span>?
        </p>
        {load.status && !['DRAFT', 'CREATED', 'CANCELLED'].includes(load.status.toUpperCase()) && (
          <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              This load is currently <strong>{load.status.replace(/_/g, ' ')}</strong>. Deleting it may affect active trips or assignments.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3">
        <button
          onClick={onCancel}
          disabled={deleting}
          className="px-5 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={deleting}
          className="px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-60"
        >
          {deleting ? <><Loader2 size={14} className="animate-spin" /> Deleting...</> : 'Yes, Delete'}
        </button>
      </div>
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

const AdminLoads: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [loads, setLoads] = useState<AdminLoad[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [selectedLoad, setSelectedLoad] = useState<AdminLoad | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminLoad | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchLoads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getAllLoads();
      const data = response.data?.loads || [];
      setLoads(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLoads(); }, [fetchLoads]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminAPI.deleteLoad(deleteTarget.id);
      setLoads(prev => prev.filter(l => l.id !== deleteTarget.id));
      toast.success(`Load "${deleteTarget.title || 'Load'}" deleted successfully`);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete load');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    const headers = ['Title', 'Origin', 'Destination', 'Status', 'Weight (kg)', 'Value', 'Cargo Type', 'Created'];
    const rows = loads.map(l => [
      l.title || '',
      locStr(l.origin),
      locStr(l.destination),
      l.status || '',
      l.weight ?? '',
      l.loadValue ?? l.value ?? '',
      l.cargoType || '',
      fmtDate(l.createdAt),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'loads.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const uniqueStatuses = [...new Set(loads.map(l => l.status).filter(Boolean))];
  const uniqueTenants = [...new Map(loads.filter(l => l.tenantId).map(l => [l.tenantId, l.tenantName || l.tenantId])).entries()];

  const columns: Column<AdminLoad>[] = useMemo(() => [
    {
      key: 'title',
      label: 'Load',
      alwaysVisible: true,
      render: (_v, load) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
            <FaBox className="text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{load.title || `Load #${load.id.slice(-8)}`}</p>
            <p className="text-xs text-gray-400">{load.cargoType?.replace(/_/g, ' ') || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'origin',
      label: 'Route',
      render: (_v, load) => (
        <div className="text-sm">
          <p className="font-medium text-gray-800">{locStr(load.origin) || '—'}</p>
          <p className="text-gray-400 text-xs">→ {locStr(load.destination) || '—'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_v, load) => {
        const cfg = getStatusCfg(load.status);
        return <StatusBadge status={load.status} label={cfg.label} />;
      },
    },
    {
      key: 'weight',
      label: 'Weight',
      render: (_v, load) => (
        <span className="text-sm text-gray-700 dark:text-slate-300">{load.weight ? `${fmtNum(load.weight)} kg` : '—'}</span>
      ),
    },
    {
      key: 'loadValue',
      label: 'Value',
      render: (_v, load) => {
        const currency = load.currencyCode || 'RWF';
        return (
          <span className="text-sm text-gray-700 dark:text-slate-300">
            {(load.loadValue || load.value) ? `${currency} ${fmtNum(load.loadValue ?? load.value)}` : '—'}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (_v, load) => (
        <span className="text-xs text-gray-500">{fmtDate(load.createdAt)}</span>
      ),
    },
  ], []);

  const rowActions: TableAction<AdminLoad>[] = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: <FaEye size={14} />,
      onClick: (load) => setSelectedLoad(load),
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <FaTrash size={14} />,
      variant: 'danger',
      onClick: (load) => setDeleteTarget(load),
    },
  ], []);

  if (loading) return (
    <AdminPageLayout title="Load Management" description="Monitor and manage all cargo loads">
      <ModernLoader isLoading={true} type="table" />
    </AdminPageLayout>
  );

  if (error) return (
    <AdminPageLayout title="Load Management" description="Monitor and manage all cargo loads">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-4">
        <AlertTriangle className="text-red-500 flex-shrink-0" size={24} />
        <div>
          <p className="font-semibold text-red-800">Failed to load data</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
        <button onClick={fetchLoads} className="ml-auto px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-sm font-medium">Retry</button>
      </div>
    </AdminPageLayout>
  );

  return (
    <AdminPageLayout title="Load Management" description="Monitor and manage all cargo loads across the platform">
      <div className="space-y-6">
        <StandardDataTable
          columns={columns}
          data={loads}
          getRowId={(row) => row.id}
          searchPlaceholder="Search loads..."
          searchKeys={['title', 'cargoType', 'status', 'cargoOwnerName', 'tenantName']}
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: uniqueStatuses.map(s => ({ value: s, label: getStatusCfg(s).label })),
            },
            {
              key: 'tenantId',
              label: 'Tenant',
              options: uniqueTenants.map(([id, name]) => ({ value: String(id), label: String(name) })),
            },
          ]}
          defaultSortKey="createdAt"
          defaultSortDirection="desc"
          rowActions={rowActions}
          onExport={handleExport}
          onRefresh={fetchLoads}
          emptyMessage="No loads found"
          ariaLabel="Admin loads"
        />

        {selectedLoad && <LoadDetailModal load={selectedLoad} onClose={() => setSelectedLoad(null)} />}

        {deleteTarget && (
          <DeleteConfirmModal
            load={deleteTarget}
            deleting={deleting}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </div>
    </AdminPageLayout>
  );
};

export default AdminLoads;
