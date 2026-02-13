import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FaTimes, FaTruck, FaUser, FaBuilding, FaMapMarkerAlt,
  FaCheckCircle, FaExclamationTriangle, FaClock, FaRoute,
  FaDollarSign, FaStar, FaCalendar, FaWrench, FaGasPump,
  FaWeight, FaRuler, FaIdCard
} from 'react-icons/fa';
import { fleetApi } from '../../services/fleetApi';

interface TruckDetailsDrawerProps {
  truckId: string;
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
}

const TruckDetailsDrawer: React.FC<TruckDetailsDrawerProps> = ({
  truckId,
  tenantId,
  isOpen,
  onClose
}) => {
  // Fetch truck details
  const { data: truck, isLoading } = useQuery({
    queryKey: ['truck-details', truckId],
    queryFn: () => fleetApi.getTruckById(tenantId, truckId),
    enabled: isOpen && !!truckId,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
      case 'AVAILABLE':
        return 'text-green-600 bg-green-100';
      case 'IN_TRANSIT':
        return 'text-blue-600 bg-blue-100';
      case 'MAINTENANCE':
        return 'text-yellow-600 bg-yellow-100';
      case 'INACTIVE':
      case 'OUT_OF_SERVICE':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
      case 'AVAILABLE':
        return <FaCheckCircle className="w-4 h-4" />;
      case 'MAINTENANCE':
        return <FaClock className="w-4 h-4" />;
      case 'INACTIVE':
      case 'OUT_OF_SERVICE':
        return <FaExclamationTriangle className="w-4 h-4" />;
      default:
        return <FaClock className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full md:w-2/3 lg:w-1/2 bg-white shadow-xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-gray-900">Truck Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : truck ? (
            <>
              {/* Truck Header */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{truck.plateNumber}</h3>
                    <p className="text-lg text-gray-600 mt-1">
                      {truck.make} {truck.model} ({truck.year})
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(truck.status)}`}>
                    {getStatusIcon(truck.status)}
                    <span className="ml-2 capitalize">{truck.status.toLowerCase().replace('_', ' ')}</span>
                  </span>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <FaMapMarkerAlt className="w-4 h-4 mr-2" />
                  <span>{truck.location}</span>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <FaRoute className="w-6 h-6 text-blue-600 mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{truck.totalTrips}</p>
                  <p className="text-sm text-gray-600">Total Trips</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <FaDollarSign className="w-6 h-6 text-green-600 mb-2" />
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(truck.totalRevenue)}</p>
                  <p className="text-sm text-gray-600">Revenue</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <FaStar className="w-6 h-6 text-purple-600 mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{truck.averageRating?.toFixed(1) || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Rating</p>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <FaGasPump className="w-6 h-6 text-yellow-600 mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{truck.fuelEfficiency || 'N/A'}</p>
                  <p className="text-sm text-gray-600">km/L</p>
                </div>
              </div>

              {/* Owner Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <FaBuilding className="w-4 h-4 mr-2" />
                  Owner Information
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium text-gray-900">{truck.owner.name}</span>
                  </div>
                  {truck.owner.companyName && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Company:</span>
                      <span className="font-medium text-gray-900">{truck.owner.companyName}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium text-gray-900">{truck.owner.email}</span>
                  </div>
                  {truck.owner.phone && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium text-gray-900">{truck.owner.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Driver Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <FaUser className="w-4 h-4 mr-2" />
                  Current Driver
                </h4>
                {truck.driver ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium text-gray-900">{truck.driver.name}</span>
                    </div>
                    {truck.driver.email && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium text-gray-900">{truck.driver.email}</span>
                      </div>
                    )}
                    {truck.driver.phone && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium text-gray-900">{truck.driver.phone}</span>
                      </div>
                    )}
                    {truck.driver.licenseNumber && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">License:</span>
                        <span className="font-medium text-gray-900">{truck.driver.licenseNumber}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No driver assigned</p>
                )}
              </div>

              {/* Truck Specifications */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <FaTruck className="w-4 h-4 mr-2" />
                  Specifications
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-start">
                    <FaIdCard className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-600">Type</p>
                      <p className="text-sm font-medium text-gray-900">{truck.truckType || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <FaWeight className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-600">Capacity</p>
                      <p className="text-sm font-medium text-gray-900">{truck.capacity || 'N/A'} tons</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <FaRuler className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-600">Dimensions</p>
                      <p className="text-sm font-medium text-gray-900">{truck.dimensions || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <FaCalendar className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-600">Year</p>
                      <p className="text-sm font-medium text-gray-900">{truck.year}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Maintenance Information */}
              {truck.lastMaintenanceDate && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <FaWrench className="w-4 h-4 mr-2" />
                    Maintenance
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Last Maintenance:</span>
                      <span className="font-medium text-gray-900">{formatDate(truck.lastMaintenanceDate)}</span>
                    </div>
                    {truck.nextMaintenanceDate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Next Maintenance:</span>
                        <span className="font-medium text-gray-900">{formatDate(truck.nextMaintenanceDate)}</span>
                      </div>
                    )}
                    {truck.maintenanceNotes && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 mb-1">Notes:</p>
                        <p className="text-sm text-gray-700">{truck.maintenanceNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Additional Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Registration:</span>
                    <span className="font-medium text-gray-900">{truck.registrationNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Insurance:</span>
                    <span className="font-medium text-gray-900">{truck.insuranceStatus || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium text-gray-900">{formatDate(truck.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-medium text-gray-900">{formatDate(truck.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Truck not found</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TruckDetailsDrawer;
