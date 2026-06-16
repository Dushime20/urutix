import React, { useState } from 'react';
import { useCurrencyFormat } from '../hooks/useCurrencyFormat';
import { fetchUsers } from '../services/adminApi';
import { lendingApi } from '../services/lending/lendingApi';
import toast from 'react-hot-toast';
import AdminPageLayout from '../components/Admin/AdminPageLayout';
import { TranslatedText } from '../components/translated-text';
import { StatCard } from '../components/EnliteUI';
import {
  User, Mail, Phone, Building2,
  MoreHorizontal, Search, TrendingUp,
  DollarSign, Users,
  Download, AlertTriangle, CheckCircle2,
  Eye, Percent, MapPin,
  CreditCard, History, Star, Ban,
  Edit, X, ShieldCheck, Briefcase,
  ExternalLink, ChevronRight
} from 'lucide-react';

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

const getCreditScoreColor = (score: number) => {
  if (score >= 700) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (score >= 600) return 'bg-amber-50 text-amber-700 border-amber-100';
  return 'bg-rose-50 text-rose-700 border-rose-100';
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case 'suspended': return 'bg-rose-50 text-rose-600 border-rose-100';
    case 'inactive': return 'bg-slate-50 text-slate-500 border-slate-100';
    case 'pending': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    default: return 'bg-gray-50 text-gray-400 border-gray-100';
  }
};

const getRiskColor = (risk?: string) => {
  switch (risk) {
    case 'low': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'medium': return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'high': return 'bg-rose-50 text-rose-700 border-rose-100';
    default: return 'bg-gray-50 text-gray-700 border-gray-100';
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
    <tr className="hover:bg-[#fafafa]/50 transition-colors group">
      <td className="px-8 py-6 whitespace-nowrap">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xs font-black shadow-lg shadow-gray-200 transition-transform group-hover:scale-110 ${borrower.status === 'active' ? 'bg-gray-900' :
            borrower.status === 'suspended' ? 'bg-indigo-500' :
              borrower.status === 'pending' ? 'bg-slate-400' : 'bg-slate-300'
            }`}>
            {borrower.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-black text-gray-900 tracking-tight uppercase mb-1">{borrower.name}</p>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${getStatusColor(borrower.status)}`}>
                <div className={`w-1 h-1 rounded-full ${borrower.status === 'active' ? 'bg-emerald-600 animate-pulse' : 'bg-current'}`}></div>
                {borrower.status}
              </span>
              {showLender && (
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                  <Building2 size={10} />
                  {borrower.lender.name}
                </span>
              )}
              {borrower.company && (
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Building2 size={10} />
                  {borrower.company}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="px-8 py-6 whitespace-nowrap">
        <div className="space-y-1.5">
          <p className="text-xs font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Mail className="text-slate-400" size={12} />
            {borrower.email}
          </p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Phone className="text-slate-400" size={12} />
            {borrower.phone}
          </p>
        </div>
      </td>
      <td className="px-8 py-6 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-xl border font-black text-xs ${getCreditScoreColor(borrower.creditScore)}`}>
            {borrower.creditScore} Alpha
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getRiskColor(borrower.riskRating)}`}>
            {borrower.riskRating} Risk
          </span>
        </div>
      </td>
      <td className="px-8 py-6 whitespace-nowrap">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-black text-gray-900 tracking-tight">{borrower.totalLoans} Issuances</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{fmtMoney(borrower.totalBorrowed)}</p>
          </div>
          <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full"
              style={{ width: `${(borrower.onTimePayments / (borrower.onTimePayments + borrower.latePayments + borrower.defaultedLoans || 1)) * 100}%` }}
            ></div>
          </div>
        </div>
      </td>
      <td className="px-8 py-6 whitespace-nowrap text-right relative">
        <button
          onClick={() => setOpenActionRow(openActionRow === borrower.id ? null : borrower.id)}
          className="w-10 h-10 bg-white hover:bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center text-slate-400 transition-all hover:text-gray-900 shadow-sm"
        >
          <MoreHorizontal size={18} />
        </button>
        {openActionRow === borrower.id && (
          <div className="absolute right-8 mt-2 w-56 bg-white rounded-[24px] shadow-2xl border border-gray-50 z-20 py-3 animate-enter">
            <button
              onClick={() => { if (onViewDetails) onViewDetails(borrower); setOpenActionRow(null); }}
              className="w-full text-left px-6 py-3 hover:bg-[#fafafa] text-slate-600 flex items-center gap-3 group/item"
            >
              <Eye className="text-indigo-400 group-hover/item:text-indigo-600 transition-colors" size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Protocol Profile</span>
            </button>
            <button className="w-full text-left px-6 py-3 hover:bg-[#fafafa] text-slate-600 flex items-center gap-3 group/item">
              <History className="text-slate-400 group-hover/item:text-gray-900 transition-colors" size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Issuance History</span>
            </button>
            <button className="w-full text-left px-6 py-3 hover:bg-[#fafafa] text-slate-600 flex items-center gap-3 group/item">
              <CreditCard className="text-slate-400 group-hover/item:text-gray-900 transition-colors" size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Registry Vault</span>
            </button>
            <div className="mx-4 my-2 border-t border-gray-50"></div>
            <button className="w-full text-left px-6 py-3 hover:bg-rose-50 text-rose-600 flex items-center gap-3 group/item">
              <Ban className="text-rose-400 group-hover/item:text-rose-600 transition-colors" size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Suspend Access</span>
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};

const AdminBorrowersPage: React.FC = () => {
  const { compact: fmtMoney } = useCurrencyFormat();
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [analytics, setAnalytics] = useState<BorrowerAnalytics | null>(null);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'creditScore' | 'totalLoans' | 'joinedDate'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [openActionRow, setOpenActionRow] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'inactive' | 'pending'>('all');
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [lenderFilter, setLenderFilter] = useState<'all' | string>('all');
  const [groupByLender, setGroupByLender] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  React.useEffect(() => {
    (async () => {
      setFetching(true);
      try {
        // Fetch all users and filter for borrowers (truck owners, cargo owners who have loans)
        const usersData = await fetchUsers();
        
        // Get all lenders to map borrower-lender relationships
        const lendersData = await lendingApi.getAllLenders();

        // Transform users into borrowers format
        const transformedBorrowers: Borrower[] = usersData
          .filter((user: any) => 
            // Filter users who are potential borrowers (truck owners, cargo owners)
            user.role === 'TRUCK_OWNER' || user.role === 'CARGO_OWNER' || user.role === 'DRIVER'
          )
          .map((user: any) => {
            // Find associated lender (default to first lender if not specified)
            const lender: any = lendersData.find((l: any) => l.id === user.lenderId) || lendersData[0] || {
              id: '1',
              name: 'Default Lender',
              type: 'bank',
              email: 'lender@example.com',
              phone: '+250788000000'
            };

            return {
              id: user.id,
              name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email?.split('@')[0] || 'Unknown',
              email: user.email,
              phone: user.phone || '+250788000000',
              company: user.companyName || undefined,
              address: user.address || 'Kigali, Rwanda',
              nationalId: user.nationalId || 'N/A',
              status: user.status === 'active' ? 'active' : user.status === 'suspended' ? 'suspended' : 'inactive',
              creditScore: user.creditScore || 650,
              riskRating: user.creditScore >= 700 ? 'low' : user.creditScore >= 600 ? 'medium' : 'high',
              totalLoans: 0, // TODO: fetch from loan requests
              totalBorrowed: 0,
              totalRepaid: 0,
              outstandingAmount: 0,
              onTimePayments: 0,
              latePayments: 0,
              defaultedLoans: 0,
              joinedDate: user.createdAt || new Date().toISOString(),
              lastActivity: user.updatedAt || user.createdAt || new Date().toISOString(),
              verificationStatus: user.emailVerified ? 'verified' : 'pending',
              lenderId: lender.id,
              lender: {
                id: lender.id,
                name: lender.name,
                type: 'bank' as const,
                email: lender.contact_email || lender.email,
                phone: lender.phone || '+250788000000'
              },
              documents: {
                nationalId: !!user.nationalId,
                businessLicense: !!user.companyName,
                bankStatement: false,
                taxCertificate: false
              }
            };
          });

        setBorrowers(transformedBorrowers);
        
        // Compute analytics from real data
        const activeBorrowers = transformedBorrowers.filter(b => b.status === 'active').length;
        const totalLoans = transformedBorrowers.reduce((sum, b) => sum + b.totalLoans, 0);
        const totalBorrowed = transformedBorrowers.reduce((sum, b) => sum + b.totalBorrowed, 0);
        const totalRepaid = transformedBorrowers.reduce((sum, b) => sum + b.totalRepaid, 0);
        const avgCreditScore = transformedBorrowers.length > 0
          ? Math.round(transformedBorrowers.reduce((sum, b) => sum + b.creditScore, 0) / transformedBorrowers.length)
          : 0;
        const defaultedCount = transformedBorrowers.reduce((sum, b) => sum + b.defaultedLoans, 0);
        const defaultRate = totalLoans > 0 ? (defaultedCount / totalLoans) * 100 : 0;

        setAnalytics({
          totalBorrowers: transformedBorrowers.length,
          activeBorrowers,
          totalLoansIssued: totalLoans,
          totalAmountBorrowed: totalBorrowed,
          totalRepaid,
          defaultRate,
          avgCreditScore,
          monthlyGrowth: 18.5 // TODO: compute from historical data
        });

      } catch (err) {
        console.error('Error fetching borrowers from API:', err);
        toast.error('Failed to load borrowers');
        setBorrowers([]);
        setAnalytics(null);
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
    if (!search && statusFilter === 'all' && riskFilter === 'all' && lenderFilter === 'all') return true;

    const matchesSearch = !search || [b.name, b.email, b.phone, b.company, b.nationalId].some(field =>
      field?.toLowerCase().includes(search.toLowerCase())
    );

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchesRisk = riskFilter === 'all' || b.riskRating === riskFilter;
    const matchesLender = lenderFilter === 'all' || b.lenderId === lenderFilter;

    return matchesSearch && matchesStatus && matchesRisk && matchesLender;
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
      title={<TranslatedText text="Borrower Management" />}
      description={<TranslatedText text="Comprehensive overview and management of all borrowers" />}
      actions={
        <div className="flex gap-4">
          <button
            onClick={() => setGroupByLender(!groupByLender)}
            className="px-4 py-2.5 bg-white border border-gray-100 hover:border-gray-200 text-slate-600 rounded-xl flex items-center gap-2 transition-all group overflow-hidden relative shadow-sm"
          >
            <div className="absolute inset-0 bg-gray-50/50 translate-y-full group-hover:translate-y-0 transition-transform"></div>
            <Users size={14} className="relative z-10" />
            <span className="text-[10px] font-black uppercase tracking-widest relative z-10">
              <TranslatedText text={groupByLender ? 'Ungroup' : 'Group'} /> <TranslatedText text="Matrix" />
            </span>
          </button>
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="px-4 py-2.5 bg-white border border-gray-100 hover:border-gray-200 text-slate-600 rounded-xl flex items-center gap-2 transition-all group overflow-hidden relative shadow-sm"
          >
            <div className="absolute inset-0 bg-gray-50/50 translate-y-full group-hover:translate-y-0 transition-transform"></div>
            <TrendingUp size={14} className="relative z-10" />
            <span className="text-[10px] font-black uppercase tracking-widest relative z-10">
              <TranslatedText text={showAnalytics ? 'Hide' : 'Show'} /> <TranslatedText text="Intelligence" />
            </span>
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-black transition-all shadow-lg shadow-gray-200 flex items-center gap-2 group"
          >
            <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest"><TranslatedText text="Export Registry" /></span>
          </button>
        </div>
      }
    >

      {/* Analytics Dashboard */}
      {showAnalytics && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             <StatCard
              title={<TranslatedText text="Total Borrowers" />}
              value={analytics?.totalBorrowers}
              icon={<Users size={22} />}
              color="primary"
              variant="classic"
              trend={`+${analytics?.monthlyGrowth}%`}
              trendDirection="up"
              subtitle="Registered borrowers"
            />
            <StatCard
              title={<TranslatedText text="Active Matrix" />}
              value={analytics?.activeBorrowers}
              icon={<CheckCircle2 size={22} />}
              color="primary"
              variant="classic"
              subtitle={`${((analytics?.activeBorrowers || 0) / (analytics?.totalBorrowers || 1) * 100).toFixed(1)}% Operational`}
            />
            <StatCard
              title={<TranslatedText text="Total Issuance (RWF)" />}
              value={fmtMoney(analytics.totalAmountBorrowed)}
              icon={<DollarSign size={22} />}
              color="primary"
              variant="classic"
              subtitle={`${analytics.totalLoansIssued} Issuances`}
            />
            <StatCard
              title={<TranslatedText text="Efficiency Core" />}
              value={analytics.avgCreditScore}
              icon={<Star size={22} />}
              color="primary"
              variant="classic"
              subtitle={`${analytics.defaultRate.toFixed(1)}% Default Index`}
            />
          </div>

          {/* Performance Insights */}
          <div className="bg-white rounded-[32px] border border-transparent p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Entity Intelligence</h3>
                <p className="text-xl font-black text-gray-900 tracking-tight uppercase">Performance Analytics</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                <TrendingUp className="text-slate-600" size={24} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group">
                <div className="bg-[#fafafa] rounded-[24px] p-6 border border-transparent transition-all">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-transparent">
                      <Star className="text-amber-500" size={20} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Credit Alpha</p>
                  </div>
                  <p className="text-4xl font-black text-gray-900 tracking-tighter mb-1">{analytics?.avgCreditScore}</p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">System-wide Average</p>
                </div>
              </div>

              <div className="group">
                <div className="bg-[#fafafa] rounded-[24px] p-6 border border-transparent transition-all">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-transparent">
                      <Percent className="text-emerald-500" size={20} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Repayment Matrix</p>
                  </div>
                  <p className="text-4xl font-black text-gray-900 tracking-tighter mb-1">{(100 - (analytics?.defaultRate || 0)).toFixed(1)}%</p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Protocol Success Rate</p>
                </div>
              </div>

              <div className="group">
                <div className="bg-[#fafafa] rounded-[24px] p-6 border border-transparent transition-all">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-transparent">
                      <TrendingUp className="text-indigo-600" size={20} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth Vector</p>
                  </div>
                  <p className="text-4xl font-black text-gray-900 tracking-tighter mb-1">+{analytics?.monthlyGrowth.toFixed(1)}%</p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">MoM Scalability</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-[32px] border border-transparent p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={16} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search entities..."
              className="pl-12 pr-4 py-3 w-full rounded-2xl border border-transparent focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/30 text-sm bg-[#fafafa] outline-none transition-all placeholder:text-slate-400 font-medium"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-4 py-3 w-full rounded-2xl border border-transparent focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/30 text-sm bg-[#fafafa] outline-none transition-all appearance-none font-medium text-slate-600 cursor-pointer"
            >
              <option value="all">Operational Matrix (All)</option>
              <option value="active">Active Protocol</option>
              <option value="suspended">Suspended Matrix</option>
              <option value="inactive">Offline System</option>
              <option value="pending">Pending Validation</option>
            </select>
          </div>

          <div className="relative">
            <select
              value={riskFilter}
              onChange={e => setRiskFilter(e.target.value as any)}
              className="px-4 py-3 w-full rounded-2xl border border-transparent focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/30 text-sm bg-[#fafafa] outline-none transition-all appearance-none font-medium text-slate-600 cursor-pointer"
            >
              <option value="all">Vulnerability Tiers (All)</option>
              <option value="low">Validated (Low Risk)</option>
              <option value="medium">Caution (Medium Risk)</option>
              <option value="high">Critical (High Risk)</option>
            </select>
          </div>

          <div className="relative">
            <select
              value={lenderFilter}
              onChange={e => setLenderFilter(e.target.value)}
              className="px-4 py-3 w-full rounded-2xl border border-transparent focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/30 text-sm bg-[#fafafa] outline-none transition-all appearance-none font-medium text-slate-600 cursor-pointer"
            >
              <option value="all">Provider Matrix (All)</option>
              {uniqueLenders.map(lender => (
                <option key={lender.id} value={lender.id}>{lender.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Borrower Table */}
      {
        fetching ? (
          <div className="animate-pulse space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-12 border border-transparent rounded-lg bg-gray-50">
            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="text-gray-500" size={24} />
            </div>
            <h3 className="text-sm font-semibold text-gray-800 mb-1">No borrowers found</h3>
            <p className="text-xs text-gray-500">
              {search || statusFilter !== 'all' || riskFilter !== 'all' || lenderFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'No borrowers have been registered yet.'
              }
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {groupByLender ? (
              <div className="space-y-6">
                {Object.entries(groupedByLender).map(([lenderId, group]) => (
                  <div key={lenderId} className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
                    <div className="bg-[#fafafa]/50 px-8 py-6 border-b border-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xs font-black bg-gray-900 shadow-lg shadow-gray-200">
                            {group.lender.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-gray-900 tracking-tight uppercase">{group.lender.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-100">
                                {group.lender.type}
                              </span>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{group.borrowers.length} Entities REGISTERED</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-black text-gray-900 tracking-tight">{fmtMoney(group.borrowers.reduce((sum, b) => sum + b.outstandingAmount, 0))}</div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OUTSTANDING EXPOSURE</div>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-[#fafafa]/30 border-b border-gray-50">
                            <th className="px-8 py-4 text-left">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entity Matrix</span>
                            </th>
                            <th className="px-8 py-4 text-left">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Communication</span>
                            </th>
                            <th className="px-8 py-4 text-left">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reliability Index</span>
                            </th>
                            <th className="px-8 py-4 text-left">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Issuance Flow</span>
                            </th>
                            <th className="px-8 py-4 text-right">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meta</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
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
              <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#fafafa]/50 border-b border-gray-50">
                        <th onClick={() => toggleSort('name')} className="px-8 py-6 text-left cursor-pointer group">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-gray-900 transition-colors">Entity Matrix</span>
                            {sortBy === 'name' && <TrendingUp size={12} className={`text-indigo-600 ${sortDir === 'asc' ? '' : 'rotate-180'} transition-transform`} />}
                          </div>
                        </th>
                        <th className="px-8 py-6 text-left">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Communication</span>
                        </th>
                        <th onClick={() => toggleSort('creditScore')} className="px-8 py-6 text-left cursor-pointer group">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-gray-900 transition-colors">Reliability Core</span>
                            {sortBy === 'creditScore' && <TrendingUp size={12} className={`text-indigo-600 ${sortDir === 'asc' ? '' : 'rotate-180'} transition-transform`} />}
                          </div>
                        </th>
                        <th onClick={() => toggleSort('totalLoans')} className="px-8 py-6 text-left cursor-pointer group">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-gray-900 transition-colors">Issuance Flow</span>
                            {sortBy === 'totalLoans' && <TrendingUp size={12} className={`text-indigo-600 ${sortDir === 'asc' ? '' : 'rotate-180'} transition-transform`} />}
                          </div>
                        </th>
                        <th className="px-8 py-6 text-right">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
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
              </div>
            )}
            <div className="flex justify-between items-center px-3 py-2 border-t border-gray-200 text-[10px] text-gray-500">
              <span>{sorted.length} borrower{sorted.length !== 1 && 's'} shown</span>
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline">Sorted by {sortBy} ({sortDir})</span>
                <span>Total Outstanding: {fmtMoney(sorted.reduce((acc, b) => acc + b.outstandingAmount, 0))}</span>
              </div>
            </div>
          </div>
        )
      }

      {/* Borrower Details Modal */}
      {showDetailsModal && selectedBorrower && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowDetailsModal(false)} />
          <div className="relative bg-white rounded-[32px] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl animate-enter">
            <div className="flex flex-col h-full">
              {/* Modal Header */}
              <div className="px-12 py-10 border-b border-gray-50 flex items-center justify-between bg-[#fafafa]/50">
                <div className="flex items-center gap-6">
                  <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center text-3xl font-black text-white shadow-2xl shadow-gray-200 ${selectedBorrower.status === 'active' ? 'bg-gray-900' : 'bg-indigo-500'
                    }`}>
                    {selectedBorrower.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase mb-2">{selectedBorrower.name}</h2>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(selectedBorrower.status)}`}>
                        {selectedBorrower.status.toUpperCase()} PROTOCOL
                      </span>
                      <span className="text-sm font-bold text-slate-400 flex items-center gap-2">
                        <MapPin size={14} />
                        {selectedBorrower.address}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-gray-900 hover:border-gray-200 transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                <div className="grid grid-cols-3 gap-12">
                  {/* Left Column - Entity Intelligence */}
                  <div className="col-span-2 space-y-12">
                    {/* Performance Matrix */}
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-gray-50 pb-2 flex items-center gap-2">
                        <TrendingUp size={12} className="text-indigo-600" />
                        Performance Alpha Matrix
                      </h3>
                      <div className="grid grid-cols-3 gap-6">
                        <div className="bg-[#fafafa] rounded-3xl p-6 border border-gray-50">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reliability Core</p>
                          <p className="text-2xl font-black text-gray-900 tracking-tight">{selectedBorrower.creditScore}</p>
                          <div className="mt-2 text-[9px] font-black text-emerald-500 uppercase tracking-tighter bg-emerald-50 px-2 py-0.5 rounded-full inline-block">Top 15%</div>
                        </div>
                        <div className="bg-[#fafafa] rounded-3xl p-6 border border-gray-50">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Exposure Ratio</p>
                          <p className="text-2xl font-black text-gray-900 tracking-tight">{fmtMoney(selectedBorrower.outstandingAmount)}</p>
                          <div className="mt-2 text-[9px] font-black text-slate-400 uppercase tracking-tighter">{((selectedBorrower.outstandingAmount / (selectedBorrower.totalBorrowed || 1)) * 100).toFixed(0)}% Utilization</div>
                        </div>
                        <div className="bg-[#fafafa] rounded-3xl p-6 border border-gray-50">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Protocol History</p>
                          <p className="text-2xl font-black text-gray-900 tracking-tight">{selectedBorrower.totalLoans}</p>
                          <div className="mt-2 text-[9px] font-black text-indigo-500 uppercase tracking-tighter">{selectedBorrower.onTimePayments} Success</div>
                        </div>
                      </div>
                    </div>

                    {/* Registry Documents */}
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-gray-50 pb-2 flex items-center gap-2">
                        <ShieldCheck size={12} className="text-indigo-600" />
                        Validation Protocols
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(selectedBorrower.documents).map(([doc, status]) => (
                          <div key={doc} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl group hover:border-indigo-100 transition-all">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${status ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {status ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                              </div>
                              <span className="text-xs font-black text-gray-900 uppercase tracking-tight">{doc.replace(/([A-Z])/g, ' $1').trim()}</span>
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${status ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {status ? 'Validated' : 'Required'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Provider Node */}
                    <div className="bg-gray-900 rounded-[32px] p-8 text-white relative overflow-hidden">
                      <div className="absolute right-0 top-0 p-8 opacity-10">
                        <Building2 size={120} />
                      </div>
                      <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Origin Provider Matrix</p>
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                            <Building2 className="text-white" size={32} />
                          </div>
                          <div>
                            <h4 className="text-xl font-black tracking-tight mb-1 uppercase">{selectedBorrower.lender.name}</h4>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{selectedBorrower.lender.type}</span>
                              <div className="w-1 h-1 rounded-full bg-white/20"></div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry ID: {selectedBorrower.lenderId}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - System Meta */}
                  <div className="space-y-12">
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-gray-50 pb-2 flex items-center gap-2">
                        <Users size={12} className="text-indigo-600" />
                        Access Identity
                      </h3>
                      <div className="space-y-6">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Company Entity</p>
                          <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{selectedBorrower.company || 'Private Entity'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">System Cipher ID</p>
                          <p className="text-sm font-mono font-bold text-gray-600">{selectedBorrower.nationalId}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Registry Email</p>
                          <p className="text-sm font-bold text-indigo-600 underline decoration-indigo-200 underline-offset-4">{selectedBorrower.email}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Protocol Entry</p>
                          <p className="text-sm font-black text-gray-900 tracking-tight">{new Date(selectedBorrower.joinedDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#fafafa] rounded-[32px] p-8 border border-gray-50">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Briefcase size={12} className="text-indigo-600" />
                        Operational Vault
                      </h3>
                      <div className="space-y-4">
                        <button className="w-full bg-white border border-gray-100 hover:border-gray-200 px-6 py-4 rounded-2xl flex items-center justify-between group transition-all">
                          <div className="flex items-center gap-3">
                            <Edit size={14} className="text-slate-400" />
                            <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Edit Profile</span>
                          </div>
                          <ChevronRight size={14} className="text-slate-400" />
                        </button>
                        <button className="w-full bg-white border border-gray-100 hover:border-gray-200 px-6 py-4 rounded-2xl flex items-center justify-between group transition-all">
                          <div className="flex items-center gap-3">
                            <CreditCard size={14} className="text-slate-400" />
                            <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Registry Vault</span>
                          </div>
                          <ExternalLink size={14} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        </button>
                        <button className="w-full bg-indigo-600 text-white px-6 py-4 rounded-2xl flex items-center justify-center font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-indigo-100">
                          Configure Node Access
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout >
  );
};

export default AdminBorrowersPage;
