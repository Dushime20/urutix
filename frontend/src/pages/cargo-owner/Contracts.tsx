import React, { useState, useEffect } from 'react';
import { FileText, Eye, Download, CheckCircle, Clock, X } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import api from '../../services/api';

interface Contract {
  id: string;
  brokerId: string;
  broker?: {
    profile?: {
      firstName: string;
      lastName: string;
      companyName?: string;
    };
  };
  loadId: string;
  load?: {
    title: string;
  };
  agreedRate: number;
  commissionRate: number;
  commissionAmount: number;
  currencyCode: string;
  status: 'PENDING_SIGNATURE' | 'ACTIVE' | 'SIGNED' | 'REJECTED' | 'CANCELLED';
  paymentTerms: string;
  createdAt: string;
  contractData: any;
}

const CargoOwnerContracts: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/brokers/contracts');
      setContracts(response.data || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast.error('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  // Check if there are any contracts
  const hasContracts = contracts.length > 0;

  const handleSign = (contractId: string) => {
    setContracts(prev => prev.map(c => 
      c.id === contractId ? { ...c, status: 'SIGNED' as const } : c
    ));
    toast.success('Contract signed successfully');
    setSelectedContract(null);
  };

  const handleReject = (contractId: string) => {
    api.patch(`/brokers/contracts/${contractId}`, { status: 'REJECTED' })
      .then(() => {
        setContracts(prev => prev.map(c => 
          c.id === contractId ? { ...c, status: 'REJECTED' as const } : c
        ));
        toast.success('Contract rejected');
        setSelectedContract(null);
      })
      .catch(error => {
        console.error('Error rejecting contract:', error);
        toast.error('Failed to reject contract');
      });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SIGNED':
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'PENDING_SIGNATURE': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBrokerName = (contract: Contract) => {
    if (contract.broker?.profile) {
      return `${contract.broker.profile.firstName} ${contract.broker.profile.lastName}`;
    }
    return 'Unknown Broker';
  };

  const getBrokerCompany = (contract: Contract) => {
    return contract.broker?.profile?.companyName || 'N/A';
  };

  const getLoadTitle = (contract: Contract) => {
    return contract.load?.title || `Load ${contract.loadId.slice(0, 8)}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Broker Contracts</h1>
        <p className="text-gray-600 mt-1">Review and sign contracts from brokers</p>
      </div>

      {!hasContracts ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Contracts Yet</h3>
          <p className="text-gray-600 mb-4">
            You don't have any broker contracts at the moment. Assign a broker to your loads to create contract proposals.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Broker</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Load</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transportation Fee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contracts.map((contract) => (
              <tr key={contract.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{getBrokerName(contract)}</div>
                  <div className="text-sm text-gray-500">{getBrokerCompany(contract)}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{getLoadTitle(contract)}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {contract.agreedRate.toLocaleString()} {contract.currencyCode}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {contract.commissionAmount.toLocaleString()} ({contract.commissionRate}%)
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(contract.status)}`}>
                    {contract.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => setSelectedContract(contract)}
                    className="text-primary-600 hover:text-primary-900"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {selectedContract && (
        <div 
          className="bg-black bg-opacity-70 flex items-center justify-center p-4" 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', zIndex: 99999 }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" style={{ zIndex: 100000 }}>
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Contract Review</h2>
              <button onClick={() => setSelectedContract(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Broker</label>
                  <p className="text-gray-900">{getBrokerName(selectedContract)} - {getBrokerCompany(selectedContract)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Load</label>
                  <p className="text-gray-900">{getLoadTitle(selectedContract)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Transportation Fee</label>
                  <p className="text-gray-900">{selectedContract.agreedRate.toLocaleString()} {selectedContract.currencyCode}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Commission</label>
                  <p className="text-gray-900">{selectedContract.commissionAmount.toLocaleString()} ({selectedContract.commissionRate}%)</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Terms</label>
                  <p className="text-gray-900">{selectedContract.paymentTerms}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-gray-900">{selectedContract.status.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setSelectedContract(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                {selectedContract.status === 'PENDING_SIGNATURE' && (
                  <>
                    <button
                      onClick={() => handleReject(selectedContract.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleSign(selectedContract.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Sign Contract
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CargoOwnerContracts;
