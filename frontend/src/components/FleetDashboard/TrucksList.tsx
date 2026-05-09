import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Truck,
  MapPin,
  Trash2,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Users,
  FileText,
  Navigation,
  LayoutGrid,
  List,
  ChevronRight,
  Edit2,
  Eye,
  Route,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  X,
  Loader2
} from 'lucide-react';
import { fleetApi, type Route as RouteType } from '../../services/fleetApi';
import { fetchAdminRoutes } from '../../services/adminApi';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import TruckLocationModal from './TruckLocationModal';
import AssignmentModal from './AssignmentModal';
import DocumentUploadModal from '../documents/DocumentUploadModal';
import FleetFormStepper from './FleetFormStepper';
import TruckDetailsModal from './TruckDetailsModal';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface TrucksListProps {
  onAddTruck?: () => void;
  refreshTrigger?: number;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export const TrucksList: React.FC<TrucksListProps> = ({ onAddTruck, refreshTrigger }) => {
  const { user, accessToken, isLoading: authLoading } = useAuth();
  const [trucks, setTrucks] = useState<any[]>([]);
  const [routes, setRoutes] = useState<RouteType[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTruck, setSelectedTruck] = useState<any>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showAssignDriverModal, setShowAssignDriverModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignRouteModal, setShowAssignRouteModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Sorting & Pagination
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'plateNumber', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [truckToDelete, setTruckToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Load Data with Route Enrichment ---
  const loadData = useCallback(async () => {
    if (!user || !accessToken || authLoading) return;
    setLoading(true);
    try {
      const [trucksData, analyticsData] = await Promise.all([
        fleetApi.getTrucks({ limit: 100 }),
        fleetApi.fetchAnalytics(),
      ]);

      // Deep route enrichment: fetch per-truck routes
      const enrichedTrucks = await Promise.all(
        (trucksData || []).map(async (truck) => {
          try {
            const truckRoutes = await fleetApi.getTruckRoutes(truck.id);
            const assignedRoutes = (truckRoutes || []).filter(Boolean).map((r: any) => ({
              routeId: r.id,
              routeName: r?.name || 'Unknown Route',
              origin: r?.origin,
              destination: r?.destination,
              distance: r?.distance,
              assignmentDate: r?.assignmentDate || new Date().toISOString(),
              status: r?.status || 'active',
            }));
            return { ...truck, assignedRoutes };
          } catch {
            return { ...truck, assignedRoutes: truck.assignedRoutes || [] };
          }
        })
      );

      setTrucks(enrichedTrucks);
      setAnalytics(analyticsData);

      // Load routes list for the assign route modal
      try {
        let routesData = await fleetApi.fetchRoutes();
        // Fallback to admin routes if empty and user is admin
        if ((!routesData || routesData.length === 0)) {
          const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN'].includes(user.role);
          if (isAdmin) {
            const adminRoutes = await fetchAdminRoutes({ tenantId: user.tenantId, status: 'active' });
            routesData = (adminRoutes || []).map((r: any) => ({
              id: r.id,
              name: r.name,
              origin: r.origin,
              destination: r.destination,
              distance: Number(r.distance) || 0,
              estimatedTime: Number(r.estimatedDuration || r.estimatedTime) || 0,
              status: r.status || 'active',
              assignedDrivers: Array.isArray(r.assignedDrivers) ? r.assignedDrivers : [],
              assignedTrucks: Array.isArray(r.assignedTrucks) ? r.assignedTrucks : [],
              isActive: true,
              createdAt: r.createdAt || '',
              updatedAt: r.updatedAt || '',
            }));
          }
        }
        setRoutes(routesData || []);
      } catch {
        setRoutes([]);
      }
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user, accessToken, authLoading]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  // --- Sorting ---
  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={12} className="text-slate-300" />;
    return sortConfig.direction === 'asc'
      ? <ArrowUp size={12} className="text-primary-500" />
      : <ArrowDown size={12} className="text-primary-500" />;
  };

  // --- Filtering + Sorting + Pagination ---
  const filteredAndSortedTrucks = useMemo(() => {
    const result = trucks.filter(truck => {
      const matchesSearch = !search ||
        truck.plateNumber?.toLowerCase().includes(search.toLowerCase()) ||
        truck.make?.toLowerCase().includes(search.toLowerCase()) ||
        truck.model?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || truck.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Sorting
    result.sort((a, b) => {
      const aVal = a[sortConfig.key] ?? '';
      const bVal = b[sortConfig.key] ?? '';
      const compare = typeof aVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal));
      return sortConfig.direction === 'asc' ? compare : -compare;
    });

    return result;
  }, [trucks, search, statusFilter, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedTrucks.length / itemsPerPage);
  const paginatedTrucks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedTrucks.slice(start, start + itemsPerPage);
  }, [filteredAndSortedTrucks, currentPage, itemsPerPage]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  // --- Handlers ---
  const handleEditTruck = (truck: any) => {
    setSelectedTruck(truck);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (data: any) => {
    if (!selectedTruck) return;
    try {
      const updatedTruck = await fleetApi.updateTruck(selectedTruck.id, data);
      console.log('✅ Truck updated successfully:', updatedTruck);
      toast.success(`Truck ${selectedTruck.plateNumber} updated successfully`);
      setShowEditModal(false);
      setSelectedTruck(null);
      
      // Wait for data refresh to complete
      await loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update truck');
    }
  };

  const handleAssignDriver = (truck: any) => {
    setSelectedTruck(truck);
    setShowAssignDriverModal(true);
  };

  const handleAssignRoute = (truck: any) => {
    setSelectedTruck(truck);
    setShowAssignRouteModal(true);
  };

  const handleAddDocument = (truck: any) => {
    setSelectedTruck(truck);
    setShowDocumentModal(true);
  };

  const handleSetLocation = (truck: any) => {
    setSelectedTruck(truck);
    setShowLocationModal(true);
  };

  const handleViewTruck = (truck: any) => {
    setSelectedTruck(truck);
    setShowDetailsModal(true);
  };

  // --- Delete with ConfirmDialog ---
  const handleDeleteTruck = (truck: any) => {
    setTruckToDelete(truck);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!truckToDelete) return;
    setIsDeleting(true);
    try {
      await fleetApi.deleteTruck(truckToDelete.id);
      toast.success(`Truck ${truckToDelete.plateNumber} deleted successfully`);
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete truck');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setTruckToDelete(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available': return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900';
      case 'in_transit': return 'bg-primary-50 dark:bg-primary-950/20 text-primary-500 dark:text-primary-400 border-primary-50 dark:border-primary-900';
      case 'maintenance': return 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900';
      default: return 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-700';
    }
  };

  const CircularStatsCard = ({ title, value, icon: Icon, colorClass, secondaryColor }: any) => {
    return (
      <div className="flex flex-col items-center group">
        <div className="relative w-40 h-40 rounded-full bg-white dark:bg-gray-900 border-[8px] border-gray-50 dark:border-gray-800 flex flex-col items-center justify-center transition-all duration-500 hover:border-gray-100 dark:hover:border-gray-700">
          <svg className="absolute inset-0 w-full h-full -rotate-90 scale-[1.05]">
            <circle
              cx="80"
              cy="80"
              r="72"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="452"
              strokeDashoffset="350"
              className={cn("opacity-10 transition-all duration-1000 group-hover:stroke-dashoffset-[200]", secondaryColor)}
            />
          </svg>

          <div className={cn("p-2 rounded-2xl mb-2 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 group-hover:bg-white dark:group-hover:bg-gray-700 group-hover:text-inherit transition-all duration-500", colorClass)}>
            <Icon size={18} />
          </div>

          <div className="flex flex-col items-center px-4 w-full overflow-hidden">
            <span className="text-xl font-black text-[#0f172a] dark:text-white tracking-tight group-hover:scale-110 transition-transform duration-500 truncate w-full text-center">
              {value}
            </span>
          </div>

          <div className="absolute inset-4 rounded-full border border-dashed border-slate-100 dark:border-slate-800 opacity-50 group-hover:rotate-90 transition-transform duration-1000" />
        </div>

        <div className="mt-4 text-center px-2">
          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] group-hover:text-[#345E85] dark:group-hover:text-primary-400 transition-colors duration-300 line-clamp-1">
            {title}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Stats Matrix */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12 place-items-center bg-white dark:bg-gray-900 p-10 rounded-lg border border-gray-100 dark:border-gray-800 transition-colors duration-300">
        <CircularStatsCard
          title="Total Trucks"
          value={analytics?.totalTrucks !== undefined ? analytics.totalTrucks : trucks.length}
          icon={Truck}
          colorClass="bg-blue-50 text-[#345E85]"
          secondaryColor="text-[#345E85]"
        />
        <CircularStatsCard
          title="Available"
          value={analytics?.availableTrucks !== undefined ? analytics.availableTrucks : trucks.filter(t => t.status === 'AVAILABLE').length}
          icon={CheckCircle2}
          colorClass="bg-emerald-50 text-emerald-600"
          secondaryColor="text-emerald-600"
        />
        <CircularStatsCard
          title="In Transit"
          value={analytics?.inTransit !== undefined ? analytics.inTransit : trucks.filter(t => t.status === 'IN_TRANSIT').length}
          icon={Clock}
          colorClass="bg-primary-50 text-primary-500"
          secondaryColor="text-primary-500"
        />
        <CircularStatsCard
          title="Attention Required"
          value={analytics?.maintenanceAlerts !== undefined ? analytics.maintenanceAlerts : trucks.filter(t => t.status === 'MAINTENANCE').length}
          icon={AlertTriangle}
          colorClass="bg-rose-50 text-rose-600"
          secondaryColor="text-rose-600"
        />
      </div>

      {/* Control Surface */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 p-4 flex flex-col md:flex-row gap-4 transition-colors duration-300">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors" />
          <input
            type="text"
            placeholder="Search truck..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-50 dark:border-gray-700 rounded-lg text-[11px] font-bold text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-700 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-50 dark:bg-gray-800 p-1 rounded-lg border border-gray-100 dark:border-gray-700 mr-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
            >
              <List size={16} />
            </button>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-50 dark:border-gray-700 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 outline-none focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
          >
            <option value="">Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
          <button
            onClick={onAddTruck}
            className="px-6 py-3 bg-blue-500 dark:bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-blue-600 dark:hover:bg-blue-700 transition-all"
          >
            <Plus size={14} /> Add New Truck
          </button>
        </div>
      </div>

      {/* Result Count & Sort Info */}
      {!loading && (
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Showing {paginatedTrucks.length} of {filteredAndSortedTrucks.length} trucks
          </p>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Sorted by {sortConfig.key.replace(/([A-Z])/g, ' $1').trim()} ({sortConfig.direction})
          </p>
        </div>
      )}

      {/* Truck Content */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode='popLayout'>
            {paginatedTrucks.map(truck => (
              <motion.div
                layout
                key={truck.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 p-6 hover:border-blue-200 dark:hover:border-blue-900 transition-all relative overflow-hidden group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="size-14 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                    <Truck size={28} />
                  </div>
                  <div className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusColor(truck.status)}`}>
                    {truck.status}
                  </div>
                </div>
                <div className="mb-4">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-1">{truck.plateNumber}</h3>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{truck.make} {truck.model}</p>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <Truck size={14} className="text-primary-400" />
                    <span className="text-xs font-medium">{truck.truckType || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <MapPin size={14} className="text-primary-400" />
                    <span className="text-xs font-medium truncate">
                      {typeof truck.currentLocation === 'string'
                        ? truck.currentLocation
                        : truck.currentLocation?.address || 'No Location'}
                    </span>
                  </div>
                  {truck.assignedRoutes && truck.assignedRoutes.length > 0 && (
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                      <Route size={14} className="text-emerald-400" />
                      <span className="text-xs font-medium">{truck.assignedRoutes.length} route{truck.assignedRoutes.length > 1 ? 's' : ''} assigned</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewTruck(truck)}
                    className="flex-1 h-10 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-all flex items-center justify-center gap-1"
                  >
                    <Eye size={14} /> View
                  </button>
                  <button
                    onClick={() => handleEditTruck(truck)}
                    className="flex-1 h-10 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                  >
                    Edit
                  </button>
                </div>
                <div className="flex gap-1 mt-2">
                  <button
                    onClick={() => handleAssignDriver(truck)}
                    className="flex-1 size-10 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-primary-500 dark:hover:text-primary-400 rounded-xl flex items-center justify-center transition-all"
                    title="Assign Driver"
                  >
                    <Users size={16} />
                  </button>
                  <button
                    onClick={() => handleAssignRoute(truck)}
                    className="flex-1 size-10 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 rounded-xl flex items-center justify-center transition-all"
                    title="Assign Route"
                  >
                    <Route size={16} />
                  </button>
                  <button
                    onClick={() => handleAddDocument(truck)}
                    className="flex-1 size-10 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-primary-500 dark:hover:text-primary-400 rounded-xl flex items-center justify-center transition-all"
                    title="Add Document"
                  >
                    <FileText size={16} />
                  </button>
                  <button
                    onClick={() => handleSetLocation(truck)}
                    className="flex-1 size-10 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-primary-500 dark:hover:text-primary-400 rounded-xl flex items-center justify-center transition-all"
                    title="Set Location"
                  >
                    <Navigation size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteTruck(truck)}
                    className="flex-1 size-10 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-rose-600 rounded-xl flex items-center justify-center transition-all"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 cursor-pointer hover:text-primary-500" onClick={() => handleSort('plateNumber')}>
                    <span className="flex items-center gap-2">Truck {getSortIcon('plateNumber')}</span>
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 cursor-pointer hover:text-primary-500" onClick={() => handleSort('truckType')}>
                    <span className="flex items-center gap-2">Type {getSortIcon('truckType')}</span>
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 cursor-pointer hover:text-primary-500" onClick={() => handleSort('status')}>
                    <span className="flex items-center gap-2">Status {getSortIcon('status')}</span>
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Location</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Routes</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {paginatedTrucks.map(truck => (
                  <tr key={truck.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="size-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
                          <Truck size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white leading-none mb-1">{truck.plateNumber}</p>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{truck.make} {truck.model}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                          <Truck size={12} className="text-primary-400" />
                          {truck.truckType || 'Standard'}
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">Payload: {truck.capacityWeight?.toLocaleString() || 0} kg</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusColor(truck.status)}`}>
                        {truck.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 max-w-[200px]">
                        <MapPin size={12} className="text-primary-400 shrink-0" />
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                          {typeof truck.currentLocation === 'string'
                            ? truck.currentLocation
                            : truck.currentLocation?.address || 'Geolocation Offline'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {truck.assignedRoutes && truck.assignedRoutes.length > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                          <Route size={10} /> {truck.assignedRoutes.length}
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewTruck(truck)}
                          className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleEditTruck(truck)}
                          className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleAssignDriver(truck)}
                          className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-lg transition-all"
                          title="Assign Driver"
                        >
                          <Users size={14} />
                        </button>
                        <button
                          onClick={() => handleAssignRoute(truck)}
                          className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-lg transition-all"
                          title="Assign Route"
                        >
                          <Route size={14} />
                        </button>
                        <button
                          onClick={() => handleAddDocument(truck)}
                          className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-lg transition-all"
                          title="Documents"
                        >
                          <FileText size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteTruck(truck)}
                          className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                        <div className="size-8 flex items-center justify-center text-slate-200 dark:text-slate-700">
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-900 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2)
            .reduce<(number | string)[]>((acc, page, idx, arr) => {
              if (idx > 0 && page - (arr[idx - 1] as number) > 1) acc.push('...');
              acc.push(page);
              return acc;
            }, [])
            .map((item, idx) =>
              typeof item === 'string' ? (
                <span key={`dots-${idx}`} className="px-2 text-slate-300 dark:text-slate-700 text-xs font-bold">...</span>
              ) : (
                <button
                  key={item}
                  onClick={() => setCurrentPage(item)}
                  className={`size-10 rounded-xl text-xs font-black transition-all ${currentPage === item
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                    : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-primary-500 dark:hover:text-primary-400 hover:border-primary-200 dark:hover:border-primary-900'
                    }`}
                >
                  {item}
                </button>
              )
            )}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-900 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
          <div className="size-12 bg-slate-100 dark:bg-slate-800 rounded-full mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Loading...</p>
        </div>
      )}

      {!loading && filteredAndSortedTrucks.length === 0 && (
        <div className="py-20 text-center flex flex-col items-center">
          <div className="size-16 bg-slate-50 dark:bg-slate-800 rounded-[28px] flex items-center justify-center text-slate-200 dark:text-slate-700 mb-6"><Truck size={32} /></div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">No Trucks Found</h3>
          <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-2">No trucks found matching your search.</p>
        </div>
      )}

      {/* Edit Truck Modal */}
      {selectedTruck && showEditModal && (
        <FleetFormStepper
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTruck(null);
          }}
          onSubmit={handleEditSubmit}
          initialData={selectedTruck}
          mode="edit"
          activeTab="trucks"
        />
      )}

      {/* Assign Driver Modal */}
      {selectedTruck && (
        <AssignmentModal
          isOpen={showAssignDriverModal}
          onClose={() => {
            setShowAssignDriverModal(false);
            setSelectedTruck(null);
          }}
          truckId={selectedTruck.id}
          truckName={selectedTruck.plateNumber}
          onAssignSuccess={() => loadData()}
        />
      )}

      {/* Document Upload Modal */}
      {selectedTruck && showDocumentModal && (
        <DocumentUploadModal
          isOpen={true}
          onClose={() => {
            setShowDocumentModal(false);
            setSelectedTruck(null);
          }}
          onSuccess={() => {
            setShowDocumentModal(false);
            setSelectedTruck(null);
            loadData();
          }}
          initialEntityType="TRUCK"
          initialEntityId={selectedTruck.id}
          lockEntity={true}
        />
      )}

      {/* Set Location Modal */}
      {selectedTruck && (
        <TruckLocationModal
          isOpen={showLocationModal}
          onClose={() => {
            setShowLocationModal(false);
            setSelectedTruck(null);
          }}
          truck={{
            id: selectedTruck.id,
            name: `${selectedTruck.make || ''} ${selectedTruck.model || ''}`.trim() || selectedTruck.plateNumber,
            plateNumber: selectedTruck.plateNumber,
            currentLocation: selectedTruck.currentLocation,
          }}
          onLocationUpdated={() => loadData()}
        />
      )}

      {/* Truck Details Modal */}
      {showDetailsModal && selectedTruck && (
        <TruckDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedTruck(null);
          }}
          truckId={selectedTruck.id}
        />
      )}

      {/* Route Assignment Modal */}
      {showAssignRouteModal && selectedTruck && (
        <RouteAssignModal
          isOpen={showAssignRouteModal}
          onClose={() => {
            setShowAssignRouteModal(false);
            setSelectedTruck(null);
          }}
          truck={selectedTruck}
          routes={routes}
          onSuccess={() => {
            setShowAssignRouteModal(false);
            setSelectedTruck(null);
            loadData();
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Truck"
        message={`Are you sure you want to delete truck "${truckToDelete?.plateNumber}"?\n\nThis action cannot be undone and will remove all associated data.`}
        confirmText="Delete Truck"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setTruckToDelete(null);
        }}
      />
    </div>
  );
};


// ==========================================
// Route Assignment Modal Component
// ==========================================
interface RouteAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  truck: any;
  routes: RouteType[];
  onSuccess: () => void;
}

const RouteAssignModal: React.FC<RouteAssignModalProps> = ({ isOpen, onClose, truck, routes, onSuccess }) => {
  const [assigning, setAssigning] = useState<string | null>(null);
  const [unassigning, setUnassigning] = useState<string | null>(null);
  const [routeSearch, setRouteSearch] = useState('');

  if (!isOpen) return null;

  const assignedRouteIds = (truck.assignedRoutes || []).map((r: any) => r.routeId || r.id);

  const filteredRoutes = routes.filter(r =>
    !routeSearch ||
    r.name?.toLowerCase().includes(routeSearch.toLowerCase()) ||
    r.origin?.toLowerCase().includes(routeSearch.toLowerCase()) ||
    r.destination?.toLowerCase().includes(routeSearch.toLowerCase())
  );

  const unassignedRoutes = filteredRoutes.filter(r => !assignedRouteIds.includes(r.id));
  const assignedRoutes = filteredRoutes.filter(r => assignedRouteIds.includes(r.id));

  const handleAssign = async (routeId: string) => {
    setAssigning(routeId);
    try {
      await fleetApi.assignRouteToTruck(truck.id, routeId);
      toast.success('Route assigned successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to assign route');
    } finally {
      setAssigning(null);
    }
  };

  const handleUnassign = async (routeId: string) => {
    setUnassigning(routeId);
    try {
      await fleetApi.unassignRouteFromTruck(truck.id, routeId);
      toast.success('Route unassigned successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to unassign route');
    } finally {
      setUnassigning(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100000] p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-lg flex flex-col max-h-[85vh] border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-50 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Assign Routes</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Manage route assignments for <span className="font-bold text-primary-600 dark:text-primary-400">{truck.plateNumber}</span>
            </p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-rose-500 transition-all flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search routes..."
              value={routeSearch}
              onChange={(e) => setRouteSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Currently Assigned */}
          {assignedRoutes.length > 0 && (
            <div>
              <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Assigned Routes ({assignedRoutes.length})</h4>
              <div className="space-y-2">
                {assignedRoutes.map(route => (
                  <div key={route.id} className="flex items-center gap-3 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Route size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{route.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">{route.origin} → {route.destination}</p>
                    </div>
                    <button
                      onClick={() => handleUnassign(route.id)}
                      disabled={unassigning === route.id}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/50 text-rose-500 dark:text-rose-400 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all disabled:opacity-50"
                    >
                      {unassigning === route.id ? <Loader2 size={12} className="animate-spin" /> : 'Remove'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Routes */}
          <div>
            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Available Routes ({unassignedRoutes.length})</h4>
            {unassignedRoutes.length === 0 ? (
              <div className="text-center py-8">
                <Route className="w-8 h-8 text-slate-200 dark:text-slate-800 mx-auto mb-2" />
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">No available routes to assign</p>
              </div>
            ) : (
              <div className="space-y-2">
                {unassignedRoutes.map(route => (
                  <div key={route.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-primary-200 dark:hover:border-primary-900 transition-all">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 flex items-center justify-center shrink-0">
                      <Route size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{route.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
                        {route.origin} → {route.destination}
                        {route.distance ? ` • ${route.distance} km` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAssign(route.id)}
                      disabled={assigning === route.id}
                      className="px-3 py-1.5 bg-primary-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-primary-600 transition-all disabled:opacity-50 shadow-sm"
                    >
                      {assigning === route.id ? <Loader2 size={12} className="animate-spin" /> : 'Assign'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
