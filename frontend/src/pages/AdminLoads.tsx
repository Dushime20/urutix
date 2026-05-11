// init

import React, { useState, useEffect, useCallback } from 'react';
import {
  FaBox, FaMapMarkerAlt, FaCalendarAlt, FaWeight,
  FaSearch, FaDownload, FaEye, FaTrash, FaDollarSign,
} from 'react-icons/fa';
import {
  X, Package, MapPin, Calendar, User, Building2, Truck,
  AlertTriangle, CheckCircle2, Clock, Scale, DollarSign,
  Thermometer, ShieldAlert, ChevronRight, Loader2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AdminPageLayout from '../components/Admin/AdminPageLayout';
import { adminAPI, type AdminLoad } from '../services/adminApi';
import toast from 'react-hot-toast';
import ModernLoader from '../components/common/ModernLoader';

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
      <span className="text-sm text-gray-900 font-medium">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
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
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

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

          {/* Quick stats */}
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
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
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
    <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-5 bg-red-50 border-b border-red-100">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={22} className="text-red-600" />
        </div>
        <div>
          <h2 className="text-base font-black text-gray-900">Delete Load</h2>
          <p className="text-sm text-gray-500">This action cannot be undone</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        <p className="text-sm text-gray-700 leading-relaxed">
          Are you sure you want to delete{' '}
          <span className="font-bold text-gray-900">"{load.title || `Load #${load.id.slice(-8)}`}"</span>?
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
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
        <button
          onClick={onCancel}
          disabled={deleting}
          className="px-5 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
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
  const [filteredLoads, setFilteredLoads] = useState<AdminLoad[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tenantFilter, setTenantFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [selectedLoad, setSelectedLoad] = useState<AdminLoad | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminLoad | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchLoads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getAllLoads();
      const data = response.data?.loads || [];
      setLoads(data);
      setFilteredLoads(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLoads(); }, [fetchLoads]);

  // ── Filter ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let f = loads;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      f = f.filter(l =>
        l.title?.toLowerCase().includes(q) ||
        locStr(l.origin).toLowerCase().includes(q) ||
        locStr(l.destination).toLowerCase().includes(q) ||
        l.cargoOwnerName?.toLowerCase().includes(q) ||
        l.tenantName?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') f = f.filter(l => l.status === statusFilter);
    if (tenantFilter !== 'all') f = f.filter(l => l.tenantId === tenantFilter);
    setFilteredLoads(f);
    setCurrentPage(1);
  }, [loads, searchTerm, statusFilter, tenantFilter]);

  // ── Delete ─────────────────────────────────────────────────────────────────
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

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const handleExport = () => {
    const headers = ['Title', 'Origin', 'Destination', 'Status', 'Weight (kg)', 'Value', 'Cargo Type', 'Created'];
    const rows = filteredLoads.map(l => [
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

  // ── Derived ────────────────────────────────────────────────────────────────
  const uniqueStatuses = [...new Set(loads.map(l => l.status).filter(Boolean))];
  const uniqueTenants = [...new Map(loads.filter(l => l.tenantId).map(l => [l.tenantId, l.tenantName || l.tenantId])).entries()];
  const totalPages = Math.ceil(filteredLoads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLoads = filteredLoads.slice(startIndex, startIndex + itemsPerPage);

  const stats = {
    total: loads.length,
    active: loads.filter(l => ['ASSIGNED', 'LOADED', 'IN_TRANSIT', 'PUBLISHED'].includes(l.status?.toUpperCase())).length,
    completed: loads.filter(l => ['COMPLETED', 'DELIVERED', 'CLOSED'].includes(l.status?.toUpperCase())).length,
    cancelled: loads.filter(l => l.status?.toUpperCase() === 'CANCELLED').length,
    totalValue: loads.reduce((s, l) => s + (l.loadValue ?? l.value ?? 0), 0),
  };

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

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Loads',  value: stats.total,     color: 'bg-blue-50',   icon: FaBox,        iconColor: 'text-blue-500' },
            { label: 'Active',       value: stats.active,    color: 'bg-indigo-50', icon: FaBox,        iconColor: 'text-indigo-500' },
            { label: 'Completed',    value: stats.completed, color: 'bg-green-50',  icon: FaBox,        iconColor: 'text-green-500' },
            { label: 'Cancelled',    value: stats.cancelled, color: 'bg-red-50',    icon: FaBox,        iconColor: 'text-red-500' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-xl shadow-sm p-5 flex items-center justify-between`}>
              <div>
                <p className="text-sm text-gray-500 font-medium">{s.label}</p>
                <p className="text-3xl font-black text-gray-900 mt-1">{s.value}</p>
              </div>
              <s.icon className={`text-4xl opacity-30 ${s.iconColor}`} />
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search loads..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
              <option value="all">All Status</option>
              {uniqueStatuses.map(s => <option key={s} value={s}>{getStatusCfg(s).label}</option>)}
            </select>
            <select value={tenantFilter} onChange={e => setTenantFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
              <option value="all">All Tenants</option>
              {uniqueTenants.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
              <FaDownload size={12} /> Export CSV
            </button>
            <span className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold">
              {filteredLoads.length} loads
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Load', 'Route', 'Status', 'Weight', 'Value', 'Created', 'Actions'].map(h => (
                    <th key={h} className={`px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentLoads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <FaBox className="text-4xl text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No loads found</p>
                      <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : currentLoads.map(load => {
                  const cfg = getStatusCfg(load.status);
                  const origin = locStr(load.origin);
                  const dest = locStr(load.destination);
                  const currency = load.currencyCode || 'RWF';
                  return (
                    <tr key={load.id} className="hover:bg-gray-50 transition-colors">
                      {/* Load */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                            <FaBox className="text-orange-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{load.title || `Load #${load.id.slice(-8)}`}</p>
                            <p className="text-xs text-gray-400">{load.cargoType?.replace(/_/g, ' ') || '—'}</p>
                          </div>
                        </div>
                      </td>
                      {/* Route */}
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-1.5 text-sm">
                          <FaMapMarkerAlt className="text-gray-400 mt-0.5 flex-shrink-0 text-xs" />
                          <div>
                            <p className="font-medium text-gray-800">{origin || '—'}</p>
                            <p className="text-gray-400 text-xs">→ {dest || '—'}</p>
                          </div>
                        </div>
                      </td>
                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                      {/* Weight */}
                      <td className="px-5 py-4 text-sm text-gray-700">
                        {load.weight ? `${fmtNum(load.weight)} kg` : '—'}
                      </td>
                      {/* Value */}
                      <td className="px-5 py-4 text-sm text-gray-700">
                        {(load.loadValue || load.value) ? `${currency} ${fmtNum(load.loadValue ?? load.value)}` : '—'}
                      </td>
                      {/* Created */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <FaCalendarAlt className="text-gray-300" />
                          {fmtDate(load.createdAt)}
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setSelectedLoad(load)}
                            className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="View Details"
                          >
                            <FaEye size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(load)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredLoads.length > itemsPerPage && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredLoads.length)} of {filteredLoads.length}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setCurrentPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${currentPage === p ? 'bg-indigo-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLoad && <LoadDetailModal load={selectedLoad} onClose={() => setSelectedLoad(null)} />}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          load={deleteTarget}
          deleting={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AdminPageLayout>
  );
};

export default AdminLoads;
