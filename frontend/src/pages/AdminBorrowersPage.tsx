import React, { useState } from 'react';
import { fetchUsers } from '../services/adminApi';
import toast from 'react-hot-toast';
import AdminPageLayout from '../components/Admin/AdminPageLayout';
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
  FaEdit,
  FaTimes
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

const getCreditScoreColor = (score: number) => {
  if (score >= 700) return 'bg-gray-100 text-gray-700 border-gray-200';
  if (score >= 600) return 'bg-gray-100 text-gray-600 border-gray-200';
  return 'bg-gray-100 text-gray-600 border-gray-200';
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'suspended': return 'bg-gray-100 text-gray-600 border-gray-200';
    case 'inactive': return 'bg-gray-100 text-gray-500 border-gray-200';
    case 'pending': return 'bg-gray-100 text-gray-600 border-gray-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

const getRiskColor = (risk?: string) => {
  switch (risk) {
    case 'low': return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'medium': return 'bg-gray-100 text-gray-600 border-gray-200';
    case 'high': return 'bg-gray-100 text-gray-600 border-gray-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

const getVerificationColor = (status: string) => {
  switch (status) {
    case 'verified': return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'pending': return 'bg-gray-100 text-gray-600 border-gray-200';
    case 'rejected': return 'bg-gray-100 text-gray-600 border-gray-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

const BorrowerRow: React.FC<{
  borrower: Borrower;
  openActionRow: string | null;
  setOpenActionRow: (id: string | null) => void;
  showLender?: boolean;
  onViewDetails?: (borrower: Borrower) => void;
}> = ({ borrower, openActionRow, setOpenActionRow, showLender = false, onViewDetails }) => {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${borrower.status === 'active' ? 'bg-gray-700' :
            borrower.status === 'suspended' ? 'bg-gray-500' :
              borrower.status === 'pending' ? 'bg-gray-500' : 'bg-gray-400'
            }`}>
            {borrower.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-900">{borrower.name}</p>
            {borrower.company && (
              <p className="text-[10px] text-gray-500 flex items-center gap-1">
                <FaBuilding className="text-[10px]" />
                {borrower.company}
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${getStatusColor(borrower.status)}`}>
                <span className="w-1 h-1 rounded-full bg-current"></span>
                {borrower.status.charAt(0).toUpperCase() + borrower.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="space-y-0.5">
          <p className="text-xs text-gray-700 flex items-center gap-1">
            <FaEnvelope className="text-gray-400 text-[10px]" />
            {borrower.email}
          </p>
          <p className="text-xs text-gray-700 flex items-center gap-1">
            <FaPhone className="text-gray-400 text-[10px]" />
            {borrower.phone}
          </p>
          <p className="text-[10px] text-gray-500 flex items-center gap-1">
            <FaMapMarkerAlt className="text-gray-400 text-[10px]" />
            {borrower.address}
          </p>
        </div>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border ${getCreditScoreColor(borrower.creditScore)}`}>
              <FaStar className="w-2.5 h-2.5" />
              {borrower.creditScore}
            </span>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${getRiskColor(borrower.riskRating)}`}>
              {borrower.riskRating === 'low' ? <FaCheckCircle className="w-2.5 h-2.5" /> :
                borrower.riskRating === 'medium' ? <FaClock className="w-2.5 h-2.5" /> :
                  <FaExclamationTriangle className="w-2.5 h-2.5" />}
              {borrower.riskRating.charAt(0).toUpperCase() + borrower.riskRating.slice(1)}
            </span>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-gray-900">{borrower.totalLoans} loans</p>
          <p className="text-[10px] text-gray-600">RWF {(borrower.totalBorrowed / 1000000).toFixed(1)}M borrowed</p>
          <p className="text-[10px] text-gray-500">RWF {(borrower.outstandingAmount / 1000000).toFixed(1)}M outstanding</p>
          <div className="flex items-center gap-1 text-[10px]">
            <span className="text-gray-600">{borrower.onTimePayments} on-time</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">{borrower.latePayments} late</span>
            {borrower.defaultedLoans > 0 && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">{borrower.defaultedLoans} default</span>
              </>
            )}
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="space-y-0.5">
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${getVerificationColor(borrower.verificationStatus)}`}>
            {borrower.verificationStatus === 'verified' ? <FaCheckCircle className="w-2.5 h-2.5" /> :
              borrower.verificationStatus === 'pending' ? <FaClock className="w-2.5 h-2.5" /> :
                <FaBan className="w-2.5 h-2.5" />}
            {borrower.verificationStatus.charAt(0).toUpperCase() + borrower.verificationStatus.slice(1)}
          </span>
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <FaIdCard className="text-gray-400 text-[10px]" />
            ID: {borrower.nationalId.slice(-4)}
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="space-y-0.5">
          <div className="text-[10px] text-gray-500">Documents:</div>
          <div className="flex flex-wrap gap-0.5">
            {Object.entries(borrower.documents).map(([doc, status]) => (
              <span key={doc} className={`inline-flex items-center px-1 py-0.5 rounded text-[10px] ${status ? 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-500'
                }`}>
                {status ? '✓' : '✗'}
              </span>
            ))}
          </div>
          <div className="text-[10px] text-gray-500">
            Joined: {new Date(borrower.joinedDate).toLocaleDateString()}
          </div>
        </div>
      </td>
      {showLender && (
        <td className="px-3 py-2.5 whitespace-nowrap">
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-gray-900">{borrower.lender.name}</p>
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-200`}>
              {borrower.lender.type.charAt(0).toUpperCase() + borrower.lender.type.slice(1)}
            </span>
          </div>
        </td>
      )}
      <td className="px-3 py-2.5 text-right relative">
        <div className="inline-flex items-center gap-1">
          <button
            onClick={() => setOpenActionRow(openActionRow === borrower.id ? null : borrower.id)}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition"
            title="More Actions"
          >
            <FaEllipsisH className="w-3 h-3" />
          </button>
        </div>
        {openActionRow === borrower.id && (
          <div className="absolute right-3 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-1 text-xs">
            <button
              onClick={() => { if (onViewDetails) onViewDetails(borrower); setOpenActionRow(null); }}
              className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700 flex items-center gap-1.5"
            >
              <FaEye className="text-gray-500 text-xs" /> View Profile
            </button>
            <button
              onClick={() => { setOpenActionRow(null); }}
              className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700 flex items-center gap-1.5"
            >
              <FaEdit className="text-gray-500 text-xs" /> Edit Details
            </button>
            <button
              onClick={() => { setOpenActionRow(null); }}
              className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700 flex items-center gap-1.5"
            >
              <FaHistory className="text-gray-500 text-xs" /> Loan History
            </button>
            <button
              onClick={() => { setOpenActionRow(null); }}
              className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700 flex items-center gap-1.5"
            >
              <FaIdCard className="text-gray-500 text-xs" /> Documents
            </button>
            <div className="border-t border-gray-200 my-1"></div>
            <button
              onClick={() => { setOpenActionRow(null); }}
              className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 flex items-center gap-1.5"
            >
              <FaBan className="text-red-500 text-xs" /> Suspend
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
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  React.useEffect(() => {
    (async () => {
      setFetching(true);
      try {
        const usersData = await fetchUsers();

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
        const analyticsData = await mockFetchAnalytics();
        setAnalytics(analyticsData);

      } catch (err) {
        console.error('Error fetching borrowers from API, falling back to mock data:', err);

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
    toast.success('Borrowers exported successfully');
  };

  const handleViewDetails = (borrower: Borrower) => {
    setSelectedBorrower(borrower);
    setShowDetailsModal(true);
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

  const uniqueLenders = Array.from(new Set(borrowers.map(b => b.lender)));

  return (
    <AdminPageLayout
      title="Borrower Management"
      description="Comprehensive overview and management of all borrowers"
      actions={
        <div className="flex gap-2">
          <button
            onClick={() => setGroupByLender(!groupByLender)}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors text-xs font-medium ${groupByLender
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
          >
            <FaUsers className="w-3 h-3" />
            {groupByLender ? 'Grouped' : 'Group'} by Lender
          </button>
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-1.5 transition-colors text-xs font-medium"
          >
            <FaChartLine className="w-3 h-3" />
            {showAnalytics ? 'Hide' : 'Show'} Analytics
          </button>
          <button
            onClick={handleExport}
            className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-1.5 transition-colors text-xs font-medium"
          >
            <FaDownload className="w-3 h-3" />
            Export
          </button>
        </div>
      }
    >

      {/* Analytics Dashboard */}
      {showAnalytics && analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <div className="bg-white rounded-lg border border-gray-200 p-2.5 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-gray-900">{analytics?.totalBorrowers}</p>
                <p className="text-xs text-gray-600">Total Borrowers</p>
                <p className="text-[10px] text-gray-500 flex items-center gap-0.5 mt-0.5">
                  <FaArrowUp className="w-2 h-2" /> +{analytics?.monthlyGrowth}% this month
                </p>
              </div>
              <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                <FaUsers className="text-white text-xs" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-2.5 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-gray-900">{analytics?.activeBorrowers}</p>
                <p className="text-xs text-gray-600">Active Borrowers</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {((analytics?.activeBorrowers || 0) / (analytics?.totalBorrowers || 1) * 100).toFixed(1)}% active rate
                </p>
              </div>
              <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                <FaCheckCircle className="text-white text-xs" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-2.5 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-gray-900">RWF {(analytics.totalAmountBorrowed / 1000000).toFixed(1)}M</p>
                <p className="text-xs text-gray-600">Total Borrowed</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {analytics.totalLoansIssued} loans
                </p>
              </div>
              <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                <FaDollarSign className="text-white text-xs" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-2.5 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-gray-900">{analytics.avgCreditScore}</p>
                <p className="text-xs text-gray-600">Avg Credit Score</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {analytics.defaultRate.toFixed(1)}% default rate
                </p>
              </div>
              <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                <FaStar className="text-white text-xs" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Insights */}
      {showAnalytics && analytics && (
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <h3 className="text-xs font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
            <FaChartLine className="text-gray-600 text-xs" /> Borrower Performance Insights
          </h3>
          <div className="grid grid-cols-3 gap-2.5">
            <div className="text-center p-2 bg-gray-50 rounded-lg border border-gray-200">
              <FaStar className="text-gray-600 text-sm mx-auto mb-1" />
              <p className="text-[10px] text-gray-600">Avg Credit Score</p>
              <p className="text-sm font-bold text-gray-900">{analytics?.avgCreditScore}</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg border border-gray-200">
              <FaPercent className="text-gray-600 text-sm mx-auto mb-1" />
              <p className="text-[10px] text-gray-600">Repayment Rate</p>
              <p className="text-sm font-bold text-gray-900">{(100 - (analytics?.defaultRate || 0)).toFixed(1)}%</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg border border-gray-200">
              <FaChartLine className="text-gray-600 text-sm mx-auto mb-1" />
              <p className="text-[10px] text-gray-600">Monthly Growth</p>
              <p className="text-sm font-bold text-gray-900">+{analytics?.monthlyGrowth.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-2">
          <div className="relative flex-1">
            <FaSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search borrowers..."
              className="pl-7 pr-2 py-1.5 w-full rounded-lg border border-gray-200 focus:ring-2 focus:ring-gray-500 focus:border-transparent text-xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-2 py-1.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-gray-500 focus:border-transparent text-xs bg-white"
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
            className="px-2 py-1.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-gray-500 focus:border-transparent text-xs bg-white"
          >
            <option value="all">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>

          <select
            value={verificationFilter}
            onChange={e => setVerificationFilter(e.target.value as any)}
            className="px-2 py-1.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-gray-500 focus:border-transparent text-xs bg-white"
          >
            <option value="all">All Verification</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={lenderFilter}
            onChange={e => setLenderFilter(e.target.value)}
            className="px-2 py-1.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-gray-500 focus:border-transparent text-xs bg-white"
          >
            <option value="all">All Lenders</option>
            {uniqueLenders.map(lender => (
              <option key={lender.id} value={lender.id}>{lender.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Borrower Table */}
      {fetching ? (
        <div className="animate-pulse space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
          <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <FaUser className="text-gray-500 text-lg" />
          </div>
          <h3 className="text-sm font-semibold text-gray-800 mb-1">No borrowers found</h3>
          <p className="text-xs text-gray-500">
            {search || statusFilter !== 'all' || riskFilter !== 'all' || verificationFilter !== 'all' || lenderFilter !== 'all'
              ? 'Try adjusting your filters or search terms.'
              : 'No borrowers have been registered yet.'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {groupByLender ? (
            <div className="space-y-3">
              {Object.entries(groupedByLender).map(([lenderId, group]) => (
                <div key={lenderId} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold bg-gray-700">
                          {group.lender.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold text-gray-900">{group.lender.name}</h3>
                          <div className="flex items-center gap-2 text-[10px] text-gray-500">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                              {group.lender.type.charAt(0).toUpperCase() + group.lender.type.slice(1)}
                            </span>
                            <span>{group.borrowers.length} borrowers</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-gray-900">RWF {(group.borrowers.reduce((sum, b) => sum + b.outstandingAmount, 0) / 1000000).toFixed(1)}M</div>
                        <div className="text-[10px] text-gray-500">outstanding</div>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Borrower</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Contact</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Credit Profile</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Loan History</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Verification</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Documents</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {group.borrowers.map((borrower) => (
                          <BorrowerRow
                            key={borrower.id}
                            borrower={borrower}
                            openActionRow={openActionRow}
                            setOpenActionRow={setOpenActionRow}
                            onViewDetails={handleViewDetails}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th onClick={() => toggleSort('name')} className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer">
                      <div className="inline-flex items-center gap-1">
                        Borrower
                        {sortBy === 'name' && <span className="text-[10px]">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Contact</th>
                    <th onClick={() => toggleSort('creditScore')} className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer">
                      <div className="inline-flex items-center gap-1">
                        Credit Profile
                        {sortBy === 'creditScore' && <span className="text-[10px]">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                      </div>
                    </th>
                    <th onClick={() => toggleSort('totalLoans')} className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer">
                      <div className="inline-flex items-center gap-1">
                        Loan History
                        {sortBy === 'totalLoans' && <span className="text-[10px]">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Verification</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Documents</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Lender</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sorted.map((borrower) => (
                    <BorrowerRow
                      key={borrower.id}
                      borrower={borrower}
                      openActionRow={openActionRow}
                      setOpenActionRow={setOpenActionRow}
                      showLender={true}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex justify-between items-center px-3 py-2 border-t border-gray-200 text-[10px] text-gray-500">
            <span>{sorted.length} borrower{sorted.length !== 1 && 's'} shown</span>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline">Sorted by {sortBy} ({sortDir})</span>
              <span>Total Outstanding: RWF {(sorted.reduce((acc, b) => acc + b.outstandingAmount, 0) / 1000000).toFixed(1)}M</span>
            </div>
          </div>
        </div>
      )}

      {/* Borrower Details Modal */}
      {showDetailsModal && selectedBorrower && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Borrower Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5">Name</div>
                  <div className="text-xs font-medium text-gray-900">{selectedBorrower?.name}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5">Status</div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-medium ${getStatusColor(selectedBorrower?.status || 'inactive')}`}>
                      {(selectedBorrower?.status || 'inactive').charAt(0).toUpperCase() + (selectedBorrower?.status || 'inactive').slice(1)}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5">Email</div>
                  <div className="text-xs text-gray-900">{selectedBorrower?.email}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5">Phone</div>
                  <div className="text-xs text-gray-900">{selectedBorrower?.phone}</div>
                </div>
                {selectedBorrower?.company && (
                  <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                    <div className="text-[10px] text-gray-600 mb-0.5">Company</div>
                    <div className="text-xs text-gray-900">{selectedBorrower?.company}</div>
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5">Address</div>
                  <div className="text-xs text-gray-900">{selectedBorrower.address}</div>
                </div>
              </div>

              {/* Credit Profile */}
              <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                <div className="text-xs font-medium text-gray-900 mb-2">Credit Profile</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] text-gray-600">Credit Score</div>
                    <div className="text-xs font-medium text-gray-900">{selectedBorrower?.creditScore}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-600">Risk Rating</div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-medium ${getRiskColor(selectedBorrower?.riskRating)}`}>
                        {(selectedBorrower?.riskRating || 'medium').charAt(0).toUpperCase() + (selectedBorrower?.riskRating || 'medium').slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loan History */}
              <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                <div className="text-xs font-medium text-gray-900 mb-2">Loan History</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] text-gray-600">Total Loans</div>
                    <div className="text-xs font-medium text-gray-900">{selectedBorrower?.totalLoans}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-600">Total Borrowed</div>
                    <div className="text-xs font-medium text-gray-900">RWF {((selectedBorrower?.totalBorrowed || 0) / 1000000).toFixed(1)}M</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-600">Total Repaid</div>
                    <div className="text-xs font-medium text-gray-900">RWF {((selectedBorrower?.totalRepaid || 0) / 1000000).toFixed(1)}M</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-600">Outstanding</div>
                    <div className="text-xs font-medium text-gray-900">RWF {((selectedBorrower?.outstandingAmount || 0) / 1000000).toFixed(1)}M</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-600">On-Time Payments</div>
                    <div className="text-xs font-medium text-gray-900">{selectedBorrower?.onTimePayments}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-600">Late Payments</div>
                    <div className="text-xs font-medium text-gray-900">{selectedBorrower?.latePayments}</div>
                  </div>
                  {(selectedBorrower?.defaultedLoans || 0) > 0 && (
                    <div>
                      <div className="text-[10px] text-gray-600">Defaulted Loans</div>
                      <div className="text-xs font-medium text-gray-900">{selectedBorrower?.defaultedLoans}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Verification & Documents */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5">Verification Status</div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-medium ${getVerificationColor(selectedBorrower?.verificationStatus || 'pending')}`}>
                      {(selectedBorrower?.verificationStatus || 'pending').charAt(0).toUpperCase() + (selectedBorrower?.verificationStatus || 'pending').slice(1)}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5">National ID</div>
                  <div className="text-xs text-gray-900">{selectedBorrower?.nationalId}</div>
                </div>
              </div>

              {/* Documents */}
              <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                <div className="text-xs font-medium text-gray-900 mb-2">Documents</div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(selectedBorrower?.documents || {}).map(([doc, status]) => (
                    <div key={doc} className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-600 capitalize">{doc.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className={`text-xs ${status ? 'text-gray-700' : 'text-gray-500'}`}>
                        {status ? '✓' : '✗'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lender Information */}
              <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                <div className="text-xs font-medium text-gray-900 mb-2">Lender Information</div>
                <div className="space-y-1">
                  <div>
                    <div className="text-[10px] text-gray-600">Lender Name</div>
                    <div className="text-xs text-gray-900">{selectedBorrower?.lender?.name}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-600">Type</div>
                    <div className="text-xs text-gray-900">{(selectedBorrower?.lender?.type || 'bank').charAt(0).toUpperCase() + (selectedBorrower?.lender?.type || 'bank').slice(1)}</div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5">Joined Date</div>
                  <div className="text-xs text-gray-900">{selectedBorrower?.joinedDate ? new Date(selectedBorrower.joinedDate).toLocaleDateString() : 'N/A'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5">Last Activity</div>
                  <div className="text-xs text-gray-900">{selectedBorrower?.lastActivity ? new Date(selectedBorrower.lastActivity).toLocaleDateString() : 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default AdminBorrowersPage;
