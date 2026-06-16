import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { loanRequestService } from '../services/loanRequestService';
import type { LoanRequest } from '../types/loanRequest';
import { DollarSign, FileText, Clock, TrendingUp, Calendar, ChevronRight, Plus, Download, RefreshCw, Calculator, Percent, ShieldCheck } from 'lucide-react';
import DashboardHeader from '../components/Dashboard/Layout/DashboardHeader';
import { useNavigate } from 'react-router-dom';
import { useCurrencyFormat } from '../hooks/useCurrencyFormat';

const CargoFinancingPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { compact: fmtMoney } = useCurrencyFormat();
    const [loans, setLoans] = useState<LoanRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'active' | 'pending' | 'completed'>('all');

    // Calculator State
    const [calcAmount, setCalcAmount] = useState(10000);
    const [calcMonths, setCalcMonths] = useState(3);
    const [showCalculator, setShowCalculator] = useState(true);

    const fetchLoans = async () => {
        if (!user?.tenantId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            // Assuming we use tenant ID to fetch loans for this cargo owner
            const data = await loanRequestService.getTenantLoans(user.tenantId);
            setLoans(data);
            setError(null);
        } catch (err: any) {
            console.error('Failed to fetch loans:', err);
            setError('Failed to load financing history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLoans();
    }, [user?.tenantId]);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
            case 'repaid': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'disbursed': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const stats = {
        totalBorrowed: loans.reduce((acc, loan) => loan.status === 'approved' || loan.status === 'repaid' || loan.status === 'disbursed' ? acc + (loan.approved_amount || 0) : acc, 0),
        activeLoans: loans.filter(l => l.status === 'approved' || l.status === 'disbursed').length,
        pendingRequests: loans.filter(l => l.status === 'pending').length,
    };

    const filteredLoans = loans.filter(loan => {
        if (activeTab === 'all') return true;
        if (activeTab === 'active') return ['approved', 'disbursed'].includes(loan.status.toLowerCase());
        if (activeTab === 'pending') return loan.status.toLowerCase() === 'pending';
        if (activeTab === 'completed') return ['repaid', 'rejected'].includes(loan.status.toLowerCase());
        return true;
    });

    // Calculator Logic
    const monthlyRate = 0.02; // 2% basic rate
    const monthlyPayment = (calcAmount * (1 + monthlyRate * calcMonths)) / calcMonths;
    const totalRepayment = monthlyPayment * calcMonths;

    return (
        <div className="min-h-screen bg-gray-50/50">
            <DashboardHeader />

            <main className="max-w-[1536px] mx-auto px-4 md:px-8 lg:px-12 xl:px-20 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <span className="hover:text-gray-900 cursor-pointer" onClick={() => navigate('/dashboard')}>Dashboard</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-gray-900 font-medium">Financing</span>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Cargo Financing</h1>
                        <p className="text-gray-500 mt-1">Manage your cargo loans and financing requests</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                        <button
                            onClick={() => setShowCalculator(!showCalculator)}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 ${showCalculator ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-inner' : 'bg-white text-gray-700 border-gray-200 shadow-sm'} border rounded-lg hover:bg-gray-50 transition-all font-medium text-sm whitespace-nowrap`}
                        >
                            <Calculator className="w-4 h-4" />
                            <span className="hidden xs:inline">{showCalculator ? 'Hide Calculator' : 'Loan Calculator'}</span>
                            <span className="xs:hidden">Calc</span>
                        </button>
                        <button
                            onClick={() => fetchLoans()}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                            title="Refresh data"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm shadow-sm hidden md:flex">
                            <Download className="w-4 h-4" />
                            Export Report
                        </button>
                        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#358c9c] text-white rounded-lg hover:bg-[#2c7380] transition-colors font-medium text-sm shadow-sm shadow-cyan-600/20 whitespace-nowrap min-w-[140px]">
                            <Plus className="w-4 h-4" />
                            Request Financing
                        </button>
                    </div>
                </div>

                {/* Calculator Section (Collapsible) */}
                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showCalculator ? 'max-h-[600px] opacity-100 mb-8' : 'max-h-0 opacity-0'}`}>
                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-indigo-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
                            <div>
                                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                                    <Calculator className="w-6 h-6 text-indigo-200" /> Estimate Repayment
                                </h3>
                                <p className="text-indigo-100/80 text-sm mb-8 font-medium">Use our smart calculator to plan your financing. See exactly what you'll pay based on amount and duration.</p>

                                <div className="space-y-8">
                                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                                        <div className="flex justify-between text-sm mb-3">
                                            <span className="font-medium text-indigo-100">Loan Amount</span>
                                            <span className="font-bold text-xl">{fmtMoney(calcAmount)}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1000"
                                            max="50000"
                                            step="500"
                                            value={calcAmount}
                                            onChange={(e) => setCalcAmount(Number(e.target.value))}
                                            className="w-full h-2 bg-indigo-900/30 rounded-lg appearance-none cursor-pointer accent-white"
                                        />
                                        <div className="flex justify-between text-xs text-indigo-200/70 mt-2 font-medium">
                                            <span>$1,000</span>
                                            <span>$50,000</span>
                                        </div>
                                    </div>

                                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                                        <div className="flex justify-between text-sm mb-3">
                                            <span className="font-medium text-indigo-100">Duration</span>
                                            <span className="font-bold text-xl">{calcMonths} Months</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="12"
                                            step="1"
                                            value={calcMonths}
                                            onChange={(e) => setCalcMonths(Number(e.target.value))}
                                            className="w-full h-2 bg-indigo-900/30 rounded-lg appearance-none cursor-pointer accent-white"
                                        />
                                        <div className="flex justify-between text-xs text-indigo-200/70 mt-2 font-medium">
                                            <span>1 Month</span>
                                            <span>12 Months</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-6 md:p-8 text-gray-800 shadow-lg">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-indigo-50 rounded-lg">
                                                <Percent className="w-4 h-4 text-indigo-600" />
                                            </div>
                                            <span className="text-sm font-medium text-gray-500">Interest Rate</span>
                                        </div>
                                        <span className="font-bold text-lg text-gray-900">2.0% <span className="text-sm text-gray-400 font-normal">/ mo</span></span>
                                    </div>

                                    <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-500">Total Interest</span>
                                        <span className="font-bold text-lg text-gray-900">{fmtMoney(totalRepayment - calcAmount)}</span>
                                    </div>

                                    <div className="pt-2">
                                        <span className="text-sm font-medium text-gray-500 block mb-1">Estimated Monthly Payment</span>
                                        <span className="text-4xl font-black text-indigo-600 tracking-tight">{fmtMoney(monthlyPayment)}</span>
                                    </div>

                                    <button className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 mt-2 flex items-center justify-center gap-2">
                                        Apply for {fmtMoney(calcAmount)}
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Credit Health Banner */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                    <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50 -mr-16 -mt-16 pointer-events-none"></div>

                    <div className="flex items-center gap-6 z-10">
                        <div className="relative flex-shrink-0">
                            <svg className="w-20 h-20 transform -rotate-90">
                                <circle cx="40" cy="40" r="36" stroke="#f3f4f6" strokeWidth="6" fill="none" />
                                <circle cx="40" cy="40" r="36" stroke="#10b981" strokeWidth="6" fill="none" strokeDasharray="226" strokeDashoffset="56" className="transition-all duration-1000 ease-out" />
                            </svg>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                                <span className="text-xl font-bold text-gray-900 block">75%</span>
                                <span className="text-[10px] text-gray-400 font-medium uppercase">Score</span>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg text-gray-900">Strong Credit Profile</h3>
                                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            </div>
                            <p className="text-sm text-gray-500 max-w-lg mb-3">Your consistent repayment history makes you eligible for lower interest rates on your next request.</p>
                            <div className="flex flex-wrap gap-2 text-xs font-medium">
                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100">Low Risk Borrower</span>
                                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">Gold Tier</span>
                                <span className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-md border border-gray-100">98% On-time Repayment</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 z-10 w-full md:w-auto">
                        <button className="flex-1 md:flex-none px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all font-medium text-sm shadow-sm">
                            View Report
                        </button>
                        <button className="flex-1 md:flex-none px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-medium text-sm shadow-md">
                            Details
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Total Borrowed Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
                                <DollarSign className="w-6 h-6 text-emerald-600" />
                            </div>
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                                <TrendingUp className="w-3 h-3" /> +12.5%
                            </span>
                        </div>
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Borrowed</p>
                            <p className="text-3xl font-black text-gray-900 tracking-tight">${stats.totalBorrowed.toLocaleString()}</p>
                            <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[65%] rounded-full group-hover:w-[70%] transition-all duration-1000 ease-out"></div>
                            </div>
                            <p className="text-xs text-gray-400 mt-2 font-medium">65% of credit limit used</p>
                        </div>
                    </div>

                    {/* Active Loans Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <span className="flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                                Active
                            </span>
                        </div>
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Active Loans</p>
                            <p className="text-3xl font-black text-gray-900 tracking-tight">{stats.activeLoans}</p>
                            <div className="mt-4 flex items-center gap-1">
                                <div className="h-1.5 flex-1 bg-blue-500 rounded-full"></div>
                                <div className="h-1.5 flex-1 bg-blue-500 rounded-full"></div>
                                <div className="h-1.5 flex-1 bg-blue-100 rounded-full"></div>
                            </div>
                            <p className="text-xs text-gray-400 mt-2 font-medium">2 loans performing well</p>
                        </div>
                    </div>

                    {/* Pending Requests Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="p-3 bg-amber-50 rounded-xl group-hover:bg-amber-100 transition-colors">
                                <Clock className="w-6 h-6 text-amber-600" />
                            </div>
                            {stats.pendingRequests > 0 ? (
                                <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 animate-pulse">
                                    Action Needed
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                                    All Clear
                                </span>
                            )}
                        </div>
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Pending Requests</p>
                            <p className="text-3xl font-black text-gray-900 tracking-tight">{stats.pendingRequests}</p>
                            <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full bg-amber-500 rounded-full transition-all duration-1000 ease-out`} style={{ width: `${Math.min(stats.pendingRequests * 33, 100)}%` }}></div>
                            </div>
                            <p className="text-xs text-gray-400 mt-2 font-medium">Estimated approval: 24h</p>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h3 className="font-semibold text-gray-900">Loan Requests History</h3>

                        {/* Tabs */}
                        <div className="flex p-1 bg-gray-100/80 rounded-lg self-start sm:self-auto">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setActiveTab('active')}
                                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Active
                            </button>
                            <button
                                onClick={() => setActiveTab('pending')}
                                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'pending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Pending
                            </button>
                            <button
                                onClick={() => setActiveTab('completed')}
                                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'completed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Completed
                            </button>
                        </div>
                    </div>

                    {loading && loans.length === 0 ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 inline-block text-left max-w-lg">
                                <p className="font-medium">Error loading financing data</p>
                                <p className="text-sm mt-1">{error}</p>
                            </div>
                            <div className="mt-4">
                                <button onClick={() => fetchLoans()} className="text-sm text-emerald-600 hover:underline font-medium">
                                    Try Again
                                </button>
                            </div>
                        </div>
                    ) : filteredLoans.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No loans found</h3>
                            <p className="text-gray-500 max-w-sm mx-auto mb-6">There are no loan requests matching the selected filter.</p>
                            {activeTab === 'all' && (
                                <button className="px-4 py-2 bg-[#358c9c] text-white rounded-lg hover:bg-[#2c7380] transition-colors font-medium text-sm shadow-sm inline-flex items-center gap-2">
                                    <Plus className="w-4 h-4" />
                                    New Request
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredLoans.map((loan) => (
                                <div key={loan.id} className="p-6 hover:bg-gray-50/80 transition-colors group cursor-pointer">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(loan.status)}`}>
                                                    {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                                                </span>
                                                <span className="text-sm text-gray-500 flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(loan.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 group-hover:text-emerald-700 transition-colors">
                                                <h4 className="font-semibold text-gray-900">{loan.purpose || 'Cargo Financing'}</h4>
                                                {/* ID Chip */}
                                                <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 font-mono">
                                                    #{loan.id.substring(0, 8)}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-sm text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-400">Requested:</span>
                                                    <span className="font-medium text-gray-900">${loan.requested_amount.toLocaleString()}</span>
                                                </div>
                                                {loan.approved_amount && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-400">Approved:</span>
                                                        <span className="font-bold text-emerald-600">${loan.approved_amount.toLocaleString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 lg:gap-8 pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-0.5">Interest</p>
                                                <p className="font-semibold text-gray-900">{loan.interest_rate || '2'}% <span className="text-gray-400 text-xs font-normal">/mo</span></p>
                                            </div>
                                            <div className="text-right pl-4 lg:pl-8 border-l border-gray-200">
                                                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-0.5">Term</p>
                                                <p className="font-semibold text-gray-900">{loan.loan_term_months ? Math.round(loan.loan_term_months * 30) : 30} days</p>
                                            </div>
                                            <div className="pl-2">
                                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default CargoFinancingPage;
