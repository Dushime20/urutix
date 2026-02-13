import React, { useState } from 'react';
import { lendingApi } from '../services/lending/lendingApi';
import toast from 'react-hot-toast';
import AdminPageLayout from '../components/Admin/AdminPageLayout';
import {
  FaTrash,
  FaPlus,
  FaKey,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaEllipsisH,
  FaCopy,
  FaCheck,
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
  FaTimes
} from 'react-icons/fa';

interface Lender {
  id: string;
  name: string;
  email: string;
  phone: string;
  api_key: string;
  status?: 'active' | 'inactive' | 'pending';
  createdAt?: string;
  totalLoans?: number;
  totalAmount?: number;
  approvalRate?: number;
  avgProcessingTime?: number;
  riskRating?: 'low' | 'medium' | 'high';
  lastActivity?: string;
  interestRate?: number;
  maxLoanAmount?: number;
}

interface LenderAnalytics {
  totalLenders: number;
  activeLenders: number;
  totalLoansIssued: number;
  totalAmountDisbursed: number;
  avgApprovalRate: number;
  avgProcessingTime: number;
  monthlyGrowth: number;
  topPerformers: Lender[];
}

const mockFetchLenders = async (): Promise<Lender[]> => {
  return [
    {
      id: '1',
      name: 'CargoAI Bank',
      email: 'bank@cargoai.com',
      phone: '+250788123456',
      api_key: 'APIKEY123456789',
      status: 'active',
      createdAt: '2024-01-15',
      totalLoans: 145,
      totalAmount: 2450000,
      approvalRate: 87.5,
      avgProcessingTime: 2.3,
      riskRating: 'low',
      lastActivity: '2024-02-10',
      interestRate: 12.5,
      maxLoanAmount: 50000
    },
    {
      id: '2',
      name: 'Swift Finance',
      email: 'swift@finance.com',
      phone: '+250788654321',
      api_key: 'APIKEY987654321',
      status: 'active',
      createdAt: '2024-02-01',
      totalLoans: 89,
      totalAmount: 1680000,
      approvalRate: 92.1,
      avgProcessingTime: 1.8,
      riskRating: 'low',
      lastActivity: '2024-02-09',
      interestRate: 11.8,
      maxLoanAmount: 75000
    },
    {
      id: '3',
      name: 'Micro Credit Plus',
      email: 'micro@creditplus.rw',
      phone: '+250788111222',
      api_key: 'APIKEY555666777',
      status: 'pending',
      createdAt: '2024-02-08',
      totalLoans: 23,
      totalAmount: 345000,
      approvalRate: 76.3,
      avgProcessingTime: 3.1,
      riskRating: 'medium',
      lastActivity: '2024-02-07',
      interestRate: 15.2,
      maxLoanAmount: 25000
    },
  ];
};

const mockFetchAnalytics = async (): Promise<LenderAnalytics> => {
  return {
    totalLenders: 3,
    activeLenders: 2,
    totalLoansIssued: 257,
    totalAmountDisbursed: 4475000,
    avgApprovalRate: 85.3,
    avgProcessingTime: 2.4,
    monthlyGrowth: 12.8,
    topPerformers: []
  };
};

const AdminLenderRegistrationPage: React.FC = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    api_key: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [analytics, setAnalytics] = useState<LenderAnalytics | null>(null);
  const [fetching, setFetching] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'totalLoans' | 'approvalRate'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openActionRow, setOpenActionRow] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'inactive'>('all');
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [selectedLender, setSelectedLender] = useState<Lender | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  React.useEffect(() => {
    (async () => {
      setFetching(true);
      try {
        const lendersData = await lendingApi.getAllLenders();

        const transformedLenders: Lender[] = lendersData.map((lender: any) => ({
          id: lender.id,
          name: lender.name,
          email: lender.contact_email,
          phone: lender.phone || '+250788000000',
          api_key: lender.api_key || 'API_KEY_PENDING',
          status: lender.status,
          createdAt: lender.created_at,
          totalLoans: 0,
          totalAmount: 0,
          approvalRate: 0,
          avgProcessingTime: 24,
          riskRating: 'low',
          lastActivity: lender.updated_at || lender.created_at,
          interestRate: lender.default_interest_rate || 12,
          maxLoanAmount: lender.max_loan_amount || 1000000
        }));

        setLenders(transformedLenders);
        const analyticsData = await mockFetchAnalytics();
        setAnalytics(analyticsData);

      } catch (err) {
        console.error('Error fetching lenders from API, falling back to mock data:', err);

        try {
          const [lendersData, analyticsData] = await Promise.all([
            mockFetchLenders(),
            mockFetchAnalytics()
          ]);
          setLenders(lendersData);
          setAnalytics(analyticsData);
        } catch {
          setLenders([]);
          setAnalytics(null);
        }
      } finally {
        setFetching(false);
      }
    })();
  }, [success]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      await lendingApi.createLender({
        name: form.name,
        contact_email: form.email,
        callback_url: undefined
      });

      setSuccess(true);
      setForm({ name: '', email: '', phone: '', api_key: '' });
      setShowModal(false);
      setLoading(false);
      toast.success('Lender registered successfully');
      // Refresh lender list on success
      setSuccess(true); // This will trigger useEffect to refetch
    } catch (err: any) {
      console.error('Error creating lender:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error registering lender';

      // Simplify error message for email conflicts
      let displayError = errorMessage;
      if (errorMessage.includes('already exists') || errorMessage.includes('email') || errorMessage.toLowerCase().includes('user with')) {
        displayError = 'Email already exists';
      }

      setError(displayError);
      setLoading(false);

      // Don't close modal on error - keep it open so user can see the error
      // Don't refresh lender list on error

      // Show simple error toast for email conflicts
      if (errorMessage.includes('already exists') || errorMessage.includes('email') || errorMessage.toLowerCase().includes('user with')) {
        toast.error('Email already exists', {
          duration: 5000,
        });
      } else {
        toast.error(displayError, {
          duration: 5000,
        });
      }
    }
  };

  const handleDelete = async (id: string) => {
    setLenders(prev => prev.filter(l => l.id !== id));
    toast.success('Lender removed');
  };

  const toggleSort = (field: 'name' | 'createdAt' | 'totalLoans' | 'approvalRate') => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const handleCopy = (id: string, apiKey: string) => {
    navigator.clipboard.writeText(apiKey).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
      toast.success('API key copied to clipboard');
    });
  };

  const handleExport = () => {
    const csvData = filtered.map(l => ({
      Name: l.name,
      Email: l.email,
      Phone: l.phone,
      Status: l.status || 'active',
      'Total Loans': l.totalLoans || 0,
      'Total Amount': l.totalAmount || 0,
      'Approval Rate': `${l.approvalRate || 0}%`,
      'Risk Rating': l.riskRating || 'N/A',
      'Created At': l.createdAt || 'N/A'
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lenders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Lenders exported successfully');
  };

  const handleViewDetails = (lender: Lender) => {
    setSelectedLender(lender);
    setShowDetailsModal(true);
  };

  const filtered = lenders.filter(l => {
    if (!search && statusFilter === 'all' && riskFilter === 'all') return true;

    const matchesSearch = !search || [l.name, l.email, l.phone].some(field =>
      field.toLowerCase().includes(search.toLowerCase())
    );

    const matchesStatus = statusFilter === 'all' || (l.status || 'active') === statusFilter;
    const matchesRisk = riskFilter === 'all' || (l.riskRating || 'low') === riskFilter;

    return matchesSearch && matchesStatus && matchesRisk;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortBy === 'name') return a.name.localeCompare(b.name) * dir;
    if (sortBy === 'totalLoans') return ((a.totalLoans || 0) - (b.totalLoans || 0)) * dir;
    if (sortBy === 'approvalRate') return ((a.approvalRate || 0) - (b.approvalRate || 0)) * dir;
    return (new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()) * dir;
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-gray-100 text-gray-700';
      case 'pending': return 'bg-gray-100 text-gray-600';
      case 'inactive': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100 text-gray-600';
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

  return (
    <AdminPageLayout
      title="Lender Management"
      description="Comprehensive overview and management of lending partners"
      actions={
        <div className="flex gap-2">
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
          <button
            onClick={() => setShowModal(true)}
            className="px-2.5 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 flex items-center gap-1.5 transition-colors text-xs font-medium"
          >
            <FaPlus className="w-3 h-3" />
            New Lender
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
                <p className="text-lg font-bold text-gray-900">{analytics?.totalLenders}</p>
                <p className="text-xs text-gray-600">Total Lenders</p>
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
                <p className="text-lg font-bold text-gray-900">{analytics?.activeLenders}</p>
                <p className="text-xs text-gray-600">Active Lenders</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {((analytics?.activeLenders || 0) / (analytics?.totalLenders || 1) * 100).toFixed(1)}% active rate
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
                <p className="text-lg font-bold text-gray-900">{(analytics?.totalLoansIssued || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-600">Total Loans</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Loans issued</p>
              </div>
              <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                <FaHandshake className="text-white text-xs" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-2.5 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-gray-900">RWF {((analytics?.totalAmountDisbursed || 0) / 1000000).toFixed(1)}M</p>
                <p className="text-xs text-gray-600">Amount Disbursed</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Avg: {analytics?.avgApprovalRate.toFixed(1)}% approval</p>
              </div>
              <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                <FaDollarSign className="text-white text-xs" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Insights */}
      {showAnalytics && analytics && (
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <h3 className="text-xs font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
            <FaChartLine className="text-gray-600 text-xs" /> Performance Insights
          </h3>
          <div className="grid grid-cols-3 gap-2.5">
            <div className="text-center p-2 bg-gray-50 rounded-lg border border-gray-200">
              <FaPercent className="text-gray-600 text-sm mx-auto mb-1" />
              <p className="text-[10px] text-gray-600">Avg Approval Rate</p>
              <p className="text-sm font-bold text-gray-900">{analytics?.avgApprovalRate.toFixed(1)}%</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg border border-gray-200">
              <FaClock className="text-gray-600 text-sm mx-auto mb-1" />
              <p className="text-[10px] text-gray-600">Avg Processing Time</p>
              <p className="text-sm font-bold text-gray-900">{analytics?.avgProcessingTime.toFixed(1)} days</p>
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
              placeholder="Search by name, email, or phone..."
              className="pl-7 pr-2 py-1.5 w-full rounded-lg border border-gray-200 focus:ring-2 focus:ring-gray-500 focus:border-transparent text-xs"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-2 py-1.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-gray-500 focus:border-transparent text-xs bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
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
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg relative">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <FaPlus className="text-gray-600 text-xs" /> Register New Lender
              </h2>
              <button
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShowModal(false)}
                title="Close"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <FaBuilding className="text-gray-500 text-xs" /> Lender Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="Company Name"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <FaEnvelope className="text-gray-500 text-xs" /> Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="Contact Email"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <FaPhone className="text-gray-500 text-xs" /> Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="Contact Phone"
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded p-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <FaExclamationTriangle className="text-red-600 flex-shrink-0 w-3 h-3" />
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs">
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-green-600" />
                    <p className="text-green-800 font-semibold">Lender registered successfully!</p>
                  </div>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-1.5 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors text-xs"
              >
                {loading ? 'Registering...' : 'Register Lender'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Lenders Table */}
      {fetching ? (
        <div className="animate-pulse space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
          <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <FaBuilding className="text-gray-500 text-lg" />
          </div>
          <h3 className="text-sm font-semibold text-gray-800 mb-1">No lenders found</h3>
          <p className="text-xs text-gray-500 mb-4">
            {search || statusFilter !== 'all' || riskFilter !== 'all'
              ? 'Try adjusting your filters or search terms.'
              : 'Start by registering your first lending partner.'
            }
          </p>
          {!search && statusFilter === 'all' && riskFilter === 'all' && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors text-xs"
            >
              <FaPlus className="text-xs" /> Add Lender
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th onClick={() => toggleSort('name')} className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer">
                    <div className="inline-flex items-center gap-1">
                      Lender
                      {sortBy === 'name' && <span className="text-[10px]">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                    </div>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Contact</th>
                  <th onClick={() => toggleSort('totalLoans')} className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer">
                    <div className="inline-flex items-center gap-1">
                      Performance
                      {sortBy === 'totalLoans' && <span className="text-[10px]">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                    </div>
                  </th>
                  <th onClick={() => toggleSort('approvalRate')} className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer">
                    <div className="inline-flex items-center gap-1">
                      Approval Rate
                      {sortBy === 'approvalRate' && <span className="text-[10px]">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                    </div>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">API Key</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Risk</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sorted.map((l) => {
                  const masked = l.api_key.length > 8 ? l.api_key.slice(0, 4) + '••••' + l.api_key.slice(-4) : l.api_key;
                  return (
                    <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${l.status === 'active' ? 'bg-gray-700' :
                            l.status === 'pending' ? 'bg-gray-500' : 'bg-gray-400'
                            }`}>
                            {l.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-900">{l.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(l.status)}`}>
                                <span className="w-1 h-1 rounded-full bg-current"></span>
                                {(l.status || 'active').charAt(0).toUpperCase() + (l.status || 'active').slice(1)}
                              </span>
                              {l.lastActivity && (
                                <span className="text-[10px] text-gray-500">
                                  {new Date(l.lastActivity).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <p className="text-xs text-gray-700 flex items-center gap-1">
                            <FaEnvelope className="text-gray-400 text-[10px]" />
                            {l.email}
                          </p>
                          <p className="text-xs text-gray-700 flex items-center gap-1">
                            <FaPhone className="text-gray-400 text-[10px]" />
                            {l.phone}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium text-gray-900">{(l.totalLoans || 0).toLocaleString()} loans</p>
                          <p className="text-[10px] text-gray-600">RWF {((l.totalAmount || 0) / 1000000).toFixed(1)}M disbursed</p>
                          <p className="text-[10px] text-gray-500">{l.avgProcessingTime?.toFixed(1) || 'N/A'} days avg</p>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-8 h-1.5 rounded-full bg-gray-200 overflow-hidden`}>
                            <div
                              className={`h-full transition-all ${(l.approvalRate || 0) >= 80 ? 'bg-gray-600' :
                                (l.approvalRate || 0) >= 60 ? 'bg-gray-500' : 'bg-gray-400'
                                }`}
                              style={{ width: `${l.approvalRate || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-gray-900">{l.approvalRate?.toFixed(1) || 0}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 font-mono text-[10px] bg-gray-100 rounded-md px-2 py-1 border border-gray-200">
                          <FaKey className="text-gray-400 text-[10px]" />
                          <span>{masked}</span>
                          <button
                            onClick={() => handleCopy(l.id, l.api_key)}
                            className="text-gray-400 hover:text-gray-600 transition"
                            title="Copy API Key"
                          >
                            {copiedId === l.id ? <FaCheck className="text-gray-600 text-[10px]" /> : <FaCopy className="text-[10px]" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${getRiskColor(l.riskRating)}`}>
                          {l.riskRating === 'low' ? <FaCheckCircle className="w-2.5 h-2.5" /> :
                            l.riskRating === 'medium' ? <FaClock className="w-2.5 h-2.5" /> :
                              <FaExclamationTriangle className="w-2.5 h-2.5" />}
                          {(l.riskRating || 'low').charAt(0).toUpperCase() + (l.riskRating || 'low').slice(1)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right relative">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleViewDetails(l)}
                            className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition"
                            title="View Details"
                          >
                            <FaEye className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setOpenActionRow(r => r === l.id ? null : l.id)}
                            className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition"
                            title="More Actions"
                          >
                            <FaEllipsisH className="w-3 h-3" />
                          </button>
                        </div>
                        {openActionRow === l.id && (
                          <div className="absolute right-3 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-1 text-xs">
                            <button
                              onClick={() => { handleViewDetails(l); setOpenActionRow(null); }}
                              className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700 flex items-center gap-1.5"
                            >
                              <FaEye className="text-gray-500 text-xs" /> View Details
                            </button>
                            <button
                              onClick={() => { setOpenActionRow(null); }}
                              className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700 flex items-center gap-1.5"
                            >
                              <FaKey className="text-gray-500 text-xs" /> Update API Key
                            </button>
                            <button
                              onClick={() => { setOpenActionRow(null); }}
                              className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700 flex items-center gap-1.5"
                            >
                              <FaChartLine className="text-gray-500 text-xs" /> Performance
                            </button>
                            <div className="border-t border-gray-200 my-1"></div>
                            <button
                              onClick={() => { handleDelete(l.id); setOpenActionRow(null); }}
                              className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 flex items-center gap-1.5"
                            >
                              <FaTrash className="text-red-500 text-xs" /> Remove
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center px-3 py-2 border-t border-gray-200 text-[10px] text-gray-500">
            <span>{sorted.length} lender{sorted.length !== 1 && 's'} shown</span>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline">Sorted by {sortBy} ({sortDir})</span>
              <span>Total: RWF {(sorted.reduce((acc, l) => acc + (l.totalAmount || 0), 0) / 1000000).toFixed(1)}M</span>
            </div>
          </div>
        </div>
      )}

      {/* Lender Details Modal */}
      {showDetailsModal && selectedLender && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Lender Details</h3>
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
                  <div className="text-xs font-medium text-gray-900">{selectedLender?.name}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5">Status</div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-medium ${getStatusColor(selectedLender?.status || 'inactive')}`}>
                      {(selectedLender?.status || 'active').charAt(0).toUpperCase() + (selectedLender?.status || 'active').slice(1)}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5">Email</div>
                  <div className="text-xs text-gray-900">{selectedLender?.email}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5">Phone</div>
                  <div className="text-xs text-gray-900">{selectedLender?.phone}</div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                <div className="text-xs font-medium text-gray-900 mb-2">Performance Metrics</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] text-gray-600">Total Loans</div>
                    <div className="text-xs font-medium text-gray-900">{(selectedLender?.totalLoans || 0).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-600">Total Amount</div>
                    <div className="text-xs font-medium text-gray-900">RWF {((selectedLender?.totalAmount || 0) / 1000000).toFixed(1)}M</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-600">Approval Rate</div>
                    <div className="text-xs font-medium text-gray-900">{selectedLender?.approvalRate?.toFixed(1) || 0}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-600">Avg Processing Time</div>
                    <div className="text-xs font-medium text-gray-900">{selectedLender?.avgProcessingTime?.toFixed(1) || 'N/A'} days</div>
                  </div>
                </div>
              </div>

              {/* API Key */}
              <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                <div className="text-xs font-medium text-gray-900 mb-1">API Key</div>
                <div className="inline-flex items-center gap-1.5 font-mono text-xs bg-gray-100 rounded-md px-2 py-1 border border-gray-200">
                  <FaKey className="text-gray-400 text-xs" />
                  <span>{selectedLender?.api_key}</span>
                  <button
                    onClick={() => selectedLender && handleCopy(selectedLender.id, selectedLender.api_key)}
                    className="text-gray-400 hover:text-gray-600 transition"
                    title="Copy API Key"
                  >
                    {selectedLender && copiedId === selectedLender.id ? <FaCheck className="text-gray-600 text-xs" /> : <FaCopy className="text-xs" />}
                  </button>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5">Risk Rating</div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-medium ${getRiskColor(selectedLender?.riskRating)}`}>
                      {(selectedLender?.riskRating || 'low').charAt(0).toUpperCase() + (selectedLender?.riskRating || 'low').slice(1)}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5">Interest Rate</div>
                  <div className="text-xs font-medium text-gray-900">{selectedLender?.interestRate || 'N/A'}%</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5">Max Loan Amount</div>
                  <div className="text-xs font-medium text-gray-900">RWF {(selectedLender?.maxLoanAmount || 0).toLocaleString()}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5">Created At</div>
                  <div className="text-xs text-gray-900">{selectedLender?.createdAt || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default AdminLenderRegistrationPage;
