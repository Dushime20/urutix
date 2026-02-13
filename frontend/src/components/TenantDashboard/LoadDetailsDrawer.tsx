import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FaTimes, FaBox, FaUser, FaBuilding, FaMapMarkerAlt,
  FaCheckCircle, FaClock, FaTruck, FaDollarSign,
  FaWeight, FaRuler, FaCalendar, FaPhone, FaEnvelope,
  FaIdCard, FaFileAlt
} from 'react-icons/fa';
import { cargoApi } from '../../services/cargoApi';

interface LoadDetailsDrawerProps {
  loadId: string;
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
}

const LoadDetailsDrawer: React.FC<LoadDetailsDrawerProps> = ({
  loadId,
  tenantId,
  isOpen,
  onClose
}) => {
  // Fetch load details
  const { data: load, isLoading } = useQuery({
    queryKey: ['load-details', loadId],
    queryFn: () => cargoApi.getLoadById(tenantId, loadId),
    enabled: isOpen && !!loadId,
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <FaCheckCircle className="w-4 h-4" />;
      case 'in_transit':
        return <FaTruck className="w-4 h-4" />;
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
          <h2 className="text-xl font-semibold text-gray-900">Load Details</h2>
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
          ) : load ? (
            <>
              {/* Load Header */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{load.loadNumber}</h3>
                    <p className="text-lg text-gray-600 mt-1">{load.cargoType}</p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(load.status)}`}>
                    {getStatusIcon(load.status)}
                    <span className="ml-2 capitalize">{load.status.replace('_', ' ')}</span>
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {load.isOwnCargo && (
                    <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-800 font-medium">
                      📦 Our Cargo
                    </span>
                  )}
                  {load.isOwnFleet && (
                    <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-800 font-medium">
                      🚛 Our Fleet
                    </span>
                  )}
                </div>
              </div>

              {/* Route Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <FaMapMarkerAlt className="w-4 h-4 mr-2" />
                  Route Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Pickup Location</p>
                    <p className="text-sm font-medium text-gray-900">{load.origin}</p>
                    {load.pickupDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        <FaCalendar className="inline w-3 h-3 mr-1" />
                        {formatDate(load.pickupDate)}
                      </p>
                    )}
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-xs text-gray-600 mb-1">Delivery Location</p>
                    <p className="text-sm font-medium text-gray-900">{load.destination}</p>
                    {load.deliveryDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        <FaCalendar className="inline w-3 h-3 mr-1" />
                        {formatDate(load.deliveryDate)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Cargo Owner Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <FaUser className="w-4 h-4 mr-2" />
                  Cargo Owner
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium text-gray-900">{load.owner.name}</span>
                  </div>
                  {load.owner.companyName && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Company:</span>
                      <span className="font-medium text-gray-900">{load.owner.companyName}</span>
                    </div>
                  )}
                  {load.owner.email && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium text-gray-900">{load.owner.email}</span>
                    </div>
                  )}
                  {load.owner.phone && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium text-gray-900">{load.owner.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Assigned Truck & Driver */}
              {(load.assignedTruck || load.assignedDriver) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <FaTruck className="w-4 h-4 mr-2" />
                    Assigned Transport
                  </h4>
                  <div className="space-y-4">
                    {load.assignedTruck && (
                      <div>
                        <p className="text-xs text-gray-600 mb-2">Truck</p>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900">
                            {load.assignedTruck.plateNumber}
                          </p>
                          {load.assignedTruck.make && (
                            <p className="text-xs text-gray-500">
                              {load.assignedTruck.make} {load.assignedTruck.model}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {load.assignedDriver && (
                      <div className="border-t border-gray-200 pt-3">
                        <p className="text-xs text-gray-600 mb-2">Driver</p>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900">
                            {load.assignedDriver.name}
                          </p>
                          {load.assignedDriver.phone && (
                            <p className="text-xs text-gray-500">
                              <FaPhone className="inline w-3 h-3 mr-1" />
                              {load.assignedDriver.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Cargo Specifications */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <FaBox className="w-4 h-4 mr-2" />
                  Cargo Specifications
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-start">
                    <FaWeight className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-600">Weight</p>
                      <p className="text-sm font-medium text-gray-900">
                        {load.weight > 0 ? `${load.weight} kg` : 'Not specified'}
                      </p>
                    </div>
                  </div>
                  {load.dimensions && (
                    <div className="flex items-start">
                      <FaRuler className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-600">Dimensions</p>
                        <p className="text-sm font-medium text-gray-900">{load.dimensions}</p>
                      </div>
                    </div>
                  )}
                  {load.quantity && (
                    <div className="flex items-start">
                      <FaBox className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-600">Quantity</p>
                        <p className="text-sm font-medium text-gray-900">{load.quantity}</p>
                      </div>
                    </div>
                  )}
                  {load.revenue > 0 && (
                    <div className="flex items-start">
                      <FaDollarSign className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-600">Revenue</p>
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(load.revenue)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {load.description && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <FaFileAlt className="w-4 h-4 mr-2" />
                    Description
                  </h4>
                  <p className="text-sm text-gray-700">{load.description}</p>
                </div>
              )}

              {/* Additional Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Additional Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Load Number:</span>
                    <span className="font-medium text-gray-900">{load.loadNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cargo Type:</span>
                    <span className="font-medium text-gray-900">{load.cargoType}</span>
                  </div>
                  {load.createdAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium text-gray-900">{formatDate(load.createdAt)}</span>
                    </div>
                  )}
                  {load.updatedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-medium text-gray-900">{formatDate(load.updatedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Load not found</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LoadDetailsDrawer;
