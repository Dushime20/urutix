import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import logoUrutiXBackground from '../assets/logo-urutix.svg';
import { TranslatedText } from '../components/translated-text';
import { PublicNavbar } from '../components/home/PublicNavbar';
import { ParkingReservationForm } from '../components/parking/ParkingReservationForm';
import { PARKING_STATUS_LABELS, type ParkingReservation } from '../types/parking';

const ParkingReservationPage = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState<ParkingReservation | null>(null);
  const [emailSent, setEmailSent] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased relative overflow-hidden">
      <PublicNavbar alwaysSolid />
      <img
        src={logoUrutiXBackground}
        alt=""
        className="pointer-events-none select-none fixed inset-0 w-full h-full object-cover opacity-10 z-0"
      />

      <main className="relative z-10 pt-24 lg:pt-28 pb-16">
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-6 sm:px-8 pt-8 pb-4">
              <h1 className="text-2xl font-black text-slate-900 mb-1 font-manrope tracking-tight">
                <TranslatedText text="Reserve Truck Parking" />
              </h1>
              <p className="text-sm font-medium text-slate-500">
                <TranslatedText text="Submit your truck parking reservation request and our parking team will review availability and confirm the next steps. You will receive your reservation reference and all status updates at the driver email." />
              </p>
            </div>

            <div className="px-6 sm:px-8 pb-8">
              {submitted ? (
                <div className="text-center py-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-full mb-4">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mb-2 font-manrope tracking-tight">
                    <TranslatedText text="Reservation Request Submitted" />
                  </h2>
                  <p className="text-sm font-medium text-slate-500 mb-6">
                    <TranslatedText
                      text={
                        emailSent
                          ? `A confirmation email with reference ${submitted.reservationReference} was sent to ${submitted.driverEmail || submitted.email}. Use that reference and the driver email to track your request.`
                          : `Your request was saved with reference ${submitted.reservationReference}, but the confirmation email could not be sent. Save this reference and contact the parking team if you do not receive an email at ${submitted.driverEmail || submitted.email}.`
                      }
                    />
                  </p>
                  <div className="text-left bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2 mb-6">
                    <Row label="Reservation Reference" value={submitted.reservationReference} />
                    <Row label="Requested Start Date" value={String(submitted.requestedStartDate).slice(0, 10)} />
                    <Row label="Number of Truck Spaces" value={String(submitted.truckSpacesRequested)} />
                    <Row label="Contract Duration" value={`${submitted.contractMonths} month(s)`} />
                    <Row label="Current Status" value={PARKING_STATUS_LABELS[submitted.status] || submitted.status} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Link
                      to="/parking-reservation/lookup"
                      className="inline-flex items-center justify-center w-full bg-primary-600 text-white font-black uppercase tracking-widest py-3 px-4 rounded-xl hover:bg-primary-700 text-[11px]"
                    >
                      <TranslatedText text="Track reservation" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => navigate('/')}
                      className="w-full border border-primary-200 text-primary-700 font-black uppercase tracking-widest py-3 px-4 rounded-xl hover:border-primary-400 text-[11px]"
                    >
                      <TranslatedText text="Return home" />
                    </button>
                  </div>
                </div>
              ) : (
                <ParkingReservationForm
                  onSuccess={(reservation, meta) => {
                    setEmailSent(meta?.emailSent !== false);
                    setSubmitted(reservation);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="font-black uppercase tracking-widest text-[10px] text-slate-400">{label}</span>
      <span className="font-bold text-slate-800 break-all text-right">{value}</span>
    </div>
  );
}

export default ParkingReservationPage;
