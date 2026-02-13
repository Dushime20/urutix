import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FaTimes, FaTimesCircle } from 'react-icons/fa';
import { bidApi } from '../../../services/bidApi';
import type { Bid } from '../../../services/bidApi';
import toast from 'react-hot-toast';

interface RejectBidModalProps {
  bid: Bid;
  onClose: () => void;
  onSuccess: () => void;
}

const RejectBidModal: React.FC<RejectBidModalProps> = ({
  bid,
  onClose,
  onSuccess
}) => {
  const [reason, setReason] = useState('');

  const rejectBidMutation = useMutation({
    mutationFn: () => bidApi.rejectBid(bid.id, reason),
    onSuccess: () => {
      toast.success('Bid rejected successfully!');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject bid');
    }
  });

  const handleReject = () => {
    rejectBidMutation.mutate();
  };

  const formatCurrency = (amount: number, currency: string = 'RWF') => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-gradient-to-r from-red-600 to-pink-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <FaTimesCircle className="mr-2" />
                Reject Bid
              </h3>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
                disabled={rejectBidMutation.isPending}
              >
                <FaTimes className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Bid Amount</h4>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(bid.bidAmount, bid.bidCurrency)}
                </p>
              </div>

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
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Rejection (Optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Provide a reason for rejecting this bid..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  This reason will be sent to the truck owner
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                Are you sure you want to reject this bid? This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              disabled={rejectBidMutation.isPending}
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={rejectBidMutation.isPending}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {rejectBidMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Rejecting...
                </>
              ) : (
                <>
                  <FaTimesCircle className="mr-2" />
                  Reject Bid
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RejectBidModal;
