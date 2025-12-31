import React from 'react';
import { FaEye, FaEdit, FaTrash, FaMapMarkerAlt, FaCalendar, FaBox, FaUserTie } from 'react-icons/fa';
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
  pickupLocation?: { name: string; address: string };
  deliveryLocation?: { name: string; address: string };
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
}

interface CargoTableProps {
  cargos: Cargo[];
  lastCargoRef: (node: HTMLElement | null) => void;
  view: 'grid' | 'list';
  onRowClick: (cargo: Cargo) => void;
  onBulkAction: (action: 'delete' | 'export' | 'update', selectedIds: string[]) => void;
  onEditCargo?: (cargo: Cargo) => void;
  onDeleteCargo?: (cargoId: string) => void;
  onPublishCargo?: (cargoId: string) => void;
  onAssignBroker?: (cargo: Cargo) => void;
}

export const CargoTable: React.FC<CargoTableProps> = ({
  cargos,
  lastCargoRef,
  view,
  onRowClick,
  onEditCargo,
  onDeleteCargo,
  onPublishCargo,
  onAssignBroker,
  // onBulkAction, // TODO: Implement bulk actions
}) => {
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
    return cargo.pickupLocation?.name || 'Pickup'; // Will be translated in display
  };

  // Helper function to get delivery location display
  const getDeliveryLocation = (cargo: Cargo): string => {
    if (cargo.deliveryLocation?.address && cargo.deliveryLocation.address.trim() !== '') {
      return cargo.deliveryLocation.address;
    }
    return cargo.deliveryLocation?.name || 'Delivery'; // Will be translated in display
  };

  // Helper function to get broker display name
  const getBrokerName = (cargo: Cargo): string | null => {
    // Debug: Log broker data for troubleshooting
    if (cargo.brokerId || cargo.broker) {
      console.log('Broker data for cargo:', cargo.id, {
        brokerId: cargo.brokerId,
        broker: cargo.broker,
        hasBroker: !!cargo.broker,
        hasProfile: !!cargo.broker?.profile,
      });
    }
    
    // First check if we have a full broker object
    if (cargo.broker) {
      const profile = cargo.broker.profile;
      if (profile?.companyName) {
        return profile.companyName;
      }
      if (profile?.firstName || profile?.lastName) {
        return `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
      }
      if (cargo.broker.email && cargo.broker.email !== 'Broker Assigned') {
        return cargo.broker.email;
      }
    }
    
    // Fallback: if we only have brokerId, show a generic message
    if (cargo.brokerId) {
      return 'Broker Assigned';
    }
    
    return null;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800';
              case 'IN_TRANSIT':
        return 'bg-primary-100 text-primary-800';
      case 'delivered':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (view === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {cargos.map((cargo, index) => (
          <div
            key={cargo.id}
            ref={index === cargos.length - 1 ? lastCargoRef : null}
            className="bg-white rounded-lg shadow-md p-3 sm:p-4 hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full min-w-0"
            onClick={() => onRowClick(cargo)}
          >
            <div className="flex items-start justify-between mb-3 gap-2">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <FaBox className="text-primary-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  {/* Cargo Title */}
                  {cargo.title && (
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate mb-0.5" title={cargo.title}>
                      {cargo.title}
                    </h3>
                  )}
                  {/* Cargo ID */}
                  <span className="text-xs text-gray-500 truncate block">#{cargo.id.slice(0, 8)}...</span>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${getStatusColor(cargo.status)}`}>
                {cargo.status}
              </span>
            </div>
            
            <div className="flex-grow flex flex-col">
              <div className="space-y-2">
                {(cargo.pickupLocation || cargo.deliveryLocation) && (
                  <div className="flex items-start space-x-2 text-sm text-gray-600">
                    <FaMapMarkerAlt className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="break-words line-clamp-2">
                      {getPickupLocation(cargo)} → {getDeliveryLocation(cargo)}
                    </span>
                  </div>
                )}
                
                {hasValue(cargo.pickupDate) && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <FaCalendar className="text-gray-400" />
                    <span>{new Date(cargo.pickupDate).toLocaleDateString()}</span>
                  </div>
                )}
                
                {(hasValue(cargo.loadValue) || hasValue(cargo.weight)) && (
                  <div className="text-sm flex flex-wrap gap-2">
                    {hasValue(cargo.loadValue) && (
                      <span className="font-medium text-gray-900 whitespace-nowrap">${cargo.loadValue}</span>
                    )}
                    {hasValue(cargo.weight) && (
                      <span className="text-gray-500 whitespace-nowrap">
                        {hasValue(cargo.loadValue) ? '• ' : ''}{cargo.weight}kg
                      </span>
                    )}
                  </div>
                )}

                {/* Broker Card */}
                {(cargo.brokerId || cargo.broker) && (
                  <div className="mt-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-50 border border-purple-200 rounded-md">
                      <FaUserTie className="w-3.5 h-3.5 text-purple-600" />
                      <span className="text-xs font-medium text-purple-700">
                        {getBrokerName(cargo) || 'Broker Assigned'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Spacer to push buttons to middle */}
              <div className="flex-grow flex items-center justify-end mt-3">
                {/* Action Buttons - Centered vertically in the middle */}
                <div className="flex items-center justify-end gap-2 flex-wrap">
              {onEditCargo && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditCargo(cargo);
                  }}
                  className="p-2 sm:p-1 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center text-blue-600 hover:text-blue-800 active:bg-blue-50 transition-colors touch-manipulation rounded"
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
              {onPublishCargo && cargo.status === 'DRAFT' && (
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
                  <span className="text-xs font-medium hidden sm:inline">Broker</span>
                </button>
              )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <TranslatedText text="Cargo" />
            </th>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <TranslatedText text="Route" />
            </th>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <TranslatedText text="Status" />
            </th>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <TranslatedText text="Price" />
            </th>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
              <TranslatedText text="Created" />
            </th>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
              <TranslatedText text="Broker" />
            </th>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <TranslatedText text="Actions" />
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {cargos.map((cargo, index) => (
            <tr
              key={cargo.id}
              ref={index === cargos.length - 1 ? lastCargoRef : null}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => onRowClick(cargo)}
            >
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
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cargo.status)}`}>
                  {cargo.status}
                </span>
              </td>
              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {hasValue(cargo.loadValue) ? `$${cargo.loadValue}` : '-'}
              </td>
              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                {hasValue(cargo.pickupDate) ? new Date(cargo.pickupDate).toLocaleDateString() : '-'}
              </td>
              <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                {(cargo.brokerId || cargo.broker) ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 border border-purple-200 rounded-md">
                    <FaUserTie className="w-3.5 h-3.5 text-purple-600" />
                    <span className="text-xs font-medium text-purple-700">
                      {getBrokerName(cargo) || 'Broker Assigned'}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
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
                  {onDeleteCargo && (
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
                  {onPublishCargo && cargo.status === 'DRAFT' && (
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
  );
};
