import { useEffect, useState } from 'react';
import { FaSpinner } from 'react-icons/fa';
import { CheckCircle, Smartphone, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { parkingApi } from '../../services/parkingApi';
import { getApiErrorMessage } from '../../config/errorMessages';
import { formatParkingMoney, type ParkingReservation } from '../../types/parking';
import { TranslatedText } from '../translated-text';

type Step = 'form' | 'waiting' | 'success' | 'failed';

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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [referenceId, setReferenceId] = useState<string | undefined>();

  const payment = reservation.payment;
  const amount = payment?.totalAmount || 0;
  const currency = payment?.currency || 'RWF';

  useEffect(() => {
    if (!open || step !== 'waiting' || !referenceId) return undefined;
    let cancelled = false;
    const poll = async () => {
      try {
        const result = lookup
          ? await parkingApi.guestPayStatus({ ...lookup, referenceId })
          : await parkingApi.payStatus(reservationId!, referenceId);
        if (cancelled) return;
        if (result.providerStatus === 'success') {
          setStep('success');
          onPaid(result.reservation);
          return;
        }
        if (result.providerStatus === 'failed') {
          setStep('failed');
        }
      } catch {
        // Keep waiting; the driver may still approve the Ishema prompt.
      }
    };
    const timer = window.setInterval(poll, 3000);
    const timeout = window.setTimeout(() => {
      if (!cancelled) setStep('failed');
    }, 120000);
    void poll();
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.clearTimeout(timeout);
    };
    // Intentionally omit onPaid so polling is not reset on each parent render.
  }, [open, step, referenceId, lookup, reservationId]);

  if (!open) return null;

  const resetAndClose = () => {
    setStep('form');
    setPhoneNumber('');
    setReferenceId(undefined);
    setSubmitting(false);
    onClose();
  };

  const startPayment = async () => {
    if (phoneNumber.replace(/\D/g, '').length < 9) {
      toast.error('Enter the mobile money phone number that will approve this payment.');
      return;
    }
    try {
      setSubmitting(true);
      const result = lookup
        ? await parkingApi.guestPayNow({ ...lookup, phoneNumber: phoneNumber.trim() })
        : await parkingApi.payNow(reservationId!, phoneNumber.trim());
      setReferenceId(result.referenceId);
      if (result.providerStatus === 'success') {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">
            <TranslatedText text="Pay now" />
          </h2>
          <button type="button" onClick={resetAndClose} className="text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-6">
          {step === 'form' && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-600">
                Reservation {reservation.reservationReference} is confirmed. Pay{' '}
                <span className="font-black text-slate-900">{formatParkingMoney(amount, currency)}</span> with Ishema mobile money to complete approval.
              </p>
              <label className="block">
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Mobile money number</span>
                <input
                  className="w-full px-4 py-2.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="078xxxxxxx"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </label>
              <button
                type="button"
                disabled={submitting}
                onClick={startPayment}
                className="w-full bg-primary-600 text-white font-black uppercase tracking-widest py-3 rounded-xl text-[11px] disabled:opacity-50"
              >
                {submitting ? <FaSpinner className="inline animate-spin" /> : <TranslatedText text="Pay with Ishema" />}
              </button>
            </div>
          )}

          {step === 'waiting' && (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center text-primary-700">
                <Smartphone size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-900">Approve on your phone</h3>
              <p className="text-sm font-medium text-slate-500">
                Ishema sent a payment prompt of {formatParkingMoney(amount, currency)}. Enter your PIN to approve. This page will update when the payment succeeds.
              </p>
              <FaSpinner className="inline animate-spin text-primary-600" />
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-900">Payment successful</h3>
              <p className="text-sm font-medium text-slate-500">
                Ishema confirmed the payment. Reservation {reservation.reservationReference} is now approved and paid.
              </p>
              <button type="button" onClick={resetAndClose} className="w-full bg-primary-600 text-white font-black uppercase tracking-widest py-3 rounded-xl text-[11px]">
                Done
              </button>
            </div>
          )}

          {step === 'failed' && (
            <div className="text-center space-y-4 py-4">
              <p className="text-sm font-medium text-slate-600">
                The Ishema payment was not completed. You can try again with the same or another mobile money number.
              </p>
              <button
                type="button"
                onClick={() => setStep('form')}
                className="w-full bg-primary-600 text-white font-black uppercase tracking-widest py-3 rounded-xl text-[11px]"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
