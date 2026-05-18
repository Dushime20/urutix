import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaTruck, FaUsers, FaMapMarkerAlt, FaCalendarAlt,
  FaSearch, FaFilter, FaDownload, FaEye, FaEdit, FaTrash
} from 'react-icons/fa';
import {
  X, Truck, User, MapPin, Calendar, Shield, CheckCircle2,
  AlertTriangle, Clock, Building2, Phone, Mail,
  Activity, Wrench, Circle, Hash,
} from 'lucide-react';
import { TranslatedText } from '../components/translated-text';
import { useAuth } from '../contexts/AuthContext';
import AdminPageLayout from '../components/Admin/AdminPageLayout';
import { adminAPI, type AdminTruck } from '../services/adminApi';
import ModernLoader from '../components/common/ModernLoader';

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
      <span className="text-sm text-gray-900 font-medium">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
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
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 text-white" style={{ backgroundColor: '#2c5173' }}>
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
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/20 text-white text-xs font-black tracking-widest border border-white/30">
                    <Hash size={10} />{plate}
                  </span>
                )}
                <span className="text-indigo-200 text-xs">
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
            <div className="bg-indigo-50 rounded-xl p-3 text-center">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Status</p>
              <p className="text-sm font-black text-indigo-700 mt-1">{cfg.label}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Active</p>
              <p className="text-sm font-black text-emerald-700 mt-1">{truck.isActive ? 'Yes' : 'No'}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Drivers</p>
              <p className="text-sm font-black text-blue-700 mt-1">{truck.assignedDrivers?.length ?? (truck.currentDriverName ? 1 : 0)}</p>
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
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
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
                  <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                        <User size={12} className="text-indigo-600" />
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
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
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
  const [filteredTrucks, setFilteredTrucks] = useState<AdminTruck[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tenantFilter, setTenantFilter] = useState('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Detail modal
  const [selectedTruck, setSelectedTruck] = useState<AdminTruck | null>(null);

  // Fetch trucks data
  useEffect(() => {
    const fetchTrucks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await adminAPI.getAllTrucks();
        console.log('Trucks API Response:', response);
        
        // The response should now be { data: { trucks: [...] } }
        const trucksData = response.data?.trucks || [];
        
        setTrucks(trucksData);
        setFilteredTrucks(trucksData);
      } catch (err: any) {
        console.error('Error fetching trucks:', err);
        setError(err.response?.data?.message || 'Failed to load trucks data');
      } finally {
        setLoading(false);
      }
    };

    fetchTrucks();
  }, []);

  // Filter trucks based on search and filters
  useEffect(() => {
    let filtered = trucks;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(truck =>
        (truck.plateNumber || truck.licensePlate)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        truck.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        truck.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        truck.tenantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        truck.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        truck.currentDriverName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(truck => truck.status === statusFilter);
    }

    // Tenant filter
    if (tenantFilter !== 'all') {
      filtered = filtered.filter(truck => truck.tenantId === tenantFilter);
    }

    setFilteredTrucks(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [trucks, searchTerm, statusFilter, tenantFilter]);

  // Get unique values for filters
  const uniqueStatuses = [...new Set(trucks.map(truck => truck.status))];
  const uniqueTenants = [...new Set(trucks.map(truck => ({ id: truck.tenantId, name: truck.tenantName })))];

  // Pagination calculations
  const totalPages = Math.ceil(filteredTrucks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTrucks = filteredTrucks.slice(startIndex, endIndex);

  // Status color helper
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'IN_TRANSIT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'OUT_OF_SERVICE':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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
              onClick={() => window.location.reload()}
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
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Trucks</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{trucks.length}</p>
              </div>
              <FaTruck className="text-4xl text-blue-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Trucks</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {trucks.filter(t => 
                    t.isActive && 
                    (t.status?.toUpperCase() === 'AVAILABLE' || t.status?.toUpperCase() === 'IN_TRANSIT')
                  ).length}
                </p>
              </div>
              <FaTruck className="text-4xl text-green-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">In Maintenance</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {trucks.filter(t => t.status?.toUpperCase() === 'MAINTENANCE').length}
                </p>
              </div>
              <FaTruck className="text-4xl text-yellow-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Out of Service</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {trucks.filter(t => 
                    !t.isActive || t.status?.toUpperCase() === 'OUT_OF_SERVICE'
                  ).length}
                </p>
              </div>
              <FaTruck className="text-4xl text-purple-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
              {/* Search */}
              <div className="relative w-full md:w-64">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search trucks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>{formatStatus(status)}</option>
                ))}
              </select>

              {/* Tenant Filter */}
              <select
                value={tenantFilter}
                onChange={(e) => setTenantFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Tenants</option>
                {uniqueTenants.map(tenant => (
                  <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                <FaDownload />
                Export
              </button>
              <span className="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-lg font-medium">
                {filteredTrucks.length} trucks
              </span>
            </div>
          </div>
        </div>

        {/* Trucks Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Truck Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentTrucks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <FaTruck className="text-4xl text-gray-400 mb-4" />
                        <p className="text-gray-500 text-lg font-medium">No trucks found</p>
                        <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentTrucks.map((truck) => (
                    <tr key={truck.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                              <FaTruck className="text-indigo-600 text-xl" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {truck.plateNumber || truck.licensePlate || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {truck.make && truck.model ? `${truck.make} ${truck.model}` : 'Unknown Make/Model'}
                              {truck.year && ` (${truck.year})`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(truck.status)}`}>
                          {formatStatus(truck.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{truck.ownerName || 'No Owner'}</div>
                        {truck.ownerEmail && (
                          <div className="text-sm text-gray-500">{truck.ownerEmail}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {truck.currentDriverName || 'No Driver Assigned'}
                        </div>
                        {truck.assignedDrivers && truck.assignedDrivers.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {truck.assignedDrivers.length === 1 
                              ? `Assigned: ${new Date(truck.assignedDrivers[0].assignmentDate).toLocaleDateString()}`
                              : (
                                <div className="group relative">
                                  <span className="cursor-help border-b border-dotted border-gray-400">
                                    {truck.assignedDrivers.length} drivers assigned
                                  </span>
                                  <div className="invisible group-hover:visible absolute z-10 w-64 p-2 mt-1 text-xs bg-gray-800 text-white rounded shadow-lg">
                                    {truck.assignedDrivers.map((driver, idx) => (
                                      <div key={idx} className="mb-1">
                                        <strong>{driver.driverName}</strong> ({driver.status})
                                        <br />
                                        <span className="text-gray-300">
                                          Since: {new Date(driver.assignmentDate).toLocaleDateString()}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            }
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <FaMapMarkerAlt className="mr-1" />
                          {truck.currentLocationString || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{truck.tenantName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedTruck(truck)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => {/* Handle edit */}}
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => {/* Handle delete */}}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredTrucks.length > itemsPerPage && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(endIndex, filteredTrucks.length)}</span> of{' '}
                    <span className="font-medium">{filteredTrucks.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
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