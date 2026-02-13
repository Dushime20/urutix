import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FaFileInvoiceDollar, FaSearch, FaFilter, FaPlus,
  FaEye, FaDownload, FaPaperPlane, FaEdit, FaTrash
} from 'react-icons/fa';
import { billingApi, type Invoice } from '../../../services/billingApi';

interface InvoicesTabProps {
  tenantId: string;
}

const InvoicesTab: React.FC<InvoicesTabProps> = ({ tenantId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data: invoicesData, isLoading, refetch } = useQuery({
    queryKey: ['invoices', statusFilter, currentPage],
    queryFn: () => billingApi.getInvoices({
      status: statusFilter !== 'ALL' ? statusFilter : undefined
    })
  });

  const invoices = invoicesData?.data || [];
  const filteredInvoices = invoices.filter(inv =>
    inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: invoices.length,
    draft: invoices.filter(i => i.status === 'draft').length,
    sent: invoices.filter(i => i.status === 'sent').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    overdue: invoices.filter(i => i.status === 'overdue').length
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-yellow-100 text-yellow-800'
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  const handleDownload = async (invoice: Invoice) => {
    try {
      const blob = await billingApi.exportBillingData('pdf', 'invoices');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Total Invoices</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Draft</p>
          <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Sent</p>
          <p className="text-2xl font-bold text-blue-600">{stats.sent}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Paid</p>
          <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Overdue</p>
          <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice number or customer..."
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
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          <FaPlus className="mr-2" />
          Create Invoice
        </button>
      </div>

      {/* Invoice List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FaFileInvoiceDollar className="mx-auto text-4xl text-gray-400 mb-3" />
          <p className="text-gray-600">No invoices found</p>
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
                    Issue Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
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
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{invoice.customerName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(invoice.issueDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        ${invoice.totalAmount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(invoice.status)}`}>
                        {invoice.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          title="View"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => handleDownload(invoice)}
                          className="text-green-600 hover:text-green-900"
                          title="Download"
                        >
                          <FaDownload />
                        </button>
                        {invoice.status === 'draft' && (
                          <>
                            <button
                              className="text-purple-600 hover:text-purple-900"
                              title="Send"
                            >
                              <FaPaperPlane />
                            </button>
                            <button
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing {Math.min((currentPage - 1) * pageSize + 1, filteredInvoices.length)} to{' '}
              {Math.min(currentPage * pageSize, filteredInvoices.length)} of {filteredInvoices.length} invoices
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
                disabled={currentPage * pageSize >= filteredInvoices.length}
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

export default InvoicesTab;
