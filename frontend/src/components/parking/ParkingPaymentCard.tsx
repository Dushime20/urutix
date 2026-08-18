import { useState } from 'react';
import {
  PARKING_PAYMENT_LABELS,
  PARKING_PAYMENT_METHOD_LABELS,
  formatParkingMoney,
  isParkingPaymentOpen,
  type ParkingFeeQuote,
  type ParkingPaymentMethod,
  type ParkingReservation,
} from '../../types/parking';
import { TranslatedText } from '../translated-text';
import { useParkingMoney } from '../../hooks/useParkingMoney';

const METHODS: ParkingPaymentMethod[] = ['CREDIT_TRANSFER', 'CARD', 'CASH', 'MOBILE_MONEY', 'OTHER'];

export function ParkingPaymentCard({
  reservation,
  quote,
  onSubmit,
  submitting,
  staff,
  convertDisplay,
}: {
  reservation: ParkingReservation;
  quote?: ParkingFeeQuote;
  onSubmit?: (payload: { paymentMethod: ParkingPaymentMethod; paymentReference: string; notes?: string }) => void;
  submitting?: boolean;
  staff?: boolean;
  convertDisplay?: boolean;
}) {
  const { money } = useParkingMoney();
  const payment = reservation.payment;
  const source = payment && payment.status !== 'NOT_APPLICABLE' ? payment : quote;
  if (!source) return null;

  const status = payment?.status || 'NOT_APPLICABLE';
  const currency = source.currency || 'USD';
  const total = 'totalAmount' in source ? source.totalAmount : 0;
  const open = isParkingPaymentOpen(status);
  const lines = payment?.lineItems?.length ? payment.lineItems : quote?.lineItems || [];
  const display = (amount?: number | null) =>
    convertDisplay ? money(amount, currency) : formatParkingMoney(amount, currency);

  return (
    <section className={`rounded-2xl border p-5 ${open ? 'bg-amber-50 border-amber-200' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">
            <TranslatedText text={open ? 'Action required — pay reservation fees' : 'Reservation fees'} />
          </p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{display(total)}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            {PARKING_PAYMENT_LABELS[status]}
            {payment?.invoiceNumber ? ` · ${payment.invoiceNumber}` : ''}
            {payment?.dueAt ? ` · due ${String(payment.dueAt).slice(0, 10)}` : ''}
          </p>
        </div>
      </div>

      <dl className="space-y-1 text-sm font-medium text-slate-600 mb-4">
        <div className="flex justify-between"><dt>Occupancy</dt><dd>{display(source.occupancyAmount)}</dd></div>
        <div className="flex justify-between"><dt>Reservation fee</dt><dd>{display(source.reservationFeeAmount)}</dd></div>
        <div className="flex justify-between"><dt>Tax / VAT ({source.taxPercent}%)</dt><dd>{display(source.taxAmount)}</dd></div>
      </dl>

      {lines.length > 0 && (
        <ul className="text-xs text-slate-500 space-y-1 mb-4">
          {lines.map((line) => (
            <li key={line.code}>{line.description}: {display(line.amount)}</li>
          ))}
        </ul>
      )}

      {payment?.instructions && open && (
        <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap mb-4">{payment.instructions}</p>
      )}
      {payment?.feeNotes && <p className="text-xs text-slate-500 mb-4">{payment.feeNotes}</p>}

      {status === 'PAID' && (
        <p className="text-sm font-semibold text-emerald-700">
          Paid {display(payment?.paidAmount)}
          {payment?.paidAt ? ` on ${new Date(payment.paidAt).toLocaleString()}` : ''}
          {payment?.paymentReference ? ` · ref ${payment.paymentReference}` : ''}
        </p>
      )}

      {onSubmit && (open || (staff && status !== 'PAID' && status !== 'WAIVED' && status !== 'NOT_APPLICABLE')) && (
        <PaymentForm
          staff={staff}
          pending={status === 'PENDING_VERIFICATION'}
          submitting={submitting}
          onSubmit={onSubmit}
        />
      )}
    </section>
  );
}

function PaymentForm({
  staff,
  pending,
  submitting,
  onSubmit,
}: {
  staff?: boolean;
  pending?: boolean;
  submitting?: boolean;
  onSubmit: (payload: { paymentMethod: ParkingPaymentMethod; paymentReference: string; notes?: string }) => void;
}) {
  const [paymentMethod, setPaymentMethod] = useState<ParkingPaymentMethod>('CREDIT_TRANSFER');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <div className="space-y-3 pt-2 border-t border-amber-200">
      <p className="text-xs font-semibold text-slate-600">
        {staff
          ? pending
            ? 'Verify the submitted payment and confirm it was received.'
            : 'Record payment received from the driver.'
          : pending
            ? 'Your confirmation is waiting for the parking team to verify.'
            : 'After you pay, enter the transfer or receipt reference so the parking team can verify it.'}
      </p>
      <select
        className="w-full px-4 py-2.5 text-sm font-medium bg-white border border-slate-200 rounded-xl"
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value as ParkingPaymentMethod)}
      >
        {METHODS.map((method) => (
          <option key={method} value={method}>{PARKING_PAYMENT_METHOD_LABELS[method]}</option>
        ))}
      </select>
      <input
        className="w-full px-4 py-2.5 text-sm font-medium bg-white border border-slate-200 rounded-xl"
        placeholder="Payment / transaction reference"
        value={paymentReference}
        onChange={(e) => setPaymentReference(e.target.value)}
      />
      <textarea
        rows={2}
        className="w-full px-4 py-2.5 text-sm font-medium bg-white border border-slate-200 rounded-xl"
        placeholder="Optional notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <button
        type="button"
        disabled={paymentReference.trim().length < 4 || submitting}
        onClick={() => onSubmit({ paymentMethod, paymentReference: paymentReference.trim(), notes: notes.trim() || undefined })}
        className="w-full bg-primary-600 text-white font-black uppercase tracking-widest py-2.5 rounded-xl text-[11px] disabled:opacity-50"
      >
        {staff ? 'Confirm payment received' : 'Submit payment confirmation'}
      </button>
    </div>
  );
}
