import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FaCreditCard, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { lendingApi } from '../../services/lending/lendingApi';
import { useAuth } from '../../contexts/AuthContext';

interface CreditLimitDisplayProps {
  className?: string;
}

const CreditLimitDisplay: React.FC<CreditLimitDisplayProps> = ({ className = '' }) => {
  const { user } = useAuth();

  const { data: loans, isLoading } = useQuery({
    queryKey: ['tenant-loans', user?.tenantId],
    queryFn: () => {
      if (!user?.tenantId) throw new Error('No tenant ID');
      return lendingApi.getTenantLoans(user.tenantId);
    },
    enabled: !!user?.tenantId,
  });

  const calculateCreditInfo = () => {
    if (!loans) return null;

    const totalRequested = loans.reduce((sum, loan) => sum + loan.requested_amount, 0);
    const totalApproved = loans
      .filter(loan => loan.status === 'approved' || loan.status === 'disbursed')
      .reduce((sum, loan) => sum + (loan.approved_amount || 0), 0);
    
    // Default credit limit (should come from backend config)
    const creditLimit = 100000; // $100,000
    const availableCredit = creditLimit - totalApproved;
    const utilizationPercentage = (totalApproved / creditLimit) * 100;

    return {
      creditLimit,
      availableCredit,
      totalApproved,
      utilizationPercentage,
      isNearLimit: utilizationPercentage > 80,
      isOverLimit: utilizationPercentage > 100
    };
  };

  const creditInfo = calculateCreditInfo();

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!creditInfo) {
    return null;
  }

  const getStatusColor = () => {
    if (creditInfo.isOverLimit) return 'text-red-600';
    if (creditInfo.isNearLimit) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusIcon = () => {
    if (creditInfo.isOverLimit) return <FaExclamationTriangle className="text-red-500" />;
    if (creditInfo.isNearLimit) return <FaExclamationTriangle className="text-yellow-500" />;
    return <FaCheckCircle className="text-green-500" />;
  };

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <FaCreditCard className="mr-2" />
          Credit Limit
        </h3>
        {getStatusIcon()}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Credit Limit:</span>
          <span className="font-semibold text-gray-800">
            ${creditInfo.creditLimit.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Used Credit:</span>
          <span className="font-semibold text-gray-800">
            ${creditInfo.totalApproved.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Available Credit:</span>
          <span className={`font-semibold ${getStatusColor()}`}>
            ${creditInfo.availableCredit.toLocaleString()}
          </span>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Utilization</span>
            <span>{creditInfo.utilizationPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                creditInfo.isOverLimit
                  ? 'bg-red-500'
                  : creditInfo.isNearLimit
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(creditInfo.utilizationPercentage, 100)}%` }}
            ></div>
          </div>
        </div>

        {creditInfo.isNearLimit && !creditInfo.isOverLimit && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-700 text-xs">
              ⚠️ You're approaching your credit limit. Consider reducing loan amounts.
            </p>
          </div>
        )}

        {creditInfo.isOverLimit && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-xs">
              🚨 You've exceeded your credit limit. New loan requests may be rejected.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditLimitDisplay;
