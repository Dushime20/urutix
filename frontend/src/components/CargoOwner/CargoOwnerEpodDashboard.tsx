import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Calendar,
  Filter,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  DollarSign,
  XCircle,
  CreditCard,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { EpodViewer } from '../trips/EpodViewer';
import toast from 'react-hot-toast';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../EnliteUI/Tables';

interface EpodListItem {
  id: string;
  tripId: string;
  tripNumber: string;
  loadId: string;
  loadTitle: string;
  truckNumber: string;
  driverName: string;
  recipientName: string;
  status: 'PENDING' | 'CONFIRMED' | 'DISPUTED';
  submittedAt: string;
  confirmedAt?: string;
  hasSignature: boolean;
  photoCount: number;
  invoice?: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    currency: string;
    status: string;
    dueDate: string;
  };
}

interface EpodSummary {
  totalShipments: number;
  pendingConfirmations: number;
  totalAmountDue: number;
  overduePayments: number;
}

const CargoOwnerEpodDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedEpodId, setSelectedEpodId] = useState<string | null>(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeEpodId, setDisputeEpodId] = useState<string | null>(null);
  const [disputeForm, setDisputeForm] = useState({
    reason: '',
    description: '',
  });
  const [filters, setFilters] = useState({
    loadId: '',
    startDate: '',
    endDate: '',
    status: 'all',
    paymentStatus: 'all',
  });
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch ePODs
  const { data, isLoading, error } = useQuery({
    queryKey: ['cargo-owner-epods', filters, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.loadId) params.append('loadId', filters.loadId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.paymentStatus !== 'all') params.append('paymentStatus', filters.paymentStatus);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await api.get(`/cargo-owner/epods?${params.toString()}`);
      return response.data.data;
    },
  });

  // Dispute mutation
  const disputeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.post(`/cargo-owner/epods/${id}/dispute`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('ePOD disputed successfully. The truck owner has been notified.');
      queryClient.invalidateQueries({ queryKey: ['cargo-owner-epods'] });
      setShowDisputeModal(false);
      setDisputeForm({ reason: '', description: '' });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to dispute ePOD');
    },
  });

  const epods: EpodListItem[] = data?.epods || [];
  const summary: EpodSummary = data?.summary || {
    totalShipments: 0,
    pendingConfirmations: 0,
    totalAmountDue: 0,
    overduePayments: 0,
  };
  const pagination = data?.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 };

  const statusConfig = {
    PENDING: { label: 'Pending', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: Clock },
    CONFIRMED: { label: 'Confirmed', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
    DISPUTED: { label: 'Disputed', color: 'text-red-600 bg-red-50 border-red-200', icon: AlertTriangle },
  };

  const paymentStatusConfig = {
    draft: { label: 'Draft', color: 'text-slate-600 bg-slate-50' },
    sent: { label: 'Sent', color: 'text-blue-600 bg-blue-50' },
    paid: { label: 'Paid', color: 'text-emerald-600 bg-emerald-50' },
    overdue: { label: 'Overdue', color: 'text-red-600 bg-red-50' },
  };

  const handleDispute = (epodId: string) => {
    setDisputeEpodId(epodId);
    setShowDisputeModal(true);
  };

  const handleSubmitDispute = () => {
    if (!disputeEpodId) return;
    if (!disputeForm.reason || !disputeForm.description) {
      toast.error('Please fill in all fields');
      return;
    }
    disputeMutation.mutate({ id: disputeEpodId, data: disputeForm });
  };

  const handleExport = () => {
    toast.success('Export functionality coming soon!');
  };

  const handlePayInvoice = (invoiceId: string) => {
    toast.success('Payment functionality coming soon!');
  };

  const epodColumns: Column<EpodListItem>[] = useMemo(() => [
    {
      key: 'tripNumber',
      label: 'Trip',
      sortable: true,
      render: (_, epod) => <p className="text-sm font-semibold text-slate-900">{epod.tripNumber}</p>,
    },
    {
      key: 'loadTitle',
      label: 'Shipment',
      sortable: true,
      render: (_, epod) => <p className="text-sm text-slate-600 max-w-xs truncate">{epod.loadTitle}</p>,
    },
    {
      key: 'truckNumber',
      label: 'Carrier',
      sortable: true,
      render: (_, epod) => (
        <>
          <p className="text-sm text-slate-600">{epod.truckNumber}</p>
          <p className="text-xs text-slate-400">{epod.driverName}</p>
        </>
      ),
    },
    {
      key: 'recipientName',
      label: 'Recipient',
      sortable: true,
      render: (_, epod) => <p className="text-sm text-slate-600">{epod.recipientName}</p>,
    },
    {
      key: 'submittedAt',
      label: 'Delivered',
      sortable: true,
      render: (_, epod) => (
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-slate-400" />
          <p className="text-sm text-slate-600">{new Date(epod.submittedAt).toLocaleDateString()}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_, epod) => {
        const StatusIcon = statusConfig[epod.status].icon;
        const variant = epod.status === 'PENDING' ? 'warning' : epod.status === 'CONFIRMED' ? 'success' : 'error';
        return (
          <StatusBadge
            label={statusConfig[epod.status].label}
            variant={variant}
            icon={<StatusIcon size={12} />}
          />
        );
      },
    },
    {
      key: 'invoice',
      label: 'Invoice',
      render: (_, epod) =>
        epod.invoice ? (
          <div>
            <p className="text-sm font-semibold text-slate-900">${epod.invoice.totalAmount.toLocaleString()}</p>
            <StatusBadge
              label={paymentStatusConfig[epod.invoice.status as keyof typeof paymentStatusConfig]?.label || epod.invoice.status}
              status={epod.invoice.status}
            />
          </div>
        ) : (
          <p className="text-xs text-slate-400">No invoice</p>
        ),
    },
  ], []);

  const epodRowActions: TableAction<EpodListItem>[] = useMemo(() => [
    {
      key: 'view',
      label: 'View',
      icon: <Eye size={14} />,
      onClick: (epod) => setSelectedEpodId(epod.tripId),
    },
    {
      key: 'dispute',
      label: 'Dispute',
      icon: <XCircle size={14} />,
      variant: 'danger',
      hidden: (epod) => epod.status !== 'PENDING',
      onClick: (epod) => handleDispute(epod.id),
    },
    {
      key: 'pay',
      label: 'Pay',
      icon: <CreditCard size={14} />,
      variant: 'success',
      hidden: (epod) => !epod.invoice || epod.invoice.status === 'paid',
      onClick: (epod) => handlePayInvoice(epod.invoice!.id),
    },
  ], []);

  if (selectedEpodId) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedEpodId(null)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          ← Back to Delivery Reports
        </button>
        <EpodViewer tripId={selectedEpodId} canConfirm={true} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Delivery Reports</h1>
          <p className="text-sm text-slate-500 mt-1">View and confirm delivery proof for your shipments</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <Download size={16} />
          Export
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Package size={20} className="text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{summary.totalShipments}</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Deliveries</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock size={20} className="text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{summary.pendingConfirmations}</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Confirmation</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <DollarSign size={20} className="text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">${summary.totalAmountDue.toLocaleString()}</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount Due</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{summary.overduePayments}</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overdue Payments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-slate-400" />
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">ePOD Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="DISPUTED">Disputed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Payment Status</label>
            <select
              value={filters.paymentStatus}
              onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Payments</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ loadId: '', startDate: '', endDate: '', status: 'all', paymentStatus: 'all' })}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* ePOD List */}
      <StandardDataTable<EpodListItem>
        embedded
        searchable={false}
        columnVisibility={false}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden px-4 py-4"
        columns={epodColumns}
        data={epods}
        loading={isLoading}
        error={error ? 'Failed to load delivery reports' : null}
        getRowId={(row) => row.id}
        pagination={pagination.total > 0}
        page={page}
        pageSize={limit}
        pageSizeOptions={[20]}
        totalItems={pagination.total}
        onPageChange={setPage}
        rowActions={epodRowActions}
        stickyHeader
        emptyMessage="No delivery reports found — try adjusting your filters"
        ariaLabel="Delivery reports"
      />

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900">Dispute Delivery</h3>
              <button
                onClick={() => setShowDisputeModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Reason</label>
                <select
                  value={disputeForm.reason}
                  onChange={(e) => setDisputeForm({ ...disputeForm, reason: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a reason</option>
                  <option value="Damaged Goods">Damaged Goods</option>
                  <option value="Missing Items">Missing Items</option>
                  <option value="Wrong Items">Wrong Items</option>
                  <option value="Late Delivery">Late Delivery</option>
                  <option value="Incomplete Delivery">Incomplete Delivery</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <textarea
                  value={disputeForm.description}
                  onChange={(e) => setDisputeForm({ ...disputeForm, description: e.target.value })}
                  rows={4}
                  placeholder="Please provide details about the issue..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={() => setShowDisputeModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitDispute}
                  disabled={disputeMutation.isPending}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {disputeMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Dispute'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CargoOwnerEpodDashboard;
