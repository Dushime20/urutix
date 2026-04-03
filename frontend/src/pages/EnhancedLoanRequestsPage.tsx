import React, { useState, useEffect } from 'react';
import { lendingApi } from '../services/lending/lendingApi';
import { useAuth } from '../contexts/AuthContext';
import api, { paymentsAPI } from '../services/api';
import {
  FaSearch,
  FaTimes,
  FaMoneyBillWave,
} from 'react-icons/fa';
import LoanRequestsEnlite from '../components/LenderDashboard/LoanRequests.enlite.tsx';

interface Lender {
  id: string;
  name: string;
  type: 'bank' | 'microfinance' | 'cooperative' | 'individual';
  email: string;
  phone: string;
}

interface LoanRequest {
  id: string;
  cargo_id: string;
  tenant_id: string;
  trip_id: string;
  requested_amount: number;
  approved_amount?: number;
  status: 'pending' | 'approved' | 'rejected' | 'disbursed' | 'repaid' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  due_date?: string;
  borrower_name: string;
  borrower_email: string;
  borrower_phone: string;
  borrower_company?: string;
  cargo_type: string;
  cargo_weight: number;
  cargo_value: number;
  pickup_location: string;
  delivery_location: string;
  distance: number;
  estimated_duration: number;
  risk_score?: number;
  credit_score: number;
  interest_rate: number;
  collateral_type?: string;
  collateral_value?: number;
  purpose: string;
  lender_id?: string;
  lender?: Lender;
  processing_fee: number;
  total_amount: number;
  monthly_payment?: number;
  loan_term_months: number;
}

interface LoanAnalytics {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalAmountRequested: number;
  totalAmountApproved: number;
  averageAmount: number;
  averageRiskScore: number;
  approvalRate: number;
  monthlyGrowth: number;
}

const EnhancedLoanRequestsPage: React.FC = () => {
  const { user, accessToken } = useAuth();
  
  // State for requests and analytics
  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [analytics, setAnalytics] = useState<LoanAnalytics | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for search and filtering
  const [search, setSearch] = useState('');
  const [sortBy] = useState<'created_at' | 'requested_amount' | 'risk_score' | 'borrower_name'>('created_at');
  const [sortDir] = useState<'asc' | 'desc'>('desc');
  const [statusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'disbursed' | 'repaid' | 'overdue'>('all');
  const [priorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');
  const [lenderFilter] = useState<'all' | string>('all');
  
  // State for payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<LoanRequest | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'card' | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [truckOwnerPhone, setTruckOwnerPhone] = useState<string | null>(null);
  const [loadingTruckOwnerInfo, setLoadingTruckOwnerInfo] = useState(false);
  
  // State for payment tracking/details
  const [showPaymentDetailsModal, setShowPaymentDetailsModal] = useState(false);
  const [selectedLoanForPaymentDetails, setSelectedLoanForPaymentDetails] = useState<LoanRequest | null>(null);
  const [loanPayments, setLoanPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  
  // State for calculations
  const [advancePaymentCalculations, setAdvancePaymentCalculations] = useState<Record<string, any>>({});
  const [loadingCalculations, setLoadingCalculations] = useState<Record<string, boolean>>({});

  // Get lender ID from authentication context
  const lenderId = user?.role === 'LENDER' ? user.id : "89fa1340-429e-448f-a19d-0e987679d7cd"; // Fallback to seeded lender ID

  // Fetch advance payment calculation for a loan request
  const fetchAdvancePaymentCalculation = async (tripId: string, loanRequestId: string) => {
    if (!tripId || advancePaymentCalculations[loanRequestId] || loadingCalculations[loanRequestId]) {
      return;
    }

    setLoadingCalculations(prev => ({ ...prev, [loanRequestId]: true }));
    try {
      const response = await paymentsAPI.getAdvancePaymentCalculation(tripId);
      if (response.data?.success && response.data?.data) {
        const calculation = response.data.data;
        setAdvancePaymentCalculations(prev => ({
          ...prev,
          [loanRequestId]: {
            ...calculation,
            transportationFee: Number(calculation.transportationFee) || 0,
            advancePaymentPercentage: Number(calculation.advancePaymentPercentage) || 0,
            advanceAmount: Number(calculation.advanceAmount) || 0,
            finalAmount: Number(calculation.finalAmount) || 0,
            requireAdvancePayment: Boolean(calculation.requireAdvancePayment),
            currency: calculation.currency || 'USD',
          },
        }));
      }
    } catch (error) {
      console.warn(`Could not fetch advance payment calculation for trip ${tripId}:`, error);
    } finally {
      setLoadingCalculations(prev => ({ ...prev, [loanRequestId]: false }));
    }
  };

  useEffect(() => {
    const fetchLoanRequests = async () => {
      if (!lenderId || !accessToken) {
        setFetching(false);
        return;
      }

      setFetching(true);
      setError(null);

      try {
        let actualLenderId = lenderId;
        try {
          const response = await api.get('/lending/my-lender-id');
          if (response.data?.lenderId) {
            actualLenderId = response.data.lenderId;
          }
        } catch (err) {
          console.warn('Could not fetch lender ID from endpoint, using default:', err);
        }

        const [requestsResponse, analyticsData] = await Promise.all([
          lendingApi.getLenderLoanRequests(
            actualLenderId,
            statusFilter !== 'all' ? statusFilter : undefined,
            1,
            100
          ),
          lendingApi.getLenderAnalytics(actualLenderId, '12months').catch((err) => {
            console.warn('Could not fetch analytics:', err);
            return null;
          })
        ]);

        const requestsData = Array.isArray(requestsResponse)
          ? requestsResponse
          : (requestsResponse?.data || requestsResponse || []);

        const transformedRequests: LoanRequest[] = await Promise.all(
          requestsData.map(async (req: any) => {
            let cargoData = null;
            let borrowerData = null;

            if (req.cargo_id || req.cargoId) {
              try {
                const cargoResponse = await api.get(`/loads-v2/${req.cargo_id || req.cargoId}`);
                if (cargoResponse.data) {
                  cargoData = cargoResponse.data;
                  if (cargoData.cargoOwner) {
                    const profile = cargoData.cargoOwner.profile;
                    borrowerData = {
                      name: profile?.firstName && profile?.lastName
                        ? `${profile.firstName} ${profile.lastName}`
                        : cargoData.cargoOwner.companyName || cargoData.cargoOwner.email || 'Unknown',
                      email: cargoData.cargoOwner.email,
                      phone: cargoData.cargoOwner.phone || profile?.phone,
                      companyName: cargoData.cargoOwner.companyName || profile?.companyName
                    };
                  }
                }
              } catch (err) {
                console.warn(`Could not fetch cargo data:`, err);
              }
            }

            const pickupLoc = cargoData?.locations?.find((l: any) => l.type === 'PICKUP') || cargoData?.origin;
            const deliveryLoc = cargoData?.locations?.find((l: any) => l.type === 'DELIVERY') || cargoData?.destination;

            const formatLoc = (loc: any) => {
              if (!loc) return '';
              if (typeof loc === 'string') return loc;
              return loc.address || loc.city || loc.name || '';
            };

            return {
              id: req.id,
              cargo_id: req.cargo_id || req.cargoId,
              tenant_id: req.tenant_id || req.tenantId,
              trip_id: req.trip_id || req.tripId,
              requested_amount: req.requested_amount || req.requestedAmount || 0,
              approved_amount: req.approved_amount || req.approvedAmount,
              status: req.status || 'pending',
              priority: req.priority || 'medium',
              created_at: req.created_at || req.createdAt,
              due_date: req.due_date || req.dueDate,
              borrower_name: borrowerData?.name || req.borrower?.name || 'Unknown Borrower',
              borrower_email: borrowerData?.email || req.borrower?.email || '',
              borrower_phone: borrowerData?.phone || req.borrower?.phone || '',
              borrower_company: borrowerData?.companyName || req.borrower?.companyName,
              cargo_type: cargoData?.cargoType || req.cargoType || 'General Cargo',
              cargo_weight: cargoData?.weight || req.cargoWeight || 0,
              cargo_value: cargoData?.loadValue || req.cargoValue || 0,
              pickup_location: formatLoc(pickupLoc) || 'N/A',
              delivery_location: formatLoc(deliveryLoc) || 'N/A',
              risk_score: req.risk_score || req.riskScore || 50,
              credit_score: req.credit_score || req.creditScore || 600,
              interest_rate: req.interest_rate || req.interestRate || 10,
              purpose: req.purpose || 'Cargo financing',
              lender_id: req.lender_id || req.lenderId,
              processing_fee: req.processing_fee || req.processingFee || 0,
              total_amount: req.total_amount || req.totalAmount || 0,
              loan_term_months: req.loan_term_months || req.loanTermMonths || 12
            };
          })
        );

        const transformedAnalytics: LoanAnalytics = {
          totalRequests: analyticsData?.totalLoanRequests || transformedRequests.length,
          pendingRequests: transformedRequests.filter(r => r.status === 'pending').length,
          approvedRequests: transformedRequests.filter(r => r.status === 'approved').length,
          rejectedRequests: transformedRequests.filter(r => r.status === 'rejected').length,
          totalAmountRequested: transformedRequests.reduce((sum, r) => sum + r.requested_amount, 0),
          totalAmountApproved: transformedRequests.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.requested_amount, 0),
          averageAmount: analyticsData?.averageLoanAmount || (transformedRequests.length > 0 ? transformedRequests.reduce((sum, r) => sum + r.requested_amount, 0) / transformedRequests.length : 0),
          averageRiskScore: analyticsData?.averageRiskScore || 50,
          approvalRate: analyticsData?.approvalRate || (transformedRequests.length > 0 ? (transformedRequests.filter(r => r.status === 'approved').length / transformedRequests.length) * 100 : 0),
          monthlyGrowth: analyticsData?.monthlyGrowthRate || 0
        };

        setRequests(transformedRequests);
        setAnalytics(transformedAnalytics);

        // Fetch calculations for visible requests
        transformedRequests.forEach(req => {
          if (req.trip_id) fetchAdvancePaymentCalculation(req.trip_id, req.id).catch(() => {});
        });

      } catch (err: any) {
        console.error('Error fetching loan requests:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setFetching(false);
      }
    };

    fetchLoanRequests();
  }, [lenderId, accessToken, statusFilter]);

  const handleApproveLoan = async (loanId: string, approvedAmount: number, interestRate: number) => {
    try {
      await lendingApi.approveLoanRequest(loanId, {
        approved_amount: approvedAmount,
        interest_rate: interestRate
      });
      setRequests(prev => prev.map(req => req.id === loanId ? { ...req, status: 'approved' } : req));
      const loan = requests.find(r => r.id === loanId);
      if (loan) {
        setSelectedLoanForPayment({ ...loan, status: 'approved' });
        setShowPaymentModal(true);
        fetchTruckOwnerPhoneNumber(loan);
        if (loan.trip_id) fetchAdvancePaymentCalculation(loan.trip_id, loan.id).catch(() => {});
      }
    } catch (err: any) {
      alert('Failed to approve loan: ' + (err.message || 'Unknown error'));
    }
  };

  const handleRejectLoan = async (loanId: string, reason: string) => {
    try {
      await lendingApi.rejectLoanRequest(loanId, reason);
      setRequests(prev => prev.map(req => req.id === loanId ? { ...req, status: 'rejected' } : req));
    } catch (err: any) {
      alert('Failed to reject loan: ' + (err.message || 'Unknown error'));
    }
  };

  const fetchTruckOwnerPhoneNumber = async (loan: LoanRequest) => {
    try {
      setLoadingTruckOwnerInfo(true);
      const tripId = loan.trip_id;
      if (tripId) {
        const tripResp = await api.get(`/trips/${tripId}`);
        const trip = tripResp.data?.data || tripResp.data;
        const ownerId = trip?.assignedTruck?.ownerId || trip?.assignedTruck?.owner?.id;
        if (ownerId) {
          const profileResp = await api.get('/users/profile-by-id', { params: { userId: ownerId } });
          const profile = profileResp.data?.data?.profile || profileResp.data?.profile;
          const phone = profile?.preferences?.paymentInfo?.phoneNumber || profile?.phone || trip?.assignedTruck?.owner?.phone;
          if (phone) setTruckOwnerPhone(phone);
        }
      }
    } catch (error) {
      console.error('Error fetching truck owner phone:', error);
    } finally {
      setLoadingTruckOwnerInfo(false);
    }
  };

  const fetchLoanPayments = async (loanId: string) => {
    try {
      setLoadingPayments(true);
      const loan = requests.find(r => r.id === loanId);
      if (loan?.trip_id) {
        const resp = await api.get('/payments', { params: { tripId: loan.trip_id } });
        setLoanPayments(resp.data?.payments || resp.data?.data?.payments || []);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedLoanForPayment || !paymentMethod) return;
    if (paymentMethod === 'momo') {
      try {
        setProcessingPayment(true);
        if (!truckOwnerPhone) {
          alert('Phone number required');
          return;
        }
        const amount = selectedLoanForPayment.approved_amount || selectedLoanForPayment.requested_amount;
        const resp = await api.post('/payments/mobile-money/send', {
          receiverPhoneNumber: truckOwnerPhone.trim(),
          amount,
          currency: 'RWF',
          tripId: selectedLoanForPayment.trip_id,
          metadata: {
            isLenderPayment: true,
            lenderId: selectedLoanForPayment.lender_id,
            lenderName: user?.firstName || 'Lender',
            loanId: selectedLoanForPayment.id,
          }
        });

        if (resp.data?.success) {
          alert('Payment initiated!');
          setShowPaymentModal(false);
          setRequests(prev => prev.map(r => r.id === selectedLoanForPayment.id ? { ...r, status: 'disbursed' } : r));
        }
      } catch (error: any) {
        alert('Payment failed: ' + (error.response?.data?.message || 'Error'));
      } finally {
        setProcessingPayment(false);
      }
    } else {
      alert('Card payment not implemented');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-1.5">Access Required</h2>
          <p className="text-sm text-gray-600">Please log in to access loan requests.</p>
        </div>
      </div>
    );
  }

  const filtered = requests.filter(r => {
    const matchesSearch = r.borrower_name.toLowerCase().includes(search.toLowerCase()) || 
                          r.borrower_company?.toLowerCase().includes(search.toLowerCase()) ||
                          r.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || r.priority === priorityFilter;
    const matchesLender = lenderFilter === 'all' || r.lender_id === lenderFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesLender;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortBy === 'requested_amount') return (a.requested_amount - b.requested_amount) * dir;
    if (sortBy === 'borrower_name') return a.borrower_name.localeCompare(b.borrower_name) * dir;
    return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
  });

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 p-6 md:p-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 mb-8">
          <div className="flex flex-col">
            <h2 className="text-3xl font-black text-[#0f172a] dark:text-white tracking-tight uppercase">
              Loan <span className="text-[#345E85] dark:text-blue-400">Requests</span>
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Real-time financing workflow management
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-[#345E85] dark:group-focus-within:text-blue-400 transition-colors" />
              <input 
                type="text"
                placeholder="SEARCH LOANS..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-14 pr-6 text-[10px] font-black uppercase tracking-[0.1em] text-slate-600 dark:text-slate-300 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 focus:border-blue-200 dark:focus:border-blue-700 transition-all w-64 lg:w-80"
              />
            </div>
          </div>
        </div>

        {/* Global Component */}
        <LoanRequestsEnlite
          loading={fetching}
          requests={sorted}
          analytics={analytics}
          onApprove={handleApproveLoan}
          onReject={handleRejectLoan}
          onViewDetails={(req) => alert(`Details for ${req.borrower_name}`)}
          onProcessPayment={(req) => {
            setSelectedLoanForPayment(req);
            setShowPaymentModal(true);
            fetchTruckOwnerPhoneNumber(req);
          }}
          onViewPaymentDetails={(req) => {
            setSelectedLoanForPaymentDetails(req);
            fetchLoanPayments(req.id);
            setShowPaymentDetailsModal(true);
          }}
          onExport={() => alert('Exporting...')}
        />
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedLoanForPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Complete <span className="text-blue-600">Payment</span></h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-2 bg-slate-50 rounded-xl">
                  <FaTimes size={18} />
                </button>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Disbursement Amount</p>
                <p className="text-3xl font-black text-slate-900">RWF {selectedLoanForPayment.requested_amount.toLocaleString()}</p>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => setPaymentMethod('momo')}
                  className={`w-full p-6 rounded-2xl border-2 transition-all flex items-center gap-4 ${paymentMethod === 'momo' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${paymentMethod === 'momo' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <FaMoneyBillWave size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-900 text-sm uppercase">Mobile Money</p>
                    <p className="text-[10px] text-slate-500 font-medium">Instant transfer to truck owner</p>
                  </div>
                </button>

                {paymentMethod === 'momo' && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                    <input 
                      type="text"
                      value={truckOwnerPhone || ''}
                      onChange={(e) => setTruckOwnerPhone(e.target.value)}
                      placeholder="Enter Momo Phone Number"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all"
                    />
                  </div>
                )}

                <div className="flex gap-3 mt-8">
                  <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                  <button 
                    onClick={handleProcessPayment}
                    disabled={!paymentMethod || processingPayment}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 py-4 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200 transition-all"
                  >
                    {processingPayment ? 'Processing...' : 'Confirm Payment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedLoanRequestsPage;
