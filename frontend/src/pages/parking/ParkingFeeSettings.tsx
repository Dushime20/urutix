import { useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { parkingApi } from '../../services/parkingApi';
import { getApiErrorMessage } from '../../config/errorMessages';
import type { ParkingFeeSchedule, ParkingFeeScheduleStatus } from '../../types/parking';
import { TranslatedText } from '../../components/translated-text';
import { usePermission } from '../../contexts/PermissionContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useParkingMoney } from '../../hooks/useParkingMoney';
import CurrencySelector from '../../components/common/CurrencySelector';
import ModernLoader from '../../components/common/ModernLoader';
import { Modal, SearchableSelect } from '../../components/EnliteUI';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../../components/EnliteUI/Tables';
import { countryDisplayName, worldCountries } from '../../lib/countries';
import { calculateParkingFeeQuote, effectiveParkingMonthlyRate } from '../../utils/parkingQuote';

const today = () => new Date().toISOString().slice(0, 10);

const STATUS_LABELS: Record<ParkingFeeScheduleStatus, string> = {
  DRAFT: 'Draft',
  SCHEDULED: 'Scheduled',
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
  ARCHIVED: 'Archived',
};

const STATUS_HELP: Record<ParkingFeeScheduleStatus, string> = {
  DRAFT: 'Not published yet. Drivers cannot use this pricing until you click Activate.',
  SCHEDULED: 'Approved to go live on the start date below.',
  ACTIVE: 'Currently used for new parking reservations.',
  EXPIRED: 'This pricing period has ended and is no longer offered.',
  ARCHIVED: 'Retired. It stays in history but is not used for new reservations.',
};

const LONG_TERM_DURATIONS = [
  { months: 6, label: '6 months' },
  { months: 12, label: '1 year' },
  { months: 18, label: '18 months' },
  { months: 24, label: '2 years' },
  { months: 36, label: '3 years' },
  { months: 48, label: '4 years' },
  { months: 60, label: '5 years' },
  { months: 120, label: '10 years' },
];

const COUNTRIES = worldCountries();

const emptyForm: ParkingFeeSchedule = {
  id: '',
  name: '',
  description: '',
  facilityName: '',
  city: '',
  country: '',
  region: '',
  totalCapacity: 700,
  allowPastStartDates: false,
  spaceType: 'TRUCK_SPACE',
  vehicleType: 'TRUCK',
  currency: 'USD',
  status: 'DRAFT',
  version: 1,
  monthlyRatePerSpace: 0,
  dailyRate: null,
  weeklyRate: null,
  longTermRate: null,
  longTermMonths: null,
  reservationFeeType: 'FIXED',
  reservationFeeValue: 0,
  reservationFee: 0,
  reservationFeeApplication: 'PER_RESERVATION',
  taxEnabled: false,
  taxName: 'VAT',
  taxPercent: 0,
  paymentFrequency: 'ONE_TIME',
  paymentDueType: 'DAYS_AFTER_INVOICE',
  paymentDueDays: 7,
  gracePeriodDays: 0,
  lateFeeType: 'NONE',
  lateFeeValue: 0,
  autoRenewal: false,
  minContractMonths: 1,
  maxContractMonths: 12,
  minSpaces: 1,
  maxSpaces: 100,
  cancellationAllowed: true,
  cancellationNoticeDays: 0,
  cancellationFeeType: 'NONE',
  cancellationFeeValue: 0,
  refundEligible: false,
  earlyTerminationAllowed: true,
  effectiveFrom: today(),
  effectiveUntil: '',
  feeNotes: '',
  paymentInstructions: '',
};

function countryValue(value?: string) {
  return countryDisplayName(value);
}

function durationLabel(months?: number | null) {
  if (!months) return '';
  const match = LONG_TERM_DURATIONS.find((item) => item.months === months);
  if (match) return match.label;
  if (months % 12 === 0) {
    const years = months / 12;
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  }
  return `${months} months`;
}

function titleCase(value: string) {
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

const inputClass = 'ui-input w-full border rounded-xl p-3';

function hydrate(data: Partial<ParkingFeeSchedule>, facility?: Partial<ParkingFeeSchedule>): ParkingFeeSchedule {
  return {
    ...emptyForm,
    ...data,
    facilityName: data.facilityName || facility?.facilityName || '',
    city: data.city || facility?.city || '',
    country: data.country || facility?.country || '',
    region: data.region || facility?.region || '',
    totalCapacity: data.totalCapacity || facility?.totalCapacity || 700,
    reservationFeeValue: data.reservationFeeValue ?? data.reservationFee ?? 0,
    reservationFee: data.reservationFeeValue ?? data.reservationFee ?? 0,
    longTermMonths: data.longTermMonths === undefined ? emptyForm.longTermMonths : data.longTermMonths,
    longTermRate: data.longTermRate === undefined ? null : data.longTermRate,
    effectiveFrom: data.effectiveFrom || today(),
    effectiveUntil: data.effectiveUntil || '',
  };
}

const ParkingFeeSettings = () => {
  const { can } = usePermission();
  const qc = useQueryClient();
  const { supportedCurrencies } = useCurrency();
  const { money, billed, converted, preferredCurrency, rateLabel } = useParkingMoney();
  const [form, setForm] = useState<ParkingFeeSchedule>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [spaces, setSpaces] = useState(1);
  const [months, setMonths] = useState(1);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const canEdit = can('parking:manage_fees');

  const query = useQuery({
    queryKey: ['parking-fee-schedules'],
    queryFn: parkingApi.listFeeSchedules,
  });
  const facilityQuery = useQuery({
    queryKey: ['parking-facility'],
    queryFn: parkingApi.facility,
  });

  const rows = query.data || [];
  const facilityDefaults: Partial<ParkingFeeSchedule> = {
    facilityName: facilityQuery.data?.facilityName || rows[0]?.facilityName || form.facilityName,
    city: facilityQuery.data?.city || rows[0]?.city || form.city,
    country: countryValue(facilityQuery.data?.country || rows[0]?.country || form.country),
    region: facilityQuery.data?.region || rows[0]?.region || form.region,
    totalCapacity: facilityQuery.data?.totalCapacity || rows[0]?.totalCapacity || form.totalCapacity,
  };

  const currencyOptions = useMemo(() => {
    const list = [...supportedCurrencies].sort((a, b) => a.code.localeCompare(b.code));
    if (form.currency && !list.some((c) => c.code === form.currency)) {
      list.unshift({
        code: form.currency,
        name: form.currency,
        symbol: form.currency,
        locale: 'en-US',
        decimals: 2,
        flag: '',
      });
    }
    return list;
  }, [form.currency, supportedCurrencies]);

  const countryOptions = useMemo(() => {
    const list = COUNTRIES.map((item) => ({ value: item.name, label: item.name, description: item.code }));
    const current = countryValue(form.country);
    if (current && !list.some((item) => item.value.toLowerCase() === current.toLowerCase())) {
      list.unshift({ value: current, label: current, description: '' });
    }
    return list;
  }, [form.country]);

  const durationOptions = useMemo(() => {
    const list = LONG_TERM_DURATIONS.map((item) => ({
      value: String(item.months),
      label: item.label,
      description: `${item.months} months`,
    }));
    if (form.longTermMonths && !list.some((item) => item.value === String(form.longTermMonths))) {
      list.push({
        value: String(form.longTermMonths),
        label: durationLabel(form.longTermMonths),
        description: `${form.longTermMonths} months`,
      });
    }
    return list;
  }, [form.longTermMonths]);

  const currencySelectOptions = useMemo(
    () =>
      currencyOptions.map((c) => ({
        value: c.code,
        label: `${c.flag ? `${c.flag} ` : ''}${c.code} — ${c.name}`,
      })),
    [currencyOptions],
  );

  const patch = (partial: Partial<ParkingFeeSchedule>) => {
    setForm((current) => ({ ...current, ...partial }));
    setFieldError(null);
  };

  const openCreate = () => {
    setForm(hydrate({ facilityName: facilityDefaults.facilityName }, facilityDefaults));
    setSpaces(1);
    setMonths(1);
    setFieldError(null);
    setModalOpen(true);
  };

  const openEdit = async (row: ParkingFeeSchedule) => {
    try {
      const data = row.id ? await parkingApi.getFeeSchedule(row.id) : row;
      setForm(hydrate(data, facilityDefaults));
      setSpaces(1);
      setMonths(1);
      setFieldError(null);
      setModalOpen(true);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setFieldError(null);
  };

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['parking-fee-schedules'] });
    qc.invalidateQueries({ queryKey: ['parking-facility'] });
  };

  const validate = () => {
    if (!(form.facilityName || '').trim()) return 'Parking facility name is required so drivers can identify this location.';
    if (!(form.city || '').trim()) return 'City is required so drivers can search for this parking location.';
    if (!(form.country || '').trim()) return 'Country is required so drivers can search for this parking location.';
    if (!form.currency || !/^[A-Z]{3}$/.test(form.currency)) return 'Choose a billing currency.';
    if (Number(form.monthlyRatePerSpace) <= 0) return 'Monthly rate per truck space must be greater than 0.';
    if (form.longTermRate != null && Number(form.longTermRate) > 0 && !form.longTermMonths) {
      return 'Choose how long a long-term contract must be, for example 2 years.';
    }
    if (Number(form.taxPercent) < 0 || Number(form.taxPercent) > 100) return 'Tax / VAT percent must be between 0 and 100.';
    if (Number(form.minContractMonths || 1) < 1) return 'Minimum contract months must be at least 1.';
    if (Number(form.maxContractMonths || 1) < Number(form.minContractMonths || 1)) return 'Maximum months must be greater than or equal to minimum months.';
    if (Number(form.minSpaces || 1) < 1) return 'Minimum truck spaces must be at least 1.';
    if (Number(form.maxSpaces || 1) < Number(form.minSpaces || 1)) return 'Maximum spaces must be greater than or equal to minimum spaces.';
    if (form.effectiveFrom && form.effectiveUntil && form.effectiveUntil < form.effectiveFrom) return 'Effective until must be on or after effective from.';
    if (Number(form.paymentDueDays) < 0) return 'Payment due days cannot be negative.';
    if (form.reservationFeeType === 'PERCENTAGE' && Number(form.reservationFeeValue ?? form.reservationFee) > 100) {
      return 'Percentage reservation fee must be between 0 and 100.';
    }
    return null;
  };

  const payload = () => ({
    id: form.id || undefined,
    name: form.name,
    description: form.description,
    spaceType: form.spaceType,
    vehicleType: form.vehicleType,
    currency: form.currency.trim().toUpperCase(),
    monthlyRatePerSpace: Number(form.monthlyRatePerSpace),
    dailyRate: form.dailyRate == null ? undefined : Number(form.dailyRate),
    weeklyRate: form.weeklyRate == null ? undefined : Number(form.weeklyRate),
    longTermRate: form.longTermRate == null ? null : Number(form.longTermRate),
    longTermMonths: form.longTermMonths == null ? null : Number(form.longTermMonths),
    reservationFeeType: form.reservationFeeType,
    reservationFeeValue: Number(form.reservationFeeValue ?? form.reservationFee),
    reservationFeeApplication: form.reservationFeeApplication,
    taxEnabled: form.taxEnabled,
    taxName: form.taxName,
    taxPercent: Number(form.taxPercent),
    paymentFrequency: form.paymentFrequency,
    paymentDueType: form.paymentDueType,
    paymentDueDays: Number(form.paymentDueDays),
    gracePeriodDays: Number(form.gracePeriodDays || 0),
    lateFeeType: form.lateFeeType,
    lateFeeValue: Number(form.lateFeeValue || 0),
    autoRenewal: form.autoRenewal,
    minContractMonths: Number(form.minContractMonths),
    maxContractMonths: Number(form.maxContractMonths),
    minSpaces: Number(form.minSpaces),
    maxSpaces: Number(form.maxSpaces),
    cancellationAllowed: form.cancellationAllowed,
    cancellationNoticeDays: Number(form.cancellationNoticeDays || 0),
    cancellationFeeType: form.cancellationFeeType,
    cancellationFeeValue: Number(form.cancellationFeeValue || 0),
    refundEligible: form.refundEligible,
    earlyTerminationAllowed: form.earlyTerminationAllowed,
    effectiveFrom: form.effectiveFrom,
    effectiveUntil: form.effectiveUntil || undefined,
    feeNotes: form.feeNotes,
    paymentInstructions: form.paymentInstructions,
    facilityName: (form.facilityName || '').trim(),
    city: (form.city || '').trim(),
    country: countryValue(form.country),
    region: (form.region || '').trim(),
    totalCapacity: Number(form.totalCapacity || 700),
  });

  const save = useMutation({
    mutationFn: () => {
      const error = validate();
      if (error) {
        setFieldError(error);
        throw new Error(error);
      }
      return parkingApi.updateFees(payload());
    },
    onSuccess: (data) => {
      setForm(hydrate(data, facilityDefaults));
      refresh();
      toast.success('Fee schedule saved');
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const activate = useMutation({
    mutationFn: async (id?: string) => {
      const scheduleId = id || form.id;
      if (!scheduleId) {
        const saved = await save.mutateAsync();
        if (!saved.id) throw new Error('Save the fee schedule before activating.');
        return parkingApi.activateFeeSchedule(saved.id);
      }
      return parkingApi.activateFeeSchedule(scheduleId);
    },
    onSuccess: (data) => {
      setForm(hydrate(data, facilityDefaults));
      refresh();
      toast.success('Fee schedule activated');
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const archive = useMutation({
    mutationFn: (id: string) => parkingApi.archiveFeeSchedule(id),
    onSuccess: () => {
      refresh();
      closeModal();
      toast.success('Fee schedule archived');
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const preview = useMemo(
    () =>
      calculateParkingFeeQuote({
        spaces: Math.max(1, Number(spaces) || 1),
        months: Math.max(1, Number(months) || 1),
        monthlyRatePerSpace: effectiveParkingMonthlyRate({
          months: Math.max(1, Number(months) || 1),
          monthlyRatePerSpace: Number(form.monthlyRatePerSpace || 0),
          longTermRate: form.longTermRate,
          longTermMonths: form.longTermMonths,
        }),
        reservationFee: Number(form.reservationFeeValue ?? form.reservationFee ?? 0),
        reservationFeeType: form.reservationFeeType,
        reservationFeeApplication: form.reservationFeeApplication,
        taxPercent: Number(form.taxPercent || 0),
        taxEnabled: form.taxEnabled,
        taxName: form.taxName,
        currency: form.currency,
      }),
    [spaces, months, form],
  );

  const columns: Column<ParkingFeeSchedule>[] = useMemo(() => [
    {
      key: 'name',
      label: 'Schedule',
      sortable: true,
      render: (_v, row) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white">{row.name || 'Untitled schedule'}</div>
          <div className="text-xs text-slate-500">
            {[row.facilityName, row.city, countryValue(row.country)].filter(Boolean).join(' · ')}
            {row.version ? ` · Version ${row.version}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_v, row) => (
        <StatusBadge status={row.status || 'DRAFT'} label={STATUS_LABELS[(row.status || 'DRAFT') as ParkingFeeScheduleStatus]} />
      ),
    },
    { key: 'spaceType', label: 'Space type', render: (v) => titleCase(String(v || 'TRUCK_SPACE')) },
    { key: 'vehicleType', label: 'Vehicle', render: (v) => titleCase(String(v || 'TRUCK')) },
    { key: 'currency', label: 'Currency' },
    {
      key: 'monthlyRatePerSpace',
      label: 'Monthly rate',
      render: (_v, row) => money(row.monthlyRatePerSpace, row.currency),
    },
    {
      key: 'reservationFee',
      label: 'Admin fee',
      render: (_v, row) =>
        row.reservationFeeType === 'PERCENTAGE'
          ? `${row.reservationFeeValue ?? row.reservationFee}%`
          : money(row.reservationFeeValue ?? row.reservationFee, row.currency),
    },
    {
      key: 'taxPercent',
      label: 'Tax',
      render: (_v, row) => (row.taxEnabled === false ? '—' : `${row.taxName || 'VAT'} ${row.taxPercent}%`),
    },
    {
      key: 'minSpaces',
      label: 'Spaces',
      render: (_v, row) => `${row.minSpaces ?? 1}–${row.maxSpaces ?? 100}`,
    },
    {
      key: 'minContractMonths',
      label: 'Months',
      render: (_v, row) => `${row.minContractMonths ?? 1}–${row.maxContractMonths ?? 12}`,
    },
    {
      key: 'effectiveFrom',
      label: 'Effective',
      render: (_v, row) => `${String(row.effectiveFrom || '').slice(0, 10) || '—'} → ${row.effectiveUntil ? String(row.effectiveUntil).slice(0, 10) : 'Open'}`,
    },
  ], [money]);

  const rowActions: TableAction<ParkingFeeSchedule>[] = [
    { label: 'Edit', onClick: (row) => { void openEdit(row); } },
    {
      label: 'Activate',
      variant: 'success',
      hidden: (row) => row.status === 'ACTIVE' || row.status === 'ARCHIVED' || !canEdit,
      onClick: (row) => activate.mutate(row.id),
    },
    {
      label: 'Archive',
      variant: 'danger',
      hidden: (row) => row.status === 'ARCHIVED' || !canEdit,
      onClick: (row) => archive.mutate(row.id),
    },
  ];

  const status = (form.status || 'DRAFT') as ParkingFeeScheduleStatus;
  const feeValue = form.reservationFeeValue ?? form.reservationFee;
  const showConverted = form.currency !== preferredCurrency;

  if (query.isLoading) return <ModernLoader isLoading text="Loading_Fee_Schedule" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="ui-page-title"><TranslatedText text="Reservation Fees" /></h1>
          <p className="ui-body-small mt-1">
            <TranslatedText text="View saved fee schedules in the table. Use Add or Edit to open the configuration form." />
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CurrencySelector variant="full" />
          {canEdit && (
            <button
              type="button"
              onClick={openCreate}
              className="px-4 py-2 rounded-lg font-bold text-sm bg-primary-600 hover:bg-primary-700 text-white"
            >
              Add fee schedule
            </button>
          )}
        </div>
      </div>

      {!canEdit && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-semibold">
          You don't have permission to perform this action.
        </div>
      )}

      <StandardDataTable
        title="Fee schedules"
        columns={columns}
        data={rows}
        loading={query.isLoading}
        error={query.isError ? getApiErrorMessage(query.error) : null}
        onRetry={() => query.refetch()}
        searchable
        searchPlaceholder="Search schedule, currency, status"
        rowActions={rowActions}
        emptyMessage="No fee schedules found"
        ariaLabel="Parking fee schedules"
      />

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={form.id ? 'Edit fee schedule' : 'Add fee schedule'}
        size="full"
        zIndexClass="z-[10050]"
        footer={
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <button type="button" className="px-4 py-2 rounded-lg font-bold border" onClick={closeModal}>Cancel</button>
            {form.id && status !== 'ARCHIVED' && (
              <button
                type="button"
                disabled={!canEdit || archive.isPending}
                onClick={() => archive.mutate(form.id)}
                className="px-4 py-2 rounded-lg font-bold bg-white border border-slate-200 text-slate-700 disabled:opacity-50"
              >
                Archive
              </button>
            )}
            <button
              type="button"
              disabled={!canEdit || activate.isPending || save.isPending}
              onClick={() => activate.mutate(form.id || undefined)}
              className="px-4 py-2 rounded-lg font-bold bg-emerald-600 text-white disabled:opacity-50"
            >
              Activate
            </button>
            <button
              type="button"
              disabled={!canEdit || save.isPending}
              onClick={() => save.mutate()}
              className="px-4 py-2 rounded-lg font-bold bg-primary-600 text-white disabled:opacity-50"
            >
              Save draft
            </button>
          </div>
        }
      >
        {fieldError && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-lg text-xs font-semibold mb-4">{fieldError}</div>
        )}
        <div className="space-y-6">
          <section className="space-y-4">
            <h3 className="ui-section-title"><TranslatedText text="General" /></h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Fee schedule name" hint="Internal name for this pricing, for example Kigali truck yard 2026.">
                <input className={inputClass} placeholder="Kigali truck yard 2026" value={form.name || ''} onChange={(e) => patch({ name: e.target.value })} />
              </Field>
              <Field label="Space type">
                <SearchableSelect
                  value={form.spaceType || 'TRUCK_SPACE'}
                  onChange={(value) => patch({ spaceType: value })}
                  searchPlaceholder="Search space type"
                  options={[
                    { value: 'TRUCK_SPACE', label: 'Truck space' },
                    { value: 'OVERSIZE', label: 'Oversize' },
                  ]}
                />
              </Field>
              <Field label="Vehicle type">
                <SearchableSelect
                  value={form.vehicleType || 'TRUCK'}
                  onChange={(value) => patch({ vehicleType: value })}
                  searchPlaceholder="Search vehicle type"
                  options={[
                    { value: 'TRUCK', label: 'Truck' },
                    { value: 'TRAILER', label: 'Trailer' },
                    { value: 'CONTAINER', label: 'Container' },
                  ]}
                />
              </Field>
              <Field label="Billing currency" hint="The currency drivers will be billed in.">
                <SearchableSelect
                  value={form.currency}
                  onChange={(value) => patch({ currency: value })}
                  searchPlaceholder="Search currency"
                  placeholder="Select currency"
                  options={currencySelectOptions}
                />
                {rateLabel(form.currency) && <p className="text-[11px] font-semibold text-slate-500 mt-1.5">{rateLabel(form.currency)}</p>}
              </Field>
              <Field label="Publish status" hint={STATUS_HELP[status]}>
                <div className="ui-input flex min-h-[48px] items-center justify-between gap-3 rounded-xl border bg-slate-50 px-3 py-3 dark:bg-slate-800/60">
                  <StatusBadge status={status} label={STATUS_LABELS[status]} />
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Version {form.version || 1}
                  </span>
                </div>
              </Field>
            </div>
            <Field label="Description">
              <textarea rows={2} className={inputClass} value={form.description || ''} onChange={(e) => patch({ description: e.target.value })} />
            </Field>
          </section>

          <section className="space-y-4">
            <h3 className="ui-section-title"><TranslatedText text="Location" /></h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              <TranslatedText text="Drivers search and select this parking facility by name, city, country, or parking manager when they make a reservation." />
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Parking facility name">
                <input
                  className={inputClass}
                  placeholder="Kigali Truck Parking"
                  value={form.facilityName}
                  onChange={(e) => patch({ facilityName: e.target.value })}
                />
              </Field>
              <Field label="Total parking spaces">
                <input
                  type="number"
                  min={1}
                  className={inputClass}
                  value={form.totalCapacity || ''}
                  onChange={(e) => patch({ totalCapacity: Number(e.target.value) })}
                />
              </Field>
              <Field label="City">
                <input
                  className={inputClass}
                  placeholder="Kigali"
                  value={form.city || ''}
                  onChange={(e) => patch({ city: e.target.value })}
                />
              </Field>
              <Field label="Country" hint="Search any country worldwide. This is how drivers find this parking location.">
                <SearchableSelect
                  value={countryValue(form.country)}
                  onChange={(value) => patch({ country: value })}
                  placeholder="Select country"
                  searchPlaceholder="Search country"
                  options={countryOptions}
                  allowClear
                />
              </Field>
              <Field label="Region / state (optional)">
                <input
                  className={inputClass}
                  placeholder="Kigali City"
                  value={form.region || ''}
                  onChange={(e) => patch({ region: e.target.value })}
                />
              </Field>
            </div>
            {(form.facilityName || form.city || form.country) && (
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {form.facilityName || 'Parking facility'}
                {form.city || form.country ? ` · 📍 ${[form.city, countryValue(form.country)].filter(Boolean).join(', ')}` : ''}
              </p>
            )}
          </section>

          <section className="space-y-4">
            <h3 className="ui-section-title"><TranslatedText text="Pricing" /></h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={`Monthly rate per truck space (${form.currency})`}>
                <input type="number" min={0} step="0.01" className={inputClass} value={form.monthlyRatePerSpace} onChange={(e) => patch({ monthlyRatePerSpace: Number(e.target.value) })} />
                {showConverted && <p className="text-[11px] font-semibold text-slate-500 mt-1.5">≈ {converted(form.monthlyRatePerSpace, form.currency)}</p>}
              </Field>
              <Field label="Daily rate (optional)" hint="Rate for a single day if short stays are offered.">
                <input type="number" min={0} step="0.01" className={inputClass} value={form.dailyRate ?? ''} onChange={(e) => patch({ dailyRate: e.target.value === '' ? null : Number(e.target.value) })} />
              </Field>
              <Field label="Weekly rate (optional)" hint="Rate for a 7-day stay if weekly parking is offered.">
                <input type="number" min={0} step="0.01" className={inputClass} value={form.weeklyRate ?? ''} onChange={(e) => patch({ weeklyRate: e.target.value === '' ? null : Number(e.target.value) })} />
              </Field>
              <Field
                label={`Long-term contract length`}
                hint="How long a driver must book to get the discounted long-term monthly rate, for example 2 years."
              >
                <SearchableSelect
                  value={form.longTermMonths ? String(form.longTermMonths) : ''}
                  onChange={(value) => patch({ longTermMonths: value ? Number(value) : null })}
                  placeholder="Select duration"
                  searchPlaceholder="Search duration, e.g. 2 years"
                  options={durationOptions}
                  allowClear
                />
              </Field>
              <Field
                label={`Long-term monthly rate (${form.currency})`}
                hint={
                  form.longTermMonths
                    ? `Discounted monthly rate per truck space when the contract is ${durationLabel(form.longTermMonths)} or longer.`
                    : 'Optional discounted monthly rate for long contracts. Choose a duration first.'
                }
              >
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className={inputClass}
                  placeholder="e.g. 180"
                  value={form.longTermRate ?? ''}
                  onChange={(e) => patch({ longTermRate: e.target.value === '' ? null : Number(e.target.value) })}
                />
                {showConverted && form.longTermRate != null && (
                  <p className="text-[11px] font-semibold text-slate-500 mt-1.5">≈ {converted(form.longTermRate, form.currency)}</p>
                )}
              </Field>
              <Field label="Reservation / admin fee type">
                <SearchableSelect
                  value={form.reservationFeeType || 'FIXED'}
                  onChange={(value) => patch({ reservationFeeType: value as ParkingFeeSchedule['reservationFeeType'] })}
                  searchPlaceholder="Search fee type"
                  options={[
                    { value: 'FIXED', label: 'Fixed amount' },
                    { value: 'PERCENTAGE', label: 'Percentage' },
                  ]}
                />
              </Field>
              <Field label={form.reservationFeeType === 'PERCENTAGE' ? 'Fee value (%)' : `Fee value (${form.currency})`}>
                <input type="number" min={0} step="0.01" className={inputClass} value={feeValue} onChange={(e) => patch({ reservationFeeValue: Number(e.target.value), reservationFee: Number(e.target.value) })} />
                {showConverted && form.reservationFeeType === 'FIXED' && <p className="text-[11px] font-semibold text-slate-500 mt-1.5">≈ {converted(feeValue, form.currency)}</p>}
              </Field>
              <Field label="How the admin fee is charged">
                <SearchableSelect
                  value={form.reservationFeeApplication || 'PER_RESERVATION'}
                  onChange={(value) => patch({ reservationFeeApplication: value as ParkingFeeSchedule['reservationFeeApplication'] })}
                  searchPlaceholder="Search how the fee is charged"
                  options={[
                    { value: 'PER_RESERVATION', label: 'Once per reservation' },
                    { value: 'PER_SPACE', label: 'Once per truck space' },
                    { value: 'PERCENT_OF_SUBTOTAL', label: 'Percentage of parking subtotal' },
                  ]}
                />
              </Field>
              <Field label="Charge tax / VAT">
                <SearchableSelect
                  value={form.taxEnabled ? 'yes' : 'no'}
                  onChange={(value) => patch({ taxEnabled: value === 'yes' })}
                  searchPlaceholder="Search tax option"
                  options={[
                    { value: 'yes', label: 'Yes, add tax' },
                    { value: 'no', label: 'No tax' },
                  ]}
                />
              </Field>
              <Field label="Tax name">
                <input className={inputClass} value={form.taxName || 'VAT'} onChange={(e) => patch({ taxName: e.target.value })} />
              </Field>
              <Field label="Tax / VAT percent">
                <input type="number" min={0} max={100} step="0.01" className={inputClass} value={form.taxPercent} onChange={(e) => patch({ taxPercent: Number(e.target.value), taxEnabled: Number(e.target.value) > 0 ? true : form.taxEnabled })} />
              </Field>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="ui-section-title"><TranslatedText text="Contract & payment" /></h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Minimum contract length (months)" hint="Shortest booking a driver can make, in months.">
                <input type="number" min={1} className={inputClass} value={form.minContractMonths} onChange={(e) => patch({ minContractMonths: Number(e.target.value) })} />
              </Field>
              <Field label="Maximum contract length (months)" hint="Longest booking a driver can make, in months.">
                <input type="number" min={1} className={inputClass} value={form.maxContractMonths} onChange={(e) => patch({ maxContractMonths: Number(e.target.value) })} />
              </Field>
              <Field label="Minimum truck spaces"><input type="number" min={1} className={inputClass} value={form.minSpaces} onChange={(e) => patch({ minSpaces: Number(e.target.value) })} /></Field>
              <Field label="Maximum truck spaces"><input type="number" min={1} className={inputClass} value={form.maxSpaces} onChange={(e) => patch({ maxSpaces: Number(e.target.value) })} /></Field>
              <Field label="How often payment is collected">
                <SearchableSelect
                  value={form.paymentFrequency || 'ONE_TIME'}
                  onChange={(value) => patch({ paymentFrequency: value as ParkingFeeSchedule['paymentFrequency'] })}
                  searchPlaceholder="Search payment frequency"
                  options={[
                    { value: 'ONE_TIME', label: 'One-time (full amount up front)' },
                    { value: 'MONTHLY', label: 'Monthly' },
                    { value: 'QUARTERLY', label: 'Every 3 months' },
                    { value: 'ANNUAL', label: 'Once a year' },
                  ]}
                />
              </Field>
              <Field label="When payment is due">
                <SearchableSelect
                  value={form.paymentDueType || 'DAYS_AFTER_INVOICE'}
                  onChange={(value) => patch({ paymentDueType: value as ParkingFeeSchedule['paymentDueType'] })}
                  searchPlaceholder="Search when payment is due"
                  options={[
                    { value: 'IMMEDIATELY', label: 'Due immediately' },
                    { value: 'BEFORE_RESERVATION', label: 'Due before the reservation starts' },
                    { value: 'ON_INVOICE_DATE', label: 'Due on the invoice date' },
                    { value: 'DAYS_AFTER_INVOICE', label: 'Due a number of days after the invoice' },
                    { value: 'DAYS_BEFORE_START', label: 'Due a number of days before start' },
                  ]}
                />
              </Field>
              <Field
                label={
                  form.paymentDueType === 'DAYS_BEFORE_START'
                    ? 'Days before reservation starts'
                    : form.paymentDueType === 'DAYS_AFTER_INVOICE'
                      ? 'Days after invoice'
                      : 'Number of days'
                }
                hint={
                  form.paymentDueType === 'DAYS_AFTER_INVOICE' || form.paymentDueType === 'DAYS_BEFORE_START'
                    ? 'Used with the payment due option above.'
                    : 'Only used when payment is due a number of days after the invoice or before start.'
                }
              >
                <input type="number" min={0} max={90} className={inputClass} value={form.paymentDueDays} onChange={(e) => patch({ paymentDueDays: Number(e.target.value) })} />
              </Field>
              <Field label="Grace period (0–30 days)">
                <input type="number" min={0} max={30} className={inputClass} value={form.gracePeriodDays} onChange={(e) => patch({ gracePeriodDays: Number(e.target.value) })} />
              </Field>
              <Field label="Late payment fee">
                <SearchableSelect
                  value={form.lateFeeType || 'NONE'}
                  onChange={(value) => patch({ lateFeeType: value as ParkingFeeSchedule['lateFeeType'] })}
                  searchPlaceholder="Search late fee option"
                  options={[
                    { value: 'NONE', label: 'No late fee' },
                    { value: 'FIXED', label: 'Fixed amount' },
                    { value: 'PERCENTAGE', label: 'Percentage of amount due' },
                  ]}
                />
              </Field>
              <Field label="Late fee value">
                <input type="number" min={0} step="0.01" className={inputClass} value={form.lateFeeValue} onChange={(e) => patch({ lateFeeValue: Number(e.target.value) })} />
              </Field>
              <Field label="Auto renewal">
                <SearchableSelect
                  value={form.autoRenewal ? 'yes' : 'no'}
                  onChange={(value) => patch({ autoRenewal: value === 'yes' })}
                  searchPlaceholder="Search auto renewal"
                  options={[
                    { value: 'yes', label: 'Yes, renew automatically' },
                    { value: 'no', label: 'No automatic renewal' },
                  ]}
                />
              </Field>
              <Field label="Cancellation allowed">
                <SearchableSelect
                  value={form.cancellationAllowed ? 'yes' : 'no'}
                  onChange={(value) => patch({ cancellationAllowed: value === 'yes' })}
                  searchPlaceholder="Search cancellation option"
                  options={[
                    { value: 'yes', label: 'Yes, cancellation is allowed' },
                    { value: 'no', label: 'No, cancellation is not allowed' },
                  ]}
                />
              </Field>
              <Field label="Cancellation notice (days)">
                <input type="number" min={0} className={inputClass} value={form.cancellationNoticeDays} onChange={(e) => patch({ cancellationNoticeDays: Number(e.target.value) })} />
              </Field>
              <Field label="Early termination allowed">
                <SearchableSelect
                  value={form.earlyTerminationAllowed ? 'yes' : 'no'}
                  onChange={(value) => patch({ earlyTerminationAllowed: value === 'yes' })}
                  searchPlaceholder="Search early termination"
                  options={[
                    { value: 'yes', label: 'Yes, early termination is allowed' },
                    { value: 'no', label: 'No, early termination is not allowed' },
                  ]}
                />
              </Field>
              <Field label="Refund eligible">
                <SearchableSelect
                  value={form.refundEligible ? 'yes' : 'no'}
                  onChange={(value) => patch({ refundEligible: value === 'yes' })}
                  searchPlaceholder="Search refund option"
                  options={[
                    { value: 'yes', label: 'Yes, refunds are eligible' },
                    { value: 'no', label: 'No, refunds are not eligible' },
                  ]}
                />
              </Field>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="ui-section-title"><TranslatedText text="Validity" /></h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Effective from">
                <input type="date" className={inputClass} value={form.effectiveFrom || ''} onChange={(e) => patch({ effectiveFrom: e.target.value })} />
              </Field>
              <Field label="Effective until">
                <input type="date" className={inputClass} value={form.effectiveUntil || ''} onChange={(e) => patch({ effectiveUntil: e.target.value })} />
              </Field>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="ui-section-title"><TranslatedText text="Customer information" /></h3>
            <Field label="Public pricing notes">
              <textarea rows={3} className={inputClass} value={form.feeNotes || ''} onChange={(e) => patch({ feeNotes: e.target.value })} />
            </Field>
            <Field label="Payment instructions">
              <textarea rows={4} className={inputClass} placeholder="Bank account, mobile money, or card terminal instructions" value={form.paymentInstructions || ''} onChange={(e) => patch({ paymentInstructions: e.target.value })} />
            </Field>
          </section>

          <section className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4">
            <h3 className="ui-section-title mb-4"><TranslatedText text="Quote preview" /></h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Field label="Truck spaces">
                <input type="number" min={form.minSpaces || 1} max={form.maxSpaces || 100} className={inputClass} value={spaces} onChange={(e) => setSpaces(Number(e.target.value))} />
              </Field>
              <Field label="Contract duration (months)">
                <input type="number" min={form.minContractMonths || 1} max={form.maxContractMonths || 12} className={inputClass} value={months} onChange={(e) => setMonths(Number(e.target.value))} />
              </Field>
            </div>
            <dl className="text-sm font-medium text-slate-600 dark:text-slate-300 space-y-1.5">
              <Row label="Truck spaces" value={String(preview.spaces)} />
              <Row label="Contract duration" value={`${preview.months} months`} />
              <Row label="Monthly rate / space" value={money(preview.monthlyRatePerSpace, form.currency)} />
              {form.longTermRate && form.longTermMonths && Number(months) >= Number(form.longTermMonths) && (
                <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  Long-term rate applied for {durationLabel(form.longTermMonths)} or longer.
                </p>
              )}
              <div className="border-t border-slate-200 dark:border-slate-700 my-2" />
              <Row label="Parking subtotal" value={money(preview.occupancyAmount, form.currency)} />
              <Row label="Administration fee" value={money(preview.reservationFeeAmount, form.currency)} />
              <Row label="Taxable amount" value={money(preview.subtotalAmount, form.currency)} />
              <Row label={`${preview.taxName || 'VAT'} ${preview.taxPercent}%`} value={money(preview.taxAmount, form.currency)} />
              <div className="border-t border-slate-200 dark:border-slate-700 my-2" />
              <div className="flex justify-between text-lg font-black text-slate-900 dark:text-white">
                <dt>Grand total</dt>
                <dd>{money(preview.totalAmount, form.currency)}</dd>
              </div>
            </dl>
            {showConverted && (
              <p className="text-xs font-semibold text-slate-500 mt-3">
                Billed in {form.currency}: {billed(preview.totalAmount, form.currency)}. Displayed in {preferredCurrency} using current rates.
              </p>
            )}
          </section>
        </div>
      </Modal>
    </div>
  );
};

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="block">
      <span className="ui-label block mb-2">{label}</span>
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

export default ParkingFeeSettings;
