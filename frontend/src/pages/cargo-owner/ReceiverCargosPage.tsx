import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import receiverService from '../../services/receiverService';
import { FaBox, FaSpinner, FaCalendarAlt, FaTruck, FaClipboardCheck, FaCheckCircle, FaEye } from 'react-icons/fa';
import { Search, Grid, Table, Package, User, Eye } from 'lucide-react';
import CargoDetailsModal from '../../components/CargoDetailsModal';
import FilterSelect from '../../components/common/FilterSelect';
import { cn } from '../../utils/cn';
import { TranslatedText } from '../../components/translated-text';
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

const ReceiverCargosPage: React.FC = () => {
  const { tSync } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [inspectionStatuses, setInspectionStatuses] = useState<Record<string, any>>({});
  const [selectedCargoId, setSelectedCargoId] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Filter & View States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [cargoTypeFilter, setCargoTypeFilter] = useState("");
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');

  useEffect(() => {
    loadMyCargos();
  }, []);

  // Handle deep linking to specific cargo
  useEffect(() => {
    const viewId = searchParams.get('view');
    if (viewId && cargos.length > 0) {
      const cargoToView = cargos.find(c => c.id === viewId);
      if (cargoToView) {
        setSelectedCargoId(viewId);
        setShowDetailsModal(true);
        // Clean up URL without reload
        window.history.replaceState({}, '', '/dashboard/cargos/my-cargos');
      }
    }
  }, [cargos, searchParams]);

  const loadMyCargos = async () => {
    try {
      setLoading(true);
      const data = await receiverService.getMyCargos();
      setCargos(data);
      
      // Load inspection statuses for all cargos
      const statuses: Record<string, any> = {};
      for (const cargo of data) {
        try {
          const inspection = await receiverService.getCargoInspection(cargo.id);
          if (inspection) {
            statuses[cargo.id] = inspection;
          }
        } catch (error) {
          // No inspection found, that's fine
        }
      }
      setInspectionStatuses(statuses);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load your cargos');
    } finally {
      setLoading(false);
    }
  };

  const filteredCargos = useMemo(() => {
    let filtered = cargos;

    if (searchTerm && searchTerm.trim()) {
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

    if (statusFilter) {
      filtered = filtered.filter((cargo) => cargo.status === statusFilter);
    }

    if (cargoTypeFilter) {
      filtered = filtered.filter((cargo) => cargo.cargoType === cargoTypeFilter);
    }

    return filtered;
  }, [cargos, searchTerm, statusFilter, cargoTypeFilter]);

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
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-primary-600 text-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Assigned Cargos</h1>
          <p className="text-sm text-gray-600 mt-1">
            View all cargos that have been assigned to you
          </p>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pl-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          
          <div className="w-full lg:w-48">
            <FilterSelect
              label="Status"
              value={statusFilter}
              placeholder="All Status"
              options={[
                { value: "ASSIGNED", label: "Assigned" },
                { value: "IN_TRANSIT", label: "In Transit" },
                { value: "DELIVERED", label: "Delivered" },
                { value: "COMPLETED", label: "Completed" },
              ]}
              onChange={setStatusFilter}
            />
          </div>

          <div className="w-full lg:w-48">
             <FilterSelect
              label="Cargo Type"
              value={cargoTypeFilter}
              placeholder="All Types"
              options={[
                 { value: "GENERAL", label: "General" },
                 { value: "FRAGILE", label: "Fragile" },
                 { value: "HAZARDOUS", label: "Hazardous" },
                 { value: "REFRIGERATED", label: "Refrigerated" },
                 { value: "LIQUID", label: "Liquid" },
              ]}
              onChange={setCargoTypeFilter}
            />
          </div>

          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setViewMode('card')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                viewMode === 'card'
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
              )}
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                viewMode === 'table'
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
              )}
            >
              <Table className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>
      </div>

      {filteredCargos.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FaBox className="mx-auto text-gray-400 text-4xl mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Cargos Found</h3>
          <p className="text-sm text-gray-600">
            {searchTerm || statusFilter || cargoTypeFilter 
              ? "No cargos match your filters." 
              : "You don't have any cargos assigned to you yet."}
          </p>
        </div>
      ) : (
        <>
        {viewMode === 'card' ? (
          <div className="grid gap-4">
            {filteredCargos.map((cargo) => (
              <div
                key={cargo.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-primary-100 rounded-lg p-2">
                        <FaBox className="text-primary-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {cargo.title || cargo.cargoType || 'Cargo'}
                        </h3>
                        {cargo.cargoOwner?.profile && (
                          <p className="text-sm text-gray-600">
                            From: {cargo.cargoOwner.profile.firstName} {cargo.cargoOwner.profile.lastName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {/* Dates only - Locations removed as requested */}
                      <div className="flex items-start gap-3">
                        <FaCalendarAlt className="text-gray-400 mt-1" />
                        <div>
                          <p className="text-xs text-gray-500">Pickup Date</p>
                          <p className="text-sm font-medium text-gray-900">
                            {cargo.pickupDate ? new Date(cargo.pickupDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {cargo.deliveryDate && (
                        <div className="flex items-start gap-3">
                          <FaCalendarAlt className="text-gray-400 mt-1" />
                          <div>
                            <p className="text-xs text-gray-500">Delivery Date</p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(cargo.deliveryDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {(cargo.weight || cargo.volume) && (
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
                        {cargo.weight && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Weight:</span>
                            <span className="text-sm font-medium text-gray-900">
                              {cargo.weight} kg
                            </span>
                          </div>
                        )}
                        {cargo.volume && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Volume:</span>
                            <span className="text-sm font-medium text-gray-900">
                              {cargo.volume} m³
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="ml-4 flex flex-col items-end gap-3">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        cargo.status,
                      )}`}
                    >
                      {cargo.status?.replace('_', ' ') || 'Unknown'}
                    </span>
                    
                    <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => handleViewDetails(cargo)}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium border border-gray-300"
                        >
                          <FaEye />
                          View Details
                        </button>

                        {inspectionStatuses[cargo.id]?.status === 'COMPLETED' || inspectionStatuses[cargo.id]?.allItemsVerified ? (
                          <div className="flex flex-col items-end gap-2">
                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                              <FaCheckCircle />
                              Inspection Completed
                            </span>
                            <button
                              onClick={() => navigate(`/dashboard/cargos/${cargo.id}/inspect`)}
                              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                            >
                              <FaClipboardCheck />
                              View Inspection
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => navigate(`/dashboard/cargos/${cargo.id}/inspect`)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                          >
                            <FaClipboardCheck />
                            Inspect Cargo
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inspection</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCargos.map((cargo) => (
                    <tr key={cargo.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{cargo.title || 'Untitled'}</div>
                            <div className="text-xs text-gray-500">{cargo.cargoType}</div>
                            {cargo.cargoOwner?.profile && (
                                <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {cargo.cargoOwner.profile.firstName} {cargo.cargoOwner.profile.lastName}
                                </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-900 break-words max-w-[200px]">{cargo.pickupLocation}</div>
                        <div className="text-xs text-gray-400 my-0.5">↓</div>
                        <div className="text-xs text-gray-900 break-words max-w-[200px]">{cargo.deliveryLocation}</div>
                      </td>
                       <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs text-gray-900">
                             <span className="text-gray-500">Pickup:</span> {cargo.pickupDate ? new Date(cargo.pickupDate).toLocaleDateString() : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-900 mt-0.5">
                             <span className="text-gray-500">Delivery:</span> {cargo.deliveryDate ? new Date(cargo.deliveryDate).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={cn(
                          "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full",
                          getStatusColor(cargo.status)
                        )}>
                          {cargo.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                         {inspectionStatuses[cargo.id]?.status === 'COMPLETED' || inspectionStatuses[cargo.id]?.allItemsVerified ? (
                             <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                                 <FaCheckCircle className="w-3.5 h-3.5" />
                                 Completed
                             </span>
                         ) : (
                             <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                                 <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                 Pending
                             </span>
                         )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                           {/* Inspect Action - Only show if NOT completed */}
                           {!(inspectionStatuses[cargo.id]?.status === 'COMPLETED' || inspectionStatuses[cargo.id]?.allItemsVerified) && (
                                <button
                                    onClick={() => navigate(`/dashboard/cargos/${cargo.id}/inspect`)}
                                    className="text-gray-600 hover:text-primary-600 transition-colors p-1"
                                    title="Inspect Cargo"
                                >
                                    <FaClipboardCheck className="w-4 h-4" />
                                </button>
                           )}
                           {/* View Inspection Action - Only show if completed */}
                           {(inspectionStatuses[cargo.id]?.status === 'COMPLETED' || inspectionStatuses[cargo.id]?.allItemsVerified) && (
                                <button
                                    onClick={() => navigate(`/dashboard/cargos/${cargo.id}/inspect`)}
                                    className="text-green-600 hover:text-green-800 transition-colors p-1"
                                    title="View Inspection"
                                >
                                    <FaClipboardCheck className="w-4 h-4" />
                                </button>
                           )}
                           {/* View Details Action */}
                          <button
                            onClick={() => handleViewDetails(cargo)}
                             className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                            title="View Details"
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

