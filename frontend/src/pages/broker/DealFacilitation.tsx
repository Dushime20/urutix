import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type BrokerLoad } from '../../services/brokerApi';
import TransporterSearch from '../../components/broker/TransporterSearch';
import { 
  Users, 
  Package, 
  Truck, 
  DollarSign, 
  CheckCircle2,
  Clock,
  X,
  Search,
  Send,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface MatchProposal {
  id?: string;
  loadId: string;
  loadTitle: string;
  transporterId?: string;
  transporterName?: string;
  proposedRate?: number;
  commissionRate: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  createdAt?: string;
}

const DealFacilitation: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loadId = searchParams.get('loadId');
  
  const [brokerLoads, setBrokerLoads] = useState<BrokerLoad[]>([]);
  const [proposals, setProposals] = useState<MatchProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProposalForm, setShowProposalForm] = useState(!!loadId);
  const [selectedLoad, setSelectedLoad] = useState<string | null>(loadId);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && user.role === 'BROKER') {
      loadBrokerLoads();
      loadProposals();
    }
  }, [user]);

  const loadBrokerLoads = async () => {
    try {
      const response = await brokerAPI.getBrokerLoads(user!.id);
      // Handle different response structures
      const loadsData = response.data || response || [];
      setBrokerLoads(Array.isArray(loadsData) ? loadsData : []);
    } catch (err) {
      console.error('Failed to load broker loads:', err);
      setBrokerLoads([]); // Ensure brokerLoads is always an array
    }
  };

  const loadProposals = async () => {
    // This would load existing proposals - for now we'll use mock data
    setProposals([
      {
        loadId: '1',
        loadTitle: 'Electronics Shipment',
        transporterName: 'ABC Transport',
        commissionRate: 5.5,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      },
    ]);
    setLoading(false);
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoad) return;

    try {
      setSubmitting(true);
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      
      // Here you would create a match proposal
      // For now, we'll just show a success message
      alert('Match proposal created successfully!');
      setShowProposalForm(false);
      loadProposals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create proposal');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Deal Facilitation</h1>
            <p className="text-gray-600 mt-1">
              Propose matches, negotiate deals, and earn commissions
            </p>
          </div>
          {!showProposalForm && (
            <button
              onClick={() => {
                setShowProposalForm(true);
                navigate('/dashboard/broker/discovery');
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
            >
              <Users className="w-4 h-4" />
              <span>Find New Match</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Loads */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">My Assigned Loads</h2>
        {brokerLoads.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No loads assigned yet</p>
            <button
              onClick={() => navigate('/dashboard/broker/discovery')}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Discover Cargo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brokerLoads.map((load) => (
              <div
                key={load.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedLoad(load.id);
                  setShowProposalForm(true);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{load.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    load.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {load.status}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-medium">
                    {load.currencyCode} {load.loadValue.toLocaleString()}
                  </span>
                </div>
                {load.brokerCommissionRate && (
                  <div className="text-sm text-gray-600">
                    Commission: {load.brokerCommissionRate}%
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Match Proposals */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Match Proposals</h2>
        {proposals.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No match proposals yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Create proposals to match cargo owners with transporters
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Package className="w-5 h-5 text-primary-600" />
                      <h3 className="font-semibold text-gray-900">{proposal.loadTitle}</h3>
                    </div>
                    {proposal.transporterName && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                        <Truck className="w-4 h-4" />
                        <span>Transporter: {proposal.transporterName}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Commission: {proposal.commissionRate}%</span>
                      {proposal.proposedRate && (
                        <span>Proposed Rate: ${proposal.proposedRate}</span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      proposal.status === 'APPROVED'
                        ? 'bg-green-100 text-green-800'
                        : proposal.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {proposal.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Proposal Form Modal */}
      {showProposalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Create Match Proposal</h2>
                <button
                  onClick={() => setShowProposalForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateProposal} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Load
                </label>
                <select
                  value={selectedLoad || ''}
                  onChange={(e) => setSelectedLoad(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Choose a load...</option>
                  {brokerLoads.map((load) => (
                    <option key={load.id} value={load.id}>
                      {load.title} - {load.currencyCode} {load.loadValue.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Transporter
                </label>
                <TransporterSearch
                  onSelect={(transporter) => {
                    // Handle transporter selection
                    console.log('Selected transporter:', transporter);
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proposed Rate
                  </label>
                  <input
                    type="number"
                    name="proposedRate"
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    name="commissionRate"
                    min="0"
                    max="100"
                    step="0.1"
                    defaultValue={(user as any)?.defaultCommissionRate || 5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Add any additional notes about this match proposal..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowProposalForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Proposal</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealFacilitation;

