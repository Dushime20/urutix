import React, { useState, useMemo, useEffect } from 'react';
import { lendingApi } from '../services/lending/lendingApi';
import { useAuth } from '../contexts/AuthContext';
import BorrowersEnlite, { type BorrowerProfile as EnliteBorrowerProfile } from '../components/LenderDashboard/Borrowers.enlite';
import {
  FaTimesCircle,
  FaCheckCircle,
  FaExclamationTriangle,
  FaFileAlt,
  FaTruck,
  FaMapMarkerAlt
} from 'react-icons/fa';

interface LenderBorrowersAnalytics {
  totalBorrowers: number;
  activeBorrowers: number;
  verifiedBorrowers: number;
  averageCreditScore: number;
  portfolioGrowth: number;
  totalOutstanding: number;
  totalLoansIssued: number;
  defaultRate: number;
}

interface BorrowerProfile extends EnliteBorrowerProfile {
  nationalId: string;
  totalRepaid: number;
  onTimePayments: number;
  latePayments: number;
  defaultedLoans: number;
  joinedDate: string;
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
}

const BorrowersManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [borrowers, setBorrowers] = useState<BorrowerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Lender ID from auth context
  const lenderId = user?.id;

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
      }
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
      }
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
      }
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
      }
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

  // State for search and filter (used by Enlite component)
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [analytics] = useState<LenderBorrowersAnalytics>({
    totalBorrowers: 5,
    activeBorrowers: 3,
    verifiedBorrowers: 3,
    averageCreditScore: 683,
    portfolioGrowth: 15.3,
    totalOutstanding: 1480000,
    totalLoansIssued: 41,
    defaultRate: 2.4,
  });
  const [selectedBorrower, setSelectedBorrower] = useState<BorrowerProfile | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Load borrowers on component mount
  useEffect(() => {
    const fetchBorrowers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to get borrowers from API
        if (!lenderId) {
          setBorrowers(mockBorrowers);
          setLoading(false);
          return;
        }

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
    return borrowers.filter(borrower => {
      const matchesSearch =
        borrower.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        borrower.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        borrower.company?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || borrower.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [borrowers, searchTerm, statusFilter]);

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

  const handleViewDetails = (borrower: EnliteBorrowerProfile) => {
    setSelectedBorrower(borrower as BorrowerProfile);
    setShowDetails(true);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="max-w-[1536px] mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Borrowers Management</h1>
          <p className="text-gray-500 mt-1 uppercase text-[10px] font-black tracking-widest">NETWORK INTELLIGENCE & ONBOARDING ENGINE</p>
        </div>

        <BorrowersEnlite
          loading={loading}
          borrowers={filteredBorrowers}
          analytics={analytics}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onAddBorrower={() => console.log('Add borrower clicked')}
          onViewDetails={handleViewDetails}
          onExport={() => console.log('Export clicked')}
        />

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
                        <span className={`font-medium ${selectedBorrower.riskRating === 'low' ? 'text-green-600' :
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
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${completed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
