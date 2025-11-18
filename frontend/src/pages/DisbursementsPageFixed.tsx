import React, { useState, useMemo, useEffect } from 'react';
import { LendingApi } from '../services/lending/lendingApi';
import { 
  FaMoneyBillWave, 
  FaClock, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaSearch,
  FaFilter,
  FaDownload,
  FaEye,
  FaTimesCircle,
  FaFileInvoiceDollar,
  FaCalendarAlt,
  FaUser,
  FaTruck,
  FaMapMarkerAlt,
  FaSortAmountDown,
  FaSortAmountUp,
  FaChartLine,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';

interface Disbursement {
  id: string;
  loanId: string;
  borrowerName: string;
  borrowerEmail?: string;
  borrowerPhone?: string;
  amount: number;
  requestedDate: string;
  approvedDate?: string;
  disbursedDate?: string;
  status: 'pending' | 'approved' | 'disbursed' | 'rejected' | 'on_hold';
  cargoType: string;
  route: {
    origin: string;
    destination: string;
  };
  purpose: string;
  interestRate: number;
  termMonths: number;
  documents: {
    type: string;
    status: 'verified' | 'pending' | 'rejected';
  }[];
  riskScore: number;
  creditScore: number;
  collateralValue?: number;
  disbursementMethod: 'bank_transfer' | 'check' | 'escrow' | 'digital_wallet';
  bankDetails?: {
    accountNumber: string;
    routingNumber: string;
    bankName: string;
  };
  notes?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const DisbursementsPage: React.FC = () => {
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Get lenderId from localStorage or context (assuming it's stored there)
  const lenderId = localStorage.getItem('lenderId') || 'default-lender-id';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('requestedDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedDisbursement, setSelectedDisbursement] = useState<Disbursement | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [disbursementStats, setDisbursementStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    disbursed: 0,
    totalAmount: 0,
    disbursedAmount: 0,
    avgProcessingTime: 0
  });

  // Load disbursements from API
  useEffect(() => {
    loadDisbursements();
  }, [searchTerm, statusFilter, priorityFilter, sortField, sortDirection, pagination.page]);

  const loadDisbursements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await LendingApi.getLenderDisbursements(lenderId, {
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter === 'all' ? undefined : statusFilter,
        priority: priorityFilter === 'all' ? undefined : priorityFilter,
        search: searchTerm || undefined,
        sortBy: sortField,
        sortOrder: sortDirection
      });

      setDisbursements(response.disbursements || []);
      setPagination(response.pagination || pagination);
      setDisbursementStats(response.stats || {
        total: 0,
        pending: 0,
        approved: 0,
        disbursed: 0,
        totalAmount: 0,
        disbursedAmount: 0,
        avgProcessingTime: 0
      });
    } catch (error) {
      console.error('Failed to load disbursements:', error);
      setError('Failed to load disbursements. Please try again.');
      setDisbursements([]);
    } finally {
      setLoading(false);
    }
  };

  // Use disbursements from API since filtering and sorting is done server-side
  const filteredDisbursements = disbursements;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <FaClock className="text-yellow-500" />;
      case 'approved': return <FaCheckCircle className="text-green-500" />;
      case 'disbursed': return <FaMoneyBillWave className="text-blue-500" />;
      case 'rejected': return <FaTimesCircle className="text-red-500" />;
      case 'on_hold': return <FaExclamationTriangle className="text-orange-500" />;
      default: return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'disbursed': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'on_hold': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleViewDetails = (disbursement: Disbursement) => {
    setSelectedDisbursement(disbursement);
    setShowDetails(true);
  };

  const handleExport = () => {
    const csvContent = [
      'ID,Loan ID,Borrower,Amount,Status,Requested Date,Cargo Type,Route',
      ...filteredDisbursements.map(d => 
        `${d.id},${d.loanId},${d.borrowerName},${d.amount},${d.status},${d.requestedDate},${d.cargoType},"${d.route.origin} to ${d.route.destination}"`
      )
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'disbursements-export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Loan Disbursements</h1>
          <p className="text-gray-600">Manage and track loan disbursements and funding approvals</p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <FaExclamationTriangle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-800">{error}</span>
              <button 
                onClick={loadDisbursements}
                className="ml-auto text-red-600 hover:text-red-800 font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mb-6 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{disbursementStats.total}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaFileInvoiceDollar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <FaArrowUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+12%</span>
              <span className="text-gray-600 ml-1">from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600">{disbursementStats.pending}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FaClock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-gray-600">Average processing: {disbursementStats.avgProcessingTime} days</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${disbursementStats.totalAmount.toLocaleString()}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FaMoneyBillWave className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-gray-600">
                Disbursed: ${disbursementStats.disbursedAmount.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {disbursementStats.total > 0 ? 
                    ((disbursementStats.disbursed / disbursementStats.total) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaChartLine className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-gray-600">{disbursementStats.disbursed} completed</span>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by borrower, loan ID, or disbursement ID..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="disbursed">Disbursed</option>
                <option value="rejected">Rejected</option>
                <option value="on_hold">On Hold</option>
              </select>

              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <FaDownload />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Disbursements Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center gap-1">
                      ID
                      {sortField === 'id' && (
                        sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('borrowerName')}
                  >
                    <div className="flex items-center gap-1">
                      Borrower
                      {sortField === 'borrowerName' && (
                        sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center gap-1">
                      Amount
                      {sortField === 'amount' && (
                        sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('requestedDate')}
                  >
                    <div className="flex items-center gap-1">
                      Requested Date
                      {sortField === 'requestedDate' && (
                        sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDisbursements.map((disbursement) => (
                  <tr key={disbursement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {disbursement.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaUser className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {disbursement.borrowerName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {disbursement.cargoType}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${disbursement.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(disbursement.status)}`}>
                        {getStatusIcon(disbursement.status)}
                        <span className="ml-1 capitalize">{disbursement.status.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(disbursement.priority)}`}>
                        {disbursement.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <FaCalendarAlt className="h-4 w-4 text-gray-400 mr-2" />
                        {disbursement.requestedDate}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(disbursement)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                      >
                        <FaEye />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {!loading && filteredDisbursements.length === 0 && (
            <div className="text-center py-12">
              <FaFileInvoiceDollar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No disbursements found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {error ? 'There was an error loading disbursements.' : 'No disbursements match your current filters.'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPagination({...pagination, page: Math.max(1, pagination.page - 1)})}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination({...pagination, page: Math.min(pagination.totalPages, pagination.page + 1)})}
                  disabled={pagination.page === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span>
                    {' '}to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{pagination.total}</span>
                    {' '}results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPagination({...pagination, page: Math.max(1, pagination.page - 1)})}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPagination({...pagination, page: Math.min(pagination.totalPages, pagination.page + 1)})}
                      disabled={pagination.page === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Disbursement Details Modal */}
      {showDetails && selectedDisbursement && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Disbursement Details - {selectedDisbursement.id}
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimesCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Loan Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Loan ID:</strong> {selectedDisbursement.loanId}</div>
                    <div><strong>Borrower:</strong> {selectedDisbursement.borrowerName}</div>
                    <div><strong>Amount:</strong> ${selectedDisbursement.amount.toLocaleString()}</div>
                    <div><strong>Interest Rate:</strong> {selectedDisbursement.interestRate}%</div>
                    <div><strong>Term:</strong> {selectedDisbursement.termMonths} months</div>
                    <div><strong>Purpose:</strong> {selectedDisbursement.purpose}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Route Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <FaMapMarkerAlt className="h-4 w-4 text-green-500 mr-2" />
                      <strong>Origin:</strong> {selectedDisbursement.route.origin}
                    </div>
                    <div className="flex items-center">
                      <FaMapMarkerAlt className="h-4 w-4 text-red-500 mr-2" />
                      <strong>Destination:</strong> {selectedDisbursement.route.destination}
                    </div>
                    <div><strong>Cargo Type:</strong> {selectedDisbursement.cargoType}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Status & Dates</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <strong>Status:</strong>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedDisbursement.status)}`}>
                        {getStatusIcon(selectedDisbursement.status)}
                        <span className="ml-1 capitalize">{selectedDisbursement.status.replace('_', ' ')}</span>
                      </span>
                    </div>
                    <div><strong>Priority:</strong> 
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedDisbursement.priority)}`}>
                        {selectedDisbursement.priority}
                      </span>
                    </div>
                    <div><strong>Requested:</strong> {selectedDisbursement.requestedDate}</div>
                    {selectedDisbursement.approvedDate && (
                      <div><strong>Approved:</strong> {selectedDisbursement.approvedDate}</div>
                    )}
                    {selectedDisbursement.disbursedDate && (
                      <div><strong>Disbursed:</strong> {selectedDisbursement.disbursedDate}</div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Risk Assessment</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Risk Score:</strong> {selectedDisbursement.riskScore}/10</div>
                    <div><strong>Credit Score:</strong> {selectedDisbursement.creditScore}</div>
                    {selectedDisbursement.collateralValue && (
                      <div><strong>Collateral Value:</strong> ${selectedDisbursement.collateralValue.toLocaleString()}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-2">Documents</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {selectedDisbursement.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{doc.type}</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      doc.status === 'verified' ? 'bg-green-100 text-green-800' :
                      doc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {selectedDisbursement.notes && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded">{selectedDisbursement.notes}</p>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisbursementsPage;
