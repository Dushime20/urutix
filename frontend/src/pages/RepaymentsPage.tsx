import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { lendingApi } from '../services/lending/lendingApi';
import {
  FaTimesCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import { Search, Download, Filter } from 'lucide-react';
import RepaymentsEnlite from '../components/LenderDashboard/Repayments.enlite';


interface Payment {
  id: string;
  loanId: string;
  borrowerName: string;
  borrowerEmail: string;
  borrowerPhone: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue' | 'partial' | 'failed';
  paymentMethod?: 'bank_transfer' | 'ach' | 'wire' | 'check' | 'online';
  cargoType: string;
  route: {
    origin: string;
    destination: string;
  };
  loanAmount: number;
  remainingBalance: number;
  paymentNumber: number;
  totalPayments: number;
  daysOverdue?: number;
  lateFee?: number;
  partialAmount?: number;
  transactionId?: string;
  notes?: string;
  contactAttempts: number;
  lastContactDate?: string;
  autoPayEnabled: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

const RepaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [repayments, setRepayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [overdueFilter, setOverdueFilter] = useState<boolean>(false);
  const [sortField, setSortField] = useState<string>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Check authentication and get lender ID from user context
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-500">
            Please log in to access the repayments page.
          </p>
        </div>
      </div>
    );
  }

  if (user.role !== 'LENDER') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-500">
            This page is only accessible to lenders.
          </p>
        </div>
      </div>
    );
  }

  const lenderId = user.id;

  // Calculate repayment statistics
  const repaymentStats = useMemo(() => {
    const total = repayments.length;
    const pending = repayments.filter(p => p.status === 'pending').length;
    const overdue = repayments.filter(p => p.status === 'overdue').length;
    const paid = repayments.filter(p => p.status === 'paid').length;

    const totalAmount = repayments.reduce((sum, p) => sum + p.totalAmount, 0);
    const paidAmount = repayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.totalAmount, 0);
    const overdueAmount = repayments
      .filter(p => p.status === 'overdue')
      .reduce((sum, p) => sum + p.totalAmount + (p.lateFee || 0), 0);

    const collectionRate = total > 0 ? Math.round((paid / total) * 100) : 0;
    const avgDaysOverdue = repayments
      .filter(p => p.status === 'overdue' && p.daysOverdue)
      .reduce((sum, p, _, arr) => sum + (p.daysOverdue || 0) / arr.length, 0);

    return {
      total,
      pending,
      overdue,
      paid,
      totalAmount,
      paidAmount,
      overdueAmount,
      collectionRate,
      avgDaysOverdue: Math.round(avgDaysOverdue)
    };
  }, [repayments]);

  // Filter and sort repayments
  const filteredRepayments = useMemo(() => {
    const filtered = repayments.filter(payment => {
      const matchesSearch = !searchTerm ||
        payment.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.cargoType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
      const matchesRisk = riskFilter === 'all' || payment.riskLevel === riskFilter;
      const matchesOverdue = !overdueFilter || payment.status === 'overdue';

      return matchesSearch && matchesStatus && matchesRisk && matchesOverdue;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue: any = a[sortField as keyof Payment];
      let bValue: any = b[sortField as keyof Payment];

      if (sortField === 'dueDate' || sortField === 'paidDate') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [repayments, searchTerm, statusFilter, riskFilter, overdueFilter, sortField, sortDirection]);

  useEffect(() => {
    // Only fetch data if authenticated and user has proper access
    if (!user || user.role !== 'LENDER') {
      return;
    }

    const fetchRepayments = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch repayments from real API
        const repaymentData = await lendingApi.getLenderRepayments(lenderId, {
          limit: 100,
          page: 1
        });

        // Transform API data to match component interface
        const transformedRepayments: Payment[] = repaymentData.map((rep: any) => ({
          id: rep.id,
          loanId: rep.loan_request_id || rep.loanId,
          borrowerName: rep.loan?.borrower?.name || `${rep.loan?.borrower?.firstName || ''} ${rep.loan?.borrower?.lastName || ''}`.trim() || 'Unknown Borrower',
          borrowerEmail: rep.loan?.borrower?.email || '',
          borrowerPhone: rep.loan?.borrower?.phone || '',
          principalAmount: rep.principal_amount || rep.principalAmount || 0,
          interestAmount: rep.interest_amount || rep.interestAmount || 0,
          totalAmount: rep.total_amount || rep.totalAmount || 0,
          dueDate: rep.due_date || rep.dueDate || '',
          paidDate: rep.payment_date || rep.paidDate,
          status: rep.status || 'pending',
          paymentMethod: rep.payment_method || rep.paymentMethod,
          cargoType: rep.loan?.cargo?.type || rep.cargoType || 'General Cargo',
          route: {
            origin: rep.loan?.cargo?.pickupLocation || rep.route?.origin || '',
            destination: rep.loan?.cargo?.deliveryLocation || rep.route?.destination || ''
          },
          loanAmount: rep.loan?.requested_amount || rep.loanAmount || 0,
          remainingBalance: rep.remaining_balance || rep.remainingBalance || 0,
          paymentNumber: rep.payment_number || rep.paymentNumber || 1,
          totalPayments: rep.total_payments || rep.totalPayments || 12,
          daysOverdue: rep.days_overdue || rep.daysOverdue,
          lateFee: rep.late_fee || rep.lateFee,
          partialAmount: rep.partial_amount || rep.partialAmount,
          transactionId: rep.transaction_id || rep.transactionId,
          notes: rep.notes,
          contactAttempts: rep.contact_attempts || rep.contactAttempts || 0,
          lastContactDate: rep.last_contact_date || rep.lastContactDate,
          autoPayEnabled: rep.auto_pay_enabled || rep.autoPayEnabled || false,
          riskLevel: rep.risk_level || rep.riskLevel || 'medium'
        }));

        setRepayments(transformedRepayments);

      } catch (err: any) {
        console.error('Error fetching repayments:', err);
        console.error('API Error Details:', {
          message: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText,
          url: err.config?.url,
          data: err.response?.data
        });

        setError(`Failed to load repayments: ${err.response?.status ? `${err.response.status} - ${err.response.statusText}` : err.message}`);

        // Use mock data as fallback if API fails
        setRepayments(mockRepayments);
      } finally {
        setLoading(false);
      }
    };

    fetchRepayments();
  }, [user, lenderId]);

  // Mock data for fallback or development
  const mockRepayments: Payment[] = [
    {
      id: 'PAY-001',
      loanId: 'LOAN-2024-001',
      borrowerName: 'TransGlobal Logistics',
      borrowerEmail: 'finance@transglobal.com',
      borrowerPhone: '+1-555-0123',
      principalAmount: 6250,
      interestAmount: 531.25,
      totalAmount: 6781.25,
      dueDate: '2024-08-15',
      status: 'pending',
      cargoType: 'Electronics',
      route: {
        origin: 'Los Angeles, CA',
        destination: 'New York, NY'
      },
      loanAmount: 75000,
      remainingBalance: 68750,
      paymentNumber: 1,
      totalPayments: 12,
      contactAttempts: 0,
      autoPayEnabled: true,
      riskLevel: 'low'
    },
    {
      id: 'PAY-002',
      loanId: 'LOAN-2024-002',
      borrowerName: 'Pacific Freight Solutions',
      borrowerEmail: 'admin@pacificfreight.com',
      borrowerPhone: '+1-555-0124',
      principalAmount: 2500,
      interestAmount: 230,
      totalAmount: 2730,
      dueDate: '2024-08-10',
      paidDate: '2024-08-12',
      status: 'paid',
      paymentMethod: 'bank_transfer',
      cargoType: 'Automotive Parts',
      route: {
        origin: 'Detroit, MI',
        destination: 'Seattle, WA'
      },
      loanAmount: 45000,
      remainingBalance: 42500,
      paymentNumber: 1,
      totalPayments: 18,
      contactAttempts: 0,
      transactionId: 'TXN-20240812-001',
      autoPayEnabled: false,
      riskLevel: 'low'
    },
    {
      id: 'PAY-003',
      loanId: 'LOAN-2024-003',
      borrowerName: 'Coastal Shipping Corp',
      borrowerEmail: 'finance@coastalship.com',
      borrowerPhone: '+1-555-0125',
      principalAmount: 5000,
      interestAmount: 325,
      totalAmount: 5325,
      dueDate: '2024-08-05',
      status: 'overdue',
      cargoType: 'Industrial Machinery',
      route: {
        origin: 'Houston, TX',
        destination: 'Miami, FL'
      },
      loanAmount: 120000,
      remainingBalance: 115000,
      paymentNumber: 1,
      totalPayments: 24,
      daysOverdue: 7,
      lateFee: 150,
      contactAttempts: 2,
      lastContactDate: '2024-08-11',
      autoPayEnabled: true,
      riskLevel: 'medium'
    },
    {
      id: 'PAY-004',
      loanId: 'LOAN-2024-004',
      borrowerName: 'Metro Transport LLC',
      borrowerEmail: 'operations@metrotransport.com',
      borrowerPhone: '+1-555-0126',
      principalAmount: 3555,
      interestAmount: 299.58,
      totalAmount: 3854.58,
      dueDate: '2024-08-08',
      status: 'partial',
      paymentMethod: 'ach',
      cargoType: 'Perishable Goods',
      route: {
        origin: 'Phoenix, AZ',
        destination: 'Denver, CO'
      },
      loanAmount: 32000,
      remainingBalance: 28445,
      paymentNumber: 1,
      totalPayments: 9,
      partialAmount: 2000,
      daysOverdue: 4,
      lateFee: 75,
      contactAttempts: 1,
      lastContactDate: '2024-08-10',
      transactionId: 'TXN-20240810-002',
      autoPayEnabled: false,
      riskLevel: 'high'
    },
    {
      id: 'PAY-005',
      loanId: 'LOAN-2024-005',
      borrowerName: 'Alpine Logistics Group',
      borrowerEmail: 'finance@alpinelogistics.com',
      borrowerPhone: '+1-555-0127',
      principalAmount: 5666.67,
      interestAmount: 542.92,
      totalAmount: 6209.59,
      dueDate: '2024-07-25',
      status: 'overdue',
      cargoType: 'Construction Materials',
      route: {
        origin: 'Atlanta, GA',
        destination: 'Chicago, IL'
      },
      loanAmount: 85000,
      remainingBalance: 79333.33,
      paymentNumber: 1,
      totalPayments: 15,
      daysOverdue: 18,
      lateFee: 300,
      contactAttempts: 5,
      lastContactDate: '2024-08-10',
      autoPayEnabled: false,
      riskLevel: 'high'
    },
    {
      id: 'PAY-006',
      loanId: 'LOAN-2024-001',
      borrowerName: 'TransGlobal Logistics',
      borrowerEmail: 'finance@transglobal.com',
      borrowerPhone: '+1-555-0123',
      principalAmount: 6250,
      interestAmount: 531.25,
      totalAmount: 6781.25,
      dueDate: '2024-09-15',
      status: 'pending',
      cargoType: 'Electronics',
      route: {
        origin: 'Los Angeles, CA',
        destination: 'New York, NY'
      },
      loanAmount: 75000,
      remainingBalance: 62500,
      paymentNumber: 2,
      totalPayments: 12,
      contactAttempts: 0,
      autoPayEnabled: true,
      riskLevel: 'low'
    }
  ];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading repayments...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && repayments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Repayments</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }




  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowDetails(true);
  };

  const handleExport = () => {
    const csvContent = [
      'Payment ID,Loan ID,Borrower,Amount,Principal,Interest,Due Date,Status,Days Overdue,Risk Level',
      ...filteredRepayments.map(p =>
        `${p.id},${p.loanId},${p.borrowerName},${p.totalAmount},${p.principalAmount},${p.interestAmount},${p.dueDate},${p.status},${p.daysOverdue || 0},${p.riskLevel}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'repayments-export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };


  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="max-w-[1536px] mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight uppercase">Loan Repayments</h1>
            <p className="text-gray-500 mt-1 uppercase text-xs font-bold tracking-widest opacity-70">Monitor and manage loan repayment schedules and collection activities</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 transition-all w-fit"
          >
            <Download size={14} /> Export Audit
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative group min-w-[240px]">
                <input
                  type="text"
                  placeholder="SEARCH REPAYMENTS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full bg-[#fafafa] transition-all shadow-sm"
                />
                <Search className="absolute left-3.5 top-3 text-slate-400 group-hover:text-indigo-500 transition-colors w-3.5 h-3.5" />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm cursor-pointer hover:border-indigo-200 transition-all"
                >
                  <option value="all">ALL STATUS</option>
                  <option value="pending">PENDING</option>
                  <option value="paid">PAID</option>
                  <option value="overdue">OVERDUE</option>
                  <option value="partial">PARTIAL</option>
                  <option value="failed">FAILED</option>
                </select>

                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm cursor-pointer hover:border-indigo-200 transition-all"
                >
                  <option value="all">ALL RISK LEVELS</option>
                  <option value="low">LOW RISK</option>
                  <option value="medium">MEDIUM RISK</option>
                  <option value="high">HIGH RISK</option>
                </select>

                <button
                  onClick={() => setOverdueFilter(!overdueFilter)}
                  className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all flex items-center gap-2 ${overdueFilter ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50'}`}
                >
                  <Filter size={14} />
                  {overdueFilter ? 'OVERDUE ONLY ON' : 'OVERDUE ONLY OFF'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <RepaymentsEnlite
          loading={loading}
          payments={filteredRepayments}
          analytics={repaymentStats}
          onSort={handleSort}
          sortKey={sortField}
          sortDirection={sortDirection}
          onViewDetails={handleViewDetails}
          onContactBorrower={(p) => {
            alert(`Contacting ${p.borrowerName} at ${p.borrowerPhone}`);
          }}
          onRecordPayment={(p) => {
            alert(`Recording payment for ${p.id}`);
          }}
          onExport={handleExport}
        />
      </div>

      {/* Payment Details Audit Modal */}
      {showDetails && selectedPayment && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white border border-slate-100 w-full max-w-2xl shadow-2xl rounded-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-slate-100 px-8 py-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1 block">Audit Report</span>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                  {selectedPayment.id}
                  <span className={`text-[10px] px-2 py-0.5 rounded-md border ${selectedPayment.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                    {selectedPayment.status.toUpperCase()}
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-100 hover:bg-rose-50 transition-all shadow-sm"
              >
                <FaTimesCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-8 text-[11px] font-black uppercase tracking-widest text-slate-400">
                <div className="space-y-4">
                  <span className="text-indigo-600 block pb-1 border-b border-slate-100">Fiscal Details</span>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center group">
                      <span>Total Liability</span>
                      <span className="text-slate-900 font-black">${selectedPayment.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center opacity-60">
                      <span>Principal</span>
                      <span className="text-slate-900">${selectedPayment.principalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center opacity-60">
                      <span>Accrued interest</span>
                      <span className="text-slate-900">${selectedPayment.interestAmount.toLocaleString()}</span>
                    </div>
                    {selectedPayment.lateFee && (
                      <div className="flex justify-between items-center text-rose-500 bg-rose-50/50 p-2 rounded-lg -mx-2">
                        <span>Sanctuary Late Fee</span>
                        <span className="font-black">${selectedPayment.lateFee.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="text-indigo-600 block pb-1 border-b border-slate-100">Borrower Identity</span>
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-900 font-black text-sm">{selectedPayment.borrowerName}</span>
                      <span className="text-[9px] lowercase font-medium opacity-60">{selectedPayment.borrowerEmail}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Risk Assessment</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${selectedPayment.riskLevel === 'low' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
                        {selectedPayment.riskLevel.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center opacity-60">
                      <span>Contact Index</span>
                      <span className="text-slate-900">{selectedPayment.borrowerPhone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loan Analytics Overlay */}
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 grid grid-cols-3 gap-6">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Schedule index</span>
                  <span className="text-sm font-black text-slate-900 uppercase">{selectedPayment.paymentNumber} / {selectedPayment.totalPayments}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Exposure</span>
                  <span className="text-sm font-black text-slate-900 uppercase">${selectedPayment.remainingBalance.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Settlement Status</span>
                  <span className={`text-sm font-black uppercase ${selectedPayment.autoPayEnabled ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {selectedPayment.autoPayEnabled ? 'AUTOMATED' : 'MANUAL'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button
                onClick={() => setShowDetails(false)}
                className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                Dissmiss Report
              </button>
              {selectedPayment.status === 'overdue' && (
                <button className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-200 transition-all flex items-center gap-2">
                  Initiate collection
                </button>
              )}
              {selectedPayment.status !== 'paid' && (
                <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all flex items-center gap-2">
                  Confirm clearance
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepaymentsPage;
