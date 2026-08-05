import React, { useState, useMemo } from 'react';
import { lendingApi } from '../services/lending/lendingApi';
import toast from 'react-hot-toast';
import AdminPageLayout from '../components/Admin/AdminPageLayout';
import { useCurrencyFormat } from '../hooks/useCurrencyFormat';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../components/EnliteUI/Tables';
import {
  Trash2,
  Plus,
  Key,
  Mail,
  Phone,
  Building2,
  Copy,
  Check,
  Search,
  TrendingUp,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Percent,
  X,
  ShieldCheck
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

const AdminLenderRegistrationPage: React.FC = () => {
  const { compact: fmtMoney } = useCurrencyFormat();
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
        
        // Compute analytics from real data
        const activeLenders = transformedLenders.filter(l => l.status === 'active').length;
        const totalLoans = transformedLenders.reduce((sum, l) => sum + (l.totalLoans || 0), 0);
        const totalAmount = transformedLenders.reduce((sum, l) => sum + (l.totalAmount || 0), 0);
        const avgApproval = transformedLenders.length > 0 
          ? transformedLenders.reduce((sum, l) => sum + (l.approvalRate || 0), 0) / transformedLenders.length 
          : 0;
        const avgProcessing = transformedLenders.length > 0
          ? transformedLenders.reduce((sum, l) => sum + (l.avgProcessingTime || 0), 0) / transformedLenders.length
          : 0;

        setAnalytics({
          totalLenders: transformedLenders.length,
          activeLenders,
          totalLoansIssued: totalLoans,
          totalAmountDisbursed: totalAmount,
          avgApprovalRate: avgApproval,
          avgProcessingTime: avgProcessing,
          monthlyGrowth: 12.8, // TODO: compute from historical data
          topPerformers: []
        });

      } catch (err) {
        console.error('Error fetching lenders from API:', err);
        toast.error('Failed to load lenders');
        setLenders([]);
        setAnalytics(null);
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
        callback_url: undefined,
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
    if (!confirm('Are you sure you want to remove this lender? This action cannot be undone.')) {
      return;
    }
    
    try {
      await lendingApi.updateLenderStatus(id, 'suspended');
      setLenders(prev => prev.filter(l => l.id !== id));
      toast.success('Lender suspended successfully');
    } catch (err: any) {
      console.error('Error suspending lender:', err);
      toast.error(err.response?.data?.message || 'Failed to suspend lender');
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    try {
      await lendingApi.updateLenderStatus(id, newStatus as 'active' | 'paused' | 'suspended');
      setLenders(prev => prev.map(l => l.id === id ? { ...l, status: newStatus as any } : l));
      toast.success(`Lender ${newStatus === 'active' ? 'activated' : 'paused'} successfully`);
    } catch (err: any) {
      console.error('Error updating lender status:', err);
      toast.error(err.response?.data?.message || 'Failed to update status');
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

  const lenderColumns: Column<Lender>[] = useMemo(() => [
    {
      key: 'name',
      label: 'Provider Matrix',
      sortable: true,
      render: (_v, l) => (
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xs font-black ${l.status === 'active' ? 'bg-gray-900' : l.status === 'pending' ? 'bg-slate-400' : 'bg-slate-300'}`}>
            {l.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-black text-gray-900 dark:text-white tracking-tight uppercase mb-1">{l.name}</p>
            <StatusBadge status={l.status || 'active'} label={l.status || 'Active Agent'} />
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Communication',
      render: (_v, l) => (
        <div className="space-y-1">
          <p className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-2"><Mail className="text-slate-400" size={10} />{l.email}</p>
          <p className="text-xs font-medium text-slate-500 flex items-center gap-2"><Phone className="text-slate-400" size={10} />{l.phone}</p>
        </div>
      ),
    },
    {
      key: 'totalLoans',
      label: 'Asset Flow',
      sortable: true,
      render: (_v, l) => (
        <div>
          <p className="text-sm font-black text-gray-900 dark:text-white">{(l.totalLoans || 0).toLocaleString()} Issued</p>
          <p className="text-[10px] font-black text-slate-400 uppercase">{fmtMoney(l.totalAmount || 0)} Flow</p>
        </div>
      ),
    },
    {
      key: 'approvalRate',
      label: 'Efficiency',
      sortable: true,
      render: (_v, l) => (
        <span className="text-xs font-black text-gray-900 dark:text-white">{l.approvalRate?.toFixed(1) || 0}%</span>
      ),
    },
    {
      key: 'api_key',
      label: 'Protocol ID',
      render: (_v, l) => {
        const masked = l.api_key.length > 8 ? l.api_key.slice(0, 4) + '••••' + l.api_key.slice(-4) : l.api_key;
        return (
          <div className="inline-flex items-center gap-2 font-mono text-[10px] bg-[#fafafa] rounded-xl px-3 py-2 border border-gray-100 dark:border-slate-800">
            <Key size={10} className="text-slate-400" />
            <span className="font-bold">{masked}</span>
            <button onClick={() => handleCopy(l.id, l.api_key)} className="text-slate-400 hover:text-indigo-600">
              {copiedId === l.id ? <Check className="text-emerald-500" size={10} /> : <Copy size={10} />}
            </button>
          </div>
        );
      },
    },
    {
      key: 'riskRating',
      label: 'Risk',
      render: (_v, l) => (
        <StatusBadge
          status={l.riskRating === 'low' ? 'completed' : l.riskRating === 'medium' ? 'pending' : 'rejected'}
          label={l.riskRating || 'validated'}
        />
      ),
    },
  ], [fmtMoney, copiedId]);

  const lenderActions: TableAction<Lender>[] = useMemo(() => [
    { key: 'view', label: 'Analyze Agent', icon: <Eye size={14} />, onClick: (l) => handleViewDetails(l) },
    { key: 'toggle', label: 'Toggle Status', icon: <ShieldCheck size={14} />, onClick: (l) => handleStatusToggle(l.id, l.status || 'active') },
    { key: 'delete', label: 'Purge Profile', icon: <Trash2 size={14} />, variant: 'danger', onClick: (l) => handleDelete(l.id) },
  ], []);

  return (
    <AdminPageLayout
      title="Lender Management"
      description="Comprehensive overview and management of lending partners"
      actions={
        <div className="flex flex-wrap gap-3 md:gap-4">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl flex items-center gap-2 transition-all group overflow-hidden relative shadow-sm"
          >
            <div className="absolute inset-0 bg-gray-50/50 dark:bg-slate-950 translate-y-full group-hover:translate-y-0 transition-transform"></div>
            <TrendingUp size={14} className="relative z-10" />
            <span className="text-[10px] font-black uppercase tracking-widest relative z-10">
              {showAnalytics ? 'Hide' : 'Show'} Analytics
            </span>
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl flex items-center gap-2 transition-all group overflow-hidden relative shadow-sm"
          >
            <div className="absolute inset-0 bg-gray-50/50 dark:bg-slate-950 translate-y-full group-hover:translate-y-0 transition-transform"></div>
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

          <div className="bg-[#fafafa] rounded-[32px] border border-transparent p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp size={14} className="text-primary-600" /> Matrix Performance Insights
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-transparent flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300">
                  <Percent size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Approval Rate</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{analytics?.avgApprovalRate.toFixed(1)}%</p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-transparent flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Processing Time</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{analytics?.avgProcessingTime.toFixed(1)} Days</p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-transparent flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Velocity</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">+{analytics?.monthlyGrowth.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-transparent p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={16} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search providers..."
              className="pl-12 pr-4 py-3 w-full rounded-2xl border border-transparent focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/30 text-sm bg-[#fafafa] outline-none transition-all placeholder:text-slate-400 font-medium"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-4 py-3 w-full rounded-2xl border border-transparent focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/30 text-sm bg-[#fafafa] outline-none transition-all appearance-none font-medium text-slate-600 dark:text-slate-300 cursor-pointer"
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
              className="px-4 py-3 w-full rounded-2xl border border-transparent focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/30 text-sm bg-[#fafafa] outline-none transition-all appearance-none font-medium text-slate-600 dark:text-slate-300 cursor-pointer"
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
          <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-lg overflow-hidden animate-enter border border-transparent" onClick={e => e.stopPropagation()}>
            <div className="bg-[#fafafa]/50 px-8 py-6 flex items-center justify-between border-b border-gray-50">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Administrative Registry</h3>
                <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Register New Provider</p>
              </div>
              <button
                className="w-10 h-10 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 transition-colors"
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
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={16} />
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-transparent focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/30 text-sm bg-[#fafafa] outline-none transition-all font-medium"
                      placeholder="e.g. Acme Credit Corp"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Communication Endpoint (Email)</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={16} />
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-transparent focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/30 text-sm bg-[#fafafa] outline-none transition-all font-medium"
                      placeholder="contact@lender.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Line (Phone)</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={16} />
                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-transparent focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/30 text-sm bg-[#fafafa] outline-none transition-all font-medium"
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
      <StandardDataTable
        title="Lender Registry"
        icon={<Building2 className="w-5 h-5" />}
        headerColor="primary"
        columns={lenderColumns}
        data={sorted}
        loading={fetching}
        getRowId={(row) => row.id}
        searchable={false}
        pagination
        pageSize={10}
        columnVisibility
        stickyHeader
        striped
        hoverable
        rowActions={lenderActions}
        emptyMessage={
          search || statusFilter !== 'all' || riskFilter !== 'all'
            ? 'No lenders match your current filters'
            : 'No lenders registered yet'
        }
        ariaLabel="Lender registry"
      />

      {/* Lender Details Modal */}
      {showDetailsModal && selectedLender && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDetailsModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-enter" onClick={e => e.stopPropagation()}>
            <div className="bg-[#fafafa]/50 px-8 py-6 flex items-center justify-between border-b border-gray-50 sticky top-0 bg-white/80 backdrop-blur-md z-10">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Entity Intelligence</h3>
                <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Provider Analysis Profile</p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-10 h-10 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 transition-colors shadow-sm"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-8 space-y-10 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#fafafa] rounded-[24px] p-6 border border-gray-100 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Lender Matrix</p>
                  <p className="text-sm font-black text-gray-900 dark:text-white tracking-tight uppercase">{selectedLender.name}</p>
                </div>
                <div className="bg-[#fafafa] rounded-[24px] p-6 border border-gray-100 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Operational Status</p>
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(selectedLender.status)}`}>
                    <div className={`w-1 h-1 rounded-full ${selectedLender.status === 'active' ? 'bg-emerald-600 animate-pulse' : 'bg-current'}`}></div>
                    {selectedLender.status || 'Active'}
                  </span>
                </div>
                <div className="bg-[#fafafa] rounded-[24px] p-6 border border-gray-100 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Communication Hub</p>
                  <p className="text-xs font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2 truncate">
                    <Mail size={12} className="text-slate-400" />
                    {selectedLender.email}
                  </p>
                </div>
                <div className="bg-[#fafafa] rounded-[24px] p-6 border border-gray-100 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Secure Line</p>
                  <p className="text-xs font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
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
                      className="h-12 px-6 bg-white dark:bg-slate-900 hover:bg-indigo-600 hover:text-white rounded-xl text-indigo-600 border border-indigo-100 transition-all font-black uppercase tracking-widest text-[10px] flex items-center gap-3 shadow-sm flex-shrink-0"
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
                  <div className="bg-[#fafafa] rounded-[24px] p-8 border border-gray-100 dark:border-slate-800 space-y-8">
                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency Rating</p>
                        <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{selectedLender.approvalRate?.toFixed(1)}%</p>
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
                        <p className="text-lg font-black text-gray-900 dark:text-white tracking-tight">{selectedLender.totalLoans}</p>
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
                  <div className="bg-[#fafafa] rounded-[24px] p-8 border border-gray-100 dark:border-slate-800 space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue Core</p>
                      <p className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{selectedLender.interestRate}%</p>
                    </div>
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ceiling Matrix</p>
                      <p className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{fmtMoney(selectedLender.maxLoanAmount || 0)}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry Timestamp</p>
                      <p className="text-sm font-black text-gray-900 dark:text-white tracking-tight">
                        {selectedLender.createdAt ? new Date(selectedLender.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#fafafa] px-8 py-6 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between sticky bottom-0 z-10">
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
