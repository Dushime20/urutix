import React, { useState, useEffect } from 'react';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { X, FileText, CheckCircle, AlertCircle, User, DollarSign, Calendar } from 'lucide-react';
import { brokerAPI } from '../../services/brokerApi';
import toast from 'react-hot-toast';

interface LoadContract {
  id: string;
  loadId: string;
  cargoOwnerId: string;
  brokerId: string;
  contractType: string;
  status: string;
  agreedRate: number;
  currencyCode: string;
  commissionRate: number;
  commissionAmount: number;
  paymentTerms?: string;
  pickupDate?: string;
  deliveryDate?: string;
  contractContent: string;
  createdAt: string;
  load?: {
    id: string;
    title: string;
    loadValue: number;
  };
  cargoOwner?: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      companyName?: string;
    };
  };
}

interface ContractAcceptanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  onContractAccepted?: (contractId: string) => void;
}

const ContractAcceptanceModal: React.FC<ContractAcceptanceModalProps> = ({
  isOpen,
  onClose,
  contractId,
  onContractAccepted,
}) => {
  const [contract, setContract] = useState<LoadContract | null>(null);
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const { formatIn: fmtIn } = useCurrencyFormat();

  useEffect(() => {
    if (isOpen && contractId) {
      fetchContract();
    }
  }, [isOpen, contractId]);

  const fetchContract = async () => {
    setLoading(true);
    try {
      const response = await brokerAPI.getContract(contractId);
      setContract(response.data || response);
    } catch (error: any) {
      console.error('Failed to fetch contract:', error);
      toast.error(error.response?.data?.message || 'Failed to load contract');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!contract) return;

    setAccepting(true);
    try {
      await brokerAPI.acceptContract(contractId);
      toast.success('Contract accepted successfully!');
      if (onContractAccepted) {
        onContractAccepted(contractId);
      }
      onClose();
    } catch (error: any) {
      console.error('Failed to accept contract:', error);
      toast.error(error.response?.data?.message || 'Failed to accept contract');
    } finally {
      setAccepting(false);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Contract not found</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const cargoOwnerName = contract.cargoOwner?.profile?.companyName ||
    (contract.cargoOwner?.profile?.firstName && contract.cargoOwner?.profile?.lastName
      ? `${contract.cargoOwner?.profile?.firstName} ${contract.cargoOwner?.profile?.lastName}`
      : contract.cargoOwner?.email || 'Cargo Owner');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
      <div 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Broker Agreement Contract</h2>
            <p className="text-sm text-gray-500 mt-1">
              Review and accept the contract to begin managing this load
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Alert */}
          {contract.status === 'PENDING_BROKER_ACCEPTANCE' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-800 font-medium">
                  This contract is pending your acceptance. Once accepted, you will have full control over this load.
                </span>
              </div>
            </div>
          )}

          {/* Contract Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Cargo Owner
              </h3>
              <p className="text-sm text-gray-700">{cargoOwnerName}</p>
              {contract.cargoOwner?.email && (
                <p className="text-xs text-gray-500 mt-1">{contract.cargoOwner?.email}</p>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Load Information
              </h3>
              <p className="text-sm text-gray-700">{contract.load?.title || 'N/A'}</p>
              {contract.load?.loadValue && (
                <p className="text-xs text-gray-500 mt-1">
                  Load Value: {fmtIn(contract.load.loadValue, contract.currencyCode || 'USD')}
                </p>
              )}
            </div>
          </div>

          {/* Financial Terms */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Financial Terms
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Agreed Rate:</span>
                <span className="font-medium text-gray-900 ml-2">
                  {fmtIn(contract.agreedRate, contract.currencyCode || 'USD')}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Commission Rate:</span>
                <span className="font-medium text-gray-900 ml-2">{contract.commissionRate}%</span>
              </div>
              <div>
                <span className="text-gray-600">Commission Amount:</span>
                <span className="font-medium text-gray-900 ml-2">
                  {fmtIn(contract.commissionAmount, contract.currencyCode || 'USD')}
                </span>
              </div>
              {contract.paymentTerms && (
                <div>
                  <span className="text-gray-600">Payment Terms:</span>
                  <span className="font-medium text-gray-900 ml-2">{contract.paymentTerms}</span>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          {(contract.pickupDate || contract.deliveryDate) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {contract.pickupDate && (
                  <div>
                    <span className="text-gray-600">Pickup Date:</span>
                    <span className="font-medium text-gray-900 ml-2">
                      {new Date(contract.pickupDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {contract.deliveryDate && (
                  <div>
                    <span className="text-gray-600">Delivery Date:</span>
                    <span className="font-medium text-gray-900 ml-2">
                      {new Date(contract.deliveryDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contract Content */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Contract Terms</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                {contract.contractContent}
              </pre>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Important Notes:</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>By accepting this contract, you agree to manage this load on behalf of the cargo owner</li>
              <li>You will have exclusive control over creating auctions, handling bids, and matching transporters</li>
              <li>The cargo owner will no longer be able to perform these actions for this load</li>
              <li>Your commission will be calculated based on the agreed rate and commission percentage</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        {contract.status === 'PENDING_BROKER_ACCEPTANCE' && (
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={accepting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {accepting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Accepting...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Accept Contract</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractAcceptanceModal;

