import React from 'react';
import { FaEye, FaEdit, FaTrash, FaMapMarkerAlt, FaCalendar, FaBox } from 'react-icons/fa';
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
}

export const CargoTable: React.FC<CargoTableProps> = ({
  cargos,
  lastCargoRef,
  view,
  onRowClick,
  onEditCargo,
  onDeleteCargo,
  onPublishCargo,
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
    return cargo.pickupLocation?.name || 'Pickup';
  };

  // Helper function to get delivery location display
  const getDeliveryLocation = (cargo: Cargo): string => {
    if (cargo.deliveryLocation?.address && cargo.deliveryLocation.address.trim() !== '') {
      return cargo.deliveryLocation.address;
    }
    return cargo.deliveryLocation?.name || 'Delivery';
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cargos.map((cargo, index) => (
          <div
            key={cargo.id}
            ref={index === cargos.length - 1 ? lastCargoRef : null}
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full"
            onClick={() => onRowClick(cargo)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <FaBox className="text-primary-600" />
                <span className="font-semibold text-gray-900">#{cargo.id}</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cargo.status)}`}>
                {cargo.status}
              </span>
            </div>
            
            <div className="flex-grow flex flex-col">
              <div className="space-y-2">
                {(cargo.pickupLocation || cargo.deliveryLocation) && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <FaMapMarkerAlt className="text-gray-400" />
                    <span>
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
                  <div className="text-sm">
                    {hasValue(cargo.loadValue) && (
                      <span className="font-medium text-gray-900">${cargo.loadValue}</span>
                    )}
                    {hasValue(cargo.weight) && (
                      <span className={`text-gray-500 ${hasValue(cargo.loadValue) ? 'ml-2' : ''}`}>
                        {hasValue(cargo.loadValue) ? '• ' : ''}{cargo.weight}kg
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Spacer to push buttons to middle */}
              <div className="flex-grow flex items-center justify-end">
                {/* Action Buttons - Centered vertically in the middle */}
                <div className="flex items-center justify-end space-x-2">
              {onEditCargo && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditCargo(cargo);
                  }}
                  className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                  title="Edit"
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
                  className="p-1 text-red-600 hover:text-red-800 transition-colors"
                  title="Delete"
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
                  className="p-1 text-green-600 hover:text-green-800 transition-colors"
                  title="Publish"
                >
                  <FaEye className="w-4 h-4" />
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
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cargo ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Route
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Price
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
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
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                #{cargo.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {(cargo.pickupLocation || cargo.deliveryLocation) ? (
                  <div className="flex items-center space-x-2">
                    <FaMapMarkerAlt className="text-gray-400" />
                    <span>
                      {getPickupLocation(cargo)} → {getDeliveryLocation(cargo)}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400">No location specified</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cargo.status)}`}>
                  {cargo.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {hasValue(cargo.loadValue) ? `$${cargo.loadValue}` : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {hasValue(cargo.pickupDate) ? new Date(cargo.pickupDate).toLocaleDateString() : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRowClick(cargo);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                    title="View"
                  >
                    <FaEye />
                  </button>
                  {onEditCargo && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditCargo(cargo);
                      }}
                      className="text-green-600 hover:text-green-900"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                  )}
                  {onDeleteCargo && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCargo(cargo.id);
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  )}
                  {onPublishCargo && cargo.status === 'DRAFT' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPublishCargo(cargo.id);
                      }}
                      className="text-purple-600 hover:text-purple-900"
                      title="Publish"
                    >
                      <FaEye />
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
