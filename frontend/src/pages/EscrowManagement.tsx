import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Lock,
  Unlock,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Truck,
  Package,
  Calendar,
  X,
  RefreshCw,
  Loader2
} from 'lucide-react';
import AdminPageLayout from '../components/Admin/AdminPageLayout';
import { TranslatedText } from '../components/translated-text';
import { adminAPI } from '../services/adminApi';
import { useCurrencyFormat } from '../hooks/useCurrencyFormat';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../components/EnliteUI/Tables';

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

const EscrowManagement: React.FC = () => {
  const { format: fmtFull } = useCurrencyFormat();
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowAccount | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [escrowAccounts, setEscrowAccounts] = useState<EscrowAccount[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminAPI.getEscrow();
      const data = res.data?.data || res.data;
      setEscrowAccounts(data?.escrowAccounts || []);
    } catch (err: any) {
      console.error('Error fetching escrow data:', err);
      setError(err.response?.data?.message || 'Failed to load escrow data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

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

  const columns: Column<EscrowAccount>[] = useMemo(() => [
    {
      key: 'id',
      label: 'Escrow ID',
      alwaysVisible: true,
      render: (_v, account) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-gray-900">{account.id}</span>
        </div>
      ),
    },
    {
      key: 'tripId',
      label: 'Trip ID',
      render: (_v, account) => (
        <div className="flex items-center gap-2">
          <Truck className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm font-medium text-gray-600 font-mono">{account.tripId}</span>
        </div>
      ),
    },
    {
      key: 'cargoOwner',
      label: 'Parties',
      render: (_v, account) => (
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
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (_v, account) => (
        <span className="text-sm font-black text-gray-900">{fmtFull(account.amount)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_v, account) => (
        <StatusBadge
          status={account.status}
          label={account.status}
          icon={getStatusIcon(account.status)}
        />
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (_v, account) => (
        <span className="text-xs font-medium text-gray-500">{formatDate(account.createdAt)}</span>
      ),
    },
  ], [fmtFull]);

  const rowActions: TableAction<EscrowAccount>[] = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: <Eye className="w-4 h-4" />,
      onClick: handleViewDetails,
    },
  ], []);

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
      <StandardDataTable
        columns={columns}
        data={escrowAccounts}
        getRowId={(row) => row.id}
        searchPlaceholder="Search by ID, trip, cargo owner, or truck owner..."
        searchKeys={['id', 'tripId', 'cargoOwner', 'truckOwner']}
        filters={[
          {
            key: 'status',
            label: 'Status',
            allValue: 'ALL',
            options: [
              { value: 'PENDING', label: 'Pending' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'RELEASED', label: 'Released' },
              { value: 'DISPUTED', label: 'Disputed' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ],
          },
        ]}
        defaultSortKey="createdAt"
        defaultSortDirection="desc"
        rowActions={rowActions}
        onRefresh={fetchData}
        emptyMessage="No escrow accounts found"
        pagination
        columnVisibility
        stickyHeader
        ariaLabel="Escrow accounts"
      />

      {/* Details Modal */}
      {showDetailsModal && selectedEscrow && (        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pb-24 lg:pb-8">
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
