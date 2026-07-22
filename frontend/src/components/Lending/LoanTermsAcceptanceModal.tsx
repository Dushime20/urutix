/**
 * LoanTermsAcceptanceModal — Borrower-facing TILA disclosure & electronic consent.
 * Supports full offers and counter-offers (reduced principal).
 */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import {
  X, Loader2, CheckCircle, AlertCircle, ShieldCheck,
  FileText, CalendarDays, Percent, DollarSign, Info,
} from 'lucide-react';
import { lendingApi } from '../../services/lending/lendingApi';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

interface Props {
  loanId: string;
  onClose: () => void;
  onAccepted?: () => void;
  onDeclined?: () => void;
}

const LoanTermsAcceptanceModal: React.FC<Props> = ({ loanId, onClose, onAccepted, onDeclined }) => {
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
  const isCounterOffer = Boolean(
    disclosure?.is_counter_offer
    || disclosure?.is_partial_offer
    || (disclosure?.approved_amount != null
      && disclosure?.requested_amount != null
      && disclosure.approved_amount < disclosure.requested_amount - 0.01),
  );

  const handleAccept = async () => {
    if (!consentChecked) {
      toast.error(isCounterOffer
        ? 'Please confirm you agree to the counter-offer terms.'
        : 'Please confirm you have read and accept the terms.');
      return;
    }
    setStep('processing');
    try {
      await lendingApi.acceptLoanTerms(loanId, {
        consent_reference: `CONSENT-${Date.now()}`,
      });
      toast.success(
        isCounterOffer
          ? 'Counter-offer agreed. The lender can now disburse funds.'
          : 'Loan terms accepted. Lender will disburse funds shortly.',
      );
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
      toast.success(
        isCounterOffer
          ? 'Counter-offer rejected. The lender may submit a revised offer.'
          : 'Terms declined. The lender has been notified.',
      );
      setStep('declined');
      onDeclined?.();
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
              : 'There is no terms offer awaiting your response.'}
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
              {step === 'accepted'
                ? (isCounterOffer ? 'Counter-Offer Agreed' : 'Terms Accepted')
                : (isCounterOffer ? 'Counter-Offer Rejected' : 'Terms Declined')}
            </h3>
            <p className="text-sm text-slate-500 text-center mb-8">
              {step === 'accepted'
                ? 'The lender has been notified and can now open the payment modal to disburse funds.'
                : 'The lender has been notified and may submit a revised offer.'}
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
            <div className={`px-8 py-6 border-b border-slate-100 shrink-0 flex items-center justify-between ${
              isCounterOffer
                ? 'bg-gradient-to-r from-orange-50 to-amber-50'
                : 'bg-gradient-to-r from-blue-50 to-indigo-50'
            }`}>
              <div>
                <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${
                  isCounterOffer ? 'text-orange-700' : 'text-[#345E85]'
                }`}>
                  {isCounterOffer ? 'Counter-Offer Disclosure' : 'Loan Terms Disclosure'}
                </p>
                <h2 className="text-2xl font-black text-slate-900">
                  {isCounterOffer ? 'Agree or Reject Counter-Offer' : 'Review & Accept Offer'}
                </h2>
                <p className="text-sm text-slate-500">
                  Ref #{disclosure.loan_number || loanId.slice(0, 8)} · {disclosure.lender_name}
                </p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/60 rounded-full">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 space-y-6">
              {isCounterOffer ? (
                <div className="flex items-start gap-3 bg-orange-50 border border-orange-100 rounded-2xl p-5">
                  <Info className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-900 font-semibold leading-relaxed">
                    Your lender reviewed your request and is offering a <strong>lower principal</strong> than you asked for.
                    Agree to proceed at this amount, or reject so they can revise. Funds are not disbursed until you agree.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-5">
                  <FileText className="w-5 h-5 text-[#345E85] shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800 font-semibold leading-relaxed">
                    This is your formal loan offer under consumer credit disclosure requirements.
                    Review all terms carefully. Funds will <strong>not</strong> be disbursed until you accept.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {isCounterOffer ? 'Offered Principal' : 'Approved Principal'}
                  </p>
                  <p className="text-2xl font-black text-slate-900">
                    {fmt(disclosure.approved_amount, currency)}
                  </p>
                  {isCounterOffer && (
                    <p className="text-[10px] text-orange-600 mt-1 font-semibold">
                      You requested {fmt(disclosure.requested_amount, currency)}
                      {disclosure.amount_reduction != null && disclosure.amount_reduction > 0
                        ? ` (−${fmt(disclosure.amount_reduction, currency)})`
                        : ''}
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
                {disclosure.origination_fee_amount != null && Number(disclosure.origination_fee_amount) > 0 && (
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 col-span-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Origination Fee</p>
                    <p className="text-lg font-black">{fmt(disclosure.origination_fee_amount, currency)}</p>
                  </div>
                )}
              </div>

              {/* Policy summary */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5 space-y-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Lending Policy
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px]">Interest source</p>
                    <p className="font-semibold text-slate-800">
                      {disclosure.policy?.interest_rate_source || 'Lender interest-rate policy'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px]">Nominal rate</p>
                    <p className="font-semibold text-slate-800">
                      {disclosure.nominal_rate != null || disclosure.policy?.nominal_rate != null
                        ? `${Number(disclosure.nominal_rate ?? disclosure.policy?.nominal_rate).toFixed(2)}% p.a.`
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px]">Monthly instalment</p>
                    <p className="font-semibold text-slate-800">
                      {disclosure.monthly_instalment != null
                        ? fmt(disclosure.monthly_instalment, currency)
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px]">Purpose</p>
                    <p className="font-semibold text-slate-800">
                      {disclosure.policy?.purpose || 'Cargo financing'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Repayment schedule */}
              {Array.isArray(disclosure.repayment_schedule) && disclosure.repayment_schedule.length > 0 && (
                <div className="rounded-2xl border border-slate-100 overflow-hidden">
                  <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Repayment Schedule
                    </p>
                  </div>
                  <div className="max-h-40 overflow-y-auto divide-y divide-slate-50">
                    {disclosure.repayment_schedule.map((row: any) => (
                      <div key={row.instalment_number} className="px-5 py-2.5 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-500">
                          #{row.instalment_number} · {row.due_date
                            ? new Date(row.due_date).toLocaleDateString()
                            : '—'}
                        </span>
                        <span className="font-black text-slate-900">{fmt(row.amount, currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rules & regulations */}
              {Array.isArray(disclosure.rules_and_regulations) && disclosure.rules_and_regulations.length > 0 && (
                <div className="rounded-2xl border border-slate-100 bg-white p-5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Rules &amp; Regulations
                  </p>
                  <ul className="space-y-2">
                    {disclosure.rules_and_regulations.map((rule: string, idx: number) => (
                      <li key={idx} className="text-[11px] text-slate-600 font-medium leading-relaxed flex gap-2">
                        <span className="text-[#345E85] font-black shrink-0">{idx + 1}.</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!showDeclineForm ? (
                <>
                  <label className="flex items-start gap-3 cursor-pointer p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 hover:border-[#345E85]/30 transition-all">
                    <input type="checkbox" checked={consentChecked} onChange={e => setConsentChecked(e.target.checked)}
                      className="mt-1 w-4 h-4 accent-[#345E85]" />
                    <span className="text-xs text-slate-700 font-semibold leading-relaxed">
                      {isCounterOffer
                        ? `I understand the lender is offering ${fmt(disclosure.approved_amount, currency)} instead of my requested ${fmt(disclosure.requested_amount, currency)}. I agree to these revised terms and authorize disbursement to the service provider.`
                        : 'I have read and understand the loan terms above, including the principal amount, interest rate, total cost of credit, and repayment schedule. I accept these terms and authorize the lender to disburse funds to the service provider on my behalf.'}
                    </span>
                  </label>

                  <div className="flex items-start gap-3 bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-emerald-700 font-semibold">
                      Your response is recorded electronically with timestamp and consent reference for audit compliance (TILA / consumer credit).
                    </p>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-600 uppercase">
                    {isCounterOffer ? 'Reason for rejecting (optional)' : 'Reason for declining (optional)'}
                  </label>
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
                    {isCounterOffer ? 'Reject' : 'Decline'}
                  </button>
                  <button onClick={handleAccept} disabled={!consentChecked}
                    className="flex-1 py-3.5 bg-[#345E85] hover:bg-[#2a4d6d] disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-widest">
                    {isCounterOffer ? 'Agree to Counter-Offer' : 'Accept Terms & Authorize Disbursement'}
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
                    {isCounterOffer ? 'Confirm Reject' : 'Confirm Decline'}
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
