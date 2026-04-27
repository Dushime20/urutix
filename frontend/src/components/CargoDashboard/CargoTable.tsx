import React from 'react';
import { FaEye, FaEdit, FaTrash, FaMapMarkerAlt, FaCalendar, FaBox, FaUserTie, FaUser, FaDollarSign, FaMinusCircle, FaSnowflake, FaExclamationTriangle, FaWineGlass, FaClock, FaHistory, FaStar, FaMapMarkedAlt } from 'react-icons/fa';
import { TranslatedText } from '../translated-text';
// import type { Cargo } from '../../types/cargo';

// Temporary local interface to bypass module resolution issue
interface Cargo {
  id: string;
  title: string;
  description?: string;
  weight: number;
  volume?: number;
  cargoType: string;
  pickupLocationId: string;
  deliveryLocationId: string;
  pickupLocation?: {
    name: string;
    address: string;
    city?: string;
    state?: string;
    country?: string;
  };
  deliveryLocation?: {
    name: string;
    address: string;
    city?: string;
    state?: string;
    country?: string;
  };
  pickupDate: string;
  deliveryDate: string;
  loadValue: number;
  offeredPrice?: number;
  currencyCode: string;
  isFragile: boolean;
  isHazardous: boolean;
  requiresRefrigeration: boolean;
  specialRequirements?: string;
  autoMatchEnabled: boolean;
  loadingInstructions?: string;
  unloadingInstructions?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  broker?: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      companyName?: string;
    };
  };
  brokerId?: string;
  // Enhanced fields
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
  // Transporter/Carrier details (inferred from backend response)
  transporter?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    logo?: string;
  };
  truckOwner?: {
    id: string;
    name: string;
  };
  assignedTruck?: {
    id: string;
    plateNumber: string;
    driverName?: string;
  };
}

interface CargoTableProps {
  cargos: Cargo[];
  lastCargoRef: (node: HTMLElement | null) => void;
  view?: 'grid' | 'list';
  onRowClick: (cargo: Cargo) => void;
  onEditCargo?: (cargo: Cargo) => void;
  onDeleteCargo?: (cargoId: string) => void;
  onPublishCargo?: (cargoId: string) => void;
  onUnpublishCargo?: (cargoId: string) => void;
  onAssignBroker?: (cargo: Cargo) => void;
  onAssignReceiver?: (cargo: Cargo) => void;
  onRequestFinancing?: (cargo: Cargo) => void;
  onRateTransporter?: (cargo: Cargo) => void;
  onTrackCargo?: (cargo: Cargo) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onBulkAction?: (action: 'delete' | 'export' | 'update' | 'enrich' | 'publish' | 'unpublish', selectedIds: string[]) => void;
}

export const CargoTable: React.FC<CargoTableProps> = ({
  cargos,
  lastCargoRef,
  view,
  onRowClick,
  onEditCargo,
  onDeleteCargo,
  onPublishCargo,
  onUnpublishCargo,
  onAssignBroker,
  onAssignReceiver,
  onRequestFinancing,
  onRateTransporter,
  onTrackCargo,
  selectedIds = [],
  onSelectionChange,
  onBulkAction,
}) => {
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      onSelectionChange?.(cargos.map(c => c.id));
    } else {
      onSelectionChange?.([]);
    }
  };

  const handleSelectOne = (e: React.MouseEvent | React.ChangeEvent, id: string) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      onSelectionChange?.(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      onSelectionChange?.([...selectedIds, id]);
    }
  };

  // Helper function to check if a value is valid (not 0, not empty, not null, not undefined)
  const hasValue = (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'boolean') return value;
    return true;
  };

  // Helper function to get pickup location display (prefer city/country, fallback to address/name)
  const getPickupLocation = (cargo: Cargo): string => {
    const loc = cargo.pickupLocation;
    if (!loc) return 'Pickup';

    // Prefer City, Country
    if (loc.city && loc.country) {
      return `${loc.city}, ${loc.country} `;
    }

    // Fallback: Try to parse City from Address
    if (loc.address && loc.address.includes(',')) {
      const parts = loc.address.split(',').map(p => p.trim());
      // Simple heuristic: if >= 2 parts, take last two as City, Country
      if (parts.length >= 2) {
        const potentialCountry = parts[parts.length - 1];
        const potentialCity = parts[parts.length - 2];
        // Basic check to ensure they aren't numbers (like zip codes)
        if (isNaN(Number(potentialCity)) && isNaN(Number(potentialCountry))) {
          return `${potentialCity}, ${potentialCountry} `;
        }
      }
    }

    // Fallback to address
    if (loc.address && loc.address.trim() !== '') {
      return loc.address;
    }
    return loc.name || 'Pickup';
  };

  // Helper function to get delivery location display
  const getDeliveryLocation = (cargo: Cargo): string => {
    const loc = cargo.deliveryLocation;
    if (!loc) return 'Delivery';

    // Prefer City, Country
    if (loc.city && loc.country) {
      return `${loc.city}, ${loc.country} `;
    }

    // Fallback: Try to parse City from Address
    if (loc.address && loc.address.includes(',')) {
      const parts = loc.address.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        const potentialCountry = parts[parts.length - 1];
        const potentialCity = parts[parts.length - 2];
        if (isNaN(Number(potentialCity)) && isNaN(Number(potentialCountry))) {
          return `${potentialCity}, ${potentialCountry} `;
        }
      }
    }

    // Fallback to address
    if (loc.address && loc.address.trim() !== '') {
      return loc.address;
    }
    return loc.name || 'Delivery';
  };




  // Helper to get Operator (Transporter or Broker)
  const getOperatorDetails = (cargo: Cargo) => {
    if (cargo.transporter) {
      return { name: cargo.transporter.name, type: 'TRANSPORTER', icon: 'TRUCK' };
    }
    if (cargo.truckOwner) {
      return { name: cargo.truckOwner.name, type: 'TRANSPORTER', icon: 'TRUCK' };
    }
    // If truck is assigned but no transporter object, maybe show truck plate?
    if (cargo.assignedTruck) {
      return { name: `Truck ${cargo.assignedTruck.plateNumber} `, type: 'TRANSPORTER', icon: 'TRUCK' };
    }

    // Check Broker
    if (cargo.broker) {
      const profile = cargo.broker.profile;
      let name = 'Unverified Broker';
      if (profile?.companyName) name = profile.companyName;
      else if (profile?.firstName) name = `${profile.firstName} ${profile.lastName || ''} `;
      else if (cargo.broker.email) name = cargo.broker.email;

      return { name, type: 'BROKER', icon: 'USER' };
    }

    if (cargo.brokerId) {
      return { name: 'Broker Assigned', type: 'BROKER', icon: 'USER' };
    }

    return null;
  };

  const getStatusColor = (status: string) => {
    const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide border";
    switch (status?.toLowerCase()) {
      case 'available':
      case 'published':
        return `${base} bg-emerald-50 text-emerald-700 border-emerald-200/60 shadow-sm shadow-emerald-500/10`;
      case 'in_transit':
        return `${base} bg-primary-50 text-primary-700 border-primary-200/60 shadow-sm shadow-primary-500/10 animate-pulse`;
      case 'delivered':
      case 'completed':
        return `${base} bg-slate-100 text-slate-600 border-slate-200 shadow-sm`;
      case 'assigned':
        return `${base} bg-purple-50 text-purple-700 border-purple-200/60 shadow-sm shadow-purple-500/10`;
      case 'cancelled':
        return `${base} bg-red-50 text-red-700 border-red-200/60 shadow-sm shadow-red-500/10`;
      case 'draft':
        return `${base} bg-gray-50 text-gray-600 border-gray-200 border-dashed`;

      default:
        return `${base} bg-gray-50 text-gray-600 border-gray-200`;
    }
  };

  if (view === 'grid') {
    return (
      <div className="space-y-4">
        {selectedIds.length > 0 && onBulkAction && (
          <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-3 flex items-center justify-between mb-4 transition-colors duration-300">
            <span className="text-sm font-medium text-primary-900 dark:text-primary-100">
              {selectedIds.length} <TranslatedText text="items selected" />
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => onBulkAction('enrich', selectedIds)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-700 rounded text-sm font-medium hover:bg-primary-50 dark:hover:bg-primary-900/50 transition-colors"
              >
                <TranslatedText text="Batch Enrich" />
              </button>
              <button
                onClick={() => onBulkAction('export', selectedIds)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Export Selected
              </button>
              <button
                onClick={() => onBulkAction('publish', selectedIds)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 rounded text-sm font-medium hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
              >
                Publish Selected
              </button>
              <button
                onClick={() => onBulkAction('unpublish', selectedIds)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 rounded text-sm font-medium hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors"
              >
                Unpublish Selected
              </button>
              <button
                onClick={() => onBulkAction('delete', selectedIds)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {cargos.map((cargo, index) => (
            <div
              key={cargo.id}
              ref={index === cargos.length - 1 ? lastCargoRef : null}
              className={`bg-white dark:bg-slate-900 rounded-lg shadow-md dark:shadow-slate-950/50 p-3 sm:p-4 hover:shadow-lg dark:hover:shadow-slate-950/70 transition-all cursor-pointer flex flex-col h-full min-w-0 relative border border-transparent dark:border-slate-800 ${selectedIds.includes(cargo.id) ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''} `}
              onClick={(e) => {
                // If clicking checkbox, don't trigger row click
                if ((e.target as HTMLElement).tagName === 'INPUT') return;
                onRowClick(cargo);
              }}
            >
              {onSelectionChange && (
                <div className="absolute top-3 right-3 z-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(cargo.id)}
                    onChange={(e) => handleSelectOne(e, cargo.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>
              )}
              <div className="flex items-start justify-between mb-3 gap-2 pr-8">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <FaBox className="text-primary-600 dark:text-primary-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    {/* Cargo Title */}
                    {cargo.title && (
                      <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-sm sm:text-base truncate mb-0.5" title={cargo.title}>
                        {cargo.title}
                      </h3>
                    )}
                    {/* Cargo ID */}
                    <span className="text-xs text-gray-500 dark:text-slate-400 truncate block">#{cargo.id.slice(0, 8)}...</span>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${getStatusColor(cargo.status)} `}>
                  <TranslatedText text={cargo.status} />
                </span>
              </div>

              {/* Urgency & Special Requirements Indicators */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {/* Urgency Badge */}
                {cargo.urgencyLevel && cargo.urgencyLevel !== 'NORMAL' && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cargo.urgencyLevel === 'CRITICAL'
                      ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse'
                      : cargo.urgencyLevel === 'HIGH'
                        ? 'bg-orange-100 text-orange-800 border border-orange-300'
                        : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      } `}
                    title={`Urgency: ${cargo.urgencyLevel} `}
                  >
                    {cargo.urgencyLevel === 'CRITICAL' && '🔴'}
                    {cargo.urgencyLevel === 'HIGH' && '🟠'}
                    {cargo.urgencyLevel === 'LOW' && '🟡'}
                    <TranslatedText text={cargo.urgencyLevel} />
                  </span>
                )}

                {/* Time Critical */}
                {cargo.isTimeCritical && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200"
                    title="Time Critical Delivery"
                  >
                    <FaClock className="w-3 h-3" />
                    <TranslatedText text="Time Critical" />
                  </span>
                )}

                {/* Special Requirements Icons */}
                {cargo.isFragile && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200"
                    title="Fragile - Handle with Care"
                  >
                    <FaWineGlass className="w-3 h-3" />
                    <TranslatedText text="Fragile" />
                  </span>
                )}

                {cargo.isHazardous && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200"
                    title="Hazardous Materials"
                  >
                    <FaExclamationTriangle className="w-3 h-3" />
                    Hazardous
                  </span>
                )}

                  {cargo.requiresRefrigeration && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-50 text-cyan-700 border border-cyan-200"
                      title="Requires Refrigeration"
                    >
                      <FaSnowflake className="w-3 h-3" />
                      <TranslatedText text="Refrigerated" />
                    </span>
                  )}
              </div>

              <div className="flex-grow flex flex-col">
                <div className="space-y-2">
                  {(cargo.pickupLocation || cargo.deliveryLocation) && (
                    <div className="flex items-start space-x-2 text-sm text-gray-600 dark:text-slate-400">
                      <FaMapMarkerAlt className="text-gray-400 dark:text-slate-500 flex-shrink-0 mt-0.5" />
                      <span className="break-words line-clamp-2">
                        {getPickupLocation(cargo)} → {getDeliveryLocation(cargo)}
                      </span>
                    </div>
                  )}

                  {hasValue(cargo.pickupDate) && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-slate-400">
                      <FaCalendar className="text-gray-400 dark:text-slate-500" />
                      <span>{new Date(cargo.pickupDate).toLocaleDateString()}</span>
                    </div>
                  )}

                  {(hasValue(cargo.loadValue) || hasValue(cargo.weight)) && (
                    <div className="text-sm flex flex-wrap gap-2">
                      {hasValue(cargo.loadValue) && (
                        <span className="font-medium text-gray-900 dark:text-slate-100 whitespace-nowrap">${cargo.loadValue}</span>
                      )}
                      {hasValue(cargo.weight) && (
                        <span className="text-gray-500 dark:text-slate-400 whitespace-nowrap">
                          {hasValue(cargo.loadValue) ? '• ' : ''}{cargo.weight}kg
                        </span>
                      )}
                    </div>
                  )}

                  {/* Broker Card */}
                  {/* Operator Card (Transporter or Broker) */}
                  {(() => {
                    const op = getOperatorDetails(cargo);
                    if (op) {
                      const isTransporter = op.type === 'TRANSPORTER';
                      return (
                        <div className="mt-2">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border ${isTransporter ? 'bg-primary-50 border-primary-200' : 'bg-purple-50 border-purple-200'} `}>
                            <FaUserTie className={`w-3.5 h-3.5 ${isTransporter ? 'text-primary-600' : 'text-purple-600'} `} />
                            <span className={`text-xs font-medium ${isTransporter ? 'text-primary-700' : 'text-purple-700'} `}>
                              {op.name}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Recent Activity */}
                  {(() => {
                    const activities = [];

                    if (cargo.broker || cargo.brokerId) {
                      const brokerName = cargo.broker?.profile?.companyName || cargo.broker?.profile?.firstName || <TranslatedText text="Broker" />;
                      activities.push({ icon: <FaUserTie className="w-3 h-3 text-purple-600" />, text: <><TranslatedText text="Broker" />: {brokerName} </>, color: 'text-purple-600' });
                    }

                    if ((cargo as any).receiver || (cargo as any).receiverId) {
                      const receiverName = (cargo as any).receiver?.profile?.companyName || (cargo as any).receiver?.profile?.firstName || <TranslatedText text="Receiver" />;
                      activities.push({ icon: <FaUser className="w-3 h-3 text-green-600" />, text: <><TranslatedText text="Receiver" />: {receiverName} </>, color: 'text-green-600' });
                    }

                    if (cargo.status === 'IN_TRANSIT') {
                      activities.push({ icon: <FaBox className="w-3 h-3 text-primary-600" />, text: <TranslatedText text="In transit" />, color: 'text-primary-600' });
                    } else if (cargo.status === 'DELIVERED') {
                      activities.push({ icon: <FaBox className="w-3 h-3 text-green-600" />, text: <TranslatedText text="Delivered" />, color: 'text-green-600' });
                    }

                    if (activities.length === 0) return null;

                    return (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1.5 mb-2">
                          <FaHistory className="w-3 h-3 text-gray-400" />
                          <span className="text-xs font-medium text-gray-500"><TranslatedText text="Activity" /></span>
                        </div>
                        <div className="space-y-1.5">
                          {activities.slice(0, 2).map((activity, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <div className="mt-0.5">{activity.icon}</div>
                              <span className={`text-xs ${activity.color} line-clamp-1`}>{activity.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Spacer and separator for actions */}
                <div className="flex-grow flex items-center justify-end mt-3 pt-3 border-t border-gray-200">
                  {/* Action Buttons - Centered vertically in the middle */}
                  <div className="flex items-center justify-end gap-2 flex-wrap">
                    {onEditCargo && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditCargo(cargo);
                        }}
                        className="p-2 sm:p-1 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center text-primary-600 hover:text-primary-800 active:bg-primary-50 transition-colors touch-manipulation rounded"
                        title="Edit"
                        aria-label="Edit"
                      >
                        <FaEdit className="w-4 h-4 sm:w-4 sm:h-4" />
                      </button>
                    )}
                    {onDeleteCargo && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCargo(cargo.id);
                        }}
                        className="p-2 sm:p-1 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center text-red-600 hover:text-red-800 active:bg-red-50 transition-colors touch-manipulation rounded"
                        title="Delete"
                        aria-label="Delete"
                      >
                        <FaTrash className="w-4 h-4 sm:w-4 sm:h-4" />
                      </button>
                    )}
                    {onPublishCargo && cargo.status?.toUpperCase() === 'DRAFT' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPublishCargo(cargo.id);
                        }}
                        className="p-2 sm:p-1 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center text-green-600 hover:text-green-800 active:bg-green-50 transition-colors touch-manipulation rounded"
                        title="Publish"
                        aria-label="Publish"
                      >
                        <FaEye className="w-4 h-4 sm:w-4 sm:h-4" />
                      </button>
                    )}
                    {onUnpublishCargo && cargo.status?.toUpperCase() === 'PUBLISHED' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnpublishCargo(cargo.id);
                        }}
                        className="p-2 sm:p-1 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center text-orange-600 hover:text-orange-800 active:bg-orange-50 transition-colors touch-manipulation rounded"
                        title="Unpublish"
                        aria-label="Unpublish"
                      >
                        <FaMinusCircle className="w-4 h-4 sm:w-4 sm:h-4" />
                      </button>
                    )}
                    {onAssignBroker && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Assign Broker clicked for cargo:', cargo.id);
                          onAssignBroker(cargo);
                        }}
                        className="p-2 sm:p-1.5 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 text-purple-600 hover:text-purple-800 hover:bg-purple-50 active:bg-purple-100 rounded transition-colors border border-purple-200 flex items-center gap-1 touch-manipulation"
                        title="Assign Broker"
                        aria-label="Assign Broker"
                      >
                        <FaUserTie className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs font-medium hidden sm:inline"><TranslatedText text="Broker" /></span>
                      </button>
                    )}
                    {onAssignReceiver && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Assign Receiver clicked for cargo:', cargo.id);
                          onAssignReceiver(cargo);
                        }}
                        className="p-2 sm:p-1.5 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 text-green-600 hover:text-green-800 hover:bg-green-50 active:bg-green-100 rounded transition-colors border border-green-200 flex items-center gap-1 touch-manipulation"
                        title="Assign Receiver"
                        aria-label="Assign Receiver"
                      >
                        <FaUser className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs font-medium hidden sm:inline"><TranslatedText text="Receiver" /></span>
                      </button>
                    )}

                    {onTrackCargo && cargo.status === 'IN_TRANSIT' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTrackCargo(cargo);
                        }}
                        className="p-2 sm:p-1.5 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 text-primary-600 hover:text-primary-800 hover:bg-primary-50 active:bg-primary-100 rounded transition-colors border border-primary-200 flex items-center gap-1 touch-manipulation"
                        title="Track Shipment"
                        aria-label="Track Shipment"
                      >
                        <FaMapMarkedAlt className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs font-medium hidden sm:inline"><TranslatedText text="Track" /></span>
                      </button>
                    )}

                    {onRequestFinancing && (cargo.status === 'IN_TRANSIT' || cargo.status === 'DELIVERED') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Request Financing clicked for cargo:', cargo.id);
                          onRequestFinancing(cargo);
                        }}
                        className="p-2 sm:p-1.5 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 text-[#358c9c] hover:text-[#2c7380] hover:bg-cyan-50 active:bg-cyan-100 rounded transition-colors border border-cyan-200 flex items-center gap-1 touch-manipulation"
                        title="Request Financing"
                        aria-label="Request Financing"
                      >
                        <FaDollarSign className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs font-medium hidden sm:inline"><TranslatedText text="Finance" /></span>
                      </button>
                    )}
                    {onRateTransporter && cargo.status === 'DELIVERED' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRateTransporter(cargo);
                        }}
                        className="p-2 sm:p-1.5 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 active:bg-yellow-100 rounded transition-colors border border-yellow-200 flex items-center gap-1 touch-manipulation"
                        title="Rate Transporter"
                        aria-label="Rate Transporter"
                      >
                        <FaStar className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs font-medium hidden sm:inline"><TranslatedText text="Rate" /></span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedIds.length > 0 && onBulkAction && (
        <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm font-medium text-primary-900 dark:text-primary-100">
            {selectedIds.length} <TranslatedText text="items selected" />
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onBulkAction('enrich', selectedIds)}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-700 rounded text-sm font-medium hover:bg-primary-50 dark:hover:bg-primary-900/50 transition-colors"
            >
              <TranslatedText text="Batch Enrich" />
            </button>
            <button
              onClick={() => onBulkAction('export', selectedIds)}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              <TranslatedText text="Export Selected" />
            </button>
            <button
              onClick={() => onBulkAction('delete', selectedIds)}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            >
              <TranslatedText text="Delete Selected" />
            </button>
          </div>
        </div>
      )}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow dark:shadow-slate-950/50 overflow-hidden overflow-x-auto transition-colors duration-300">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
          <thead className="bg-gray-50 dark:bg-slate-800/50">
            <tr>
              {onSelectionChange && (
                <th className="px-3 sm:px-6 py-3 w-4">
                  <input
                    type="checkbox"
                    checked={cargos.length > 0 && selectedIds.length === cargos.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 dark:bg-slate-700"
                  />
                </th>
              )}
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                <TranslatedText text="Cargo" />
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                <TranslatedText text="Route" />
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                <TranslatedText text="Status" />
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                <TranslatedText text="Price" />
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">
                <TranslatedText text="Created" />
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">
                <TranslatedText text="Operator" />
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                <TranslatedText text="Actions" />
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
            {cargos.map((cargo, index) => (
              <tr
                key={cargo.id}
                ref={index === cargos.length - 1 ? lastCargoRef : null}
                className={`hover: bg - gray - 50 cursor - pointer ${selectedIds.includes(cargo.id) ? 'bg-primary-50' : ''} `}
                onClick={() => onRowClick(cargo)}
              >
                {onSelectionChange && (
                  <td className="px-3 sm:px-6 py-4 w-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(cargo.id)}
                      onChange={(e) => handleSelectOne(e, cargo.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                )}
                <td className="px-3 sm:px-6 py-4 text-sm font-medium text-gray-900 min-w-0">
                  <div className="min-w-0">
                    {/* Cargo Title */}
                    {cargo.title && (
                      <div className="font-semibold text-gray-900 truncate mb-0.5" title={cargo.title}>
                        {cargo.title}
                      </div>
                    )}
                    {/* Cargo ID */}
                    <div className="text-xs text-gray-500 truncate">#{cargo.id.slice(0, 8)}...</div>

                    {/* Urgency & Special Requirements - Compact Icons */}
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {cargo.urgencyLevel && cargo.urgencyLevel !== 'NORMAL' && (
                        <span
                          className={`inline - flex items - center px - 1.5 py - 0.5 rounded text - xs font - medium ${cargo.urgencyLevel === 'CRITICAL'
                            ? 'bg-red-100 text-red-800 animate-pulse'
                            : cargo.urgencyLevel === 'HIGH'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-yellow-100 text-yellow-800'
                            } `}
                          title={`Urgency: ${cargo.urgencyLevel} `}
                        >
                          {cargo.urgencyLevel === 'CRITICAL' ? '🔴' : cargo.urgencyLevel === 'HIGH' ? '🟠' : '🟡'}
                        </span>
                      )}
                      {cargo.isTimeCritical && (
                        <FaClock className="w-3 h-3 text-red-600" title="Time Critical" />
                      )}
                      {cargo.isFragile && (
                        <FaWineGlass className="w-3 h-3 text-yellow-600" title="Fragile" />
                      )}
                      {cargo.isHazardous && (
                        <FaExclamationTriangle className="w-3 h-3 text-red-600" title="Hazardous" />
                      )}
                      {cargo.requiresRefrigeration && (
                        <FaSnowflake className="w-3 h-3 text-cyan-600" title="Refrigerated" />
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-4 text-sm text-gray-900 min-w-0">
                  {(cargo.pickupLocation || cargo.deliveryLocation) ? (
                    <div className="flex items-start space-x-2 min-w-0">
                      <FaMapMarkerAlt className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="break-words line-clamp-2 min-w-0">
                        {getPickupLocation(cargo)} → {getDeliveryLocation(cargo)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400">
                      <TranslatedText text="No location specified" />
                    </span>
                  )}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <span className={`px - 2 py - 1 rounded - full text - xs font - medium ${getStatusColor(cargo.status)} `}>
                    <TranslatedText text={cargo.status} />
                  </span>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {hasValue(cargo.loadValue) ? `$${cargo.loadValue} ` : '-'}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                  {hasValue(cargo.pickupDate) ? new Date(cargo.pickupDate).toLocaleDateString() : '-'}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                  {(() => {
                    const op = getOperatorDetails(cargo);
                    if (op) {
                      const isTransporter = op.type === 'TRANSPORTER';
                      return (
                        <div className={`inline - flex items - center gap - 1.5 px - 2.5 py - 1 rounded - md border ${isTransporter ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-purple-50 border-purple-200 text-purple-700'} `}>
                          <FaUserTie className={`w - 3.5 h - 3.5 ${isTransporter ? 'text-blue-600' : 'text-purple-600'} `} />
                          <span className="text-xs font-medium">
                            {op.name}
                          </span>
                        </div>
                      );
                    }
                    return <span className="text-gray-400 text-xs">-</span>;
                  })()}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRowClick(cargo);
                      }}
                      className="p-2 sm:p-1 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center text-blue-600 hover:text-blue-900 active:bg-blue-50 transition-colors touch-manipulation rounded"
                      title="View"
                      aria-label="View"
                    >
                      <FaEye className="w-4 h-4" />
                    </button>
                    {onEditCargo && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditCargo(cargo);
                        }}
                        className="p-2 sm:p-1 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center text-green-600 hover:text-green-900 active:bg-green-50 transition-colors touch-manipulation rounded"
                        title="Edit"
                        aria-label="Edit"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                    )}
                    {onDeleteCargo && cargo.status === 'DRAFT' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCargo(cargo.id);
                        }}
                        className="p-2 sm:p-1 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center text-red-600 hover:text-red-900 active:bg-red-50 transition-colors touch-manipulation rounded"
                        title="Delete"
                        aria-label="Delete"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    )}
                    {onPublishCargo && cargo.status?.toUpperCase() === 'DRAFT' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPublishCargo(cargo.id);
                        }}
                        className="p-2 sm:p-1 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center text-purple-600 hover:text-purple-900 active:bg-purple-50 transition-colors touch-manipulation rounded"
                        title="Publish"
                        aria-label="Publish"
                      >
                        <FaEye className="w-4 h-4" />
                      </button>
                    )}
                    {onUnpublishCargo && cargo.status?.toUpperCase() === 'PUBLISHED' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnpublishCargo(cargo.id);
                        }}
                        className="p-2 sm:p-1 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center text-orange-600 hover:text-orange-900 active:bg-orange-50 transition-colors touch-manipulation rounded"
                        title="Unpublish"
                        aria-label="Unpublish"
                      >
                        <FaMinusCircle className="w-4 h-4" />
                      </button>
                    )}
                    {onAssignBroker && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Assign Broker clicked for cargo:', cargo.id);
                          onAssignBroker(cargo);
                        }}
                        className="p-2 sm:p-1 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 active:bg-indigo-100 px-2 py-1 rounded border border-indigo-200 transition-colors touch-manipulation"
                        title="Assign Broker"
                        aria-label="Assign Broker"
                      >
                        <FaUserTie className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
