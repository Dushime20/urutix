import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type EscrowAccount, type CreateEscrowData, type FundEscrowData, type ReleaseEscrowData } from '../../services/brokerApi';
import {
  Wallet, Plus, Search, Loader2, Eye,
  ArrowUpCircle, ArrowDownCircle, Grid, Table, Shield,
  PieChart, Package, X
} from 'lucide-react';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const EscrowManagement: React.FC = () => {
  const { user } = useAuth();
  const [escrows, setEscrows] = useState<EscrowAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowAccount | null>(null);
  const [showFundModal, setShowFundModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });

  useEffect(() => {
    if (user && user.role === 'BROKER') {
      fetchEscrows();
    }
  }, [user, filters.status]);

  const filteredEscrows = useMemo(() => {
    return escrows.filter(e =>
      e.loadId.toLowerCase().includes(filters.search.toLowerCase()) ||
      e.id.toLowerCase().includes(filters.search.toLowerCase())
    );
  }, [escrows, filters.search]);

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
        return 'bg-green-50 text-green-700 border-green-200';
      case 'RELEASED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PARTIALLY_RELEASED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'PENDING':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'DISPUTED':
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Premium Look */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 md:p-8 text-white relative">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold">Escrow Management</h1>
              </div>
              <p className="text-gray-300">Securely manage payment escrow accounts and automated fund releases</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-all shadow-lg active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>New Escrow</span>
            </button>
          </div>
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24 blur-2xl"></div>
        </div>

        {/* Summary Cards Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 bg-white">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 rounded-xl p-3">
                <Wallet className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Escrow</p>
                <p className="text-xl font-bold text-gray-900">
                  {Array.isArray(filteredEscrows) ? filteredEscrows.reduce((sum, e) => sum + (e.totalAmount || 0), 0).toLocaleString() : '0'} <span className="text-sm font-normal text-gray-500">KES</span>
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-50 rounded-xl p-3">
                <ArrowDownCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Funded</p>
                <p className="text-xl font-bold text-gray-900">
                  {Array.isArray(filteredEscrows) ? filteredEscrows.reduce((sum, e) => sum + (e.fundedAmount || 0), 0).toLocaleString() : '0'} <span className="text-sm font-normal text-gray-500">KES</span>
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 rounded-xl p-3">
                <ArrowUpCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Released</p>
                <p className="text-xl font-bold text-gray-900">
                  {Array.isArray(filteredEscrows) ? filteredEscrows.reduce((sum, e) => sum + (e.releasedAmount || 0), 0).toLocaleString() : '0'} <span className="text-sm font-normal text-gray-500">KES</span>
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-50 rounded-xl p-3">
                <PieChart className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-purple-600 font-medium">Commission</p>
                <p className="text-xl font-bold text-gray-900">
                  {Array.isArray(filteredEscrows) ? filteredEscrows.reduce((sum, e) => sum + (e.commissionAmount || 0), 0).toLocaleString() : '0'} <span className="text-sm font-normal text-gray-500">KES</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters + View Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by Load ID..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 transition-shadow outline-none"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 transition-shadow outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="FUNDED">Funded</option>
            <option value="PARTIALLY_RELEASED">Partially Released</option>
            <option value="RELEASED">Released</option>
            <option value="DISPUTED">Disputed</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setViewMode('card')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
              viewMode === 'card'
                ? "bg-gray-900 text-white shadow-md scale-[1.02]"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Grid View</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
              viewMode === 'table'
                ? "bg-gray-900 text-white shadow-md scale-[1.02]"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <Table className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Table View</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-20 bg-white rounded-xl border border-gray-200">
          <Loader2 className="w-10 h-10 animate-spin text-gray-900" />
          <p className="mt-4 text-gray-500 font-medium">Fetching escrow data...</p>
        </div>
      ) : filteredEscrows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
          <div className="bg-gray-50 rounded-full p-6 w-fit mx-auto mb-6">
            <Wallet className="w-12 h-12 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No escrow accounts found</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-8">
            Create your first escrow account to start managing secure payments for your loads.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all shadow-lg active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Start New Escrow
          </button>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredEscrows.map((escrow) => (
            <div key={escrow.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all overflow-hidden group">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={cn(
                        "px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase rounded-full border shadow-sm",
                        getStatusColor(escrow.status)
                      )}>
                        {escrow.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-mono text-gray-400">#ESC-{escrow.id.slice(0, 8)}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      Load ID: {escrow.loadId.slice(0, 12)}...
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedEscrow(escrow)}
                      className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-xl mb-6">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Fund</p>
                    <p className="text-lg font-bold text-gray-900">
                      {escrow.totalAmount.toLocaleString()} <span className="text-xs font-normal text-gray-500">{escrow.currencyCode}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Funded</p>
                    <p className="text-lg font-bold text-green-600">
                      {escrow.fundedAmount.toLocaleString()} <span className="text-xs font-normal text-gray-500">{escrow.currencyCode}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Released</p>
                    <p className="text-lg font-bold text-blue-600">
                      {escrow.releasedAmount.toLocaleString()} <span className="text-xs font-normal text-gray-500">{escrow.currencyCode}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Commission</p>
                    <p className="text-lg font-bold text-purple-600">
                      {escrow.commissionAmount.toLocaleString()} <span className="text-xs font-normal text-gray-500">{escrow.currencyCode}</span>
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  {escrow.status === 'PENDING' && (
                    <button
                      onClick={() => {
                        setSelectedEscrow(escrow);
                        setShowFundModal(true);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all active:scale-[0.98]"
                    >
                      <ArrowDownCircle className="w-4 h-4" />
                      Fund Now
                    </button>
                  )}
                  {(escrow.status === 'FUNDED' || escrow.status === 'PARTIALLY_RELEASED') && (
                    <button
                      onClick={() => {
                        setSelectedEscrow(escrow);
                        setShowReleaseModal(true);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all active:scale-[0.98]"
                    >
                      <ArrowUpCircle className="w-4 h-4" />
                      Release Funds
                    </button>
                  )}
                  {escrow.status === 'RELEASED' && (
                    <div className="flex-1 py-2.5 bg-gray-100 text-gray-500 rounded-lg text-center font-semibold text-sm border border-gray-200">
                      Funds Released
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Escrow / Load</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Amount</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Released</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredEscrows.map((escrow) => (
                  <tr key={escrow.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900 leading-tight">#ESC-{escrow.id.slice(0, 8)}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Package className="w-3 h-3 text-gray-300" />
                        Load: {escrow.loadId.slice(0, 12)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{escrow.totalAmount.toLocaleString()} {escrow.currencyCode}</div>
                      <div className="text-[10px] text-green-600 font-medium">Funded: {escrow.fundedAmount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-blue-600">{escrow.releasedAmount.toLocaleString()} {escrow.currencyCode}</div>
                      <div className="text-[10px] text-purple-600 font-medium">Comm: {escrow.commissionAmount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase rounded-full border shadow-sm",
                        getStatusColor(escrow.status)
                      )}>
                        {escrow.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedEscrow(escrow)}
                          className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {escrow.status === 'PENDING' && (
                          <button
                            onClick={() => {
                              setSelectedEscrow(escrow);
                              setShowFundModal(true);
                            }}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                          >
                            <ArrowDownCircle className="w-4 h-4" />
                          </button>
                        )}
                        {(escrow.status === 'FUNDED' || escrow.status === 'PARTIALLY_RELEASED') && (
                          <button
                            onClick={() => {
                              setSelectedEscrow(escrow);
                              setShowReleaseModal(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <ArrowUpCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
  const { user } = useAuth();
  const [formData, setFormData] = useState<CreateEscrowData>({
    loadId: '',
    payerId: '',
    payeeId: '',
    totalAmount: 0,
    commissionAmount: 0,
    currencyCode: 'KES',
  });
  const [loads, setLoads] = useState<any[]>([]);
  const [loadingLoads, setLoadingLoads] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchLoads = async () => {
      if (!user?.id) return;
      try {
        const response = await brokerAPI.getBrokerLoads(user.id);
        const data = response.data || response || [];
        setLoads(Array.isArray(data) ? data : []);
      } catch (err) {
        toast.error('Failed to fetch available loads');
      } finally {
        setLoadingLoads(false);
      }
    };

    fetchLoads();
  }, [user]);

  const handleLoadSelect = (loadId: string) => {
    const selectedLoad = loads.find(l => l.id === loadId);
    if (selectedLoad) {
      setFormData({
        ...formData,
        loadId,
        payerId: selectedLoad.ownerId || selectedLoad.customerId || '',
        payeeId: selectedLoad.transporterId || selectedLoad.assignedTransporterId || '',
        totalAmount: selectedLoad.price || selectedLoad.budget || 0,
      });
    } else {
      setFormData({ ...formData, loadId });
    }
  };

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900">Create Escrow Account</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6">
            <p className="text-sm text-blue-700 font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Initialize a new secure payment escrow for a specific load assignment.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Select Load</label>
            <div className="relative">
              {loadingLoads ? (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              ) : null}
              <select
                required
                value={formData.loadId}
                onChange={(e) => handleLoadSelect(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 transition-shadow outline-none appearance-none"
              >
                <option value="">Select a load assignment...</option>
                {loads.map(load => (
                  <option key={load.id} value={load.id}>
                    {load.title || `Load #${load.id.slice(0, 8)}`} - {load.origin?.city || 'Origin'} to {load.destination?.city || 'Dest'}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ArrowDownCircle className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Payer (Cargo Owner)</label>
              <select
                required
                value={formData.payerId}
                onChange={(e) => setFormData({ ...formData, payerId: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 transition-shadow outline-none appearance-none"
              >
                <option value="">Select payer...</option>
                {Array.from(new Set(loads.map(l => l.ownerId || l.customerId).filter(Boolean))).map(id => {
                  const loadWithUser = loads.find(l => (l.ownerId || l.customerId) === id);
                  return (
                    <option key={id as string} value={id as string}>
                      {loadWithUser?.ownerName || loadWithUser?.customerName || `Owner #${(id as string).slice(0, 8)}`}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Payee (Transporter)</label>
              <select
                required
                value={formData.payeeId}
                onChange={(e) => setFormData({ ...formData, payeeId: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 transition-shadow outline-none appearance-none"
              >
                <option value="">Select payee...</option>
                {Array.from(new Set(loads.map(l => l.transporterId || l.assignedTransporterId).filter(Boolean))).map(id => {
                  const loadWithUser = loads.find(l => (l.transporterId || l.assignedTransporterId) === id);
                  return (
                    <option key={id as string} value={id as string}>
                      {loadWithUser?.transporterName || loadWithUser?.carrierName || `Transporter #${(id as string).slice(0, 8)}`}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Total Amount ({formData.currencyCode})</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) })}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 transition-shadow outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Broker Commission</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.commissionAmount}
                  onChange={(e) => setFormData({ ...formData, commissionAmount: parseFloat(e.target.value) })}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 transition-shadow outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.loadId}
              className="px-10 py-3 bg-gray-900 text-white rounded-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-all shadow-xl shadow-gray-200 active:scale-95"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : 'Initialize Escrow'}
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

