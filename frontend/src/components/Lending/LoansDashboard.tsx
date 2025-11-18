import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FaDollarSign, 
  FaChartLine, 
  FaExclamationTriangle, 
  FaClock,
  FaFilter,
  FaDownload,
  FaEye
} from 'react-icons/fa';
import { lendingApi, LoanRequest } from '../../services/lending/lendingApi';
import { useAuth } from '../../contexts/AuthContext';
import LoanStatus from './LoanStatus';
import CreditLimitDisplay from './CreditLimitDisplay';

interface LoansDashboardProps {
  className?: string;
}

const LoansDashboard: React.FC<LoansDashboardProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

  const { data: loans, isLoading, error } = useQuery({
    queryKey: ['tenant-loans', user?.tenantId, selectedStatus],
    queryFn: () => {
      if (!user?.tenantId) throw new Error('No tenant ID');
      return lendingApi.getTenantLoans(
        user.tenantId, 
        selectedStatus === 'all' ? undefined : selectedStatus
      );
    },
    enabled: !!user?.tenantId,
    refetchInterval: 60000, // Refetch every minute
  });

  const getStatusStats = () => {
    if (!loans) return {};
    
    const stats = loans.reduce((acc, loan) => {
      acc[loan.status] = (acc[loan.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: loans.length,
      pending: stats.pending || 0,
      approved: stats.approved || 0,
      disbursed: stats.disbursed || 0,
      repaid: stats.repaid || 0,
      rejected: stats.rejected || 0,
      failed: stats.failed || 0,
    };
  };

  const getFinancialStats = () => {
    if (!loans) return {};

    const totalRequested = loans.reduce((sum, loan) => sum + loan.requested_amount, 0);
    const totalApproved = loans
      .filter(loan => loan.approved_amount)
      .reduce((sum, loan) => sum + (loan.approved_amount || 0), 0);
    const totalDisbursed = loans
      .filter(loan => loan.status === 'disbursed' || loan.status === 'repaid')
      .reduce((sum, loan) => sum + (loan.approved_amount || 0), 0);
    const totalRepaid = loans
      .filter(loan => loan.status === 'repaid')
      .reduce((sum, loan) => sum + (loan.approved_amount || 0) + (loan.interest_amount || 0), 0);

    return {
      totalRequested,
      totalApproved,
      totalDisbursed,
      totalRepaid,
      outstandingAmount: totalDisbursed - totalRepaid,
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'disbursed': return 'bg-green-100 text-green-800';
      case 'repaid': return 'bg-green-100 text-green-900';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const stats = getStatusStats();
  const financialStats = getFinancialStats();

  if (selectedLoanId) {
    return (
      <div className={className}>
        <div className="mb-4">
          <button
            onClick={() => setSelectedLoanId(null)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Loans Dashboard
          </button>
        </div>
        <LoanStatus loanId={selectedLoanId} />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Loans Dashboard</h1>
        <div className="flex items-center space-x-3">
          <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            <FaDownload className="mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Credit Limit Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <CreditLimitDisplay />
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaDollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Requested</p>
              <p className="text-2xl font-bold text-gray-900">
                ${financialStats.totalRequested?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FaChartLine className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Disbursed</p>
              <p className="text-2xl font-bold text-gray-900">
                ${financialStats.totalDisbursed?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FaClock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Outstanding</p>
              <p className="text-2xl font-bold text-gray-900">
                ${financialStats.outstandingAmount?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FaExclamationTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Loans</p>
              <p className="text-2xl font-bold text-gray-900">
                {(stats.approved || 0) + (stats.disbursed || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <FaFilter className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filter by status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Loans ({stats.total || 0})</option>
              <option value="pending">Pending ({stats.pending || 0})</option>
              <option value="approved">Approved ({stats.approved || 0})</option>
              <option value="disbursed">Disbursed ({stats.disbursed || 0})</option>
              <option value="repaid">Repaid ({stats.repaid || 0})</option>
              <option value="rejected">Rejected ({stats.rejected || 0})</option>
              <option value="failed">Failed ({stats.failed || 0})</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
              {stats.pending || 0} Pending
            </span>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
              {stats.disbursed || 0} Active
            </span>
          </div>
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Loan Requests</h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading loans...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            <FaExclamationTriangle className="mx-auto h-8 w-8 mb-2" />
            <p>Failed to load loans. Please try again.</p>
          </div>
        ) : !loans || loans.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FaDollarSign className="mx-auto h-12 w-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No loans found</p>
            <p className="text-sm">You haven't requested any advances yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loan ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">
                        {loan.id.slice(0, 8)}...
                      </div>
                      {loan.external_loan_ref && (
                        <div className="text-xs text-gray-500">
                          Ref: {loan.external_loan_ref}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        ${loan.requested_amount.toLocaleString()}
                      </div>
                      {loan.approved_amount && loan.approved_amount !== loan.requested_amount && (
                        <div className="text-xs text-green-600">
                          Approved: ${loan.approved_amount.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(loan.status)}`}>
                        {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {loan.lender?.name || 'Pending Assignment'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(loan.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {loan.due_date ? formatDate(loan.due_date) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedLoanId(loan.id)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        <FaEye className="mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoansDashboard;
