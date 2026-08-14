import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import logoUrutiXNew from '../assets/urutiX Logistics Logo (1).svg';
import logoUrutiXBackground from '../assets/logo-urutix.svg';
import { TranslatedText } from '../components/translated-text';
import { ParkingReservationForm } from '../components/parking/ParkingReservationForm';
import { PARKING_STATUS_LABELS, type ParkingReservation } from '../types/parking';

const ParkingReservationPage = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState<ParkingReservation | null>(null);

  return (
    <div className="min-h-screen flex items-start justify-center bg-gray-50 relative overflow-hidden antialiased py-10">
      <div className="fixed inset-0 bg-slate-50 z-0" />
      <img
        src={logoUrutiXBackground}
        alt=""
        className="pointer-events-none select-none fixed inset-0 w-full h-full object-cover opacity-10 z-0"
      />

      <div className="w-full max-w-3xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-center mb-8">
          <Link to="/">
            <img src={logoUrutiXNew} alt="UrutiX Logistics Logo" className="h-20 md:h-24 w-auto object-contain drop-shadow-lg" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-6 sm:px-8 pt-8 pb-4">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => navigate('/')}
                className="flex items-center text-[10px] text-primary-600 hover:text-primary-500 font-black uppercase tracking-widest transition-colors group"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1 group-hover:-translate-x-0.5 transition-transform" />
                <TranslatedText text="Back to home" />
              </button>
              <Link
                to="/parking-reservation/lookup"
                className="text-[10px] text-primary-600 hover:text-primary-500 font-black uppercase tracking-widest"
              >
                <TranslatedText text="Look up reservation" />
              </Link>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-1 font-manrope tracking-tight">
              <TranslatedText text="Reserve Truck Parking" />
            </h1>
            <p className="text-sm font-medium text-slate-500">
              <TranslatedText text="Submit your truck parking reservation request and our parking team will review availability and confirm the next steps." />
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
                  <TranslatedText text="Your truck parking reservation request has been successfully submitted." />
                </p>
                <div className="text-left bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2 mb-6">
                  <Row label="Reservation Reference" value={submitted.reservationReference} />
                  <Row label="Requested Start Date" value={String(submitted.requestedStartDate).slice(0, 10)} />
                  <Row label="Number of Truck Spaces" value={String(submitted.truckSpacesRequested)} />
                  <Row label="Contract Duration" value={`${submitted.contractMonths} month(s)`} />
                  <Row label="Current Status" value={PARKING_STATUS_LABELS[submitted.status] || submitted.status} />
                </div>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-primary-600 text-white font-black uppercase tracking-widest py-3 px-4 rounded-xl hover:bg-primary-700 text-[11px]"
                >
                  <TranslatedText text="Return home" />
                </button>
              </div>
            ) : (
              <ParkingReservationForm onSuccess={setSubmitted} />
            )}
          </div>
        </div>
      </div>
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
