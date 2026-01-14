import React, { useState, useEffect } from 'react';
import { X, User, Star, DollarSign, CheckCircle, Loader2 } from 'lucide-react';
import api from '../../services/api';

interface Broker {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  defaultCommissionRate: number;
  totalCommissionEarned: number;
  companyName?: string;
}

interface BrokerAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  loadId: string;
  loadTitle: string;
  onAssignSuccess: () => void;
}

const BrokerAssignmentModal: React.FC<BrokerAssignmentModalProps> = ({
  isOpen,
  onClose,
  loadId,
  loadTitle,
  onAssignSuccess
}) => {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchBrokers();
    }
  }, [isOpen]);

  const fetchBrokers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users', {
        params: { role: 'BROKER', limit: 50 }
      });
      setBrokers(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Error fetching brokers:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignBroker = async (brokerId: string) => {
    try {
      setAssigning(true);
      await api.patch(`/loads-v2/${loadId}`, {
        brokerId,
        status: 'ASSIGNED'
      });
      onAssignSuccess();
      onClose();
    } catch (error) {
      console.error('Error assigning broker:', error);
    } finally {
      setAssigning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Assign Broker</h2>
            <p className="text-sm text-gray-600 mt-1">{loadTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading brokers...</span>
            </div>
          ) : brokers.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No brokers available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {brokers.map((broker) => (
                <div
                  key={broker.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedBroker === broker.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedBroker(broker.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {(broker.firstName?.[0] || '') + (broker.lastName?.[0] || '')}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {broker.firstName} {broker.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{broker.email}</p>
                        {broker.companyName && (
                          <p className="text-xs text-gray-500">{broker.companyName}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        <span>{broker.defaultCommissionRate || 5}% commission</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                        <Star className="w-3 h-3" />
                        <span>Earned: ${(broker.totalCommissionEarned || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => selectedBroker && assignBroker(selectedBroker)}
            disabled={!selectedBroker || assigning}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {assigning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Assigning...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Assign Broker</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrokerAssignmentModal;