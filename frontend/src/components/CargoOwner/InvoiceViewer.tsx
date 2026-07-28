import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FaFileInvoice, 
  FaDownload, 
  FaPrint, 
  FaCheckCircle, 
  FaClock,
  FaTimesCircle,
  FaCalendarAlt,
  FaDollarSign,
  FaBox,
  FaTruck,
  FaEye,
} from 'react-icons/fa';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  senderId?: string;
  senderName?: string;
  tripId?: string;
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  paymentTerms: string;
  paymentMethod?: string;
  paidDate?: string;
  notes?: string;
  items?: InvoiceItem[];
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  type: string;
  notes?: string;
}

const InvoiceViewer: React.FC = () => {
  const { format: formatCurrency, compact: fmtMoney, compactIn: fmtIn } = useCurrencyFormat();
  const { user } = useAuth();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const { data: invoices, isLoading, refetch } = useQuery({
    queryKey: ['cargo-owner-invoices', user?.id],
    queryFn: async () => {
      const response = await api.get('/financial/invoices', {
        params: {
          customerId: user?.id,
        },
      });
      return response.data.data?.invoices || [];
    },
    enabled: !!user?.id,
  });

  const handleDownload = async (invoice: Invoice) => {
    try {
      toast.success('Downloading invoice...');
      // TODO: Implement PDF download
      console.log('Download invoice:', invoice);
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  const handlePrint = (invoice: Invoice) => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { color: 'bg-green-100 text-green-800', icon: FaCheckCircle },
      sent: { color: 'bg-blue-100 text-blue-800', icon: FaClock },
      overdue: { color: 'bg-red-100 text-red-800', icon: FaTimesCircle },
      draft: { color: 'bg-gray-100 text-gray-800', icon: FaClock },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: FaTimesCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 ${config.color}`}>
        <Icon className="w-3 h-3" />
        {status.toUpperCase()}
      </span>
    );
  };

  // formatCurrency provided by useCurrencyFormat hook

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <FaFileInvoice className="w-8 h-8 text-primary-600" />
              Invoices
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              View and manage your payment invoices
            </p>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
        {!invoices || invoices.length === 0 ? (
          <div className="p-12 text-center">
            <FaFileInvoice className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Invoices Found</h3>
            <p className="text-sm text-gray-600">
              You don't have any invoices yet. Invoices will appear here when lenders make payments for your cargo.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {invoices.map((invoice: Invoice) => (
              <div
                key={invoice.id}
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedInvoice(invoice)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {invoice.invoiceNumber}
                      </h3>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <FaCalendarAlt className="w-4 h-4" />
                        <span>Issued: {formatDate(invoice.issueDate)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <FaDollarSign className="w-4 h-4" />
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(invoice.totalAmount, invoice.currency)}
                        </span>
                      </div>
                      {invoice.paymentMethod && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <span>Method: {invoice.paymentMethod}</span>
                        </div>
                      )}
                      {invoice.paidDate && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <FaCheckCircle className="w-4 h-4 text-green-600" />
                          <span>Paid: {formatDate(invoice.paidDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedInvoice(invoice);
                      }}
                      className="px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-2"
                      title="View Detail"
                    >
                      <FaEye className="w-4 h-4" />
                      View Detail
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(invoice);
                      }}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Download"
                    >
                      <FaDownload className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrint(invoice);
                      }}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Print"
                    >
                      <FaPrint className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">
                  Invoice {selectedInvoice.invoiceNumber}
                </h3>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimesCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Invoice Details */}
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">From (Sender)</h4>
                  <p className="text-gray-900 font-medium">{selectedInvoice.senderName || 'Carrier'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To</h4>
                  <p className="text-gray-900 font-medium">{selectedInvoice.customerName}</p>
                </div>
                <div className="text-right">
                  <div className="mb-2">{getStatusBadge(selectedInvoice.status)}</div>
                  <div className="text-sm text-gray-600">
                    <p>Issue Date: {formatDate(selectedInvoice.issueDate)}</p>
                    <p>Due Date: {formatDate(selectedInvoice.dueDate)}</p>
                  </div>
                </div>
              </div>

              {/* Invoice Items */}
              {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-4">Items</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Quantity</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Unit Price</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedInvoice.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3 text-gray-900">{item.description}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                            <td className="px-4 py-3 text-right text-gray-600">
                              {formatCurrency(item.unitPrice, selectedInvoice.currency)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">
                              {formatCurrency(item.totalPrice, selectedInvoice.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Invoice Summary */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(selectedInvoice.subtotal, selectedInvoice.currency)}</span>
                    </div>
                    {selectedInvoice.taxAmount > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Tax:</span>
                        <span>{formatCurrency(selectedInvoice.taxAmount, selectedInvoice.currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                      <span>Total:</span>
                      <span>{formatCurrency(selectedInvoice.totalAmount, selectedInvoice.currency)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Notes</h4>
                  <p className="text-gray-700">{selectedInvoice.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleDownload(selectedInvoice)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                >
                  <FaDownload className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => handlePrint(selectedInvoice)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                >
                  <FaPrint className="w-4 h-4" />
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceViewer;

