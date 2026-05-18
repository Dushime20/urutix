/**
 * LoanApprovalModal
 *
 * Lender-facing step-modal for approving a loan request.
 *
 * Step 1 (TERMS): Lender confirms approved_amount, loan_term, due_date.
 *                  Interest rate is READ-ONLY — auto-computed by backend
 *                  from the lender's active Interest Rate Policy + borrower risk.
 *
 * Step 2 (PREVIEW): Full borrower-facing terms breakdown so the lender can
 *                   see exactly what the borrower will receive in their
 *                   LoanDetailModal (nominal rate, EAR/APR, interest amount,
 *                   origination fee, monthly repayment schedule).
 *
 * Step 3 (DONE): Processing → Success / Error.
 */
import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { createPortal } from 'react-dom';
import {
  X, AlertCircle, ShieldCheck,
  CalendarDays, DollarSign, Clock, Info,
  Percent, BarChart3, Receipt, TrendingUp, ArrowRight, ChevronLeft,
} from 'lucide-react';

export interface LoanApprovalPayload {
  approvedAmount: number;
  loanTermMonths: number;
  dueDate: string;
}

interface Props {
  loan: any; // enriched loan object from getLenderLoanRequests
  onClose: () => void;
  onConfirm: (loanId: string, payload: LoanApprovalPayload) => Promise<void>;
}

// ── Formatting helpers ───────────────────────────────────────────────────────
const fmtUSD = (n: number) =>
  `USD ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtPct = (n: number | null | undefined) =>
  n != null ? `${Number(n).toFixed(2)}%` : '—';

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

// ── Risk tier colour ─────────────────────────────────────────────────────────
const riskColour = (score: number | null) => {
  if (score == null) return 'text-slate-400';
  if (score >= 75) return 'text-emerald-600';
  if (score >= 55) return 'text-amber-500';
  return 'text-rose-500';
};

// ── Sub-component: read-only field ───────────────────────────────────────────
const Field: React.FC<{ label: string; value: React.ReactNode; sub?: string; accent?: boolean }> = ({
  label, value, sub, accent,
}) => (
  <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-base font-black ${accent ? 'text-[#345E85]' : 'text-slate-900'}`}>{value}</p>
    {sub && <p className="text-[9px] text-slate-400 mt-0.5">{sub}</p>}
  </div>
);

// ────────────────────────────────────────────────────────────────────────────

const LoanApprovalModal: React.FC<Props> = ({ loan, onClose, onConfirm }) => {
  const [step, setStep] = useState<'terms' | 'preview' | 'processing' | 'success' | 'error'>('terms');
  const [errorMsg, setErrorMsg] = useState('');

  // ── Disbursement method (Step 2) ────────────────────────────────────────
  const [disbursementMethod, setDisbursementMethod] = useState<'momo' | 'card'>('momo');
  const [momoProvider, setMomoProvider] = useState<'mtn' | 'airtel' | 'mpesa'>('mtn');
  const [momoPhone, setMomoPhone] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankName, setBankName] = useState('');

  // ── Lender-editable fields ──────────────────────────────────────────────
  const [approvedAmount, setApprovedAmount] = useState<number>(
    loan?.approved_amount || loan?.requested_amount || 0,
  );
  const [loanTermMonths, setLoanTermMonths] = useState<number>(
    loan?.loan_term_months || 3,
  );
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + (loan?.loan_term_months || 3));
    return d.toISOString().split('T')[0];
  });

  // Auto-advance due date when term selector changes
  useEffect(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + loanTermMonths);
    setDueDate(d.toISOString().split('T')[0]);
  }, [loanTermMonths]);

  // ── Fetch active policy for rate preview when not already on loan ──────
  const [fetchedRate, setFetchedRate] = useState<number | null>(null);
  const fetchedRef = useRef(false);
  useEffect(() => {
    const previewRate =
      loan?.interest_rate ??
      loan?.loanTerms?.nominal_rate ??
      loan?.metadata?.interest_rate ??
      null;
    if (previewRate != null || fetchedRef.current) return;
    const lenderId = loan?.lender_id ?? loan?.lender?.id;
    if (!lenderId) return;
    fetchedRef.current = true;
    api.get(`/lending/policies/${lenderId}/all`, { params: { activeOnly: true } })
      .then(res => {
        const policies: any[] = res.data?.interestRates ?? [];
        const active = policies.find((p: any) => p.is_active);
        if (active) setFetchedRate(Number(active.base_rate));
      })
      .catch(() => {});
  }, [loan]);

  // ── Policy-computed values (read-only, from backend) ───────────────────
  const nominalRate: number | null =
    loan?.interest_rate ??
    loan?.loanTerms?.nominal_rate ??
    loan?.metadata?.interest_rate ??
    fetchedRate ??
    null;
  const ear: number | null =
    loan?.effective_annual_rate ??
    loan?.loanTerms?.effective_annual_rate ??
    loan?.metadata?.effective_annual_rate ??
    (fetchedRate != null ? Number(((1 + fetchedRate / 100 / 12) ** 12 - 1) * 100) : null);
  const riskScore: number | null =
    loan?.risk_score ??
    loan?.loanTerms?.risk_score ??
    null;
  const riskLevel: string | null = loan?.risk_level ?? loan?.metadata?.risk_level ?? null;

  // ── Derived financial breakdown (what borrower will see) ───────────────
  // All rates sourced from backend policy computation — no hardcoded values.
  // originationFeeRate: from LoanTerms snapshot (loan_terms.origination_fee_rate)
  //   or loan.metadata.origination_fee_rate set by lender policy.
  const originationFeeRate: number | null =
    loan?.loanTerms?.origination_fee_rate ??
    loan?.metadata?.origination_fee_rate ??
    null;
  const rate = nominalRate; // null if policy not yet run — UI handles gracefully
  const totalInterest = rate != null ? approvedAmount * (rate / 100) * (loanTermMonths / 12) : null;
  const originationFee = originationFeeRate != null ? approvedAmount * (originationFeeRate / 100) : null;
  const totalRepayable =
    totalInterest != null && originationFee != null
      ? approvedAmount + totalInterest + originationFee
      : totalInterest != null
      ? approvedAmount + totalInterest
      : null;
  const monthlyInstalment =
    totalRepayable != null && loanTermMonths > 0 ? totalRepayable / loanTermMonths : null;

  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  })();

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    // onConfirm stores the payload and opens the payment modal.
    // This modal closes immediately — approval only happens after payment.
    try {
      await onConfirm(loan.id, { approvedAmount, loanTermMonths, dueDate });
      // onClose is called by the parent (LoanRequestsEnlite) after onConfirm resolves
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message || err?.message || 'Failed to open payment. Please try again.',
      );
      setStep('error');
    }
  };

  if (!loan) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl border border-slate-100 flex flex-col max-h-[95vh] overflow-hidden my-4">


        {/* ━━━━━━━━━━━━━━━━━━━━━ ERROR ━━━━━━━━━━━━━━━━━━━━━ */}
        {step === 'error' && (
          <div className="flex flex-col items-center justify-center py-32 px-8">
            <div className="w-24 h-24 rounded-full bg-rose-100 flex items-center justify-center mb-8">
              <AlertCircle className="w-12 h-12 text-rose-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">
              Approval Failed
            </h3>
            <p className="text-sm text-rose-600 text-center max-w-sm mb-8">{errorMsg}</p>
            <div className="flex gap-3">
              <button onClick={() => setStep('terms')}
                className="px-8 py-4 bg-[#345E85] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#2a4d6d] transition-all">
                Try Again
              </button>
              <button onClick={onClose}
                className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            STEP 1 — SET TERMS
            Lender sets: approved amount, loan term, due date.
            Interest rate shown read-only from policy computation.
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {step === 'terms' && (
          <>
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-[#345E85]/5 to-indigo-50 shrink-0 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-[#345E85] uppercase tracking-widest mb-1">
                  Step 1 of 2 — Loan Terms
                </p>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Approve Loan Request</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  <span className="font-bold text-slate-700">{loan.borrower_name || 'Borrower'}</span>
                  {loan.borrower_company && <span className="text-slate-400"> · {loan.borrower_company}</span>}
                </p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/60 rounded-full transition-colors shrink-0">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 overflow-y-auto flex-1 space-y-7">

              {/* Borrower risk snapshot */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-2xl border border-slate-100 px-5 py-4 text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Requested</p>
                  <p className="text-base font-black text-slate-900">{fmtUSD(loan.requested_amount)}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl border border-slate-100 px-5 py-4 text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Risk Score</p>
                  <p className={`text-base font-black ${riskColour(riskScore)}`}>
                    {riskScore != null ? `${riskScore}%` : '—'}
                  </p>
                  {riskLevel && <p className="text-[9px] text-slate-400 mt-0.5 capitalize">{riskLevel}</p>}
                </div>
                <div className="bg-slate-50 rounded-2xl border border-slate-100 px-5 py-4 text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Policy Rate</p>
                  <p className="text-base font-black text-[#345E85]">
                    {nominalRate != null ? `${nominalRate}% p.a.` : 'Pending'}
                  </p>
                  {ear != null && <p className="text-[9px] text-slate-400 mt-0.5">EAR {fmtPct(ear)}</p>}
                </div>
              </div>

              {nominalRate == null && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4">
                  <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 font-semibold leading-relaxed">
                    Rate will be computed from your active Interest Rate Policy at approval time.
                    If no policy is active, a 10% default applies.
                    Go to <strong>Lender → Policies</strong> to review your policies.
                  </p>
                </div>
              )}

              {/* Editable fields */}
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  Confirm Approval Terms
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {/* Approved Amount */}
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Approved Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">USD</span>
                      <input type="number" min={1} max={loan.requested_amount} step={0.01}
                        value={approvedAmount}
                        onChange={e => setApprovedAmount(parseFloat(e.target.value) || 0)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-[#345E85] outline-none transition-all" />
                    </div>
                    {approvedAmount < loan.requested_amount && (
                      <p className="text-[10px] text-amber-600 font-semibold mt-1">
                        Partial approval — borrower requested {fmtUSD(loan.requested_amount)}
                      </p>
                    )}
                  </div>

                  {/* Loan Term */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Loan Term
                    </label>
                    <select value={loanTermMonths} onChange={e => setLoanTermMonths(parseInt(e.target.value))}
                      className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-[#345E85] outline-none transition-all appearance-none">
                      {[1, 2, 3, 6, 9, 12, 18, 24, 36].map(m => (
                        <option key={m} value={m}>{m} month{m > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400" /> Repayment Due Date
                    </label>
                    <input type="date" value={dueDate}
                      min={minDate}
                      onChange={e => setDueDate(e.target.value)}
                      className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-[#345E85] outline-none transition-all" />
                    <p className="text-[9px] text-slate-400 mt-1">Auto-set from term above — you can adjust</p>
                  </div>
                </div>
              </div>

              {/* Interest rate is policy-driven notice */}
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4">
                <BarChart3 className="w-4 h-4 text-[#345E85] shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-700 font-semibold leading-relaxed">
                  <span className="font-black">Interest rate is set by your active Interest Rate Policy</span> — not entered manually.
                  The rate shown ({nominalRate != null ? `${nominalRate}% p.a.` : 'pending policy computation'}) was computed from your policy using the borrower's risk score ({riskScore != null ? `${riskScore}%` : 'N/A'}).
                  Review full breakdown in Step 2.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t-2 border-slate-100 bg-slate-50 flex items-center justify-between gap-4 shrink-0">
              <button onClick={onClose}
                className="px-6 py-3.5 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-200 rounded-2xl transition-all">
                Cancel
              </button>
              <button onClick={() => setStep('preview')}
                className="flex items-center gap-2 flex-1 justify-center px-6 py-3.5 bg-[#345E85] hover:bg-[#2a4d6d] text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-b-4 border-indigo-900/20 shadow-lg shadow-blue-100">
                Preview Borrower Terms <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            STEP 2 — REVIEW & PROCEED TO PAYMENT
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {step === 'preview' && (
          <>
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Review &amp; Proceed to Payment</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {loan.borrower_name || 'Borrower'}{loan.borrower_company ? ` · ${loan.borrower_company}` : ''}
                  </p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors shrink-0">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">

              {/* ── Order Summary — matches PaymentModal blue card ── */}
              <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-100">
                <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-5">Order Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-800/60 uppercase">Borrower:</span>
                    <span className="text-sm font-black text-blue-900">{loan.borrower_name || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-800/60 uppercase">Loan Ref:</span>
                    <span className="text-sm font-black text-blue-900 font-mono">{loan.loan_number || loan.id?.slice(0, 8) + '…'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-800/60 uppercase">Principal:</span>
                    <span className="text-sm font-black text-blue-900">{fmtUSD(approvedAmount)}</span>
                  </div>
                  {totalInterest != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-800/60 uppercase">Interest ({fmtPct(nominalRate)} · {loanTermMonths}m):</span>
                      <span className="text-sm font-black text-blue-900">+{fmtUSD(totalInterest)}</span>
                    </div>
                  )}
                  {originationFee != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-800/60 uppercase">Origination Fee:</span>
                      <span className="text-sm font-black text-blue-900">+{fmtUSD(originationFee)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-800/60 uppercase">Due Date:</span>
                    <span className="text-sm font-black text-blue-900">{fmtDate(dueDate)}</span>
                  </div>
                  <div className="pt-4 border-t-2 border-dashed border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black text-blue-900 uppercase">Total Disbursed to Borrower:</span>
                      <span className="text-3xl font-black text-[#345E85]">{fmtUSD(approvedAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Payment Method Selection ── */}
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  Disbursement Method
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setDisbursementMethod('momo')}
                    className={`p-6 rounded-2xl border-2 transition-all ${
                      disbursementMethod === 'momo'
                        ? 'border-[#345E85] bg-blue-50'
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-3">📱</div>
                      <div className="text-xs font-black text-slate-900 uppercase tracking-widest">Mobile Money</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setDisbursementMethod('card')}
                    className={`p-6 rounded-2xl border-2 transition-all ${
                      disbursementMethod === 'card'
                        ? 'border-[#345E85] bg-blue-50'
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-3">🏦</div>
                      <div className="text-xs font-black text-slate-900 uppercase tracking-widest">Bank Transfer</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* ── Mobile Money form ── */}
              {disbursementMethod === 'momo' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Mobile Provider
                    </label>
                    <select
                      value={momoProvider}
                      onChange={e => setMomoProvider(e.target.value as 'mtn' | 'airtel' | 'mpesa')}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all appearance-none"
                    >
                      <option value="mtn">MTN Mobile Money</option>
                      <option value="airtel">Airtel Money</option>
                      <option value="mpesa">M-Pesa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+250 7XX XXX XXX"
                      value={momoPhone}
                      onChange={e => setMomoPhone(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Funds will be sent directly to this mobile money account.
                    </p>
                  </div>
                </div>
              )}

              {/* ── Bank Transfer form ── */}
              {disbursementMethod === 'card' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1234567890"
                      value={bankAccount}
                      onChange={e => setBankAccount(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={bankName}
                      onChange={e => setBankName(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* ── Rate details (collapsed) ── */}
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5" /> Policy-Driven Rate Breakdown
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Nominal Annual Rate"
                    value={<span className="flex items-center gap-1"><Percent className="w-3.5 h-3.5" />{fmtPct(nominalRate)}</span>}
                    sub="From lender Interest Rate Policy"
                  />
                  <Field label="Effective Annual Rate (APR)" value={fmtPct(ear)} sub="Monthly compounding" accent />
                  <Field
                    label="Loan Term"
                    value={<span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{loanTermMonths} months</span>}
                  />
                  <Field
                    label="Monthly Instalment"
                    value={monthlyInstalment != null ? fmtUSD(monthlyInstalment) : '—'}
                    sub={`× ${loanTermMonths} payments`}
                    accent
                  />
                </div>
              </div>

              {/* ── Security notice — matches PaymentModal green panel ── */}
              <div className="flex items-start gap-4 bg-emerald-50 rounded-2xl p-5 border-2 border-emerald-100">
                <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-black text-emerald-900 mb-1 uppercase tracking-tight">
                    Secure Disbursement Protocol
                  </div>
                  <p className="text-[11px] font-bold text-emerald-700 leading-relaxed">
                    By confirming, you commit to disburse <strong>{fmtUSD(approvedAmount)}</strong> to the borrower.
                    This action is encrypted, logged, and immutable — compliant with Basel II / IFRS 9 standards.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t-2 border-slate-100 bg-slate-50 flex justify-between items-center gap-4 shrink-0">
              <button onClick={() => setStep('terms')}
                className="flex items-center gap-2 px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-200 rounded-xl transition-all">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={handleConfirm}
                className="flex-1 px-8 py-4 text-xs font-black bg-[#345E85] hover:bg-[#2a4d6d] text-white rounded-xl transition-all uppercase tracking-widest border-b-4 border-indigo-900/20">
                Confirm &amp; Disburse · {fmtUSD(approvedAmount)}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default LoanApprovalModal;
