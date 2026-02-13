import React, { useState } from 'react';
import { 
  FaShieldAlt, 
  FaLock, 
  FaUnlock,
  FaSearch, 
  FaFilter, 
  FaDownload,
  FaEye,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaTruck,
  FaBox,
  FaChartLine
} from 'react-icons/fa';
import AdminPageLayout from '../components/Admin/AdminPageLayout';

interface EscrowAccount {
  id: string;
  tripId: string;
  cargoOwner: string;
  truckOwner: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'ACTIVE' | 'RELEASED' | 'DISPUTED' | 'CANCELLED';
  createdAt: string;
  releaseCondition: string;
  releaseDate?: string;
  disputeReason?: string;
}

const EscrowManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowAccount | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Mock data - replace with actual API call
  const escrowAccounts: EscrowAccount[] = [
    {
      id: 'ESC-001',
      tripId: 'TRP-2024-001',
      cargoOwner: 'ABC Logistics Ltd',
      truckOwner: 'XYZ Transport Co',
      amount: 2500.00,
      currency: 'USD',
      status: 'ACTIVE',
      createdAt: '2024-02-10T10:30:00Z',
      releaseCondition: 'Delivery Confirmed',
    },
    {
      id: 'ESC-002',
      tripId: 'TRP-2024-002',
      cargoOwner: 'Global Shipping Inc',
      truckOwner: 'Fast Freight LLC',
      amount: 3750.00,
      currency: 'USD',
      status: 'RELEASED',
      createdAt: '2024-02-08T14:20:00Z',
      releaseCondition: 'Delivery Confirmed',
      releaseDate: '2024-02-11T09:15:00Z',
    },
    {
      id: 'ESC-003',
      tripId: 'TRP-2024-003',
      cargoOwner: 'Metro Cargo Services',
      truckOwner: 'Prime Movers Ltd',
      amount: 1850.00,
      currency: 'USD',
      status: 'DISPUTED',
      createdAt: '2024-02-09T08:45:00Z',
      releaseCondition: 'Delivery Confirmed',
      disputeReason: 'Damaged goods reported',
    },
    {
      id: 'ESC-004',
      tripId: 'TRP-2024-004',
      cargoOwner: 'Express Cargo Hub',
      truckOwner: 'Swift Transport',
      amount: 4200.00,
      currency: 'USD',
      status: 'PENDING',
      createdAt: '2024-02-12T11:00:00Z',
      releaseCondition: 'Awaiting Pickup Confirmation',
    },
  ];

  const stats = {
    totalEscrow: escrowAccounts.reduce((sum, acc) => sum + acc.amount, 0),
    activeAccounts: escrowAccounts.filter(acc => acc.status === 'ACTIVE').length,
    pendingRelease: escrowAccounts.filter(acc => acc.status === 'PENDING').length,
    disputes: escrowAccounts.filter(acc => acc.status === 'DISPUTED').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'RELEASED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'DISPUTED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <FaLock className="w-3 h-3" />;
      case 'RELEASED':
        return <FaCheckCircle className="w-3 h-3" />;
      case 'DISPUTED':
        return <FaExclamationTriangle className="w-3 h-3" />;
      case 'PENDING':
        return <FaClock className="w-3 h-3" />;
      case 'CANCELLED':
        return <FaTimesCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const filteredAccounts = escrowAccounts.filter(account => {
    const matchesSearch = 
      account.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.tripId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.cargoOwner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.truckOwner.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || account.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (escrow: EscrowAccount) => {
    setSelectedEscrow(escrow);
    setShowDetailsModal(true);
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

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <AdminPageLayout
      title="Escrow Management"
      description="Monitor and manage secure payment escrow accounts"
      actions={
        <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm text-sm font-medium">
          <FaDownload className="w-4 h-4" />
          Export Report
        </button>
      }
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-white/20 p-2.5 rounded-lg">
              <FaMoneyBillWave className="w-5 h-5" />
            </div>
            <FaChartLine className="w-4 h-4 opacity-70" />
          </div>
          <div className="text-2xl font-bold mb-1">
            {formatCurrency(stats.totalEscrow, 'USD')}
          </div>
          <div className="text-blue-100 text-sm">Total in Escrow</div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-50 p-2.5 rounded-lg">
              <FaLock className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              Active
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {stats.activeAccounts}
          </div>
          <div className="text-gray-600 text-sm">Active Accounts</div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-yellow-50 p-2.5 rounded-lg">
              <FaClock className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
              Pending
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {stats.pendingRelease}
          </div>
          <div className="text-gray-600 text-sm">Pending Release</div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-red-50 p-2.5 rounded-lg">
              <FaExclamationTriangle className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
              Alert
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {stats.disputes}
          </div>
          <div className="text-gray-600 text-sm">Disputed Accounts</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by ID, trip, cargo owner, or truck owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none bg-white cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="ACTIVE">Active</option>
                <option value="RELEASED">Released</option>
                <option value="DISPUTED">Disputed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Escrow Accounts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Escrow ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Trip ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Parties
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <FaShieldAlt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No escrow accounts found</p>
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FaShieldAlt className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-900">{account.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FaTruck className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm text-gray-600">{account.tripId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-1.5 mb-1">
                          <FaBox className="w-3 h-3 text-blue-500" />
                          <span className="text-gray-900 font-medium">{account.cargoOwner}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FaTruck className="w-3 h-3 text-green-500" />
                          <span className="text-gray-600">{account.truckOwner}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(account.amount, account.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(account.status)}`}>
                        {getStatusIcon(account.status)}
                        {account.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(account.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetails(account)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1.5 transition-colors"
                      >
                        <FaEye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedEscrow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-3 rounded-lg">
                    <FaShieldAlt className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Escrow Details</h2>
                    <p className="text-blue-100 text-sm">{selectedEscrow.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Banner */}
              <div className={`p-4 rounded-lg border-2 ${getStatusColor(selectedEscrow.status)}`}>
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedEscrow.status)}
                  <span className="font-semibold">Status: {selectedEscrow.status}</span>
                </div>
                {selectedEscrow.disputeReason && (
                  <p className="mt-2 text-sm">{selectedEscrow.disputeReason}</p>
                )}
              </div>

              {/* Amount */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Escrow Amount</div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(selectedEscrow.amount, selectedEscrow.currency)}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Trip ID</div>
                  <div className="font-medium text-gray-900">{selectedEscrow.tripId}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Created</div>
                  <div className="font-medium text-gray-900">{formatDate(selectedEscrow.createdAt)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Cargo Owner</div>
                  <div className="font-medium text-gray-900">{selectedEscrow.cargoOwner}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Truck Owner</div>
                  <div className="font-medium text-gray-900">{selectedEscrow.truckOwner}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm text-gray-600 mb-1">Release Condition</div>
                  <div className="font-medium text-gray-900">{selectedEscrow.releaseCondition}</div>
                </div>
                {selectedEscrow.releaseDate && (
                  <div className="col-span-2">
                    <div className="text-sm text-gray-600 mb-1">Released On</div>
                    <div className="font-medium text-green-600">{formatDate(selectedEscrow.releaseDate)}</div>
                  </div>
                )}
              </div>

              {/* Actions */}
              {selectedEscrow.status === 'ACTIVE' && (
                <div className="flex gap-3 pt-4 border-t">
                  <button className="flex-1 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2">
                    <FaUnlock className="w-4 h-4" />
                    Release Funds
                  </button>
                  <button className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2">
                    <FaExclamationTriangle className="w-4 h-4" />
                    Raise Dispute
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default EscrowManagement;
