import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type LoadContract, type CreateContractData } from '../../services/brokerApi';
import { FileText, Plus, Search, Filter, CheckCircle2, Clock, X, Loader2, Eye, PenTool } from 'lucide-react';
import toast from 'react-hot-toast';

const ContractManagement: React.FC = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<LoadContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<LoadContract | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });

  useEffect(() => {
    if (user && user.role === 'BROKER') {
      fetchContracts();
    }
  }, [user, filters]);

  const fetchContracts = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await brokerAPI.getContracts({
        status: filters.status || undefined,
      });
      // Handle different response structures
      const contractsData = response.data || response || [];
      setContracts(Array.isArray(contractsData) ? contractsData : []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch contracts');
      setContracts([]); // Ensure contracts is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContract = async (data: CreateContractData) => {
    try {
      await brokerAPI.createContract(data);
      toast.success('Contract created successfully');
      setShowCreateModal(false);
      fetchContracts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create contract');
    }
  };

  const handleSignContract = async (contractId: string) => {
    try {
      await brokerAPI.signContract(contractId, {
        signatureMethod: 'DIGITAL',
      });
      toast.success('Contract signed successfully');
      fetchContracts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to sign contract');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SIGNED':
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PENDING_SIGNATURE':
      case 'PARTIALLY_SIGNED':
        return 'bg-yellow-100 text-yellow-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contract Management</h1>
          <p className="text-gray-600 mt-1">Manage load contracts and signatures</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Contract</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search contracts..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING_SIGNATURE">Pending Signature</option>
          <option value="PARTIALLY_SIGNED">Partially Signed</option>
          <option value="SIGNED">Signed</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {/* Contracts List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : contracts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No contracts found</h3>
          <p className="text-gray-600 mb-4">Create your first contract to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Create Contract
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contract
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Load
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">#{contract.id.slice(0, 8)}</div>
                    <div className="text-sm text-gray-500">{contract.contractType.replace('_', ' ')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Load {contract.loadId.slice(0, 8)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {contract.agreedRate.toLocaleString()} {contract.currencyCode}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {contract.commissionAmount.toLocaleString()} ({contract.commissionRate}%)
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(contract.status)}`}>
                      {contract.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedContract(contract)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {(contract.status === 'DRAFT' || contract.status === 'PENDING_SIGNATURE') && (
                        <button
                          onClick={() => handleSignContract(contract.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <PenTool className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Contract Modal */}
      {showCreateModal && (
        <CreateContractModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateContract}
        />
      )}

      {/* View Contract Modal */}
      {selectedContract && (
        <ViewContractModal
          contract={selectedContract}
          onClose={() => setSelectedContract(null)}
          onSign={handleSignContract}
        />
      )}
    </div>
  );
};

// Create Contract Modal Component
const CreateContractModal: React.FC<{
  onClose: () => void;
  onSubmit: (data: CreateContractData) => void;
}> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState<CreateContractData>({
    loadId: '',
    transporterId: '',
    agreedRate: 0,
    commissionRate: 0,
    currencyCode: 'KES',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create Contract</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Load ID</label>
            <input
              type="text"
              required
              value={formData.loadId}
              onChange={(e) => setFormData({ ...formData, loadId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transporter ID</label>
            <input
              type="text"
              required
              value={formData.transporterId}
              onChange={(e) => setFormData({ ...formData, transporterId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agreed Rate</label>
              <input
                type="number"
                required
                value={formData.agreedRate}
                onChange={(e) => setFormData({ ...formData, agreedRate: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
              <input
                type="number"
                required
                min="0"
                max="100"
                value={formData.commissionRate}
                onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Contract'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// View Contract Modal Component
const ViewContractModal: React.FC<{
  contract: LoadContract;
  onClose: () => void;
  onSign: (id: string) => void;
}> = ({ contract, onClose, onSign }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Contract Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <p className="text-gray-900">{contract.status}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Agreed Rate</label>
              <p className="text-gray-900">
                {contract.agreedRate.toLocaleString()} {contract.currencyCode}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Commission</label>
              <p className="text-gray-900">
                {contract.commissionAmount.toLocaleString()} ({contract.commissionRate}%)
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Payment Terms</label>
              <p className="text-gray-900">{contract.paymentTerms || 'N/A'}</p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Contract Content</label>
            <div className="mt-2 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
              {contract.contractContent}
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            {(contract.status === 'DRAFT' || contract.status === 'PENDING_SIGNATURE') && (
              <button
                onClick={() => onSign(contract.id)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Sign Contract
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractManagement;

