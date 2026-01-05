import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type BrokerDispute, type CreateDisputeData, type ResolveDisputeData } from '../../services/brokerApi';
import { AlertTriangle, Plus, Search, Filter, MessageSquare, CheckCircle2, Clock, Loader2, Eye, Gavel } from 'lucide-react';
import toast from 'react-hot-toast';

const DisputeResolution: React.FC = () => {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<BrokerDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<BrokerDispute | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: '',
  });

  useEffect(() => {
    if (user && user.role === 'BROKER') {
      fetchDisputes();
    }
  }, [user, filters]);

  const fetchDisputes = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await brokerAPI.getDisputes({
        status: filters.status || undefined,
        category: filters.category || undefined,
      });
      // Handle different response structures
      const disputesData = response.data || response || [];
      setDisputes(Array.isArray(disputesData) ? disputesData : []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch disputes');
      setDisputes([]); // Ensure disputes is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDispute = async (data: CreateDisputeData) => {
    try {
      await brokerAPI.createDispute(data);
      toast.success('Dispute created successfully');
      setShowCreateModal(false);
      fetchDisputes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create dispute');
    }
  };

  const handleStartMediation = async (disputeId: string) => {
    try {
      await brokerAPI.startMediation(disputeId, 'Broker starting mediation process');
      toast.success('Mediation started');
      fetchDisputes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start mediation');
    }
  };

  const handleResolveDispute = async (disputeId: string, data: ResolveDisputeData) => {
    try {
      await brokerAPI.resolveDispute(disputeId, data);
      toast.success('Dispute resolved successfully');
      setShowResolveModal(false);
      setSelectedDispute(null);
      fetchDisputes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resolve dispute');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
        return 'bg-green-100 text-green-800';
      case 'MEDIATION':
        return 'bg-blue-100 text-blue-800';
      case 'OPEN':
      case 'UNDER_REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'ESCALATED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dispute Resolution</h1>
          <p className="text-gray-600 mt-1">Manage and mediate disputes between parties</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Dispute</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search disputes..."
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
          <option value="OPEN">Open</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="MEDIATION">Mediation</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Categories</option>
          <option value="DAMAGE">Damage</option>
          <option value="DELAY">Delay</option>
          <option value="PAYMENT">Payment</option>
          <option value="QUALITY">Quality</option>
          <option value="ROUTE">Route</option>
          <option value="COMMUNICATION">Communication</option>
        </select>
      </div>

      {/* Disputes List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : disputes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No disputes found</h3>
          <p className="text-gray-600">Create a dispute to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <div key={dispute.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(dispute.status)}`}>
                      {dispute.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(dispute.severity)}`}>
                      {dispute.severity}
                    </span>
                    <span className="text-sm text-gray-500">{dispute.category}</span>
                  </div>
                  <p className="text-gray-900 font-medium mb-1">{dispute.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>Load: {dispute.loadId.slice(0, 8)}</span>
                    {dispute.claimedAmount && (
                      <span>Claimed: {dispute.claimedAmount.toLocaleString()} KES</span>
                    )}
                    <span>Created: {new Date(dispute.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedDispute(dispute)}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  {dispute.status === 'OPEN' && (
                    <button
                      onClick={() => handleStartMediation(dispute.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Start Mediation"
                    >
                      <Gavel className="w-5 h-5" />
                    </button>
                  )}
                  {dispute.status === 'MEDIATION' && (
                    <button
                      onClick={() => {
                        setSelectedDispute(dispute);
                        setShowResolveModal(true);
                      }}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Resolve Dispute"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dispute Modal */}
      {showCreateModal && (
        <CreateDisputeModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateDispute}
        />
      )}

      {/* View/Resolve Dispute Modal */}
      {selectedDispute && (
        <ViewDisputeModal
          dispute={selectedDispute}
          onClose={() => {
            setSelectedDispute(null);
            setShowResolveModal(false);
          }}
          onResolve={showResolveModal ? (data) => handleResolveDispute(selectedDispute.id, data) : undefined}
        />
      )}
    </div>
  );
};

// Create Dispute Modal
const CreateDisputeModal: React.FC<{
  onClose: () => void;
  onSubmit: (data: CreateDisputeData) => void;
}> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState<CreateDisputeData>({
    loadId: '',
    disputedWithId: '',
    category: 'OTHER',
    severity: 'MEDIUM',
    description: '',
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
          <h2 className="text-xl font-semibold text-gray-900">Create Dispute</h2>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Disputed With (User ID)</label>
            <input
              type="text"
              required
              value={formData.disputedWithId}
              onChange={(e) => setFormData({ ...formData, disputedWithId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="DAMAGE">Damage</option>
                <option value="DELAY">Delay</option>
                <option value="PAYMENT">Payment</option>
                <option value="QUALITY">Quality</option>
                <option value="ROUTE">Route</option>
                <option value="COMMUNICATION">Communication</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Claimed Amount (KES)</label>
            <input
              type="number"
              value={formData.claimedAmount || ''}
              onChange={(e) => setFormData({ ...formData, claimedAmount: parseFloat(e.target.value) || undefined })}
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
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Dispute'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// View Dispute Modal
const ViewDisputeModal: React.FC<{
  dispute: BrokerDispute;
  onClose: () => void;
  onResolve?: (data: ResolveDisputeData) => void;
}> = ({ dispute, onClose, onResolve }) => {
  const [resolution, setResolution] = useState('');
  const [resolvedAmount, setResolvedAmount] = useState<number | undefined>(dispute.claimedAmount);
  const [submitting, setSubmitting] = useState(false);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onResolve) return;
    setSubmitting(true);
    try {
      await onResolve({
        resolution,
        resolvedAmount,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Dispute Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <p className="text-gray-900">{dispute.status}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Category</label>
              <p className="text-gray-900">{dispute.category}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Severity</label>
              <p className="text-gray-900">{dispute.severity}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Claimed Amount</label>
              <p className="text-gray-900">{dispute.claimedAmount?.toLocaleString() || 'N/A'} KES</p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Description</label>
            <p className="text-gray-900 mt-1">{dispute.description}</p>
          </div>
          {dispute.evidence && dispute.evidence.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-500">Evidence</label>
              <div className="mt-2 space-y-2">
                {dispute.evidence.map((ev, idx) => (
                  <div key={idx} className="p-2 bg-gray-50 rounded">
                    <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                      {ev.type}: {ev.description || ev.url}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
          {onResolve && (
            <form onSubmit={handleResolve} className="pt-4 border-t border-gray-200 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resolution</label>
                <textarea
                  required
                  rows={4}
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Describe the resolution..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resolved Amount (KES)</label>
                <input
                  type="number"
                  value={resolvedAmount || ''}
                  onChange={(e) => setResolvedAmount(parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
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
                  {submitting ? 'Resolving...' : 'Resolve Dispute'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default DisputeResolution;

