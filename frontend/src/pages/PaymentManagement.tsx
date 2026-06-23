import React, { useState, useEffect } from 'react';
import { 
  FaCreditCard, 
  FaMoneyBillWave, 
  FaHandshake, 
  FaPlus, 
  FaEye, 
  FaEdit, 
  FaTrash, 
  FaDownload,
  FaFilter,
  FaSearch,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExclamationTriangle,
  FaUserTie,
  FaTruck,
  FaShieldAlt,
  FaCog,
  FaUser
} from 'react-icons/fa';

interface PaymentTransaction {
  id: string;
  type: 'advance_payment' | 'final_payment' | 'third_party_payment' | 'refund' | 'fee' | 'insurance_payment' | 'platform_service' | 'direct_payment' | 'financed_payment';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  description: string;
  cargoId: string;
  cargoTitle: string;
  truckOwnerId?: string;
  truckOwnerName?: string;
  thirdPartyId?: string;
  thirdPartyName?: string;
  paymentMethod: 'bank_transfer' | 'mobile_money' | 'credit_card' | 'escrow' | 'mpesa' | 'airtel_money' | 'equitel' | 'paypal';
  reference: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  notes?: string;
  // User verification
  payerId: string;
  payerName: string;
  payerEmail: string;
  payerPhone?: string;
  payerBankAccount?: string;
  payerBankName?: string;
  // Payment source information
  paymentSource: 'own_funds' | 'third_party_financing' | 'mixed_funding';
  ownFundsAmount?: number;
  financedAmount?: number;
  // Financing details
  financingDetails?: {
    financierId: string;
    financierName: string;
    interestRate: number;
    loanTerm: string;
    repaymentSchedule: string;
    collateral: string;
    approvalStatus: 'pending' | 'approved' | 'rejected';
    approvalDate?: string;
    disbursementDate?: string;
  };
  insuranceDetails?: {
    policyNumber: string;
    coverageType: string;
    premiumAmount: number;
    coveragePeriod: string;
    insuranceProvider: string;
  };
  serviceDetails?: {
    serviceType: string;
    serviceProvider: string;
    serviceDescription: string;
  };
}

interface PaymentRequest {
  id: string;
  type: 'advance_payment' | 'final_payment';
  amount: number;
  currency: string;
  cargoId: string;
  cargoTitle: string;
  truckOwnerId: string;
  truckOwnerName: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
  dueDate: string;
  notes?: string;
}

const PaymentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('transactions');
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([
    {
      id: '1',
      type: 'advance_payment',
      status: 'completed',
      amount: 50000,
      currency: 'KES',
      description: 'Advance payment for Electronics shipment',
      cargoId: 'cargo-001',
      cargoTitle: 'Electronics - Nairobi to Mombasa',
      truckOwnerId: 'truck-001',
      truckOwnerName: 'ABC Trucking Ltd',
      paymentMethod: 'bank_transfer',
      reference: 'ADV-2024-001',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      dueDate: '2024-01-20T00:00:00Z',
      notes: 'Advance payment for fuel and maintenance',
      paymentSource: 'own_funds',
      ownFundsAmount: 50000,
      payerId: 'user-001',
      payerName: 'John Doe',
      payerEmail: 'john.doe@example.com',
      payerPhone: '+254700123456',
      payerBankAccount: '1234567890',
      payerBankName: 'Equity Bank'
    },
    {
      id: '2',
      type: 'insurance_payment',
      status: 'completed',
      amount: 25000,
      currency: 'KES',
      description: 'Cargo insurance premium payment',
      cargoId: 'cargo-002',
      cargoTitle: 'Agricultural Products - Kisumu to Nairobi',
      paymentMethod: 'mpesa',
      reference: 'INS-2024-001',
      createdAt: '2024-01-16T11:00:00Z',
      updatedAt: '2024-01-16T11:05:00Z',
      dueDate: '2024-01-20T00:00:00Z',
      notes: 'Comprehensive cargo insurance coverage',
      paymentSource: 'own_funds',
      ownFundsAmount: 25000,
      payerId: 'user-002',
      payerName: 'Jane Smith',
      payerEmail: 'jane.smith@example.com',
      payerPhone: '+254711234567',
      insuranceDetails: {
        policyNumber: 'POL-2024-001',
        coverageType: 'Comprehensive Cargo Insurance',
        premiumAmount: 25000,
        coveragePeriod: '2024-01-20 to 2024-02-20',
        insuranceProvider: 'Kenya Insurance Co.'
      }
    },
    {
      id: '3',
      type: 'platform_service',
      status: 'completed',
      amount: 15000,
      currency: 'KES',
      description: 'Premium tracking service subscription',
      cargoId: 'cargo-003',
      cargoTitle: 'Construction Materials - Nairobi to Eldoret',
      paymentMethod: 'airtel_money',
      reference: 'SVC-2024-001',
      createdAt: '2024-01-17T14:00:00Z',
      updatedAt: '2024-01-17T14:10:00Z',
      dueDate: '2024-01-17T00:00:00Z',
      notes: 'Monthly premium tracking service',
      paymentSource: 'own_funds',
      ownFundsAmount: 15000,
      payerId: 'user-003',
      payerName: 'Mike Johnson',
      payerEmail: 'mike.johnson@example.com',
      payerPhone: '+254722345678',
      serviceDetails: {
        serviceType: 'Premium Tracking',
        serviceProvider: 'CargoAI Platform',
        serviceDescription: 'Real-time GPS tracking with alerts'
      }
    },
    {
      id: '4',
      type: 'third_party_payment',
      status: 'pending',
      amount: 75000,
      currency: 'KES',
      description: 'Third-party payment request for Agricultural goods',
      cargoId: 'cargo-004',
      cargoTitle: 'Agricultural Products - Kisumu to Nairobi',
      truckOwnerId: 'truck-002',
      truckOwnerName: 'Green Logistics',
      thirdPartyId: 'third-001',
      thirdPartyName: 'Kenya Agricultural Bank',
      paymentMethod: 'escrow',
      reference: 'TPP-2024-001',
      createdAt: '2024-01-18T14:00:00Z',
      updatedAt: '2024-01-18T14:00:00Z',
      dueDate: '2024-01-25T00:00:00Z',
      notes: 'Financial assistance for rural farmers',
      paymentSource: 'third_party_financing',
      financedAmount: 75000,
      payerId: 'user-004',
      payerName: 'Sarah Wilson',
      payerEmail: 'sarah.wilson@example.com',
      payerPhone: '+254733456789',
      payerBankAccount: '9876543210',
      payerBankName: 'Kenya Agricultural Bank',
      financingDetails: {
        financierId: 'bank-001',
        financierName: 'Kenya Agricultural Bank',
        interestRate: 12.5,
        loanTerm: '6 months',
        repaymentSchedule: 'Monthly installments',
        collateral: 'Cargo as collateral',
        approvalStatus: 'approved',
        approvalDate: '2024-01-18T10:00:00Z',
        disbursementDate: '2024-01-18T14:00:00Z'
      }
    },
    {
      id: '5',
      type: 'final_payment',
      status: 'processing',
      amount: 120000,
      currency: 'KES',
      description: 'Final payment for Construction materials',
      cargoId: 'cargo-005',
      cargoTitle: 'Construction Materials - Nairobi to Eldoret',
      truckOwnerId: 'truck-003',
      truckOwnerName: 'Heavy Haul Ltd',
      paymentMethod: 'equitel',
      reference: 'FINAL-2024-001',
      createdAt: '2024-01-19T09:00:00Z',
      updatedAt: '2024-01-19T09:15:00Z',
      dueDate: '2024-01-30T00:00:00Z',
      notes: 'Payment upon successful delivery',
      paymentSource: 'mixed_funding',
      ownFundsAmount: 60000,
      financedAmount: 60000,
      payerId: 'user-005',
      payerName: 'David Brown',
      payerEmail: 'david.brown@example.com',
      payerPhone: '+254744567890',
      payerBankAccount: '1122334455',
      payerBankName: 'Equity Bank',
      financingDetails: {
        financierId: 'bank-002',
        financierName: 'Equity Bank',
        interestRate: 15.0,
        loanTerm: '3 months',
        repaymentSchedule: 'Monthly installments',
        collateral: 'Business assets',
        approvalStatus: 'approved',
        approvalDate: '2024-01-19T08:00:00Z',
        disbursementDate: '2024-01-19T09:00:00Z'
      }
    }
  ]);

  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([
    {
      id: '1',
      type: 'advance_payment',
      amount: 30000,
      currency: 'KES',
      cargoId: 'cargo-004',
      cargoTitle: 'Fragile Items - Nairobi to Nakuru',
      truckOwnerId: 'truck-004',
      truckOwnerName: 'Safe Transport Ltd',
      reason: 'Need advance for special handling equipment',
      status: 'pending',
      createdAt: '2024-01-18T11:00:00Z',
      dueDate: '2024-01-22T00:00:00Z',
      notes: 'Fragile items require special care'
    },
    {
      id: '2',
      type: 'final_payment',
      amount: 95000,
      currency: 'KES',
      cargoId: 'cargo-005',
      cargoTitle: 'Hazardous Materials - Mombasa to Nairobi',
      truckOwnerId: 'truck-005',
      truckOwnerName: 'HazMat Transport',
      reason: 'Final payment for completed delivery',
      status: 'approved',
      createdAt: '2024-01-19T15:00:00Z',
      dueDate: '2024-01-28T00:00:00Z',
      notes: 'Successfully delivered hazardous materials'
    }
  ]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    dateRange: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    type: 'advance_payment',
    amount: '',
    currency: 'KES',
    cargoId: '',
    cargoTitle: '',
    truckOwnerId: '',
    truckOwnerName: '',
    thirdPartyId: '',
    thirdPartyName: '',
    paymentMethod: 'bank_transfer',
    notes: '',
    // Payment source
    paymentSource: 'own_funds',
    ownFundsAmount: '',
    financedAmount: '',
    // Financing details
    financierId: '',
    financierName: '',
    interestRate: '',
    loanTerm: '',
    repaymentSchedule: '',
    collateral: '',
    // Insurance details
    insuranceProvider: '',
    coverageType: '',
    coveragePeriod: '',
    policyNumber: '',
    // Service details
    serviceType: '',
    serviceProvider: '',
    serviceDescription: '',
  });

  // Mock user profile data (in real app, this would come from AuthContext)
  const userProfile = {
    id: 'user-001',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+254700123456',
    bankAccount: '1234567890',
    bankName: 'Equity Bank',
    isVerified: true
  };

  const [requestForm, setRequestForm] = useState({
    type: 'advance_payment',
    amount: '',
    currency: 'KES',
    cargoId: '',
    cargoTitle: '',
    truckOwnerId: '',
    truckOwnerName: '',
    reason: '',
    notes: '',
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'advance_payment':
        return <FaMoneyBillWave className="w-4 h-4" />;
      case 'final_payment':
        return <FaCreditCard className="w-4 h-4" />;
      case 'third_party_payment':
        return <FaHandshake className="w-4 h-4" />;
      case 'refund':
        return <FaTimesCircle className="w-4 h-4" />;
      case 'fee':
        return <FaShieldAlt className="w-4 h-4" />;
      default:
        return <FaCreditCard className="w-4 h-4" />;
    }
  };

  const handleCreatePayment = () => {
    // Check if user is verified
    if (!userProfile.isVerified) {
      alert('Only verified users can make payments. Please complete your profile verification.');
      return;
    }

    setShowPaymentModal(true);
    setSelectedTransaction(null);
    setPaymentForm({
      type: 'advance_payment',
      amount: '',
      currency: 'KES',
      cargoId: '',
      cargoTitle: '',
      truckOwnerId: '',
      truckOwnerName: '',
      thirdPartyId: '',
      thirdPartyName: '',
      paymentMethod: 'bank_transfer',
      notes: '',
      paymentSource: 'own_funds',
      ownFundsAmount: '',
      financedAmount: '',
      financierId: '',
      financierName: '',
      interestRate: '',
      loanTerm: '',
      repaymentSchedule: '',
      collateral: '',
      insuranceProvider: '',
      coverageType: '',
      coveragePeriod: '',
      policyNumber: '',
      serviceType: '',
      serviceProvider: '',
      serviceDescription: '',
    });
  };

  const handleCreateRequest = () => {
    setShowRequestModal(true);
    setSelectedRequest(null);
    setRequestForm({
      type: 'advance_payment',
      amount: '',
      currency: 'KES',
      cargoId: '',
      cargoTitle: '',
      truckOwnerId: '',
      truckOwnerName: '',
      reason: '',
      notes: '',
    });
  };

  const handleSavePayment = () => {
    if (!paymentForm.amount || !paymentForm.cargoTitle || !paymentForm.truckOwnerName) {
      alert('Please fill in all required fields');
      return;
    }

    const newPayment: PaymentTransaction = {
      id: Date.now().toString(),
      type: paymentForm.type as any,
      status: 'pending',
      amount: parseFloat(paymentForm.amount),
      currency: paymentForm.currency,
      description: `${paymentForm.type.replace('_', ' ')} for ${paymentForm.cargoTitle}`,
      cargoId: paymentForm.cargoId,
      cargoTitle: paymentForm.cargoTitle,
      truckOwnerId: paymentForm.truckOwnerId,
      truckOwnerName: paymentForm.truckOwnerName,
      thirdPartyId: paymentForm.thirdPartyId,
      thirdPartyName: paymentForm.thirdPartyName,
      paymentMethod: paymentForm.paymentMethod as any,
      reference: `${paymentForm.type.toUpperCase()}-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: paymentForm.notes,
      // User verification - populated from profile
      payerId: userProfile.id,
      payerName: userProfile.name,
      payerEmail: userProfile.email,
      payerPhone: userProfile.phone,
      payerBankAccount: userProfile.bankAccount,
      payerBankName: userProfile.bankName,
      paymentSource: paymentForm.paymentSource as any,
      ownFundsAmount: paymentForm.ownFundsAmount ? parseFloat(paymentForm.ownFundsAmount) : undefined,
      financedAmount: paymentForm.financedAmount ? parseFloat(paymentForm.financedAmount) : undefined,
      financingDetails: paymentForm.paymentSource === 'third_party_financing' || paymentForm.paymentSource === 'mixed_funding' ? {
        financierId: paymentForm.financierId,
        financierName: paymentForm.financierName,
        interestRate: parseFloat(paymentForm.interestRate),
        loanTerm: paymentForm.loanTerm,
        repaymentSchedule: paymentForm.repaymentSchedule,
        collateral: paymentForm.collateral,
        approvalStatus: 'pending',
      } : undefined,
    };

    setTransactions(prev => [newPayment, ...prev]);
    setShowPaymentModal(false);
  };

  const handleSaveRequest = () => {
    if (!requestForm.amount || !requestForm.cargoTitle || !requestForm.truckOwnerName || !requestForm.reason) {
      alert('Please fill in all required fields');
      return;
    }

    const newRequest: PaymentRequest = {
      id: Date.now().toString(),
      type: requestForm.type as any,
      amount: parseFloat(requestForm.amount),
      currency: requestForm.currency,
      cargoId: requestForm.cargoId,
      cargoTitle: requestForm.cargoTitle,
      truckOwnerId: requestForm.truckOwnerId,
      truckOwnerName: requestForm.truckOwnerName,
      reason: requestForm.reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      notes: requestForm.notes,
    };

    setPaymentRequests(prev => [newRequest, ...prev]);
    setShowRequestModal(false);
  };

  const handleApproveRequest = (requestId: string) => {
    setPaymentRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'approved' } : req
    ));
  };

  const handleRejectRequest = (requestId: string) => {
    setPaymentRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'rejected' } : req
    ));
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filters.status && transaction.status !== filters.status) return false;
    if (filters.type && transaction.type !== filters.type) return false;
    return true;
  });

  const filteredRequests = paymentRequests.filter(request => {
    if (filters.status && request.status !== filters.status) return false;
    if (filters.type && request.type !== filters.type) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600">Manage financial transactions and payment requests</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleCreatePayment}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
          >
            <FaPlus className="w-4 h-4" />
            <span>New Payment</span>
          </button>
          <button
            onClick={handleCreateRequest}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <FaHandshake className="w-4 h-4" />
            <span>Payment Request</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FaMoneyBillWave className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">KES 287,000</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaShieldAlt className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Insurance</p>
              <p className="text-2xl font-bold text-gray-900">KES 25,000</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FaCreditCard className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Mobile Wallets</p>
              <p className="text-2xl font-bold text-gray-900">KES 135,000</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FaCog className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Services</p>
              <p className="text-2xl font-bold text-gray-900">KES 15,000</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'transactions'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'requests'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payment Requests
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="advance_payment">Advance Payment</option>
                  <option value="final_payment">Final Payment</option>
                  <option value="third_party_payment">Third Party Payment</option>
                  <option value="refund">Refund</option>
                  <option value="fee">Fee</option>
                </select>
              </div>

              {/* Transactions List */}
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-primary-100 rounded-lg">
                          {getTypeIcon(transaction.type)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{transaction.description}</div>
                          <div className="text-sm text-gray-600">
                            {transaction.truckOwnerName} • {transaction.cargoTitle}
                          </div>
                          <div className="text-xs text-gray-500">
                            Ref: {transaction.reference} • {new Date(transaction.createdAt).toLocaleDateString()} • Payer: {transaction.payerName}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-gray-900">
                          {transaction.currency} {transaction.amount.toLocaleString()}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                    {/* Payer Information */}
                    <div className="mt-2 text-sm text-gray-600">
                      <FaUser className="inline w-4 h-4 mr-1" />
                      Payer: {transaction.payerName} ({transaction.payerEmail})
                      {transaction.payerPhone && (
                        <div className="ml-5 text-xs text-gray-500">
                          Phone: {transaction.payerPhone}
                          {transaction.payerBankAccount && (
                            <span> • Bank: {transaction.payerBankName} - {transaction.payerBankAccount}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {transaction.thirdPartyName && (
                      <div className="mt-2 text-sm text-gray-600">
                        <FaUserTie className="inline w-4 h-4 mr-1" />
                        Third Party: {transaction.thirdPartyName}
                      </div>
                    )}
                    {transaction.insuranceDetails && (
                      <div className="mt-2 text-sm text-gray-600">
                        <FaShieldAlt className="inline w-4 h-4 mr-1" />
                        Insurance: {transaction.insuranceDetails.insuranceProvider} - {transaction.insuranceDetails.coverageType}
                        <div className="ml-5 text-xs text-gray-500">
                          Policy: {transaction.insuranceDetails.policyNumber} • Period: {transaction.insuranceDetails.coveragePeriod}
                        </div>
                      </div>
                    )}
                    {transaction.financingDetails && (
                      <div className="mt-2 text-sm text-gray-600">
                        <FaHandshake className="inline w-4 h-4 mr-1" />
                        Financing: {transaction.financingDetails.financierName} - {transaction.financingDetails.interestRate}% interest
                        <div className="ml-5 text-xs text-gray-500">
                          Term: {transaction.financingDetails.loanTerm} • Repayment: {transaction.financingDetails.repaymentSchedule}
                          <br />
                          Collateral: {transaction.financingDetails.collateral} • Status: {transaction.financingDetails.approvalStatus}
                        </div>
                      </div>
                    )}
                    {transaction.paymentSource === 'mixed_funding' && (
                      <div className="mt-2 text-sm text-gray-600">
                        <FaMoneyBillWave className="inline w-4 h-4 mr-1" />
                        Mixed Funding: Own Funds KES {transaction.ownFundsAmount?.toLocaleString()} + Financed KES {transaction.financedAmount?.toLocaleString()}
                      </div>
                    )}
                    {transaction.serviceDetails && (
                      <div className="mt-2 text-sm text-gray-600">
                        <FaCog className="inline w-4 h-4 mr-1" />
                        Service: {transaction.serviceDetails.serviceType} - {transaction.serviceDetails.serviceProvider}
                        <div className="ml-5 text-xs text-gray-500">
                          {transaction.serviceDetails.serviceDescription}
                        </div>
                      </div>
                    )}
                    {transaction.notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        <FaExclamationTriangle className="inline w-4 h-4 mr-1" />
                        {transaction.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Requests Tab */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="advance_payment">Advance Payment</option>
                  <option value="final_payment">Final Payment</option>
                </select>
              </div>

              {/* Requests List */}
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <div key={request.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <FaHandshake className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{request.reason}</div>
                          <div className="text-sm text-gray-600">
                            {request.truckOwnerName} • {request.cargoTitle}
                          </div>
                          <div className="text-xs text-gray-500">
                            Due: {new Date(request.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-gray-900">
                          {request.currency} {request.amount.toLocaleString()}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                    </div>
                    {request.notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        <FaExclamationTriangle className="inline w-4 h-4 mr-1" />
                        {request.notes}
                      </div>
                    )}
                    {request.status === 'pending' && (
                      <div className="mt-3 flex space-x-2">
                        <button
                          onClick={() => handleApproveRequest(request.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto pb-24 lg:pb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {selectedTransaction ? 'Edit Payment' : 'New Payment'}
            </h3>
            
            {/* User Verification Status */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Payment Account</p>
                  <p className="text-xs text-blue-700">{userProfile.name} ({userProfile.email})</p>
                  <p className="text-xs text-blue-700">Phone: {userProfile.phone}</p>
                  {userProfile.bankAccount && (
                    <p className="text-xs text-blue-700">Bank: {userProfile.bankName} - {userProfile.bankAccount}</p>
                  )}
                </div>
                <div className="flex items-center">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    userProfile.isVerified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {userProfile.isVerified ? '✓ Verified' : '✗ Unverified'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Type *
                </label>
                <select
                  value={paymentForm.type}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="advance_payment">Advance Payment</option>
                  <option value="final_payment">Final Payment</option>
                  <option value="third_party_payment">Third Party Payment</option>
                  <option value="insurance_payment">Cargo Insurance</option>
                  <option value="platform_service">Platform Service</option>
                  <option value="refund">Refund</option>
                  <option value="fee">Fee</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={paymentForm.currency}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="KES">KES</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Source *
                </label>
                <select
                  value={paymentForm.paymentSource}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentSource: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="own_funds">Own Funds</option>
                  <option value="third_party_financing">Third Party Financing</option>
                  <option value="mixed_funding">Mixed Funding</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="airtel_money">Airtel Money</option>
                  <option value="equitel">Equitel</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="paypal">PayPal</option>
                  <option value="escrow">Escrow</option>
                </select>
              </div>

              {/* Auto-populated Payment Details */}
              {paymentForm.paymentMethod === 'bank_transfer' && userProfile.bankAccount && (
                <div className="md:col-span-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-900 mb-1">Bank Account Details (Auto-populated)</p>
                  <p className="text-xs text-green-700">Bank: {userProfile.bankName}</p>
                  <p className="text-xs text-green-700">Account: {userProfile.bankAccount}</p>
                </div>
              )}

              {(paymentForm.paymentMethod === 'mpesa' || paymentForm.paymentMethod === 'airtel_money' || paymentForm.paymentMethod === 'equitel') && userProfile.phone && (
                <div className="md:col-span-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-900 mb-1">Mobile Money Details (Auto-populated)</p>
                  <p className="text-xs text-green-700">Phone: {userProfile.phone}</p>
                  <p className="text-xs text-green-700">Provider: {paymentForm.paymentMethod === 'mpesa' ? 'Safaricom' : paymentForm.paymentMethod === 'airtel_money' ? 'Airtel' : 'Equity Bank'}</p>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cargo Title *
                </label>
                <input
                  type="text"
                  value={paymentForm.cargoTitle}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, cargoTitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter cargo title"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Truck Owner Name *
                </label>
                <input
                  type="text"
                  value={paymentForm.truckOwnerName}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, truckOwnerName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter truck owner name"
                />
              </div>

              {paymentForm.type === 'third_party_payment' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Third Party Name
                  </label>
                  <input
                    type="text"
                    value={paymentForm.thirdPartyName}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, thirdPartyName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter third party name"
                  />
                </div>
              )}

              {paymentForm.type === 'insurance_payment' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Insurance Provider *
                    </label>
                    <select
                      value={paymentForm.insuranceProvider}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, insuranceProvider: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select Insurance Provider</option>
                      <option value="Kenya Insurance Co.">Kenya Insurance Co.</option>
                      <option value="AAR Insurance">AAR Insurance</option>
                      <option value="CIC Insurance">CIC Insurance</option>
                      <option value="Jubilee Insurance">Jubilee Insurance</option>
                      <option value="UAP Insurance">UAP Insurance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coverage Type *
                    </label>
                    <select
                      value={paymentForm.coverageType}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, coverageType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select Coverage Type</option>
                      <option value="Comprehensive Cargo Insurance">Comprehensive Cargo Insurance</option>
                      <option value="Basic Cargo Insurance">Basic Cargo Insurance</option>
                      <option value="Hazardous Goods Insurance">Hazardous Goods Insurance</option>
                      <option value="Fragile Items Insurance">Fragile Items Insurance</option>
                      <option value="High Value Cargo Insurance">High Value Cargo Insurance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Policy Number
                    </label>
                    <input
                      type="text"
                      value={paymentForm.policyNumber}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, policyNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter policy number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coverage Period
                    </label>
                    <input
                      type="text"
                      value={paymentForm.coveragePeriod}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, coveragePeriod: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., 2024-01-20 to 2024-02-20"
                    />
                  </div>
                </>
              )}

              {(paymentForm.paymentSource === 'third_party_financing' || paymentForm.paymentSource === 'mixed_funding') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Financier Name *
                    </label>
                    <select
                      value={paymentForm.financierName}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, financierName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select Financier</option>
                      <option value="Kenya Agricultural Bank">Kenya Agricultural Bank</option>
                      <option value="Equity Bank">Equity Bank</option>
                      <option value="KCB Bank">KCB Bank</option>
                      <option value="Cooperative Bank">Cooperative Bank</option>
                      <option value="NCBA Bank">NCBA Bank</option>
                      <option value="Stanbic Bank">Stanbic Bank</option>
                      <option value="CargoAI Financing">CargoAI Financing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Interest Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={paymentForm.interestRate}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, interestRate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter interest rate"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loan Term
                    </label>
                    <select
                      value={paymentForm.loanTerm}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, loanTerm: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select Loan Term</option>
                      <option value="1 month">1 Month</option>
                      <option value="3 months">3 Months</option>
                      <option value="6 months">6 Months</option>
                      <option value="12 months">12 Months</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Repayment Schedule
                    </label>
                    <select
                      value={paymentForm.repaymentSchedule}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, repaymentSchedule: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select Repayment Schedule</option>
                      <option value="Monthly installments">Monthly Installments</option>
                      <option value="Weekly installments">Weekly Installments</option>
                      <option value="Lump sum">Lump Sum</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Collateral
                    </label>
                    <input
                      type="text"
                      value={paymentForm.collateral}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, collateral: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., Cargo as collateral"
                    />
                  </div>

                  {paymentForm.paymentSource === 'mixed_funding' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Own Funds Amount
                      </label>
                      <input
                        type="number"
                        value={paymentForm.ownFundsAmount}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, ownFundsAmount: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Enter own funds amount"
                      />
                    </div>
                  )}
                </>
              )}

              {paymentForm.type === 'platform_service' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Type *
                    </label>
                    <select
                      value={paymentForm.serviceType}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, serviceType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select Service Type</option>
                      <option value="Premium Tracking">Premium Tracking</option>
                      <option value="Route Optimization">Route Optimization</option>
                      <option value="Cargo Insurance">Cargo Insurance</option>
                      <option value="Documentation Services">Documentation Services</option>
                      <option value="Customs Clearance">Customs Clearance</option>
                      <option value="Warehouse Services">Warehouse Services</option>
                      <option value="Loading/Unloading">Loading/Unloading Services</option>
                      <option value="Security Escort">Security Escort</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Provider
                    </label>
                    <input
                      type="text"
                      value={paymentForm.serviceProvider}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, serviceProvider: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter service provider"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Description
                    </label>
                    <textarea
                      value={paymentForm.serviceDescription}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, serviceDescription: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Describe the service details"
                    />
                  </div>
                </>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter additional notes"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSavePayment}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                {selectedTransaction ? 'Update Payment' : 'Create Payment'}
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto pb-24 lg:pb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {selectedRequest ? 'Edit Payment Request' : 'New Payment Request'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Type *
                </label>
                <select
                  value={requestForm.type}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="advance_payment">Advance Payment</option>
                  <option value="final_payment">Final Payment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  value={requestForm.amount}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={requestForm.currency}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="KES">KES</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cargo Title *
                </label>
                <input
                  type="text"
                  value={requestForm.cargoTitle}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, cargoTitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter cargo title"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Truck Owner Name *
                </label>
                <input
                  type="text"
                  value={requestForm.truckOwnerName}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, truckOwnerName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter truck owner name"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason *
                </label>
                <textarea
                  value={requestForm.reason}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, reason: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Explain the reason for this payment request"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={requestForm.notes}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter additional notes"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSaveRequest}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {selectedRequest ? 'Update Request' : 'Create Request'}
              </button>
              <button
                onClick={() => setShowRequestModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement; 