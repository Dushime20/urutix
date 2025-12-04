import React, { useState } from 'react';
import { FaTimes, FaDollarSign, FaInfoCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface AdvancePaymentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  tripNumber: string;
  maxAmount: number;
  currency: string;
  onSuccess?: () => void;
}

const AdvancePaymentRequestModal: React.FC<AdvancePaymentRequestModalProps> = ({
  isOpen,
  onClose,
  tripId,
  tripNumber,
  maxAmount,
  currency,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    requestedAmount: '',
    reason: '',
    urgency: 'medium' as 'low' | 'medium' | 'high',
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.requestedAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (amount > maxAmount) {
      toast.error(`Amount cannot exceed ${maxAmount} ${currency}`);
      return;
    }

    if (!formData.reason.trim()) {
      toast.error('Please provide a reason for the advance payment');
      return;
    }

    setLoading(true);
    try {
      const { paymentsAPI } = await import('../../services/api');
      await paymentsAPI.requestAdvance({
        tripId,
        amount,
        reason: formData.reason,
        urgency: formData.urgency,
      });

      toast.success('Advance payment request submitted successfully');
      onSuccess?.();
      onClose();
      setFormData({ requestedAmount: '', reason: '', urgency: 'medium' });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to submit advance payment request');
      console.error('Advance payment request error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-md shadow-lg max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Request Advance Payment</h3>
            <p className="text-xs text-gray-500 mt-0.5">Trip: {tripNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Requested Amount *
            </label>
            <div className="relative">
              <FaDollarSign className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <input
                type="number"
                step="0.01"
                min="0"
                max={maxAmount}
                value={formData.requestedAmount}
                onChange={(e) => setFormData({ ...formData, requestedAmount: e.target.value })}
                className="w-full pl-8 pr-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                placeholder="0.00"
                required
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">
              Maximum available: {formatCurrency(maxAmount)}
            </p>
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Urgency Level
            </label>
            <select
              value={formData.urgency}
              onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            >
              <option value="low">Low - Standard processing</option>
              <option value="medium">Medium - Priority processing</option>
              <option value="high">High - Urgent processing</option>
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Reason for Advance Payment *
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              placeholder="e.g., Need funds for fuel and driver wages before trip start..."
              required
            />
          </div>

          {/* Info Box */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <div className="flex items-start space-x-2">
              <FaInfoCircle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-600">
                <p className="font-medium mb-1">Advance Payment Information:</p>
                <ul className="list-disc list-inside space-y-0.5 text-gray-500">
                  <li>Advance payments are typically processed within 1-3 business days</li>
                  <li>High urgency requests may be processed faster</li>
                  <li>The remaining amount will be paid upon trip completion</li>
                  <li>All advance payments are subject to approval</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium text-white bg-gray-700 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdvancePaymentRequestModal;

