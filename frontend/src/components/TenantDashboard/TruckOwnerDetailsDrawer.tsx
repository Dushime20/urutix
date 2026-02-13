import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FaTimes, FaBuilding, FaEnvelope, FaPhone, FaTruck,
  FaStar, FaDollarSign, FaRoute, FaCheckCircle,
  FaExclamationTriangle, FaClock, FaMapMarkerAlt, FaUser
} from 'react-icons/fa';
import { fleetApi } from '../../services/fleetApi';
import type { TruckOwner, Truck } from '../../services/fleetApi';

interface TruckOwnerDetailsDrawerProps {
  ownerId: string;
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
  onViewTruck?: (truckId: string) => void;
}

const TruckOwnerDetailsDrawer: React.FC<TruckOwnerDetailsDrawerProps> = ({
  ownerId,
  tenantId,
  isOpen,
  onClose,
  onViewTruck
}) => {
  // Fetch owner details
  const { data: owner, isLoading: ownerLoading } = useQuery({
    queryKey: ['truck-owner-details', ownerId],
    queryFn: () => fleetApi.getTruckOwnerById(tenantId, ownerId),
    enabled: isOpen && !!ownerId,
  });

  // Fetch owner's trucks
  const { data: trucksData, isLoading: trucksLoading } = useQuery({
    queryKey: ['owner-trucks', ownerId],
    queryFn: () => fleetApi.getTrucks(tenantId, {
      ownerId: ownerId,
      page: 1,
      limit: 100,
    }),
    enabled: isOpen && !!ownerId,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
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
        return <FaCheckCircle className="w-3 h-3" />;
      case 'MAINTENANCE':
        return <FaClock className="w-3 h-3" />;
      case 'INACTIVE':
      case 'OUT_OF_SERVICE':
        return <FaExclamationTriangle className="w-3 h-3" />;
      default:
        return <FaClock className="w-3 h-3" />;
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
          <h2 className="text-xl font-semibold text-gray-900">Truck Owner Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {ownerLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : owner ? (
            <>
              {/* Owner Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{owner.name}</h3>
                    {owner.companyName && (
                      <p className="text-sm text-gray-600 mt-1">{owner.companyName}</p>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(owner.status)}`}>
                    {getStatusIcon(owner.status)}
                    <span className="ml-1.5 capitalize">{owner.status.toLowerCase()}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center text-sm">
                    <FaEnvelope className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-gray-700">{owner.email}</span>
                  </div>
                  {owner.phone && (
                    <div className="flex items-center text-sm">
                      <FaPhone className="w-4 h-4 text-gray-400 mr-3" />
                      <span className="text-gray-700">{owner.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <FaTruck className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{owner.totalTrucks}</p>
                  <p className="text-sm text-gray-600">Total Trucks</p>
                  <p className="text-xs text-green-600 mt-1">{owner.activeTrucks} active</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <FaRoute className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{owner.totalTrips}</p>
                  <p className="text-sm text-gray-600">Total Trips</p>
                  <p className="text-xs text-gray-500 mt-1">{owner.completedTrips} completed</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <FaDollarSign className="w-8 h-8 text-purple-600" />
                  </div>
                  <p className="text-lg font-bold text-gray-900 mt-2">{formatCurrency(owner.totalRevenue)}</p>
                  <p className="text-sm text-gray-600">Revenue</p>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <FaStar className="w-8 h-8 text-yellow-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{owner.averageRating.toFixed(1)}</p>
                  <p className="text-sm text-gray-600">Rating</p>
                  <p className="text-xs text-gray-500 mt-1">Based on {owner.totalTrips} trips</p>
                </div>
              </div>

              {/* Trucks List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Trucks ({trucksData?.data.length || 0})</h3>
                </div>

                {trucksLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : trucksData && trucksData.data.length > 0 ? (
                  <div className="space-y-3">
                    {trucksData.data.map((truck) => (
                      <div
                        key={truck.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => onViewTruck && onViewTruck(truck.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-sm font-semibold text-gray-900">{truck.plateNumber}</h4>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(truck.status)}`}>
                                {getStatusIcon(truck.status)}
                                <span className="ml-1 capitalize">{truck.status.toLowerCase().replace('_', ' ')}</span>
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {truck.make} {truck.model} ({truck.year})
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                              <div className="flex items-center">
                                <FaUser className="w-3 h-3 mr-1.5" />
                                {truck.driver ? truck.driver.name : 'No driver'}
                              </div>
                              <div className="flex items-center">
                                <FaMapMarkerAlt className="w-3 h-3 mr-1.5" />
                                {truck.location}
                              </div>
                              <div className="flex items-center">
                                <FaRoute className="w-3 h-3 mr-1.5" />
                                {truck.totalTrips} trips
                              </div>
                              <div className="flex items-center">
                                <FaDollarSign className="w-3 h-3 mr-1.5" />
                                {formatCurrency(truck.totalRevenue)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FaTruck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No trucks found for this owner</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Owner not found</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TruckOwnerDetailsDrawer;
