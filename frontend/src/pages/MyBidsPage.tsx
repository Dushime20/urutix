import React, { useState, useEffect } from 'react';
import { FaSearch, FaSortAmountUp, FaSortAmountDown } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { biddingAPI } from '../services/biddingApi';

interface Bid {
  id: string;
  auctionId: string;
  auctionTitle: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  createdAt: string;
  updatedAt: string;
  auction: {
    id: string;
    title: string;
    status: 'ACTIVE' | 'CLOSED' | 'CANCELLED';
    endDate: string;
    currentHighestBid?: number;
    totalBids: number;
  };
}

const MyBidsPage: React.FC = () => {
  const { user } = useAuth();
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (user) {
      loadMyBids();
    }
  }, [user]);

  const loadMyBids = async () => {
    try {
      setLoading(true);
      const response = await biddingAPI.getMyBids();
      setBids(response.data || []);
    } catch (error) {
      console.error('Failed to load bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'WITHDRAWN':
        return 'bg-gray-100 text-gray-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAuctionStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBids = bids.filter(bid => {
    const matchesSearch = bid.auctionTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bid.auction.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || bid.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedBids = [...filteredBids].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'amount':
        aValue = a.amount;
        bValue = b.amount;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      case 'auctionTitle':
        aValue = a.auctionTitle.toLowerCase();
        bValue = b.auctionTitle.toLowerCase();
        break;
      default:
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // Simple utility functions
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Bids</h1>
        <p className="text-gray-600 mt-2">Track all your auction bids and their current status</p>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search auctions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-[200px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full sm:w-[200px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="createdAt">Date</option>
            <option value="amount">Amount</option>
            <option value="auctionTitle">Auction Title</option>
          </select>

          <button
            onClick={toggleSortOrder}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
          >
            {sortOrder === 'asc' ? <FaSortAmountUp className="h-4 w-4 inline mr-1" /> : <FaSortAmountDown className="h-4 w-4 inline mr-1" />}
            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">{bids.length}</div>
          <div className="text-sm text-gray-600">Total Bids</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">
            {bids.filter(b => b.status === 'ACCEPTED').length}
          </div>
          <div className="text-sm text-gray-600">Accepted</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {bids.filter(b => b.status === 'PENDING').length}
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-red-600">
            {bids.filter(b => b.status === 'REJECTED').length}
          </div>
          <div className="text-sm text-gray-600">Rejected</div>
        </div>
      </div>

      {/* Bids List */}
      <div className="space-y-4">
        {sortedBids.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-500 text-lg">No bids found</div>
            <div className="text-gray-400 text-sm mt-2">
              {searchTerm || statusFilter !== 'ALL' 
                ? 'Try adjusting your filters' 
                : 'Start bidding on auctions to see them here'}
            </div>
          </div>
        ) : (
          sortedBids.map((bid) => (
            <div key={bid.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {bid.auctionTitle}
                      </h3>
                      <div className="flex gap-2 ml-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(bid.status)}`}>
                          {bid.status}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAuctionStatusColor(bid.auction.status)}`}>
                          {bid.auction.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Your Bid:</span>
                        <div className="text-lg font-bold text-blue-600">
                          {formatCurrency(bid.amount, bid.currency)}
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium">Current Highest:</span>
                        <div className="text-lg font-semibold">
                          {bid.auction.currentHighestBid 
                            ? formatCurrency(bid.auction.currentHighestBid, bid.currency)
                            : 'No bids yet'
                          }
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium">Total Bids:</span>
                        <div className="text-lg font-semibold">{bid.auction.totalBids}</div>
                      </div>
                      
                      <div>
                        <span className="font-medium">Auction Ends:</span>
                        <div className="text-lg font-semibold">
                          {formatDate(bid.auction.endDate)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 lg:items-end">
                    <div className="text-sm text-gray-500">
                      Bid placed: {formatDate(bid.createdAt)}
                    </div>
                    {bid.updatedAt !== bid.createdAt && (
                      <div className="text-sm text-gray-500">
                        Last updated: {formatDate(bid.updatedAt)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyBidsPage;
