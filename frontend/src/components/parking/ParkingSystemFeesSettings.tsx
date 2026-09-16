import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CircleDollarSign } from 'lucide-react';
import { parkingApi } from '../../services/parkingApi';
import { getApiErrorMessage } from '../../config/errorMessages';
import type { ParkingReservationFeeApplication, ParkingReservationFeeType, ParkingSystemFees } from '../../types/parking';
import { TranslatedText } from '../translated-text';
import { useParkingMoney } from '../../hooks/useParkingMoney';
import ModernLoader from '../common/ModernLoader';
import { SearchableSelect } from '../EnliteUI';
import { calculateParkingFeeQuote } from '../../utils/parkingQuote';

const DEFAULT_FEES: ParkingSystemFees = {
  enabled: false,
  reservationFeeType: 'FIXED',
  reservationFeeValue: 20,
  reservationFeeApplication: 'PER_RESERVATION',
};

const inputClass = 'ui-input w-full border rounded-xl p-3';

const ParkingSystemFeesSettings = () => {
  const qc = useQueryClient();
  const { money } = useParkingMoney();
  const [form, setForm] = useState<ParkingSystemFees>(DEFAULT_FEES);
  const [spaces, setSpaces] = useState(1);
  const [months, setMonths] = useState(1);
  const [exampleRate, setExampleRate] = useState(200);

  const query = useQuery({
    queryKey: ['parking-system-fees'],
    queryFn: parkingApi.getSystemFees,
  });

  useEffect(() => {
    if (query.data) setForm({ ...DEFAULT_FEES, ...query.data });
  }, [query.data]);

  const save = useMutation({
    mutationFn: () => parkingApi.updateSystemFees(form),
    onSuccess: (data) => {
      setForm({ ...DEFAULT_FEES, ...data });
      void qc.invalidateQueries({ queryKey: ['parking-system-fees'] });
      toast.success('System parking fees saved');
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const preview = useMemo(
    () =>
      calculateParkingFeeQuote({
        spaces,
        months,
        monthlyRatePerSpace: exampleRate,
        reservationFee: Number(form.reservationFeeValue) || 0,
        reservationFeeType: form.reservationFeeType,
        reservationFeeApplication: form.reservationFeeApplication,
        taxPercent: 0,
        taxEnabled: false,
        currency: 'USD',
      }),
    [exampleRate, form.reservationFeeApplication, form.reservationFeeType, form.reservationFeeValue, months, spaces],
  );

  const feeLabel =
    form.reservationFeeType === 'PERCENTAGE' ? 'Fee value (%)' : 'Fee value (facility billing currency)';

  if (query.isLoading) return <ModernLoader isLoading text="Loading_System_Fees" />;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary-50 p-2 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
            <CircleDollarSign className="h-5 w-5" />
          </div>
          <div>
            <h2 className="ui-section-title">
              <TranslatedText text="System parking fees" />
            </h2>
            <p className="ui-body-small mt-1 max-w-3xl">
              <TranslatedText text="Set the UrutiX reservation fee charged on every parking booking. Occupancy rates stay with each parking manager because the platform does not own parking space." />
            </p>
          </div>
        </div>
      </div>

      {query.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          <TranslatedText text="System parking fees could not be loaded." />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <form
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <label className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
            <span>
              <span className="ui-label block">Apply platform reservation fee</span>
              <span className="mt-1 block text-[11px] font-medium text-slate-500">
                When this is on, the fee below replaces any reservation fee on a facility schedule.
              </span>
            </span>
            <input
              type="checkbox"
              className="mt-1 h-5 w-5 accent-primary-600"
              checked={form.enabled}
              onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Reservation / admin fee type">
              <SearchableSelect
                value={form.reservationFeeType}
                onChange={(value) =>
                  setForm((current) => ({ ...current, reservationFeeType: value as ParkingReservationFeeType }))
                }
                searchPlaceholder="Search fee type"
                options={[
                  { value: 'FIXED', label: 'Fixed amount' },
                  { value: 'PERCENTAGE', label: 'Percentage of occupancy' },
                ]}
              />
            </Field>
            <Field label={feeLabel}>
              <input
                type="number"
                min={0}
                step="0.01"
                className={inputClass}
                value={form.reservationFeeValue}
                onChange={(event) =>
                  setForm((current) => ({ ...current, reservationFeeValue: Number(event.target.value) }))
                }
              />
            </Field>
            <Field label="How the admin fee is charged" hint="This is billed with the reservation, not as a parking space rent.">
              <SearchableSelect
                value={form.reservationFeeApplication}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    reservationFeeApplication: value as ParkingReservationFeeApplication,
                  }))
                }
                searchPlaceholder="Search how the fee is charged"
                options={[
                  { value: 'PER_RESERVATION', label: 'Once per reservation' },
                  { value: 'PER_SPACE', label: 'Per truck space' },
                  { value: 'PERCENT_OF_SUBTOTAL', label: 'Percent of occupancy' },
                ]}
              />
            </Field>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={save.isPending}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {save.isPending ? 'Saving…' : 'Save system fees'}
            </button>
          </div>
        </form>

        <aside className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/60">
          <h3 className="ui-section-title">
            <TranslatedText text="Example quote" />
          </h3>
          <p className="text-[11px] font-medium text-slate-500">
            Occupancy below is only an example. Real occupancy comes from the parking manager’s schedule.
          </p>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Spaces">
              <input
                type="number"
                min={1}
                className={inputClass}
                value={spaces}
                onChange={(event) => setSpaces(Math.max(1, Number(event.target.value) || 1))}
              />
            </Field>
            <Field label="Months">
              <input
                type="number"
                min={1}
                className={inputClass}
                value={months}
                onChange={(event) => setMonths(Math.max(1, Number(event.target.value) || 1))}
              />
            </Field>
            <Field label="Example rate">
              <input
                type="number"
                min={0}
                className={inputClass}
                value={exampleRate}
                onChange={(event) => setExampleRate(Math.max(0, Number(event.target.value) || 0))}
              />
            </Field>
          </div>
          <dl className="space-y-2 text-sm">
            <Row label="Example occupancy" value={money(preview.occupancyAmount, 'USD')} />
            <Row
              label="Platform reservation fee"
              value={form.enabled ? money(preview.reservationFeeAmount, 'USD') : money(0, 'USD')}
            />
            <Row
              label="Example total"
              value={money(form.enabled ? preview.totalAmount : preview.occupancyAmount, 'USD')}
            />
          </dl>
          {!form.enabled && (
            <p className="text-[11px] font-semibold text-amber-700">
              Platform fee is currently off. Quotes will use the facility schedule reservation fee.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
};

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="block">
      <span className="ui-label mb-2 block">{label}</span>
      {children}
      {hint && <p className="mt-1.5 text-[11px] font-medium leading-snug text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt>{label}</dt>
      <dd className="font-semibold text-slate-800 dark:text-slate-100">{value}</dd>
    </div>
  );
}

export default ParkingSystemFeesSettings;
