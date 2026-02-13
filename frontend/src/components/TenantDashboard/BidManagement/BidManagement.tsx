import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FaGavel, FaSearch, FaFilter, FaCheckCircle, FaTimesCircle, 
  FaClock, FaChartLine
} from 'react-icons/fa';
import BidList from './BidList';
import BidDetailsDrawer from './BidDetailsDrawer';
import AcceptBidModal from './AcceptBidModal';
import RejectBidModal from './RejectBidModal';
import BidFilters from './BidFilters';
import { bidApi } from '../../../services/bidApi';
import type { Bid } from '../../../services/bidApi';

interface BidManagementProps {
  tenantId: string;
  className?: string;
}

const BidManagement: React.FC<BidManagementProps> = ({ 
  tenantId, 
  className = '' 
}) => {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Fetch bids
  const { data: bidsData, isLoading, error, refetch } = useQuery({
    queryKey: ['tenant-bids', tenantId, selectedStatus, searchQuery, currentPage],
    queryFn: () => bidApi.getTenantBids({
      status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      page: currentPage,
      limit: pageSize
    }),
    enabled: !!tenantId
  });

  // Bid statistics
  const bidStats = React.useMemo(() => {
    if (!bidsData?.data) return { total: 0, pending: 0, accepted: 0, rejected: 0 };
    
    const bids = bidsData.data;
    return {
      total: bids.length,
      pending: bids.filter((b: Bid) => b.status === 'PENDING').length,
      accepted: bids.filter((b: Bid) => b.status === 'ACCEPTED').length,
      rejected: bids.filter((b: Bid) => b.status === 'REJECTED').length
    };
  }, [bidsData]);

  // Handlers
  const handleViewDetails = (bid: Bid) => {
    setSelectedBid(bid);
    setShowDetailsDrawer(true);
  };

  const handleAcceptBid = (bid: Bid) => {
    setSelectedBid(bid);
    setShowAcceptModal(true);
  };

  const handleRejectBid = (bid: Bid) => {
    setSelectedBid(bid);
    setShowRejectModal(true);
  };

  const handleBidAccepted = () => {
    setShowAcceptModal(false);
    setSelectedBid(null);
    refetch();
  };

  const handleBidRejected = () => {
    setShowRejectModal(false);
    setSelectedBid(null);
    refetch();
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <FaGavel className="mr-3 text-blue-600" />
              Bid Management
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage bids across all loads in your tenant
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaChartLine className="mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Bids</p>
                <p className="text-2xl font-bold text-gray-900">{bidStats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaGavel className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{bidStats.pending}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FaClock className="text-yellow-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Accepted</p>
                <p className="text-2xl font-bold text-green-600">{bidStats.accepted}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FaCheckCircle className="text-green-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{bidStats.rejected}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <FaTimesCircle className="text-red-600 text-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by load title, truck owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
              showFilters 
                ? 'bg-blue-50 border-blue-500 text-blue-700' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FaFilter className="mr-2" />
            Filters
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <BidFilters
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            onReset={() => {
              setSelectedStatus('ALL');
              setSearchQuery('');
            }}
          />
        )}
      </div>

      {/* Bid List */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">Error loading bids. Please try again.</p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <BidList
            bids={bidsData?.data || []}
            onViewDetails={handleViewDetails}
            onAccept={handleAcceptBid}
            onReject={handleRejectBid}
            currentPage={currentPage}
            pageSize={pageSize}
            totalBids={bidsData?.total || 0}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Modals and Drawers */}
      {showDetailsDrawer && selectedBid && (
        <BidDetailsDrawer
          bid={selectedBid}
          onClose={() => {
            setShowDetailsDrawer(false);
            setSelectedBid(null);
          }}
          onAccept={handleAcceptBid}
          onReject={handleRejectBid}
        />
      )}

      {showAcceptModal && selectedBid && (
        <AcceptBidModal
          bid={selectedBid}
          onClose={() => {
            setShowAcceptModal(false);
            setSelectedBid(null);
          }}
          onSuccess={handleBidAccepted}
        />
      )}

      {showRejectModal && selectedBid && (
        <RejectBidModal
          bid={selectedBid}
          onClose={() => {
            setShowRejectModal(false);
            setSelectedBid(null);
          }}
          onSuccess={handleBidRejected}
        />
      )}
    </div>
  );
};

export default BidManagement;
