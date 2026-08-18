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
import { calculateParkingFeeQuote } from '../../utils/parkingQuote';
import { Modal } from '../../components/EnliteUI';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../../components/EnliteUI/Tables';

const today = () => new Date().toISOString().slice(0, 10);

const STATUS_LABELS: Record<ParkingFeeScheduleStatus, string> = {
  DRAFT: 'Draft',
  SCHEDULED: 'Scheduled',
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
  ARCHIVED: 'Archived',
};

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

const COUNTRIES = [
  { code: 'RW', name: 'Rwanda' },
  { code: 'KE', name: 'Kenya' },
  { code: 'UG', name: 'Uganda' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'BI', name: 'Burundi' },
  { code: 'SS', name: 'South Sudan' },
  { code: 'CD', name: 'DR Congo' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'ZM', name: 'Zambia' },
  { code: 'MW', name: 'Malawi' },
];

function countryValue(value?: string) {
  const raw = (value || '').trim();
  if (!raw) return '';
  const match = COUNTRIES.find(
    (item) => item.name.toLowerCase() === raw.toLowerCase() || item.code.toLowerCase() === raw.toLowerCase(),
  );
  return match?.name || raw;
}

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
    if (!form.currency || !/^[A-Z]{3}$/.test(form.currency)) return 'Currency must be a valid ISO 4217 code.';
    if (Number(form.monthlyRatePerSpace) <= 0) return 'Monthly rate per truck space must be greater than 0.';
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
    longTermRate: form.longTermRate == null ? undefined : Number(form.longTermRate),
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
        monthlyRatePerSpace: Number(form.monthlyRatePerSpace || 0),
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
            {[row.facilityName, row.city, countryValue(row.country)].filter(Boolean).join(' · ')} · v{row.version || 1}
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
    { key: 'spaceType', label: 'Space type', render: (v) => String(v || 'TRUCK_SPACE').replace(/_/g, ' ') },
    { key: 'vehicleType', label: 'Vehicle', render: (v) => String(v || 'TRUCK') },
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
              <Field label="Fee schedule name">
                <input className={inputClass} value={form.name || ''} onChange={(e) => patch({ name: e.target.value })} />
              </Field>
              <Field label="Space type">
                <select className={inputClass} value={form.spaceType} onChange={(e) => patch({ spaceType: e.target.value })}>
                  <option value="TRUCK_SPACE">Truck space</option>
                  <option value="OVERSIZE">Oversize</option>
                </select>
              </Field>
              <Field label="Vehicle type">
                <select className={inputClass} value={form.vehicleType} onChange={(e) => patch({ vehicleType: e.target.value })}>
                  <option value="TRUCK">Truck</option>
                  <option value="TRAILER">Trailer</option>
                  <option value="CONTAINER">Container</option>
                </select>
              </Field>
              <Field label="Currency (ISO 4217)">
                <select className={inputClass} value={form.currency} onChange={(e) => patch({ currency: e.target.value })}>
                  {currencyOptions.map((c) => (
                    <option key={c.code} value={c.code}>{c.flag ? `${c.flag} ` : ''}{c.code} — {c.name}</option>
                  ))}
                </select>
                {rateLabel(form.currency) && <p className="text-[11px] font-semibold text-slate-500 mt-1.5">{rateLabel(form.currency)}</p>}
              </Field>
              <Field label="Status">
                <input className={inputClass} value={`${status}${form.version ? ` · v${form.version}` : ''}`} readOnly />
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
              <Field label="Country">
                <select
                  className={inputClass}
                  value={countryValue(form.country)}
                  onChange={(e) => patch({ country: e.target.value })}
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map((item) => (
                    <option key={item.code} value={item.name}>{item.name}</option>
                  ))}
                  {form.country && !COUNTRIES.some((item) => countryValue(item.name) === countryValue(form.country) || item.code === form.country) && (
                    <option value={countryValue(form.country)}>{countryValue(form.country)}</option>
                  )}
                </select>
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
              <Field label="Daily rate (optional)">
                <input type="number" min={0} step="0.01" className={inputClass} value={form.dailyRate ?? ''} onChange={(e) => patch({ dailyRate: e.target.value === '' ? null : Number(e.target.value) })} />
              </Field>
              <Field label="Weekly rate (optional)">
                <input type="number" min={0} step="0.01" className={inputClass} value={form.weeklyRate ?? ''} onChange={(e) => patch({ weeklyRate: e.target.value === '' ? null : Number(e.target.value) })} />
              </Field>
              <Field label="Long-term contract rate (optional)">
                <input type="number" min={0} step="0.01" className={inputClass} value={form.longTermRate ?? ''} onChange={(e) => patch({ longTermRate: e.target.value === '' ? null : Number(e.target.value) })} />
              </Field>
              <Field label="Reservation / admin fee type">
                <select className={inputClass} value={form.reservationFeeType} onChange={(e) => patch({ reservationFeeType: e.target.value as ParkingFeeSchedule['reservationFeeType'] })}>
                  <option value="FIXED">Fixed amount</option>
                  <option value="PERCENTAGE">Percentage</option>
                </select>
              </Field>
              <Field label={form.reservationFeeType === 'PERCENTAGE' ? 'Fee value (%)' : `Fee value (${form.currency})`}>
                <input type="number" min={0} step="0.01" className={inputClass} value={feeValue} onChange={(e) => patch({ reservationFeeValue: Number(e.target.value), reservationFee: Number(e.target.value) })} />
                {showConverted && form.reservationFeeType === 'FIXED' && <p className="text-[11px] font-semibold text-slate-500 mt-1.5">≈ {converted(feeValue, form.currency)}</p>}
              </Field>
              <Field label="Fee application">
                <select className={inputClass} value={form.reservationFeeApplication} onChange={(e) => patch({ reservationFeeApplication: e.target.value as ParkingFeeSchedule['reservationFeeApplication'] })}>
                  <option value="PER_RESERVATION">Per reservation</option>
                  <option value="PER_SPACE">Per truck space</option>
                  <option value="PERCENT_OF_SUBTOTAL">Percentage of parking subtotal</option>
                </select>
              </Field>
              <Field label="Tax enabled">
                <select className={inputClass} value={form.taxEnabled ? 'yes' : 'no'} onChange={(e) => patch({ taxEnabled: e.target.value === 'yes' })}>
                  <option value="yes">Enabled</option>
                  <option value="no">Disabled</option>
                </select>
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
              <Field label="Minimum months"><input type="number" min={1} className={inputClass} value={form.minContractMonths} onChange={(e) => patch({ minContractMonths: Number(e.target.value) })} /></Field>
              <Field label="Maximum months"><input type="number" min={1} className={inputClass} value={form.maxContractMonths} onChange={(e) => patch({ maxContractMonths: Number(e.target.value) })} /></Field>
              <Field label="Minimum truck spaces"><input type="number" min={1} className={inputClass} value={form.minSpaces} onChange={(e) => patch({ minSpaces: Number(e.target.value) })} /></Field>
              <Field label="Maximum truck spaces"><input type="number" min={1} className={inputClass} value={form.maxSpaces} onChange={(e) => patch({ maxSpaces: Number(e.target.value) })} /></Field>
              <Field label="Payment frequency">
                <select className={inputClass} value={form.paymentFrequency} onChange={(e) => patch({ paymentFrequency: e.target.value as ParkingFeeSchedule['paymentFrequency'] })}>
                  <option value="ONE_TIME">One-time</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="ANNUAL">Annual</option>
                </select>
              </Field>
              <Field label="Payment due">
                <select className={inputClass} value={form.paymentDueType} onChange={(e) => patch({ paymentDueType: e.target.value as ParkingFeeSchedule['paymentDueType'] })}>
                  <option value="IMMEDIATELY">Due immediately</option>
                  <option value="BEFORE_RESERVATION">Due before reservation</option>
                  <option value="ON_INVOICE_DATE">Due on invoice date</option>
                  <option value="DAYS_AFTER_INVOICE">Due X days after invoice</option>
                  <option value="DAYS_BEFORE_START">Due X days before reservation start</option>
                </select>
              </Field>
              <Field label="Payment due days">
                <input type="number" min={0} max={90} className={inputClass} value={form.paymentDueDays} onChange={(e) => patch({ paymentDueDays: Number(e.target.value) })} />
              </Field>
              <Field label="Grace period (0–30 days)">
                <input type="number" min={0} max={30} className={inputClass} value={form.gracePeriodDays} onChange={(e) => patch({ gracePeriodDays: Number(e.target.value) })} />
              </Field>
              <Field label="Late payment fee">
                <select className={inputClass} value={form.lateFeeType} onChange={(e) => patch({ lateFeeType: e.target.value as ParkingFeeSchedule['lateFeeType'] })}>
                  <option value="NONE">No late fee</option>
                  <option value="FIXED">Fixed amount</option>
                  <option value="PERCENTAGE">Percentage</option>
                </select>
              </Field>
              <Field label="Late fee value">
                <input type="number" min={0} step="0.01" className={inputClass} value={form.lateFeeValue} onChange={(e) => patch({ lateFeeValue: Number(e.target.value) })} />
              </Field>
              <Field label="Auto renewal">
                <select className={inputClass} value={form.autoRenewal ? 'yes' : 'no'} onChange={(e) => patch({ autoRenewal: e.target.value === 'yes' })}>
                  <option value="yes">Enabled</option>
                  <option value="no">Disabled</option>
                </select>
              </Field>
              <Field label="Cancellation allowed">
                <select className={inputClass} value={form.cancellationAllowed ? 'yes' : 'no'} onChange={(e) => patch({ cancellationAllowed: e.target.value === 'yes' })}>
                  <option value="yes">Allowed</option>
                  <option value="no">Not allowed</option>
                </select>
              </Field>
              <Field label="Cancellation notice (days)">
                <input type="number" min={0} className={inputClass} value={form.cancellationNoticeDays} onChange={(e) => patch({ cancellationNoticeDays: Number(e.target.value) })} />
              </Field>
              <Field label="Early termination allowed">
                <select className={inputClass} value={form.earlyTerminationAllowed ? 'yes' : 'no'} onChange={(e) => patch({ earlyTerminationAllowed: e.target.value === 'yes' })}>
                  <option value="yes">Allowed</option>
                  <option value="no">Not allowed</option>
                </select>
              </Field>
              <Field label="Refund eligible">
                <select className={inputClass} value={form.refundEligible ? 'yes' : 'no'} onChange={(e) => patch({ refundEligible: e.target.value === 'yes' })}>
                  <option value="yes">Eligible</option>
                  <option value="no">Not eligible</option>
                </select>
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="ui-label block mb-2">{label}</span>
      {children}
    </label>
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
