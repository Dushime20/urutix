import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import receiverService from '../../services/receiverService';
import { FaBox, FaCalendarAlt, FaClipboardCheck, FaCheckCircle } from 'react-icons/fa';
import { Search, Grid, Table, Package, User, Eye, X } from 'lucide-react';
import CargoDetailsModal from '../../components/CargoDetailsModal';
import FilterSelect from '../../components/common/FilterSelect';
import { cn } from '../../utils/cn';
import { useTranslation } from '../../hooks/useTranslation';

interface Cargo {
  id: string;
  title?: string;
  description?: string;
  cargoType: string;
  pickupLocation: string;
  deliveryLocation: string;
  pickupDate: string;
  deliveryDate?: string;
  status: string;
  weight?: number;
  volume?: number;
  inspectionStatus?: string;   // injected by getCargosByReceiverId
  inspection?: any;            // injected by getCargosByReceiverId
  assignedTruck?: {
    id: string;
    plateNumber: string;
    model?: string;
    driverName?: string;
    driverPhone?: string;
  };
  cargoOwner?: {
    id: string;
    email: string;
    profile?: {
      firstName: string;
      lastName: string;
    };
  };
}

// Human-readable label for any status value coming from the API
const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  CREATED: 'Created',
  PUBLISHED: 'Published',
  PENDING_CONFIRMATION: 'Pending Confirmation',
  ASSIGNED: 'Assigned',
  LOADED: 'Loaded',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  CLOSED: 'Closed',
};

// Human-readable label for cargo type values
const CARGO_TYPE_LABELS: Record<string, string> = {
  GENERAL: 'General',
  FRAGILE: 'Fragile',
  HAZARDOUS: 'Hazardous',
  REFRIGERATED: 'Refrigerated',
  LIQUID: 'Liquid',
  OVERSIZED: 'Oversized',
  VALUABLE: 'Valuable',
  CONTAINER: 'Container',
  BULK: 'Bulk',
  LIVESTOCK: 'Livestock',
  VEHICLE: 'Vehicle',
  ELECTRONICS: 'Electronics',
  PHARMACEUTICALS: 'Pharmaceuticals',
};

const ReceiverCargosPage: React.FC = () => {
  const {  } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCargoId, setSelectedCargoId] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Filter & View States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [cargoTypeFilter, setCargoTypeFilter] = useState("");
  const [viewMode, setViewMode] = useState<'card' | 'table'>(window.innerWidth < 768 ? 'card' : 'table');

  useEffect(() => {
    loadMyCargos();
    
    const handleResize = () => {
      if (window.innerWidth < 768 && viewMode === 'table') {
        setViewMode('card');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  // Handle deep linking to specific cargo
  useEffect(() => {
    const viewId = searchParams.get('view');
    if (viewId && cargos.length > 0) {
      const cargoToView = cargos.find(c => c.id === viewId);
      if (cargoToView) {
        setSelectedCargoId(viewId);
        setShowDetailsModal(true);
        window.history.replaceState({}, '', '/dashboard/cargos/my-cargos');
      }
    }
  }, [cargos, searchParams]);

  const loadMyCargos = async () => {
    try {
      setLoading(true);
      // getCargosByReceiverId already injects inspectionStatus + inspection
      // on every cargo object, so no separate loop needed
      const data = await receiverService.getMyCargos();
      setCargos(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load your cargos');
    } finally {
      setLoading(false);
    }
  };

  // ── Dynamic filter options derived from the actual data ──────────────────────
  // This ensures every status/type that comes from the API is selectable,
  // regardless of what the backend returns.
  const statusOptions = useMemo(() => {
    const unique = [...new Set(cargos.map(c => c.status).filter(Boolean))].sort();
    return unique.map(s => ({
      value: s,
      label: STATUS_LABELS[s] ?? s.replace(/_/g, ' '),
    }));
  }, [cargos]);

  const cargoTypeOptions = useMemo(() => {
    const unique = [...new Set(cargos.map(c => c.cargoType).filter(Boolean))].sort();
    return unique.map(t => ({
      value: t,
      label: CARGO_TYPE_LABELS[t] ?? t.replace(/_/g, ' '),
    }));
  }, [cargos]);

  const filteredCargos = useMemo(() => {
    let filtered = cargos;

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (cargo) =>
          cargo.title?.toLowerCase().includes(searchLower) ||
          cargo.description?.toLowerCase().includes(searchLower) ||
          cargo.cargoType?.toLowerCase().includes(searchLower) ||
          cargo.pickupLocation?.toLowerCase().includes(searchLower) ||
          cargo.deliveryLocation?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter: compare uppercase to be safe against inconsistent casing
    if (statusFilter) {
      filtered = filtered.filter(
        (cargo) => (cargo.status ?? '').toUpperCase() === statusFilter.toUpperCase()
      );
    }

    // Cargo type filter: compare uppercase
    if (cargoTypeFilter) {
      filtered = filtered.filter(
        (cargo) => (cargo.cargoType ?? '').toUpperCase() === cargoTypeFilter.toUpperCase()
      );
    }

    return filtered;
  }, [cargos, searchTerm, statusFilter, cargoTypeFilter]);

  // Helper: resolve inspection status from the cargo object itself
  // (backend injects inspectionStatus + inspection directly on the cargo)
  const isInspectionDone = (cargo: Cargo): boolean =>
    cargo.inspectionStatus === 'COMPLETED' ||
    cargo.inspection?.status === 'COMPLETED' ||
    cargo.inspection?.allItemsVerified === true;

  const hasActiveFilters = searchTerm || statusFilter || cargoTypeFilter;

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCargoTypeFilter('');
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_TRANSIT':
        return 'bg-purple-100 text-purple-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewDetails = (cargo: Cargo) => {
    setSelectedCargoId(cargo.id);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] p-4">
        <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
          Synchronizing Assigned Logistics...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary-50 flex items-center justify-center">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
             </div>
             <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#0f172a] tracking-tight">Assigned <span className="text-primary-600">Assets</span></h1>
          </div>
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest sm:max-w-xl">
             Inventory of cargo payloads authorized for your protocol reception
          </p>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="bg-white rounded-[2rem] border border-slate-100 p-2 sm:p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 transform text-slate-300 w-4 h-4" />
            <input
              type="text"
              placeholder="SEARCH LOGISTICS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl sm:rounded-2xl border-none bg-slate-50 px-3 py-3.5 pl-12 text-[10px] font-black uppercase tracking-widest focus:ring-4 focus:ring-primary-50 transition-all placeholder:text-slate-300 shadow-inner"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="w-full sm:w-44">
              <FilterSelect
                label="Status"
                value={statusFilter}
                placeholder="ALL STATES"
                options={statusOptions}
                onChange={setStatusFilter}
              />
            </div>

            <div className="w-full sm:w-44">
               <FilterSelect
                label="Cargo Type"
                value={cargoTypeFilter}
                placeholder="ALL TYPES"
                options={cargoTypeOptions}
                onChange={setCargoTypeFilter}
              />
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                title="Clear all filters"
                className="self-end flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 transition-all"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl p-1 border border-slate-100 self-end lg:self-center">
            <button
              onClick={() => setViewMode('card')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                viewMode === 'card'
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                viewMode === 'table'
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {filteredCargos.length} of {cargos.length} cargo{cargos.length !== 1 ? 's' : ''}
            {hasActiveFilters ? ' matching filters' : ' total'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>
      )}

      {filteredCargos.length === 0 ? (
        <div className="bg-white rounded-[3rem] border border-slate-100 border-dashed p-16 sm:p-24 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
             <Package className="text-slate-200 w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Inventory Empty</h3>
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 max-w-sm mx-auto leading-relaxed">
            {hasActiveFilters
              ? "Zero payloads match your authorization query parameters." 
              : "No cargos have been assigned to your endpoint yet."}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-[9px] font-black uppercase tracking-widest text-primary-600 hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
        {viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredCargos.map((cargo) => (
              <div
                key={cargo.id}
                className="group relative bg-white rounded-[2.5rem] p-6 sm:p-8 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-primary-900/5 hover:border-primary-100 transition-all duration-500"
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-500 shadow-sm group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                        <FaBox className="text-lg" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-[#0f172a] tracking-tight group-hover:text-primary-600 transition-colors leading-tight">
                          {cargo.title || cargo.cargoType || 'UNTITLED_PAYLOAD'}
                        </h3>
                        {cargo.cargoOwner?.profile && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                             <User className="w-3 h-3 text-slate-300" />
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                               From: {cargo.cargoOwner.profile.firstName} {cargo.cargoOwner.profile.lastName}
                             </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border shadow-sm ${getStatusColor(
                        cargo.status,
                      )}`}
                    >
                      {cargo.status?.replace('_', ' ') || 'UNKNOWN'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-6 border-y border-slate-50">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Protocol Date</p>
                      <div className="flex items-center gap-2">
                         <FaCalendarAlt className="text-primary-300 text-[10px]" />
                         <p className="text-[10px] font-bold text-slate-700">
                            {cargo.pickupDate ? new Date(cargo.pickupDate).toLocaleDateString() : 'N/A'}
                         </p>
                      </div>
                    </div>
                    {cargo.deliveryDate && (
                      <div className="space-y-1 pl-4 border-l border-slate-50">
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">ETA Window</p>
                        <div className="flex items-center gap-2">
                           <FaCalendarAlt className="text-emerald-300 text-[10px]" />
                           <p className="text-[10px] font-bold text-slate-700">
                              {new Date(cargo.deliveryDate).toLocaleDateString()}
                           </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {(cargo.weight || cargo.volume) && (
                    <div className="flex items-center gap-6 py-4">
                      {cargo.weight && (
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Mass</span>
                          <span className="text-xs font-black text-slate-900 mt-0.5">
                            {cargo.weight} <span className="text-slate-400 font-bold">KG</span>
                          </span>
                        </div>
                      )}
                      {cargo.volume && (
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Vol</span>
                          <span className="text-xs font-black text-slate-900 mt-0.5">
                            {cargo.volume} <span className="text-slate-400 font-bold">M³</span>
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-auto pt-6 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => handleViewDetails(cargo)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all text-[9px] font-black uppercase tracking-widest border border-slate-100 shadow-sm active:scale-95"
                      >
                         <Eye className="w-3.5 h-3.5" />
                         Full Logic
                      </button>

                      {isInspectionDone(cargo) ? (
                        <button
                          onClick={() => navigate(`/dashboard/cargos/${cargo.id}/inspect`)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all text-[9px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm active:scale-95"
                        >
                          <FaClipboardCheck />
                          Verif History
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/dashboard/cargos/${cargo.id}/inspect`)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-slate-900 transition-all text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary-900/10 active:scale-95 border-b-4 border-primary-700 active:border-b-0"
                        >
                          <FaClipboardCheck />
                          Inspect Node
                        </button>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Payload</th>
                    <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Routing</th>
                    <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Timeline</th>
                    <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">State</th>
                    <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol</th>
                    <th className="px-6 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Operations</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                  {filteredCargos.map((cargo) => (
                    <tr key={cargo.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-primary-50 rounded-xl flex items-center justify-center">
                            <Package className="h-5 w-5 text-primary-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{cargo.title || 'NULL'}</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{cargo.cargoType}</div>
                            {cargo.cargoOwner?.profile && (
                                <div className="text-[8px] text-slate-300 mt-1 flex items-center gap-1 font-bold">
                                    <User className="w-2.5 h-2.5" />
                                    {cargo.cargoOwner.profile.firstName} {cargo.cargoOwner.profile.lastName}
                                </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-[10px] font-bold text-slate-600 break-words max-w-[200px] leading-tight">{cargo.pickupLocation}</div>
                        <div className="text-[10px] text-slate-200 my-0.5">↓</div>
                        <div className="text-[10px] font-bold text-slate-600 break-words max-w-[200px] leading-tight">{cargo.deliveryLocation}</div>
                      </td>
                       <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-[10px] text-slate-600 font-bold">
                             <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mr-2">START:</span> {cargo.pickupDate ? new Date(cargo.pickupDate).toLocaleDateString() : 'N/A'}
                        </div>
                        <div className="text-[10px] text-slate-600 mt-1.5 font-bold">
                             <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mr-2">DEST:</span> {cargo.deliveryDate ? new Date(cargo.deliveryDate).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={cn(
                          "px-3 py-1 inline-flex text-[8px] font-black uppercase tracking-widest rounded-lg border shadow-sm",
                          getStatusColor(cargo.status)
                        )}>
                          {cargo.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                         {isInspectionDone(cargo) ? (
                             <span className="inline-flex items-center gap-2 text-[9px] text-emerald-600 font-black uppercase tracking-widest">
                                 <FaCheckCircle className="w-3 h-3" />
                                 Verified
                             </span>
                         ) : (
                             <span className="inline-flex items-center gap-2 text-[9px] text-amber-500 font-black uppercase tracking-widest">
                                 <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                                 Incubating
                             </span>
                         )}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => navigate(`/dashboard/cargos/${cargo.id}/inspect`)}
                                className={cn(
                                    "p-2.5 rounded-xl transition-all active:scale-90 shadow-sm border",
                                    isInspectionDone(cargo)
                                        ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100"
                                        : "bg-primary-50 text-primary-600 border-primary-100 hover:bg-primary-100"
                                )}
                                title={isInspectionDone(cargo) ? "View Inspection History" : "Inspect Cargo"}
                            >
                                <FaClipboardCheck className="w-4 h-4" />
                            </button>
                           <button
                             onClick={() => handleViewDetails(cargo)}
                             className="p-2.5 bg-slate-50 text-slate-400 hover:text-primary-600 hover:bg-primary-50 border border-slate-100 hover:border-primary-100 rounded-xl transition-all active:scale-90 shadow-sm"
                             title="Full Protocol Details"
                           >
                             <Eye className="w-4 h-4" />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </>
      )}

      {/* Cargo Details Modal */}
      <CargoDetailsModal 
        isOpen={showDetailsModal} 
        onClose={() => setShowDetailsModal(false)} 
        cargoId={selectedCargoId} 
      />
    </div>
  );
};

export default ReceiverCargosPage;

