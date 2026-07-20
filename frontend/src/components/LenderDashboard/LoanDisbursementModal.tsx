/**
 * LoanDisbursementModal — Step 3 of the loan workflow.
 * Lender disburses ONLY after borrower has accepted terms.
 * Amount is locked — no editing at disbursement time.
 */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import {
  X, Loader2, CheckCircle, AlertCircle, ShieldCheck,
  Phone, ArrowRight, ChevronLeft, Lock,
} from 'lucide-react';
import { lendingApi } from '../../services/lending/lendingApi';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

interface Props {
  loan: any;
  onClose: () => void;
  onSuccess?: (loanId: string) => void;
}

const LoanDisbursementModal: React.FC<Props> = ({ loan, onClose, onSuccess }) => {
  const { formatIn, currency: preferredCurrency } = useCurrencyFormat();
  const fmt = (amount: number, curr?: string) =>
    formatIn(amount, preferredCurrency, curr ?? loan?.currency ?? 'RWF');
  const [step, setStep] = useState<'review' | 'processing' | 'success' | 'error'>('review');
  const [errorMsg, setErrorMsg] = useState('');
  const [disclosure, setDisclosure] = useState<any>(null);
  const [loadingDisclosure, setLoadingDisclosure] = useState(true);
  const [momoPhone, setMomoPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mobile_money' | 'bank_transfer'>('mobile_money');

  const beneficiaryFromSplit = (loan?.requested_split as any[])?.find(
    (s: any) => s.type === 'truck_owner' || s.phone || s.phoneNumber,
  );

  useEffect(() => {
    lendingApi.getLoanOfferDisclosure(loan.id)
      .then(setDisclosure)
      .catch(() => toast.error('Could not load loan terms'))
      .finally(() => setLoadingDisclosure(false));

    const autoPhone =
      beneficiaryFromSplit?.phone ??
      beneficiaryFromSplit?.phoneNumber ??
      loan?.metadata?.beneficiary_phone ??
      '';
    if (autoPhone) setMomoPhone(autoPhone);
  }, [loan.id]);

  const lockedAmount = disclosure?.approved_amount ?? loan.approved_amount ?? loan.requested_amount;
  const lockedCurrency = disclosure?.currency ?? loan.currency ?? 'RWF';
  const canDisburse = disclosure?.can_disburse ?? !!loan.borrower_accepted_at;

  const handleDisburse = async () => {
    if (!canDisburse) {
      toast.error('Borrower must accept terms before disbursement.');
      return;
    }
    if (paymentMethod === 'mobile_money' && !momoPhone.trim()) {
      toast.error('Beneficiary phone number is required.');
      return;
    }

    setStep('processing');
    try {
      await lendingApi.disburseWithPayment(loan.id, {
        paymentMethod,
        truckOwnerPhoneNumber: momoPhone.trim() || undefined,
      });
      toast.success('Funds disbursed successfully.');
      onSuccess?.(loan.id);
      setStep('success');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Disbursement failed.';
      setErrorMsg(msg);
      toast.error(msg);
      setStep('error');
    }
  };

  if (!loan) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl border border-slate-100 flex flex-col max-h-[95vh] overflow-hidden my-4">

        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-24 px-8">
            <Loader2 className="w-12 h-12 text-[#345E85] animate-spin mb-6" />
            <h3 className="text-xl font-black text-slate-900 mb-2">Disbursing Funds</h3>
            <p className="text-sm text-slate-500 text-center">
              Sending {fmt(lockedAmount, lockedCurrency)} to beneficiary…
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-24 px-8">
            <CheckCircle className="w-16 h-16 text-emerald-600 mb-6" />
            <h3 className="text-xl font-black text-slate-900 mb-2">Disbursement Complete</h3>
            <p className="text-sm text-slate-500 mb-8 text-center">
              {fmt(lockedAmount, lockedCurrency)} has been sent. Borrower and beneficiary have been notified.
            </p>
            <button onClick={onClose}
              className="px-8 py-4 bg-[#345E85] text-white rounded-xl font-black text-xs uppercase tracking-widest">
              Done
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="flex flex-col items-center justify-center py-24 px-8">
            <AlertCircle className="w-16 h-16 text-rose-600 mb-6" />
            <h3 className="text-xl font-black text-slate-900 mb-2">Disbursement Failed</h3>
            <p className="text-sm text-rose-600 text-center mb-8">{errorMsg}</p>
            <button onClick={() => setStep('review')}
              className="px-8 py-4 bg-[#345E85] text-white rounded-xl font-black text-xs uppercase tracking-widest">
              Try Again
            </button>
          </div>
        )}

        {step === 'review' && (
          <>
            <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-blue-50 shrink-0 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-1">
                  Step 3 of 3 — Disburse Funds
                </p>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Execute Disbursement</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {loan.borrower_name || 'Borrower'} · Ref #{loan.loan_number || loan.id?.slice(0, 8)}
                </p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/60 rounded-full">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 space-y-6">
              {!canDisburse && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-5">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-900">Awaiting Borrower Acceptance</p>
                    <p className="text-xs text-amber-700 mt-1">
                      The borrower must review and accept the loan terms before you can disburse funds.
                      They have been notified via in-app notification.
                    </p>
                  </div>
                </div>
              )}

              {canDisburse && (
                <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-800 font-semibold">
                    Borrower accepted terms on{' '}
                    {loan.borrower_accepted_at
                      ? new Date(loan.borrower_accepted_at).toLocaleString()
                      : disclosure?.borrower_accepted_at
                      ? new Date(disclosure.borrower_accepted_at).toLocaleString()
                      : '—'}
                  </p>
                </div>
              )}

              {/* Locked terms — no editing */}
              <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-4 h-4 text-slate-500" />
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Agreed Terms (Locked)
                  </h3>
                </div>
                {loadingDisclosure ? (
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                ) : (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">Principal</p>
                      <p className="text-lg font-black text-slate-900">{fmt(lockedAmount, lockedCurrency)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">Total Repayable</p>
                      <p className="text-lg font-black text-[#345E85]">
                        {fmt(disclosure?.total_repayable ?? lockedAmount, lockedCurrency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">Interest</p>
                      <p className="font-bold">{fmt(disclosure?.interest_amount ?? 0, lockedCurrency)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">Due Date</p>
                      <p className="font-bold">
                        {disclosure?.due_date
                          ? new Date(disclosure.due_date).toLocaleDateString()
                          : '—'}
                      </p>
                    </div>
                    {disclosure?.apr != null && (
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">APR</p>
                        <p className="font-bold">{Number(disclosure.apr).toFixed(2)}%</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">Term</p>
                      <p className="font-bold">{disclosure?.loan_term_months ?? '—'} months</p>
                    </div>
                  </div>
                )}
              </div>

              {canDisburse && (
                <>
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      Disbursement Method
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {(['mobile_money', 'bank_transfer'] as const).map(m => (
                        <button key={m} onClick={() => setPaymentMethod(m)}
                          className={`p-4 rounded-xl border-2 text-xs font-black uppercase tracking-wider transition-all ${
                            paymentMethod === m
                              ? 'border-[#345E85] bg-blue-50 text-[#345E85]'
                              : 'border-slate-100 text-slate-500'
                          }`}>
                          {m === 'mobile_money' ? '📱 Mobile Money' : '🏦 Bank Transfer'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {paymentMethod === 'mobile_money' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" /> Beneficiary Phone (Truck Owner)
                      </label>
                      <input type="tel" value={momoPhone} onChange={e => setMomoPhone(e.target.value)}
                        placeholder="+250 7XX XXX XXX"
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold focus:border-[#345E85] outline-none" />
                      <p className="text-xs text-slate-500 mt-2">
                        Funds will be sent to this number. Amount cannot be changed at disbursement.
                      </p>
                    </div>
                  )}

                  <div className="flex items-start gap-4 bg-emerald-50 rounded-2xl p-5 border-2 border-emerald-100">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold text-emerald-700 leading-relaxed">
                      Disbursing <strong>{fmt(lockedAmount, lockedCurrency)}</strong> as agreed.
                      Borrower and beneficiary will be notified automatically. Transaction is logged and immutable.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="px-8 py-5 border-t-2 border-slate-100 bg-slate-50 flex justify-between gap-4 shrink-0">
              <button onClick={onClose}
                className="px-6 py-3.5 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-200 rounded-2xl">
                Cancel
              </button>
              {canDisburse && (
                <button onClick={handleDisburse}
                  className="flex items-center gap-2 flex-1 justify-center px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest border-b-4 border-emerald-800/20">
                  Disburse {fmt(lockedAmount, lockedCurrency)} <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default LoanDisbursementModal;
