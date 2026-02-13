import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FaCreditCard, FaSearch, FaPlus, FaEye, FaUndo, FaCheckCircle, FaClock, FaTimesCircle
} from 'react-icons/fa';
import { billingApi, type Payment } from '../../../services/billingApi';

interface PaymentsTabProps {
  tenantId: string;
}

const PaymentsTab: React.FC<PaymentsTabProps> = ({ tenantId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['payments', statusFilter, currentPage],
    queryFn: () => billingApi.getPayments({
      status: statusFilter !== 'ALL' ? statusFilter : undefined
    })
  });

  const payments = paymentsData?.data || [];
  const filteredPayments = payments.filter(payment =>
    payment.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: payments.length,
    pending: payments.filter(p => p.status === 'pending').length,
    completed: payments.filter(p => p.status === 'completed').length,
    failed: payments.filter(p => p.status === 'failed').length,
    totalAmount: payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: FaClock },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: FaCheckCircle },
      failed: { bg: 'bg-red-100', text: 'text-red-800', icon: FaTimesCircle },
      refunded: { bg: 'bg-gray-100', text: 'text-gray-800', icon: FaUndo }
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const getPaymentMethodIcon = (method: string) => {
    return <FaCreditCard className="text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Total Payments</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-2xl font-bold text-gray-900">${stats.totalAmount.toFixed(2)}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice, customer, or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="ALL">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>

        <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          <FaPlus className="mr-2" />
          Record Payment
        </button>
      </div>

      {/* Payment List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FaCreditCard className="mx-auto text-4xl text-gray-400 mb-3" />
          <p className="text-gray-600">No payments found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => {
                  const statusBadge = getStatusBadge(payment.status);
                  const StatusIcon = statusBadge.icon;
                  
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{payment.invoiceNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{payment.customerName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(payment.paymentDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getPaymentMethodIcon(payment.paymentMethod)}
                          <span className="text-sm text-gray-900 capitalize">
                            {payment.paymentMethod.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{payment.referenceNumber || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          ${payment.amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${statusBadge.bg} ${statusBadge.text}`}>
                          <StatusIcon className="mr-1" />
                          {payment.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          {payment.status === 'completed' && (
                            <button
                              className="text-red-600 hover:text-red-900"
                              title="Refund"
                            >
                              <FaUndo />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing {Math.min((currentPage - 1) * pageSize + 1, filteredPayments.length)} to{' '}
              {Math.min(currentPage * pageSize, filteredPayments.length)} of {filteredPayments.length} payments
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage * pageSize >= filteredPayments.length}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsTab;
