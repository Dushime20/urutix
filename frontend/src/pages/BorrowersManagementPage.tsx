import React, { useState, useMemo, useEffect } from 'react';
import { lendingApi } from '../services/lending/lendingApi';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaBuilding, 
  FaSearch,
  FaChartLine,
  FaDollarSign,
  FaUsers,
  FaArrowUp,
  FaArrowDown,
  FaDownload,
  FaFilter,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaEye,
  FaPercent,
  FaMapMarkerAlt,
  FaIdCard,
  FaCreditCard,
  FaHistory,
  FaStar,
  FaBan,
  FaEdit,
  FaUserPlus,
  FaFileAlt,
  FaShieldAlt,
  FaTruck,
  FaMoneyBillWave,
  FaTimesCircle,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaIndustry,
  FaGlobe,
  FaUserCheck,
  FaUserClock,
  FaUserTimes
} from 'react-icons/fa';

interface BorrowerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  address: string;
  nationalId: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  creditScore: number;
  riskRating: 'low' | 'medium' | 'high' | 'critical';
  totalLoans: number;
  totalBorrowed: number;
  totalRepaid: number;
  outstandingAmount: number;
  onTimePayments: number;
  latePayments: number;
  defaultedLoans: number;
  joinedDate: string;
  lastActivity: string;
  verificationStatus: 'verified' | 'pending' | 'rejected';
  documents: {
    nationalId: boolean;
    businessLicense?: boolean;
    bankStatement: boolean;
    taxCertificate?: boolean;
    cargoInsurance?: boolean;
    vehicleRegistration?: boolean;
  };
  cargoTypes: string[];
  preferredRoutes: string[];
  businessType: 'individual' | 'sme' | 'corporation' | 'cooperative';
  creditLimit: number;
  utilizationRate: number;
  paymentMethod: 'bank_transfer' | 'mobile_money' | 'cash' | 'multiple';
  riskFactors: string[];
  notes: string;
  lastLoanDate?: string;
  avgLoanAmount: number;
  repaymentHistory: {
    onTime: number;
    late: number;
    missed: number;
  };
  collateralValue?: number;
  guarantors?: {
    name: string;
    relationship: string;
    phone: string;
  }[];
}

interface LenderBorrowersAnalytics {
  totalBorrowers: number;
  activeBorrowers: number;
  verifiedBorrowers: number;
  pendingVerification: number;
  totalLoansIssued: number;
  totalAmountLent: number;
  totalOutstanding: number;
  averageCreditScore: number;
  defaultRate: number;
  portfolioGrowth: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  topPerformers: BorrowerProfile[];
  riskyCases: BorrowerProfile[];
}

const BorrowersManagementPage: React.FC = () => {
  const [borrowers, setBorrowers] = useState<BorrowerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lender ID - would typically come from context or auth
  const lenderId = "89fa1340-429e-448f-a19d-0e987679d7cd";

  // Mock data for fallback
  const mockBorrowers: BorrowerProfile[] = [
    {
      id: 'BRW-001',
      name: 'TransGlobal Logistics Ltd',
      email: 'finance@transglobal.rw',
      phone: '+250788123456',
      company: 'TransGlobal Logistics Ltd',
      address: 'KN 5 Rd, Kigali, Rwanda',
      nationalId: '1234567890123456',
      status: 'active',
      creditScore: 785,
      riskRating: 'low',
      totalLoans: 15,
      totalBorrowed: 2500000,
      totalRepaid: 2100000,
      outstandingAmount: 400000,
      onTimePayments: 13,
      latePayments: 2,
      defaultedLoans: 0,
      joinedDate: '2023-03-15',
      lastActivity: '2024-08-10',
      verificationStatus: 'verified',
      documents: {
        nationalId: true,
        businessLicense: true,
        bankStatement: true,
        taxCertificate: true,
        cargoInsurance: true,
        vehicleRegistration: true
      },
      cargoTypes: ['Electronics', 'Consumer Goods', 'Industrial Equipment'],
      preferredRoutes: ['Kigali-Kampala', 'Kigali-Nairobi', 'Kigali-Dar es Salaam'],
      businessType: 'corporation',
      creditLimit: 500000,
      utilizationRate: 80,
      paymentMethod: 'bank_transfer',
      riskFactors: [],
      notes: 'Excellent payment history, preferred client for large shipments',
      lastLoanDate: '2024-07-15',
      avgLoanAmount: 166667,
      repaymentHistory: {
        onTime: 13,
        late: 2,
        missed: 0
      },
      collateralValue: 800000,
      guarantors: [
        {
          name: 'John Mukamana',
          relationship: 'Business Partner',
          phone: '+250788987654'
        }
      ]
    },
    {
      id: 'BRW-002',
      name: 'Swift Cargo Solutions',
      email: 'ops@swiftcargo.rw',
      phone: '+250788234567',
      company: 'Swift Cargo Solutions',
      address: 'KG 15 Ave, Kigali, Rwanda',
      nationalId: '2345678901234567',
      status: 'active',
      creditScore: 720,
      riskRating: 'low',
      totalLoans: 8,
      totalBorrowed: 1200000,
      totalRepaid: 950000,
      outstandingAmount: 250000,
      onTimePayments: 7,
      latePayments: 1,
      defaultedLoans: 0,
      joinedDate: '2023-06-20',
      lastActivity: '2024-08-08',
      verificationStatus: 'verified',
      documents: {
        nationalId: true,
        businessLicense: true,
        bankStatement: true,
        taxCertificate: true,
        cargoInsurance: false,
        vehicleRegistration: true
      },
      cargoTypes: ['Perishable Goods', 'Agricultural Products'],
      preferredRoutes: ['Kigali-Mombasa', 'Kigali-Bujumbura'],
      businessType: 'sme',
      creditLimit: 300000,
      utilizationRate: 83,
      paymentMethod: 'mobile_money',
      riskFactors: ['Missing cargo insurance'],
      notes: 'Reliable for agricultural cargo, needs to complete insurance documentation',
      lastLoanDate: '2024-07-28',
      avgLoanAmount: 150000,
      repaymentHistory: {
        onTime: 7,
        late: 1,
        missed: 0
      },
      collateralValue: 450000
    },
    {
      id: 'BRW-003',
      name: 'Mountain Express Ltd',
      email: 'finance@mountainexpress.rw',
      phone: '+250788345678',
      company: 'Mountain Express Ltd',
      address: 'Musanze, Northern Province, Rwanda',
      nationalId: '3456789012345678',
      status: 'active',
      creditScore: 680,
      riskRating: 'medium',
      totalLoans: 12,
      totalBorrowed: 1800000,
      totalRepaid: 1350000,
      outstandingAmount: 450000,
      onTimePayments: 9,
      latePayments: 3,
      defaultedLoans: 0,
      joinedDate: '2023-01-10',
      lastActivity: '2024-08-05',
      verificationStatus: 'verified',
      documents: {
        nationalId: true,
        businessLicense: true,
        bankStatement: true,
        taxCertificate: false,
        cargoInsurance: true,
        vehicleRegistration: true
      },
      cargoTypes: ['Mining Equipment', 'Construction Materials'],
      preferredRoutes: ['Musanze-Kigali', 'Kigali-Kampala'],
      businessType: 'sme',
      creditLimit: 400000,
      utilizationRate: 112,
      paymentMethod: 'bank_transfer',
      riskFactors: ['High utilization rate', 'Missing tax certificate', 'Recent late payments'],
      notes: 'Over credit limit, requires monitoring. Good for mining cargo routes.',
      lastLoanDate: '2024-07-20',
      avgLoanAmount: 150000,
      repaymentHistory: {
        onTime: 9,
        late: 3,
        missed: 0
      },
      collateralValue: 350000
    },
    {
      id: 'BRW-004',
      name: 'Coastal Freight Services',
      email: 'admin@coastalfreight.rw',
      phone: '+250788456789',
      company: 'Coastal Freight Services',
      address: 'Rubavu, Western Province, Rwanda',
      nationalId: '4567890123456789',
      status: 'suspended',
      creditScore: 580,
      riskRating: 'high',
      totalLoans: 6,
      totalBorrowed: 900000,
      totalRepaid: 520000,
      outstandingAmount: 380000,
      onTimePayments: 3,
      latePayments: 2,
      defaultedLoans: 1,
      joinedDate: '2023-09-05',
      lastActivity: '2024-06-15',
      verificationStatus: 'pending',
      documents: {
        nationalId: true,
        businessLicense: false,
        bankStatement: true,
        taxCertificate: false,
        cargoInsurance: false,
        vehicleRegistration: true
      },
      cargoTypes: ['General Cargo'],
      preferredRoutes: ['Rubavu-Kigali'],
      businessType: 'sme',
      creditLimit: 200000,
      utilizationRate: 190,
      paymentMethod: 'cash',
      riskFactors: ['Default history', 'Incomplete documentation', 'High utilization', 'Cash-only payments'],
      notes: 'SUSPENDED: High risk borrower with payment issues. Requires management approval for new loans.',
      lastLoanDate: '2024-05-10',
      avgLoanAmount: 150000,
      repaymentHistory: {
        onTime: 3,
        late: 2,
        missed: 1
      },
      collateralValue: 180000
    },
    {
      id: 'BRW-005',
      name: 'Rwanda Haulage Cooperative',
      email: 'secretary@rwandahaulage.coop',
      phone: '+250788567890',
      company: 'Rwanda Haulage Cooperative',
      address: 'Nyanza, Southern Province, Rwanda',
      nationalId: '5678901234567890',
      status: 'pending',
      creditScore: 650,
      riskRating: 'medium',
      totalLoans: 0,
      totalBorrowed: 0,
      totalRepaid: 0,
      outstandingAmount: 0,
      onTimePayments: 0,
      latePayments: 0,
      defaultedLoans: 0,
      joinedDate: '2024-08-01',
      lastActivity: '2024-08-12',
      verificationStatus: 'pending',
      documents: {
        nationalId: true,
        businessLicense: true,
        bankStatement: false,
        taxCertificate: true,
        cargoInsurance: false,
        vehicleRegistration: false
      },
      cargoTypes: ['Agricultural Products', 'Livestock'],
      preferredRoutes: ['Southern Province Routes'],
      businessType: 'cooperative',
      creditLimit: 0,
      utilizationRate: 0,
      paymentMethod: 'mobile_money',
      riskFactors: ['New client', 'Incomplete documentation'],
      notes: 'New cooperative client pending verification. Agricultural focus.',
      avgLoanAmount: 0,
      repaymentHistory: {
        onTime: 0,
        late: 0,
        missed: 0
      }
    }
  ];

  const [analytics] = useState<LenderBorrowersAnalytics>({
    totalBorrowers: 5,
    activeBorrowers: 3,
    verifiedBorrowers: 3,
    pendingVerification: 2,
    totalLoansIssued: 41,
    totalAmountLent: 6400000,
    totalOutstanding: 1480000,
    averageCreditScore: 683,
    defaultRate: 2.4,
    portfolioGrowth: 15.3,
    riskDistribution: {
      low: 2,
      medium: 2,
      high: 1,
      critical: 0
    },
    topPerformers: [], // Will be calculated from borrowers
    riskyCases: [] // Will be calculated from borrowers
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('lastActivity');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedBorrower, setSelectedBorrower] = useState<BorrowerProfile | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAddBorrower, setShowAddBorrower] = useState(false);

  // Load borrowers on component mount
  useEffect(() => {
    const fetchBorrowers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to get borrowers from API
        const data = await lendingApi.getLenderBorrowers(lenderId);
        
        // Transform API data to BorrowerProfile format if needed
        const transformedData = data.map((borrower: any) => ({
          id: borrower.id || Math.random().toString(36).substr(2, 9),
          name: borrower.name || borrower.fullName || 'Unknown',
          email: borrower.email || '',
          phone: borrower.phone || '',
          status: borrower.status || 'pending',
          riskScore: borrower.riskScore || 0,
          creditScore: borrower.creditScore || 0,
          totalLoans: borrower.totalLoans || 0,
          totalAmount: borrower.totalAmount || 0,
          activeLoan: borrower.activeLoan || null,
          company: borrower.company || '',
          nationalId: borrower.nationalId || '',
          dateOfBirth: borrower.dateOfBirth || '',
          address: borrower.address || '',
          occupation: borrower.occupation || '',
          monthlyIncome: borrower.monthlyIncome || 0,
          lastActivity: borrower.lastActivity || new Date().toISOString(),
          documents: borrower.documents || [],
          creditHistory: borrower.creditHistory || [],
          loanHistory: borrower.loanHistory || [],
          verification: borrower.verification || {
            identity: false,
            income: false,
            address: false,
            phone: false,
            email: false
          }
        }));
        
        setBorrowers(transformedData);
      } catch (error) {
        console.error('Error fetching borrowers:', error);
        setError('Failed to load borrowers');
        
        // Fallback to mock data
        setBorrowers(mockBorrowers);
      } finally {
        setLoading(false);
      }
    };

    fetchBorrowers();
  }, [lenderId]);

  // Filter and sort borrowers
  const filteredBorrowers = useMemo(() => {
    const filtered = borrowers.filter(borrower => {
      const matchesSearch = 
        borrower.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        borrower.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        borrower.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        borrower.nationalId.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || borrower.status === statusFilter;
      const matchesRisk = riskFilter === 'all' || borrower.riskRating === riskFilter;
      const matchesVerification = verificationFilter === 'all' || borrower.verificationStatus === verificationFilter;
      
      return matchesSearch && matchesStatus && matchesRisk && matchesVerification;
    });

    filtered.sort((a, b) => {
      let aValue: any = a[sortField as keyof BorrowerProfile];
      let bValue: any = b[sortField as keyof BorrowerProfile];

      if (sortField === 'lastActivity' || sortField === 'joinedDate') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [borrowers, searchTerm, statusFilter, riskFilter, verificationFilter, sortField, sortDirection]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <FaUserCheck className="text-green-500" />;
      case 'inactive': return <FaUser className="text-gray-500" />;
      case 'suspended': return <FaUserTimes className="text-red-500" />;
      case 'pending': return <FaUserClock className="text-yellow-500" />;
      default: return <FaUser className="text-gray-500" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'critical': return 'bg-red-200 text-red-900 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCreditScoreColor = (score: number) => {
    if (score >= 750) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 650) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (score >= 550) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const formatCurrency = (amount: number): string => {
    return `RWF ${(amount / 1000).toLocaleString()}K`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleViewDetails = (borrower: BorrowerProfile) => {
    setSelectedBorrower(borrower);
    setShowDetails(true);
  };

  const handleExport = () => {
    const csvContent = [
      'Name,Email,Phone,Company,Status,Credit Score,Risk Rating,Total Loans,Total Borrowed,Outstanding Amount,Verification Status',
      ...filteredBorrowers.map(borrower => 
        `${borrower.name},${borrower.email},${borrower.phone},${borrower.company || 'N/A'},${borrower.status},${borrower.creditScore},${borrower.riskRating},${borrower.totalLoans},${borrower.totalBorrowed},${borrower.outstandingAmount},${borrower.verificationStatus}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'borrowers-report.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <FaSort className="h-3 w-3 text-gray-400" />;
    return sortDirection === 'asc' ? 
      <FaSortUp className="h-3 w-3 text-blue-500" /> : 
      <FaSortDown className="h-3 w-3 text-blue-500" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading borrowers...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <FaExclamationTriangle className="text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
              <button 
                onClick={() => window.location.reload()}
                className="ml-auto px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Borrowers Management</h1>
              <p className="text-gray-600">Manage your borrower profiles, track performance, and monitor risk levels</p>
            </div>
            <div className="flex gap-3 mt-4 sm:mt-0">
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <FaDownload className="h-4 w-4" />
                Export Data
              </button>
              <button
                onClick={() => setShowAddBorrower(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FaUserPlus className="h-4 w-4" />
                Add Borrower
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Borrowers</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalBorrowers}</p>
                <div className="flex items-center mt-2">
                  <FaArrowUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600 text-sm">+{analytics.portfolioGrowth}%</span>
                  <span className="text-gray-500 text-sm ml-1">this month</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaUsers className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Borrowers</p>
                <p className="text-2xl font-bold text-green-600">{analytics.activeBorrowers}</p>
                <div className="flex items-center mt-2">
                  <span className="text-gray-600 text-sm">
                    {analytics.verifiedBorrowers} verified
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FaUserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Outstanding</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(analytics.totalOutstanding)}</p>
                <div className="flex items-center mt-2">
                  <span className="text-gray-600 text-sm">
                    from {analytics.totalLoansIssued} loans
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FaMoneyBillWave className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Credit Score</p>
                <p className="text-2xl font-bold text-purple-600">{analytics.averageCreditScore}</p>
                <div className="flex items-center mt-2">
                  <span className="text-gray-600 text-sm">
                    {analytics.defaultRate}% default rate
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaStar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <FaShieldAlt className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{analytics.riskDistribution.low}</p>
              <p className="text-sm text-gray-600">Low Risk</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <FaExclamationTriangle className="h-8 w-8 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-yellow-600">{analytics.riskDistribution.medium}</p>
              <p className="text-sm text-gray-600">Medium Risk</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <FaExclamationTriangle className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600">{analytics.riskDistribution.high}</p>
              <p className="text-sm text-gray-600">High Risk</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-200 rounded-full flex items-center justify-center mx-auto mb-2">
                <FaBan className="h-8 w-8 text-red-800" />
              </div>
              <p className="text-2xl font-bold text-red-800">{analytics.riskDistribution.critical}</p>
              <p className="text-sm text-gray-600">Critical Risk</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by name, email, company, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>

              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
                <option value="critical">Critical Risk</option>
              </select>

              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Verification</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Borrowers Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Borrower
                      {getSortIcon('name')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact & Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('creditScore')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Credit & Risk
                      {getSortIcon('creditScore')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('totalLoans')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Loan History
                      {getSortIcon('totalLoans')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('lastActivity')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Last Activity
                      {getSortIcon('lastActivity')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBorrowers.map((borrower) => (
                  <tr key={borrower.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {getStatusIcon(borrower.status)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{borrower.name}</div>
                          {borrower.company && (
                            <div className="text-sm text-gray-500 flex items-center">
                              <FaBuilding className="h-3 w-3 mr-1" />
                              {borrower.company}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(borrower.status)}`}>
                              {borrower.status.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500 capitalize">{borrower.businessType}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-gray-900 flex items-center">
                          <FaEnvelope className="h-3 w-3 text-gray-400 mr-1" />
                          {borrower.email}
                        </div>
                        <div className="text-gray-500 flex items-center">
                          <FaPhone className="h-3 w-3 text-gray-400 mr-1" />
                          {borrower.phone}
                        </div>
                        <div className="text-gray-500 flex items-center">
                          <FaMapMarkerAlt className="h-3 w-3 text-gray-400 mr-1" />
                          {borrower.address}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getCreditScoreColor(borrower.creditScore)}`}>
                            <FaStar className="h-3 w-3 mr-1" />
                            {borrower.creditScore}
                          </span>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(borrower.riskRating)}`}>
                          {borrower.riskRating.toUpperCase()} RISK
                        </span>
                        {borrower.utilizationRate > 100 && (
                          <div className="text-xs text-red-600 mt-1">
                            Over-utilized: {borrower.utilizationRate}%
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-gray-900 font-medium">{borrower.totalLoans} loans</div>
                        <div className="text-gray-600">{formatCurrency(borrower.totalBorrowed)} borrowed</div>
                        <div className="text-orange-600">{formatCurrency(borrower.outstandingAmount)} outstanding</div>
                        <div className="flex items-center gap-1 text-xs mt-1">
                          <span className="text-green-600">{borrower.onTimePayments} on-time</span>
                          {borrower.latePayments > 0 && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-yellow-600">{borrower.latePayments} late</span>
                            </>
                          )}
                          {borrower.defaultedLoans > 0 && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-red-600">{borrower.defaultedLoans} default</span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                          borrower.verificationStatus === 'verified' ? 'bg-green-100 text-green-800 border-green-200' :
                          borrower.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          'bg-red-100 text-red-800 border-red-200'
                        }`}>
                          {borrower.verificationStatus === 'verified' ? <FaCheckCircle className="h-3 w-3 mr-1" /> :
                           borrower.verificationStatus === 'pending' ? <FaClock className="h-3 w-3 mr-1" /> :
                           <FaTimesCircle className="h-3 w-3 mr-1" />}
                          {borrower.verificationStatus.toUpperCase()}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {Object.values(borrower.documents).filter(Boolean).length}/
                          {Object.keys(borrower.documents).length} docs
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(borrower.lastActivity)}</div>
                      <div className="text-sm text-gray-500">
                        Joined {formatDate(borrower.joinedDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(borrower)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <FaEye className="h-4 w-4" />
                          View
                        </button>
                        <button className="text-green-600 hover:text-green-900 flex items-center gap-1">
                          <FaEdit className="h-4 w-4" />
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBorrowers.length === 0 && (
            <div className="text-center py-12">
              <FaUsers className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No borrowers found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search criteria or add a new borrower.
              </p>
            </div>
          )}
        </div>

        {/* Borrower Details Modal */}
        {showDetails && selectedBorrower && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Borrower Profile - {selectedBorrower.name}
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimesCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Basic Information</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedBorrower.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{selectedBorrower.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{selectedBorrower.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Company:</span>
                        <span className="font-medium">{selectedBorrower.company || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">National ID:</span>
                        <span className="font-medium">{selectedBorrower.nationalId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Business Type:</span>
                        <span className="font-medium capitalize">{selectedBorrower.businessType}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Financial Profile</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Credit Score:</span>
                        <span className="font-medium text-blue-600">{selectedBorrower.creditScore}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Risk Rating:</span>
                        <span className={`font-medium ${
                          selectedBorrower.riskRating === 'low' ? 'text-green-600' :
                          selectedBorrower.riskRating === 'medium' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {selectedBorrower.riskRating.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Credit Limit:</span>
                        <span className="font-medium">{formatCurrency(selectedBorrower.creditLimit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Utilization Rate:</span>
                        <span className={`font-medium ${selectedBorrower.utilizationRate > 100 ? 'text-red-600' : 'text-gray-900'}`}>
                          {selectedBorrower.utilizationRate}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Method:</span>
                        <span className="font-medium capitalize">{selectedBorrower.paymentMethod.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Loan History & Documents */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Loan History</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Loans:</span>
                        <span className="font-medium">{selectedBorrower.totalLoans}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Borrowed:</span>
                        <span className="font-medium">{formatCurrency(selectedBorrower.totalBorrowed)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Repaid:</span>
                        <span className="font-medium text-green-600">{formatCurrency(selectedBorrower.totalRepaid)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Outstanding:</span>
                        <span className="font-medium text-orange-600">{formatCurrency(selectedBorrower.outstandingAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Loan Amount:</span>
                        <span className="font-medium">{formatCurrency(selectedBorrower.avgLoanAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Loan:</span>
                        <span className="font-medium">{selectedBorrower.lastLoanDate ? formatDate(selectedBorrower.lastLoanDate) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Documents & Verification</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      {Object.entries(selectedBorrower.documents).map(([doc, completed]) => (
                        <div key={doc} className="flex justify-between items-center">
                          <span className="text-gray-600 capitalize">{doc.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            completed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {completed ? <FaCheckCircle className="h-3 w-3 mr-1" /> : <FaTimesCircle className="h-3 w-3 mr-1" />}
                            {completed ? 'Completed' : 'Missing'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Details */}
              <div className="mt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Business Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">Cargo Types</h5>
                    <div className="flex flex-wrap gap-1">
                      {selectedBorrower.cargoTypes.map((type, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800">
                          <FaTruck className="h-3 w-3 mr-1" />
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">Preferred Routes</h5>
                    <div className="flex flex-wrap gap-1">
                      {selectedBorrower.preferredRoutes.map((route, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-100 text-green-800">
                          <FaMapMarkerAlt className="h-3 w-3 mr-1" />
                          {route}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Factors & Notes */}
              {(selectedBorrower.riskFactors.length > 0 || selectedBorrower.notes) && (
                <div className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedBorrower.riskFactors.length > 0 && (
                      <div className="bg-red-50 rounded-lg p-4">
                        <h5 className="font-medium text-red-900 mb-2 flex items-center">
                          <FaExclamationTriangle className="h-4 w-4 mr-1" />
                          Risk Factors
                        </h5>
                        <ul className="space-y-1">
                          {selectedBorrower.riskFactors.map((factor, index) => (
                            <li key={index} className="text-sm text-red-700">• {factor}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedBorrower.notes && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h5 className="font-medium text-blue-900 mb-2 flex items-center">
                          <FaFileAlt className="h-4 w-4 mr-1" />
                          Notes
                        </h5>
                        <p className="text-sm text-blue-700">{selectedBorrower.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-8">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                  Edit Profile
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  View Loans
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BorrowersManagementPage;
