import React, { useState } from 'react';
import { lendingApi } from '../services/lending/lendingApi';
import toast from 'react-hot-toast';
import AdminPageLayout from '../components/Admin/AdminPageLayout';
import {
  Trash2, Plus, Key, Mail,
  Phone, Building2, MoreHorizontal,
  Copy, Check, Search, TrendingUp,
  DollarSign,
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

  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case 'low': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'high': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'pending': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'inactive': return 'bg-slate-50 text-slate-500 border-slate-100';
      default: return 'bg-gray-50 text-gray-400 border-gray-100';
    }
  };

  return (
    <AdminPageLayout
      title="Lender Management"
      description="Comprehensive overview and management of lending partners"
      actions={
        <div className="flex gap-4">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="px-4 py-2.5 bg-white border border-gray-100 hover:border-gray-200 text-slate-600 rounded-xl flex items-center gap-2 transition-all group overflow-hidden relative shadow-sm"
          >
            <div className="absolute inset-0 bg-gray-50/50 translate-y-full group-hover:translate-y-0 transition-transform"></div>
            <TrendingUp size={14} className="relative z-10" />
            <span className="text-[10px] font-black uppercase tracking-widest relative z-10">
              {showAnalytics ? 'Hide' : 'Show'} Analytics
            </span>
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-white border border-gray-100 hover:border-gray-200 text-slate-600 rounded-xl flex items-center gap-2 transition-all group overflow-hidden relative shadow-sm"
          >
            <div className="absolute inset-0 bg-gray-50/50 translate-y-full group-hover:translate-y-0 transition-transform"></div>
            <Download size={14} className="relative z-10" />
            <span className="text-[10px] font-black uppercase tracking-widest relative z-10">Export Registry</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-black transition-all shadow-lg shadow-gray-200 flex items-center gap-2 group"
          >
            <Plus size={14} className="group-hover:rotate-90 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Register Provider</span>
          </button>
        </div>
      }
    >

      {/* Analytics Dashboard */}
      {showAnalytics && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-[32px] p-8 border border-gray-100 hover:border-indigo-100 transition-all group overflow-hidden relative">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Building2 className="text-indigo-600" size={24} />
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-gray-900 tracking-tight leading-none">{analytics?.totalLenders}</span>
                  <div className="flex items-center gap-1 mt-1 justify-end">
                    <TrendingUp className="text-emerald-500" size={10} />
                    <p className="text-[10px] text-emerald-500 font-black uppercase tracking-tighter">+{analytics?.monthlyGrowth}%</p>
                  </div>
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Providers</p>
            </div>

            <div className="bg-white rounded-[32px] p-8 border border-gray-100 hover:border-emerald-100 transition-all group overflow-hidden relative">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShieldCheck className="text-emerald-600" size={24} />
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-gray-900 tracking-tight leading-none">{analytics?.activeLenders}</span>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter mt-1">
                    {((analytics?.activeLenders || 0) / (analytics?.totalLenders || 1) * 100).toFixed(1)}% Active
                  </p>
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Matrix</p>
            </div>

            <div className="bg-white rounded-[32px] p-8 border border-gray-100 hover:border-blue-100 transition-all group overflow-hidden relative">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Briefcase className="text-blue-600" size={24} />
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-gray-900 tracking-tight leading-none">{(analytics?.totalLoansIssued || 0).toLocaleString()}</span>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter mt-1">Total Issued</p>
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loan Volume</p>
            </div>

            <div className="bg-white rounded-[32px] p-8 border border-gray-100 hover:border-amber-100 transition-all group overflow-hidden relative">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <DollarSign className="text-amber-600" size={24} />
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-gray-900 tracking-tight leading-none">M {((analytics?.totalAmountDisbursed || 0) / 1000000).toFixed(1)}</span>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter mt-1">Disbursed Total</p>
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Flow</p>
            </div>
          </div>

          <div className="bg-[#fafafa] rounded-[32px] border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp size={14} className="text-indigo-600" /> Matrix Performance Insights
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-2xl border border-gray-50 flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <Percent size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Approval Rate</p>
                  <p className="text-xl font-black text-gray-900 tracking-tight">{analytics?.avgApprovalRate.toFixed(1)}%</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-50 flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Processing Time</p>
                  <p className="text-xl font-black text-gray-900 tracking-tight">{analytics?.avgProcessingTime.toFixed(1)} Days</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-50 flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Velocity</p>
                  <p className="text-xl font-black text-gray-900 tracking-tight">+{analytics?.monthlyGrowth.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search providers..."
              className="pl-12 pr-4 py-3 w-full rounded-2xl border border-gray-100 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 text-sm bg-[#fafafa] outline-none transition-all placeholder:text-slate-400 font-medium"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-4 py-3 w-full rounded-2xl border border-gray-100 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 text-sm bg-[#fafafa] outline-none transition-all appearance-none font-medium text-slate-600 cursor-pointer"
            >
              <option value="all">All Operational Status</option>
              <option value="active">Active Matrix</option>
              <option value="pending">Pending Validation</option>
              <option value="inactive">System Offline</option>
            </select>
          </div>

          <div className="relative">
            <select
              value={riskFilter}
              onChange={e => setRiskFilter(e.target.value as any)}
              className="px-4 py-3 w-full rounded-2xl border border-gray-100 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 text-sm bg-[#fafafa] outline-none transition-all appearance-none font-medium text-slate-600 cursor-pointer"
            >
              <option value="all">Security Risk Tiers</option>
              <option value="low">Validated (Low Risk)</option>
              <option value="medium">Caution (Medium Risk)</option>
              <option value="high">Critical (High Risk)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-enter" onClick={e => e.stopPropagation()}>
            <div className="bg-[#fafafa]/50 px-8 py-6 flex items-center justify-between border-b border-gray-50">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Administrative Registry</h3>
                <p className="text-xl font-black text-gray-900 tracking-tight uppercase">Register New Provider</p>
              </div>
              <button
                className="w-10 h-10 bg-white hover:bg-gray-50 rounded-xl flex items-center justify-center text-slate-400 transition-colors shadow-sm"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lender Designation</label>
                  <div className="relative group">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 text-sm bg-[#fafafa] outline-none transition-all font-medium"
                      placeholder="e.g. Acme Credit Corp"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Communication Endpoint (Email)</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 text-sm bg-[#fafafa] outline-none transition-all font-medium"
                      placeholder="contact@lender.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Line (Phone)</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 text-sm bg-[#fafafa] outline-none transition-all font-medium"
                      placeholder="+250 7..."
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3 animate-shake">
                  <AlertTriangle className="text-rose-500 shrink-0" size={18} />
                  <p className="text-xs font-black text-rose-600 uppercase tracking-tight">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-black transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-3 disabled:bg-slate-200 disabled:shadow-none"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={18} /> Complete Registration
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Lenders Table */}
      {fetching ? (
        <div className="bg-white rounded-[32px] border border-gray-100 p-12 overflow-hidden shadow-sm">
          <div className="space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-[#fafafa] rounded-2xl border border-gray-50" />
            ))}
          </div>
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-white rounded-[32px] border border-gray-100 p-20 text-center shadow-sm">
          <div className="w-20 h-20 bg-[#fafafa] rounded-3xl flex items-center justify-center mx-auto mb-6 group hover:scale-110 transition-transform">
            <Building2 className="text-slate-300 group-hover:text-indigo-400 transition-colors" size={40} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Registry Search Results</p>
          <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase mb-4">No Providers Identified</h3>
          <p className="max-w-xs mx-auto text-sm text-slate-500 mb-8 font-medium">
            {search || statusFilter !== 'all' || riskFilter !== 'all'
              ? 'Refine your parameters to identify the required provider matrix.'
              : 'Begin by initializing the first lending partner profile.'
            }
          </p>
          {!search && statusFilter === 'all' && riskFilter === 'all' && (
            <button
              onClick={() => setShowModal(true)}
              className="px-8 py-3 bg-gray-900 text-white rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-3 mx-auto"
            >
              <Plus size={18} />
              <span className="text-[11px] font-black uppercase tracking-widest">Register Provider</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#fafafa]/50 border-b border-gray-50">
                  <th onClick={() => toggleSort('name')} className="px-8 py-6 text-left cursor-pointer group">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-gray-900 transition-colors">Provider Matrix</span>
                      {sortBy === 'name' && <TrendingUp size={12} className={`text-indigo-600 ${sortDir === 'asc' ? '' : 'rotate-180'} transition-transform`} />}
                    </div>
                  </th>
                  <th className="px-8 py-6 text-left">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Communication Endpoint</span>
                  </th>
                  <th onClick={() => toggleSort('totalLoans')} className="px-8 py-6 text-left cursor-pointer group">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-gray-900 transition-colors">Asset Flow Metrics</span>
                      {sortBy === 'totalLoans' && <TrendingUp size={12} className={`text-indigo-600 ${sortDir === 'asc' ? '' : 'rotate-180'} transition-transform`} />}
                    </div>
                  </th>
                  <th onClick={() => toggleSort('approvalRate')} className="px-8 py-6 text-left cursor-pointer group">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-gray-900 transition-colors">Efficiency Core</span>
                      {sortBy === 'approvalRate' && <TrendingUp size={12} className={`text-indigo-600 ${sortDir === 'asc' ? '' : 'rotate-180'} transition-transform`} />}
                    </div>
                  </th>
                  <th className="px-8 py-6 text-left">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol ID</span>
                  </th>
                  <th className="px-8 py-6 text-left">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vulnerability Tier</span>
                  </th>
                  <th className="px-8 py-6 text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operations</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map((l) => {
                  const masked = l.api_key.length > 8 ? l.api_key.slice(0, 4) + '••••' + l.api_key.slice(-4) : l.api_key;
                  return (
                    <tr key={l.id} className="hover:bg-[#fafafa]/50 transition-colors group">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xs font-black shadow-lg shadow-gray-200 transition-transform group-hover:scale-110 ${l.status === 'active' ? 'bg-gray-900' :
                            l.status === 'pending' ? 'bg-slate-400' : 'bg-slate-300'
                            }`}>
                            {l.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900 tracking-tight uppercase mb-1">{l.name}</p>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${l.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                l.status === 'pending' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                  'bg-slate-50 text-slate-500 border-slate-100'
                                }`}>
                                <div className={`w-1 h-1 rounded-full ${l.status === 'active' ? 'bg-emerald-600 animate-pulse' : 'bg-current'}`}></div>
                                {l.status || 'Active Agent'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="space-y-1">
                          <p className="text-xs font-black text-gray-900 tracking-tight uppercase flex items-center gap-2">
                            <Mail className="text-slate-400" size={10} />
                            {l.email}
                          </p>
                          <p className="text-xs font-medium text-slate-500 flex items-center gap-2">
                            <Phone className="text-slate-400" size={10} />
                            {l.phone}
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="space-y-1">
                          <p className="text-sm font-black text-gray-900 tracking-tight">{(l.totalLoans || 0).toLocaleString()} <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black ml-1">Issued</span></p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RWF {((l.totalAmount || 0) / 1000000).toFixed(1)}M Flow</p>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden shadow-inner flex-shrink-0">
                            <div
                              className={`h-full transition-all duration-1000 ${(l.approvalRate || 0) >= 80 ? 'bg-indigo-600' :
                                (l.approvalRate || 0) >= 60 ? 'bg-blue-500' : 'bg-slate-400'
                                }`}
                              style={{ width: `${l.approvalRate || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-black text-gray-900 tracking-tight">{l.approvalRate?.toFixed(1) || 0}%</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="inline-flex items-center gap-3 font-mono text-[10px] bg-[#fafafa] rounded-xl px-4 py-2 border border-gray-100 group-hover:border-indigo-100 transition-colors">
                          <Key className="text-slate-400 group-hover:text-indigo-600 transition-colors" size={10} />
                          <span className="text-gray-900 font-bold tracking-wider">{masked}</span>
                          <button
                            onClick={() => handleCopy(l.id, l.api_key)}
                            className="text-slate-400 hover:text-indigo-600 transition-colors"
                          >
                            {copiedId === l.id ? <Check className="text-emerald-500 animate-enter" size={10} /> : <Copy size={10} />}
                          </button>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-gray-100 ${l.riskRating === 'low' ? 'bg-white text-emerald-600' :
                          l.riskRating === 'medium' ? 'bg-white text-amber-600' :
                            'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                          {l.riskRating === 'low' ? <CheckCircle2 size={10} /> :
                            l.riskRating === 'medium' ? <Clock size={10} /> :
                              <AlertTriangle size={10} />}
                          {l.riskRating || 'validated'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right relative">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(l)}
                            className="w-9 h-9 border border-gray-100 rounded-xl hover:bg-white hover:border-indigo-100 hover:text-indigo-600 transition-all flex items-center justify-center text-slate-400"
                            title="Analyze Profile"
                          >
                            <Eye size={16} />
                          </button>
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionRow(r => r === l.id ? null : l.id);
                              }}
                              className={`w-9 h-9 border rounded-xl transition-all flex items-center justify-center ${openActionRow === l.id ? 'bg-gray-900 border-gray-900 text-white' : 'border-gray-100 hover:bg-white hover:border-gray-200 text-slate-400'
                                }`}
                            >
                              <MoreHorizontal size={16} />
                            </button>
                            {openActionRow === l.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-[24px] shadow-2xl border border-gray-100 z-20 py-3 overflow-hidden animate-enter">
                                <div className="px-4 py-2 mb-1 border-b border-gray-50">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol Sync</p>
                                </div>
                                <button
                                  onClick={() => { handleViewDetails(l); setOpenActionRow(null); }}
                                  className="w-full text-left px-4 py-2.5 hover:bg-[#fafafa] text-gray-900 flex items-center gap-3 group/item"
                                >
                                  <Eye className="text-slate-400 group-hover/item:text-indigo-600 transition-colors" size={14} />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Analyze Agent</span>
                                </button>
                                <button
                                  className="w-full text-left px-4 py-2.5 hover:bg-[#fafafa] text-gray-900 flex items-center gap-3 group/item"
                                >
                                  <Key className="text-slate-400 group-hover/item:text-indigo-600 transition-colors" size={14} />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Rotate Cipher</span>
                                </button>
                                <div className="border-t border-gray-50 my-2"></div>
                                <button
                                  onClick={() => { handleDelete(l.id); setOpenActionRow(null); }}
                                  className="w-full text-left px-4 py-2.5 hover:bg-rose-50 text-rose-600 flex items-center gap-3 group/item"
                                >
                                  <Trash2 className="text-rose-400 group-hover/item:text-rose-600 transition-colors" size={14} />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Purge Profile</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="bg-[#fafafa]/50 px-8 py-4 border-t border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Agents: {sorted.length}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Cache: M {((sorted.reduce((acc, l) => acc + (l.totalAmount || 0), 0) / 1000000)).toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">System Status: Optimal</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* Lender Details Modal */}
      {showDetailsModal && selectedLender && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDetailsModal(false)}>
          <div className="bg-white rounded-[32px] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-enter" onClick={e => e.stopPropagation()}>
            <div className="bg-[#fafafa]/50 px-8 py-6 flex items-center justify-between border-b border-gray-50 sticky top-0 bg-white/80 backdrop-blur-md z-10">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Entity Intelligence</h3>
                <p className="text-xl font-black text-gray-900 tracking-tight uppercase">Provider Analysis Profile</p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-10 h-10 bg-white hover:bg-gray-50 rounded-xl flex items-center justify-center text-slate-400 transition-colors shadow-sm"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-8 space-y-10 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#fafafa] rounded-[24px] p-6 border border-gray-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Lender Matrix</p>
                  <p className="text-sm font-black text-gray-900 tracking-tight uppercase">{selectedLender.name}</p>
                </div>
                <div className="bg-[#fafafa] rounded-[24px] p-6 border border-gray-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Operational Status</p>
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(selectedLender.status)}`}>
                    <div className={`w-1 h-1 rounded-full ${selectedLender.status === 'active' ? 'bg-emerald-600 animate-pulse' : 'bg-current'}`}></div>
                    {selectedLender.status || 'Active'}
                  </span>
                </div>
                <div className="bg-[#fafafa] rounded-[24px] p-6 border border-gray-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Communication Hub</p>
                  <p className="text-xs font-black text-gray-900 tracking-tight flex items-center gap-2 truncate">
                    <Mail size={12} className="text-slate-400" />
                    {selectedLender.email}
                  </p>
                </div>
                <div className="bg-[#fafafa] rounded-[24px] p-6 border border-gray-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Secure Line</p>
                  <p className="text-xs font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <Phone size={12} className="text-slate-400" />
                    {selectedLender.phone}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Key size={14} className="text-indigo-600" /> Protocol Integration Cache
                </h4>
                <div className="bg-indigo-50/50 rounded-[24px] p-8 border border-indigo-100 relative overflow-hidden group">
                  <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000">
                    <Key size={120} className="text-indigo-900" />
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <p className="text-[10px] font-black text-indigo-900/40 uppercase tracking-widest mb-1.5">Master System Cipher</p>
                      <code className="text-sm font-mono text-indigo-600 font-bold block bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-indigo-100/50">{selectedLender.api_key}</code>
                    </div>
                    <button
                      onClick={() => handleCopy(selectedLender.id, selectedLender.api_key)}
                      className="h-12 px-6 bg-white hover:bg-indigo-600 hover:text-white rounded-xl text-indigo-600 border border-indigo-100 transition-all font-black uppercase tracking-widest text-[10px] flex items-center gap-3 shadow-sm flex-shrink-0"
                    >
                      {copiedId === selectedLender.id ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                      {copiedId === selectedLender.id ? 'Cipher Decopied' : 'Replicate Cipher'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={14} className="text-emerald-600" /> Matrix Performance Analytics
                  </h4>
                  <div className="bg-[#fafafa] rounded-[24px] p-8 border border-gray-100 space-y-8">
                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency Rating</p>
                        <p className="text-xl font-black text-gray-900 tracking-tight">{selectedLender.approvalRate?.toFixed(1)}%</p>
                      </div>
                      <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all duration-1000 shadow-lg shadow-indigo-500/50"
                          style={{ width: `${selectedLender.approvalRate}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Issuance</p>
                        <p className="text-lg font-black text-gray-900 tracking-tight">{selectedLender.totalLoans}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk Index</p>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${getRiskColor(selectedLender.riskRating)}`}>
                          {selectedLender.riskRating || 'low'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={14} className="text-amber-600" /> System Configuration
                  </h4>
                  <div className="bg-[#fafafa] rounded-[24px] p-8 border border-gray-100 space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue Core</p>
                      <p className="text-sm font-black text-gray-900 tracking-tight">{selectedLender.interestRate}%</p>
                    </div>
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ceiling Matrix</p>
                      <p className="text-sm font-black text-gray-900 tracking-tight">RWF {((selectedLender.maxLoanAmount || 0) / 1000000).toFixed(1)}M</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry Timestamp</p>
                      <p className="text-sm font-black text-gray-900 tracking-tight">
                        {selectedLender.createdAt ? new Date(selectedLender.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#fafafa] px-8 py-6 border-t border-gray-100 flex items-center justify-between sticky bottom-0 z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-500" /> End-to-End Encryption Enabled
              </p>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-lg shadow-gray-200"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default AdminLenderRegistrationPage;
