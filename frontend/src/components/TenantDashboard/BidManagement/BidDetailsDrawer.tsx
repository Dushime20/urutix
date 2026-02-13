import React from 'react';
import { FaTimes, FaCheckCircle, FaTimesCircle, FaTruck, FaBox, FaCalendar, FaDollarSign, FaStickyNote } from 'react-icons/fa';
import type { Bid } from '../../../services/bidApi';

interface BidDetailsDrawerProps {
  bid: Bid;
  onClose: () => void;
  onAccept: (bid: Bid) => void;
  onReject: (bid: Bid) => void;
}

const BidDetailsDrawer: React.FC<BidDetailsDrawerProps> = ({
  bid,
  onClose,
  onAccept,
  onReject
}) => {
  const formatCurrency = (amount: number, currency: string = 'RWF') => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLocationName = (location: any) => {
    if (!location) return 'N/A';
    if (typeof location === 'string') return location;
    return location.locationData?.name || location.name || 'N/A';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      ACCEPTED: 'bg-green-100 text-green-800 border-green-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200',
      WITHDRAWN: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status as keyof typeof colors] || colors.PENDING;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-2xl w-full bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Bid Details</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <FaTimes className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Status Badge */}
          <div className="mb-6">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(bid.status)}`}>
              {bid.status}
            </span>
          </div>

          {/* Bid Amount */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Bid Amount</p>
                <p className="text-3xl font-bold text-blue-900">
                  {formatCurrency(bid.bidAmount, bid.bidCurrency)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaDollarSign className="text-blue-600 text-2xl" />
              </div>
            </div>
          </div>

          {/* Load Information */}
          {bid.load && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FaBox className="mr-2 text-blue-600" />
                Load Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Title</p>
                  <p className="text-sm font-medium text-gray-900">{bid.load.title || 'N/A'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Pickup Location</p>
                    <p className="text-sm font-medium text-gray-900">{getLocationName(bid.load.pickupLocation)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Delivery Location</p>
                    <p className="text-sm font-medium text-gray-900">{getLocationName(bid.load.deliveryLocation)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Weight</p>
                    <p className="text-sm font-medium text-gray-900">{bid.load.weight} kg</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cargo Type</p>
                    <p className="text-sm font-medium text-gray-900">{bid.load.cargoType}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Truck Owner Information */}
          {bid.truckOwner && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FaTruck className="mr-2 text-purple-600" />
                Truck Owner
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold">
                    {bid.truckOwner.profile?.firstName?.charAt(0) || 'T'}
                    {bid.truckOwner.profile?.lastName?.charAt(0) || 'O'}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {bid.truckOwner.profile?.firstName} {bid.truckOwner.profile?.lastName}
                    </p>
                    {bid.truckOwner.profile?.companyName && (
                      <p className="text-sm text-gray-500">{bid.truckOwner.profile.companyName}</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">{bid.truckOwner.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Proposed Dates */}
          {(bid.proposedPickupDate || bid.proposedDeliveryDate) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FaCalendar className="mr-2 text-green-600" />
                Proposed Dates
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {bid.proposedPickupDate && (
                  <div>
                    <p className="text-sm text-gray-500">Pickup Date</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(bid.proposedPickupDate)}</p>
                  </div>
                )}
                {bid.proposedDeliveryDate && (
                  <div>
                    <p className="text-sm text-gray-500">Delivery Date</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(bid.proposedDeliveryDate)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bid Notes */}
          {bid.bidNotes && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FaStickyNote className="mr-2 text-yellow-600" />
                Notes
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{bid.bidNotes}</p>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Timeline</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <p className="text-sm text-gray-500">Created</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(bid.createdAt)}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(bid.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        {bid.status === 'PENDING' && (
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => onReject(bid)}
                className="flex items-center px-4 py-2 border border-red-300 rounded-lg text-red-700 bg-white hover:bg-red-50 transition-colors"
              >
                <FaTimesCircle className="mr-2" />
                Reject Bid
              </button>
              <button
                onClick={() => onAccept(bid)}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FaCheckCircle className="mr-2" />
                Accept Bid
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BidDetailsDrawer;
