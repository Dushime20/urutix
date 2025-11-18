import React, { useState } from 'react';
import { lendingApi } from '../services/lending/lendingApi';

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
  FaPercent
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
  // Replace with actual API call
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

  React.useEffect(() => {
    (async () => {
      setFetching(true);
      try {
        // Try to fetch from real API first
        const lendersData = await lendingApi.getAllLenders();
        
        // Transform API data to match component interface
        const transformedLenders: Lender[] = lendersData.map((lender: any) => ({
          id: lender.id,
          name: lender.name,
          email: lender.contact_email,
          phone: lender.phone || '+250788000000',
          api_key: lender.api_key || 'API_KEY_PENDING',
          status: lender.status,
          createdAt: lender.created_at,
          totalLoans: 0, // Will need separate API call
          totalAmount: 0,
          approvalRate: 0,
          avgProcessingTime: 24,
          riskRating: 'low',
          lastActivity: lender.updated_at || lender.created_at,
          interestRate: lender.default_interest_rate || 12,
          maxLoanAmount: lender.max_loan_amount || 1000000
        }));

        setLenders(transformedLenders);
        
        // For now, use mock analytics until dedicated API is available
        const analyticsData = await mockFetchAnalytics();
        setAnalytics(analyticsData);
        
      } catch (err) {
        console.error('Error fetching lenders from API, falling back to mock data:', err);
        
        // Fallback to mock data if API fails
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
      // Use real API to create lender
      await lendingApi.createLender({
        name: form.name,
        contact_email: form.email,
        callback_url: undefined // Optional field
      });
      
      setSuccess(true);
      setForm({ name: '', email: '', phone: '', api_key: '' });
      setShowModal(false);
      setLoading(false);
    } catch (err: any) {
      console.error('Error creating lender:', err);
      setError(err.response?.data?.message || err.message || 'Error registering lender');
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLenders(prev => prev.filter(l => l.id !== id));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      {/* Modal for registration form */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl"
              onClick={() => setShowModal(false)}
              title="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
              <FaPlus className="text-blue-600" /> Register New Lender
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1"><FaBuilding /> Lender Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Company Name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1"><FaEnvelope /> Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Contact Email"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1"><FaPhone /> Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Contact Phone"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1"><FaKey /> API Key</label>
                <input
                  type="text"
                  name="api_key"
                  value={form.api_key}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="API Key for Integration"
                />
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              {success && <div className="text-green-600 text-sm">Lender registered successfully!</div>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                {loading ? 'Registering...' : 'Register Lender'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Lender Management</h1>
            <p className="text-gray-600 mt-1">Comprehensive overview and management of lending partners</p>
          </div>
          <div className="flex items-center gap-3">
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
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold shadow hover:from-blue-700 hover:to-blue-800 transition-colors"
            >
              <FaPlus className="text-xs" /> New Lender
            </button>
          </div>
        </div>

        {/* Analytics Dashboard */}
        {showAnalytics && analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Lenders</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.totalLenders}</p>
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
                  <p className="text-sm text-gray-600 font-medium">Active Lenders</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.activeLenders}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {((analytics.activeLenders / analytics.totalLenders) * 100).toFixed(1)}% active rate
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
                  <p className="text-sm text-gray-600 font-medium">Total Loans</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.totalLoansIssued.toLocaleString()}</p>
                  <p className="text-xs text-blue-600 flex items-center gap-1 mt-2">
                    <FaHandshake /> Loans issued
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FaHandshake className="text-purple-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Amount Disbursed</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">RWF {(analytics.totalAmountDisbursed / 1000000).toFixed(1)}M</p>
                  <p className="text-xs text-emerald-600 flex items-center gap-1 mt-2">
                    <FaChartLine /> Avg: {analytics.avgApprovalRate.toFixed(1)}% approval
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <FaDollarSign className="text-emerald-600 text-xl" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Insights */}
        {showAnalytics && (
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaChartLine className="text-blue-600" /> Performance Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <FaPercent className="text-blue-600 text-2xl mx-auto mb-2" />
                <p className="text-sm text-gray-600">Avg Approval Rate</p>
                <p className="text-xl font-bold text-blue-600">{analytics?.avgApprovalRate.toFixed(1)}%</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <FaClock className="text-green-600 text-2xl mx-auto mb-2" />
                <p className="text-sm text-gray-600">Avg Processing Time</p>
                <p className="text-xl font-bold text-green-600">{analytics?.avgProcessingTime.toFixed(1)} days</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <FaChartLine className="text-purple-600 text-2xl mx-auto mb-2" />
                <p className="text-sm text-gray-600">Monthly Growth</p>
                <p className="text-xl font-bold text-purple-600">+{analytics?.monthlyGrowth.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        )}

      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-6xl border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Lender Management</h2>
            <p className="text-sm text-gray-500">Register, search and manage financial partners</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search lenders..."
                className="pl-10 pr-3 py-2 w-full sm:w-64 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold shadow hover:from-blue-700 hover:to-blue-800 transition-colors text-sm"
            >
              <FaPlus className="text-xs" /> New Lender
            </button>
          </div>
        </div>

        {fetching && (
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_,i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-lg" />
            ))}
          </div>
        )}

            {!fetching && sorted.length === 0 && (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                  <FaBuilding className="text-blue-500 text-2xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No lenders found</h3>
                <p className="text-gray-500 text-sm mb-6">
                  {search || statusFilter !== 'all' || riskFilter !== 'all' 
                    ? 'Try adjusting your filters or search terms.'
                    : 'Start by registering your first lending partner.'
                  }
                </p>
                {!search && statusFilter === 'all' && riskFilter === 'all' && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 shadow-sm transition-colors"
                  >
                    <FaPlus className="text-xs" /> Add Lender
                  </button>
                )}
              </div>
            )}

            {/* Advanced Filters */}
            {!fetching && lenders.length > 0 && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="relative flex-1">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search by name, email, or phone..."
                      className="pl-10 pr-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value as any)}
                      className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="inactive">Inactive</option>
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
                  </div>
                </div>
              </div>
            )}        {!fetching && sorted.length > 0 && (
          <div className="relative">
            <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600 select-none">
                  <tr>
                    <th onClick={() => toggleSort('name')} className="pl-6 pr-3 py-4 font-semibold text-left cursor-pointer group">
                      <div className="inline-flex items-center gap-1">
                        Lender
                        {sortBy === 'name' && <span className="text-[10px] font-normal">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                        {sortBy !== 'name' && <span className="opacity-0 group-hover:opacity-60 transition">⇅</span>}
                      </div>
                    </th>
                    <th className="px-3 py-4 font-semibold text-left">Contact</th>
                    <th onClick={() => toggleSort('totalLoans')} className="px-3 py-4 font-semibold text-left cursor-pointer group">
                      <div className="inline-flex items-center gap-1">
                        Performance
                        {sortBy === 'totalLoans' && <span className="text-[10px] font-normal">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                        {sortBy !== 'totalLoans' && <span className="opacity-0 group-hover:opacity-60 transition">⇅</span>}
                      </div>
                    </th>
                    <th onClick={() => toggleSort('approvalRate')} className="px-3 py-4 font-semibold text-left cursor-pointer group">
                      <div className="inline-flex items-center gap-1">
                        Approval Rate
                        {sortBy === 'approvalRate' && <span className="text-[10px] font-normal">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                        {sortBy !== 'approvalRate' && <span className="opacity-0 group-hover:opacity-60 transition">⇅</span>}
                      </div>
                    </th>
                    <th className="px-3 py-4 font-semibold text-left">API Key</th>
                    <th className="px-3 py-4 font-semibold text-left">Risk</th>
                    <th className="pr-6 pl-3 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {sorted.map((l) => {
                    const masked = l.api_key.length > 8 ? l.api_key.slice(0,4) + '••••' + l.api_key.slice(-4) : l.api_key;
                    return (
                      <tr key={l.id} className="group hover:bg-blue-50/60 transition-colors">
                        <td className="pl-6 pr-3 py-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                              l.status === 'active' ? 'bg-green-500' :
                              l.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-400'
                            }`}>
                              {l.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{l.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                                  l.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                                  l.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                  'bg-gray-50 text-gray-600 border-gray-200'
                                }`}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                  {(l.status || 'active').charAt(0).toUpperCase() + (l.status || 'active').slice(1)}
                                </span>
                                {l.lastActivity && (
                                  <span className="text-xs text-gray-500">
                                    Last: {new Date(l.lastActivity).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4 align-middle">
                          <div className="space-y-1">
                            <p className="text-gray-700 flex items-center gap-1">
                              <FaEnvelope className="text-gray-400 text-xs" />
                              {l.email}
                            </p>
                            <p className="text-gray-700 flex items-center gap-1">
                              <FaPhone className="text-gray-400 text-xs" />
                              {l.phone}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 py-4 align-middle">
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-900">{(l.totalLoans || 0).toLocaleString()} loans</p>
                            <p className="text-sm text-gray-600">RWF {((l.totalAmount || 0) / 1000000).toFixed(1)}M disbursed</p>
                            <p className="text-xs text-gray-500">{l.avgProcessingTime?.toFixed(1) || 'N/A'} days avg</p>
                          </div>
                        </td>
                        <td className="px-3 py-4 align-middle">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-2 rounded-full bg-gray-200 overflow-hidden`}>
                              <div 
                                className={`h-full transition-all ${
                                  (l.approvalRate || 0) >= 80 ? 'bg-green-500' :
                                  (l.approvalRate || 0) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${l.approvalRate || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{l.approvalRate?.toFixed(1) || 0}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-4 align-middle">
                          <div className="inline-flex items-center gap-2 font-mono text-[11px] bg-gray-100 rounded-md px-2 py-1 border border-gray-200">
                            <FaKey className="text-gray-400" />
                            <span>{masked}</span>
                            <button
                              onClick={() => handleCopy(l.id, l.api_key)}
                              className="text-gray-400 hover:text-gray-600 transition"
                              title="Copy API Key"
                            >
                              {copiedId === l.id ? <FaCheck className="text-green-500" /> : <FaCopy />}
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-4 align-middle">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            l.riskRating === 'low' ? 'bg-green-50 text-green-700 border-green-200' :
                            l.riskRating === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {l.riskRating === 'low' ? <FaCheckCircle className="w-3 h-3" /> :
                             l.riskRating === 'medium' ? <FaClock className="w-3 h-3" /> :
                             <FaExclamationTriangle className="w-3 h-3" />}
                            {(l.riskRating || 'low').charAt(0).toUpperCase() + (l.riskRating || 'low').slice(1)}
                          </span>
                        </td>
                        <td className="pr-6 pl-3 py-4 text-right relative">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => setOpenActionRow(r => r === l.id ? null : l.id)}
                              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
                              title="More Actions"
                            >
                              <FaEllipsisH />
                            </button>
                          </div>
                          {openActionRow === l.id && (
                            <div className="absolute right-6 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-10 py-1 text-sm">
                              <button
                                onClick={() => { /* future: open view */ setOpenActionRow(null); }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                              >
                                <FaEye className="text-blue-500" /> View Details
                              </button>
                              <button
                                onClick={() => { /* future: edit modal */ setOpenActionRow(null); }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                              >
                                <FaKey className="text-green-500" /> Update API Key
                              </button>
                              <button
                                onClick={() => { /* future: performance */ setOpenActionRow(null); }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                              >
                                <FaChartLine className="text-purple-500" /> Performance Report
                              </button>
                              <div className="border-t border-gray-100 my-1"></div>
                              <button
                                onClick={() => { handleDelete(l.id); setOpenActionRow(null); }}
                                className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                              >
                                <FaTrash className="text-red-500" /> Remove Lender
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
            <div className="flex justify-between items-center mt-4 text-xs text-gray-500">
              <span>{sorted.length} lender{sorted.length !== 1 && 's'} shown</span>
              <div className="flex items-center gap-4">
                <span className="hidden sm:inline">Sorted by {sortBy} ({sortDir})</span>
                <span>Total Value: RWF {(sorted.reduce((acc, l) => acc + (l.totalAmount || 0), 0) / 1000000).toFixed(1)}M</span>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default AdminLenderRegistrationPage;
