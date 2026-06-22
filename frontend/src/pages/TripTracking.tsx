/**
 * TripTracking page — /dashboard/trip-tracking/:tripId
 *
 * Wraps the TripTracker component inside the standard layout.
 * Accessible by Cargo Owner, Truck Owner, Broker, Admin.
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TripTracker } from '../components/TripTracker/TripTracker';

const TripTrackingPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();

  if (!tripId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
          No trip ID specified.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#345E85] text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
        >
          <ArrowLeft size={14} /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-3 sm:px-4 lg:px-0">
      {/* Back navigation */}
      <div className="mb-4 sm:mb-6 pt-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-[#345E85] text-[10px] font-black uppercase tracking-widest transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      <TripTracker tripId={tripId} />
    </div>
  );
};

export default TripTrackingPage;
