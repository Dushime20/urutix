import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaShieldAlt, FaTimes } from 'react-icons/fa';
import { CheckCircle, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { parkingApi } from '../../services/parkingApi';
import { getApiErrorMessage } from '../../config/errorMessages';
import { formatParkingMoney, type ParkingReservation } from '../../types/parking';
import { TranslatedText } from '../translated-text';

type Step = 'form' | 'waiting' | 'success' | 'failed';
type PaymentMethod = 'card' | 'mobile_money';

const inputClass =
  'w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85] dark:text-white';
const labelClass = 'block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2';

/** Same Rwanda MoMo rules as loan repayment: MTN 078/079, Airtel 072/073. */
function normalizeMomoPhone(raw: string): string | null {
  let cleaned = raw.replace(/\D/g, '');
  while (cleaned.startsWith('0')) cleaned = cleaned.slice(1);
  if (!cleaned.startsWith('250')) cleaned = `250${cleaned}`;
  return /^250(78|79|72|73)\d{7}$/.test(cleaned) ? cleaned : null;
}

export function ParkingIshemaPayModal({
  open,
  onClose,
  reservation,
  lookup,
  reservationId,
  onPaid,
}: {
  open: boolean;
  onClose: () => void;
  reservation: ParkingReservation;
  lookup?: { reservationReference: string; email: string };
  reservationId?: string;
  onPaid: (reservation: ParkingReservation) => void;
}) {
  const [step, setStep] = useState<Step>('form');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [mobileProvider, setMobileProvider] = useState('mtn');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [referenceId, setReferenceId] = useState<string | undefined>();

  const payment = reservation.payment;
  const amount = payment?.totalAmount || 0;
  const currency = payment?.currency || 'RWF';
  const formattedTotal = formatParkingMoney(amount, currency);

  useEffect(() => {
    if (!open) return;
    setStep('form');
    setPaymentMethod('mobile_money');
    setPhoneNumber(reservation.companyPhone || '');
    setMobileProvider('mtn');
    setCardNumber('');
    setCardName('');
    setExpiryDate('');
    setCvv('');
    setReferenceId(undefined);
    setSubmitting(false);
    // Reset only when the modal opens, not when the reservation object identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || step !== 'waiting' || !referenceId) return undefined;
    let cancelled = false;
    const poll = async () => {
      try {
        const result = lookup
          ? await parkingApi.guestPayStatus({ ...lookup, referenceId })
          : await parkingApi.payStatus(reservationId!, referenceId);
        if (cancelled) return;
        const paid = result.reservation?.payment?.status === 'PAID';
        if (result.providerStatus === 'success' && paid) {
          setStep('success');
          onPaid(result.reservation);
          return;
        }
        if (result.providerStatus === 'failed' || result.providerStatus === 'amount_mismatch') {
          setStep('failed');
        }
      } catch {
        // Keep waiting; the driver may still approve the Ishema prompt.
      }
    };
    const start = window.setTimeout(() => {
      if (!cancelled) void poll();
    }, 8000);
    const timer = window.setInterval(poll, 4000);
    const timeout = window.setTimeout(() => {
      if (!cancelled) setStep('failed');
    }, 180000);
    return () => {
      cancelled = true;
      window.clearTimeout(start);
      window.clearInterval(timer);
      window.clearTimeout(timeout);
    };
    // Intentionally omit onPaid so polling is not reset on each parent render.
  }, [open, step, referenceId, lookup, reservationId]);

  if (!open || typeof document === 'undefined') return null;

  const resetAndClose = () => {
    setStep('form');
    setPhoneNumber('');
    setReferenceId(undefined);
    setSubmitting(false);
    onClose();
  };

  const startPayment = async () => {
    if (paymentMethod === 'card') {
      if (!cardNumber || !cardName || !expiryDate || !cvv) {
        toast.error('Please fill in all card details');
        return;
      }
      toast.error('Parking reservation fees are paid with Ishema mobile money. Select Mobile Money to continue.');
      setPaymentMethod('mobile_money');
      return;
    }

    const normalizedPhone = normalizeMomoPhone(phoneNumber);
    if (!normalizedPhone) {
      toast.error('Enter a valid Rwanda MoMo number: 078… / 079… (MTN) or 072… / 073… (Airtel)');
      return;
    }

    try {
      setSubmitting(true);
      const result = lookup
        ? await parkingApi.guestPayNow({ ...lookup, phoneNumber: normalizedPhone })
        : await parkingApi.payNow(reservationId!, normalizedPhone);
      setReferenceId(result.referenceId);
      if (result.providerStatus === 'success' && result.reservation?.payment?.status === 'PAID') {
        setStep('success');
        onPaid(result.reservation);
        toast.success('Payment confirmed. Your reservation is approved.');
        return;
      }
      setStep('waiting');
      toast.success('Approve the payment prompt on your phone.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setStep('failed');
    } finally {
      setSubmitting(false);
    }
  };

  const summaryRows = [
    { label: 'Reservation', value: reservation.reservationReference },
    { label: 'Location', value: reservation.facilityName || reservation.locationLabel || '—' },
    { label: 'Company', value: reservation.companyName },
    {
      label: 'Spaces',
      value: `${reservation.truckSpacesRequested} space${reservation.truckSpacesRequested === 1 ? '' : 's'}`,
    },
    {
      label: 'Duration',
      value: `${reservation.contractMonths} month${reservation.contractMonths === 1 ? '' : 's'}`,
    },
    ...(payment
      ? [
          { label: 'Occupancy', value: formatParkingMoney(payment.occupancyAmount, currency) },
          { label: 'Reservation fee', value: formatParkingMoney(payment.reservationFeeAmount, currency) },
          {
            label: `Tax / VAT (${payment.taxPercent}%)`,
            value: formatParkingMoney(payment.taxAmount, currency),
          },
        ]
      : []),
  ];

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                <TranslatedText text="Complete Your Purchase" />
              </h2>
              <p className="text-sm text-slate-500 mt-1 truncate">
                {reservation.reservationReference}
                {reservation.facilityName ? ` · ${reservation.facilityName}` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={resetAndClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors shrink-0"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          {step === 'form' && (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-4 sm:p-6 border border-blue-100 dark:border-blue-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                  <TranslatedText text="Order Summary" />
                </h3>
                <div className="space-y-3">
                  {summaryRows.map((row) => (
                    <div key={row.label} className="flex items-start justify-between gap-3">
                      <span className="text-sm text-slate-600 dark:text-slate-400 shrink-0">{row.label}:</span>
                      <span className="font-bold text-slate-900 dark:text-white text-right break-words">{row.value}</span>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-blue-200 dark:border-blue-700">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        <TranslatedText text="Total Amount:" />
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-[#345E85] dark:text-blue-400 break-all">
                        {formattedTotal}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                  <TranslatedText text="Payment Method" />
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
                        <TranslatedText text="Credit Card" />
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
                        <TranslatedText text="Mobile Money" />
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>
                      <TranslatedText text="Card Number" />
                    </label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\s/g, '');
                        const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                        setCardNumber(formatted);
                      }}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      <TranslatedText text="Cardholder Name" />
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>
                        <TranslatedText text="Expiry Date" />
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        maxLength={5}
                        value={expiryDate}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '');
                          if (value.length >= 2) {
                            value = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
                          }
                          setExpiryDate(value);
                        }}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        <TranslatedText text="CVV" />
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        maxLength={4}
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'mobile_money' && (
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>
                      <TranslatedText text="Mobile Provider" />
                    </label>
                    <select
                      value={mobileProvider}
                      onChange={(e) => setMobileProvider(e.target.value)}
                      className={inputClass}
                    >
                      <option value="mtn">MTN Mobile Money</option>
                      <option value="airtel">Airtel Money</option>
                      <option value="tigo">Tigo Cash</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>
                      <TranslatedText text="Phone Number" />
                    </label>
                    <input
                      type="tel"
                      placeholder="+250 788 123 456"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className={inputClass}
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      <TranslatedText text="You will receive a prompt on your phone to confirm the payment" />
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <FaShieldAlt className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    <TranslatedText text="Secure Payment" />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    <TranslatedText text="Your payment information is encrypted and secure. We never store your card details." />
                  </p>
                </div>
              </div>
            </>
          )}

          {step === 'waiting' && (
            <div className="text-center space-y-4 py-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[#345E85]">
                <Smartphone size={28} />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                <TranslatedText text="Approve on your phone" />
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Ishema sent a payment prompt of {formattedTotal}. Enter your PIN to approve. This page will update when the payment succeeds.
              </p>
              <div className="w-8 h-8 mx-auto border-2 border-[#345E85] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4 py-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                <TranslatedText text="Payment successful" />
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Ishema confirmed the payment. Reservation {reservation.reservationReference} is now approved and paid.
              </p>
            </div>
          )}

          {step === 'failed' && (
            <div className="text-center space-y-4 py-8">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                <TranslatedText text="Payment not completed" />
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                The Ishema payment was not completed. You can try again with the same or another mobile money number.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3">
          {step === 'success' ? (
            <button
              type="button"
              onClick={resetAndClose}
              className="px-6 sm:px-8 py-3 text-sm font-black bg-[#345E85] hover:bg-[#2a4d6d] text-white shadow-md hover:shadow-lg rounded-xl transition-all uppercase tracking-wider w-full sm:w-auto text-center sm:ml-auto"
            >
              <TranslatedText text="Done" />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={resetAndClose}
                className="px-6 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all w-full sm:w-auto"
              >
                <TranslatedText text="Cancel" />
              </button>
              {step === 'failed' ? (
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="px-6 sm:px-8 py-3 text-sm font-black bg-[#345E85] hover:bg-[#2a4d6d] text-white shadow-md hover:shadow-lg rounded-xl transition-all uppercase tracking-wider w-full sm:w-auto text-center"
                >
                  <TranslatedText text="Try again" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startPayment}
                  disabled={submitting || step === 'waiting'}
                  className="px-6 sm:px-8 py-3 text-sm font-black bg-[#345E85] hover:bg-[#2a4d6d] text-white shadow-md hover:shadow-lg rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider w-full sm:w-auto text-center"
                >
                  {submitting || step === 'waiting' ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <TranslatedText text="Processing..." />
                    </span>
                  ) : (
                    `Pay ${formattedTotal}`
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
