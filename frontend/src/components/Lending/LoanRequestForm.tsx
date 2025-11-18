import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FaDollarSign, FaTruck, FaGasPump, FaUser, FaPlus, FaTrash, FaCheck } from 'react-icons/fa';
import { lendingApi, CreateLoanRequestDto, Beneficiary } from '../../services/lending/lendingApi';
import { useAuth } from '../../contexts/AuthContext';

interface LoanRequestFormProps {
  cargoId: string;
  tripId: string;
  totalTripValue: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const LoanRequestForm: React.FC<LoanRequestFormProps> = ({
  cargoId,
  tripId,
  totalTripValue,
  onSuccess,
  onCancel
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    requested_amount: Math.round(totalTripValue * 0.7), // Default 70% advance
    due_date: '',
    beneficiaries: [
      { type: 'fuel', id: '', amount: 0 },
      { type: 'driver', id: '', amount: 0 }
    ] as Beneficiary[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createLoanMutation = useMutation({
    mutationFn: (data: CreateLoanRequestDto) => lendingApi.createLoanRequest(data),
    onMutate: async (newLoan) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tenant-loans'] });
      
      // Snapshot previous value
      const previousLoans = queryClient.getQueryData(['tenant-loans']);
      
      // Optimistically update
      queryClient.setQueryData(['tenant-loans'], (old: any[]) => [
        ...(old || []),
        { 
          ...newLoan, 
          id: 'temp-id', 
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
      
      return { previousLoans };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-loans'] });
      onSuccess?.();
      setIsSubmitting(false);
    },
    onError: (error: any, newLoan, context) => {
      console.error('Failed to create loan request:', error);
      
      // Rollback on error
      if (context?.previousLoans) {
        queryClient.setQueryData(['tenant-loans'], context.previousLoans);
      }
      
      // Handle specific error types
      if (error.response?.data?.error?.code) {
        const errorCode = error.response.data.error.code;
        switch (errorCode) {
          case 'INSUFFICIENT_CREDIT':
            setErrors({ general: 'Insufficient credit available for this amount' });
            break;
          case 'LOAN_LIMIT_EXCEEDED':
            setErrors({ general: 'Loan amount exceeds maximum limit' });
            break;
          case 'DUPLICATE_LOAN_REQUEST':
            setErrors({ general: 'This loan request already exists' });
            break;
          default:
            setErrors({ general: error.response.data.error.message || 'Failed to create loan request' });
        }
      } else {
        setErrors({ general: 'An unexpected error occurred' });
      }
      
      setIsSubmitting(false);
    }
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Clear previous errors
    setErrors({});

    if (formData.requested_amount <= 0) {
      newErrors.requested_amount = 'Amount must be greater than 0';
    }

    if (formData.requested_amount > totalTripValue) {
      newErrors.requested_amount = 'Amount cannot exceed trip value';
    }

    // Validate minimum amount (e.g., $100)
    if (formData.requested_amount < 100) {
      newErrors.requested_amount = 'Minimum loan amount is $100';
    }

    const totalBeneficiaryAmount = formData.beneficiaries.reduce((sum, b) => sum + b.amount, 0);
    if (Math.abs(totalBeneficiaryAmount - formData.requested_amount) > 0.01) {
      newErrors.beneficiaries = 'Total beneficiary amounts must equal requested amount';
    }

    formData.beneficiaries.forEach((beneficiary, index) => {
      if (!beneficiary.id.trim()) {
        newErrors[`beneficiary_${index}_id`] = 'Beneficiary ID is required';
      }
      if (beneficiary.amount <= 0) {
        newErrors[`beneficiary_${index}_amount`] = 'Amount must be greater than 0';
      }
      if (beneficiary.amount > formData.requested_amount) {
        newErrors[`beneficiary_${index}_amount`] = 'Individual amount cannot exceed total requested amount';
      }
    });

    // Validate due date if provided
    if (formData.due_date) {
      const dueDate = new Date(formData.due_date);
      const today = new Date();
      if (dueDate <= today) {
        newErrors.due_date = 'Due date must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    if (!user?.tenantId) {
      setErrors({ general: 'User tenant information not available' });
      return;
    }

    setIsSubmitting(true);

    const loanRequest: CreateLoanRequestDto = {
      tenant_id: user.tenantId,
      cargo_id: cargoId,
      trip_id: tripId,
      requested_amount: formData.requested_amount,
      requested_split: formData.beneficiaries,
      due_date: formData.due_date || undefined,
      metadata: {
        total_trip_value: totalTripValue,
        advance_percentage: (formData.requested_amount / totalTripValue) * 100
      }
    };

    createLoanMutation.mutate(loanRequest);
  };

  const addBeneficiary = () => {
    setFormData(prev => ({
      ...prev,
      beneficiaries: [...prev.beneficiaries, { type: 'other', id: '', amount: 0 }]
    }));
  };

  const removeBeneficiary = (index: number) => {
    setFormData(prev => ({
      ...prev,
      beneficiaries: prev.beneficiaries.filter((_, i) => i !== index)
    }));
  };

  const updateBeneficiary = (index: number, field: keyof Beneficiary, value: any) => {
    setFormData(prev => ({
      ...prev,
      beneficiaries: prev.beneficiaries.map((b, i) => 
        i === index ? { ...b, [field]: value } : b
      )
    }));
  };

  const getBeneficiaryIcon = (type: string) => {
    switch (type) {
      case 'fuel': return <FaGasPump className="text-blue-500" />;
      case 'driver': return <FaUser className="text-green-500" />;
      case 'maintenance': return <FaTruck className="text-orange-500" />;
      default: return <FaDollarSign className="text-gray-500" />;
    }
  };

  const totalBeneficiaryAmount = formData.beneficiaries.reduce((sum, b) => sum + b.amount, 0);
  const advancePercentage = (formData.requested_amount / totalTripValue) * 100;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Request Trip Advance</h2>
        <div className="text-sm text-gray-500">
          Trip Value: ${totalTripValue.toLocaleString()}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Loan Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Advance Amount
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaDollarSign className="text-gray-400" />
            </div>
            <input
              type="number"
              value={formData.requested_amount}
              onChange={(e) => setFormData(prev => ({ ...prev, requested_amount: Number(e.target.value) }))}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter amount"
              min="1"
              max={totalTripValue}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Advance: {advancePercentage.toFixed(1)}% of trip value</span>
            <span>Max: ${totalTripValue.toLocaleString()}</span>
          </div>
          {errors.requested_amount && (
            <p className="text-red-500 text-xs mt-1">{errors.requested_amount}</p>
          )}
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expected Repayment Date (Optional)
          </label>
          <input
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Beneficiaries */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Fund Allocation
            </label>
            <button
              type="button"
              onClick={addBeneficiary}
              className="flex items-center text-sm text-blue-600 hover:text-blue-700"
            >
              <FaPlus className="mr-1" />
              Add Beneficiary
            </button>
          </div>

          <div className="space-y-3">
            {formData.beneficiaries.map((beneficiary, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  {getBeneficiaryIcon(beneficiary.type)}
                </div>
                
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <select
                    value={beneficiary.type}
                    onChange={(e) => updateBeneficiary(index, 'type', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="fuel">Fuel Supplier</option>
                    <option value="driver">Driver</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="other">Other</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Beneficiary ID"
                    value={beneficiary.id}
                    onChange={(e) => updateBeneficiary(index, 'id', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaDollarSign className="text-gray-400 text-sm" />
                    </div>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={beneficiary.amount || ''}
                      onChange={(e) => updateBeneficiary(index, 'amount', Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                </div>

                {formData.beneficiaries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBeneficiary(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Total Check */}
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Allocated:</span>
              <span className={`font-semibold ${
                totalBeneficiaryAmount === formData.requested_amount 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                ${totalBeneficiaryAmount.toLocaleString()}
              </span>
            </div>
            {totalBeneficiaryAmount === formData.requested_amount && (
              <div className="flex items-center text-green-600 text-sm mt-1">
                <FaCheck className="mr-1" />
                Allocation matches requested amount
              </div>
            )}
          </div>

          {errors.beneficiaries && (
            <p className="text-red-500 text-xs mt-1">{errors.beneficiaries}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            disabled={createLoanMutation.isPending}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createLoanMutation.isPending ? 'Processing...' : 'Request Advance'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Enhanced Error Display */}
      {Object.keys(errors).length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          {errors.general && (
            <p className="text-red-600 text-sm font-medium mb-2">{errors.general}</p>
          )}
          {Object.entries(errors).map(([field, message]) => {
            if (field === 'general') return null;
            return (
              <p key={field} className="text-red-600 text-xs">
                {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: {message}
              </p>
            );
          })}
        </div>
      )}

      {createLoanMutation.isError && !Object.keys(errors).length && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">
            Failed to create loan request. Please try again.
          </p>
        </div>
      )}

      {createLoanMutation.isSuccess && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-600 text-sm">
            Loan request submitted successfully! You will be notified once it's processed.
          </p>
        </div>
      )}
    </div>
  );
};

export default LoanRequestForm;
