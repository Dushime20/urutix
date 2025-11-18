import React, { useState } from 'react';
import { FaDollarSign, FaPlus, FaMoneyBillWave } from 'react-icons/fa';
import LoanRequestForm from '../Lending/LoanRequestForm';
import LoanStatus from '../Lending/LoanStatus';

interface CargoLendingIntegrationProps {
  cargoId: string;
  tripId: string;
  totalValue: number;
  currentStatus: string;
  existingLoanId?: string;
}

const CargoLendingIntegration: React.FC<CargoLendingIntegrationProps> = ({
  cargoId,
  tripId,
  totalValue,
  currentStatus,
  existingLoanId
}) => {
  const [showLoanForm, setShowLoanForm] = useState(false);

  // Don't show lending options if cargo is already delivered or trip is completed
  const canRequestLoan = !['delivered', 'completed', 'cancelled'].includes(currentStatus.toLowerCase());

  if (existingLoanId) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <FaMoneyBillWave className="text-blue-600 mr-2" />
            <h4 className="font-semibold text-blue-900">Trip Advance Active</h4>
          </div>
        </div>
        <LoanStatus loanId={existingLoanId} />
      </div>
    );
  }

  if (showLoanForm) {
    return (
      <div className="space-y-4">
        <LoanRequestForm
          cargoId={cargoId}
          tripId={tripId}
          totalTripValue={totalValue}
          onSuccess={() => {
            setShowLoanForm(false);
            // Refresh parent component
            window.location.reload();
          }}
          onCancel={() => setShowLoanForm(false)}
        />
      </div>
    );
  }

  if (!canRequestLoan) {
    return null;
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FaDollarSign className="text-green-600 mr-3 text-xl" />
          <div>
            <h4 className="font-semibold text-green-900">Need Advance Funding?</h4>
            <p className="text-sm text-green-700">
              Get up to 70% advance on your trip value (${Math.round(totalValue * 0.7).toLocaleString()})
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowLoanForm(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <FaPlus className="mr-2" />
          Request Advance
        </button>
      </div>
    </div>
  );
};

export default CargoLendingIntegration;
