import React, { useState, useEffect } from 'react';
import { X, User, DollarSign, TrendingUp, Mail, Building2 } from 'lucide-react';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { TranslatedText } from '../translated-text';
import { brokerAPI } from '../../services/brokerApi';
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

interface AssignBrokerModalProps {
  isOpen: boolean;
  onClose: () => void;
  loadId: string;
  loadTitle?: string;
  loadValue?: number;
  /** The price the Cargo Owner is willing to pay for transportation (used for commission basis) */
  targetPrice?: number;
  currentBrokerId?: string;
  onSuccess?: () => void;
}

export const AssignBrokerModal: React.FC<AssignBrokerModalProps> = ({
  isOpen,
  onClose,
  loadId,
  loadTitle,
  loadValue = 0,
  targetPrice,
  currentBrokerId,
  onSuccess,
}) => {
  // Commission is calculated on the transportation payment amount (targetPrice / offeredPrice),
  // not on the cargo's declared load value.
  const commissionBasis = targetPrice && targetPrice > 0 ? targetPrice : loadValue;
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>(currentBrokerId || '');
  const [commissionRate, setCommissionRate] = useState<number>(5.0);
  const [searchTerm, setSearchTerm] = useState('');
  const { format: fmtFull, compact: fmtMoney, formatIn: fmtIn } = useCurrencyFormat();

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

  // Update selected broker when currentBrokerId changes
  useEffect(() => {
    if (currentBrokerId) {
      setSelectedBrokerId(currentBrokerId);
    }
  }, [currentBrokerId]);

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
    // Prevent assignment if broker already exists
    if (currentBrokerId) {
      toast.error('A broker is already assigned. Please unassign first.');
      return;
    }

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
      console.log('🔄 Assigning broker:', {
        loadId,
        brokerId: selectedBrokerId,
        commissionRate,
        currentBrokerId,
      });

      const response = await brokerAPI.assignBrokerToLoad(loadId, {
        brokerId: selectedBrokerId,
        commissionRate,
      });

      console.log('✅ Broker assignment response:', response);
      console.log('✅ Response data:', response?.data);

      // Verify the assignment was successful
      if (!response?.data) {
        throw new Error('No data returned from assignment');
      }

      const selectedBroker = brokers.find(b => b.id === selectedBrokerId);
      const brokerName = selectedBroker?.profile?.companyName ||
        (selectedBroker?.profile?.firstName 
          ? `${selectedBroker.profile.firstName} ${selectedBroker.profile.lastName || ''}`.trim()
          : selectedBroker?.email || 'Broker');

      toast.success(`Broker ${brokerName} assigned successfully!`);
      
      // Wait a bit before calling onSuccess to ensure backend has saved
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call onSuccess to refresh data
      if (onSuccess) {
        console.log('🔄 Calling onSuccess to refresh data...');
        onSuccess();
      }
      
      // Close modal after a short delay to ensure data is refreshed
      setTimeout(() => {
        onClose();
      }, 200);
    } catch (error: any) {
      console.error('❌ Failed to assign broker:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to assign broker';
      toast.error(errorMessage);
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async () => {
    if (!currentBrokerId) return;

    setAssigning(true);
    try {
      await brokerAPI.unassignBrokerFromLoad(loadId);
      toast.success('Broker unassigned successfully');
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error: any) {
      console.error('Failed to unassign broker:', error);
      toast.error(error.response?.data?.message || 'Failed to unassign broker');
    } finally {
      setAssigning(false);
    }
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

  // Calculate commission amount preview — based on transportation fee, not cargo declared value
  const commissionAmount = commissionBasis ? (commissionBasis * commissionRate) / 100 : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900"><TranslatedText text="Assign Broker to Load" /></h2>
            {loadTitle && (
              <p className="text-sm text-gray-500 mt-1">{loadTitle}</p>
            )}
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
          {/* Current Broker Status */}
          {currentBrokerId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <div>
                    <span className="text-sm font-medium text-blue-900 block">
                      <TranslatedText text="Load already has an assigned broker" />
                    </span>
                    {(() => {
                      const currentBroker = brokers.find(b => b.id === currentBrokerId);
                      if (currentBroker) {
                        const brokerName = currentBroker.profile?.companyName ||
                          (currentBroker.profile?.firstName && currentBroker.profile?.lastName
                            ? `${currentBroker.profile.firstName} ${currentBroker.profile.lastName}`
                            : currentBroker.email);
                        return (
                          <span className="text-xs text-blue-700 mt-1 block">
                            <TranslatedText text="Current" />: {brokerName}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
                <button
                  onClick={handleUnassign}
                  disabled={assigning}
                  className="text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-50 px-3 py-1.5 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                >
                  {assigning ? <TranslatedText text="Unassigning..." /> : <TranslatedText text="Unassign" />}
                </button>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-blue-700">
                  ⚠️ You must unassign the current broker before assigning a new one.
                </p>
              </div>
            </div>
          )}

          {/* Transportation Fee Info */}
          {commissionBasis > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              {targetPrice && targetPrice > 0 ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600"><TranslatedText text="Target Transportation Price" />:</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {fmtFull(targetPrice)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600"><TranslatedText text="Transportation Value (basis)" />:</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {fmtFull(loadValue)}
                  </span>
                </div>
              )}
              <p className="text-xs text-gray-400">Commission is calculated on the transportation fee, not the cargo's declared value.</p>
            </div>
          )}

          {/* Broker Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <TranslatedText text="Select Broker" />
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
                {searchTerm ? <TranslatedText text="No brokers found matching your search" /> : <TranslatedText text="No brokers available" />}
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredBrokers.map((broker) => {
                  const isCurrentBroker = broker.id === currentBrokerId;
                  const isDisabled = !!currentBrokerId && !isCurrentBroker;
                  
                  return (
                    <div
                      key={broker.id}
                      onClick={() => {
                        if (!isDisabled) {
                          setSelectedBrokerId(broker.id);
                        }
                      }}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        isDisabled
                          ? 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
                          : selectedBrokerId === broker.id
                          ? 'border-blue-500 bg-blue-50 cursor-pointer'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer'
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
                            <TrendingUp className="w-3 h-3 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">
                              {broker.defaultCommissionRate}% default
                            </span>
                          </div>
                        )}
                        {broker.totalCommissionEarned !== undefined && (
                          <div className="text-xs text-gray-500">
                            Earned: {fmtMoney(broker.totalCommissionEarned)}
                          </div>
                        )}
                      </div>
                    </div>
                    {isCurrentBroker && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <span className="text-xs font-medium text-blue-600">
                          ✓ <TranslatedText text="Currently assigned to this load" />
                        </span>
                      </div>
                    )}
                    {isDisabled && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <span className="text-xs text-gray-500">
                          ⚠️ <TranslatedText text="Unassign current broker first" />
                        </span>
                      </div>
                    )}
                  </div>
                );
                })}
              </div>
            )}
          </div>

          {/* Commission Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <TranslatedText text="Commission Rate" /> (%)
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
                {selectedBrokerId && commissionBasis > 0 && (
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-medium">
                      {fmtMoney(commissionAmount)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {selectedBrokerId && commissionBasis > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Commission amount: {commissionRate}% of {fmtFull(commissionBasis)} (transportation fee) = {fmtFull(commissionAmount)}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={assigning}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <TranslatedText text="Cancel" />
          </button>
          <button
            onClick={handleAssign}
            disabled={assigning || !selectedBrokerId || !!currentBrokerId}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {assigning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span><TranslatedText text="Assigning..." /></span>
              </>
            ) : (
              <>
                <User className="w-4 h-4" />
                <span><TranslatedText text="Assign Broker" /></span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

