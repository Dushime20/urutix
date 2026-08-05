import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { lendingApi, type LenderDashboardData } from '../../services/lending/lendingApi';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import LoanApprovalModal from './LoanApprovalModal';
import {
  DollarSign, Briefcase, AlertTriangle, Activity,
  TrendingUp, X, Eye, Check,
  RefreshCw, ChevronRight, Banknote, BarChart3,
  CheckCircle, Coins, CircleDollarSign,
} from 'lucide-react';
import { TranslatedText } from '../translated-text';
import { StandardDataTable, StatusBadge, type Column } from '../EnliteUI/Tables';

// ── Stat card ── sized for long currency strings (RWF / multi-digit amounts) ──
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg?: string;
  sub?: string;
  loading?: boolean;
}> = ({ title, value, icon, iconBg = 'bg-[#345E85]/10', sub, loading }) => {
  const valueStr = String(value);
  const isLongValue = valueStr.length > 10;

  return (
    <div className="min-w-0 bg-white dark:!bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 flex flex-col gap-3 h-full transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`h-10 w-10 shrink-0 rounded-xl ${iconBg} dark:bg-slate-800 flex items-center justify-center`}>
          {icon}
        </div>
        <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-tight min-w-0">
          <TranslatedText text={title} />
        </p>
      </div>

      {loading ? (
        <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
      ) : (
        <p
          className={`font-black text-slate-900 dark:text-white tracking-tight break-words leading-tight ${
            isLongValue ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'
          }`}
          title={valueStr}
        >
          {value}
        </p>
      )}

      {sub && (
        <p className="mt-auto text-[10px] font-bold text-slate-400 uppercase tracking-wider break-words leading-snug">
          {sub}
        </p>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const LenderDashboardEnlite: React.FC = () => {
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();
  const { format: formatCurrency } = useCurrencyFormat();

  const [dashboardData, setDashboardData]   = useState<LenderDashboardData | null>(null);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [approvalLoan, setApprovalLoan]     = useState<any>(null);
  const [rejectingId, setRejectingId]       = useState<string | null>(null);
  const [lenderId, setLenderId]             = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'LENDER') {
      setLenderId(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const resolved = await lendingApi.resolveLenderId();
        if (!cancelled) setLenderId(resolved || user.id);
      } catch {
        if (!cancelled) setLenderId(user.id);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const load = useCallback(async () => {
    if (!lenderId || !accessToken) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [dash, requests] = await Promise.all([
        lendingApi.getLenderDashboard(lenderId),
        lendingApi.getLenderLoanRequests(lenderId, undefined, 1, 10),
      ]);

      if (!dash || typeof dash.totalLoansRequested !== 'number') {
        throw new Error('Dashboard API returned invalid data');
      }

      setDashboardData(dash);

      const raw = Array.isArray(requests) ? requests : (requests?.data || []);
      setRecentRequests(raw);
    } catch (err: any) {
      setDashboardData(null);
      setError(err?.response?.data?.message || err?.message || 'Failed to load dashboard data');
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
      await load(); // refresh stats + table from DB
    } catch (err: any) {
      alert('Failed to reject: ' + (err?.response?.data?.message || err?.message));
    } finally { setRejectingId(null); }
  };

  const serverCurrency: string = dashboardData?.currency || 'RWF';

  const recentRequestColumns: Column<any>[] = useMemo(() => [
    {
      key: 'id',
      label: <TranslatedText text="Loan ID" /> as unknown as string,
      render: (_v, req) => (
        <>
          <p className="text-xs font-black text-slate-900 dark:text-white font-mono">{req.id.slice(0, 8)}…</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{new Date(req.created_at).toLocaleDateString()}</p>
        </>
      ),
    },
    {
      key: 'borrower',
      label: <TranslatedText text="Borrower" /> as unknown as string,
      render: (_v, req) => {
        const borrowerName = req.borrower?.contact_name || req.borrower?.company_name || req.created_by?.slice(0, 8) || '—';
        return (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-[#345E85]/10 flex items-center justify-center text-[#345E85] font-black text-xs flex-shrink-0">
              {borrowerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{borrowerName}</p>
              <p className="text-[10px] text-slate-400">{req.borrower?.email || ''}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'requested_amount',
      label: <TranslatedText text="Amount" /> as unknown as string,
      render: (_v, req) => {
        const amount = Number(req.requested_amount || req.requestedAmount) || 0;
        const approvedAmt = req.approved_amount != null ? Number(req.approved_amount) : null;
        const loanCurrency: string = req.currency || serverCurrency;
        return (
          <>
            <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(amount, loanCurrency)}</p>
            {approvedAmt != null && (
              <p className="text-[10px] text-emerald-600 font-bold mt-0.5">✓ {formatCurrency(approvedAmt, loanCurrency)}</p>
            )}
          </>
        );
      },
    },
    {
      key: 'purpose',
      label: <TranslatedText text="Purpose" /> as unknown as string,
      render: (_v, req) => {
        const purpose = req.metadata?.purpose || req.metadata?.note || '—';
        return <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 capitalize">{purpose}</p>;
      },
    },
    {
      key: 'requested_split',
      label: <TranslatedText text="Fund Split" /> as unknown as string,
      render: (_v, req) => {
        const split: Array<{ type: string; amount: number }> = req.requested_split || [];
        const loanCurrency: string = req.currency || serverCurrency;
        return split.length > 0 ? (
          <div className="space-y-1">
            {split.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">{s.type}</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatCurrency(s.amount, loanCurrency)}</span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-[10px] text-slate-300">—</span>
        );
      },
    },
    {
      key: 'status',
      label: <TranslatedText text="Status" /> as unknown as string,
      render: (_v, req) => <StatusBadge status={req.status} label={req.status} />,
    },
    {
      key: 'due_date',
      label: <TranslatedText text="Due Date" /> as unknown as string,
      render: (_v, req) => (
        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
          {req.due_date ? new Date(req.due_date).toLocaleDateString() : '—'}
        </p>
      ),
    },
    {
      key: 'actions',
      label: <TranslatedText text="Actions" /> as unknown as string,
      alwaysVisible: true,
      hideable: false,
      render: (_v, req) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate('/lender/requests')}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
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
      ),
    },
  ], [formatCurrency, serverCurrency, navigate, handleApprove, handleReject, rejectingId]);

  // ── Derived stats (only from live dashboard API — no local inventing) ────────
  const hasStats = !!dashboardData;
  const totalLoansRequested   = dashboardData?.totalLoansRequested;
  const totalAmountRequested  = dashboardData?.totalAmountRequested;
  const totalLoansApproved    = dashboardData?.totalLoansApproved;
  const totalAmountApproved   = dashboardData?.totalAmountApproved;
  const totalLoansProvided    = dashboardData?.totalLoansProvided;
  const totalAmountProvided   = dashboardData?.totalAmountProvided;
  const totalLoansRepaid      = dashboardData?.totalLoansRepaid;
  const totalAmountRepaid     = dashboardData?.totalAmountRepaid;
  const pendingCount          = dashboardData?.pendingCount ?? 0;
  const awaitingDisbursement  = dashboardData?.approvedAwaitingDisbursement ?? 0;
  const outstanding           = dashboardData?.totalOutstandingPrincipal;
  const recoveryRate          = dashboardData?.recoveryRate;

  const displayCount = (n: number | undefined) =>
    loading || n == null ? '—' : n;
  const displayMoney = (n: number | undefined) =>
    loading || n == null ? '—' : formatCurrency(n, serverCurrency);
  const displayPct = (n: number | undefined) =>
    loading || n == null ? '—' : `${n.toFixed(1)}%`;

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
  };

  const displayName = user?.firstName || user?.email?.split('@')[0] || 'Lender';

  if (!user) return null;

  return (
    <>
    <div className="min-h-screen bg-slate-50/50 dark:!bg-slate-950 p-6 md:p-8 space-y-8 transition-colors duration-200">

      {/* ── Header ── */}
      <div className="sticky top-16 sm:top-[4.5rem] lg:top-20 z-40 -mx-4 px-4 py-4 bg-slate-50 dark:!bg-slate-950 backdrop-blur-md flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black text-[#345E85] dark:text-blue-400 uppercase tracking-[0.2em] mb-1">
            <TranslatedText text="Lending Dashboard" />
          </p>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            <TranslatedText text={greeting()} />, {displayName}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {hasStats ? (
              <>
                {totalLoansRequested} <TranslatedText text="loan requests" /> · {pendingCount} <TranslatedText text="pending approval" />
                {awaitingDisbursement > 0 && (
                  <> · {awaitingDisbursement} <TranslatedText text="awaiting disbursement" /></>
                )}
              </>
            ) : (
              <TranslatedText text="Loading live portfolio stats…" />
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            className="h-11 w-11 rounded-2xl bg-white dark:!bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
            <button
            onClick={() => navigate('/lender/requests')}
            className="flex items-center gap-2 px-6 py-3 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-blue-100 dark:shadow-none"
          >
            <Briefcase size={14} /> <TranslatedText text="View All Requests" />
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900 text-rose-700 dark:text-rose-300 px-6 py-4 rounded-3xl flex items-center gap-3">
          <AlertTriangle size={16} />
          <span className="text-sm font-semibold">{error}</span>
          <button onClick={load} className="ml-auto text-xs underline"><TranslatedText text="Retry" /></button>
        </div>
      )}

      {/* ── Stats grid (live from GET /lending/dashboard/:lenderId) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Loans Requested"
          value={displayCount(totalLoansRequested)}
          icon={<Briefcase size={18} className="text-[#345E85]" />}
          iconBg="bg-[#345E85]/10"
          sub={hasStats ? `${displayCount(pendingCount)} pending approval` : undefined}
          loading={loading}
        />
        <StatCard
          title="Amount Requested"
          value={displayMoney(totalAmountRequested)}
          icon={<Banknote size={18} className="text-blue-600" />}
          iconBg="bg-blue-50 dark:bg-blue-950/40"
          loading={loading}
        />
        <StatCard
          title="Loans Approved"
          value={displayCount(totalLoansApproved)}
          icon={<CheckCircle size={18} className="text-emerald-600" />}
          iconBg="bg-emerald-50 dark:bg-emerald-950/40"
          sub={hasStats ? `${displayMoney(totalAmountApproved)} approved` : undefined}
          loading={loading}
        />
        <StatCard
          title="Funds Provided"
          value={displayMoney(totalAmountProvided)}
          icon={<Coins size={18} className="text-purple-600" />}
          iconBg="bg-purple-50 dark:bg-purple-950/40"
          sub={hasStats ? `${displayCount(totalLoansProvided)} loans disbursed` : undefined}
          loading={loading}
        />
        <StatCard
          title="Loans Repaid"
          value={displayCount(totalLoansRepaid)}
          icon={<CircleDollarSign size={18} className="text-teal-600" />}
          iconBg="bg-teal-50 dark:bg-teal-950/40"
          sub="Fully repaid loans"
          loading={loading}
        />
        <StatCard
          title="Amount Repaid"
          value={displayMoney(totalAmountRepaid)}
          icon={<DollarSign size={18} className="text-emerald-600" />}
          iconBg="bg-emerald-50 dark:bg-emerald-950/40"
          sub={hasStats ? `${displayPct(recoveryRate)} recovery` : undefined}
          loading={loading}
        />
      </div>

      {/* ── Portfolio summary bar ── */}
      {hasStats && (
        <div className="bg-white dark:!bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 transition-colors">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-8 w-8 rounded-xl bg-[#345E85]/10 dark:bg-[#345E85]/20 flex items-center justify-center">
              <BarChart3 size={14} className="text-[#345E85] dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight"><TranslatedText text="Portfolio Overview" /></p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <TranslatedText text="Live from database" />
                {dashboardData.computedAt
                  ? ` · ${new Date(dashboardData.computedAt).toLocaleString()}`
                  : ''}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Outstanding Balance', value: displayMoney(outstanding) },
              { label: 'Pending Approval', value: displayCount(pendingCount) },
              { label: 'Awaiting Disbursement', value: displayCount(awaitingDisbursement) },
              { label: 'Recovery Rate', value: displayPct(recoveryRate) },
            ].map(({ label, value }) => (
              <div key={label} className="text-center min-w-0 px-1">
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white break-words leading-tight">{value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1"><TranslatedText text={label} /></p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent loan requests table ── */}
      <div className="bg-white dark:!bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="px-8 py-5 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-[#345E85]/10 dark:bg-[#345E85]/20 flex items-center justify-center">
              <Activity size={14} className="text-[#345E85] dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight"><TranslatedText text="Recent Loan Requests" /></p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                {recentRequests.length} <TranslatedText text="records" /> · {pendingCount} <TranslatedText text="pending" />
              </p>
            </div>
          </div>
            <button
            onClick={() => navigate('/lender/requests')}
            className="flex items-center gap-1 text-[10px] font-black text-[#345E85] dark:text-blue-400 uppercase tracking-widest hover:opacity-70 transition-opacity"
          >
            <TranslatedText text="View All" /> <ChevronRight size={12} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-10 w-10 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-[#345E85] animate-spin" />
          </div>
        ) : recentRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <Briefcase size={22} className="text-slate-400" />
            </div>
            <p className="text-slate-900 dark:text-white font-black text-base mb-1"><TranslatedText text="No loan requests yet" /></p>
            <p className="text-slate-400 text-sm"><TranslatedText text="Requests from truck owners will appear here" /></p>
          </div>
        ) : (
          <StandardDataTable
            embedded
            columns={recentRequestColumns}
            data={recentRequests}
            getRowId={(row) => row.id}
            searchable={false}
            pagination={false}
            hoverable
            ariaLabel="Recent loan requests"
          />
        )}
      </div>

      {/* ── Quick links ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'All Requests',   path: '/lender/requests',      icon: <Briefcase size={18} />,    color: 'bg-blue-50 dark:bg-blue-950/40 text-[#345E85] dark:text-blue-400' },
          { label: 'Active Loans',   path: '/lender/active',        icon: <Activity size={18} />,     color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' },
          { label: 'Disbursements',  path: '/lender/disbursements', icon: <DollarSign size={18} />,   color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400' },
          { label: 'Analytics',      path: '/lender/analytics',     icon: <TrendingUp size={18} />,   color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' },
        ].map(({ label, path, icon, color }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="bg-white dark:!bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 flex items-center gap-4 hover:shadow-md dark:hover:bg-slate-800/80 transition-all text-left group"
          >
            <div className={`h-10 w-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
              {icon}
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white group-hover:text-[#345E85] dark:group-hover:text-blue-400 transition-colors"><TranslatedText text={label} /></p>
              <ChevronRight size={12} className="text-slate-300 dark:text-slate-600 mt-0.5 group-hover:translate-x-1 transition-transform" />
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
          onSuccess={() => {
            setApprovalLoan(null);
            load(); // refresh stats + table from DB after approval
          }}
        />
      )}
    </>
  );
};

export default LenderDashboardEnlite;

