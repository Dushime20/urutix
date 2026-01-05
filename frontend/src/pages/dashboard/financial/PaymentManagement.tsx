import React, { useState } from 'react';
import {
  CreditCard,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Filter,
  Download,
  Send,
  X,
  Wallet,
  Building,
  DollarSign,
  FileText,
  Search
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'bank_account' | 'wallet';
  name: string;
  last4?: string;
  expiry?: string;
  isDefault: boolean;
  bankName?: string;
  accountType?: string;
}

interface Invoice {
  id: string;
  number: string;
  description: string;
  amount: number;
  dueDate: string;
  issueDate: string;
  status: 'paid' | 'pending' | 'overdue' | 'scheduled';
  cargoId?: string;
  paymentMethod?: string;
  paidDate?: string;
}

export const PaymentManagement: React.FC = () => {
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - Replace with actual API calls
  const paymentMethods: PaymentMethod[] = [
    {
      id: '1',
      type: 'credit_card',
      name: 'Visa',
      last4: '4242',
      expiry: '12/25',
      isDefault: true
    },
    {
      id: '2',
      type: 'bank_account',
      name: 'Chase Business Checking',
      last4: '7890',
      bankName: 'Chase Bank',
      accountType: 'Checking',
      isDefault: false
    },
    {
      id: '3',
      type: 'wallet',
      name: 'Urutix Wallet',
      last4: '5000',
      isDefault: false
    }
  ];

  const invoices: Invoice[] = [
    {
      id: '1',
      number: 'INV-2026-001',
      description: 'Shipment Payment - NYC to LA',
      amount: 3450,
      dueDate: '2026-01-05',
      issueDate: '2026-01-02',
      status: 'pending',
      cargoId: 'CARGO-2401'
    },
    {
      id: '2',
      number: 'INV-2025-348',
      description: 'Insurance Premium - Q1 2026',
      amount: 1200,
      dueDate: '2026-01-05',
      issueDate: '2025-12-28',
      status: 'pending'
    },
    {
      id: '3',
      number: 'INV-2025-347',
      description: 'Shipment Payment - Chicago to Houston',
      amount: 2100,
      dueDate: '2025-12-28',
      issueDate: '2025-12-25',
      status: 'paid',
      cargoId: 'CARGO-2398',
      paymentMethod: 'Visa ****4242',
      paidDate: '2025-12-27'
    },
    {
      id: '4',
      number: 'INV-2025-346',
      description: 'Monthly Platform Fee - December',
      amount: 299,
      dueDate: '2025-12-20',
      issueDate: '2025-12-15',
      status: 'paid',
      paymentMethod: 'Auto-debit',
      paidDate: '2025-12-20'
    },
    {
      id: '5',
      number: 'INV-2025-340',
      description: 'Shipment Payment - Denver to Portland',
      amount: 3850,
      dueDate: '2025-12-15',
      issueDate: '2025-12-10',
      status: 'overdue',
      cargoId: 'CARGO-2380'
    },
    {
      id: '6',
      number: 'INV-2026-005',
      description: 'Shipment Payment - Boston to Miami',
      amount: 4250,
      dueDate: '2026-01-10',
      issueDate: '2026-01-02',
      status: 'scheduled',
      cargoId: 'CARGO-2405',
      paymentMethod: 'Scheduled: Visa ****4242'
    }
  ];

  const getStatusIcon = (status: string) => {
    const icons = {
      paid: <CheckCircle className="w-5 h-5 text-emerald-600" />,
      pending: <Clock className="w-5 h-5 text-amber-600" />,
      overdue: <AlertCircle className="w-5 h-5 text-rose-600" />,
      scheduled: <Calendar className="w-5 h-5 text-blue-600" />
    };
    return icons[status as keyof typeof icons] || <Clock className="w-5 h-5 text-gray-600" />;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      overdue: 'bg-rose-50 text-rose-700 border-rose-200',
      scheduled: 'bg-blue-50 text-blue-700 border-blue-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getPaymentMethodIcon = (type: string) => {
    const icons = {
      credit_card: <CreditCard className="w-5 h-5" />,
      bank_account: <Building className="w-5 h-5" />,
      wallet: <Wallet className="w-5 h-5" />
    };
    return icons[type as keyof typeof icons] || <CreditCard className="w-5 h-5" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    const matchesSearch = invoice.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         invoice.number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: invoices.reduce((sum, inv) => sum + inv.amount, 0),
    paid: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0),
    pending: invoices.filter(inv => inv.status === 'pending' || inv.status === 'scheduled').reduce((sum, inv) => sum + inv.amount, 0),
    overdue: invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Management</h1>
        <p className="text-gray-600">Manage invoices, payments, and billing methods</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-gray-300" />
            <span className="text-gray-300 text-sm font-medium">Total Amount</span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(stats.total)}</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-emerald-100" />
            <span className="text-emerald-100 text-sm font-medium">Paid</span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(stats.paid)}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-amber-100" />
            <span className="text-amber-100 text-sm font-medium">Pending</span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(stats.pending)}</p>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-5 h-5 text-rose-100" />
            <span className="text-rose-100 text-sm font-medium">Overdue</span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(stats.overdue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoices List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters & Search */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
              <div className="flex gap-2">
                {['all', 'pending', 'paid', 'overdue', 'scheduled'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                      filterStatus === status
                        ? 'bg-violet-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Invoices */}
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => (
              <div 
                key={invoice.id}
                className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${
                      invoice.status === 'paid' ? 'bg-emerald-100' :
                      invoice.status === 'pending' ? 'bg-amber-100' :
                      invoice.status === 'overdue' ? 'bg-rose-100' :
                      'bg-blue-100'
                    }`}>
                      {getStatusIcon(invoice.status)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-gray-900">{invoice.number}</h3>
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(invoice.status)}`}>
                          {invoice.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{invoice.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Issued: {invoice.issueDate}</span>
                        <span>Due: {invoice.dueDate}</span>
                        {invoice.cargoId && (
                          <span className="text-violet-600 font-medium">{invoice.cargoId}</span>
                        )}
                      </div>
                      {invoice.paidDate && (
                        <p className="text-sm text-emerald-600 mt-1">
                          Paid on {invoice.paidDate} via {invoice.paymentMethod}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 mb-3">{formatCurrency(invoice.amount)}</p>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all text-sm flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        PDF
                      </button>
                      {invoice.status === 'pending' && (
                        <button 
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowPaymentModal(true);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 font-semibold transition-all text-sm flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Pay Now
                        </button>
                      )}
                      {invoice.status === 'overdue' && (
                        <button 
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowPaymentModal(true);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-xl hover:from-rose-700 hover:to-red-700 font-semibold transition-all text-sm flex items-center gap-2"
                        >
                          <AlertCircle className="w-4 h-4" />
                          Pay Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Payment Methods</h3>
              <button 
                onClick={() => setShowAddPaymentMethod(true)}
                className="text-violet-600 hover:text-violet-700 font-semibold text-sm flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add New
              </button>
            </div>

            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div 
                  key={method.id}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    method.isDefault 
                      ? 'border-violet-400 bg-violet-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        method.type === 'credit_card' ? 'bg-violet-100 text-violet-600' :
                        method.type === 'bank_account' ? 'bg-blue-100 text-blue-600' :
                        'bg-amber-100 text-amber-600'
                      }`}>
                        {getPaymentMethodIcon(method.type)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{method.name}</p>
                        <p className="text-sm text-gray-600">
                          {method.type === 'credit_card' && `•••• ${method.last4}`}
                          {method.type === 'bank_account' && `${method.bankName} •••• ${method.last4}`}
                          {method.type === 'wallet' && `Balance: ${formatCurrency(parseInt(method.last4 || '0'))}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  {method.isDefault && (
                    <div className="bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-lg inline-block">
                      DEFAULT
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full py-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
                <CreditCard className="w-5 h-5" />
                Set Up Auto-Pay
              </button>
              <button className="w-full py-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
                <Calendar className="w-5 h-5" />
                Schedule Payments
              </button>
              <button className="w-full py-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
                <FileText className="w-5 h-5" />
                Payment History
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Make Payment</h3>
              <button 
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedInvoice(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-violet-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Invoice Amount</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(selectedInvoice.amount)}</p>
              <p className="text-sm text-gray-600 mt-2">{selectedInvoice.description}</p>
            </div>

            <div className="space-y-4 mb-6">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700 mb-2 block">Payment Method</span>
                <select className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500">
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.name} {method.last4 && `•••• ${method.last4}`}
                      {method.isDefault && ' (Default)'}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2">
              <Send className="w-5 h-5" />
              Confirm Payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;

