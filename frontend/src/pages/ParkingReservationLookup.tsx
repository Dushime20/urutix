import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import logoUrutiXBackground from '../assets/logo-urutix.svg';
import { TranslatedText } from '../components/translated-text';
import { PublicNavbar } from '../components/home/PublicNavbar';
import { parkingApi } from '../services/parkingApi';
import { getApiErrorMessage } from '../config/errorMessages';
import { PARKING_STATUS_LABELS, formatParkingMoney, isParkingPaymentOpen, type ParkingReservation } from '../types/parking';
import { StatusBadge } from '../components/EnliteUI/Tables';
import { ParkingActivityTimeline } from '../components/parking/ParkingActivityTimeline';
import { ParkingPaymentCard } from '../components/parking/ParkingPaymentCard';
import { ParkingIshemaPayModal } from '../components/parking/ParkingIshemaPayModal';

const schema = z.object({
  reservationReference: z.string().min(5, 'Reservation reference is required'),
  email: z.string().email('Invalid email address'),
  response: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const ParkingReservationLookupPage = () => {
  const [loading, setLoading] = useState(false);
  const [reservation, setReservation] = useState<ParkingReservation | null>(null);
  const [responding, setResponding] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { reservationReference: '', email: '', response: '' },
  });

  const lookup = async (values: FormData) => {
    try {
      setLoading(true);
      const data = await parkingApi.lookup(values.reservationReference.toUpperCase(), values.email);
      setReservation(data);
    } catch (error) {
      setReservation(null);
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const respond = async () => {
    if (!reservation) return;
    const response = form.getValues('response') || '';
    if (response.trim().length < 5) {
      toast.error('Please enter the requested information.');
      return;
    }
    try {
      setResponding(true);
      const data = await parkingApi.guestRespond(
        reservation.reservationReference,
        form.getValues('email') || reservation.driverEmail || reservation.email,
        response,
      );
      setReservation(data);
      toast.success('Your response has been submitted.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setResponding(false);
    }
  };

  const confirmedAndPayable =
    reservation?.status === 'APPROVED' && isParkingPaymentOpen(reservation.payment?.status);

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased relative overflow-hidden">
      <PublicNavbar alwaysSolid />
      <img
        src={logoUrutiXBackground}
        alt=""
        className="pointer-events-none select-none fixed inset-0 w-full h-full object-cover opacity-10 z-0"
      />

      <main className="relative z-10 pt-24 lg:pt-28 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-6 sm:px-8 pt-8 pb-4">
              <h1 className="text-2xl font-black text-slate-900 font-manrope tracking-tight mb-1">
                <TranslatedText text="Look Up Reservation" />
              </h1>
              <p className="text-sm font-medium text-slate-500">
                <TranslatedText text="Enter the reservation reference and the driver email from your confirmation. The company email also works." />
              </p>
            </div>
            <form onSubmit={form.handleSubmit(lookup)} className="px-6 sm:px-8 pb-8 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Reference</label>
                <input className="w-full px-4 py-2.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl" placeholder="PR-2026-000123" {...form.register('reservationReference')} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Driver email</label>
                <input type="email" className="w-full px-4 py-2.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl" placeholder="The email that received the confirmation" {...form.register('email')} />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-primary-600 text-white font-black uppercase tracking-widest py-3 rounded-xl text-[11px] disabled:opacity-50">
                {loading ? <FaSpinner className="inline animate-spin" /> : <TranslatedText text="Find reservation" />}
              </button>
            </form>

            {reservation && (
              <div className="px-6 sm:px-8 pb-8 space-y-5">
                <div className="flex items-center justify-between">
                  <p className="font-black text-slate-900">{reservation.reservationReference}</p>
                  <StatusBadge status={reservation.status} label={PARKING_STATUS_LABELS[reservation.status]} />
                </div>
                <p className="text-sm font-medium text-slate-600">{reservation.companyName} · {reservation.truckSpacesRequested} spaces · {reservation.contractMonths} months</p>
                <p className="text-sm font-medium text-slate-600">Start date: {String(reservation.requestedStartDate).slice(0, 10)}</p>
                {reservation.status === 'ADDITIONAL_INFORMATION_REQUIRED' && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Information required</p>
                    <p className="text-sm font-medium text-slate-700">{reservation.informationRequested}</p>
                    <textarea rows={4} className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl" {...form.register('response')} />
                    <button type="button" onClick={respond} disabled={responding} className="w-full bg-primary-600 text-white font-black uppercase tracking-widest py-2.5 rounded-xl text-[11px]">
                      {responding ? <FaSpinner className="inline animate-spin" /> : <TranslatedText text="Submit response" />}
                    </button>
                  </div>
                )}
                {confirmedAndPayable && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Reservation confirmed — payment required</p>
                    <p className="text-sm font-medium text-slate-700">
                      Pay {formatParkingMoney(reservation.payment?.totalAmount, reservation.payment?.currency)} with Ishema to complete this reservation.
                    </p>
                    <button
                      type="button"
                      onClick={() => setPayOpen(true)}
                      className="w-full bg-primary-600 text-white font-black uppercase tracking-widest py-3 rounded-xl text-[11px]"
                    >
                      <TranslatedText text="Pay now" />
                    </button>
                  </div>
                )}
                <ParkingPaymentCard reservation={reservation} />
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Events and status</p>
                  <ParkingActivityTimeline activities={reservation.activities} />
                </div>
                <ParkingIshemaPayModal
                  open={payOpen}
                  onClose={() => setPayOpen(false)}
                  reservation={reservation}
                  lookup={{
                    reservationReference: reservation.reservationReference,
                    email: form.getValues('email') || reservation.driverEmail || reservation.email,
                  }}
                  onPaid={(updated) => {
                    setReservation(updated);
                    toast.success('Payment confirmed. Your reservation is approved.');
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ParkingReservationLookupPage;
