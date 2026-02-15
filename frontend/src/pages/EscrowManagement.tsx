import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import AdminPageLayout from '../components/Admin/AdminPageLayout';

interface EscrowAccount {
  id: string;
  tripId: string;
  cargoOwner: string;
  truckOwner: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'ACTIVE' | 'RELEASED' | 'DISPUTED' | 'CANCELLED';
  createdAt: string;
  releaseCondition: string;
  releaseDate?: string;
  disputeReason?: string;
}

const EscrowManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowAccount | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Mock data - replace with actual API call
  const escrowAccounts: EscrowAccount[] = [
    {
      id: 'ESC-001',
      tripId: 'TRP-2024-001',
      cargoOwner: 'ABC Logistics Ltd',
      truckOwner: 'XYZ Transport Co',
      amount: 2500.00,
      currency: 'USD',
      status: 'ACTIVE',
      createdAt: '2024-02-10T10:30:00Z',
      releaseCondition: 'Delivery Confirmed',
    },
    {
      id: 'ESC-002',
      tripId: 'TRP-2024-002',
      cargoOwner: 'Global Shipping Inc',
      truckOwner: 'Fast Freight LLC',
      amount: 3750.00,
      currency: 'USD',
      status: 'RELEASED',
      createdAt: '2024-02-08T14:20:00Z',
      releaseCondition: 'Delivery Confirmed',
      releaseDate: '2024-02-11T09:15:00Z',
    },
    {
      id: 'ESC-003',
      tripId: 'TRP-2024-003',
      cargoOwner: 'Metro Cargo Services',
      truckOwner: 'Prime Movers Ltd',
      amount: 1850.00,
      currency: 'USD',
      status: 'DISPUTED',
      createdAt: '2024-02-09T08:45:00Z',
      releaseCondition: 'Delivery Confirmed',
      disputeReason: 'Damaged goods reported',
    },
    {
      id: 'ESC-004',
      tripId: 'TRP-2024-004',
      cargoOwner: 'Express Cargo Hub',
      truckOwner: 'Swift Transport',
      amount: 4200.00,
      currency: 'USD',
      status: 'PENDING',
      createdAt: '2024-02-12T11:00:00Z',
      releaseCondition: 'Awaiting Pickup Confirmation',
    },
  ];

  const stats = {
    totalEscrow: escrowAccounts.reduce((sum, acc) => sum + acc.amount, 0),
    activeAccounts: escrowAccounts.filter(acc => acc.status === 'ACTIVE').length,
    pendingRelease: escrowAccounts.filter(acc => acc.status === 'PENDING').length,
    disputes: escrowAccounts.filter(acc => acc.status === 'DISPUTED').length,
  };

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
      account.tripId.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <AdminPageLayout
      title="Escrow Management"
      description="Monitor and manage secure payment escrow accounts"
      actions={
        <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-all duration-200 text-sm font-bold">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      }
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-50"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <Banknote className="w-5 h-5" />
              </div>
              <LineChart className="w-4 h-4 text-blue-400 opacity-50" />
            </div>
            <div className="text-2xl font-black text-gray-900 mb-1 tracking-tight">
              {formatCurrency(stats.totalEscrow, 'USD')}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total in Escrow</div>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent opacity-50"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-wider">
                Active
              </span>
            </div>
            <div className="text-2xl font-black text-gray-900 mb-1 tracking-tight">
              {stats.activeAccounts}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Accounts</div>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-transparent opacity-50"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-black text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg uppercase tracking-wider">
                Pending
              </span>
            </div>
            <div className="text-2xl font-black text-gray-900 mb-1 tracking-tight">
              {stats.pendingRelease}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Release</div>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-transparent opacity-50"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-lg uppercase tracking-wider">
                Alert
              </span>
            </div>
            <div className="text-2xl font-black text-gray-900 mb-1 tracking-tight">
              {stats.disputes}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Disputed Accounts</div>
          </div>
        </div>
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
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="ACTIVE">Active</option>
                <option value="RELEASED">Released</option>
                <option value="DISPUTED">Disputed</option>
                <option value="CANCELLED">Cancelled</option>
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
                  Escrow ID
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Trip ID
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Parties
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Created
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Actions
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
                    <p className="text-gray-500 text-sm font-medium">No escrow accounts found</p>
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
                        {formatCurrency(account.amount, account.currency)}
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
      {showDetailsModal && selectedEscrow && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Escrow Details</h2>
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
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500 block mb-0.5">Status</span>
                    <span className="text-sm font-bold text-gray-900">{selectedEscrow.status}</span>
                  </div>
                </div>
                {selectedEscrow.disputeReason && (
                  <div className="mt-3 pt-3 border-t border-red-100 text-sm text-red-700">
                    <span className="font-bold">Reason:</span> {selectedEscrow.disputeReason}
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Escrow Amount</div>
                <div className="text-4xl font-black text-gray-900">
                  {formatCurrency(selectedEscrow.amount, selectedEscrow.currency)}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Truck className="w-3 h-3" />
                    Trip ID
                  </div>
                  <div className="font-bold text-gray-900 font-mono text-sm bg-gray-50 px-3 py-2 rounded-lg inline-block border border-gray-100">
                    {selectedEscrow.tripId}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    Created On
                  </div>
                  <div className="font-bold text-gray-900 text-sm">
                    {formatDate(selectedEscrow.createdAt)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Package className="w-3 h-3" />
                    Cargo Owner
                  </div>
                  <div className="font-bold text-gray-900 text-sm">
                    {selectedEscrow.cargoOwner}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Truck className="w-3 h-3" />
                    Truck Owner
                  </div>
                  <div className="font-bold text-gray-900 text-sm">
                    {selectedEscrow.truckOwner}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Release Condition</div>
                  <div className="font-medium text-gray-700 text-sm bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {selectedEscrow.releaseCondition}
                  </div>
                </div>
                {selectedEscrow.releaseDate && (
                  <div className="col-span-2">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Released On</div>
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
                    Release Funds
                  </button>
                  <button className="flex-1 bg-white
                   text-red-600 border border-red-100 py-3 rounded-xl hover:bg-red-50 transition-all font-bold text-sm flex items-center justify-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Raise Dispute
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default EscrowManagement;
