import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle,
  Loader2,
  DollarSign,
  ShieldCheck,
  X,
} from 'lucide-react';
import api from '../../services/api';
import { lendingApi } from '../../services/lending/lendingApi';
import toast from 'react-hot-toast';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import PaymentCurrencySelect from '../common/PaymentCurrencySelect';

interface EnhancedRepayButtonProps {
  loanId: string;
  /** Principal (approved or requested amount) */
  amount: number;
  /** Contracted interest from interest-rate policy (if already known) */
  interestAmount?: number;
  /** Nominal interest rate % p.a. for display */
  interestRate?: number | null;
  /** ISO currency the loan amounts are stored in */
  currency?: string;
  onRepaymentSuccess?: () => void;
}

type PaymentMethod = 'card' | 'mobile_money';

interface RepaymentBreakdown {
  principal: number;
  interest: number;
  interestRate: number | null;
  total: number;
  currency: string;
  loading: boolean;
}

const EnhancedRepayButton: React.FC<EnhancedRepayButtonProps> = ({
  loanId,
  amount,
  interestAmount = 0,
  interestRate = null,
  currency: loanCurrency = 'RWF',
  onRepaymentSuccess,
}) => {
  const { format: fmtFull } = useCurrencyFormat();

  const [repaying, setRepaying] = useState(false);
  const [repaid, setRepaid] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money');
  const [selectedCurrency, setSelectedCurrency] = useState<string>(loanCurrency);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    phoneNumber: '',
    mobileProvider: 'mtn',
  });
  const [breakdown, setBreakdown] = useState<RepaymentBreakdown>({
    principal: amount,
    interest: interestAmount,
    interestRate,
    total: amount + (interestAmount || 0),
    currency: loanCurrency,
    loading: false,
  });

  // Load accurate outstanding (principal + policy interest) when modal opens
  useEffect(() => {
    if (!showPaymentModal) return;

    let cancelled = false;
    const loadBreakdown = async () => {
      setBreakdown((prev) => ({ ...prev, loading: true }));
      try {
        const loan = await lendingApi.getLoanRequest(loanId);
        const data = (loan as any)?.data ?? loan;
        const principal = Number(
          data?.approved_amount ?? data?.approvedAmount ?? amount,
        );
        let interest = Number(
          data?.interest_amount ?? data?.interestAmount ?? interestAmount ?? 0,
        );
        let rate =
          data?.interest_rate != null
            ? Number(data.interest_rate)
            : data?.metadata?.interest_rate != null
              ? Number(data.metadata.interest_rate)
              : interestRate;

        // Always consult offer disclosure so policy interest is included when configured
        try {
          const disclosure = await lendingApi.getLoanOfferDisclosure(loanId);
          const d = disclosure?.data ?? disclosure;
          const disclosureInterest = Number(d?.interest_amount ?? 0);
          if (disclosureInterest > interest) {
            interest = disclosureInterest;
          }
          if (d?.nominal_rate != null) rate = Number(d.nominal_rate);
          else if (d?.apr != null && rate == null) rate = Number(d.apr);
        } catch {
          /* disclosure optional */
        }

        // Subtract amounts already repaid
        const repayments: any[] = data?.repayments ?? [];
        const paidSoFar = repayments.reduce(
          (s, r) => s + Number(r.amount || 0),
          0,
        );
        const totalDue = principal + interest;
        const outstanding = Math.max(0, Math.round((totalDue - paidSoFar) * 100) / 100);

        if (!cancelled) {
          setBreakdown({
            principal,
            interest,
            interestRate: rate ?? null,
            total: outstanding > 0 ? outstanding : totalDue,
            currency: data?.currency || loanCurrency || 'USD',
            loading: false,
          });
        }
      } catch {
        if (!cancelled) {
          const interest = interestAmount || 0;
          setBreakdown({
            principal: amount,
            interest,
            interestRate,
            total: amount + interest,
            currency: loanCurrency,
            loading: false,
          });
        }
      }
    };

    loadBreakdown();
    return () => {
      cancelled = true;
    };
  }, [showPaymentModal, loanId, amount, interestAmount, interestRate, loanCurrency]);

  const handleRepayClick = () => {
    if (repaid) return;
    setShowPaymentModal(true);
  };

  const handleClose = () => {
    if (repaying) return;
    setShowPaymentModal(false);
    setPaymentData({
      cardNumber: '',
      cardName: '',
      expiryDate: '',
      cvv: '',
      phoneNumber: '',
      mobileProvider: 'mtn',
    });
  };

  /** Normalize Rwanda MoMo number to 2507XXXXXXXX (same rules as backend). */
  const normalizeMomoPhone = (raw: string): string | null => {
    let cleaned = raw.replace(/\D/g, '');
    while (cleaned.startsWith('0')) cleaned = cleaned.slice(1);
    if (!cleaned.startsWith('250')) cleaned = `250${cleaned}`;
    return /^2507\d{8}$/.test(cleaned) ? cleaned : null;
  };

  const handlePayment = async () => {
    if (repaid || repaying) return;

    if (paymentMethod === 'card') {
      if (
        !paymentData.cardNumber ||
        !paymentData.cardName ||
        !paymentData.expiryDate ||
        !paymentData.cvv
      ) {
        toast.error('Please fill in all card details');
        return;
      }
    } else {
      if (!paymentData.phoneNumber.trim()) {
        toast.error('Enter the MoMo number that will pay (receives the PIN prompt)');
        return;
      }
      if (!normalizeMomoPhone(paymentData.phoneNumber)) {
        toast.error('Enter a valid Rwanda MoMo number, e.g. 0788123456');
        return;
      }
    }

    if (breakdown.total <= 0) {
      toast.error('Nothing outstanding to repay');
      return;
    }

    setRepaying(true);
    try {
      const normalizedPhone =
        paymentMethod === 'mobile_money'
          ? normalizeMomoPhone(paymentData.phoneNumber)
          : null;

      const response = await api.post(`/lending/repayments/${loanId}`, {
        final_payment_amount: breakdown.total,
        paymentMethod,
        currency: selectedCurrency,
        paymentDetails:
          paymentMethod === 'card'
            ? {
                cardNumber: paymentData.cardNumber,
                cardName: paymentData.cardName,
                expiryDate: paymentData.expiryDate,
                cvv: paymentData.cvv,
              }
            : {
                // Sender / payer — this phone gets the MoMo PIN popup
                phoneNumber: normalizedPhone,
                phone: normalizedPhone,
                payerPhone: normalizedPhone,
                provider: paymentData.mobileProvider,
              },
      });

      const paymentInfo = response.data?.payment ?? response.data?.data?.payment;
      const pending =
        paymentMethod === 'mobile_money' &&
        (paymentInfo?.pendingConfirmation ||
          paymentInfo?.status === 'processing');

      setRepaid(true);
      setShowPaymentModal(false);
      toast.success(
        pending
          ? 'Mobile money request sent! Approve the prompt on your phone to complete repayment.'
          : 'Loan repaid successfully!',
        { duration: 5000 },
      );
      onRepaymentSuccess?.();
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || 'Repayment failed. Please try again.';
      toast.error(
        Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage,
        { duration: 5000 },
      );
    } finally {
      setRepaying(false);
    }
  };

  const fmt = (value: number) => fmtFull(value, breakdown.currency);

  if (repaid) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase tracking-wider">
        <CheckCircle size={12} /> Repaid
      </span>
    );
  }

  return (
    <>
      <button
        onClick={handleRepayClick}
        disabled={repaying}
        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1.5"
      >
        {repaying ? (
          <>
            <Loader2 size={12} className="animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <DollarSign size={12} />
            Repay
          </>
        )}
      </button>

      {showPaymentModal &&
        createPortal(
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
              {/* Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      Complete Your Repayment
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Principal + interest from lender policy
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <PaymentCurrencySelect
                      value={selectedCurrency}
                      onChange={setSelectedCurrency}
                      label=""
                      layout="row"
                      className="w-36"
                    />
                    <button
                      onClick={handleClose}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                {/* Order Summary */}
                <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-800">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                    Repayment Summary
                  </h3>
                  {breakdown.loading ? (
                    <div className="flex items-center justify-center py-6 text-slate-500 gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm">Loading amounts…</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Principal:
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {fmt(breakdown.principal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Interest
                          {breakdown.interestRate != null
                            ? ` (${Number(breakdown.interestRate).toFixed(2)}% p.a.)`
                            : ' (policy)'}:
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {fmt(breakdown.interest)}
                        </span>
                      </div>
                      <div className="pt-3 border-t border-emerald-200 dark:border-emerald-700">
                        <div className="flex items-center justify-between">
                          <span className="text-base font-black text-slate-900 dark:text-white">
                            Total Due:
                          </span>
                          <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                            {fmt(breakdown.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                    Payment Method
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === 'card'
                          ? 'border-[#345E85] bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">💳</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          Credit Card
                        </div>
                        <div className="text-[10px] text-amber-600 mt-1 font-semibold">
                          Coming soon
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('mobile_money')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === 'mobile_money'
                          ? 'border-[#345E85] bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">📱</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          Mobile Money
                        </div>
                        <div className="text-[10px] text-emerald-600 mt-1 font-semibold">
                          Recommended
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {paymentMethod === 'card' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                        Card Number
                      </label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        value={paymentData.cardNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\s/g, '');
                          const formatted =
                            value.match(/.{1,4}/g)?.join(' ') || value;
                          setPaymentData({
                            ...paymentData,
                            cardNumber: formatted,
                          });
                        }}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={paymentData.cardName}
                        onChange={(e) =>
                          setPaymentData({
                            ...paymentData,
                            cardName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85] dark:text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          maxLength={5}
                          value={paymentData.expiryDate}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length >= 2) {
                              value =
                                value.slice(0, 2) + '/' + value.slice(2, 4);
                            }
                            setPaymentData({
                              ...paymentData,
                              expiryDate: value,
                            });
                          }}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85] dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                          CVV
                        </label>
                        <input
                          type="text"
                          placeholder="123"
                          maxLength={4}
                          value={paymentData.cvv}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            setPaymentData({ ...paymentData, cvv: value });
                          }}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85] dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'mobile_money' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                        Mobile Provider
                      </label>
                      <select
                        value={paymentData.mobileProvider}
                        onChange={(e) =>
                          setPaymentData({
                            ...paymentData,
                            mobileProvider: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85] dark:text-white"
                      >
                        <option value="mtn">MTN Mobile Money</option>
                        <option value="airtel">Airtel Money</option>
                        <option value="tigo">Tigo Cash</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                        Payer MoMo Number
                      </label>
                      <input
                        type="tel"
                        inputMode="tel"
                        placeholder="0788123456"
                        value={paymentData.phoneNumber}
                        onChange={(e) =>
                          setPaymentData({
                            ...paymentData,
                            phoneNumber: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85] dark:text-white"
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        Enter the number that will <span className="font-semibold text-slate-700">pay</span>.
                        That phone receives the PIN / USSD popup (e.g. 0788… or 250788…).
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                      Secure Payment
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Your payment information is encrypted and secure. Interest
                      is applied from the lender&apos;s active interest-rate
                      policy when configured. Amounts convert to your preferred
                      currency for display.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center gap-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={repaying}
                  className="px-6 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={repaying || breakdown.loading || breakdown.total <= 0}
                  className="px-8 py-3 text-sm font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                >
                  {repaying ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    `Pay ${fmt(breakdown.total)}`
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default EnhancedRepayButton;
