import React, { useState } from 'react';
import { lendingApi } from '../services/lending/lendingApi';
import toast from 'react-hot-toast';
import AdminPageLayout from '../components/Admin/AdminPageLayout';
import {
  Trash2, Plus, Key, Mail,
  Phone, Building2, MoreHorizontal,
  Copy, Check, Search, TrendingUp,
  DollarSign, ArrowUp,
  Download, AlertTriangle, CheckCircle2,
  Clock, Eye, Percent, X,
  Briefcase, ShieldCheck
} from 'lucide-react';

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
      case 'low': return 'bg-green-50 text-green-700 border-green-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'high': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
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
            className="px-3 py-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-600 rounded-xl flex items-center gap-2 transition-all duration-200 text-xs font-black"
          >
            <TrendingUp size={14} />
            {showAnalytics ? 'Hide' : 'Show'} Analytics
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-600 rounded-xl flex items-center gap-2 transition-all duration-200 text-xs font-black"
          >
            <Download size={14} />
            Export
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-900 flex items-center gap-2 transition-all duration-200 text-xs font-black"
          >
            <Plus size={14} />
            New Lender
          </button>
        </div>
      }
    >

      {/* Analytics Dashboard */}
      {showAnalytics && analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-all duration-200 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity bg-gray-50"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Lenders</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-gray-900 leading-none">{analytics?.totalLenders}</p>
                  <p className="text-[10px] text-green-600 font-bold flex items-center gap-0.5">
                    <ArrowUp size={10} /> +{analytics?.monthlyGrowth}%
                  </p>
                </div>
              </div>
              <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center group-hover:bg-gray-900 transition-colors">
                <Building2 className="text-white" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-all duration-200 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity bg-gray-50"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Active Lenders</p>
                <p className="text-2xl font-black text-gray-900 leading-none">{analytics?.activeLenders}</p>
                <p className="text-[10px] text-gray-500 font-bold mt-1.5">
                  {((analytics?.activeLenders || 0) / (analytics?.totalLenders || 1) * 100).toFixed(1)}% active rate
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center group-hover:bg-gray-900 transition-colors">
                <CheckCircle2 className="text-white" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-all duration-200 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity bg-gray-50"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Loans</p>
                <p className="text-2xl font-black text-gray-900 leading-none">{(analytics?.totalLoansIssued || 0).toLocaleString()}</p>
                <p className="text-[10px] text-gray-500 font-bold mt-1.5">Loans issued</p>
              </div>
              <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center group-hover:bg-gray-900 transition-colors">
                <Briefcase className="text-white" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-all duration-200 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity bg-gray-50"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Amount Disbursed</p>
                <p className="text-2xl font-black text-gray-900 leading-none">RWF {((analytics?.totalAmountDisbursed || 0) / 1000000).toFixed(1)}M</p>
                <p className="text-[10px] text-gray-500 font-bold mt-1.5">Avg: {analytics?.avgApprovalRate.toFixed(1)}% approval</p>
              </div>
              <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center group-hover:bg-gray-900 transition-colors">
                <DollarSign className="text-white" size={20} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Insights */}
      {showAnalytics && analytics && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-xs font-black text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="text-indigo-600" size={16} /> Performance Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors group">
              <Percent className="text-gray-400 group-hover:text-blue-500 transition-colors mx-auto mb-2" size={20} />
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Avg Approval Rate</p>
              <p className="text-xl font-black text-gray-900">{analytics?.avgApprovalRate.toFixed(1)}%</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors group">
              <Clock className="text-gray-400 group-hover:text-orange-500 transition-colors mx-auto mb-2" size={20} />
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Avg Processing Time</p>
              <p className="text-xl font-black text-gray-900">{analytics?.avgProcessingTime.toFixed(1)} days</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors group">
              <TrendingUp className="text-gray-400 group-hover:text-green-500 transition-colors mx-auto mb-2" size={20} />
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Monthly Growth</p>
              <p className="text-xl font-black text-gray-900">+{analytics?.monthlyGrowth.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold" size={14} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search lenders..."
              className="pl-10 pr-4 py-2 w-full rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white outline-none transition-all"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white outline-none"
          >
            <option value="all">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>
        </div>
      </div>

      {/* Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative overflow-hidden ring-1 ring-black/5">
            <div className="bg-gray-50/50 px-6 py-4 flex items-center justify-between border-b border-gray-100">
              <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <Plus className="text-indigo-600" size={18} /> Register New Lender
              </h2>
              <button
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                onClick={() => setShowModal(false)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Building2 size={12} /> Lender Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="e.g. Acme Credit Corp"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Mail size={12} /> Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="contact@lender.com"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Phone size={12} /> Business Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="+250 7..."
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle size={16} className="shrink-0" />
                    <p className="text-xs font-bold leading-tight">{error}</p>
                  </div>
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 size={16} className="shrink-0" />
                    <p className="text-xs font-bold leading-tight">Lender registered successfully!</p>
                  </div>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-black hover:bg-black transition-all duration-200 shadow-lg shadow-black/10 flex items-center justify-center gap-2 text-sm mt-2 disabled:bg-gray-300 disabled:shadow-none"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check size={18} /> Register Lender
                  </>
                )}
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
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
          <div className="mx-auto mb-3 w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
            <Building2 className="text-gray-500" size={24} />
          </div>
          <h3 className="text-sm font-black text-gray-900 mb-1">No lenders found</h3>
          <p className="text-xs text-gray-500 mb-4">
            {search || statusFilter !== 'all' || riskFilter !== 'all'
              ? 'Try adjusting your filters or search terms.'
              : 'Start by registering your first lending partner.'
            }
          </p>
          {!search && statusFilter === 'all' && riskFilter === 'all' && (
            <button
              onClick={() => setShowModal(true)}
              className="px-3 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-900 flex items-center gap-2 transition-all duration-200 text-xs font-black"
            >
              <Plus size={14} /> Add Lender
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th onClick={() => toggleSort('name')} className="px-3 py-3 text-left text-xs font-black text-gray-900 uppercase tracking-wider cursor-pointer">
                    <div className="inline-flex items-center gap-1">
                      Lender
                      {sortBy === 'name' && <TrendingUp size={10} className={sortDir === 'asc' ? '' : 'rotate-180'} />}
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-black text-gray-900 uppercase tracking-wider">Contact</th>
                  <th onClick={() => toggleSort('totalLoans')} className="px-3 py-3 text-left text-xs font-black text-gray-900 uppercase tracking-wider cursor-pointer">
                    <div className="inline-flex items-center gap-1">
                      Performance
                      {sortBy === 'totalLoans' && <TrendingUp size={10} className={sortDir === 'asc' ? '' : 'rotate-180'} />}
                    </div>
                  </th>
                  <th onClick={() => toggleSort('approvalRate')} className="px-3 py-3 text-left text-xs font-black text-gray-900 uppercase tracking-wider cursor-pointer">
                    <div className="inline-flex items-center gap-1">
                      Approval Rate
                      {sortBy === 'approvalRate' && <TrendingUp size={10} className={sortDir === 'asc' ? '' : 'rotate-180'} />}
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-black text-gray-900 uppercase tracking-wider">Credentials</th>
                  <th className="px-3 py-3 text-left text-xs font-black text-gray-900 uppercase tracking-wider">Risk</th>
                  <th className="px-3 py-3 text-right text-xs font-black text-gray-900 uppercase tracking-wider">Actions</th>
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
                        <div className="space-y-1">
                          <p className="text-xs text-gray-700 flex items-center gap-2">
                            <Mail className="text-gray-400 font-bold" size={10} />
                            {l.email}
                          </p>
                          <p className="text-xs text-gray-700 flex items-center gap-2">
                            <Phone className="text-gray-400 font-bold" size={10} />
                            {l.phone}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-gray-900">{(l.totalLoans || 0).toLocaleString()} loans</p>
                          <p className="text-[10px] text-gray-600 font-medium">RWF {((l.totalAmount || 0) / 1000000).toFixed(1)}M disbursed</p>
                          <p className="text-[10px] text-gray-500 font-medium">{l.avgProcessingTime?.toFixed(1) || 'N/A'} days avg</p>
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
                        <div className="inline-flex items-center gap-2 font-mono text-[10px] bg-gray-50 rounded-xl px-3 py-1.5 border border-gray-100">
                          <Key className="text-gray-400" size={10} />
                          <span className="text-gray-600 font-bold">{masked}</span>
                          <button
                            onClick={() => handleCopy(l.id, l.api_key)}
                            className="text-gray-400 hover:text-indigo-600 transition-colors"
                            title="Copy API Key"
                          >
                            {copiedId === l.id ? <Check className="text-green-600" size={10} /> : <Copy size={10} />}
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black border ${getRiskColor(l.riskRating)}`}>
                          {l.riskRating === 'low' ? <CheckCircle2 size={10} /> :
                            l.riskRating === 'medium' ? <Clock size={10} /> :
                              <AlertTriangle size={10} />}
                          {(l.riskRating || 'low').charAt(0).toUpperCase() + (l.riskRating || 'low').slice(1)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right relative">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleViewDetails(l)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-indigo-600 hover:text-indigo-700 transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => setOpenActionRow(r => r === l.id ? null : l.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                            title="More Actions"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                        {openActionRow === l.id && (
                          <div className="absolute right-3 mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-200 z-10 py-1 text-xs overflow-hidden">
                            <button
                              onClick={() => { handleViewDetails(l); setOpenActionRow(null); }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2 font-medium"
                            >
                              <Eye className="text-indigo-600" size={14} /> View Member
                            </button>
                            <button
                              onClick={() => { setOpenActionRow(null); }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2 font-medium"
                            >
                              <Key className="text-gray-600" size={14} /> Update API Key
                            </button>
                            <button
                              onClick={() => { setOpenActionRow(null); }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2 font-medium"
                            >
                              <TrendingUp className="text-gray-600" size={14} /> Performance
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button
                              onClick={() => { handleDelete(l.id); setOpenActionRow(null); }}
                              className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 font-black"
                            >
                              <Trash2 className="text-red-500" size={14} /> Remove
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col ring-1 ring-black/5">
            <div className="bg-gray-50/50 px-6 py-4 flex items-center justify-between border-b border-gray-100">
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <Building2 className="text-indigo-600" size={18} /> Lender Member Profile
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-colors">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Business Name</p>
                  <p className="text-sm font-black text-gray-900">{selectedLender.name}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-colors">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Account Status</p>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${getStatusColor(selectedLender.status)}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {(selectedLender.status || 'active').toUpperCase()}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-colors">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <Mail size={10} /> Email Address
                  </p>
                  <p className="text-sm font-bold text-gray-900">{selectedLender.email}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-colors">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <Phone size={10} /> Contact Phone
                  </p>
                  <p className="text-sm font-bold text-gray-900">{selectedLender.phone}</p>
                </div>
              </div>

              <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Key size={64} className="text-indigo-600" />
                </div>
                <h4 className="text-xs font-black text-indigo-900 flex items-center gap-2 mb-3">
                  <Key size={14} /> API Integration Credentials
                </h4>
                <div className="bg-white rounded-xl p-3 border border-indigo-100 flex items-center justify-between shadow-sm">
                  <code className="text-xs font-mono text-indigo-600 font-black">{selectedLender.api_key}</code>
                  <button
                    onClick={() => handleCopy(selectedLender.id, selectedLender.api_key)}
                    className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="Copy Key"
                  >
                    {copiedId === selectedLender.id ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-black text-gray-900 mb-4 flex items-center gap-2 tracking-tight">
                    <TrendingUp className="text-indigo-600" size={16} /> Performance Metrics
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Approval Rate</p>
                      <p className="text-sm font-black text-gray-900">{selectedLender.approvalRate?.toFixed(1)}%</p>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${selectedLender.approvalRate}%` }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Total Loans</p>
                        <p className="text-sm font-black text-gray-900">{selectedLender.totalLoans}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Risk Rating</p>
                        <span className={`text-[10px] font-black uppercase ${selectedLender.riskRating === 'low' ? 'text-green-600' : 'text-yellow-600'}`}>
                          {selectedLender.riskRating}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black text-gray-900 mb-4 flex items-center gap-2 tracking-tight">
                    <ShieldCheck className="text-indigo-600" size={16} /> Configuration
                  </h4>
                  <div className="space-y-3 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <div className="flex items-center justify-between py-2 border-b border-gray-200">
                      <p className="text-[10px] font-black text-gray-400 uppercase">Interest Rate</p>
                      <p className="text-xs font-black text-gray-900">{selectedLender.interestRate}%</p>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-200">
                      <p className="text-[10px] font-black text-gray-400 uppercase">Max Amount</p>
                      <p className="text-xs font-black text-gray-900">RWF {((selectedLender.maxLoanAmount || 0) / 1000000).toFixed(1)}M</p>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase">Registered</p>
                      <p className="text-xs font-black text-gray-900">{selectedLender.createdAt ? new Date(selectedLender.createdAt).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
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
