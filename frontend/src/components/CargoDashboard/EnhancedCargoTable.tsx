import React, { useState } from 'react';
import { 
  FaEye, FaEdit, FaTrash, FaBox, FaThermometerHalf, FaShieldAlt, 
  FaTruck, FaMapMarkedAlt, FaClock, FaExclamationTriangle, FaRulerCombined, 
  FaBoxes, FaLock, FaLocationArrow, FaThermometerQuarter, FaMapPin, FaCalendar,
  FaDollarSign, FaCogs, FaCameraRetro, FaChartLine
} from 'react-icons/fa';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

// Temporary fix for module import issue
// import type { Cargo } from '../../types/cargo';
// import { URGENCY_LEVELS } from '../../types/cargo';

// Define the interface locally for now
interface Cargo {
  id: string;
  title: string;
  description?: string;
  weight: number;
  volume?: number;
  cargoType: string;
  pickupLocationId: string;
  deliveryLocationId: string;
  pickupDate: string;
  deliveryDate: string;
  status: string;
  loadValue: number;
  offeredPrice?: number;
  currencyCode: string;
  isFragile: boolean;
  isHazardous: boolean;
  requiresRefrigeration: boolean;
  contactInfo: Record<string, any>;
  autoMatchEnabled: boolean;
  matchingCriteria: Record<string, any>;
  publishedAt?: string;
  assignedTruckId?: string;
  rating: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  length?: number;
  width?: number;
  height?: number;
  stackableHeight?: number;
  isStackable?: boolean;
  temperatureMin?: number;
  temperatureMax?: number;
  requiresHumidityControl?: boolean;
  requiresForklift?: boolean;
  requiresCrane?: boolean;
  requiresLoadingDock?: boolean;
  loadingTimeEstimate?: number;
  unloadingTimeEstimate?: number;
  hazmatClass?: string;
  hazmatNumber?: string;
  urgencyLevel?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  isTimeCritical?: boolean;
  maxTransitTime?: number;
  packagingType?: string;
  numberOfPieces?: number;
  numberOfPallets?: number;
  requiresGpsMonitoring?: boolean;
  requiresTemperatureMonitoring?: boolean;
  insuranceValue?: number;
  requiresLowClearanceRoute?: boolean;
  maxClearanceHeight?: number;
  requiresEscortVehicle?: boolean;
  specialHandlingInstructions?: string;
  loadingInstructions?: string;
  unloadingInstructions?: string;
  emergencyContactInfo?: string;
  truckRequirements?: {
    minCapacityWeight?: number;
    minCapacityVolume?: number;
    requiredTruckTypes?: string[];
    requiredFeatures?: string[];
    maxTruckAge?: number;
    minDriverExperience?: number;
    requiredCertifications?: string[];
    minInsuranceCoverage?: number;
  };
  carrierPreferences?: {
    preferredCarriers?: string[];
    excludedCarriers?: string[];
    minCarrierRating?: number;
    maxDistance?: number;
    maxHoursToAvailability?: number;
  };
  costPreferences?: {
    maxBudget?: number;
    preferredPaymentTerms?: string;
    requiresInsurance?: boolean;
    requiresTracking?: boolean;
  };
  requiresPreShipmentInspection?: boolean;
  requiresDeliveryInspection?: boolean;
  requiresPhotographicDocumentation?: boolean;
  cargoOwner?: {
    id: string;
    email: string;
    profile?: {
      firstName: string;
      lastName: string;
      companyName: string;
    };
  };
  pickupLocation?: {
    id: string;
    name: string;
    address: string;
    coordinates: {
      type: string;
      coordinates: number[];
    };
    locationType: string;
  };
  deliveryLocation?: {
    id: string;
    name: string;
    address: string;
    coordinates: {
      type: string;
      coordinates: number[];
    };
    locationType: string;
  };
}

const URGENCY_LEVELS = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'] as const;

interface EnhancedCargoTableProps {
  cargos: Cargo[];
  onView: (cargo: Cargo) => void;
  onEdit: (cargo: Cargo) => void;
  onDelete: (cargoId: string) => void;
  onPublish: (cargoId: string) => void;
  onEnhancedView: (cargo: Cargo) => void;
  loading?: boolean;
}

const EnhancedCargoTable: React.FC<EnhancedCargoTableProps> = ({
  cargos,
  onView,
  onEdit,
  onDelete,
  onPublish,
  onEnhancedView,
  loading = false
}) => {
  const { format: formatCurrency } = useCurrencyFormat();
  // Ensure cargos is always an array
  const safeCargos = Array.isArray(cargos) ? cargos : [];
  
  console.log('🔍 EnhancedCargoTable rendered with:', { 
    cargosCount: safeCargos.length, 
    loading,
    firstCargo: safeCargos[0] 
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Helper function to check if a value is valid (not 0, not empty, not null, not undefined)
  const hasValue = (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'boolean') return value;
    return true;
  };

  // Helper function to get pickup location display (prefer address, fallback to name)
  const getPickupLocation = (cargo: Cargo): string => {
    if (cargo.pickupLocation?.address && cargo.pickupLocation.address.trim() !== '') {
      return cargo.pickupLocation.address;
    }
    return cargo.pickupLocation?.name || 'Pickup';
  };

  // Helper function to get delivery location display
  const getDeliveryLocation = (cargo: Cargo): string => {
    if (cargo.deliveryLocation?.address && cargo.deliveryLocation.address.trim() !== '') {
      return cargo.deliveryLocation.address;
    }
    return cargo.deliveryLocation?.name || 'Delivery';
  };

  const toggleRow = (cargoId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(cargoId)) {
      newExpanded.delete(cargoId);
    } else {
      newExpanded.add(cargoId);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'created':
        return 'bg-blue-100 text-blue-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'IN_TRANSIT':
        return 'bg-yellow-100 text-yellow-800';
      case 'delivered':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800';
      case 'LOW':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDimensions = (cargo: Cargo) => {
    if (hasValue(cargo.length) && hasValue(cargo.width) && hasValue(cargo.height)) {
      return `${cargo.length}m × ${cargo.width}m × ${cargo.height}m`;
    }
    return null;
  };

  const formatTemperature = (cargo: Cargo) => {
    if (hasValue(cargo.temperatureMin) && hasValue(cargo.temperatureMax)) {
      return `${cargo.temperatureMin}°C - ${cargo.temperatureMax}°C`;
    }
    return null;
  };

  const getCargoIcons = (cargo: Cargo) => {
    const icons = [];
    
    if (cargo.isHazardous) {
      icons.push(<FaExclamationTriangle key="hazardous" className="w-4 h-4 text-red-500" title="Hazardous" />);
    }
    if (cargo.requiresRefrigeration) {
      icons.push(<FaThermometerHalf key="refrigeration" className="w-4 h-4 text-blue-500" title="Refrigerated" />);
    }
    if (cargo.isFragile) {
      icons.push(<FaBox key="fragile" className="w-4 h-4 text-orange-500" title="Fragile" />);
    }
    if (cargo.requiresGpsMonitoring) {
      icons.push(<FaLocationArrow key="gps" className="w-4 h-4 text-green-500" title="GPS Monitoring" />);
    }
    if (cargo.isTimeCritical) {
      icons.push(<FaClock key="time-critical" className="w-4 h-4 text-red-500" title="Time Critical" />);
    }
    if (cargo.requiresLowClearanceRoute) {
      icons.push(<FaMapMarkedAlt key="low-clearance" className="w-4 h-4 text-purple-500" title="Low Clearance Route" />);
    }

    return icons;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-8 text-center">
          <div className="text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading cargos...</h3>
            <p className="text-gray-500">Please wait while we fetch your cargo data.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!safeCargos || safeCargos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-8 text-center">
          <div className="text-gray-500">
            <FaBox className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No cargos found</h3>
            <p className="text-gray-500">No cargo loads match your current filters.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cargo Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dimensions & Weight
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Requirements
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status & Urgency
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {safeCargos.map((cargo) => (
              <React.Fragment key={cargo.id}>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="flex space-x-1">
                          {getCargoIcons(cargo)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {cargo.title}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {cargo.cargoType}{hasValue(cargo.weight) && ` • ${cargo.weight}kg`}
                        </p>
                        {(cargo.pickupLocation || cargo.deliveryLocation) && (
                          <div className="flex items-center space-x-2 mt-1">
                            <FaMapPin className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {getPickupLocation(cargo)} → {getDeliveryLocation(cargo)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {formatDimensions(cargo) && (
                        <div className="flex items-center space-x-2">
                          <FaRulerCombined className="w-3 h-3 text-gray-400" />
                          <span>{formatDimensions(cargo)}</span>
                        </div>
                      )}
                      {hasValue(cargo.volume) && (
                        <div className="flex items-center space-x-2 mt-1">
                          <FaBox className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{cargo.volume}m³</span>
                        </div>
                      )}
                      {hasValue(cargo.weight) && (
                        <div className="flex items-center space-x-2 mt-1">
                          <FaBox className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{cargo.weight}kg</span>
                        </div>
                      )}
                      {cargo.isStackable && (
                        <div className="flex items-center space-x-2 mt-1">
                          <FaBoxes className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">Stackable</span>
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {cargo.requiresRefrigeration && formatTemperature(cargo) && (
                        <div className="flex items-center space-x-2 mb-1">
                          <FaThermometerHalf className="w-3 h-3 text-blue-500" />
                          <span className="text-xs">{formatTemperature(cargo)}</span>
                        </div>
                      )}
                      {cargo.requiresGpsMonitoring && (
                        <div className="flex items-center space-x-2 mb-1">
                          <FaLocationArrow className="w-3 h-3 text-green-500" />
                          <span className="text-xs">GPS Monitoring</span>
                        </div>
                      )}
                      {cargo.requiresLowClearanceRoute && (
                        <div className="flex items-center space-x-2 mb-1">
                          <FaMapMarkedAlt className="w-3 h-3 text-purple-500" />
                          <span className="text-xs">Low Clearance</span>
                        </div>
                      )}
                      {cargo.requiresForklift && (
                        <div className="flex items-center space-x-2">
                          <FaTruck className="w-3 h-3 text-orange-500" />
                          <span className="text-xs">Forklift Required</span>
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(cargo.status)}`}>
                        {cargo.status}
                      </span>
                      {cargo.urgencyLevel && (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(cargo.urgencyLevel)}`}>
                          {cargo.urgencyLevel}
                        </span>
                      )}
                      {cargo.isTimeCritical && (
                        <div className="flex items-center space-x-1">
                          <FaClock className="w-3 h-3 text-red-500" />
                          <span className="text-xs text-red-600">Time Critical</span>
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleRow(cargo.id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Toggle details"
                      >
                        <FaEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEnhancedView(cargo)}
                        className="text-purple-400 hover:text-purple-600 transition-colors"
                        title="Enhanced View"
                      >
                        <FaChartLine className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(cargo)}
                        className="text-blue-400 hover:text-blue-600 transition-colors"
                        title="Edit cargo"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(cargo.id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        title="Delete cargo"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                      {cargo.status === 'draft' && (
                        <button
                          onClick={() => onPublish(cargo.id)}
                          className="text-green-400 hover:text-green-600 transition-colors"
                          title="Publish cargo"
                        >
                          <FaCogs className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                
                {/* Expanded row with detailed information */}
                {expandedRows.has(cargo.id) && (
                  <tr className="bg-gray-50">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Basic Information */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium">Description:</span>
                              <p className="text-gray-600">{cargo.description || 'No description'}</p>
                            </div>
                            {hasValue(cargo.loadValue) && (
                              <div>
                                <span className="font-medium">Load Value:</span>
                                <span className="text-gray-600"> {formatCurrency(cargo.loadValue)}</span>
                              </div>
                            )}
                            {hasValue(cargo.offeredPrice) && (
                              <div>
                                <span className="font-medium">Offered Price:</span>
                                <span className="text-gray-600"> {formatCurrency(cargo.offeredPrice)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Environmental Requirements */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Environmental Requirements</h4>
                          <div className="space-y-2 text-sm">
                            {formatTemperature(cargo) && (
                              <div>
                                <span className="font-medium">Temperature Range:</span>
                                <span className="text-gray-600"> {formatTemperature(cargo)}</span>
                              </div>
                            )}
                            {cargo.hazmatClass && (
                              <div>
                                <span className="font-medium">Hazmat Class:</span>
                                <span className="text-gray-600"> {cargo.hazmatClass}</span>
                              </div>
                            )}
                            {cargo.hazmatNumber && (
                              <div>
                                <span className="font-medium">Hazmat Number:</span>
                                <span className="text-gray-600"> {cargo.hazmatNumber}</span>
                              </div>
                            )}
                            {cargo.requiresHumidityControl && (
                              <div className="flex items-center space-x-1">
                                <FaThermometerQuarter className="w-3 h-3 text-blue-500" />
                                <span className="text-gray-600">Humidity Control Required</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Loading & Unloading */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Loading & Unloading</h4>
                          <div className="space-y-2 text-sm">
                            {cargo.loadingTimeEstimate && (
                              <div>
                                <span className="font-medium">Loading Time:</span>
                                <span className="text-gray-600"> {cargo.loadingTimeEstimate}h</span>
                              </div>
                            )}
                            {cargo.unloadingTimeEstimate && (
                              <div>
                                <span className="font-medium">Unloading Time:</span>
                                <span className="text-gray-600"> {cargo.unloadingTimeEstimate}h</span>
                              </div>
                            )}
                            {cargo.requiresForklift && (
                              <div className="flex items-center space-x-1">
                                <FaTruck className="w-3 h-3 text-orange-500" />
                                <span className="text-gray-600">Forklift Required</span>
                              </div>
                            )}
                            {cargo.requiresCrane && (
                              <div className="flex items-center space-x-1">
                                <FaTruck className="w-3 h-3 text-orange-500" />
                                <span className="text-gray-600">Crane Required</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Security & Insurance */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Security & Insurance</h4>
                          <div className="space-y-2 text-sm">
                            {cargo.insuranceValue && (
                              <div>
                                <span className="font-medium">Insurance Value:</span>
                                <span className="text-gray-600"> {formatCurrency(cargo.insuranceValue)}</span>
                              </div>
                            )}
                            {cargo.requiresGpsMonitoring && (
                              <div className="flex items-center space-x-1">
                                <FaLocationArrow className="w-3 h-3 text-green-500" />
                                <span className="text-gray-600">GPS Monitoring</span>
                              </div>
                            )}
                            {cargo.requiresTemperatureMonitoring && (
                              <div className="flex items-center space-x-1">
                                <FaThermometerHalf className="w-3 h-3 text-blue-500" />
                                <span className="text-gray-600">Temperature Monitoring</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Route & Access */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Route & Access</h4>
                          <div className="space-y-2 text-sm">
                            {cargo.maxClearanceHeight && (
                              <div>
                                <span className="font-medium">Max Clearance:</span>
                                <span className="text-gray-600"> {cargo.maxClearanceHeight}m</span>
                              </div>
                            )}
                            {cargo.requiresLowClearanceRoute && (
                              <div className="flex items-center space-x-1">
                                <FaMapMarkedAlt className="w-3 h-3 text-purple-500" />
                                <span className="text-gray-600">Low Clearance Route</span>
                              </div>
                            )}
                            {cargo.requiresEscortVehicle && (
                              <div className="flex items-center space-x-1">
                                <FaTruck className="w-3 h-3 text-purple-500" />
                                <span className="text-gray-600">Escort Vehicle</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quality & Inspection */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Quality & Inspection</h4>
                          <div className="space-y-2 text-sm">
                            {cargo.requiresPreShipmentInspection && (
                              <div className="flex items-center space-x-1">
                                <FaCameraRetro className="w-3 h-3 text-blue-500" />
                                <span className="text-gray-600">Pre-shipment Inspection</span>
                              </div>
                            )}
                            {cargo.requiresDeliveryInspection && (
                              <div className="flex items-center space-x-1">
                                <FaCameraRetro className="w-3 h-3 text-blue-500" />
                                <span className="text-gray-600">Delivery Inspection</span>
                              </div>
                            )}
                            {cargo.requiresPhotographicDocumentation && (
                              <div className="flex items-center space-x-1">
                                <FaCameraRetro className="w-3 h-3 text-blue-500" />
                                <span className="text-gray-600">Photo Documentation</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EnhancedCargoTable; 

