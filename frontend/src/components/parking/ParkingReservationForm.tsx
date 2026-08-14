import { useMemo, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight } from 'lucide-react';
import { FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { TranslatedText } from '../translated-text';
import { parkingApi } from '../../services/parkingApi';
import { getApiErrorMessage } from '../../config/errorMessages';
import type { ParkingReservation } from '../../types/parking';
import { SignaturePad } from './SignaturePad';

const schema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  mcNumber: z.string().min(5, 'Enter a valid MC number').max(40),
  usdotNumber: z.string().min(5, 'Enter a valid USDOT number').max(40),
  companyPhone: z.string().min(7, 'Enter a valid phone number').max(40),
  email: z.string().email('Invalid email address'),
  driverFirstName: z.string().min(1, 'First name is required'),
  driverLastName: z.string().min(1, 'Last name is required'),
  truckSpacesRequested: z.coerce.number().int().min(1, 'At least 1 space is required').max(700),
  contractMonths: z.coerce.number().int().min(1, 'At least 1 month is required').max(60),
  requestedStartDate: z.string().min(1, 'Start date is required'),
  agreementAccepted: z.literal(true, { errorMap: () => ({ message: 'You must accept the agreement' }) }),
  signature: z
    .string()
    .regex(/^data:image\/(png|jpeg);base64,/, 'Please sign in the box using your mouse, finger, or stylus'),
  customerNotes: z.string().optional(),
  website: z.string().optional(),
});

export type ParkingReservationFormData = z.infer<typeof schema>;

const fieldClass =
  'w-full px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder:text-slate-400';
const labelClass = 'block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1';
const errorClass = 'mt-2 text-[10px] font-black text-red-600 uppercase tracking-wide px-1';

interface ParkingReservationFormProps {
  defaultValues?: Partial<ParkingReservationFormData>;
  onSuccess?: (reservation: ParkingReservation) => void;
  submitLabel?: string;
}

export function ParkingReservationForm({
  defaultValues,
  onSuccess,
  submitLabel = 'Submit Reservation',
}: ParkingReservationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const idempotencyKey = useMemo(
    () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`),
    [],
  );

  const form = useForm<ParkingReservationFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: '',
      mcNumber: '',
      usdotNumber: '',
      companyPhone: '',
      email: '',
      driverFirstName: '',
      driverLastName: '',
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

  const onSubmit = async (values: ParkingReservationFormData) => {
    try {
      setIsLoading(true);
      const response = await parkingApi.create(
        {
          ...values,
          customerNotes: values.customerNotes || undefined,
          idempotencyKey,
        },
        idempotencyKey,
      );
      toast.success(response.message || 'Reservation submitted. A confirmation email with your reference is on the way.');
      onSuccess?.(response.data);
    } catch (error) {
      toast.error(getApiErrorMessage(error) || "We couldn't submit your reservation request. Please review the information and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" noValidate>
      <input type="text" tabIndex={-1} autoComplete="off" className="hidden" {...form.register('website')} />

      <Section title="Company Information">
        <Field label="Company Name" error={form.formState.errors.companyName?.message}>
          <input className={fieldClass} {...form.register('companyName')} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="MC Number" error={form.formState.errors.mcNumber?.message}>
            <input className={fieldClass} {...form.register('mcNumber')} placeholder="MC123456" />
          </Field>
          <Field label="USDOT Number" error={form.formState.errors.usdotNumber?.message}>
            <input className={fieldClass} {...form.register('usdotNumber')} placeholder="1234567" />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Company Phone" error={form.formState.errors.companyPhone?.message}>
            <input className={fieldClass} {...form.register('companyPhone')} />
          </Field>
          <Field label="Email" error={form.formState.errors.email?.message}>
            <input type="email" className={fieldClass} {...form.register('email')} />
          </Field>
        </div>
      </Section>

      <Section title="Driver / Contact Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name" error={form.formState.errors.driverFirstName?.message}>
            <input className={fieldClass} {...form.register('driverFirstName')} />
          </Field>
          <Field label="Last Name" error={form.formState.errors.driverLastName?.message}>
            <input className={fieldClass} {...form.register('driverLastName')} />
          </Field>
        </div>
      </Section>

      <Section title="Parking Requirements">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Number of Truck Spaces" error={form.formState.errors.truckSpacesRequested?.message}>
            <input type="number" min={1} className={fieldClass} {...form.register('truckSpacesRequested')} />
          </Field>
          <Field label="Contract Duration (months)" error={form.formState.errors.contractMonths?.message}>
            <input type="number" min={1} className={fieldClass} {...form.register('contractMonths')} />
          </Field>
          <Field label="Requested Start Date" error={form.formState.errors.requestedStartDate?.message}>
            <input type="date" className={fieldClass} {...form.register('requestedStartDate')} />
          </Field>
        </div>
        <Field label="Additional notes (optional)">
          <textarea rows={3} className={fieldClass} {...form.register('customerNotes')} />
        </Field>
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
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}><TranslatedText text={label} /></label>
      {children}
      {error && <p className={errorClass}>{error}</p>}
    </div>
  );
}
