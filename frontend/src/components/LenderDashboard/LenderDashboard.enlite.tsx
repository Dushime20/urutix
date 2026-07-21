import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { lendingApi } from '../../services/lending/lendingApi';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import LoanApprovalModal from './LoanApprovalModal';
import {
  DollarSign, Briefcase, AlertTriangle, Activity,
  TrendingUp, Clock, X, Eye, Check,
  RefreshCw, ChevronRight, Banknote, BarChart3,
  ShieldCheck, Percent,
} from 'lucide-react';
import { StatCard as SharedStatCard } from '@/components/EnliteUI/Cards/StatCard';
import { TranslatedText } from '../translated-text';

// ── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    pending:   'bg-amber-50 text-amber-700 border-amber-200',
    approved:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected:  'bg-rose-50 text-rose-700 border-rose-200',
    disbursed: 'bg-blue-50 text-blue-700 border-blue-200',
    repaid:    'bg-emerald-50 text-emerald-700 border-emerald-100',
    defaulted: 'bg-rose-100 text-rose-700 border-rose-200',
    failed:    'bg-slate-100 text-slate-600 border-slate-200',
  };
  const cls = map[status?.toLowerCase()] ?? 'bg-slate-50 text-slate-600 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${cls}`}>
      {status}
    </span>
  );
};

// ── Stat card ── uses shared EnliteUI StatCard ────────────────────────────────
const StatCard: React.FC<{
  title: string; value: string | number; icon: React.ReactNode;
  sub?: string; color?: string; loading?: boolean;
}> = ({ title, value, icon, sub, loading }) => (
  <SharedStatCard
    title={title}
    value={value}
    icon={icon}
    subtitle={sub}
    loading={loading}
    variant="classic"
  />
);

// ── Main component ────────────────────────────────────────────────────────────
const LenderDashboardEnlite: React.FC = () => {
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();
  const { format: formatCurrency } = useCurrencyFormat();

  const [dashboardData, setDashboardData]   = useState<any>(null);
  const [analyticsData, setAnalyticsData]   = useState<any>(null);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [approvalLoan, setApprovalLoan]     = useState<any>(null);
  const [rejectingId, setRejectingId]       = useState<string | null>(null);

  const lenderId = user?.role === 'LENDER' ? user.id : null;

  const load = useCallback(async () => {
    if (!lenderId || !accessToken) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [dash, analytics, requests] = await Promise.all([
        lendingApi.getLenderDashboard(lenderId).catch(() => null),
        lendingApi.getLenderAnalytics(lenderId, 1).catch(() => null),
        lendingApi.getLenderLoanRequests(lenderId, undefined, 1, 10).catch(() => null),
      ]);

      setDashboardData(dash);
      setAnalyticsData(analytics);

      // Normalise requests — API returns { data: [...] } or array
      const raw = Array.isArray(requests) ? requests : (requests?.data || []);
      setRecentRequests(raw);
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [lenderId, accessToken]);

  useEffect(() => { load(); }, [load]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleApprove = (req: any) => {
    setApprovalLoan(req);
  };

  const handleReject = async (loanId: string) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    setRejectingId(loanId);
    try {
      await lendingApi.rejectLoanRequest(loanId, reason);
      setRecentRequests(prev => prev.map(r => r.id === loanId ? { ...r, status: 'rejected' } : r));
    } catch (err: any) {
      alert('Failed to reject: ' + (err?.response?.data?.message || err?.message));
    } finally { setRejectingId(null); }
  };

  // ── Derived stats ────────────────────────────────────────────────────────────
  const totalIssued      = dashboardData?.totalLoansIssued ?? 0;
  const outstanding      = dashboardData?.totalOutstandingPrincipal ?? 0;
  const recoveryRate     = dashboardData?.recoveryRate ?? 0;
  const defaultRate      = dashboardData?.defaultRate ?? 0;
  const roi              = dashboardData?.roi ?? 0;
  const interestCollected = dashboardData?.totalInterestCollected ?? 0;

  const totalRequests    = analyticsData?.totalLoans ?? recentRequests.length;
  const pendingCount     = recentRequests.filter(r => r.status === 'pending').length;
  const approvedCount    = recentRequests.filter(r => r.status === 'approved').length;

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
  };

  const displayName = user?.firstName || user?.email?.split('@')[0] || 'Lender';

  if (!user) return null;

  return (
    <>
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black text-[#345E85] uppercase tracking-[0.2em] mb-1">
            <TranslatedText text="Lending Dashboard" />
          </p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            <TranslatedText text={greeting()} />, {displayName}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {totalIssued} <TranslatedText text="loans issued" /> · {pendingCount} <TranslatedText text="pending approval" />
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            className="h-11 w-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
            <button
            onClick={() => navigate('/lender/requests')}
            className="flex items-center gap-2 px-6 py-3 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-blue-100"
          >
            <Briefcase size={14} /> <TranslatedText text="View All Requests" />
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 px-6 py-4 rounded-3xl flex items-center gap-3">
          <AlertTriangle size={16} />
          <span className="text-sm font-semibold">{error}</span>
          <button onClick={load} className="ml-auto text-xs underline"><TranslatedText text="Retry" /></button>
        </div>
      )}

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Loans Issued"
          value={totalIssued}
          icon={<Briefcase size={18} className="text-[#345E85]" />}
          color="bg-blue-50"
          loading={loading}
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(outstanding)}
          icon={<Banknote size={18} className="text-emerald-600" />}
          color="bg-emerald-50"
          sub="Total disbursed capital"
          loading={loading}
        />
        <StatCard
          title="Pending"
          value={pendingCount}
          icon={<Clock size={18} className="text-amber-600" />}
          color="bg-amber-50"
          sub="Awaiting your approval"
          loading={loading}
        />
        <StatCard
          title="Recovery Rate"
          value={`${recoveryRate.toFixed(1)}%`}
          icon={<ShieldCheck size={18} className="text-blue-600" />}
          color="bg-blue-50"
          loading={loading}
        />
        <StatCard
          title="Default Rate"
          value={`${defaultRate.toFixed(1)}%`}
          icon={<AlertTriangle size={18} className="text-rose-500" />}
          color="bg-rose-50"
          loading={loading}
        />
        <StatCard
          title="ROI"
          value={`${roi.toFixed(1)}%`}
          icon={<Percent size={18} className="text-purple-600" />}
          color="bg-purple-50"
          sub={formatCurrency(interestCollected) + " interest"}
          loading={loading}
        />

      </div>

      {/* ── Analytics summary bar ── */}
      {analyticsData && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-8 w-8 rounded-xl bg-[#345E85]/10 flex items-center justify-center">
              <BarChart3 size={14} className="text-[#345E85]" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 uppercase tracking-tight"><TranslatedText text="30-Day Analytics" /></p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest"><TranslatedText text="Performance overview" /></p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Total Requests', value: analyticsData.totalLoans ?? 0 },
              { label: 'Total Amount', value: formatCurrency(analyticsData.totalAmount ?? 0) },
              { label: 'Success Rate', value: `${(analyticsData.successRate ?? 0).toFixed(1)}%` },
              { label: 'Avg Loan Size', value: formatCurrency(analyticsData.averageLoanSize ?? 0) },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-black text-slate-900">{value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1"><TranslatedText text={label} /></p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent loan requests table ── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-[#345E85]/10 flex items-center justify-center">
              <Activity size={14} className="text-[#345E85]" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 uppercase tracking-tight"><TranslatedText text="Recent Loan Requests" /></p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                {recentRequests.length} <TranslatedText text="records" /> · {pendingCount} <TranslatedText text="pending" />
              </p>
            </div>
          </div>
            <button
            onClick={() => navigate('/lender/requests')}
            className="flex items-center gap-1 text-[10px] font-black text-[#345E85] uppercase tracking-widest hover:opacity-70 transition-opacity"
          >
            <TranslatedText text="View All" /> <ChevronRight size={12} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-10 w-10 rounded-full border-4 border-slate-100 border-t-[#345E85] animate-spin" />
          </div>
        ) : recentRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Briefcase size={22} className="text-slate-400" />
            </div>
            <p className="text-slate-900 font-black text-base mb-1"><TranslatedText text="No loan requests yet" /></p>
            <p className="text-slate-400 text-sm"><TranslatedText text="Requests from truck owners will appear here" /></p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50">
                  {['Loan ID', 'Borrower', 'Amount', 'Purpose', 'Fund Split', 'Status', 'Due Date', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap"><TranslatedText text={h} /></th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentRequests.map(req => {
                  const amount = Number(req.requested_amount || req.requestedAmount) || 0;
                  const approvedAmt = req.approved_amount != null ? Number(req.approved_amount) : null;
                  const borrowerName = req.borrower?.contact_name || req.borrower?.company_name || req.created_by?.slice(0, 8) || '—';
                  const purpose = req.metadata?.purpose || req.metadata?.note || '—';
                  const split: Array<{ type: string; amount: number }> = req.requested_split || [];

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Loan ID */}
                      <td className="px-6 py-4">
                        <p className="text-xs font-black text-slate-900 font-mono">{req.id.slice(0, 8)}…</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{new Date(req.created_at).toLocaleDateString()}</p>
                      </td>

                      {/* Borrower */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-[#345E85]/10 flex items-center justify-center text-[#345E85] font-black text-xs flex-shrink-0">
                            {borrowerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{borrowerName}</p>
                            <p className="text-[10px] text-slate-400">{req.borrower?.email || ''}</p>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-slate-900">{formatCurrency(amount)}</p>
                        {approvedAmt != null && (
                          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">✓ {formatCurrency(approvedAmt)}</p>
                        )}
                      </td>

                      {/* Purpose */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-700 capitalize">{purpose}</p>
                      </td>

                      {/* Fund Split */}
                      <td className="px-6 py-4">
                        {split.length > 0 ? (
                          <div className="space-y-1">
                            {split.map((s, i) => (
                              <div key={i} className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">{s.type}</span>
                                <span className="text-xs font-bold text-slate-700">{formatCurrency(s.amount)}</span>
                              </div>
                            ))}
                          </div>
                        ) : <span className="text-[10px] text-slate-300">—</span>}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <StatusBadge status={req.status} />
                      </td>

                      {/* Due Date */}
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600 font-medium whitespace-nowrap">
                          {req.due_date ? new Date(req.due_date).toLocaleDateString() : '—'}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => navigate('/lender/requests')}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                            title="View details"
                          >
                            <Eye size={14} />
                          </button>
                          {req.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(req)}
                                className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                                title="Approve"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => handleReject(req.id)}
                                disabled={rejectingId === req.id}
                                className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors disabled:opacity-50"
                                title="Reject"
                              >
                                {rejectingId === req.id
                                  ? <RefreshCw size={14} className="animate-spin" />
                                  : <X size={14} />
                                }
                              </button>
                            </>
                          )}
                          {req.status === 'approved' && (
                            <button
                              onClick={() => navigate('/lender/disbursements')}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                              title="Disburse"
                            >
                              <DollarSign size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Quick links ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'All Requests',   path: '/lender/requests',      icon: <Briefcase size={18} />,    color: 'bg-blue-50 text-[#345E85]' },
          { label: 'Active Loans',   path: '/lender/active',        icon: <Activity size={18} />,     color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Disbursements',  path: '/lender/disbursements', icon: <DollarSign size={18} />,   color: 'bg-purple-50 text-purple-600' },
          { label: 'Analytics',      path: '/lender/analytics',     icon: <TrendingUp size={18} />,   color: 'bg-amber-50 text-amber-600' },
        ].map(({ label, path, icon, color }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="bg-white rounded-3xl border border-slate-100 p-5 flex items-center gap-4 hover:shadow-md transition-all text-left group"
          >
            <div className={`h-10 w-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
              {icon}
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 group-hover:text-[#345E85] transition-colors"><TranslatedText text={label} /></p>
              <ChevronRight size={12} className="text-slate-300 mt-0.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        ))}
      </div>

    </div>

      {approvalLoan && (
        <LoanApprovalModal
          loan={approvalLoan}
          onClose={() => setApprovalLoan(null)}
          onConfirm={async () => { /* handled internally by modal */ }}
          onSuccess={(loanId) => {
            setApprovalLoan(null);
            setRecentRequests(prev => prev.map(r =>
              r.id === loanId ? { ...r, status: 'approved' } : r
            ));
          }}
        />
      )}
    </>
  );
};

export default LenderDashboardEnlite;

