import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FaDollarSign, 
  FaClock, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaExclamationTriangle,
  FaTruck,
  FaGasPump,
  FaUser,
  FaCalendarAlt
} from 'react-icons/fa';
import { lendingApi, LoanRequest } from '../../services/lending/lendingApi';

interface LoanStatusProps {
  loanId: string;
}

const LoanStatus: React.FC<LoanStatusProps> = ({ loanId }) => {
  const { data: loan, isLoading, error } = useQuery({
    queryKey: ['loan-request', loanId],
    queryFn: () => lendingApi.getLoanRequest(loanId),
    refetchInterval: 30000, // Refetch every 30 seconds for status updates
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FaClock className="text-yellow-500" />;
      case 'approved':
        return <FaCheckCircle className="text-blue-500" />;
      case 'rejected':
        return <FaTimesCircle className="text-red-500" />;
      case 'disbursed':
        return <FaCheckCircle className="text-green-500" />;
      case 'repaid':
        return <FaCheckCircle className="text-green-600" />;
      case 'failed':
        return <FaExclamationTriangle className="text-red-500" />;
      case 'defaulted':
        return <FaExclamationTriangle className="text-red-600" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'disbursed': return 'bg-green-100 text-green-800 border-green-200';
      case 'repaid': return 'bg-green-100 text-green-900 border-green-300';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'defaulted': return 'bg-red-100 text-red-900 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getBeneficiaryIcon = (type: string) => {
    switch (type) {
      case 'fuel': return <FaGasPump className="text-blue-500" />;
      case 'driver': return <FaUser className="text-green-500" />;
      case 'maintenance': return <FaTruck className="text-orange-500" />;
      default: return <FaDollarSign className="text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !loan) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-red-600">
          <FaExclamationTriangle className="mx-auto h-12 w-12 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Loan</h3>
          <p className="text-sm">Unable to load loan information. Please try again.</p>
        </div>
      </div>
    );
  }

  const totalRepaid = loan.repayments?.reduce((sum, repayment) => sum + repayment.amount, 0) || 0;
  const outstandingAmount = (loan.approved_amount || 0) + (loan.interest_amount || 0) - totalRepaid;

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Loan Request</h2>
            <p className="text-sm text-gray-500">ID: {loan.id.slice(0, 8)}...</p>
          </div>
          <div className={`px-3 py-1 rounded-full border text-sm font-medium flex items-center ${getStatusColor(loan.status)}`}>
            {getStatusIcon(loan.status)}
            <span className="ml-2 capitalize">{loan.status}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Amount Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center text-blue-600 mb-2">
              <FaDollarSign className="mr-2" />
              <span className="font-semibold">Requested</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              ${loan.requested_amount.toLocaleString()}
            </p>
          </div>

          {loan.approved_amount && (
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center text-green-600 mb-2">
                <FaCheckCircle className="mr-2" />
                <span className="font-semibold">Approved</span>
              </div>
              <p className="text-2xl font-bold text-green-900">
                ${loan.approved_amount.toLocaleString()}
              </p>
              {loan.interest_amount && (
                <p className="text-sm text-green-700">
                  + ${loan.interest_amount.toLocaleString()} interest
                </p>
              )}
            </div>
          )}

          {loan.status === 'disbursed' && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center text-purple-600 mb-2">
                <FaClock className="mr-2" />
                <span className="font-semibold">Outstanding</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">
                ${outstandingAmount.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Lender Information */}
        {loan.lender && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Lender Information</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{loan.lender.name}</p>
                <p className="text-sm text-gray-600">{loan.lender.contact_email}</p>
              </div>
              {loan.external_loan_ref && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Reference</p>
                  <p className="font-mono text-sm">{loan.external_loan_ref}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fund Allocation */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Fund Allocation</h3>
          <div className="space-y-2">
            {loan.requested_split.map((beneficiary, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  {getBeneficiaryIcon(beneficiary.type)}
                  <div className="ml-3">
                    <p className="font-medium capitalize">{beneficiary.type}</p>
                    <p className="text-sm text-gray-600">ID: {beneficiary.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${beneficiary.amount.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Timeline</h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="font-medium">Loan Requested</p>
                <p className="text-sm text-gray-600">{formatDate(loan.created_at)}</p>
              </div>
            </div>

            {loan.status !== 'pending' && (
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  loan.status === 'rejected' ? 'bg-red-500' : 'bg-green-500'
                }`}></div>
                <div className="flex-1">
                  <p className="font-medium">
                    {loan.status === 'rejected' ? 'Loan Rejected' : 'Loan Approved'}
                  </p>
                  <p className="text-sm text-gray-600">{formatDate(loan.updated_at)}</p>
                  {loan.rejection_reason && (
                    <p className="text-sm text-red-600 mt-1">{loan.rejection_reason}</p>
                  )}
                </div>
              </div>
            )}

            {loan.disbursements?.map((disbursement, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  disbursement.status === 'success' ? 'bg-green-500' : 
                  disbursement.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
                <div className="flex-1">
                  <p className="font-medium">
                    Disbursement {disbursement.status === 'success' ? 'Completed' : 
                    disbursement.status === 'failed' ? 'Failed' : 'In Progress'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {disbursement.disbursement_date ? 
                      formatDate(disbursement.disbursement_date) : 
                      formatDate(disbursement.created_at)
                    }
                  </p>
                  {disbursement.failure_reason && (
                    <p className="text-sm text-red-600 mt-1">{disbursement.failure_reason}</p>
                  )}
                </div>
              </div>
            ))}

            {loan.repayments?.map((repayment, index) => (
              <div key={index} className="flex items-center">
                <div className="w-3 h-3 bg-green-600 rounded-full mr-3"></div>
                <div className="flex-1">
                  <p className="font-medium">Repayment Made</p>
                  <p className="text-sm text-gray-600">{formatDate(repayment.repayment_date)}</p>
                  <p className="text-sm text-green-600">
                    ${repayment.amount.toLocaleString()} 
                    (Principal: ${repayment.principal_paid.toLocaleString()}, 
                    Interest: ${repayment.interest_paid.toLocaleString()})
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Due Date */}
        {loan.due_date && (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center text-yellow-700">
              <FaCalendarAlt className="mr-2" />
              <span className="font-semibold">Due Date</span>
            </div>
            <p className="text-lg font-semibold text-yellow-900 mt-1">
              {new Date(loan.due_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanStatus;
