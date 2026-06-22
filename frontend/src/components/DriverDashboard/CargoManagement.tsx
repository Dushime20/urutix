import React, { useState, useEffect } from 'react';
import {
  Package,
  CheckCircle,
  AlertTriangle,
  Truck,
  MessageSquare,
  Search,
  Calendar,
  Thermometer,
  Weight,
  Ruler,
  Filter,
  ArrowRight,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { CargoDetails } from './CargoDetails';
import { motion, AnimatePresence } from 'framer-motion';
import { CargoInspection } from './CargoInspection';
import { ProofOfDelivery } from './ProofOfDelivery';
import { CargoHealthModal } from './CargoHealthModal';
import { driverApi } from '../../services/driverApi';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface CargoItem {
  id: string;
  name: string;
  description: string;
  status: 'PENDING' | 'INSPECTED' | 'APPROVED' | 'REJECTED' | 'LOADED' | 'IN_TRANSIT' | 'DELIVERED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: string;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  pickupLocation: string;
  deliveryLocation: string;
  pickupTime: string;
  deliveryTime: string;
  value: number;
  fragility: 'LOW' | 'MEDIUM' | 'HIGH';
  temperature: {
    min: number | null;
    max: number | null;
    unit: 'C' | 'F';
  };
  hazardous: boolean;
  shipper: {
    name: string;
    contact: string;
    phone: string;
    email: string;
  };
  inspectionStatus?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  inspectionResult?: any;
  notes: string[];
  documents: string[];
  pod?: {
    recipientName: string;
    signatureBase64: string;
    completedAt: string;
    photoUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CargoManagementProps {
  driverId: string;
}

export const CargoManagement: React.FC<CargoManagementProps> = ({ driverId }) => {
  const [cargos, setCargos] = useState<CargoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCargo, setSelectedCargo] = useState<CargoItem | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'details' | 'inspection' | 'delivery'>('list');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'pickupTime' | 'value' | 'createdAt'>('priority');
  const [checkedCargos, setCheckedCargos] = useState<Set<string>>(new Set());
  const [proceeding, setProceeding] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [healthCargo, setHealthCargo] = useState<CargoItem | null>(null);

  const formatLocation = (loc: any): string => {
    if (!loc) return 'N/A';
    if (typeof loc === 'string') return loc;

    // Handle coordinates object if passed directly
    if (typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
      return `Lat: ${loc.latitude.toFixed(4)}, Lng: ${loc.longitude.toFixed(4)}`;
    }

    // Try to get address string from common fields
    const addr = loc.address || loc.locationData?.address || loc.street;
    if (typeof addr === 'string') return addr;

    // If address is itself an object, format its components
    const target = (typeof addr === 'object' && addr !== null) ? addr : loc;

    const parts = [
      target.street || target.address,
      target.city,
      target.state,
      target.postalCode,
      target.country
    ].filter(p => typeof p === 'string' && p.length > 0);

    if (parts.length > 0) return parts.join(', ');

    // Fallback to name
    const name = target.name || target.locationData?.name;
    if (typeof name === 'string') return name;

    return 'N/A';
  };

  // Fetch assigned loads from API
  useEffect(() => {
    const fetchAssignedLoads = async () => {
      if (!driverId) return;

      try {
        setLoading(true);
        const loads = await driverApi.getAssignedLoads(driverId);

        // Map Load entity to CargoItem interface
        const mappedCargos: CargoItem[] = loads.map((load: any) => {
          const pickupLoc = load.pickupLocation || load.locations?.find((l: any) => l.type === 'PICKUP');
          const deliveryLoc = load.deliveryLocation || load.locations?.find((l: any) => l.type === 'DELIVERY');

          return {
            id: load.id,
            name: load.title || load.cargoType || 'Cargo',
            description: load.description || load.cargoDescription || '',
            status: load.status === 'ASSIGNED' ? 'PENDING' : load.status,
            priority: load.urgencyLevel || 'MEDIUM',
            category: load.cargoType || 'General',
            weight: load.weight || load.cargoWeight || 0,
            dimensions: {
              length: load.length || load.dimensions?.length || 0,
              width: load.width || load.dimensions?.width || 0,
              height: load.height || load.dimensions?.height || 0,
            },
            pickupLocation: formatLocation(pickupLoc),
            deliveryLocation: formatLocation(deliveryLoc),
            pickupTime: load.pickupDate || load.pickupTime || '',
            deliveryTime: load.deliveryDate || load.deliveryTime || '',
            value: load.value || load.cargoValue || 0,
            fragility: load.fragility || 'MEDIUM',
            temperature: load.temperatureRequirements || { min: null, max: null, unit: 'C' },
            hazardous: load.hazardous || false,
            shipper: {
              name: load.cargoOwner?.companyName || load.cargoOwner?.firstName + ' ' + load.cargoOwner?.lastName || 'N/A',
              contact: load.cargoOwner?.firstName + ' ' + load.cargoOwner?.lastName || 'N/A',
              phone: load.cargoOwner?.phone || load.contactPhone || 'N/A',
              email: load.cargoOwner?.email || load.contactEmail || 'N/A'
            },
            inspectionStatus: load.metadata?.inspectionStatus || 'PENDING',
            notes: load.specialInstructions ? [load.specialInstructions] : [],
            documents: load.requiredDocuments || [],
            pod: load.metadata?.pod || undefined,
            createdAt: load.createdAt || new Date().toISOString(),
            updatedAt: load.updatedAt || new Date().toISOString()
          };
        });

        setCargos(mappedCargos);
      } catch (error: any) {
        console.error('Error fetching assigned loads:', error);
        toast.error('Failed to load assigned cargo');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedLoads();
  }, [driverId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'INSPECTED': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'APPROVED': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'REJECTED': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'LOADED': return 'text-purple-600 bg-purple-50 border-purple-100';
      case 'IN_TRANSIT': return 'text-indigo-600 bg-indigo-50 border-indigo-100';
      case 'DELIVERED': return 'text-slate-600 bg-slate-50 border-slate-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'MEDIUM': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'LOW': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  const handleInspectCargo = (cargo: CargoItem) => {
    setSelectedCargo(cargo);
    setViewMode('inspection');
  };

  const handleViewDetails = (cargo: CargoItem) => {
    setSelectedCargo(cargo);
    setViewMode('details');
  };

  const handleInspectionComplete = async (result: any) => {
    if (!selectedCargo) return;

    try {
      await api.patch(`/loads-v2/${selectedCargo.id}`, {
        metadata: {
          inspectionStatus: 'COMPLETED',
          inspectionResult: result,
          inspectionCompletedAt: new Date().toISOString(),
        },
      });

      setCargos(prev => prev.map(cargo =>
        cargo.id === selectedCargo.id
          ? {
            ...cargo,
            inspectionStatus: 'COMPLETED',
            inspectionResult: result,
            status: result.status === 'PASSED' ? 'APPROVED' : 'REJECTED',
            updatedAt: new Date().toISOString()
          }
          : cargo
      ));
      toast.success('Inspection completed and saved!');
      setViewMode('list');
      setSelectedCargo(null);
    } catch (error: any) {
      console.error('Error saving inspection:', error);
      toast.error('Failed to save inspection status');
    }
  };

  const handleDeliverCargo = (cargo: CargoItem) => {
    setSelectedCargo(cargo);
    setViewMode('delivery');
  };

  const handlePODSubmit = async (podData: { recipientName: string; signatureBase64: string; photoFile?: File }) => {
    if (!selectedCargo) return;

    try {
      toast.loading('Uploading Proof of Delivery...', { id: 'pod-upload' });
      
      // 1. In a real app, we would upload the photoFile and signature to the server
      // For now, call the finish delivery endpoint
      await driverApi.completeDelivery(driverId, selectedCargo.id, podData);

      setCargos(prev => prev.map(cargo =>
        cargo.id === selectedCargo.id
          ? { ...cargo, status: 'DELIVERED', updatedAt: new Date().toISOString() }
          : cargo
      ));
      
      toast.success('Delivery finalized! Proof of Delivery transmitted.', { id: 'pod-upload' });
      setViewMode('list');
      setSelectedCargo(null);
    } catch (error: any) {
      console.error('Error completing delivery:', error);
      toast.error('Failed to finalize delivery', { id: 'pod-upload' });
    }
  };

  const handleAcceptCargo = async (cargoToLoad: CargoItem | null = null) => {
    const target = cargoToLoad || selectedCargo;
    if (!target || !driverId) return;

    // Enforce inspection before loading
    if (target.inspectionStatus !== 'COMPLETED') {
      toast.error('Mandatory inspection must be completed before loading cargo.');
      return;
    }

    try {
      await driverApi.acceptAndLoad(driverId, target.id);
      
      // Notify Owners (Cargo Owner and Truck Owner)
      try {
        await driverApi.notifyCargoLoaded(driverId, target.id);
      } catch (notifyError) {
        console.warn('Failed to send automated notifications to owners:', notifyError);
        // We don't block the UI for notification failure, but we log it
      }

      setCargos(prev => prev.map(cargo =>
        cargo.id === target.id
          ? { ...cargo, status: 'LOADED', updatedAt: new Date().toISOString() }
          : cargo
      ));
      toast.success('Cargo loaded! Owners have been notified.');
      setViewMode('list');
      setSelectedCargo(null);
    } catch (error: any) {
      console.error('Error accepting cargo:', error);
      toast.error(error.response?.data?.message || 'Failed to accept and load cargo');
    }
  };

  const handleRejectCargo = (reason: string) => {
    if (selectedCargo) {
      setCargos(prev => prev.map(cargo =>
        cargo.id === selectedCargo.id
          ? {
            ...cargo,
            status: 'REJECTED',
            notes: [...cargo.notes, `Rejected: ${reason}`],
            updatedAt: new Date().toISOString()
          }
          : cargo
      ));
      setViewMode('list');
      setSelectedCargo(null);
    }
  };

  const handleContactShipper = () => {
    console.log('Contacting shipper...');
  };

  const handleProceedJourney = async () => {
    if (checkedCargos.size === 0) {
      toast.error('Please select at least one cargo to proceed');
      return;
    }

    // Verify all selected cargos are inspected
    const selectedCargosData = cargos.filter(c => checkedCargos.has(c.id));
    const pendingInspections = selectedCargosData.filter(c => c.inspectionStatus !== 'COMPLETED');

    if (pendingInspections.length > 0) {
      toast.error(`Mandatory inspection required for ${pendingInspections.length} cargo item(s) before starting journey.`);
      return;
    }

    try {
      setProceeding(true);
      await driverApi.proceedWithJourney(driverId, Array.from(checkedCargos));
      toast.success(`Journey started successfully for ${checkedCargos.size} cargo item(s)`);
      setCheckedCargos(new Set());
      // Refresh logic would go here
    } catch (error: any) {
      console.error('Error proceeding with journey:', error);
      toast.error(error.response?.data?.message || 'Failed to proceed with journey');
    } finally {
      setProceeding(false);
    }
  };

  const filteredCargos = cargos.filter(cargo => {
    const matchesStatus = filterStatus === 'all' || cargo.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || cargo.priority === filterPriority;
    const matchesSearch = cargo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cargo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cargo.id.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesPriority && matchesSearch;
  });

  const sortedCargos = [...filteredCargos].sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        const priorityOrder = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case 'pickupTime':
        return new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime();
      case 'value':
        return b.value - a.value;
      case 'createdAt':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#345E85] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (viewMode === 'details' && selectedCargo) {
    return (
      <CargoDetails
        cargoId={selectedCargo.id}
        onBack={() => setViewMode('list')}
        onInspect={() => setViewMode('inspection')}
        onAccept={handleAcceptCargo}
        onReject={handleRejectCargo}
        onContactShipper={handleContactShipper}
      />
    );
  }

  if (viewMode === 'inspection' && selectedCargo) {
    return (
      <CargoInspection
        cargoId={selectedCargo.id}
        onInspectionComplete={handleInspectionComplete}
        onCancel={() => setViewMode('list')}
      />
    );
  }

  if (viewMode === 'delivery' && selectedCargo) {
    return (
      <ProofOfDelivery
        cargoId={selectedCargo.id}
        onPODComplete={handlePODSubmit}
        onCancel={() => setViewMode('list')}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-1 bg-blue-50 text-[#345E85] text-[10px] font-black uppercase tracking-[0.2em] rounded-lg">
              Logistics
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0f172a] uppercase tracking-tight">
            Cargo Management
          </h2>
          <p className="text-sm text-slate-400 font-medium mt-0.5">
            Manage your assigned loads and consignments
          </p>
        </div>

        {checkedCargos.size > 0 && (
          <button
            onClick={handleProceedJourney}
            disabled={proceeding}
            className="w-full sm:w-auto px-5 py-3 bg-[#345E85] text-white rounded-xl text-xs font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {proceeding ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Truck className="w-4 h-4" />
            )}
            Start Trip ({checkedCargos.size})
          </button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Status</label>
            <div className="relative">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full h-10 pl-3 pr-8 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#345E85] appearance-none cursor-pointer">
                <option value="all">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="INSPECTED">Inspected</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="LOADED">Loaded</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="DELIVERED">Delivered</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Priority</label>
            <div className="relative">
              <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full h-10 pl-3 pr-8 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#345E85] appearance-none cursor-pointer">
                <option value="all">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Sort By</label>
            <div className="relative">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full h-10 pl-3 pr-8 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#345E85] appearance-none cursor-pointer">
                <option value="priority">Priority</option>
                <option value="pickupTime">Pickup Time</option>
                <option value="value">Value</option>
                <option value="createdAt">Created Date</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5 col-span-2 lg:col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input type="text" placeholder="Search by name or ID..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-9 pr-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#345E85] placeholder:text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Cargo List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.15em]">
            Consignments <span className="text-[#345E85] ml-1">{sortedCargos.length}</span>
          </h3>
          {sortedCargos.length > 0 && (
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input type="checkbox"
                  checked={checkedCargos.size === sortedCargos.length && sortedCargos.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) setCheckedCargos(new Set(sortedCargos.map(c => c.id)));
                    else setCheckedCargos(new Set());
                  }}
                  className="peer sr-only" />
                <div className="w-4 h-4 border-2 border-slate-300 rounded-md peer-checked:bg-[#345E85] peer-checked:border-[#345E85] transition-all" />
                <CheckCircle className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 transition-all" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-[#345E85] transition-colors">Select All</span>
            </label>
          )}
        </div>

        {sortedCargos.length > 0 ? (
          <div className="grid gap-3">
            {sortedCargos.map((cargo, index) => (
              <motion.div key={cargo.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="group relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm hover:shadow-lg hover:border-blue-100/60 transition-all duration-300"
              >
                {/* Top row: checkbox + name + badges */}
                <div className="flex items-start gap-3">
                  <label className="cursor-pointer mt-0.5 flex-shrink-0">
                    <input type="checkbox" checked={checkedCargos.has(cargo.id)}
                      onChange={(e) => {
                        const newChecked = new Set(checkedCargos);
                        if (e.target.checked) newChecked.add(cargo.id); else newChecked.delete(cargo.id);
                        setCheckedCargos(newChecked);
                      }} className="peer sr-only" />
                    <div className="w-5 h-5 border-2 border-slate-200 rounded-lg peer-checked:bg-[#345E85] peer-checked:border-[#345E85] transition-all flex items-center justify-center">
                      <CheckCircle className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-all" />
                    </div>
                  </label>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <h4 className="text-base font-bold text-[#0f172a] group-hover:text-[#345E85] transition-colors">{cargo.name}</h4>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border flex-shrink-0 ${getStatusColor(cargo.status)}`}>
                        {cargo.status.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border flex-shrink-0 ${getPriorityColor(cargo.priority)}`}>
                        {cargo.priority}
                      </span>
                      {cargo.status === 'DELIVERED' && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 flex-shrink-0">
                          <ShieldCheck size={9} /> POD
                        </span>
                      )}
                    </div>
                    {cargo.description && <p className="text-xs text-slate-500 line-clamp-2">{cargo.description}</p>}
                    <div className="mt-1.5">
                      {cargo.inspectionStatus === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border border-emerald-100">
                          <CheckCircle className="w-3 h-3" /> Inspected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border border-amber-100 animate-pulse">
                          <AlertTriangle className="w-3 h-3" /> Inspection Required
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Value — sm+ only */}
                  <div className="hidden sm:block text-right flex-shrink-0 pl-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Value</span>
                    <span className="text-base font-black text-emerald-600">${cargo.value.toLocaleString()}</span>
                  </div>
                </div>

                {/* Meta grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100/60">
                  <div>
                    <div className="flex items-center gap-1 text-slate-400 mb-0.5"><Weight className="w-3 h-3" /><span className="text-[9px] font-black uppercase tracking-wider">Weight</span></div>
                    <p className="text-xs font-bold text-slate-700">{cargo.weight} kg</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-slate-400 mb-0.5"><Ruler className="w-3 h-3" /><span className="text-[9px] font-black uppercase tracking-wider">Dims</span></div>
                    <p className="text-xs font-bold text-slate-700">{cargo.dimensions.length}×{cargo.dimensions.width}×{cargo.dimensions.height}</p>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-1 text-slate-400 mb-0.5"><Calendar className="w-3 h-3" /><span className="text-[9px] font-black uppercase tracking-wider">Schedule</span></div>
                    <p className="text-xs font-bold text-slate-700">
                      {cargo.pickupTime ? new Date(cargo.pickupTime).toLocaleDateString() : '—'}
                      <span className="text-slate-300 mx-1">→</span>
                      {cargo.deliveryTime ? new Date(cargo.deliveryTime).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>

                {/* Route */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2.5">
                  <div className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-100/50">
                    <div className="flex items-center gap-1.5 text-[#345E85] mb-0.5"><div className="w-2 h-2 rounded-full bg-[#345E85]" /><span className="text-[9px] font-black uppercase tracking-wider">Pickup</span></div>
                    <p className="text-xs font-semibold text-slate-700 truncate">{cargo.pickupLocation}</p>
                  </div>
                  <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                    <div className="flex items-center gap-1.5 text-emerald-600 mb-0.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[9px] font-black uppercase tracking-wider">Delivery</span></div>
                    <p className="text-xs font-semibold text-slate-700 truncate">{cargo.deliveryLocation}</p>
                  </div>
                </div>

                {/* Tags */}
                {(cargo.hazardous || cargo.fragility !== 'LOW' || cargo.temperature.min !== null) && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {cargo.hazardous && <span className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[9px] font-black uppercase flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Hazardous</span>}
                    {cargo.fragility !== 'LOW' && <span className="px-2 py-0.5 bg-orange-50 text-orange-600 border border-orange-100 rounded-lg text-[9px] font-black uppercase flex items-center gap-1"><Package className="w-3 h-3" /> {cargo.fragility} Fragility</span>}
                    {cargo.temperature.min !== null && <span className="px-2 py-0.5 bg-cyan-50 text-cyan-600 border border-cyan-100 rounded-lg text-[9px] font-black uppercase flex items-center gap-1"><Thermometer className="w-3 h-3" />{cargo.temperature.min}°–{cargo.temperature.max}° {cargo.temperature.unit}</span>}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-50">
                  <button onClick={() => handleViewDetails(cargo)}
                    className="flex-1 min-w-[80px] px-3 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#345E85] hover:text-white transition-all flex items-center justify-center gap-1.5">
                    Details <ArrowRight className="w-3 h-3" />
                  </button>

                  {cargo.status === 'PENDING' && (<>
                    <button onClick={() => handleInspectCargo(cargo)}
                      className={`flex-1 min-w-[90px] px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border ${cargo.inspectionStatus === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100 animate-pulse'}`}>
                      <Search className="w-3 h-3" />{cargo.inspectionStatus === 'COMPLETED' ? 'Re-inspect' : 'Inspect'}
                    </button>
                    {cargo.inspectionStatus === 'COMPLETED' && (
                      <button onClick={() => { setSelectedCargo(cargo); handleAcceptCargo(cargo); }}
                        className="flex-1 min-w-[100px] px-3 py-2.5 bg-[#345E85] text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-900 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-900/20">
                        <Truck className="w-3 h-3" /> Load & Confirm
                      </button>
                    )}
                  </>)}

                  {(cargo.status === 'IN_TRANSIT' || cargo.status === 'LOADED') && (
                    <button onClick={() => handleDeliverCargo(cargo)}
                      className="flex-1 min-w-[120px] px-3 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 animate-pulse shadow-md shadow-emerald-900/10">
                      <CheckCircle className="w-3.5 h-3.5" /> Complete Delivery
                    </button>
                  )}

                  <button onClick={() => { setHealthCargo(cargo); setShowHealthModal(true); }}
                    className="px-3 py-2.5 bg-blue-50 border border-blue-100 text-blue-500 rounded-xl hover:bg-blue-100 transition-all flex items-center justify-center" title="Telemetry Health Scan">
                    <Activity className="w-4 h-4" />
                  </button>

                  <button onClick={handleContactShipper}
                    className="px-3 py-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:border-slate-300 hover:text-slate-600 transition-all flex items-center justify-center" title="Contact Shipper">
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : null}
      </div>

      <AnimatePresence>
        {showHealthModal && (
          <CargoHealthModal
            isOpen={showHealthModal}
            onClose={() => { setShowHealthModal(false); setHealthCargo(null); }}
            cargo={healthCargo}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
