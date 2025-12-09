import React, { useState, useEffect } from 'react';
import { lendingApi } from '../services/lending/lendingApi';
import { useAuth } from '../contexts/AuthContext';
import api, { paymentsAPI } from '../services/api';
import { calculateAdvancePayment, formatCurrency as formatCurrencyUtil, formatPercentage } from '../utils/paymentCalculations';
import {
  FaSearch,
  FaEye,
  FaCheck,
  FaTimes,
  FaMoneyBillWave,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaChartLine,
  FaDollarSign,
  FaUsers,
  FaArrowUp,
  FaArrowDown,
  FaDownload,
  FaEllipsisH,
  FaHistory,
  FaEdit,
  FaFileContract,
  FaEnvelope,
  FaBuilding,
  FaStar,
  FaBars,
  FaCreditCard,
  FaRedo
} from 'react-icons/fa';

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

const mockFetchLoanRequests = async (): Promise<LoanRequest[]> => {
  // Mock lenders data
  const lenders: Lender[] = [
    {
      id: '1',
      name: 'Bank of Kigali',
      type: 'bank',
      email: 'lending@bk.rw',
      phone: '+250788900100'
    },
    {
      id: '2', 
      name: 'Urwego Opportunity Bank',
      type: 'microfinance',
      email: 'loans@urwego.com',
      phone: '+250788900200'
    },
    {
      id: '3',
      name: 'SACCO Munyax',
      type: 'cooperative',
      email: 'credit@saccomunyax.rw',
      phone: '+250788900300'
    }
  ];

  return [
    {
      id: '1',
      cargo_id: 'cargo_001',
      tenant_id: 'tenant_001',
      trip_id: 'trip_001',
      requested_amount: 15000000,
      status: 'pending',
      priority: 'high',
      created_at: '2025-08-10T14:30:00Z',
      due_date: '2025-09-10T14:30:00Z',
      borrower_name: 'Jean Baptiste Uwimana',
      borrower_email: 'jean@cargocompany.rw',
      borrower_phone: '+250788123456',
      borrower_company: 'Kigali Cargo Services',
      cargo_type: 'Electronics',
      cargo_weight: 2500,
      cargo_value: 25000000,
      pickup_location: 'Kigali, Rwanda',
      delivery_location: 'Kampala, Uganda',
      distance: 380,
      estimated_duration: 8,
      risk_score: 78,
      credit_score: 750,
      interest_rate: 12.5,
      collateral_type: 'Vehicle',
      collateral_value: 18000000,
      purpose: 'Cargo transportation financing',
      lender_id: '1',
      lender: lenders[0],
      processing_fee: 150000,
      total_amount: 16875000,
      monthly_payment: 1406250,
      loan_term_months: 12
    },
    {
      id: '2',
      cargo_id: 'cargo_002',
      tenant_id: 'tenant_002',
      trip_id: 'trip_002',
      requested_amount: 8500000,
      status: 'approved',
      priority: 'medium',
      created_at: '2025-08-09T10:15:00Z',
      due_date: '2025-09-09T10:15:00Z',
      borrower_name: 'Marie Claire Mukamana',
      borrower_email: 'marie@transportrw.com',
      borrower_phone: '+250788654321',
      borrower_company: 'Express Transport Ltd',
      cargo_type: 'Textiles',
      cargo_weight: 1800,
      cargo_value: 12000000,
      pickup_location: 'Nairobi, Kenya',
      delivery_location: 'Dar es Salaam, Tanzania',
      distance: 460,
      estimated_duration: 10,
      risk_score: 85,
      credit_score: 680,
      interest_rate: 14.0,
      collateral_type: 'Cargo',
      collateral_value: 12000000,
      purpose: 'Working capital for cargo operations',
      lender_id: '2',
      lender: lenders[1],
      processing_fee: 85000,
      total_amount: 9690000,
      monthly_payment: 807500,
      loan_term_months: 12
    },
    {
      id: '3',
      cargo_id: 'cargo_003',
      tenant_id: 'tenant_003',
      trip_id: 'trip_003',
      requested_amount: 22000000,
      status: 'disbursed',
      priority: 'high',
      created_at: '2025-08-08T16:45:00Z',
      due_date: '2025-10-08T16:45:00Z',
      borrower_name: 'Paul Ntakirutimana',
      borrower_email: 'paul@elitecargo.rw',
      borrower_phone: '+250788111222',
      borrower_company: 'Elite Cargo Services',
      cargo_type: 'Machinery',
      cargo_weight: 4200,
      cargo_value: 45000000,
      pickup_location: 'Durban, South Africa',
      delivery_location: 'Kigali, Rwanda',
      distance: 2100,
      estimated_duration: 48,
      risk_score: 92,
      credit_score: 720,
      interest_rate: 11.0,
      collateral_type: 'Real Estate',
      collateral_value: 30000000,
      purpose: 'Equipment import financing',
      lender_id: '1',
      lender: lenders[0],
      processing_fee: 220000,
      total_amount: 24420000,
      monthly_payment: 2035000,
      loan_term_months: 12
    },
    {
      id: '4',
      cargo_id: 'cargo_004',
      tenant_id: 'tenant_004',
      trip_id: 'trip_004',
      requested_amount: 5200000,
      status: 'rejected',
      priority: 'low',
      created_at: '2025-08-07T09:20:00Z',
      borrower_name: 'Alice Uwimana',
      borrower_email: 'alice@logistics.rw',
      borrower_phone: '+250788333444',
      borrower_company: 'Quick Logistics',
      cargo_type: 'Agricultural Products',
      cargo_weight: 1200,
      cargo_value: 8000000,
      pickup_location: 'Musanze, Rwanda',
      delivery_location: 'Mombasa, Kenya',
      distance: 1200,
      estimated_duration: 24,
      risk_score: 45,
      credit_score: 520,
      interest_rate: 18.0,
      purpose: 'Seasonal cargo financing',
      processing_fee: 52000,
      total_amount: 6136000,
      loan_term_months: 6
    },
    {
      id: '5',
      cargo_id: 'cargo_005',
      tenant_id: 'tenant_005',
      trip_id: 'trip_005',
      requested_amount: 12800000,
      status: 'pending',
      priority: 'urgent',
      created_at: '2025-08-11T11:00:00Z',
      due_date: '2025-09-11T11:00:00Z',
      borrower_name: 'Eric Habimana',
      borrower_email: 'eric@transport.rw',
      borrower_phone: '+250788555666',
      cargo_type: 'Medical Supplies',
      cargo_weight: 800,
      cargo_value: 20000000,
      pickup_location: 'Mumbai, India',
      delivery_location: 'Kigali, Rwanda',
      distance: 6500,
      estimated_duration: 120,
      risk_score: 88,
      credit_score: 640,
      interest_rate: 13.5,
      collateral_type: 'Cargo',
      collateral_value: 20000000,
      purpose: 'Emergency medical supplies import',
      lender_id: '3',
      lender: lenders[2],
      processing_fee: 128000,
      total_amount: 14598400,
      monthly_payment: 1216533,
      loan_term_months: 12
    },
    {
      id: '6',
      cargo_id: 'cargo_006',
      tenant_id: 'tenant_006',
      trip_id: 'trip_006',
      requested_amount: 7500000,
      status: 'overdue',
      priority: 'high',
      created_at: '2025-07-15T08:30:00Z',
      due_date: '2025-08-15T08:30:00Z',
      borrower_name: 'Grace Mukamana',
      borrower_email: 'grace@freightco.rw',
      borrower_phone: '+250788777888',
      borrower_company: 'Freight Solutions Co.',
      cargo_type: 'Construction Materials',
      cargo_weight: 3500,
      cargo_value: 15000000,
      pickup_location: 'Mombasa, Kenya',
      delivery_location: 'Kigali, Rwanda',
      distance: 1100,
      estimated_duration: 20,
      risk_score: 65,
      credit_score: 590,
      interest_rate: 16.0,
      collateral_type: 'Equipment',
      collateral_value: 10000000,
      purpose: 'Construction project financing',
      lender_id: '2',
      lender: lenders[1],
      processing_fee: 75000,
      total_amount: 8700000,
      monthly_payment: 725000,
      loan_term_months: 12
    }
  ];
};

const mockFetchAnalytics = async (): Promise<LoanAnalytics> => {
  return {
    totalRequests: 6,
    pendingRequests: 2,
    approvedRequests: 1,
    rejectedRequests: 1,
    totalAmountRequested: 71000000,
    totalAmountApproved: 15000000,
    averageAmount: 11833333,
    averageRiskScore: 75.5,
    approvalRate: 33.3,
    monthlyGrowth: 25.8
  };
};

// Helper functions for styling
const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'approved': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
    case 'disbursed': return 'bg-green-50 text-green-700 border-green-200';
    case 'repaid': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'overdue': return 'bg-red-100 text-red-800 border-red-300';
    default: return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'low': return 'bg-gray-50 text-gray-600 border-gray-200';
    case 'medium': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'high': return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'urgent': return 'bg-red-50 text-red-700 border-red-200';
    default: return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

const getRiskScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
};

const EnhancedLoanRequestsPage: React.FC = () => {
  const { user, accessToken } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<LoanRequest | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'card' | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [truckOwnerPhone, setTruckOwnerPhone] = useState<string | null>(null);
  const [loadingTruckOwnerInfo, setLoadingTruckOwnerInfo] = useState(false);
  const [showPaymentDetailsModal, setShowPaymentDetailsModal] = useState(false);
  const [selectedLoanForPaymentDetails, setSelectedLoanForPaymentDetails] = useState<LoanRequest | null>(null);
  const [loanPayments, setLoanPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [newPaymentStatus, setNewPaymentStatus] = useState<string>('');
  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [analytics, setAnalytics] = useState<LoanAnalytics | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'requested_amount' | 'risk_score' | 'borrower_name'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [openActionRow, setOpenActionRow] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'disbursed' | 'repaid' | 'overdue'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');
  const [lenderFilter, setLenderFilter] = useState<'all' | string>('all');
  const [groupByLender, setGroupByLender] = useState(false);
  const [groupByStatus, setGroupByStatus] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(true);
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
        setAdvancePaymentCalculations(prev => ({
          ...prev,
          [loanRequestId]: response.data.data,
        }));
      }
    } catch (error) {
      console.warn(`Could not fetch advance payment calculation for trip ${tripId}:`, error);
    } finally {
      setLoadingCalculations(prev => ({ ...prev, [loanRequestId]: false }));
    }
  };

  // Authentication checks
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

  useEffect(() => {
    const fetchLoanRequests = async () => {
      if (!lenderId || !accessToken) {
        console.log('EnhancedLoanRequestsPage: No lender ID or access token available');
        setFetching(false);
        return;
      }

      setFetching(true);
      setError(null);
      
      try {
        console.log('EnhancedLoanRequestsPage: Loading loan requests for lender:', lenderId);
        
        // First, get the Lender entity ID from the User ID
        let actualLenderId = lenderId;
        try {
          // Try to get lender ID from the backend endpoint
          const response = await api.get('/lending/my-lender-id');
          if (response.data?.lenderId) {
            actualLenderId = response.data.lenderId;
            console.log('EnhancedLoanRequestsPage: Found lender entity ID:', actualLenderId);
          }
        } catch (err: any) {
          console.warn('Could not fetch lender ID from endpoint, trying fallback:', err);
          // Fallback: Try to get lender by user email
          try {
            const tenantLenders = await lendingApi.getTenantLenders();
            const lender = Array.isArray(tenantLenders) 
              ? tenantLenders.find((l: any) => l.contact_email === user?.email || l.id === lenderId)
              : null;
            if (lender) {
              actualLenderId = lender.id;
              console.log('EnhancedLoanRequestsPage: Found lender entity ID via fallback:', actualLenderId);
            }
          } catch (fallbackErr) {
            console.warn('Could not fetch tenant lenders, using user ID:', fallbackErr);
          }
        }
        
        // Fetch loan requests and analytics from real APIs
        const [requestsResponse, analyticsData] = await Promise.all([
          lendingApi.getLenderLoanRequests(
            actualLenderId, 
            statusFilter !== 'all' ? statusFilter : undefined,
            1, // page
            100 // limit
          ),
          lendingApi.getLenderAnalytics(actualLenderId, '12months').catch((err) => {
            console.warn('Could not fetch analytics, will calculate from loan requests:', err);
            return null;
          })
        ]);

        // Extract data array from response (response might be { data: [...], total, page, ... } or just array)
        const requestsData = Array.isArray(requestsResponse) 
          ? requestsResponse 
          : (requestsResponse?.data || requestsResponse || []);

        console.log('EnhancedLoanRequestsPage: Received loan requests:', requestsData.length);

        // Fetch cargo details for each loan request to populate borrower and cargo info
        const transformedRequests: LoanRequest[] = await Promise.all(
          requestsData.map(async (req: any) => {
            let cargoData = null;
            let borrowerData = null;
            
            // Fetch cargo/load details if cargo_id is available
            if (req.cargo_id) {
              try {
                const cargoResponse = await api.get(`/loads-v2/${req.cargo_id}`);
                if (cargoResponse.data) {
                  cargoData = cargoResponse.data;
                  // Extract borrower (cargo owner) info from cargo
                  if (cargoData.cargoOwner) {
                    borrowerData = {
                      name: cargoData.cargoOwner.profile?.firstName && cargoData.cargoOwner.profile?.lastName
                        ? `${cargoData.cargoOwner.profile.firstName} ${cargoData.cargoOwner.profile.lastName}`
                        : cargoData.cargoOwner.companyName || cargoData.cargoOwner.email || 'Unknown',
                      email: cargoData.cargoOwner.email,
                      phone: cargoData.cargoOwner.phone || cargoData.cargoOwner.profile?.phone,
                      companyName: cargoData.cargoOwner.companyName || cargoData.cargoOwner.profile?.companyName
                    };
                  }
                }
              } catch (err) {
                console.warn(`Could not fetch cargo ${req.cargo_id}:`, err);
              }
            }
            
            // Extract location info from cargo (handle gracefully if cargo data is not available)
            const pickupLoc = cargoData?.locations?.find((l: any) => l.type === 'PICKUP') || cargoData?.origin;
            const deliveryLoc = cargoData?.locations?.find((l: any) => l.type === 'DELIVERY') || cargoData?.destination;
            
            // Format location strings safely
            const formatLocation = (loc: any) => {
              if (!loc) return '';
              if (typeof loc === 'string') return loc;
              if (loc.address) return loc.address;
              if (loc.city) return loc.city;
              if (loc.name) return loc.name;
              return '';
            };
            
            return {
              id: req.id,
              cargo_id: req.cargo_id || req.cargoId,
              tenant_id: req.tenant_id || req.tenantId,
              trip_id: req.trip_id || req.tripId,
              requested_amount: req.requested_amount || req.requestedAmount || 0,
              status: req.status || 'pending',
              priority: req.priority || 'medium',
              created_at: req.created_at || req.createdAt,
              due_date: req.due_date || req.dueDate,
              borrower_name: borrowerData?.name || req.borrower?.name || `${req.borrower?.firstName || ''} ${req.borrower?.lastName || ''}`.trim() || 'Unknown Borrower',
              borrower_email: borrowerData?.email || req.borrower?.email || '',
              borrower_phone: borrowerData?.phone || req.borrower?.phone || '',
              borrower_company: borrowerData?.companyName || req.borrower?.companyName || req.borrower?.company,
              cargo_type: cargoData?.cargoType || req.cargo?.type || req.cargoType || 'General Cargo',
              cargo_weight: cargoData?.weight || req.cargo?.weight || req.cargoWeight || 0,
              cargo_value: cargoData?.loadValue || req.cargo?.value || req.cargoValue || 0,
              pickup_location: formatLocation(pickupLoc) || req.cargo?.pickupLocation || req.pickupLocation || 'Not Available',
              delivery_location: formatLocation(deliveryLoc) || req.cargo?.deliveryLocation || req.deliveryLocation || 'Not Available',
              distance: cargoData?.distance || req.cargo?.distance || req.distance || 0,
              estimated_duration: cargoData?.estimatedDuration || req.cargo?.estimatedDuration || req.estimatedDuration || 0,
              risk_score: req.risk_score || req.riskScore || 50,
              credit_score: req.borrower?.creditScore || req.creditScore || 600,
              interest_rate: req.interest_rate || req.interestRate || 10,
              collateral_type: req.collateral_type || req.collateralType,
              collateral_value: req.collateral_value || req.collateralValue,
              purpose: req.purpose || 'Cargo financing',
              lender_id: req.lender_id || req.lenderId,
              lender: req.lender ? {
                ...req.lender,
                type: req.lender.type || undefined, // Ensure type is defined or undefined, not null
              } : undefined,
              processing_fee: req.processing_fee || req.processingFee || 0,
              total_amount: req.total_amount || req.totalAmount || 0,
              monthly_payment: req.monthly_payment || req.monthlyPayment,
              loan_term_months: req.loan_term_months || req.loanTermMonths || 12
            };
          })
        );

        // Transform analytics data (handle null analyticsData)
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

        // Fetch advance payment calculations for all requests with trip_id
        transformedRequests.forEach((req) => {
          if (req.trip_id) {
            fetchAdvancePaymentCalculation(req.trip_id, req.id).catch(() => {
              // Silently fail - calculation is optional
            });
          }
        });

      } catch (err: any) {
        console.error('Error fetching loan requests:', err);
        setError(err.message || 'Failed to load loan requests');
        setRequests([]);
        setAnalytics(null);
      } finally {
        setFetching(false);
      }
    };

    fetchLoanRequests();
  }, [lenderId, accessToken, statusFilter]); // Re-fetch when lender, authentication, or status filter changes

  // Function to handle loan approval
  const handleApproveLoan = async (loanId: string, approvedAmount: number, interestRate: number) => {
    try {
      const response = await lendingApi.approveLoanRequest(loanId, {
        approved_amount: approvedAmount,
        interest_rate: interestRate
      });
      
      // Find the approved loan request
      const approvedLoan = requests.find(req => req.id === loanId);
      if (approvedLoan) {
        // Update the loan status
        setRequests(prev => prev.map(req => 
          req.id === loanId 
            ? { ...req, status: 'approved' as const }
            : req
        ));
        
        // Show payment modal
        setSelectedLoanForPayment({ ...approvedLoan, status: 'approved' });
        setShowPaymentModal(true);
        
        // Fetch truck owner's phone number automatically
        fetchTruckOwnerPhoneNumber(approvedLoan);
        
        // Fetch advance payment calculation if trip_id exists
        if (approvedLoan.trip_id) {
          fetchAdvancePaymentCalculation(approvedLoan.trip_id, approvedLoan.id);
        }
      }
    } catch (err: any) {
      console.error('Error approving loan:', err);
      alert('Failed to approve loan: ' + (err.message || 'Unknown error'));
    }
  };

  // Function to handle loan rejection
  const handleRejectLoan = async (loanId: string, reason: string) => {
    try {
      await lendingApi.rejectLoanRequest(loanId, reason);
      
      // Refresh the data
      setRequests(prev => prev.map(req => 
        req.id === loanId 
          ? { ...req, status: 'rejected' as const }
          : req
      ));
    } catch (err: any) {
      console.error('Error rejecting loan:', err);
      alert('Failed to reject loan: ' + (err.message || 'Unknown error'));
    }
  };

  // Function to fetch truck owner's phone number from payment info
  const fetchTruckOwnerPhoneNumber = async (loan: LoanRequest) => {
    if (!loan.trip_id && !loan.cargo_id) return;
    
    try {
      setLoadingTruckOwnerInfo(true);
      
      // Get trip details to find the truck owner
      let tripId = loan.trip_id;
      if (!tripId && loan.cargo_id) {
        // Try to get trip from cargo
        const cargoResponse = await api.get(`/loads-v2/${loan.cargo_id}`);
        const trip = cargoResponse.data?.trip || cargoResponse.data?.trips?.[0];
        tripId = trip?.id;
      }
      
      if (tripId) {
        // Get trip with truck and owner details
        const tripResponse = await api.get(`/trips/${tripId}`);
        const trip = tripResponse.data?.data || tripResponse.data;
        
        // Get truck owner ID
        const truckOwnerId = trip?.assignedTruck?.ownerId || trip?.assignedTruck?.owner?.id;
        
        if (truckOwnerId) {
          // Fetch truck owner's profile to get payment info
          const ownerProfileResponse = await api.get('/users/profile-by-id', {
            params: { userId: truckOwnerId }
          });
          
          const ownerProfile = ownerProfileResponse.data?.data?.profile || 
                             ownerProfileResponse.data?.profile ||
                             ownerProfileResponse.data?.data;
          
          // Extract phone number from payment info
          const phoneNumber = ownerProfile?.preferences?.paymentInfo?.phoneNumber ||
                            ownerProfile?.phone ||
                            trip?.assignedTruck?.owner?.phone;
          
          if (phoneNumber) {
            setTruckOwnerPhone(phoneNumber);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching truck owner phone number:', error);
      // Don't show error to user, just log it
    } finally {
      setLoadingTruckOwnerInfo(false);
    }
  };

  // Function to fetch payments for a loan
  const fetchLoanPayments = async (loanId: string) => {
    try {
      setLoadingPayments(true);
      
      // Get trip ID from loan
      const loan = requests.find(r => r.id === loanId);
      if (!loan?.trip_id) {
        // Try to get trip from cargo
        if (loan?.cargo_id) {
          const cargoResponse = await api.get(`/loads-v2/${loan.cargo_id}`);
          const trip = cargoResponse.data?.trip || cargoResponse.data?.trips?.[0];
          if (trip?.id) {
            const paymentsResponse = await api.get('/payments', {
              params: { tripId: trip.id }
            });
            setLoanPayments(paymentsResponse.data?.payments || paymentsResponse.data?.data?.payments || []);
            setLoadingPayments(false);
            return;
          }
        }
        setLoanPayments([]);
        setLoadingPayments(false);
        return;
      }
      
      // Fetch payments for the trip
      const paymentsResponse = await api.get('/payments', {
        params: { tripId: loan.trip_id }
      });
      
      setLoanPayments(paymentsResponse.data?.payments || paymentsResponse.data?.data?.payments || []);
    } catch (error) {
      console.error('Error fetching loan payments:', error);
      setLoanPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  // Function to update payment status
  const handleUpdatePaymentStatus = async (paymentId: string, newStatus: string) => {
    try {
      const response = await api.patch(`/payments/${paymentId}/status`, {
        status: newStatus,
      });
      
      if (response.data) {
        // Refresh payments
        if (selectedLoanForPaymentDetails) {
          await fetchLoanPayments(selectedLoanForPaymentDetails.id);
        }
        
        // If status changed to pending, show retry payment option
        if (newStatus === 'pending' && selectedLoanForPaymentDetails) {
          // Optionally auto-open payment modal
          setShowPaymentDetailsModal(false);
          setSelectedLoanForPayment(selectedLoanForPaymentDetails);
          setShowPaymentModal(true);
          fetchTruckOwnerPhoneNumber(selectedLoanForPaymentDetails);
          
          // Fetch advance payment calculation if trip_id exists
          if (selectedLoanForPaymentDetails.trip_id) {
            fetchAdvancePaymentCalculation(selectedLoanForPaymentDetails.trip_id, selectedLoanForPaymentDetails.id);
          }
        }
        
        setEditingPaymentId(null);
        setNewPaymentStatus('');
        alert('Payment status updated successfully');
      }
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      alert(error.response?.data?.message || 'Failed to update payment status');
    }
  };

  // Function to handle payment processing
  const handleProcessPayment = async () => {
    if (!selectedLoanForPayment || !paymentMethod) return;

    if (paymentMethod === 'momo') {
      try {
        setProcessingPayment(true);
        
        // Use truck owner's phone number (should be pre-filled)
        if (!truckOwnerPhone) {
          alert('Truck owner phone number not found. Please ensure the truck owner has added their payment information.');
          setProcessingPayment(false);
          return;
        }

        // Call the disburse-with-payment endpoint
        const response = await api.post(
          `/lending/loan-requests/${selectedLoanForPayment.id}/disburse-with-payment`,
          {
            paymentMethod: 'mobile_money',
            truckOwnerPhoneNumber: truckOwnerPhone,
          }
        );

        if (response.data?.success) {
          alert('Mobile Money payment initiated successfully! The truck owner will receive the payment on their phone.');
          
          // Refresh loan requests
          fetchLoanRequests();
          
          // Close modal and reset
          setShowPaymentModal(false);
          setSelectedLoanForPayment(null);
          setPaymentMethod(null);
          setTruckOwnerPhone(null);
        } else {
          alert('Failed to initiate payment. Please try again.');
        }
      } catch (error: any) {
        console.error('Payment error:', error);
        alert(error.response?.data?.message || 'Failed to process payment. Please try again.');
      } finally {
        setProcessingPayment(false);
      }
    } else {
      // Card payment - TODO: implement card payment gateway
      alert(`Card payment integration is not yet available. Please use Mobile Money for now.`);
    }
  };

  // Loading state
  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-600">Loading loan requests...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && requests.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <FaExclamationTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1.5">Error Loading Loan Requests</h2>
          <p className="text-sm text-gray-600 mb-3">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const toggleSort = (field: 'created_at' | 'requested_amount' | 'risk_score' | 'borrower_name') => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const handleExport = () => {
    const csvData = filtered.map(r => ({
      ID: r.id,
      'Borrower Name': r.borrower_name,
      'Company': r.borrower_company || 'N/A',
      'Email': r.borrower_email,
      'Phone': r.borrower_phone,
      'Amount Requested': r.requested_amount,
      'Status': r.status,
      'Priority': r.priority,
      'Cargo Type': r.cargo_type,
      'Risk Score': r.risk_score || 'N/A',
      'Credit Score': r.credit_score,
      'Interest Rate': r.interest_rate + '%',
      'Lender': r.lender?.name || 'Unassigned',
      'Created Date': new Date(r.created_at).toLocaleDateString(),
      'Due Date': r.due_date ? new Date(r.due_date).toLocaleDateString() : 'N/A'
    }));
    
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loan-requests-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = requests.filter(r => {
    if (!search && statusFilter === 'all' && priorityFilter === 'all' && lenderFilter === 'all') return true;
    
    const matchesSearch = !search || [
      r.borrower_name, 
      r.borrower_email, 
      r.borrower_company, 
      r.cargo_type, 
      r.pickup_location, 
      r.delivery_location,
      r.purpose
    ].some(field => field?.toLowerCase().includes(search.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || r.priority === priorityFilter;
    const matchesLender = lenderFilter === 'all' || r.lender_id === lenderFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesLender;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortBy === 'borrower_name') return a.borrower_name.localeCompare(b.borrower_name) * dir;
    if (sortBy === 'requested_amount') return (a.requested_amount - b.requested_amount) * dir;
    if (sortBy === 'risk_score') return ((a.risk_score || 0) - (b.risk_score || 0)) * dir;
    return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
  });

  // Get unique lenders for filter dropdown
  const uniqueLenders = Array.from(new Set(requests.map(r => r.lender).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100 px-4 py-3 mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                <FaFileContract className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Loan Requests Dashboard</h1>
                <p className="text-xs text-gray-600 mt-0.5">Review and manage loan applications from cargo borrowers</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setGroupByStatus(!groupByStatus)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs border rounded-lg transition-colors ${
                  groupByStatus 
                    ? 'bg-purple-50 border-purple-200 text-purple-700' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <FaBars className="text-purple-600 w-3 h-3" />
                {groupByStatus ? 'Grouped' : 'Group'} Status
              </button>
              <button
                onClick={() => setGroupByLender(!groupByLender)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs border rounded-lg transition-colors ${
                  groupByLender 
                    ? 'bg-blue-50 border-blue-200 text-blue-700' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <FaUsers className="text-blue-600 w-3 h-3" />
                {groupByLender ? 'Grouped' : 'Group'} Lender
              </button>
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FaChartLine className="text-blue-600 w-3 h-3" />
                {showAnalytics ? 'Hide' : 'Show'} Analytics
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FaDownload className="text-green-600 w-3 h-3" /> Export
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Dashboard */}
        {showAnalytics && analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium">Total Requests</p>
                  <p className="text-lg font-bold text-gray-900 mt-0.5">{analytics.totalRequests}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <FaArrowUp className="w-2.5 h-2.5" /> +{analytics.monthlyGrowth}% this month
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaFileContract className="text-blue-600 text-sm" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium">Pending Requests</p>
                  <p className="text-lg font-bold text-gray-900 mt-0.5">{analytics.pendingRequests}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {((analytics.pendingRequests / analytics.totalRequests) * 100).toFixed(1)}% of total
                  </p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <FaClock className="text-yellow-600 text-sm" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium">Total Requested</p>
                  <p className="text-lg font-bold text-gray-900 mt-0.5">RWF {(analytics.totalAmountRequested / 1000000).toFixed(1)}M</p>
                  <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                    <FaDollarSign className="w-2.5 h-2.5" /> Avg: RWF {(analytics.averageAmount / 1000000).toFixed(1)}M
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FaMoneyBillWave className="text-purple-600 text-sm" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium">Approval Rate</p>
                  <p className="text-lg font-bold text-gray-900 mt-0.5">{analytics.approvalRate.toFixed(1)}%</p>
                  <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                    <FaStar className="w-2.5 h-2.5" /> Avg Risk: {analytics.averageRiskScore.toFixed(1)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <FaCheckCircle className="text-emerald-600 text-sm" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loan Requests Management Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-3 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Loan Applications</h2>
                <p className="text-xs text-gray-500 mt-0.5">Review borrower applications with advanced filtering and risk assessment</p>
              </div>
              
              {/* Advanced Filters */}
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search requests..."
                    className="pl-9 pr-3 py-1.5 w-full sm:w-64 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="disbursed">Disbursed</option>
                  <option value="repaid">Repaid</option>
                  <option value="overdue">Overdue</option>
                </select>
                
                <select
                  value={priorityFilter}
                  onChange={e => setPriorityFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>

                <select
                  value={lenderFilter}
                  onChange={e => setLenderFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Lenders</option>
                  {uniqueLenders.map(lender => (
                    <option key={lender?.id} value={lender?.id}>{lender?.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="p-3">
            {fetching && (
              <div className="animate-pulse space-y-2">
                {[...Array(3)].map((_,i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-lg" />
                ))}
              </div>
            )}

            {!fetching && sorted.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                  <FaFileContract className="text-blue-500 text-lg" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800 mb-1">No loan requests found</h3>
                <p className="text-gray-500 text-xs mb-4">
                  {search || statusFilter !== 'all' || priorityFilter !== 'all' || lenderFilter !== 'all'
                    ? 'Try adjusting your filters or search terms.'
                    : 'No loan requests have been submitted yet.'
                  }
                </p>
              </div>
            )}

            {!fetching && sorted.length > 0 && (
              <div className="relative">
                {/* Table View */}
                <div className="overflow-x-auto rounded-lg ring-1 ring-gray-200">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600 select-none">
                      <tr>
                        <th onClick={() => toggleSort('borrower_name')} className="pl-4 pr-2 py-2.5 font-semibold text-left cursor-pointer group">
                          <div className="inline-flex items-center gap-1">
                            Borrower
                            {sortBy === 'borrower_name' && <span className="text-[10px] font-normal">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                            {sortBy !== 'borrower_name' && <span className="opacity-0 group-hover:opacity-60 transition">⇅</span>}
                          </div>
                        </th>
                        <th onClick={() => toggleSort('requested_amount')} className="px-2 py-2.5 font-semibold text-left cursor-pointer group">
                          <div className="inline-flex items-center gap-1">
                            Loan Details
                            {sortBy === 'requested_amount' && <span className="text-[10px] font-normal">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                            {sortBy !== 'requested_amount' && <span className="opacity-0 group-hover:opacity-60 transition">⇅</span>}
                          </div>
                        </th>
                        <th className="px-2 py-2.5 font-semibold text-left">Cargo Information</th>
                        <th className="px-2 py-2.5 font-semibold text-left">Status & Priority</th>
                        <th onClick={() => toggleSort('risk_score')} className="px-2 py-2.5 font-semibold text-left cursor-pointer group">
                          <div className="inline-flex items-center gap-1">
                            Risk Assessment
                            {sortBy === 'risk_score' && <span className="text-[10px] font-normal">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                            {sortBy !== 'risk_score' && <span className="opacity-0 group-hover:opacity-60 transition">⇅</span>}
                          </div>
                        </th>
                        <th className="pr-4 pl-2 py-2.5 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {sorted.map((request) => (
                        <tr key={request.id} className="group hover:bg-blue-50/60 transition-colors">
                          <td className="pl-4 pr-2 py-3 align-middle">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs ${
                                request.status === 'approved' || request.status === 'disbursed' ? 'bg-green-500' :
                                request.status === 'pending' ? 'bg-yellow-500' :
                                request.status === 'rejected' || request.status === 'overdue' ? 'bg-red-500' : 'bg-gray-400'
                              }`}>
                                {request.borrower_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-xs">{request.borrower_name}</p>
                                {request.borrower_company && (
                                  <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <FaBuilding className="text-xs w-2.5 h-2.5" />
                                    {request.borrower_company}
                                  </p>
                                )}
                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                                  <FaEnvelope className="text-xs w-2.5 h-2.5" />
                                  {request.borrower_email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-3 align-middle">
                            <div className="space-y-0.5">
                              <p className="font-semibold text-gray-900 text-xs">RWF {(request.requested_amount / 1000000).toFixed(1)}M</p>
                              <p className="text-xs text-gray-600">{request.interest_rate}% interest</p>
                              <p className="text-xs text-gray-500">{request.loan_term_months} months term</p>
                              {request.monthly_payment && (
                                <p className="text-xs text-blue-600">
                                  RWF {(request.monthly_payment / 1000).toFixed(0)}K/month
                                </p>
                              )}
                              {/* Advance Payment Calculation */}
                              {advancePaymentCalculations[request.id] && (() => {
                                const calc = advancePaymentCalculations[request.id];
                                return (
                                  <div className="mt-2 pt-2 border-t border-gray-200">
                                    <p className="text-xs font-medium text-gray-700 mb-1">Advance Payment Info:</p>
                                    {calc.requireAdvancePayment ? (
                                      <>
                                        <p className="text-xs text-green-700 font-semibold">
                                          Advance: {formatCurrencyUtil(calc.advanceAmount, calc.currency)}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          ({formatPercentage(calc.advancePaymentPercentage)} of {formatCurrencyUtil(calc.transportationFee, calc.currency)})
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Final: {formatCurrencyUtil(calc.finalAmount, calc.currency)}
                                        </p>
                                      </>
                                    ) : (
                                      <p className="text-xs text-gray-600">
                                        No advance required. Full payment after delivery.
                                      </p>
                                    )}
                                  </div>
                                );
                              })()}
                              {loadingCalculations[request.id] && (
                                <p className="text-xs text-gray-400 italic">Loading payment info...</p>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-3 align-middle">
                            <div className="space-y-0.5">
                              <p className="font-medium text-gray-900 text-xs">{request.cargo_type}</p>
                              <p className="text-xs text-gray-600">{request.cargo_weight}kg</p>
                              <p className="text-xs text-gray-500">
                                {request.pickup_location} → {request.delivery_location}
                              </p>
                              <p className="text-xs text-gray-500">
                                {request.distance}km • {request.estimated_duration}h
                              </p>
                            </div>
                          </td>
                          <td className="px-2 py-3 align-middle">
                            <div className="space-y-1.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </span>
                              <div>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(request.priority)}`}>
                                  {request.priority === 'urgent' ? <FaExclamationTriangle className="w-2.5 h-2.5" /> :
                                   request.priority === 'high' ? <FaArrowUp className="w-2.5 h-2.5" /> :
                                   request.priority === 'medium' ? <FaArrowDown className="w-2.5 h-2.5" /> :
                                   <FaClock className="w-2.5 h-2.5" />}
                                  {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-3 align-middle">
                            <div className="space-y-1">
                              {request.risk_score && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${getRiskScoreColor(request.risk_score)}`}>
                                  <FaStar className="w-2.5 h-2.5" />
                                  {request.risk_score}
                                </span>
                              )}
                              <p className="text-xs text-gray-600">Credit: {request.credit_score}</p>
                              {request.collateral_type && (
                                <p className="text-xs text-gray-500">
                                  Collateral: {request.collateral_type}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="pr-4 pl-2 py-3 text-right relative">
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  try {
                                    // View details action - could show a modal with loan details
                                    console.log('View details for loan:', request.id);
                                    alert(`Loan Details:\n\nBorrower: ${request.borrower_name}\nAmount: RWF ${request.requested_amount.toLocaleString()}\nStatus: ${request.status}\nCreated: ${new Date(request.created_at).toLocaleDateString()}`);
                                  } catch (error) {
                                    console.error('Error viewing details:', error);
                                  }
                                }}
                                className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition"
                                title="View Details"
                              >
                                <FaEye className="w-4 h-4" />
                              </button>
                              {request.status === 'pending' && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      try {
                                        handleApproveLoan(
                                          request.id,
                                          request.requested_amount,
                                          request.interest_rate || 10
                                        );
                                      } catch (error) {
                                        console.error('Error approving loan:', error);
                                        alert('Error approving loan. Please try again.');
                                      }
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-green-100 text-green-600 hover:text-green-700 transition"
                                    title="Accept"
                                  >
                                    <FaCheck className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      try {
                                        const reason = prompt('Enter rejection reason:') || 'Application did not meet criteria';
                                        if (reason) {
                                          handleRejectLoan(request.id, reason);
                                        }
                                      } catch (error) {
                                        console.error('Error rejecting loan:', error);
                                        alert('Error rejecting loan. Please try again.');
                                      }
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 hover:text-red-700 transition"
                                    title="Reject"
                                  >
                                    <FaTimes className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              {(request.status === 'approved' || request.status === 'disbursed') && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    try {
                                      setSelectedLoanForPaymentDetails(request);
                                      fetchLoanPayments(request.id);
                                      setShowPaymentDetailsModal(true);
                                    } catch (error) {
                                      console.error('Error opening payment details:', error);
                                      alert('Error opening payment details. Please try again.');
                                    }
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition"
                                  title="View/Edit Payment"
                                >
                                  <FaCreditCard className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                  <span>{sorted.length} request{sorted.length !== 1 && 's'} shown</span>
                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline">Sorted by {sortBy} ({sortDir})</span>
                    <span>Total Requested: RWF {(sorted.reduce((acc, r) => acc + r.requested_amount, 0) / 1000000).toFixed(1)}M</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Payment Modal */}
      {showPaymentModal && selectedLoanForPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Complete Payment</h3>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedLoanForPayment(null);
                    setPaymentMethod(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 mb-4 border-2 border-blue-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Disbursement Amount</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    RWF {selectedLoanForPayment.requested_amount.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-blue-200">
                    <div>
                      <p className="text-xs text-gray-500">Interest Rate</p>
                      <p className="text-sm font-semibold text-gray-700">{selectedLoanForPayment.interest_rate}%</p>
                    </div>
                    {selectedLoanForPayment.approved_amount && selectedLoanForPayment.approved_amount !== selectedLoanForPayment.requested_amount && (
                      <div>
                        <p className="text-xs text-gray-500">Requested Amount</p>
                        <p className="text-sm font-semibold text-gray-700">RWF {selectedLoanForPayment.approved_amount.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-blue-700 mt-3 font-medium">
                    💰 This amount will be sent to the truck owner via Mobile Money
                  </p>
                </div>
                
                {/* Advance Payment Calculation Display */}
                {loadingCalculations[selectedLoanForPayment.id] ? (
                  <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Loading payment breakdown...
                    </p>
                  </div>
                ) : advancePaymentCalculations[selectedLoanForPayment.id] ? (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <FaDollarSign className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm mb-2">Payment Breakdown</h4>
                        {(() => {
                          const calc = advancePaymentCalculations[selectedLoanForPayment.id];
                          return calc.requireAdvancePayment ? (
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Total Transportation Fee:</span>
                                <span className="font-semibold text-gray-900">
                                  {formatCurrencyUtil(calc.transportationFee, calc.currency || 'RWF')}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Advance Payment ({formatPercentage(calc.advancePaymentPercentage)}):</span>
                                <span className="font-semibold text-green-700">
                                  {formatCurrencyUtil(calc.advanceAmount, calc.currency || 'RWF')}
                                </span>
                              </div>
                              <div className="flex justify-between pt-1 border-t border-green-200">
                                <span className="text-gray-600">Final Payment:</span>
                                <span className="font-semibold text-gray-700">
                                  {formatCurrencyUtil(calc.finalAmount, calc.currency || 'RWF')}
                                </span>
                              </div>
                              <p className="text-green-700 font-medium mt-2 pt-1 border-t border-green-200">
                                💡 You are paying the advance amount: {formatCurrencyUtil(calc.advanceAmount, calc.currency || 'RWF')}
                              </p>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-600">
                              <p>No advance payment required. Full payment of {formatCurrencyUtil(calc.transportationFee, calc.currency || 'RWF')} will be due upon completion.</p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ) : selectedLoanForPayment.trip_id ? (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-700">
                      ⚠️ Payment breakdown not available. The truck owner may not have specified advance payment requirements.
                    </p>
                  </div>
                ) : null}
                
                {loadingTruckOwnerInfo && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Fetching truck owner payment information...
                    </p>
                  </div>
                )}
                
                {truckOwnerPhone && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700 font-medium mb-1">Truck Owner Payment Info</p>
                    <p className="text-xs text-green-600">Phone: {truckOwnerPhone}</p>
                    <p className="text-xs text-green-600 mt-1">Payment will be sent to this number automatically</p>
                  </div>
                )}
                
                {!truckOwnerPhone && !loadingTruckOwnerInfo && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700">
                      ⚠️ Truck owner phone number not found. Please ensure the truck owner has added their payment information.
                    </p>
                  </div>
                )}

                <p className="text-sm text-gray-700 mb-4">
                  Select your preferred payment method:
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => setPaymentMethod('momo')}
                    className={`w-full p-4 border-2 rounded-lg transition flex items-center gap-3 ${
                      paymentMethod === 'momo'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      paymentMethod === 'momo' ? 'bg-blue-600' : 'bg-gray-100'
                    }`}>
                      <FaMoneyBillWave className={`w-5 h-5 ${
                        paymentMethod === 'momo' ? 'text-white' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1 text-left">
                      <h5 className="font-semibold text-gray-900">Mobile Money (Momo)</h5>
                      <p className="text-xs text-gray-500">
                        {truckOwnerPhone 
                          ? `Payment will be sent to: ${truckOwnerPhone}`
                          : 'Pay via MTN Mobile Money or Airtel Money'}
                      </p>
                    </div>
                    {paymentMethod === 'momo' && (
                      <FaCheck className="text-blue-600 w-5 h-5" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`w-full p-4 border-2 rounded-lg transition flex items-center gap-3 ${
                      paymentMethod === 'card'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      paymentMethod === 'card' ? 'bg-blue-600' : 'bg-gray-100'
                    }`}>
                      <FaDollarSign className={`w-5 h-5 ${
                        paymentMethod === 'card' ? 'text-white' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1 text-left">
                      <h5 className="font-semibold text-gray-900">Card Payment</h5>
                      <p className="text-xs text-gray-500">Pay with Visa, Mastercard, or other cards</p>
                    </div>
                    {paymentMethod === 'card' && (
                      <FaCheck className="text-blue-600 w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedLoanForPayment(null);
                    setPaymentMethod(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessPayment}
                  disabled={!paymentMethod || processingPayment || (paymentMethod === 'momo' && !truckOwnerPhone)}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-white font-medium transition ${
                    !paymentMethod || processingPayment || (paymentMethod === 'momo' && !truckOwnerPhone)
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {processingPayment ? 'Processing...' : 'Proceed to Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedLoanRequestsPage;
