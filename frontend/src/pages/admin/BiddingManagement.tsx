import React, { useState } from 'react';
import { 
  FaChartLine, FaDollarSign, FaTruck, FaSearch, FaFilter, FaDownload,
  FaEye, FaEdit, FaPlus, FaCalendar, FaClock,
  FaGavel, FaCheckCircle, FaTimesCircle, FaExclamationTriangle
} from 'react-icons/fa';
import { useAdminLayout } from '../../contexts/AdminLayoutContext';

interface Bid {
  id: string;
  cargoId: string;
  cargoTitle: string;
  bidderName: string;
  bidderCompany: string;
  bidAmount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  submittedAt: string;
  validUntil: string;
  notes: string;
  estimatedDelivery: string;
  truckCapacity: number;
  rating: number;
}

const BiddingManagement: React.FC = () => {
  const { viewMode, isCompactMode } = useAdminLayout();
  const [bids, setBids] = useState<Bid[]>([
    {
      id: '1',
      cargoId: 'CRG001',
      cargoTitle: 'Electronics Shipment',
      bidderName: 'John Driver',
      bidderCompany: 'FastTrans Ltd',
      bidAmount: 850,
      status: 'pending',
      submittedAt: '2024-08-10T10:30:00Z',
      validUntil: '2024-08-15T23:59:59Z',
      notes: 'Express delivery available',
      estimatedDelivery: '2024-08-12',
      truckCapacity: 5000,
      rating: 4.8
    },
    {
      id: '2',
      cargoId: 'CRG002',
      cargoTitle: 'Medical Supplies',
      bidderName: 'Sarah Wilson',
      bidderCompany: 'MedTransport',
      bidAmount: 650,
      status: 'accepted',
      submittedAt: '2024-08-09T14:20:00Z',
      validUntil: '2024-08-14T23:59:59Z',
      notes: 'Refrigerated truck available',
      estimatedDelivery: '2024-08-11',
      truckCapacity: 3000,
      rating: 4.9
    },
    {
      id: '3',
      cargoId: 'CRG003',
      cargoTitle: 'Chemical Products',
      bidderName: 'Mike Johnson',
      bidderCompany: 'HazCargo Pro',
      bidAmount: 1200,
      status: 'rejected',
      submittedAt: '2024-08-08T16:45:00Z',
      validUntil: '2024-08-13T23:59:59Z',
      notes: 'Hazmat certified driver',
      estimatedDelivery: '2024-08-13',
      truckCapacity: 4000,
      rating: 4.6
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCargoId, setFilterCargoId] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'withdrawn': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <FaClock className="text-yellow-500" />;
      case 'accepted': return <FaCheckCircle className="text-green-500" />;
      case 'rejected': return <FaTimesCircle className="text-red-500" />;
      case 'withdrawn': return <FaExclamationTriangle className="text-gray-500" />;
      default: return <FaClock className="text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRatingStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'text-yellow-400' : 'text-gray-300'}>
          ★
        </span>
      );
    }
    return stars;
  };

  const filteredBids = bids.filter(bid => {
    const matchesSearch = bid.cargoTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bid.bidderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bid.bidderCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bid.cargoId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bid.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || bid.status === filterStatus;
    const matchesCargoId = !filterCargoId || bid.cargoId === filterCargoId;
    return matchesSearch && matchesStatus && matchesCargoId;
  });

  const handleAcceptBid = (bidId: string) => {
    setBids(bids.map(bid => 
      bid.id === bidId ? { ...bid, status: 'accepted' as const } : bid
    ));
    // You could add a toast notification here
    console.log(`Bid ${bidId} accepted successfully`);
  };

  const handleRejectBid = (bidId: string) => {
    setBids(bids.map(bid => 
      bid.id === bidId ? { ...bid, status: 'rejected' as const } : bid
    ));
    // You could add a toast notification here
    console.log(`Bid ${bidId} rejected successfully`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Bidding Management</h1>
          <p className="text-gray-600">Monitor and manage cargo bidding processes</p>
        </div>
        <div className="flex gap-2 items-center">
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2 transition-colors">
            <FaPlus />
            <span>Create Auction</span>
          </button>
        </div>
      </div>

      {/* Bidding Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">{bids.length}</p>
              <p className="text-gray-600">Total Bids</p>
            </div>
            <FaGavel className="text-purple-500 text-3xl" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">{bids.filter(b => b.status === 'pending').length}</p>
              <p className="text-gray-600">Pending</p>
            </div>
            <FaClock className="text-yellow-500 text-3xl" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">{bids.filter(b => b.status === 'accepted').length}</p>
              <p className="text-gray-600">Accepted</p>
            </div>
            <FaCheckCircle className="text-green-500 text-3xl" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">${bids.reduce((acc, b) => acc + b.bidAmount, 0).toLocaleString()}</p>
              <p className="text-gray-600">Total Value</p>
            </div>
            <FaDollarSign className="text-blue-500 text-3xl" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {bids.length > 0 ? (Math.round(bids.reduce((acc, b) => acc + b.rating, 0) / bids.length * 10) / 10) : 0}
              </p>
              <p className="text-gray-600">Avg Rating</p>
            </div>
            <FaChartLine className="text-orange-500 text-3xl" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search bids..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
          <select
            value={filterCargoId}
            onChange={(e) => setFilterCargoId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Cargos</option>
            <option value="CRG001">CRG001</option>
            <option value="CRG002">CRG002</option>
            <option value="CRG003">CRG003</option>
          </select>
          <button className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <FaFilter />
            <span>More Filters</span>
          </button>
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <FaDownload />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Bids Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBids.map((bid) => (
            <div key={bid.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <FaGavel className="text-purple-600" />
                  <span className="font-semibold text-gray-900">#{bid.id}</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bid.status)}`}>
                  {bid.status}
                </span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">{bid.cargoTitle}</div>
                  <div className="text-sm text-gray-500">{bid.cargoId}</div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="text-lg font-bold text-green-600">${bid.bidAmount}</div>
                  <div className="text-sm text-gray-500">• {bid.truckCapacity}kg</div>
                </div>
                
                <div className="text-sm text-gray-600">
                  <div className="font-medium">{bid.bidderName}</div>
                  <div>{bid.bidderCompany}</div>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-gray-500">
                    Est: {formatDate(bid.estimatedDelivery)}
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-800 p-1 rounded">
                      <FaEye className="w-4 h-4" />
                    </button>
                    {bid.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleAcceptBid(bid.id)}
                          className="text-green-600 hover:text-green-800 p-1 rounded"
                        >
                          <FaCheckCircle className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleRejectBid(bid.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded"
                        >
                          <FaTimesCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === 'card' ? (
        <div className="space-y-4">
          {filteredBids.map((bid) => (
            <div key={bid.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <FaGavel className="text-purple-600" />
                    <span className="font-semibold">#{bid.id}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{bid.cargoTitle}</div>
                    <div className="text-sm text-gray-500">{bid.cargoId}</div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div className="font-medium">{bid.bidderName}</div>
                    <div>{bid.bidderCompany}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">${bid.bidAmount}</div>
                    <div className="text-sm text-gray-500">{bid.truckCapacity}kg capacity</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bid.status)}`}>
                    {bid.status}
                  </span>
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-800 p-2 rounded">
                      <FaEye />
                    </button>
                    {bid.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleAcceptBid(bid.id)}
                          className="text-green-600 hover:text-green-800 p-2 rounded"
                        >
                          <FaCheckCircle />
                        </button>
                        <button 
                          onClick={() => handleRejectBid(bid.id)}
                          className="text-red-600 hover:text-red-800 p-2 rounded"
                        >
                          <FaTimesCircle />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // List/Table View
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bid Details</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bidder</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timeline</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBids.map((bid) => (
                <tr key={bid.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        <FaGavel />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{bid.cargoTitle}</div>
                        <div className="text-sm text-gray-500">Cargo ID: {bid.cargoId}</div>
                        <div className="text-sm text-gray-500">Bid ID: {bid.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium">{bid.bidderName}</div>
                      <div className="text-gray-500">{bid.bidderCompany}</div>
                      <div className="flex items-center mt-1">
                        <span className="text-sm mr-2">Rating:</span>
                        <div className="flex">{getRatingStars(bid.rating)}</div>
                        <span className="text-sm text-gray-500 ml-1">({bid.rating})</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="text-lg font-bold text-green-600">${bid.bidAmount}</div>
                      <div className="text-sm text-gray-500">
                        <div className="flex items-center">
                          <FaTruck className="mr-1" />
                          {bid.truckCapacity} kg capacity
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(bid.status)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bid.status)}`}>
                        {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <FaCalendar className="text-gray-400 mr-2" />
                        Submitted: {formatDateTime(bid.submittedAt)}
                      </div>
                      <div className="flex items-center">
                        <FaClock className="text-gray-400 mr-2" />
                        Valid until: {formatDate(bid.validUntil)}
                      </div>
                      <div className="flex items-center">
                        <FaTruck className="text-gray-400 mr-2" />
                        Est. delivery: {formatDate(bid.estimatedDelivery)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors">
                        <FaEye />
                      </button>
                      {bid.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleAcceptBid(bid.id)}
                            className="text-green-600 hover:text-green-900 p-1 rounded transition-colors"
                          >
                            <FaCheckCircle />
                          </button>
                          <button 
                            onClick={() => handleRejectBid(bid.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                          >
                            <FaTimesCircle />
                          </button>
                        </>
                      )}
                      <button className="text-gray-600 hover:text-gray-900 p-1 rounded transition-colors">
                        <FaEdit />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Notes Section */}
      {filteredBids.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Bid Notes</h3>
          <div className="space-y-3">
            {filteredBids.slice(0, 3).map((bid) => (
              <div key={bid.id} className="border-l-4 border-purple-500 pl-4 py-2">
                <div className="text-sm font-medium text-gray-900">{bid.cargoTitle} - {bid.bidderName}</div>
                <div className="text-sm text-gray-600">{bid.notes}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BiddingManagement;
