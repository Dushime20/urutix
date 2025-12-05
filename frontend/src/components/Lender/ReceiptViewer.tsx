import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FaReceipt, 
  FaDownload, 
  FaPrint, 
  FaCheckCircle,
  FaCalendarAlt,
  FaDollarSign,
  FaBox,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaTimesCircle
} from 'react-icons/fa';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Receipt {
  id: string;
  receiptNumber: string;
  lenderId: string;
  paymentId: string;
  tripId: string;
  cargoOwnerId: string;
  cargoOwnerName: string;
  cargoOwnerEmail?: string;
  cargoOwnerPhone?: string;
  cargoName: string;
  amount: number;
  currency: string;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  paymentMethod?: string;
  transactionId?: string;
  referenceNumber?: string;
  paymentDate: string;
  notes?: string;
  metadata?: {
    tripNumber?: string;
    cargoId?: string;
    paymentType?: string;
  };
}

const ReceiptViewer: React.FC = () => {
  const { user } = useAuth();
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  const { data: receipts, isLoading, refetch } = useQuery({
    queryKey: ['lender-receipts', user?.id],
    queryFn: async () => {
      // TODO: Update endpoint when backend is ready
      const response = await api.get('/payments/receipts', {
        params: {
          lenderId: user?.id,
        },
      });
      return response.data.data?.receipts || response.data || [];
    },
    enabled: !!user?.id,
  });

  const handleDownload = async (receipt: Receipt) => {
    try {
      toast.success('Downloading receipt...');
      // TODO: Implement PDF download
      console.log('Download receipt:', receipt);
    } catch (error) {
      toast.error('Failed to download receipt');
    }
  };

  const handlePrint = (receipt: Receipt) => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      issued: { color: 'bg-blue-100 text-blue-800', icon: FaCheckCircle },
      paid: { color: 'bg-green-100 text-green-800', icon: FaCheckCircle },
      draft: { color: 'bg-gray-100 text-gray-800', icon: FaCheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: FaTimesCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.issued;
    const Icon = config.icon;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 ${config.color}`}>
        <Icon className="w-3 h-3" />
        {status.toUpperCase()}
      </span>
    );
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <FaReceipt className="w-8 h-8 text-primary-600" />
              Payment Receipts
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              View and manage your payment receipts
            </p>
          </div>
        </div>
      </div>

      {/* Receipts List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
        {!receipts || receipts.length === 0 ? (
          <div className="p-12 text-center">
            <FaReceipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Receipts Found</h3>
            <p className="text-sm text-gray-600">
              You don't have any receipts yet. Receipts will appear here after you make payments for cargo transportation.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {receipts.map((receipt: Receipt) => (
              <div
                key={receipt.id}
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedReceipt(receipt)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {receipt.receiptNumber}
                      </h3>
                      {getStatusBadge(receipt.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <FaBox className="w-4 h-4" />
                        <span className="font-medium">{receipt.cargoName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <FaDollarSign className="w-4 h-4" />
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(receipt.amount, receipt.currency)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <FaUser className="w-4 h-4" />
                        <span>{receipt.cargoOwnerName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <FaCalendarAlt className="w-4 h-4" />
                        <span>{formatDate(receipt.paymentDate)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(receipt);
                      }}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Download"
                    >
                      <FaDownload className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrint(receipt);
                      }}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Print"
                    >
                      <FaPrint className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Receipt Detail Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">
                  Receipt {selectedReceipt.receiptNumber}
                </h3>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimesCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Receipt Details */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Payment To</h4>
                  <div className="space-y-1">
                    <p className="text-gray-900 font-medium">{selectedReceipt.cargoOwnerName}</p>
                    {selectedReceipt.cargoOwnerEmail && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <FaEnvelope className="w-3 h-3" />
                        {selectedReceipt.cargoOwnerEmail}
                      </p>
                    )}
                    {selectedReceipt.cargoOwnerPhone && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <FaPhone className="w-3 h-3" />
                        {selectedReceipt.cargoOwnerPhone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="mb-2">{getStatusBadge(selectedReceipt.status)}</div>
                  <div className="text-sm text-gray-600">
                    <p>Payment Date: {formatDate(selectedReceipt.paymentDate)}</p>
                    {selectedReceipt.metadata?.tripNumber && (
                      <p>Trip: {selectedReceipt.metadata.tripNumber}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Cargo Information */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Cargo Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Cargo Name</p>
                    <p className="text-gray-900 font-medium flex items-center gap-2">
                      <FaBox className="w-4 h-4" />
                      {selectedReceipt.cargoName}
                    </p>
                  </div>
                  {selectedReceipt.metadata?.tripNumber && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Trip Number</p>
                      <p className="text-gray-900 font-medium flex items-center gap-2">
                        <FaTruck className="w-4 h-4" />
                        {selectedReceipt.metadata.tripNumber}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Details */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-4">Payment Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="text-xl font-bold text-gray-900">
                      {formatCurrency(selectedReceipt.amount, selectedReceipt.currency)}
                    </span>
                  </div>
                  {selectedReceipt.paymentMethod && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="text-gray-900 font-medium">{selectedReceipt.paymentMethod}</span>
                    </div>
                  )}
                  {selectedReceipt.transactionId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction ID:</span>
                      <span className="text-gray-900 font-mono text-sm">{selectedReceipt.transactionId}</span>
                    </div>
                  )}
                  {selectedReceipt.referenceNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reference Number:</span>
                      <span className="text-gray-900 font-mono text-sm">{selectedReceipt.referenceNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedReceipt.notes && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Notes</h4>
                  <p className="text-gray-700">{selectedReceipt.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleDownload(selectedReceipt)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                >
                  <FaDownload className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => handlePrint(selectedReceipt)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                >
                  <FaPrint className="w-4 h-4" />
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptViewer;

