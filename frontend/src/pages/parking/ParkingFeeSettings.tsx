import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { parkingApi } from '../../services/parkingApi';
import { getApiErrorMessage } from '../../config/errorMessages';
import { formatParkingMoney, type ParkingFeeSchedule } from '../../types/parking';
import { TranslatedText } from '../../components/translated-text';
import { usePermission } from '../../contexts/PermissionContext';
import ModernLoader from '../../components/common/ModernLoader';

const emptyForm: ParkingFeeSchedule = {
  id: '',
  facilityName: '',
  totalCapacity: 700,
  allowPastStartDates: false,
  currency: 'USD',
  monthlyRatePerSpace: 0,
  reservationFee: 0,
  taxPercent: 0,
  paymentDueDays: 7,
  feeNotes: '',
  paymentInstructions: '',
};

const ParkingFeeSettings = () => {
  const { can } = usePermission();
  const qc = useQueryClient();
  const [form, setForm] = useState<ParkingFeeSchedule>(emptyForm);
  const [spaces, setSpaces] = useState(1);
  const [months, setMonths] = useState(1);

  const query = useQuery({
    queryKey: ['parking-fees'],
    queryFn: parkingApi.fees,
  });

  useEffect(() => {
    if (query.data) setForm(query.data);
  }, [query.data]);

  const save = useMutation({
    mutationFn: () =>
      parkingApi.updateFees({
        currency: form.currency.trim().toUpperCase(),
        monthlyRatePerSpace: Number(form.monthlyRatePerSpace),
        reservationFee: Number(form.reservationFee),
        taxPercent: Number(form.taxPercent),
        paymentDueDays: Number(form.paymentDueDays),
        feeNotes: form.feeNotes,
        paymentInstructions: form.paymentInstructions,
      }),
    onSuccess: (data) => {
      setForm(data);
      qc.invalidateQueries({ queryKey: ['parking-fees'] });
      toast.success('Reservation fees updated');
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const preview = useMemo(() => {
    const occupancy = Number(spaces) * Number(months) * Number(form.monthlyRatePerSpace || 0);
    const subtotal = occupancy + Number(form.reservationFee || 0);
    const tax = subtotal * (Number(form.taxPercent || 0) / 100);
    return { occupancy, subtotal, tax, total: subtotal + tax };
  }, [spaces, months, form.monthlyRatePerSpace, form.reservationFee, form.taxPercent]);

  if (query.isLoading) return <ModernLoader isLoading text="Loading_Fee_Schedule" />;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="ui-page-title"><TranslatedText text="Reservation Fees" /></h1>
        <p className="ui-body-small mt-1">
          <TranslatedText text="Configure ISO 4217 currency, occupancy rates, reservation fees, and tax. These amounts are snapshotted onto each reservation when it is confirmed, then the driver is asked to pay." />
        </p>
      </div>

      {!can('parking:manage_fees') && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-semibold">
          You don't have permission to perform this action.
        </div>
      )}

      <form
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Currency (ISO 4217)">
            <input className="ui-input w-full border rounded-xl p-3 uppercase" maxLength={3} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} />
          </Field>
          <Field label="Payment due days">
            <input type="number" min={1} max={90} className="ui-input w-full border rounded-xl p-3" value={form.paymentDueDays} onChange={(e) => setForm({ ...form, paymentDueDays: Number(e.target.value) })} />
          </Field>
          <Field label="Monthly rate per truck space">
            <input type="number" min={0} step="0.01" className="ui-input w-full border rounded-xl p-3" value={form.monthlyRatePerSpace} onChange={(e) => setForm({ ...form, monthlyRatePerSpace: Number(e.target.value) })} />
          </Field>
          <Field label="Reservation / administration fee">
            <input type="number" min={0} step="0.01" className="ui-input w-full border rounded-xl p-3" value={form.reservationFee} onChange={(e) => setForm({ ...form, reservationFee: Number(e.target.value) })} />
          </Field>
          <Field label="Tax / VAT percent">
            <input type="number" min={0} max={100} step="0.01" className="ui-input w-full border rounded-xl p-3" value={form.taxPercent} onChange={(e) => setForm({ ...form, taxPercent: Number(e.target.value) })} />
          </Field>
        </div>
        <Field label="Public fee notes">
          <textarea rows={3} className="ui-input w-full border rounded-xl p-3" value={form.feeNotes || ''} onChange={(e) => setForm({ ...form, feeNotes: e.target.value })} />
        </Field>
        <Field label="Payment instructions">
          <textarea rows={4} className="ui-input w-full border rounded-xl p-3" placeholder="Bank account, mobile money, or card terminal instructions" value={form.paymentInstructions || ''} onChange={(e) => setForm({ ...form, paymentInstructions: e.target.value })} />
        </Field>
        <button type="submit" disabled={!can('parking:manage_fees') || save.isPending} className="px-5 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-sm disabled:opacity-50">
          Save fee schedule
        </button>
      </form>

      <section className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6">
        <h2 className="ui-section-title mb-4"><TranslatedText text="Quote preview" /></h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label="Spaces">
            <input type="number" min={1} className="ui-input w-full border rounded-xl p-3" value={spaces} onChange={(e) => setSpaces(Number(e.target.value))} />
          </Field>
          <Field label="Months">
            <input type="number" min={1} className="ui-input w-full border rounded-xl p-3" value={months} onChange={(e) => setMonths(Number(e.target.value))} />
          </Field>
        </div>
        <p className="text-sm font-medium text-slate-600">Occupancy: {formatParkingMoney(preview.occupancy, form.currency)}</p>
        <p className="text-sm font-medium text-slate-600">Tax: {formatParkingMoney(preview.tax, form.currency)}</p>
        <p className="text-lg font-black text-slate-900 dark:text-white mt-2">Total: {formatParkingMoney(preview.total, form.currency)}</p>
      </section>
    </div>
  );
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="ui-label block mb-2">{label}</span>
      {children}
    </label>
  );
}

export default ParkingFeeSettings;
