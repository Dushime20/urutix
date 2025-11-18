import React, { useState } from 'react';
import { fetchUsers } from '../services/adminApi';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaBuilding, 
  FaEllipsisH, 
  FaSearch,
  FaChartLine,
  FaDollarSign,
  FaUsers,
  FaHandshake,
  FaArrowUp,
  FaDownload,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaEye,
  FaPercent,
  FaMapMarkerAlt,
  FaIdCard,
  FaHistory,
  FaStar,
  FaBan,
  FaEdit
} from 'react-icons/fa';

interface Lender {
  id: string;
  name: string;
  type: 'bank' | 'microfinance' | 'cooperative' | 'individual';
  email: string;
  phone: string;
}

interface Borrower {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  address: string;
  nationalId: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  creditScore: number;
  riskRating: 'low' | 'medium' | 'high';
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
  lenderId: string;
  lender: Lender;
  documents: {
    nationalId: boolean;
    businessLicense?: boolean;
    bankStatement: boolean;
    taxCertificate?: boolean;
  };
}

interface BorrowerAnalytics {
  totalBorrowers: number;
  activeBorrowers: number;
  totalLoansIssued: number;
  totalAmountBorrowed: number;
  totalRepaid: number;
  defaultRate: number;
  avgCreditScore: number;
  monthlyGrowth: number;
}

const mockFetchBorrowers = async (): Promise<Borrower[]> => {
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
    },
    {
      id: '4',
      name: 'John Uwimana (Private Lender)',
      type: 'individual',
      email: 'john.uwimana@gmail.com',
      phone: '+250788900400'
    }
  ];

  return [
    {
      id: '1',
      name: 'Jean Baptiste Uwimana',
      email: 'jean@cargocompany.rw',
      phone: '+250788123456',
      company: 'Kigali Cargo Services',
      address: 'Kigali, Rwanda',
      nationalId: '1199880123456789',
      status: 'active',
      creditScore: 750,
      riskRating: 'low',
      totalLoans: 12,
      totalBorrowed: 15000000,
      totalRepaid: 13500000,
      outstandingAmount: 1500000,
      onTimePayments: 10,
      latePayments: 2,
      defaultedLoans: 0,
      joinedDate: '2023-06-15',
      lastActivity: '2024-02-08',
      verificationStatus: 'verified',
      lenderId: '1',
      lender: lenders[0],
      documents: {
        nationalId: true,
        businessLicense: true,
        bankStatement: true,
        taxCertificate: true
      }
    },
    {
      id: '2',
      name: 'Marie Claire Mukamana',
      email: 'marie@transportrw.com',
      phone: '+250788654321',
      company: 'Express Transport Ltd',
      address: 'Huye, Rwanda',
      nationalId: '1198870987654321',
      status: 'active',
      creditScore: 680,
      riskRating: 'medium',
      totalLoans: 8,
      totalBorrowed: 8500000,
      totalRepaid: 7200000,
      outstandingAmount: 1300000,
      onTimePayments: 6,
      latePayments: 2,
      defaultedLoans: 0,
      joinedDate: '2023-08-22',
      lastActivity: '2024-02-07',
      verificationStatus: 'verified',
      lenderId: '1',
      lender: lenders[0],
      documents: {
        nationalId: true,
        businessLicense: true,
        bankStatement: true,
        taxCertificate: false
      }
    },
    {
      id: '3',
      name: 'Paul Ntakirutimana',
      email: 'paul@freelancer.rw',
      phone: '+250788111222',
      address: 'Musanze, Rwanda',
      nationalId: '1199770555666777',
      status: 'suspended',
      creditScore: 520,
      riskRating: 'high',
      totalLoans: 5,
      totalBorrowed: 3200000,
      totalRepaid: 2100000,
      outstandingAmount: 1100000,
      onTimePayments: 2,
      latePayments: 2,
      defaultedLoans: 1,
      joinedDate: '2023-12-10',
      lastActivity: '2024-01-15',
      verificationStatus: 'pending',
      lenderId: '2',
      lender: lenders[1],
      documents: {
        nationalId: true,
        bankStatement: false,
        taxCertificate: false
      }
    },
    {
      id: '4',
      name: 'Alice Uwimana',
      email: 'alice@logistics.rw',
      phone: '+250788333444',
      company: 'Quick Logistics',
      address: 'Rubavu, Rwanda',
      nationalId: '1199660777888999',
      status: 'active',
      creditScore: 720,
      riskRating: 'low',
      totalLoans: 6,
      totalBorrowed: 5500000,
      totalRepaid: 4800000,
      outstandingAmount: 700000,
      onTimePayments: 5,
      latePayments: 1,
      defaultedLoans: 0,
      joinedDate: '2023-09-15',
      lastActivity: '2024-02-06',
      verificationStatus: 'verified',
      lenderId: '3',
      lender: lenders[2],
      documents: {
        nationalId: true,
        businessLicense: true,
        bankStatement: true,
        taxCertificate: true
      }
    },
    {
      id: '5',
      name: 'Eric Habimana',
      email: 'eric@transport.rw',
      phone: '+250788555666',
      address: 'Nyagatare, Rwanda',
      nationalId: '1199550888999000',
      status: 'active',
      creditScore: 640,
      riskRating: 'medium',
      totalLoans: 3,
      totalBorrowed: 2800000,
      totalRepaid: 2400000,
      outstandingAmount: 400000,
      onTimePayments: 3,
      latePayments: 0,
      defaultedLoans: 0,
      joinedDate: '2024-01-20',
      lastActivity: '2024-02-05',
      verificationStatus: 'verified',
      lenderId: '4',
      lender: lenders[3],
      documents: {
        nationalId: true,
        bankStatement: true,
        taxCertificate: false
      }
    }
  ];
};

const mockFetchAnalytics = async (): Promise<BorrowerAnalytics> => {
  return {
    totalBorrowers: 5,
    activeBorrowers: 4,
    totalLoansIssued: 34,
    totalAmountBorrowed: 35000000,
    totalRepaid: 29800000,
    defaultRate: 2.9,
    avgCreditScore: 662,
    monthlyGrowth: 18.5
  };
};

// Helper functions for styling
const getCreditScoreColor = (score: number) => {
  if (score >= 700) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 600) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-50 text-green-700 border-green-200';
    case 'suspended': return 'bg-red-50 text-red-700 border-red-200';
    case 'inactive': return 'bg-gray-50 text-gray-600 border-gray-200';
    case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    default: return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

// Reusable BorrowerRow component
const BorrowerRow: React.FC<{ 
  borrower: Borrower; 
  openActionRow: string | null; 
  setOpenActionRow: (id: string | null) => void;
  showLender?: boolean;
}> = ({ borrower, openActionRow, setOpenActionRow, showLender = false }) => {
  return (
    <tr className="group hover:bg-blue-50/60 transition-colors">
      <td className="pl-6 pr-3 py-4 align-middle">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
            borrower.status === 'active' ? 'bg-green-500' :
            borrower.status === 'suspended' ? 'bg-red-500' :
            borrower.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-400'
          }`}>
            {borrower.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{borrower.name}</p>
            {borrower.company && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <FaBuilding className="text-xs" />
                {borrower.company}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(borrower.status)}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                {borrower.status.charAt(0).toUpperCase() + borrower.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-3 py-4 align-middle">
        <div className="space-y-1">
          <p className="text-gray-700 flex items-center gap-1">
            <FaEnvelope className="text-gray-400 text-xs" />
            {borrower.email}
          </p>
          <p className="text-gray-700 flex items-center gap-1">
            <FaPhone className="text-gray-400 text-xs" />
            {borrower.phone}
          </p>
          <p className="text-gray-500 flex items-center gap-1 text-xs">
            <FaMapMarkerAlt className="text-gray-400 text-xs" />
            {borrower.address}
          </p>
        </div>
      </td>
      <td className="px-3 py-4 align-middle">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getCreditScoreColor(borrower.creditScore)}`}>
              <FaStar className="w-3 h-3" />
              {borrower.creditScore}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
              borrower.riskRating === 'low' ? 'bg-green-50 text-green-700 border-green-200' :
              borrower.riskRating === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
              'bg-red-50 text-red-700 border-red-200'
            }`}>
              {borrower.riskRating === 'low' ? <FaCheckCircle className="w-3 h-3" /> :
               borrower.riskRating === 'medium' ? <FaClock className="w-3 h-3" /> :
               <FaExclamationTriangle className="w-3 h-3" />}
              {borrower.riskRating.charAt(0).toUpperCase() + borrower.riskRating.slice(1)} Risk
            </span>
          </div>
        </div>
      </td>
      <td className="px-3 py-4 align-middle">
        <div className="space-y-1">
          <p className="font-semibold text-gray-900">{borrower.totalLoans} loans</p>
          <p className="text-sm text-gray-600">RWF {(borrower.totalBorrowed / 1000000).toFixed(1)}M borrowed</p>
          <p className="text-xs text-gray-500">RWF {(borrower.outstandingAmount / 1000000).toFixed(1)}M outstanding</p>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-green-600">{borrower.onTimePayments} on-time</span>
            <span className="text-gray-400">•</span>
            <span className="text-yellow-600">{borrower.latePayments} late</span>
            {borrower.defaultedLoans > 0 && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-red-600">{borrower.defaultedLoans} default</span>
              </>
            )}
          </div>
        </div>
      </td>
      <td className="px-3 py-4 align-middle">
        <div className="space-y-1">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
            borrower.verificationStatus === 'verified' ? 'bg-green-50 text-green-700 border-green-200' :
            borrower.verificationStatus === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
            'bg-red-50 text-red-700 border-red-200'
          }`}>
            {borrower.verificationStatus === 'verified' ? <FaCheckCircle className="w-3 h-3" /> :
             borrower.verificationStatus === 'pending' ? <FaClock className="w-3 h-3" /> :
             <FaBan className="w-3 h-3" />}
            {borrower.verificationStatus.charAt(0).toUpperCase() + borrower.verificationStatus.slice(1)}
          </span>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <FaIdCard className="text-gray-400" />
            ID: {borrower.nationalId.slice(-4)}
          </div>
        </div>
      </td>
      <td className="px-3 py-4 align-middle">
        <div className="space-y-1">
          <div className="text-xs text-gray-500">Documents:</div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(borrower.documents).map(([doc, status]) => (
              <span key={doc} className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${
                status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {status ? '✓' : '✗'}
              </span>
            ))}
          </div>
          <div className="text-xs text-gray-500">
            Joined: {new Date(borrower.joinedDate).toLocaleDateString()}
          </div>
        </div>
      </td>
      {showLender && (
        <td className="px-3 py-4 align-middle">
          <div className="space-y-1">
            <p className="font-medium text-gray-900 text-sm">{borrower.lender.name}</p>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              borrower.lender.type === 'bank' ? 'bg-blue-100 text-blue-700' :
              borrower.lender.type === 'microfinance' ? 'bg-green-100 text-green-700' :
              borrower.lender.type === 'cooperative' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
            }`}>
              {borrower.lender.type.charAt(0).toUpperCase() + borrower.lender.type.slice(1)}
            </span>
          </div>
        </td>
      )}
      <td className="pr-6 pl-3 py-4 text-right relative">
        <div className="inline-flex items-center gap-1">
          <button
            onClick={() => setOpenActionRow(openActionRow === borrower.id ? null : borrower.id)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
            title="More Actions"
          >
            <FaEllipsisH />
          </button>
        </div>
        {openActionRow === borrower.id && (
          <div className="absolute right-6 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-10 py-1 text-sm">
            <button
              onClick={() => { /* future: open view */ setOpenActionRow(null); }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
            >
              <FaEye className="text-blue-500" /> View Profile
            </button>
            <button
              onClick={() => { /* future: edit modal */ setOpenActionRow(null); }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
            >
              <FaEdit className="text-green-500" /> Edit Details
            </button>
            <button
              onClick={() => { /* future: loan history */ setOpenActionRow(null); }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
            >
              <FaHistory className="text-purple-500" /> Loan History
            </button>
            <button
              onClick={() => { /* future: documents */ setOpenActionRow(null); }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
            >
              <FaIdCard className="text-blue-500" /> View Documents
            </button>
            <div className="border-t border-gray-100 my-1"></div>
            <button
              onClick={() => { /* future: suspend */ setOpenActionRow(null); }}
              className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
            >
              <FaBan className="text-red-500" /> Suspend Account
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};

const AdminBorrowersPage: React.FC = () => {
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [analytics, setAnalytics] = useState<BorrowerAnalytics | null>(null);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'creditScore' | 'totalLoans' | 'joinedDate'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [openActionRow, setOpenActionRow] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'inactive' | 'pending'>('all');
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'pending' | 'rejected'>('all');
  const [lenderFilter, setLenderFilter] = useState<'all' | string>('all');
  const [groupByLender, setGroupByLender] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(true);

  React.useEffect(() => {
    (async () => {
      setFetching(true);
      try {
        // Try to fetch from real API first - get users and filter for borrowers
        const usersData = await fetchUsers();
        
        // Transform API users data to borrowers format
        const transformedBorrowers: Borrower[] = usersData
          .filter((user: any) => user.role === 'borrower' || user.type === 'borrower')
          .map((user: any) => ({
            id: user.id,
            name: user.name || `${user.firstName} ${user.lastName}`,
            email: user.email,
            phone: user.phone || '+250788000000',
            company: user.companyName || user.company || 'N/A',
            address: user.address || 'Kigali, Rwanda',
            nationalId: user.nationalId || 'N/A',
            creditScore: user.creditScore || 750,
            verificationStatus: user.status === 'active' ? 'verified' : 'pending',
            joinedDate: user.createdAt || user.created_at,
            totalLoans: user.totalLoans || 0,
            activeLoans: user.activeLoans || 0,
            totalBorrowed: user.totalBorrowed || 0,
            totalRepaid: user.totalRepaid || 0,
            lenderId: user.preferredLenderId || '1',
            lenderName: user.preferredLenderName || 'Bank of Kigali'
          }));

        setBorrowers(transformedBorrowers);
        
        // For now, use mock analytics until dedicated API is available
        const analyticsData = await mockFetchAnalytics();
        setAnalytics(analyticsData);
        
      } catch (err) {
        console.error('Error fetching borrowers from API, falling back to mock data:', err);
        
        // Fallback to mock data if API fails
        try {
          const [borrowersData, analyticsData] = await Promise.all([
            mockFetchBorrowers(),
            mockFetchAnalytics()
          ]);
          setBorrowers(borrowersData);
          setAnalytics(analyticsData);
        } catch {
          setBorrowers([]);
          setAnalytics(null);
        }
      } finally {
        setFetching(false);
      }
    })();
  }, []);

  const toggleSort = (field: 'name' | 'creditScore' | 'totalLoans' | 'joinedDate') => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const handleExport = () => {
    const csvData = filtered.map(b => ({
      Name: b.name,
      Email: b.email,
      Phone: b.phone,
      Company: b.company || 'N/A',
      Status: b.status,
      'Credit Score': b.creditScore,
      'Risk Rating': b.riskRating,
      'Total Loans': b.totalLoans,
      'Total Borrowed': b.totalBorrowed,
      'Outstanding Amount': b.outstandingAmount,
      'Verification Status': b.verificationStatus,
      'Joined Date': b.joinedDate
    }));
    
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `borrowers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = borrowers.filter(b => {
    if (!search && statusFilter === 'all' && riskFilter === 'all' && verificationFilter === 'all' && lenderFilter === 'all') return true;
    
    const matchesSearch = !search || [b.name, b.email, b.phone, b.company, b.nationalId].some(field => 
      field?.toLowerCase().includes(search.toLowerCase())
    );
    
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchesRisk = riskFilter === 'all' || b.riskRating === riskFilter;
    const matchesVerification = verificationFilter === 'all' || b.verificationStatus === verificationFilter;
    const matchesLender = lenderFilter === 'all' || b.lenderId === lenderFilter;
    
    return matchesSearch && matchesStatus && matchesRisk && matchesVerification && matchesLender;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortBy === 'name') return a.name.localeCompare(b.name) * dir;
    if (sortBy === 'creditScore') return (a.creditScore - b.creditScore) * dir;
    if (sortBy === 'totalLoans') return (a.totalLoans - b.totalLoans) * dir;
    return (new Date(a.joinedDate).getTime() - new Date(b.joinedDate).getTime()) * dir;
  });

  // Group borrowers by lender
  const groupedByLender = sorted.reduce((groups, borrower) => {
    const lenderId = borrower.lenderId;
    if (!groups[lenderId]) {
      groups[lenderId] = {
        lender: borrower.lender,
        borrowers: []
      };
    }
    groups[lenderId].borrowers.push(borrower);
    return groups;
  }, {} as Record<string, { lender: Lender; borrowers: Borrower[] }>);

  // Get unique lenders for filter dropdown
  const uniqueLenders = Array.from(new Set(borrowers.map(b => b.lender)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Borrower Management</h1>
            <p className="text-gray-600 mt-1">Comprehensive overview and management of all borrowers</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setGroupByLender(!groupByLender)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                groupByLender 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <FaUsers className="text-blue-600" />
              {groupByLender ? 'Grouped by Lender' : 'Group by Lender'}
            </button>
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FaChartLine className="text-blue-600" />
              {showAnalytics ? 'Hide' : 'Show'} Analytics
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FaDownload className="text-green-600" /> Export
            </button>
          </div>
        </div>

        {/* Analytics Dashboard */}
        {showAnalytics && analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Borrowers</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.totalBorrowers}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-2">
                    <FaArrowUp /> +{analytics.monthlyGrowth}% this month
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaUsers className="text-blue-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Active Borrowers</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.activeBorrowers}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {((analytics.activeBorrowers / analytics.totalBorrowers) * 100).toFixed(1)}% active rate
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FaCheckCircle className="text-green-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Borrowed</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">RWF {(analytics.totalAmountBorrowed / 1000000).toFixed(1)}M</p>
                  <p className="text-xs text-blue-600 flex items-center gap-1 mt-2">
                    <FaHandshake /> {analytics.totalLoansIssued} loans
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FaDollarSign className="text-purple-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Avg Credit Score</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.avgCreditScore}</p>
                  <p className="text-xs text-emerald-600 flex items-center gap-1 mt-2">
                    <FaChartLine /> {analytics.defaultRate.toFixed(1)}% default rate
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <FaStar className="text-emerald-600 text-xl" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Insights */}
        {showAnalytics && analytics && (
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaChartLine className="text-blue-600" /> Borrower Performance Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <FaStar className="text-blue-600 text-2xl mx-auto mb-2" />
                <p className="text-sm text-gray-600">Avg Credit Score</p>
                <p className="text-xl font-bold text-blue-600">{analytics.avgCreditScore}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <FaPercent className="text-green-600 text-2xl mx-auto mb-2" />
                <p className="text-sm text-gray-600">Repayment Rate</p>
                <p className="text-xl font-bold text-green-600">{(100 - analytics.defaultRate).toFixed(1)}%</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <FaChartLine className="text-purple-600 text-2xl mx-auto mb-2" />
                <p className="text-sm text-gray-600">Monthly Growth</p>
                <p className="text-xl font-bold text-purple-600">+{analytics.monthlyGrowth.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Borrower Management Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Borrower Directory</h2>
                <p className="text-sm text-gray-500 mt-1">Manage and monitor borrower profiles and performance</p>
              </div>
              
              {/* Advanced Filters */}
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search borrowers..."
                    className="pl-10 pr-3 py-2 w-full sm:w-64 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
                
                <select
                  value={riskFilter}
                  onChange={e => setRiskFilter(e.target.value as any)}
                  className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>

                <select
                  value={verificationFilter}
                  onChange={e => setVerificationFilter(e.target.value as any)}
                  className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Verification</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>

                <select
                  value={lenderFilter}
                  onChange={e => setLenderFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Lenders</option>
                  {uniqueLenders.map(lender => (
                    <option key={lender.id} value={lender.id}>{lender.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="p-6">
            {fetching && (
              <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_,i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg" />
                ))}
              </div>
            )}

            {!fetching && sorted.length === 0 && (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                  <FaUser className="text-blue-500 text-2xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No borrowers found</h3>
                <p className="text-gray-500 text-sm mb-6">
                  {search || statusFilter !== 'all' || riskFilter !== 'all' || verificationFilter !== 'all' || lenderFilter !== 'all'
                    ? 'Try adjusting your filters or search terms.'
                    : 'No borrowers have been registered yet.'
                  }
                </p>
              </div>
            )}

            {!fetching && sorted.length > 0 && (
              <div className="relative">
                {groupByLender ? (
                  // Grouped by Lender View
                  <div className="space-y-6">
                    {Object.entries(groupedByLender).map(([lenderId, group]) => (
                      <div key={lenderId} className="border border-gray-200 rounded-xl overflow-hidden">
                        {/* Lender Header */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold ${
                                group.lender.type === 'bank' ? 'bg-blue-600' :
                                group.lender.type === 'microfinance' ? 'bg-green-600' :
                                group.lender.type === 'cooperative' ? 'bg-purple-600' : 'bg-orange-600'
                              }`}>
                                {group.lender.name.charAt(0)}
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">{group.lender.name}</h3>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                    group.lender.type === 'bank' ? 'bg-blue-100 text-blue-700' :
                                    group.lender.type === 'microfinance' ? 'bg-green-100 text-green-700' :
                                    group.lender.type === 'cooperative' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                                  }`}>
                                    {group.lender.type.charAt(0).toUpperCase() + group.lender.type.slice(1)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <FaEnvelope className="text-xs" />
                                    {group.lender.email}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <FaPhone className="text-xs" />
                                    {group.lender.phone}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-600">Borrowers</div>
                              <div className="text-2xl font-bold text-gray-900">{group.borrowers.length}</div>
                              <div className="text-xs text-gray-500">
                                RWF {(group.borrowers.reduce((sum, b) => sum + b.outstandingAmount, 0) / 1000000).toFixed(1)}M outstanding
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Borrowers Table for this Lender */}
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600 select-none">
                              <tr>
                                <th className="pl-6 pr-3 py-3 font-semibold text-left">Borrower</th>
                                <th className="px-3 py-3 font-semibold text-left">Contact & Location</th>
                                <th className="px-3 py-3 font-semibold text-left">Credit Profile</th>
                                <th className="px-3 py-3 font-semibold text-left">Loan History</th>
                                <th className="px-3 py-3 font-semibold text-left">Verification</th>
                                <th className="px-3 py-3 font-semibold text-left">Risk Assessment</th>
                                <th className="pr-6 pl-3 py-3 font-semibold text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                              {group.borrowers.map((borrower) => (
                                <BorrowerRow 
                                  key={borrower.id} 
                                  borrower={borrower} 
                                  openActionRow={openActionRow}
                                  setOpenActionRow={setOpenActionRow}
                                />
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Standard Ungrouped View
                  <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600 select-none">
                        <tr>
                          <th onClick={() => toggleSort('name')} className="pl-6 pr-3 py-4 font-semibold text-left cursor-pointer group">
                            <div className="inline-flex items-center gap-1">
                              Borrower
                              {sortBy === 'name' && <span className="text-[10px] font-normal">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                              {sortBy !== 'name' && <span className="opacity-0 group-hover:opacity-60 transition">⇅</span>}
                            </div>
                          </th>
                          <th className="px-3 py-4 font-semibold text-left">Contact & Location</th>
                          <th onClick={() => toggleSort('creditScore')} className="px-3 py-4 font-semibold text-left cursor-pointer group">
                            <div className="inline-flex items-center gap-1">
                              Credit Profile
                              {sortBy === 'creditScore' && <span className="text-[10px] font-normal">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                              {sortBy !== 'creditScore' && <span className="opacity-0 group-hover:opacity-60 transition">⇅</span>}
                            </div>
                          </th>
                          <th onClick={() => toggleSort('totalLoans')} className="px-3 py-4 font-semibold text-left cursor-pointer group">
                            <div className="inline-flex items-center gap-1">
                              Loan History
                              {sortBy === 'totalLoans' && <span className="text-[10px] font-normal">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                              {sortBy !== 'totalLoans' && <span className="opacity-0 group-hover:opacity-60 transition">⇅</span>}
                            </div>
                          </th>
                          <th className="px-3 py-4 font-semibold text-left">Verification</th>
                          <th className="px-3 py-4 font-semibold text-left">Risk Assessment</th>
                          <th className="px-3 py-4 font-semibold text-left">Lender</th>
                          <th className="pr-6 pl-3 py-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {sorted.map((borrower) => (
                          <BorrowerRow 
                            key={borrower.id} 
                            borrower={borrower} 
                            openActionRow={openActionRow}
                            setOpenActionRow={setOpenActionRow}
                            showLender={true}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="flex justify-between items-center mt-4 text-xs text-gray-500">
                  <span>{sorted.length} borrower{sorted.length !== 1 && 's'} shown</span>
                  <div className="flex items-center gap-4">
                    <span className="hidden sm:inline">Sorted by {sortBy} ({sortDir})</span>
                    <span>Total Outstanding: RWF {(sorted.reduce((acc, b) => acc + b.outstandingAmount, 0) / 1000000).toFixed(1)}M</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBorrowersPage;
