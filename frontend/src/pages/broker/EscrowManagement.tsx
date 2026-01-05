import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type EscrowAccount, type CreateEscrowData, type FundEscrowData, type ReleaseEscrowData } from '../../services/brokerApi';
import { Wallet, Plus, Search, DollarSign, CheckCircle2, Clock, Loader2, Eye, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const EscrowManagement: React.FC = () => {
  const { user } = useAuth();
  const [escrows, setEscrows] = useState<EscrowAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowAccount | null>(null);
  const [showFundModal, setShowFundModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });

  useEffect(() => {
    if (user && user.role === 'BROKER') {
      fetchEscrows();
    }
  }, [user, filters]);

  const fetchEscrows = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await brokerAPI.getEscrows({
        status: filters.status || undefined,
      });
      // Handle different response structures
      const escrowsData = response.data || response || [];
      setEscrows(Array.isArray(escrowsData) ? escrowsData : []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch escrow accounts');
      setEscrows([]); // Ensure escrows is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEscrow = async (data: CreateEscrowData) => {
    try {
      await brokerAPI.createEscrow(data);
      toast.success('Escrow account created successfully');
      setShowCreateModal(false);
      fetchEscrows();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create escrow account');
    }
  };

  const handleFundEscrow = async (escrowId: string, data: FundEscrowData) => {
    try {
      await brokerAPI.fundEscrow(escrowId, data);
      toast.success('Escrow funded successfully');
      setShowFundModal(false);
      setSelectedEscrow(null);
      fetchEscrows();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fund escrow');
    }
  };

  const handleReleaseEscrow = async (escrowId: string, data: ReleaseEscrowData) => {
    try {
      await brokerAPI.releaseEscrow(escrowId, data);
      toast.success('Funds released successfully');
      setShowReleaseModal(false);
      setSelectedEscrow(null);
      fetchEscrows();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to release funds');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FUNDED':
      case 'RELEASED':
        return 'bg-green-100 text-green-800';
      case 'PARTIALLY_RELEASED':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'DISPUTED':
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Escrow Management</h1>
          <p className="text-gray-600 mt-1">Manage payment escrow accounts and fund releases</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Escrow</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600">Total Escrow</div>
          <div className="text-2xl font-bold text-gray-900">
            {Array.isArray(escrows) ? escrows.reduce((sum, e) => sum + (e.totalAmount || 0), 0).toLocaleString() : '0'} KES
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600">Funded</div>
          <div className="text-2xl font-bold text-green-600">
            {Array.isArray(escrows) ? escrows.reduce((sum, e) => sum + (e.fundedAmount || 0), 0).toLocaleString() : '0'} KES
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600">Released</div>
          <div className="text-2xl font-bold text-blue-600">
            {Array.isArray(escrows) ? escrows.reduce((sum, e) => sum + (e.releasedAmount || 0), 0).toLocaleString() : '0'} KES
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600">Commission</div>
          <div className="text-2xl font-bold text-purple-600">
            {Array.isArray(escrows) ? escrows.reduce((sum, e) => sum + (e.commissionAmount || 0), 0).toLocaleString() : '0'} KES
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search escrow accounts..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="FUNDED">Funded</option>
          <option value="PARTIALLY_RELEASED">Partially Released</option>
          <option value="RELEASED">Released</option>
          <option value="DISPUTED">Disputed</option>
        </select>
      </div>

      {/* Escrow Accounts List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : escrows.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No escrow accounts found</h3>
          <p className="text-gray-600">Create your first escrow account to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {escrows.map((escrow) => (
            <div key={escrow.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(escrow.status)}`}>
                      {escrow.status.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-500">Load: {escrow.loadId.slice(0, 8)}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <div className="text-sm text-gray-600">Total Amount</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {escrow.totalAmount.toLocaleString()} {escrow.currencyCode}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Funded</div>
                      <div className="text-lg font-semibold text-green-600">
                        {escrow.fundedAmount.toLocaleString()} {escrow.currencyCode}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Released</div>
                      <div className="text-lg font-semibold text-blue-600">
                        {escrow.releasedAmount.toLocaleString()} {escrow.currencyCode}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Commission</div>
                      <div className="text-lg font-semibold text-purple-600">
                        {escrow.commissionAmount.toLocaleString()} {escrow.currencyCode}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => setSelectedEscrow(escrow)}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  {escrow.status === 'PENDING' && (
                    <button
                      onClick={() => {
                        setSelectedEscrow(escrow);
                        setShowFundModal(true);
                      }}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Fund Escrow"
                    >
                      <ArrowDownCircle className="w-5 h-5" />
                    </button>
                  )}
                  {(escrow.status === 'FUNDED' || escrow.status === 'PARTIALLY_RELEASED') && (
                    <button
                      onClick={() => {
                        setSelectedEscrow(escrow);
                        setShowReleaseModal(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Release Funds"
                    >
                      <ArrowUpCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Escrow Modal */}
      {showCreateModal && (
        <CreateEscrowModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateEscrow}
        />
      )}

      {/* Fund Escrow Modal */}
      {showFundModal && selectedEscrow && (
        <FundEscrowModal
          escrow={selectedEscrow}
          onClose={() => {
            setShowFundModal(false);
            setSelectedEscrow(null);
          }}
          onSubmit={(data) => handleFundEscrow(selectedEscrow.id, data)}
        />
      )}

      {/* Release Escrow Modal */}
      {showReleaseModal && selectedEscrow && (
        <ReleaseEscrowModal
          escrow={selectedEscrow}
          onClose={() => {
            setShowReleaseModal(false);
            setSelectedEscrow(null);
          }}
          onSubmit={(data) => handleReleaseEscrow(selectedEscrow.id, data)}
        />
      )}

      {/* View Escrow Modal */}
      {selectedEscrow && !showFundModal && !showReleaseModal && (
        <ViewEscrowModal
          escrow={selectedEscrow}
          onClose={() => setSelectedEscrow(null)}
        />
      )}
    </div>
  );
};

// Create Escrow Modal
const CreateEscrowModal: React.FC<{
  onClose: () => void;
  onSubmit: (data: CreateEscrowData) => void;
}> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState<CreateEscrowData>({
    loadId: '',
    payerId: '',
    payeeId: '',
    totalAmount: 0,
    commissionAmount: 0,
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
          <h2 className="text-xl font-semibold text-gray-900">Create Escrow Account</h2>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payer ID (Cargo Owner)</label>
              <input
                type="text"
                required
                value={formData.payerId}
                onChange={(e) => setFormData({ ...formData, payerId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payee ID (Transporter)</label>
              <input
                type="text"
                required
                value={formData.payeeId}
                onChange={(e) => setFormData({ ...formData, payeeId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
              <input
                type="number"
                required
                min="0"
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commission Amount</label>
              <input
                type="number"
                required
                min="0"
                value={formData.commissionAmount}
                onChange={(e) => setFormData({ ...formData, commissionAmount: parseFloat(e.target.value) })}
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
              {submitting ? 'Creating...' : 'Create Escrow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Fund Escrow Modal
const FundEscrowModal: React.FC<{
  escrow: EscrowAccount;
  onClose: () => void;
  onSubmit: (data: FundEscrowData) => void;
}> = ({ escrow, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<FundEscrowData>({
    amount: escrow.totalAmount,
    paymentMethod: 'Bank Transfer',
    paymentReference: '',
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
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Fund Escrow Account</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              required
              min="0"
              max={escrow.totalAmount}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">Total required: {escrow.totalAmount.toLocaleString()} {escrow.currencyCode}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              required
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Mobile Money">Mobile Money</option>
              <option value="Credit Card">Credit Card</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference</label>
            <input
              type="text"
              required
              value={formData.paymentReference}
              onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Transaction ID or reference"
            />
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
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? 'Funding...' : 'Fund Escrow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Release Escrow Modal
const ReleaseEscrowModal: React.FC<{
  escrow: EscrowAccount;
  onClose: () => void;
  onSubmit: (data: ReleaseEscrowData) => void;
}> = ({ escrow, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<ReleaseEscrowData>({
    amount: escrow.totalAmount - escrow.releasedAmount,
    trigger: 'DELIVERY_CONFIRMED',
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
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Release Funds</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Release</label>
            <input
              type="number"
              required
              min="0"
              max={escrow.totalAmount - escrow.releasedAmount}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Available: {(escrow.totalAmount - escrow.releasedAmount).toLocaleString()} {escrow.currencyCode}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Release Trigger</label>
            <select
              required
              value={formData.trigger}
              onChange={(e) => setFormData({ ...formData, trigger: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="DELIVERY_CONFIRMED">Delivery Confirmed</option>
              <option value="MILESTONE_REACHED">Milestone Reached</option>
              <option value="MANUAL">Manual Release</option>
              <option value="DISPUTE_RESOLVED">Dispute Resolved</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference (Optional)</label>
            <input
              type="text"
              value={formData.paymentReference || ''}
              onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              rows={3}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Releasing...' : 'Release Funds'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// View Escrow Modal
const ViewEscrowModal: React.FC<{
  escrow: EscrowAccount;
  onClose: () => void;
}> = ({ escrow, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Escrow Account Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <p className="text-gray-900">{escrow.status}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Total Amount</label>
              <p className="text-gray-900">
                {escrow.totalAmount.toLocaleString()} {escrow.currencyCode}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Funded Amount</label>
              <p className="text-gray-900">
                {escrow.fundedAmount.toLocaleString()} {escrow.currencyCode}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Released Amount</label>
              <p className="text-gray-900">
                {escrow.releasedAmount.toLocaleString()} {escrow.currencyCode}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Commission</label>
              <p className="text-gray-900">
                {escrow.commissionAmount.toLocaleString()} {escrow.currencyCode}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Funded At</label>
              <p className="text-gray-900">
                {escrow.fundedAt ? new Date(escrow.fundedAt).toLocaleString() : 'Not funded'}
              </p>
            </div>
          </div>
          {escrow.releaseHistory && escrow.releaseHistory.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-500 mb-2 block">Release History</label>
              <div className="space-y-2">
                {escrow.releaseHistory.map((release, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">
                        {release.amount.toLocaleString()} {escrow.currencyCode}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(release.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Trigger: {release.trigger} | By: {release.releasedBy.slice(0, 8)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EscrowManagement;

