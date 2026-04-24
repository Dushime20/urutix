import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { paymentsAPI } from '../../services/api';
import { CheckCircle, Download, Eye, TrendingUp } from 'lucide-react';
import { formatCurrency, formatDate } from '../Payments/utils';

interface ReceivedPayment {
  id: string;
  amount: number;
  currency: string;
  receivedDate: Date;
  source: 'BIDDING' | 'CARGO_SHIPMENT';
  referenceNumber: string;
  description: string;
  trip?: {
    id: string;
    tripNumber: string;
  };
  cargo?: {
    id: string;
    cargoNumber: string;
  };
}

const ReceivedPaymentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState<'ALL' | 'BIDDING' | 'CARGO_SHIPMENT'>('ALL');

  // Fetch payments received by truck owner
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['received-payments', searchTerm],
    queryFn: () => paymentsAPI.getAll({ search: searchTerm, type: 'RECEIVED' }),
  });

  // Process received payments
  const receivedPayments = useMemo(() => {
    if (!paymentsData?.data?.payments) return [];

    const payments = paymentsData.data.payments;
    const received: ReceivedPayment[] = [];

    payments.forEach((payment: any) => {
      if (payment.status === 'COMPLETED' && payment.direction === 'INCOMING') {
        received.push({
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency || 'USD',
          receivedDate: new Date(payment.processedAt || payment.createdAt),
          source: payment.source || 'CARGO_SHIPMENT',
          referenceNumber: payment.referenceNumber || `RCV-${payment.id.slice(0, 8)}`,
          description: payment.description || `Payment for ${payment.trip?.tripNumber || 'service'}`,
          trip: payment.trip,
          cargo: payment.cargo,
        });
      }
    });

    return received;
  }, [paymentsData]);

  // Apply filters
  const filteredPayments = useMemo(() => {
    let filtered = receivedPayments;

    // Apply source filter
    if (filterSource !== 'ALL') {
      filtered = filtered.filter(p => p.source === filterSource);
    }

    // Apply search
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.referenceNumber.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.amount.toString().includes(query)
      );
    }

    return filtered;
  }, [receivedPayments, filterSource, searchTerm]);

  // Calculate summary
  const summary = useMemo(() => {
    const total = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const fromBidding = filteredPayments.filter(p => p.source === 'BIDDING').reduce((sum, p) => sum + p.amount, 0);
    const fromCargo = filteredPayments.filter(p => p.source === 'CARGO_SHIPMENT').reduce((sum, p) => sum + p.amount, 0);

    return { total, fromBidding, fromCargo, count: filteredPayments.length };
  }, [filteredPayments]);

  const handleViewDetails = (id: string) => {
    toast.success('Opening payment details...');
  };

  const handleDownloadReceipt = (id: string) => {
    toast.success('Downloading receipt...');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50 rounded-2xl border-2 border-emerald-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Total Received</span>
          </div>
          <p className="text-3xl font-black text-emerald-900">{formatCurrency(summary.total)}</p>
          <p className="text-xs font-bold text-emerald-600 mt-1">{summary.count} payments</p>
        </div>

        <div className="bg-blue-50 rounded-2xl border-2 border-blue-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">From Bidding</span>
          </div>
          <p className="text-2xl font-black text-blue-900">{formatCurrency(summary.fromBidding)}</p>
        </div>

        <div className="bg-purple-50 rounded-2xl border-2 border-purple-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">From Cargo</span>
          </div>
          <p className="text-2xl font-black text-purple-900">{formatCurrency(summary.fromCargo)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by reference, amount, or description..."
          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value as any)}
        >
          <option value="ALL">All Sources</option>
          <option value="BIDDING">From Bidding</option>
          <option value="CARGO_SHIPMENT">From Cargo</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-widest">Date</th>
              <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-widest">Source</th>
              <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-widest">Description</th>
              <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-widest">Amount</th>
              <th className="px-6 py-4 text-right text-xs font-black text-slate-600 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-400">No received payments found</p>
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-900">{formatDate(payment.receivedDate)}</div>
                    <div className="text-xs font-medium text-slate-400">{payment.referenceNumber}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                      payment.source === 'BIDDING' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {payment.source === 'BIDDING' ? 'Bidding' : 'Cargo Shipment'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-700">{payment.description}</div>
                    {payment.trip && (
                      <div className="text-xs font-bold text-slate-400 mt-1">Trip: {payment.trip.tripNumber}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-lg font-black text-emerald-600">{formatCurrency(payment.amount)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewDetails(payment.id)}
                        className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDownloadReceipt(payment.id)}
                        className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-600 transition-colors"
                        title="Download Receipt"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReceivedPaymentsPage;
