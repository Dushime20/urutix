/**
 * LoanTermsAcceptanceModal — Borrower-facing TILA disclosure & electronic consent.
 * Shown when lender has offered terms (status: approved, awaiting acceptance).
 */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import {
  X, Loader2, CheckCircle, AlertCircle, ShieldCheck,
  FileText, CalendarDays, Percent, DollarSign,
} from 'lucide-react';
import { lendingApi } from '../../services/lending/lendingApi';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

interface Props {
  loanId: string;
  onClose: () => void;
  onAccepted?: () => void;
}

const LoanTermsAcceptanceModal: React.FC<Props> = ({ loanId, onClose, onAccepted }) => {
  const { format: fmt } = useCurrencyFormat();
  const [disclosure, setDisclosure] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'review' | 'processing' | 'accepted' | 'declined'>('review');
  const [consentChecked, setConsentChecked] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineForm, setShowDeclineForm] = useState(false);

  useEffect(() => {
    lendingApi.getLoanOfferDisclosure(loanId)
      .then(setDisclosure)
      .catch(() => toast.error('Could not load loan terms'))
      .finally(() => setLoading(false));
  }, [loanId]);

  const currency = disclosure?.currency ?? 'RWF';

  const handleAccept = async () => {
    if (!consentChecked) {
      toast.error('Please confirm you have read and accept the terms.');
      return;
    }
    setStep('processing');
    try {
      await lendingApi.acceptLoanTerms(loanId, {
        consent_reference: `CONSENT-${Date.now()}`,
      });
      toast.success('Loan terms accepted. Lender will disburse funds shortly.');
      setStep('accepted');
      onAccepted?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to accept terms.');
      setStep('review');
    }
  };

  const handleDecline = async () => {
    setStep('processing');
    try {
      await lendingApi.declineLoanTerms(loanId, { reason: declineReason || undefined });
      toast.success('Terms declined. The lender has been notified.');
      setStep('declined');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to decline terms.');
      setStep('review');
    }
  };

  if (loading) {
    return createPortal(
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>,
      document.body,
    );
  }

  if (!disclosure?.can_accept && step === 'review') {
    return createPortal(
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">No Pending Offer</h3>
          <p className="text-sm text-slate-600 mb-6">
            {disclosure?.borrower_accepted_at
              ? 'You have already accepted these terms.'
              : 'There is no terms offer awaiting your acceptance.'}
          </p>
          <button onClick={onClose} className="px-6 py-3 bg-slate-100 rounded-xl text-sm font-bold">
            Close
          </button>
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl border border-slate-100 flex flex-col max-h-[95vh] overflow-hidden my-4">

        {(step === 'accepted' || step === 'declined') && (
          <div className="flex flex-col items-center justify-center py-24 px-8">
            {step === 'accepted'
              ? <CheckCircle className="w-16 h-16 text-emerald-600 mb-6" />
              : <AlertCircle className="w-16 h-16 text-slate-400 mb-6" />}
            <h3 className="text-xl font-black text-slate-900 mb-2">
              {step === 'accepted' ? 'Terms Accepted' : 'Terms Declined'}
            </h3>
            <p className="text-sm text-slate-500 text-center mb-8">
              {step === 'accepted'
                ? 'The lender has been notified and will disburse funds to the service provider.'
                : 'The lender has been notified of your decision.'}
            </p>
            <button onClick={onClose}
              className="px-8 py-4 bg-[#345E85] text-white rounded-xl font-black text-xs uppercase tracking-widest">
              Close
            </button>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-24 px-8">
            <Loader2 className="w-12 h-12 text-[#345E85] animate-spin mb-4" />
            <p className="text-sm text-slate-500">Processing…</p>
          </div>
        )}

        {step === 'review' && (
          <>
            <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 shrink-0 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-[#345E85] uppercase tracking-widest mb-1">
                  Loan Terms Disclosure
                </p>
                <h2 className="text-2xl font-black text-slate-900">Review &amp; Accept Offer</h2>
                <p className="text-sm text-slate-500">
                  Ref #{disclosure.loan_number || loanId.slice(0, 8)} · {disclosure.lender_name}
                </p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/60 rounded-full">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 space-y-6">
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-5">
                <FileText className="w-5 h-5 text-[#345E85] shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 font-semibold leading-relaxed">
                  This is your formal loan offer under consumer credit disclosure requirements.
                  Review all terms carefully. Funds will <strong>not</strong> be disbursed until you accept.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Approved Principal
                  </p>
                  <p className="text-2xl font-black text-slate-900">
                    {fmt(disclosure.approved_amount, currency)}
                  </p>
                  {disclosure.approved_amount < disclosure.requested_amount && (
                    <p className="text-[10px] text-amber-600 mt-1">
                      Partial approval (requested {fmt(disclosure.requested_amount, currency)})
                    </p>
                  )}
                </div>
                <div className="bg-[#345E85]/5 rounded-2xl p-5 border border-[#345E85]/20">
                  <p className="text-[9px] font-black text-[#345E85] uppercase mb-1">Total Repayable</p>
                  <p className="text-2xl font-black text-[#345E85]">
                    {fmt(disclosure.total_repayable, currency)}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Interest</p>
                  <p className="text-lg font-black">{fmt(disclosure.interest_amount ?? 0, currency)}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1">
                    <Percent className="w-3 h-3" /> APR
                  </p>
                  <p className="text-lg font-black">
                    {disclosure.apr != null ? `${Number(disclosure.apr).toFixed(2)}%` : '—'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Term</p>
                  <p className="text-lg font-black">{disclosure.loan_term_months} months</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" /> Due Date
                  </p>
                  <p className="text-lg font-black">
                    {disclosure.due_date
                      ? new Date(disclosure.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                      : '—'}
                  </p>
                </div>
              </div>

              {!showDeclineForm ? (
                <>
                  <label className="flex items-start gap-3 cursor-pointer p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 hover:border-[#345E85]/30 transition-all">
                    <input type="checkbox" checked={consentChecked} onChange={e => setConsentChecked(e.target.checked)}
                      className="mt-1 w-4 h-4 accent-[#345E85]" />
                    <span className="text-xs text-slate-700 font-semibold leading-relaxed">
                      I have read and understand the loan terms above, including the principal amount,
                      interest rate, total cost of credit, and repayment schedule. I accept these terms
                      and authorize the lender to disburse funds to the service provider on my behalf.
                    </span>
                  </label>

                  <div className="flex items-start gap-3 bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-emerald-700 font-semibold">
                      Your acceptance is recorded electronically with timestamp and consent reference for audit compliance.
                    </p>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-600 uppercase">Reason for declining (optional)</label>
                  <textarea value={declineReason} onChange={e => setDeclineReason(e.target.value)}
                    rows={3} placeholder="e.g. Amount too low, terms not suitable…"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm focus:border-rose-400 outline-none" />
                </div>
              )}
            </div>

            <div className="px-8 py-5 border-t-2 border-slate-100 bg-slate-50 flex gap-3 shrink-0">
              {!showDeclineForm ? (
                <>
                  <button onClick={() => setShowDeclineForm(true)}
                    className="px-6 py-3.5 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-200 rounded-2xl">
                    Decline
                  </button>
                  <button onClick={handleAccept} disabled={!consentChecked}
                    className="flex-1 py-3.5 bg-[#345E85] hover:bg-[#2a4d6d] disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-widest">
                    Accept Terms &amp; Authorize Disbursement
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setShowDeclineForm(false)}
                    className="px-6 py-3.5 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-200 rounded-2xl">
                    Back
                  </button>
                  <button onClick={handleDecline}
                    className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest">
                    Confirm Decline
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default LoanTermsAcceptanceModal;
