import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaTruck,
  FaMapMarkerAlt,
  FaDownload,
  FaEye,
  FaEdit,
  FaTrash
} from 'react-icons/fa';
import {
  X,
  Truck,
  User,
  MapPin,
  Calendar,
  Building2,
  Phone,
  Mail,
  Hash
} from 'lucide-react';
import { TranslatedText } from '../components/translated-text';
import { useAuth } from '../contexts/AuthContext';
import AdminPageLayout from '../components/Admin/AdminPageLayout';
import { adminAPI, type AdminTruck } from '../services/adminApi';
import ModernLoader from '../components/common/ModernLoader';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../components/EnliteUI/Tables';

// ── Truck Detail Modal ────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; bg: string; dot: string }> = {
  AVAILABLE:      { label: 'Available',      bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
  IN_TRANSIT:     { label: 'In Transit',     bg: 'bg-blue-100 text-blue-800 border-blue-200',         dot: 'bg-blue-500' },
  MAINTENANCE:    { label: 'Maintenance',    bg: 'bg-amber-100 text-amber-800 border-amber-200',       dot: 'bg-amber-500' },
  OUT_OF_SERVICE: { label: 'Out of Service', bg: 'bg-red-100 text-red-800 border-red-200',             dot: 'bg-red-500' },
};

function InfoRow({ label, value, icon: Icon }: { label: string; value?: string | number | null; icon?: any }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      {Icon && <Icon size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />}
      <span className="text-xs font-semibold text-gray-500 w-36 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-900 dark:text-white font-medium">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{title}</p>
      <div>{children}</div>
    </div>
  );
}

interface TruckDetailModalProps {
  truck: AdminTruck;
  onClose: () => void;
}

const TruckDetailModal: React.FC<TruckDetailModalProps> = ({ truck, onClose }) => {
  const cfg = statusConfig[truck.status?.toUpperCase()] || { label: truck.status, bg: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-400' };
  const plate = truck.plateNumber || truck.licensePlate;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden flex flex-col max-h-[90vh] border border-transparent">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 text-white bg-primary-600">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Truck size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                {[truck.make, truck.model, truck.year].filter(Boolean).join(' ') || 'Truck Details'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                {plate && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/20 text-white text-xs font-black tracking-widest border border-transparent">
                    <Hash size={10} />{plate}
                  </span>
                )}
                <span className="text-slate-200 text-xs">
                  {truck.tenantName || 'Vehicle Details'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.bg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Quick stats row */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-slate-900 rounded-xl p-3 text-center col-span-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plate No.</p>
              <p className="text-sm font-black text-white mt-1 tracking-widest">{plate || '—'}</p>
            </div>
            <div className="bg-slate-100 rounded-xl p-3 text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</p>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-1">{cfg.label}</p>
            </div>
            <div className="bg-slate-100 rounded-xl p-3 text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active</p>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-1">{truck.isActive ? 'Yes' : 'No'}</p>
            </div>
            <div className="bg-slate-100 rounded-xl p-3 text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Drivers</p>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-1">{truck.assignedDrivers?.length ?? (truck.currentDriverName ? 1 : 0)}</p>
            </div>
          </div>

          {/* Vehicle Info */}
          <Section title="Vehicle Information">
            <InfoRow label="License Plate"  value={plate}  icon={Hash} />
            <InfoRow label="Make"           value={truck.make}          icon={Truck} />
            <InfoRow label="Model"          value={truck.model}         icon={Truck} />
            <InfoRow label="Year"           value={truck.year}          icon={Calendar} />
            <InfoRow label="Registered"     value={truck.createdAt ? new Date(truck.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' }) : undefined} icon={Calendar} />
          </Section>

          {/* Ownership */}
          <Section title="Ownership & Tenant">
            <InfoRow label="Owner"       value={truck.ownerName}   icon={User} />
            <InfoRow label="Owner Email" value={truck.ownerEmail}  icon={Mail} />
            <InfoRow label="Tenant"      value={truck.tenantName}  icon={Building2} />
          </Section>

          {/* Current Driver */}
          <Section title="Current Driver">
            {truck.currentDriverName ? (
              <>
                <InfoRow label="Driver Name"  value={truck.currentDriverName}  icon={User} />
                <InfoRow label="Driver Phone" value={truck.currentDriverPhone} icon={Phone} />
              </>
            ) : (
              <div className="flex items-center gap-2 py-2 text-gray-400">
                <User size={14} />
                <span className="text-sm">No driver currently assigned</span>
              </div>
            )}
          </Section>

          {/* Location */}
          <Section title="Location">
            <InfoRow label="Current Location" value={truck.currentLocationString || 'Unknown'} icon={MapPin} />
            {truck.coordinates && (
              <>
                <InfoRow label="Latitude"  value={truck.coordinates.latitude?.toFixed(6)}  icon={MapPin} />
                <InfoRow label="Longitude" value={truck.coordinates.longitude?.toFixed(6)} icon={MapPin} />
              </>
            )}
            {truck.coordinates && (
              <div className="mt-2">
                <a
                  href={`https://maps.google.com/?q=${truck.coordinates.latitude},${truck.coordinates.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-850 hover:underline"
                >
                  <MapPin size={12} /> View on Google Maps →
                </a>
              </div>
            )}
          </Section>

          {/* Assigned Drivers History */}
          {truck.assignedDrivers && truck.assignedDrivers.length > 0 && (
            <Section title={`Driver History (${truck.assignedDrivers.length})`}>
              <div className="space-y-2">
                {truck.assignedDrivers.map((d, i) => (
                  <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-lg px-3 py-2 border border-transparent">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                        <User size={12} className="text-slate-600 dark:text-slate-300" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{d.driverName}</p>
                        <p className="text-[10px] text-gray-400">
                          Since {new Date(d.assignmentDate).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                          {d.notes ? ` · ${d.notes}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      d.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {d.status}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminTrucks: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trucks, setTrucks] = useState<AdminTruck[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Detail modal
  const [selectedTruck, setSelectedTruck] = useState<AdminTruck | null>(null);

  const fetchTrucks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminAPI.getAllTrucks();
      const trucksData = response.data?.trucks || [];
      setTrucks(trucksData);
    } catch (err: any) {
      console.error('Error fetching trucks:', err);
      setError(err.response?.data?.message || 'Failed to load trucks data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrucks();
  }, [fetchTrucks]);

  // Format status text
  const formatStatus = (status: string) => {
    if (!status) return 'Unknown';

    switch (status.toUpperCase()) {
      case 'AVAILABLE':
        return 'Available';
      case 'IN_TRANSIT':
        return 'In Transit';
      case 'MAINTENANCE':
        return 'Maintenance';
      case 'OUT_OF_SERVICE':
        return 'Out of Service';
      default:
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const statusFilterOptions = useMemo(() => {
    const statuses = [...new Set(trucks.map((t) => t.status).filter(Boolean))];
    return statuses.map((status) => ({
      value: status,
      label: formatStatus(status),
    }));
  }, [trucks]);

  const tenantFilterOptions = useMemo(() => {
    const map = new Map<string, string>();
    trucks.forEach((t) => {
      if (t.tenantId) map.set(t.tenantId, t.tenantName || t.tenantId);
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [trucks]);

  const truckColumns = useMemo<Column<AdminTruck>[]>(() => [
    {
      key: 'plateNumber',
      label: 'Truck Details',
      sortable: true,
      render: (_value, truck) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-12 w-12">
            <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center">
              <FaTruck className="text-indigo-600 text-xl" />
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {truck.plateNumber || truck.licensePlate || 'N/A'}
            </div>
            <div className="text-sm text-gray-500">
              {truck.make && truck.model ? `${truck.make} ${truck.model}` : 'Unknown Make/Model'}
              {truck.year && ` (${truck.year})`}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_value, truck) => (
        <StatusBadge label={formatStatus(truck.status)} status={truck.status} />
      ),
    },
    {
      key: 'ownerName',
      label: 'Owner',
      sortable: true,
      render: (_value, truck) => (
        <div>
          <div className="text-sm text-gray-900 dark:text-white">{truck.ownerName || 'No Owner'}</div>
          {truck.ownerEmail && (
            <div className="text-sm text-gray-500">{truck.ownerEmail}</div>
          )}
        </div>
      ),
    },
    {
      key: 'currentDriverName',
      label: 'Current Driver',
      sortable: true,
      render: (_value, truck) => (
        <div>
          <div className="text-sm text-gray-900 dark:text-white">
            {truck.currentDriverName || 'No Driver Assigned'}
          </div>
          {truck.assignedDrivers && truck.assignedDrivers.length > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              {truck.assignedDrivers.length === 1
                ? `Assigned: ${new Date(truck.assignedDrivers[0].assignmentDate).toLocaleDateString()}`
                : `${truck.assignedDrivers.length} drivers assigned`}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'currentLocationString',
      label: 'Location',
      sortable: true,
      render: (_value, truck) => (
        <div className="flex items-center text-sm text-gray-500">
          <FaMapMarkerAlt className="mr-1" />
          {truck.currentLocationString || 'Unknown'}
        </div>
      ),
    },
    {
      key: 'tenantName',
      label: 'Tenant',
      sortable: true,
      render: (value) => <div className="text-sm text-gray-900 dark:text-white">{value}</div>,
    },
  ], []);

  const truckRowActions = useMemo<TableAction<AdminTruck>[]>(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: <FaEye />,
      onClick: (truck) => setSelectedTruck(truck),
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: <FaEdit />,
      onClick: () => { /* Handle edit */ },
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <FaTrash />,
      variant: 'danger',
      divider: true,
      onClick: () => { /* Handle delete */ },
    },
  ], []);

  if (loading) {
    return (
      <AdminPageLayout
        title="Truck Management"
        description="Monitor and manage all trucks across the platform"
      >
        <ModernLoader isLoading={loading} type="table" />
      </AdminPageLayout>
    );
  }

  if (error) {
    return (
      <AdminPageLayout
        title="Truck Management"
        description="Monitor and manage all trucks across the platform"
      >
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="text-red-400">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Trucks</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={fetchTrucks}
              className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title="Truck Management"
      description="Monitor and manage all trucks across the platform"
    >
      <div className="space-y-6">

      <StandardDataTable<AdminTruck>
        embedded
        className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-transparent"
        columns={truckColumns}
        data={trucks}
        getRowId={(row) => row.id}
        searchPlaceholder="Search trucks…"
        searchKeys={['plateNumber', 'licensePlate', 'make', 'model', 'tenantName', 'ownerName', 'currentDriverName']}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: statusFilterOptions,
          },
          {
            key: 'tenantId',
            label: 'Tenant',
            options: tenantFilterOptions,
          },
        ]}
        rowActions={truckRowActions}
        emptyMessage="No trucks found"
        stickyHeader
        columnVisibility
        pagination
        onRefresh={fetchTrucks}
        toolbarExtra={
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:text-slate-300 rounded-lg transition-colors text-xs font-semibold">
            <FaDownload />
            Export
          </button>
        }
        ariaLabel="Truck management"
      />
      </div>

      {/* Truck Detail Modal */}
      {selectedTruck && (
        <TruckDetailModal
          truck={selectedTruck}
          onClose={() => setSelectedTruck(null)}
        />
      )}
    </AdminPageLayout>
  );
};

export default AdminTrucks;