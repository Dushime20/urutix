import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Unlock,
  Search,
  Filter,
  Download,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Banknote,
  Truck,
  Package,
  LineChart,
  Calendar,
  X,
  RefreshCw,
  Loader2
} from 'lucide-react';
import AdminPageLayout from '../components/Admin/AdminPageLayout';
import { TranslatedText } from '../components/translated-text';
import { adminAPI } from '../services/adminApi';
import { StatCard } from '../components/EnliteUI';
import { useCurrencyFormat } from '../hooks/useCurrencyFormat';

interface EscrowAccount {
  id: string;
  source: 'escrow' | 'trip';
  tripId?: string;
  loadId?: string;
  tenantId?: string;
  tenantName?: string;
  cargoOwner: string;
  truckOwner: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'ACTIVE' | 'RELEASED' | 'DISPUTED' | 'CANCELLED';
  createdAt: string;
  releaseCondition: string;
  releaseDate?: string | null;
  isDisputed?: boolean;
}

interface EscrowStats {
  totalInEscrow: number;
  totalAccounts: number;
  activeAccounts: number;
  pendingRelease: number;
  releasedAccounts: number;
  disputedAccounts: number;
}

const EscrowManagement: React.FC = () => {
  const { compact: fmtMoney, format: fmtFull } = useCurrencyFormat();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowAccount | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [escrowAccounts, setEscrowAccounts] = useState<EscrowAccount[]>([]);
  const [stats, setStats] = useState<EscrowStats>({
    totalInEscrow: 0,
    totalAccounts: 0,
    activeAccounts: 0,
    pendingRelease: 0,
    releasedAccounts: 0,
    disputedAccounts: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminAPI.getEscrow();
      const data = res.data?.data || res.data;
      setEscrowAccounts(data?.escrowAccounts || []);
      if (data?.stats) setStats(data.stats);
    } catch (err: any) {
      console.error('Error fetching escrow data:', err);
      setError(err.response?.data?.message || 'Failed to load escrow data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800';
      case 'RELEASED':
        return 'bg-green-100 text-green-800';
      case 'DISPUTED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Lock className="w-3 h-3" />;
      case 'RELEASED':
        return <CheckCircle className="w-3 h-3" />;
      case 'DISPUTED':
        return <AlertTriangle className="w-3 h-3" />;
      case 'PENDING':
        return <Clock className="w-3 h-3" />;
      case 'CANCELLED':
        return <XCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const filteredAccounts = escrowAccounts.filter(account => {
    const matchesSearch =
      account.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (account.tripId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.cargoOwner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.truckOwner.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || account.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (escrow: EscrowAccount) => {
    setSelectedEscrow(escrow);
    setShowDetailsModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AdminPageLayout
      title={<TranslatedText text="Escrow Management" />}
      description={<TranslatedText text="Monitor and manage secure payment escrow accounts" />}
      actions={
        <button
          onClick={fetchData}
          className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-all duration-200 text-sm font-bold"
        >
          <RefreshCw className="w-4 h-4" />
          <TranslatedText text="Refresh" />
        </button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center h-64 gap-3">
          <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
          <span className="text-gray-600 font-medium">Loading escrow data...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-4">
          <XCircle className="w-6 h-6 text-red-500 shrink-0" />
          <div>
            <p className="font-bold text-red-800 text-sm">Failed to load escrow data</p>
            <p className="text-red-600 text-xs mt-1">{error}</p>
          </div>
          <button onClick={fetchData} className="ml-auto bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg text-sm font-bold">
            Retry
          </button>
        </div>
      ) : (
      <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title={<TranslatedText text="Total in Escrow" />}
          value={fmtMoney(stats.totalInEscrow)}
          icon={<Banknote className="w-5 h-5" />}
          color="primary"
          variant="classic"
        />
        <StatCard
          title={<TranslatedText text="Active Accounts" />}
          value={stats.activeAccounts}
          icon={<Lock className="w-5 h-5" />}
          color="primary"
          variant="classic"
        />
        <StatCard
          title={<TranslatedText text="Pending Release" />}
          value={stats.pendingRelease}
          icon={<Clock className="w-5 h-5" />}
          color="primary"
          variant="classic"
        />
        <StatCard
          title={<TranslatedText text="Disputed Accounts" />}
          value={stats.disputedAccounts}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="primary"
          variant="classic"
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by ID, trip, cargo owner, or truck owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium"
            />
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium appearance-none cursor-pointer"
              >
                <option value="ALL"><TranslatedText text="All Status" /></option>
                <option value="PENDING"><TranslatedText text="Pending" /></option>
                <option value="ACTIVE"><TranslatedText text="Active" /></option>
                <option value="RELEASED"><TranslatedText text="Released" /></option>
                <option value="DISPUTED"><TranslatedText text="Disputed" /></option>
                <option value="CANCELLED"><TranslatedText text="Cancelled" /></option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Escrow Accounts Table */}
      <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <TranslatedText text="Escrow ID" />
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <TranslatedText text="Trip ID" />
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <TranslatedText text="Parties" />
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <TranslatedText text="Amount" />
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <TranslatedText text="Status" />
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <TranslatedText text="Created" />
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <TranslatedText text="Actions" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Shield className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium"><TranslatedText text="No escrow accounts found" /></p>
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                          <Shield className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-gray-900">{account.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600 font-mono">{account.tripId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Package className="w-3 h-3 text-indigo-500" />
                          <span className="text-gray-900 font-bold text-xs">{account.cargoOwner}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Truck className="w-3 h-3 text-emerald-500" />
                          <span className="text-gray-600 font-medium text-xs">{account.truckOwner}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-black text-gray-900">
                        {fmtFull(account.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${getStatusColor(account.status)}`}>
                        {getStatusIcon(account.status)}
                        {account.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-500">
                      {formatDate(account.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetails(account)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedEscrow && (        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900"><TranslatedText text="Escrow Details" /></h2>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{selectedEscrow.id}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Status Banner */}
              <div className={`p-4 rounded-xl border ${selectedEscrow.status === 'DISPUTED' ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedEscrow.status === 'DISPUTED' ? 'bg-red-100 text-red-600' : 'bg-white text-gray-600'}`}>
                    {getStatusIcon(selectedEscrow.status)}
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500 block mb-0.5"><TranslatedText text="Status" /></span>
                    <span className="text-sm font-bold text-gray-900">{selectedEscrow.status}</span>
                  </div>
                </div>
                {selectedEscrow.isDisputed && (
                  <div className="mt-3 pt-3 border-t border-red-100 text-sm text-red-700">
                    <span className="font-bold"><TranslatedText text="Status" />:</span> Disputed
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2"><TranslatedText text="Escrow Amount" /></div>
                <div className="text-4xl font-black text-gray-900">
                  {fmtFull(selectedEscrow.amount)}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Truck className="w-3 h-3" />
                    <TranslatedText text="Trip ID" />
                  </div>
                  <div className="font-bold text-gray-900 font-mono text-sm bg-gray-50 px-3 py-2 rounded-lg inline-block border border-gray-100">
                    {selectedEscrow.tripId || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    <TranslatedText text="Created On" />
                  </div>
                  <div className="font-bold text-gray-900 text-sm">
                    {formatDate(selectedEscrow.createdAt)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Package className="w-3 h-3" />
                    <TranslatedText text="Cargo Owner" />
                  </div>
                  <div className="font-bold text-gray-900 text-sm">
                    {selectedEscrow.cargoOwner}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Truck className="w-3 h-3" />
                    <TranslatedText text="Truck Owner" />
                  </div>
                  <div className="font-bold text-gray-900 text-sm">
                    {selectedEscrow.truckOwner}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5"><TranslatedText text="Release Condition" /></div>
                  <div className="font-medium text-gray-700 text-sm bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {selectedEscrow.releaseCondition}
                  </div>
                </div>
                {selectedEscrow.releaseDate && (
                  <div className="col-span-2">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5"><TranslatedText text="Released On" /></div>
                    <div className="font-bold text-green-600 text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {formatDate(selectedEscrow.releaseDate)}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              {selectedEscrow.status === 'ACTIVE' && (
                <div className="flex gap-3 pt-6 border-t border-gray-100">
                  <button className="flex-1 bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 transition-all font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-200">
                    <Unlock className="w-4 h-4" />
                    <TranslatedText text="Release Funds" />
                  </button>
                  <button className="flex-1 bg-white
                   text-red-600 border border-red-100 py-3 rounded-xl hover:bg-red-50 transition-all font-bold text-sm flex items-center justify-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <TranslatedText text="Raise Dispute" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </AdminPageLayout>
  );
};

export default EscrowManagement;
