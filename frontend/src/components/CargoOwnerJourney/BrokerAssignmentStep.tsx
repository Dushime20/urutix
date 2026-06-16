import React, { useState, useEffect } from 'react';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

import { createPortal } from 'react-dom';

import { X, User, DollarSign, Building2, Mail, CheckCircle, AlertCircle } from 'lucide-react';

import { brokerAPI } from '@/services/brokerApi';

import toast from 'react-hot-toast';


interface Broker {
  id: string;
  email: string;
  defaultCommissionRate?: number;
  totalCommissionEarned?: number;
  profile?: {
    firstName?: string;
    lastName?: string;
    companyName?: string;
  };
}

interface BrokerAssignmentStepProps {
  isOpen: boolean;
  onClose: () => void;
  loadId: string;
  loadTitle?: string;
  loadValue?: number;
  onBrokerAssigned: (brokerId: string, contractId?: string) => void;
  onSkip: () => void;
}

const BrokerAssignmentStep: React.FC<BrokerAssignmentStepProps> = ({
  isOpen,
  onClose,
  loadId,
  loadTitle,
  loadValue = 0,
  onBrokerAssigned,
  onSkip,
}) => {
  const { format: fmtFull } = useCurrencyFormat();
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>('');
  const [commissionRate, setCommissionRate] = useState<number>(5.0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [contractId, setContractId] = useState<string | null>(null);

  // Fetch available brokers
  useEffect(() => {
    if (isOpen) {
      fetchBrokers();
    }
  }, [isOpen]);

  // Set commission rate when broker is selected
  useEffect(() => {
    if (selectedBrokerId) {
      const selectedBroker = brokers.find(b => b.id === selectedBrokerId);
      if (selectedBroker?.defaultCommissionRate) {
        setCommissionRate(selectedBroker.defaultCommissionRate);
      }
    }
  }, [selectedBrokerId, brokers]);

  const fetchBrokers = async () => {
    setLoading(true);
    try {
      const response = await brokerAPI.getBrokers();
      const brokersData = response.data || response || [];
      setBrokers(Array.isArray(brokersData) ? brokersData : []);
    } catch (error: any) {
      console.error('Failed to fetch brokers:', error);
      toast.error(error.response?.data?.message || 'Failed to load brokers');
      setBrokers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedBrokerId) {
      toast.error('Please select a broker');
      return;
    }

    if (commissionRate < 0 || commissionRate > 100) {
      toast.error('Commission rate must be between 0 and 100%');
      return;
    }

    setAssigning(true);
    try {
      await brokerAPI.assignBrokerToLoad(loadId, {
        brokerId: selectedBrokerId,
        commissionRate,
      });

      // Fetch the contract that was created
      try {
        const contractsResponse = await brokerAPI.getContracts({ 
          loadId, 
          status: 'PENDING_BROKER_ACCEPTANCE' 
        });
        const contracts = contractsResponse.data || [];
        if (contracts.length > 0) {
          setContractId(contracts[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch contract:', error);
      }

      const selectedBroker = brokers.find(b => b.id === selectedBrokerId);
      const brokerName = selectedBroker?.profile?.companyName ||
        (selectedBroker?.profile?.firstName 
          ? `${selectedBroker.profile.firstName} ${selectedBroker.profile.lastName || ''}`.trim()
          : selectedBroker?.email || 'Broker');

      toast.success(`Broker ${brokerName} assigned successfully!`);
      setShowConfirmation(true);
    } catch (error: any) {
      console.error('Failed to assign broker:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to assign broker';
      toast.error(errorMessage);
    } finally {
      setAssigning(false);
    }
  };

  const handleContinue = () => {
    if (selectedBrokerId) {
      onBrokerAssigned(selectedBrokerId, contractId || undefined);
    }
    onClose();
  };

  // Filter brokers by search term
  const filteredBrokers = brokers.filter(broker => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const name = `${broker.profile?.firstName || ''} ${broker.profile?.lastName || ''}`.trim().toLowerCase();
    const email = broker.email.toLowerCase();
    const company = broker.profile?.companyName?.toLowerCase() || '';
    return name.includes(search) || email.includes(search) || company.includes(search);
  });

  // Calculate commission amount preview
  const commissionAmount = loadValue ? (loadValue * commissionRate) / 100 : 0;

  if (!isOpen) return null;

  if (showConfirmation) {
    return createPortal(
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999]">
        <div 
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Broker Assigned Successfully</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">
                    Broker has been assigned and a contract has been created
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-blue-800 text-sm font-medium mb-1">
                      Next Steps:
                    </p>
                    <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
                      <li>The broker will receive a notification about the assignment</li>
                      <li>A contract has been created with status: PENDING_BROKER_ACCEPTANCE</li>
                      <li>The broker must accept the contract before they can manage this load</li>
                      <li>Once accepted, the broker will have full control over auctions, bidding, and matching</li>
                    </ul>
                  </div>
                </div>
              </div>

              {(() => {
                const selectedBroker = brokers.find(b => b.id === selectedBrokerId);
                if (selectedBroker) {
                  const brokerName = selectedBroker.profile?.companyName ||
                    (selectedBroker.profile?.firstName && selectedBroker.profile?.lastName
                      ? `${selectedBroker.profile.firstName} ${selectedBroker.profile.lastName}`
                      : selectedBroker.email);
                  return (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">Assignment Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Broker:</span>
                          <span className="font-medium text-gray-900">{brokerName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Commission Rate:</span>
                          <span className="font-medium text-gray-900">{commissionRate}%</span>
                        </div>
                        {loadValue > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Commission Amount:</span>
                            <span className="font-medium text-gray-900">
                              {fmtFull(commissionAmount)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                onClick={handleContinue}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Continue</span>
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999]" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Assign a Broker</h2>
            {loadTitle && (
              <p className="text-sm text-gray-500 mt-1">{loadTitle}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Optional: Assign a broker to manage this load. Once assigned, the broker will handle auctions, bidding, and matching.
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
          {/* Load Value Info */}
          {loadValue > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Load Value:</span>
                <span className="text-lg font-semibold text-gray-900">
                  {fmtFull(loadValue)}
                </span>
              </div>
            </div>
          )}

          {/* Broker Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Broker
            </label>
            
            {/* Search Input */}
            <div className="mb-3">
              <input
                type="text"
                placeholder="Search brokers by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Brokers List */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredBrokers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No brokers found matching your search' : 'No brokers available'}
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredBrokers.map((broker) => (
                  <div
                    key={broker.id}
                    onClick={() => setSelectedBrokerId(broker.id)}
                    className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${
                      selectedBrokerId === broker.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {broker.profile?.firstName && broker.profile?.lastName
                              ? `${broker.profile.firstName} ${broker.profile.lastName}`
                              : broker.email}
                          </span>
                        </div>
                        
                        {broker.profile?.companyName && (
                          <div className="flex items-center space-x-2 mb-1">
                            <Building2 className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-600">{broker.profile.companyName}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="text-sm text-gray-500">{broker.email}</span>
                        </div>
                      </div>
                      
                      <div className="text-right ml-4">
                        {broker.defaultCommissionRate !== undefined && (
                          <div className="flex items-center space-x-1 mb-1">
                            <DollarSign className="w-3 h-3 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">
                              {broker.defaultCommissionRate}% default
                            </span>
                          </div>
                        )}
                        {broker.totalCommissionEarned !== undefined && (
                          <div className="text-xs text-gray-500">
                            Earned: {fmtFull(broker.totalCommissionEarned)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Commission Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commission Rate (%)
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={commissionRate}
                onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="text-sm text-gray-600 min-w-[120px]">
                {selectedBrokerId && loadValue > 0 && (
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-medium">
                      {fmtFull(commissionAmount)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {selectedBrokerId && loadValue > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Commission amount: {commissionRate}% of {fmtFull(loadValue)} = {fmtFull(commissionAmount)}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={onSkip}
            disabled={assigning}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Skip (Proceed Without Broker)
          </button>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              disabled={assigning}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={assigning || !selectedBrokerId}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {assigning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Assigning...</span>
                </>
              ) : (
                <>
                  <User className="w-4 h-4" />
                  <span>Assign Broker</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BrokerAssignmentStep;

