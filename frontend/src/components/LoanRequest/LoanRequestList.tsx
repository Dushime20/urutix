import React, { useState, useEffect } from 'react';
import { 
  FaMoneyBillWave, 
  FaEye, 
  FaSpinner, 
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaTimes,
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaTruck,
  FaBox
} from 'react-icons/fa';
import { loanRequestService } from '../../services/loanRequestService';
import type { LoanRequest } from '../../types/loanRequest';
import { useAuth } from '../../contexts/AuthContext';

interface LoanRequestListProps {
  cargoId?: string; // Optional: filter by specific cargo
}

const LoanRequestList: React.FC<LoanRequestListProps> = ({ cargoId }) => {
  const { user } = useAuth();
  const [loans, setLoans] = useState<LoanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<LoanRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLoanRequests();
  }, [user?.tenantId, statusFilter]);

  const loadLoanRequests = async () => {
    if (!user?.tenantId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await loanRequestService.getTenantLoans(user.tenantId, statusFilter || undefined);
      
      // Filter by cargo if specified
      const filteredData = cargoId ? data.filter(loan => loan.cargo_id === cargoId) : data;
      setLoans(filteredData);
    } catch (err: any) {
      console.error('Error loading loan requests:', err);
      setError(err.response?.data?.message || 'Failed to load loan requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FaClock className="text-warning-600" />;
      case 'approved':
        return <FaCheckCircle className="text-success-600" />;
      case 'disbursed':
        return <FaMoneyBillWave className="text-secondary-600" />;
      case 'rejected':
        return <FaTimes className="text-error-600" />;
      case 'repaid':
        return <FaCheckCircle className="text-primary-600" />;
      case 'defaulted':
        return <FaExclamationTriangle className="text-error-600" />;
      default:
        return <FaClock className="text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning-100 text-warning-800';
      case 'approved':
        return 'bg-success-100 text-success-800';
      case 'disbursed':
        return 'bg-secondary-100 text-secondary-800';
      case 'rejected':
        return 'bg-error-100 text-error-800';
      case 'repaid':
        return 'bg-primary-100 text-primary-800';
      case 'defaulted':
        return 'bg-error-100 text-error-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLoans = loans.filter(loan => {
    const matchesSearch = searchTerm === '' || 
      loan.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.cargo_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <FaSpinner className="animate-spin text-primary-600 text-xl" />
          <span className="text-gray-600">Loading loan requests...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-50 border border-error-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <FaExclamationTriangle className="text-error-600 text-xl" />
          <div>
            <h3 className="font-semibold text-error-800">Error Loading Loan Requests</h3>
            <p className="text-error-700">{error}</p>
          </div>
        </div>
        <button
          onClick={loadLoanRequests}
          className="mt-4 bg-error-600 text-white px-4 py-2 rounded-lg hover:bg-error-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {cargoId ? 'Cargo Loan Requests' : 'All Loan Requests'}
          </h2>
          <p className="text-gray-600">Manage your trip advance requests</p>
        </div>
        <button
          onClick={loadLoanRequests}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
        >
          <FaSpinner className="text-sm" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by loan ID or cargo ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
            <div className="relative">
              <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="disbursed">Disbursed</option>
                <option value="rejected">Rejected</option>
                <option value="repaid">Repaid</option>
                <option value="defaulted">Defaulted</option>
              </select>
            </div>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              <span className="font-semibold">{filteredLoans.length}</span> loan request(s) found
            </div>
          </div>
        </div>
      </div>

      {/* Loan Requests List */}
      {filteredLoans.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <FaMoneyBillWave className="mx-auto text-4xl text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Loan Requests Found</h3>
          <p className="text-gray-500">
            {cargoId 
              ? 'No loan requests have been created for this cargo yet.'
              : 'You haven\'t created any loan requests yet. Confirm cargo loading to automatically create a loan request.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLoans.map((loan) => (
            <div key={loan.id} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                      <FaMoneyBillWave className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Loan Request</h3>
                      <p className="text-sm text-gray-600 font-mono">{loan.id}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(loan.status)}
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(loan.status)}`}>
                        {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Requested Amount</label>
                      <p className="text-xl font-bold text-primary-600">
                        RWF {loan.requested_amount.toLocaleString()}
                      </p>
                    </div>
                    
                    {loan.approved_amount && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Approved Amount</label>
                        <p className="text-xl font-bold text-success-600">
                          RWF {loan.approved_amount.toLocaleString()}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Created</label>
                      <div className="flex items-center space-x-2">
                        <FaCalendarAlt className="text-gray-400 text-sm" />
                        <p className="text-gray-800">{new Date(loan.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <FaBox className="text-gray-400" />
                      <span className="text-sm text-gray-600">Cargo: {loan.cargo_id}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaTruck className="text-gray-400" />
                      <span className="text-sm text-gray-600">Trip: {loan.trip_id}</span>
                    </div>
                  </div>

                  {loan.rejection_reason && (
                    <div className="mt-4 p-3 bg-error-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FaExclamationTriangle className="text-error-600" />
                        <span className="font-semibold text-error-800">Rejection Reason</span>
                      </div>
                      <p className="text-error-700 mt-1">{loan.rejection_reason}</p>
                    </div>
                  )}

                  {loan.interest_amount && (
                    <div className="mt-4 p-3 bg-secondary-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-secondary-800">Interest Amount</span>
                        <span className="text-secondary-700">RWF {loan.interest_amount.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  <button
                    onClick={() => setSelectedLoan(loan)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <FaEye />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loan Details Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Loan Request Details</h2>
                <button
                  onClick={() => setSelectedLoan(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Loan ID</label>
                    <p className="text-gray-800 font-mono">{selectedLoan.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedLoan.status)}
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedLoan.status)}`}>
                        {selectedLoan.status.charAt(0).toUpperCase() + selectedLoan.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Cargo ID</label>
                    <p className="text-gray-800 font-mono">{selectedLoan.cargo_id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Trip ID</label>
                    <p className="text-gray-800 font-mono">{selectedLoan.trip_id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Requested Amount</label>
                    <p className="text-xl font-bold text-primary-600">
                      RWF {selectedLoan.requested_amount.toLocaleString()}
                    </p>
                  </div>
                  {selectedLoan.approved_amount && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Approved Amount</label>
                      <p className="text-xl font-bold text-success-600">
                        RWF {selectedLoan.approved_amount.toLocaleString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created At</label>
                    <p className="text-gray-800">{new Date(selectedLoan.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Updated At</label>
                    <p className="text-gray-800">{new Date(selectedLoan.updated_at).toLocaleString()}</p>
                  </div>
                </div>

                {selectedLoan.external_loan_ref && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">External Reference</label>
                    <p className="text-gray-800 font-mono">{selectedLoan.external_loan_ref}</p>
                  </div>
                )}

                {selectedLoan.due_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Due Date</label>
                    <p className="text-gray-800">{new Date(selectedLoan.due_date).toLocaleDateString()}</p>
                  </div>
                )}

                {selectedLoan.interest_amount && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Interest Amount</label>
                    <p className="text-lg font-bold text-secondary-600">
                      RWF {selectedLoan.interest_amount.toLocaleString()}
                    </p>
                  </div>
                )}

                {selectedLoan.metadata && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Additional Information</label>
                    <div className="bg-gray-50 rounded-lg p-4 mt-2">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(selectedLoan.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setSelectedLoan(null)}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanRequestList;
