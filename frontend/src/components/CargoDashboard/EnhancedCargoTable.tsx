import React, { useMemo, useState } from 'react';
import {
  FaEye, FaEdit, FaTrash, FaBox, FaThermometerHalf,
  FaTruck, FaMapMarkedAlt, FaClock, FaExclamationTriangle, FaRulerCombined,
  FaBoxes, FaLocationArrow, FaThermometerQuarter, FaMapPin,
  FaCogs, FaCameraRetro, FaChartLine
} from 'react-icons/fa';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import {
  StandardDataTable,
  StatusBadge,
  type Column,
  type TableAction,
} from '../EnliteUI/Tables';

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
  const safeCargos = Array.isArray(cargos) ? cargos : [];
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const hasValue = (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'boolean') return value;
    return true;
  };

  const getPickupLocation = (cargo: Cargo): string => {
    if (cargo.pickupLocation?.address && cargo.pickupLocation.address.trim() !== '') {
      return cargo.pickupLocation.address;
    }
    return cargo.pickupLocation?.name || 'Pickup';
  };

  const getDeliveryLocation = (cargo: Cargo): string => {
    if (cargo.deliveryLocation?.address && cargo.deliveryLocation.address.trim() !== '') {
      return cargo.deliveryLocation.address;
    }
    return cargo.deliveryLocation?.name || 'Delivery';
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

  const urgencyVariant = (urgency?: string) => {
    switch (urgency) {
      case 'CRITICAL': return 'error' as const;
      case 'HIGH': return 'orange' as const;
      case 'NORMAL': return 'info' as const;
      case 'LOW': return 'neutral' as const;
      default: return 'neutral' as const;
    }
  };

  const columns: Column<Cargo>[] = useMemo(() => [
    {
      key: 'title',
      label: 'Cargo Details',
      sortable: true,
      alwaysVisible: true,
      render: (_: any, cargo: Cargo) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="flex space-x-1">{getCargoIcons(cargo)}</div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">{cargo.title}</p>
            <p className="text-sm text-gray-500 dark:text-slate-400 truncate">
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
      ),
    },
    {
      key: 'weight',
      label: 'Dimensions & Weight',
      sortable: true,
      render: (_: any, cargo: Cargo) => (
        <div className="text-sm text-gray-900 dark:text-slate-100">
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
      ),
    },
    {
      key: 'requiresRefrigeration',
      label: 'Requirements',
      render: (_: any, cargo: Cargo) => (
        <div className="text-sm text-gray-900 dark:text-slate-100">
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
      ),
    },
    {
      key: 'status',
      label: 'Status & Urgency',
      sortable: true,
      render: (_: any, cargo: Cargo) => (
        <div className="space-y-2">
          <StatusBadge status={cargo.status} label={cargo.status} />
          {cargo.urgencyLevel && (
            <StatusBadge variant={urgencyVariant(cargo.urgencyLevel)} label={cargo.urgencyLevel} />
          )}
          {cargo.isTimeCritical && (
            <div className="flex items-center space-x-1">
              <FaClock className="w-3 h-3 text-red-500" />
              <span className="text-xs text-red-600">Time Critical</span>
            </div>
          )}
        </div>
      ),
    },
  ], []);

  const rowActions: TableAction<Cargo>[] = useMemo(() => [
    {
      key: 'toggle',
      label: 'Toggle details',
      icon: <FaEye className="w-3.5 h-3.5" />,
      onClick: (row) => setExpandedId((prev) => (prev === row.id ? null : row.id)),
    },
    {
      key: 'enhanced',
      label: 'Enhanced view',
      icon: <FaChartLine className="w-3.5 h-3.5" />,
      onClick: (row) => onEnhancedView(row),
    },
    {
      key: 'view',
      label: 'View',
      icon: <FaEye className="w-3.5 h-3.5" />,
      onClick: (row) => onView(row),
    },
    {
      key: 'edit',
      label: 'Edit cargo',
      icon: <FaEdit className="w-3.5 h-3.5" />,
      onClick: (row) => onEdit(row),
    },
    {
      key: 'publish',
      label: 'Publish cargo',
      icon: <FaCogs className="w-3.5 h-3.5" />,
      variant: 'success',
      hidden: (row) => row.status?.toLowerCase() !== 'draft',
      onClick: (row) => onPublish(row.id),
    },
    {
      key: 'delete',
      label: 'Delete cargo',
      icon: <FaTrash className="w-3.5 h-3.5" />,
      variant: 'danger',
      divider: true,
      onClick: (row) => onDelete(row.id),
    },
  ], [onView, onEdit, onDelete, onPublish, onEnhancedView]);

  const expandedCargo = expandedId ? safeCargos.find((c) => c.id === expandedId) : null;

  return (
    <div className="space-y-4">
      <StandardDataTable<Cargo>
        embedded
        columns={columns}
        data={safeCargos}
        loading={loading}
        getRowId={(row) => row.id}
        searchable
        searchPlaceholder="Search cargos…"
        searchKeys={['title', 'cargoType', 'status', 'urgencyLevel']}
        pagination
        pageSize={10}
        columnVisibility
        stickyHeader
        striped
        hoverable
        emptyMessage="No cargo loads match your current filters"
        rowActions={rowActions}
        ariaLabel="Enhanced cargo table"
      />

      {expandedCargo && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">Basic Information</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Description:</span>
                  <p className="text-gray-600 dark:text-slate-400">{expandedCargo.description || 'No description'}</p>
                </div>
                {hasValue(expandedCargo.loadValue) && (
                  <div>
                    <span className="font-medium">Load Value:</span>
                    <span className="text-gray-600 dark:text-slate-400"> {formatCurrency(expandedCargo.loadValue)}</span>
                  </div>
                )}
                {hasValue(expandedCargo.offeredPrice) && (
                  <div>
                    <span className="font-medium">Offered Price:</span>
                    <span className="text-gray-600 dark:text-slate-400"> {formatCurrency(expandedCargo.offeredPrice)}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">Environmental Requirements</h4>
              <div className="space-y-2 text-sm">
                {formatTemperature(expandedCargo) && (
                  <div>
                    <span className="font-medium">Temperature Range:</span>
                    <span className="text-gray-600 dark:text-slate-400"> {formatTemperature(expandedCargo)}</span>
                  </div>
                )}
                {expandedCargo.hazmatClass && (
                  <div>
                    <span className="font-medium">Hazmat Class:</span>
                    <span className="text-gray-600 dark:text-slate-400"> {expandedCargo.hazmatClass}</span>
                  </div>
                )}
                {expandedCargo.hazmatNumber && (
                  <div>
                    <span className="font-medium">Hazmat Number:</span>
                    <span className="text-gray-600 dark:text-slate-400"> {expandedCargo.hazmatNumber}</span>
                  </div>
                )}
                {expandedCargo.requiresHumidityControl && (
                  <div className="flex items-center space-x-1">
                    <FaThermometerQuarter className="w-3 h-3 text-blue-500" />
                    <span className="text-gray-600 dark:text-slate-400">Humidity Control Required</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">Loading & Unloading</h4>
              <div className="space-y-2 text-sm">
                {expandedCargo.loadingTimeEstimate && (
                  <div>
                    <span className="font-medium">Loading Time:</span>
                    <span className="text-gray-600 dark:text-slate-400"> {expandedCargo.loadingTimeEstimate}h</span>
                  </div>
                )}
                {expandedCargo.unloadingTimeEstimate && (
                  <div>
                    <span className="font-medium">Unloading Time:</span>
                    <span className="text-gray-600 dark:text-slate-400"> {expandedCargo.unloadingTimeEstimate}h</span>
                  </div>
                )}
                {expandedCargo.requiresForklift && (
                  <div className="flex items-center space-x-1">
                    <FaTruck className="w-3 h-3 text-orange-500" />
                    <span className="text-gray-600 dark:text-slate-400">Forklift Required</span>
                  </div>
                )}
                {expandedCargo.requiresCrane && (
                  <div className="flex items-center space-x-1">
                    <FaTruck className="w-3 h-3 text-orange-500" />
                    <span className="text-gray-600 dark:text-slate-400">Crane Required</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">Security & Insurance</h4>
              <div className="space-y-2 text-sm">
                {expandedCargo.insuranceValue && (
                  <div>
                    <span className="font-medium">Insurance Value:</span>
                    <span className="text-gray-600 dark:text-slate-400"> {formatCurrency(expandedCargo.insuranceValue)}</span>
                  </div>
                )}
                {expandedCargo.requiresGpsMonitoring && (
                  <div className="flex items-center space-x-1">
                    <FaLocationArrow className="w-3 h-3 text-green-500" />
                    <span className="text-gray-600 dark:text-slate-400">GPS Monitoring</span>
                  </div>
                )}
                {expandedCargo.requiresTemperatureMonitoring && (
                  <div className="flex items-center space-x-1">
                    <FaThermometerHalf className="w-3 h-3 text-blue-500" />
                    <span className="text-gray-600 dark:text-slate-400">Temperature Monitoring</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">Route & Access</h4>
              <div className="space-y-2 text-sm">
                {expandedCargo.maxClearanceHeight && (
                  <div>
                    <span className="font-medium">Max Clearance:</span>
                    <span className="text-gray-600 dark:text-slate-400"> {expandedCargo.maxClearanceHeight}m</span>
                  </div>
                )}
                {expandedCargo.requiresLowClearanceRoute && (
                  <div className="flex items-center space-x-1">
                    <FaMapMarkedAlt className="w-3 h-3 text-purple-500" />
                    <span className="text-gray-600 dark:text-slate-400">Low Clearance Route</span>
                  </div>
                )}
                {expandedCargo.requiresEscortVehicle && (
                  <div className="flex items-center space-x-1">
                    <FaTruck className="w-3 h-3 text-purple-500" />
                    <span className="text-gray-600 dark:text-slate-400">Escort Vehicle</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">Quality & Inspection</h4>
              <div className="space-y-2 text-sm">
                {expandedCargo.requiresPreShipmentInspection && (
                  <div className="flex items-center space-x-1">
                    <FaCameraRetro className="w-3 h-3 text-blue-500" />
                    <span className="text-gray-600 dark:text-slate-400">Pre-shipment Inspection</span>
                  </div>
                )}
                {expandedCargo.requiresDeliveryInspection && (
                  <div className="flex items-center space-x-1">
                    <FaCameraRetro className="w-3 h-3 text-blue-500" />
                    <span className="text-gray-600 dark:text-slate-400">Delivery Inspection</span>
                  </div>
                )}
                {expandedCargo.requiresPhotographicDocumentation && (
                  <div className="flex items-center space-x-1">
                    <FaCameraRetro className="w-3 h-3 text-blue-500" />
                    <span className="text-gray-600 dark:text-slate-400">Photo Documentation</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedCargoTable;
