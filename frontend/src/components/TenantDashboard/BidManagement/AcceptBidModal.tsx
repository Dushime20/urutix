import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { FaTimes, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { bidApi } from '../../../services/bidApi';
import type { Bid } from '../../../services/bidApi';
import toast from 'react-hot-toast';

interface AcceptBidModalProps {
  bid: Bid;
  onClose: () => void;
  onSuccess: () => void;
}

const AcceptBidModal: React.FC<AcceptBidModalProps> = ({
  bid,
  onClose,
  onSuccess
}) => {
  const acceptBidMutation = useMutation({
    mutationFn: () => bidApi.acceptBid(bid.id),
    onSuccess: () => {
      toast.success('Bid accepted successfully!');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to accept bid');
    }
  });

  const handleAccept = () => {
    acceptBidMutation.mutate();
  };

  const formatCurrency = (amount: number, currency: string = 'RWF') => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getLocationName = (location: any) => {
    if (!location) return 'N/A';
    if (typeof location === 'string') return location;
    return location.locationData?.name || location.name || 'N/A';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <FaCheckCircle className="mr-2" />
                Accept Bid
              </h3>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
                disabled={acceptBidMutation.isPending}
              >
                <FaTimes className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {/* Warning */}
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex">
                <FaExclamationTriangle className="text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800 mb-1">
                    Important Notice
                  </h4>
                  <p className="text-sm text-yellow-700">
                    Accepting this bid will close the auction and assign the load to this truck owner. 
                    All other pending bids will be automatically rejected.
                  </p>
                </div>
              </div>
            </div>

            {/* Bid Details */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Bid Amount</h4>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(bid.bidAmount, bid.bidCurrency)}
                </p>
              </div>

              {bid.load && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Load</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-900">{bid.load.title || 'N/A'}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {getLocationName(bid.load.pickupLocation)} → {getLocationName(bid.load.deliveryLocation)}
                    </p>
                  </div>
                </div>
              )}

              {bid.truckOwner && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Truck Owner</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-900">
                      {bid.truckOwner.profile?.firstName} {bid.truckOwner.profile?.lastName}
                    </p>
                    {bid.truckOwner.profile?.companyName && (
                      <p className="text-sm text-gray-600">{bid.truckOwner.profile.companyName}</p>
                    )}
                    <p className="text-sm text-gray-600">{bid.truckOwner.email}</p>
                  </div>
                </div>
              )}

              {bid.proposedPickupDate && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Proposed Pickup Date</h4>
                  <p className="text-sm text-gray-900">
                    {new Date(bid.proposedPickupDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Confirmation */}
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                Are you sure you want to accept this bid? This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              disabled={acceptBidMutation.isPending}
            >
              Cancel
            </button>
            <button
              onClick={handleAccept}
              disabled={acceptBidMutation.isPending}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {acceptBidMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Accepting...
                </>
              ) : (
                <>
                  <FaCheckCircle className="mr-2" />
                  Accept Bid
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcceptBidModal;
