import React from 'react';
import { 
  FaEye, FaCheckCircle, FaTimesCircle, FaClock, 
  FaChevronLeft, FaChevronRight, FaTruck, FaBox
} from 'react-icons/fa';
import type { Bid } from '../../../services/bidApi';

interface BidListProps {
  bids: Bid[];
  onViewDetails: (bid: Bid) => void;
  onAccept: (bid: Bid) => void;
  onReject: (bid: Bid) => void;
  currentPage: number;
  pageSize: number;
  totalBids: number;
  onPageChange: (page: number) => void;
}

const BidList: React.FC<BidListProps> = ({
  bids,
  onViewDetails,
  onAccept,
  onReject,
  currentPage,
  pageSize,
  totalBids,
  onPageChange
}) => {
  const totalPages = Math.ceil(totalBids / pageSize);

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      ACCEPTED: 'bg-green-100 text-green-800 border-green-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200',
      WITHDRAWN: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const icons = {
      PENDING: <FaClock className="mr-1" />,
      ACCEPTED: <FaCheckCircle className="mr-1" />,
      REJECTED: <FaTimesCircle className="mr-1" />,
      WITHDRAWN: <FaTimesCircle className="mr-1" />
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {status}
      </span>
    );
  };

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
      month: 'short',
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

  if (bids.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <FaBox className="mx-auto h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No bids found</h3>
        <p className="text-sm text-gray-500">Bids will appear here when truck owners submit them.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Load
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Truck Owner
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bid Amount
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bids.map((bid) => (
              <tr key={bid.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <FaBox className="text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {bid.load?.title || `Load #${bid.loadId.slice(0, 8)}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {getLocationName(bid.load?.pickupLocation)} → {getLocationName(bid.load?.deliveryLocation)}
                      </div>
                      {bid.load?.weight && (
                        <div className="text-xs text-gray-400">
                          {bid.load.weight} kg • {bid.load.cargoType}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold text-xs">
                        {bid.truckOwner?.profile?.firstName?.charAt(0) || 'T'}
                        {bid.truckOwner?.profile?.lastName?.charAt(0) || 'O'}
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {bid.truckOwner?.profile?.firstName} {bid.truckOwner?.profile?.lastName}
                      </div>
                      {bid.truckOwner?.profile?.companyName && (
                        <div className="text-sm text-gray-500">
                          {bid.truckOwner.profile.companyName}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">
                    {formatCurrency(bid.bidAmount, bid.bidCurrency)}
                  </div>
                  {bid.proposedPickupDate && (
                    <div className="text-xs text-gray-500">
                      Pickup: {new Date(bid.proposedPickupDate).toLocaleDateString()}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(bid.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(bid.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => onViewDetails(bid)}
                      className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-colors"
                      title="View details"
                    >
                      <FaEye />
                    </button>
                    {bid.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => onAccept(bid)}
                          className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded transition-colors"
                          title="Accept bid"
                        >
                          <FaCheckCircle />
                        </button>
                        <button
                          onClick={() => onReject(bid)}
                          className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors"
                          title="Reject bid"
                        >
                          <FaTimesCircle />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * pageSize, totalBids)}</span> of{' '}
                <span className="font-medium">{totalBids}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaChevronLeft className="h-5 w-5" />
                </button>
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span
                        key={page}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BidList;
