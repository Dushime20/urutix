import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FaTimes, FaUser, FaEnvelope, FaPhone, FaBox,
  FaStar, FaDollarSign, FaCheckCircle, FaClock,
  FaMapMarkerAlt, FaTruck, FaBuilding
} from 'react-icons/fa';
import { cargoApi } from '../../services/cargoApi';
import type { CargoOwner, Load } from '../../services/cargoApi';

interface CargoOwnerDetailsDrawerProps {
  ownerId: string;
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
  onViewLoad?: (loadId: string) => void;
}

const CargoOwnerDetailsDrawer: React.FC<CargoOwnerDetailsDrawerProps> = ({
  ownerId,
  tenantId,
  isOpen,
  onClose,
  onViewLoad
}) => {
  // Fetch owner details
  const { data: owner, isLoading: ownerLoading } = useQuery({
    queryKey: ['cargo-owner-details', ownerId],
    queryFn: () => cargoApi.getCargoOwnerById(tenantId, ownerId),
    enabled: isOpen && !!ownerId,
  });

  // Fetch owner's loads
  const { data: loadsData, isLoading: loadsLoading } = useQuery({
    queryKey: ['owner-loads', ownerId],
    queryFn: () => cargoApi.getLoads(tenantId, {
      ownerId: ownerId,
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
    switch (status.toLowerCase()) {
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'created': return 'text-blue-600 bg-blue-100';
      case 'published': return 'text-green-600 bg-green-100';
      case 'assigned': return 'text-purple-600 bg-purple-100';
      case 'in_transit': return 'text-blue-600 bg-blue-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'active': return 'text-green-600 bg-green-100';
      case 'suspended': return 'text-yellow-600 bg-yellow-100';
      case 'deactivated': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'active':
        return <FaCheckCircle className="w-3 h-3" />;
      case 'in_transit':
        return <FaTruck className="w-3 h-3" />;
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
          <h2 className="text-xl font-semibold text-gray-900">Cargo Owner Details</h2>
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
                    <FaBox className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{owner.totalLoads}</p>
                  <p className="text-sm text-gray-600">Total Loads</p>
                  <p className="text-xs text-green-600 mt-1">{owner.activeLoads} active</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <FaCheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{owner.completedLoads}</p>
                  <p className="text-sm text-gray-600">Completed</p>
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
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {owner.averageRating > 0 ? owner.averageRating.toFixed(1) : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">Rating</p>
                </div>
              </div>

              {/* Loads List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Loads ({loadsData?.loads.length || 0})</h3>
                </div>

                {loadsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : loadsData && loadsData.loads.length > 0 ? (
                  <div className="space-y-3">
                    {loadsData.loads.map((load) => (
                      <div
                        key={load.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => onViewLoad && onViewLoad(load.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-sm font-semibold text-gray-900">{load.loadNumber}</h4>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(load.status)}`}>
                                {getStatusIcon(load.status)}
                                <span className="ml-1 capitalize">{load.status.replace('_', ' ')}</span>
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {load.cargoType} - {load.weight > 0 ? `${load.weight} kg` : 'Weight not specified'}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                              <div className="flex items-center">
                                <FaMapMarkerAlt className="w-3 h-3 mr-1.5" />
                                {load.origin}
                              </div>
                              <div className="flex items-center">
                                <FaMapMarkerAlt className="w-3 h-3 mr-1.5" />
                                {load.destination}
                              </div>
                              {load.assignedTruck && (
                                <div className="flex items-center">
                                  <FaTruck className="w-3 h-3 mr-1.5" />
                                  {load.assignedTruck.plateNumber}
                                </div>
                              )}
                              {load.revenue > 0 && (
                                <div className="flex items-center">
                                  <FaDollarSign className="w-3 h-3 mr-1.5" />
                                  {formatCurrency(load.revenue)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FaBox className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No loads found for this owner</p>
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

export default CargoOwnerDetailsDrawer;
