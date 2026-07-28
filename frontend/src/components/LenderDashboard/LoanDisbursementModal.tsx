/**
 * LoanDisbursementModal — Step 3 of the loan workflow.
 * Lender disburses ONLY after borrower has accepted terms.
 * Truck owner payment details are loaded from their fleet financial-info profile.
 */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import {
  X, Loader2, CheckCircle, AlertCircle, ShieldCheck,
  Phone, ArrowRight, Lock, CreditCard, Building2, User,
} from 'lucide-react';
import { lendingApi } from '../../services/lending/lendingApi';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

interface Props {
  loan: any;
  onClose: () => void;
  onSuccess?: (loanId: string) => void;
}

type PaymentMethod = 'mobile_money' | 'bank_transfer' | 'card';

/** Normalize Rwanda MoMo number to 2507XXXXXXXX (same rules as backend Ishema). */
const normalizeMomoPhone = (raw: string): string | null => {
  let cleaned = raw.replace(/\D/g, '');
  while (cleaned.startsWith('0')) cleaned = cleaned.slice(1);
  if (!cleaned.startsWith('250')) cleaned = `250${cleaned}`;
  return /^2507\d{8}$/.test(cleaned) ? cleaned : null;
};

const LoanDisbursementModal: React.FC<Props> = ({ loan, onClose, onSuccess }) => {
  const { formatIn, currency: preferredCurrency } = useCurrencyFormat();
  const fmt = (amount: number, curr?: string) =>
    formatIn(amount, preferredCurrency, curr ?? loan?.currency ?? 'RWF');
  const [step, setStep] = useState<'review' | 'processing' | 'success' | 'error'>('review');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [disclosure, setDisclosure] = useState<any>(null);
  const [loadingDisclosure, setLoadingDisclosure] = useState(true);
  const [payerPhone, setPayerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });

  useEffect(() => {
    lendingApi.getLoanOfferDisclosure(loan.id)
      .then(setDisclosure)
      .catch(() => toast.error('Could not load loan terms'))
      .finally(() => setLoadingDisclosure(false));
  }, [loan.id]);

  const lockedAmount = disclosure?.approved_amount ?? loan.approved_amount ?? loan.requested_amount;
  const lockedCurrency = disclosure?.currency ?? loan.currency ?? 'RWF';
  const canDisburse = disclosure?.can_disburse ?? !!loan.borrower_accepted_at;

  const beneficiary = disclosure?.beneficiary_payment;
  const beneficiaryPhone = beneficiary?.payment_info?.phoneNumber;
  const beneficiaryAccount = beneficiary?.payment_info?.accountNumber;
  const beneficiaryMomoCode = beneficiary?.payment_info?.momoCode;
  const beneficiaryConfigured = beneficiary?.configured ?? false;
  const beneficiaryName = beneficiary?.truck_owner_name || 'Truck owner';

  const canPayMobileMoney = beneficiary?.has_mobile_money ?? !!beneficiaryPhone;
  const canPayBankTransfer = beneficiary?.has_bank_account ?? !!beneficiaryAccount;

  const beneficiaryReady =
    paymentMethod === 'mobile_money'
      ? canPayMobileMoney
      : paymentMethod === 'bank_transfer'
      ? canPayBankTransfer
      : true;

  const validatePaymentDetails = (): boolean => {
    if (!beneficiaryConfigured && paymentMethod !== 'card') {
      toast.error('Truck owner must configure payment info at Fleet → Financial Info first.');
      return false;
    }
    if (!beneficiaryReady) {
      toast.error(
        paymentMethod === 'mobile_money'
          ? 'Truck owner has no MoMo number on file.'
          : 'Truck owner has no bank account on file.',
      );
      return false;
    }

    if (paymentMethod === 'mobile_money') {
      if (!payerPhone.trim()) {
        toast.error('Enter your MoMo number (the phone that receives the PIN prompt).');
        return false;
      }
      if (!normalizeMomoPhone(payerPhone)) {
        toast.error('Enter a valid Rwanda MoMo payer number, e.g. 0788123456');
        return false;
      }
      const payer = normalizeMomoPhone(payerPhone);
      const receiver = normalizeMomoPhone(beneficiaryPhone || '');
      if (receiver && payer === receiver) {
        toast.error('Your MoMo number cannot be the same as the truck owner\'s receiving number.');
        return false;
      }
    } else if (paymentMethod === 'card') {
      const digits = cardDetails.cardNumber.replace(/\s/g, '');
      if (!cardDetails.cardName.trim() || !cardDetails.expiryDate.trim() || !cardDetails.cvv.trim() || !digits) {
        toast.error('Please fill in all card details.');
        return false;
      }
      if (!/^\d{13,19}$/.test(digits)) {
        toast.error('Enter a valid card number.');
        return false;
      }
      if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiryDate.trim())) {
        toast.error('Expiry must be MM/YY.');
        return false;
      }
      if (!/^\d{3,4}$/.test(cardDetails.cvv.trim())) {
        toast.error('Enter a valid CVV.');
        return false;
      }
    }
    return true;
  };

  const handleDisburse = async () => {
    if (!canDisburse) {
      toast.error('Borrower must accept terms before disbursement.');
      return;
    }
    if (!validatePaymentDetails()) return;

    setStep('processing');
    try {
      const normalizedPayer = paymentMethod === 'mobile_money' ? normalizeMomoPhone(payerPhone) : null;

      const response = await lendingApi.disburseWithPayment(loan.id, {
        paymentMethod,
        phoneNumber: normalizedPayer ?? undefined,
        cardNumber: paymentMethod === 'card' ? cardDetails.cardNumber.replace(/\s/g, '') : undefined,
        cardName: paymentMethod === 'card' ? cardDetails.cardName.trim() : undefined,
        expiryDate: paymentMethod === 'card' ? cardDetails.expiryDate.trim() : undefined,
        cvv: paymentMethod === 'card' ? cardDetails.cvv.trim() : undefined,
      });

      const pending =
        paymentMethod === 'mobile_money' &&
        (response?.pendingConfirmation ||
          response?.payment?.pendingConfirmation ||
          response?.payment?.status === 'processing');

      if (pending) {
        setSuccessMsg(
          `Mobile money request sent! Approve the PIN prompt on ${payerPhone.trim()} to complete disbursement to ${beneficiaryName}.`,
        );
        toast.success('Approve the MoMo prompt on your phone to complete disbursement.', { duration: 6000 });
      } else {
        setSuccessMsg(
          `${fmt(lockedAmount, lockedCurrency)} has been sent to ${beneficiaryName}. Borrower and truck owner have been notified.`,
        );
        toast.success('Funds disbursed successfully.');
        onSuccess?.(loan.id);
      }

      setStep('success');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Disbursement failed.';
      setErrorMsg(Array.isArray(msg) ? msg.join(', ') : msg);
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
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
            <h3 className="text-xl font-black text-slate-900 mb-2">Processing Disbursement</h3>
            <p className="text-sm text-slate-500 text-center">
              {paymentMethod === 'mobile_money'
                ? `Sending ${fmt(lockedAmount, lockedCurrency)} to ${beneficiaryName} — check ${payerPhone.trim()} for the MoMo PIN…`
                : `Processing ${fmt(lockedAmount, lockedCurrency)} to ${beneficiaryName}…`}
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-24 px-8">
            <CheckCircle className="w-16 h-16 text-emerald-600 mb-6" />
            <h3 className="text-xl font-black text-slate-900 mb-2">Disbursement Initiated</h3>
            <p className="text-sm text-slate-500 mb-8 text-center">{successMsg}</p>
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
                    </p>
                  </div>
                </div>
              )}

              {canDisburse && !loadingDisclosure && !beneficiaryConfigured && (
                <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-5">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-rose-900">Truck Owner Payment Not Configured</p>
                    <p className="text-xs text-rose-700 mt-1">
                      {beneficiaryName} must add their payment details at{' '}
                      <strong>Fleet → Financial Info</strong> before you can disburse.
                      No manual entry is allowed — funds go only to their registered account.
                    </p>
                  </div>
                </div>
              )}

              {canDisburse && beneficiaryConfigured && (
                <div className="bg-slate-50 rounded-2xl p-5 border-2 border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-slate-500" />
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Receiving Account (from truck owner profile)
                    </h3>
                  </div>
                  <p className="text-sm font-bold text-slate-900 mb-3">{beneficiaryName}</p>
                  <div className="space-y-2 text-sm">
                    {beneficiaryPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-slate-500">MoMo:</span>
                        <span className="font-bold text-slate-900">{beneficiaryPhone}</span>
                        {beneficiaryMomoCode && (
                          <span className="text-xs text-slate-400">({beneficiaryMomoCode})</span>
                        )}
                      </div>
                    )}
                    {beneficiaryAccount && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-slate-500">Bank account:</span>
                        <span className="font-bold text-slate-900">{beneficiaryAccount}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3">
                    Loaded from /dashboard/fleet/financial-info — not editable here.
                  </p>
                </div>
              )}

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
                  </div>
                )}
              </div>

              {canDisburse && beneficiaryConfigured && (
                <>
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      Your Payment Method
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { id: 'mobile_money' as const, label: '📱 Mobile Money', enabled: canPayMobileMoney },
                        { id: 'bank_transfer' as const, label: '🏦 Bank Transfer', enabled: canPayBankTransfer },
                        { id: 'card' as const, label: '💳 Card', enabled: true },
                      ]).map(m => (
                        <button
                          key={m.id}
                          onClick={() => m.enabled && setPaymentMethod(m.id)}
                          disabled={!m.enabled}
                          className={`p-4 rounded-xl border-2 text-xs font-black uppercase tracking-wider transition-all ${
                            paymentMethod === m.id
                              ? 'border-[#345E85] bg-blue-50 text-[#345E85]'
                              : m.enabled
                              ? 'border-slate-100 text-slate-500 hover:border-slate-200'
                              : 'border-slate-50 text-slate-300 cursor-not-allowed'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                    {!canPayMobileMoney && paymentMethod === 'mobile_money' && (
                      <p className="text-xs text-amber-600 mt-2">Truck owner has no MoMo number on file.</p>
                    )}
                  </div>

                  {paymentMethod === 'mobile_money' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" /> Your MoMo Number (Payer)
                      </label>
                      <input type="tel" value={payerPhone} onChange={e => setPayerPhone(e.target.value)}
                        placeholder="0788123456 — receives PIN prompt"
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold focus:border-[#345E85] outline-none" />
                      <p className="text-xs text-slate-500 mt-2">
                        Ishema sends the PIN to this number. Funds are sent to{' '}
                        <strong>{beneficiaryPhone || 'truck owner MoMo'}</strong> on file.
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'bank_transfer' && (
                    <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                      <p className="text-xs text-blue-800 font-semibold">
                        Transfer {fmt(lockedAmount, lockedCurrency)} to the truck owner&apos;s registered bank account{' '}
                        <strong>{beneficiaryAccount}</strong>. Manual bank processing will be recorded after confirmation.
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'card' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5" /> Card Number
                        </label>
                        <input type="text" value={cardDetails.cardNumber}
                          onChange={e => setCardDetails(d => ({ ...d, cardNumber: e.target.value }))}
                          placeholder="4111 1111 1111 1111"
                          className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold focus:border-[#345E85] outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Expiry</label>
                          <input type="text" value={cardDetails.expiryDate}
                            onChange={e => setCardDetails(d => ({ ...d, expiryDate: e.target.value }))}
                            placeholder="MM/YY"
                            className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold focus:border-[#345E85] outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">CVV</label>
                          <input type="password" value={cardDetails.cvv}
                            onChange={e => setCardDetails(d => ({ ...d, cvv: e.target.value }))}
                            placeholder="123"
                            className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold focus:border-[#345E85] outline-none" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-4 bg-emerald-50 rounded-2xl p-5 border-2 border-emerald-100">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold text-emerald-700 leading-relaxed">
                      Disbursing <strong>{fmt(lockedAmount, lockedCurrency)}</strong> to{' '}
                      <strong>{beneficiaryName}</strong> using their registered payment details.
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
                <button
                  onClick={handleDisburse}
                  disabled={!beneficiaryConfigured || !beneficiaryReady}
                  className="flex items-center gap-2 flex-1 justify-center px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl text-xs font-black uppercase tracking-widest border-b-4 border-emerald-800/20">
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
