import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight } from 'lucide-react';
import { FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { TranslatedText } from '../translated-text';
import { parkingApi } from '../../services/parkingApi';
import { getApiErrorMessage } from '../../config/errorMessages';
import type { ParkingFacilitySearchResult, ParkingReservation } from '../../types/parking';
import { SignaturePad } from './SignaturePad';
import { ParkingFacilitySelector } from './ParkingFacilitySelector';
import { calculateParkingFeeQuote } from '../../utils/parkingQuote';
import { formatParkingMoney } from '../../types/parking';
import { worldCountries } from '../../lib/countries';
import { isValidOperatorId, operatorIdentityForCountry } from '../../lib/parkingOperatorIdentity';
import { SearchableSelect } from '../EnliteUI';

const schema = z
  .object({
    parkingFacilityId: z.string().uuid('Select a parking location'),
    companyName: z.string().min(2, 'Company name is required'),
    companyCountry: z.string().length(2, 'Select the company country of registration'),
    mcNumber: z.string().max(40).optional().default(''),
    usdotNumber: z.string().max(40).optional().default(''),
    companyPhone: z.string().min(7, 'Enter a valid phone number').max(40),
    email: z.string().email('Invalid company email'),
    driverFirstName: z.string().min(1, 'First name is required'),
    driverLastName: z.string().min(1, 'Last name is required'),
    driverEmail: z.string().email('Enter a valid driver email'),
    truckSpacesRequested: z.coerce.number().int().min(1, 'At least 1 space is required').max(700),
    contractMonths: z.coerce.number().int().min(1, 'At least 1 month is required').max(60),
    requestedStartDate: z.string().min(1, 'Start date is required'),
    agreementAccepted: z.literal(true, { errorMap: () => ({ message: 'You must accept the agreement' }) }),
    signature: z
      .string()
      .regex(/^data:image\/(png|jpeg);base64,/, 'Please sign in the box using your mouse, finger, or stylus'),
    customerNotes: z.string().optional(),
    website: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const profile = operatorIdentityForCountry(data.companyCountry);
    if (!isValidOperatorId(data.mcNumber || '', profile.primary)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['mcNumber'],
        message: `Enter a valid ${profile.primary.label}`,
      });
    }
    if (profile.secondary && !isValidOperatorId(data.usdotNumber || '', profile.secondary)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['usdotNumber'],
        message: `Enter a valid ${profile.secondary.label}`,
      });
    }
  });

export type ParkingReservationFormData = z.infer<typeof schema>;

const fieldClass =
  'w-full px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder:text-slate-400';
const labelClass = 'block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1';
const errorClass = 'mt-2 text-[10px] font-black text-red-600 uppercase tracking-wide px-1';

interface ParkingReservationFormProps {
  defaultValues?: Partial<ParkingReservationFormData>;
  onSuccess?: (reservation: ParkingReservation, meta?: { emailSent?: boolean; emailedTo?: string[] }) => void;
  submitLabel?: string;
}

export function ParkingReservationForm({
  defaultValues,
  onSuccess,
  submitLabel = 'Submit Reservation',
}: ParkingReservationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [facility, setFacility] = useState<ParkingFacilitySearchResult | null>(null);
  const facilityId = (facility?.id || '').trim();
  const pricingQuery = useQuery({
    queryKey: ['parking-public-pricing', facilityId],
    queryFn: () => parkingApi.publicPricing(facilityId),
    enabled: !!facilityId,
  });
  const pricing = pricingQuery.data;
  const idempotencyKey = useMemo(
    () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`),
    [],
  );

  const form = useForm<ParkingReservationFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      parkingFacilityId: '',
      companyName: '',
      companyCountry: '',
      mcNumber: '',
      usdotNumber: '',
      companyPhone: '',
      email: '',
      driverFirstName: '',
      driverLastName: '',
      driverEmail: '',
      truckSpacesRequested: 1,
      contractMonths: 1,
      requestedStartDate: '',
      agreementAccepted: undefined as unknown as true,
      signature: '',
      customerNotes: '',
      website: '',
      ...defaultValues,
    },
  });

  const countries = useMemo(() => worldCountries(), []);
  const countryOptions = useMemo(
    () => countries.map((country) => ({ value: country.code, label: country.name, description: country.code })),
    [countries],
  );
  const countryCode = form.watch('companyCountry');
  const identity = useMemo(
    () => (countryCode ? operatorIdentityForCountry(countryCode) : null),
    [countryCode],
  );
  const previousCountry = useRef(countryCode);
  useEffect(() => {
    if (previousCountry.current && previousCountry.current !== countryCode) {
      form.setValue('mcNumber', '');
      form.setValue('usdotNumber', '');
    }
    previousCountry.current = countryCode;
  }, [countryCode, form]);
  const spaces = Number(form.watch('truckSpacesRequested') || 1);
  const months = Number(form.watch('contractMonths') || 1);
  const quote = useMemo(() => {
    if (!pricing) return null;
    return calculateParkingFeeQuote({
      spaces: Math.max(1, spaces),
      months: Math.max(1, months),
      monthlyRatePerSpace: pricing.monthlyRatePerSpace,
      reservationFee: pricing.reservationFeeValue || 0,
      reservationFeeType: pricing.reservationFeeType,
      reservationFeeApplication: pricing.reservationFeeApplication,
      taxPercent: pricing.taxPercent || 0,
      taxEnabled: pricing.taxEnabled,
      taxName: pricing.taxName,
      currency: pricing.currency,
    });
  }, [pricing, spaces, months]);

  const applyFacility = useCallback((next: ParkingFacilitySearchResult | null) => {
    setFacility(next);
    const id = (next?.id || '').trim();
    form.setValue('parkingFacilityId', id, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
    if (id) {
      form.clearErrors('parkingFacilityId');
    }
  }, [form]);

  const onSubmit = async (values: ParkingReservationFormData) => {
    try {
      setIsLoading(true);
      const response = await parkingApi.create(
        {
          ...values,
          parkingFacilityId: facilityId || values.parkingFacilityId,
          customerNotes: values.customerNotes || undefined,
          idempotencyKey,
        },
        idempotencyKey,
      );
      toast.success(
        response.emailSent === false
          ? `Reservation submitted (${response.data?.reservationReference || 'saved'}). We could not send the confirmation email — save your reference and contact the parking team if you do not receive it.`
          : response.message || 'Reservation submitted. A confirmation email with your reference was sent to the driver email.',
      );
      onSuccess?.(response.data, { emailSent: response.emailSent, emailedTo: response.emailedTo });
    } catch (error) {
      toast.error(getApiErrorMessage(error) || "We couldn't submit your reservation request. Please review the information and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" noValidate>
      <input type="text" tabIndex={-1} autoComplete="off" className="hidden" {...form.register('website')} />

      <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
        <ParkingFacilitySelector
          value={facility}
          onChange={applyFacility}
          error={facilityId ? undefined : form.formState.errors.parkingFacilityId?.message}
        />
      </div>

      <Section title="Company Information">
        <Field label="Company Name" error={form.formState.errors.companyName?.message}>
          <input className={fieldClass} {...form.register('companyName')} />
        </Field>
        <Field
          label="Country of registration"
          hint="Operator documents change by country. Select where the company is registered."
          error={form.formState.errors.companyCountry?.message}
        >
          <SearchableSelect
            value={countryCode || ''}
            onChange={(value) => {
              form.setValue('companyCountry', value, {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true,
              });
              if (value) form.clearErrors('companyCountry');
            }}
            options={countryOptions}
            placeholder="Search and select a country"
            searchPlaceholder="Type a country name or code"
            emptyMessage="No country matches that search"
            allowClear
            triggerClassName={fieldClass}
          />
        </Field>
        {identity && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label={identity.primary.label}
              hint={identity.primary.hint}
              error={form.formState.errors.mcNumber?.message}
            >
              <input
                className={fieldClass}
                {...form.register('mcNumber')}
                placeholder={identity.primary.placeholder}
              />
            </Field>
            {identity.secondary && (
              <Field
                label={identity.secondary.required ? identity.secondary.label : `${identity.secondary.label} (optional)`}
                hint={identity.secondary.hint}
                error={form.formState.errors.usdotNumber?.message}
              >
                <input
                  className={fieldClass}
                  {...form.register('usdotNumber')}
                  placeholder={identity.secondary.placeholder}
                />
              </Field>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Company Phone" error={form.formState.errors.companyPhone?.message}>
            <input className={fieldClass} {...form.register('companyPhone')} />
          </Field>
          <Field
            label="Company Email"
            hint="For company records. A copy of notifications is also sent here if it is different from the driver email."
            error={form.formState.errors.email?.message}
          >
            <input type="email" autoComplete="organization" className={fieldClass} {...form.register('email')} />
          </Field>
        </div>
      </Section>

      <Section title="Driver / Contact Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name" error={form.formState.errors.driverFirstName?.message}>
            <input className={fieldClass} autoComplete="given-name" {...form.register('driverFirstName')} />
          </Field>
          <Field label="Last Name" error={form.formState.errors.driverLastName?.message}>
            <input className={fieldClass} autoComplete="family-name" {...form.register('driverLastName')} />
          </Field>
        </div>
        <Field
          label="Driver Email"
          hint="All reservation notifications go here. If this driver already has an UrutiX account, they also receive in-app and message alerts for every status change."
          error={form.formState.errors.driverEmail?.message}
        >
          <input type="email" autoComplete="email" className={fieldClass} placeholder="driver@email.com" {...form.register('driverEmail')} />
        </Field>
      </Section>

      <Section title="Parking Requirements">
        {!facility && (
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            <TranslatedText text="Select a parking location to see availability, pricing and reservation rules for that facility." />
          </p>
        )}
        {facility && pricingQuery.isError && (
          <p className="text-sm font-semibold text-rose-600">
            <TranslatedText text="Unable to load pricing for this parking facility. Please try another location or try again." />
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Number of Truck Spaces" error={form.formState.errors.truckSpacesRequested?.message}>
            <input type="number" min={pricing?.minSpaces || 1} max={pricing?.maxSpaces || 700} className={fieldClass} {...form.register('truckSpacesRequested')} />
          </Field>
          <Field label="Contract Duration (months)" error={form.formState.errors.contractMonths?.message}>
            <input type="number" min={pricing?.minContractMonths || 1} max={pricing?.maxContractMonths || 60} className={fieldClass} {...form.register('contractMonths')} />
          </Field>
          <Field label="Requested Start Date" error={form.formState.errors.requestedStartDate?.message}>
            <input type="date" className={fieldClass} {...form.register('requestedStartDate')} />
          </Field>
        </div>
        <Field label="Additional notes (optional)">
          <textarea rows={3} className={fieldClass} {...form.register('customerNotes')} />
        </Field>
        {facility && pricing && typeof pricing.availableSpaces === 'number' && (
          <p className={`text-sm font-semibold ${pricing.isAvailable === false ? 'text-amber-700' : 'text-slate-600 dark:text-slate-300'}`}>
            {pricing.facilityName}: {pricing.availableSpaces} {pricing.availableSpaces === 1 ? 'space' : 'spaces'} available
            {pricing.currency ? ` · ${pricing.currency}` : ''}
            {pricing.monthlyRatePerSpace ? ` · ${formatParkingMoney(pricing.monthlyRatePerSpace, pricing.currency)} / space / month` : ''}
          </p>
        )}
        {pricing?.feeNotes && (
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{pricing.feeNotes}</p>
        )}
        {pricing && !pricing.hasActiveSchedule && (
          <p className="text-sm font-semibold text-amber-700">Pricing is not currently active. The parking team must activate a fee schedule before this reservation can be completed.</p>
        )}
        {quote && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Quote preview</p>
            <div className="flex justify-between text-sm font-medium text-slate-600"><span>Parking subtotal</span><span>{formatParkingMoney(quote.occupancyAmount, quote.currency)}</span></div>
            <div className="flex justify-between text-sm font-medium text-slate-600"><span>Administration fee</span><span>{formatParkingMoney(quote.reservationFeeAmount, quote.currency)}</span></div>
            <div className="flex justify-between text-sm font-medium text-slate-600"><span>{quote.taxName || 'VAT'} {quote.taxPercent}%</span><span>{formatParkingMoney(quote.taxAmount, quote.currency)}</span></div>
            <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-1 border-t border-slate-200"><span>Grand total</span><span>{formatParkingMoney(quote.totalAmount, quote.currency)}</span></div>
          </div>
        )}
      </Section>

      <Section title="Authorization">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          <TranslatedText text="By submitting this reservation request, I confirm that the information provided is accurate and that this request represents my intent to do business with Nova Parking 365." />
        </p>
        <label className="flex items-start gap-3 mb-4">
          <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600" {...form.register('agreementAccepted')} />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            <TranslatedText text="I agree to the reservation declaration above." />
          </span>
        </label>
        {form.formState.errors.agreementAccepted && (
          <p className={errorClass}>{form.formState.errors.agreementAccepted.message}</p>
        )}
        <Field label="Digital Signature">
          <SignaturePad
            value={form.watch('signature')}
            onChange={(next) => form.setValue('signature', next, { shouldValidate: true, shouldDirty: true })}
            error={form.formState.errors.signature?.message}
          />
        </Field>
      </Section>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary-600 text-white font-black uppercase tracking-widest py-3 px-4 rounded-xl hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 shadow-lg shadow-primary-500/20 disabled:opacity-50 flex items-center justify-center space-x-2 text-[11px]"
      >
        {isLoading ? <FaSpinner className="animate-spin h-4 w-4" /> : (
          <>
            <span><TranslatedText text={submitLabel} /></span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
        <TranslatedText text={title} />
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}><TranslatedText text={label} /></label>
      {children}
      {hint && <p className="mt-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500 px-1 leading-relaxed">{hint}</p>}
      {error && <p className={errorClass}>{error}</p>}
    </div>
  );
}
