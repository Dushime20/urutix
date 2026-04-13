import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaShieldAlt, FaDollarSign, FaClock, FaMapMarkerAlt, FaTruck, FaUser } from 'react-icons/fa';
import { Package, ArrowLeft, ArrowRight } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const BookingConfirmation: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!matchId) return;
    const fetchMatch = async () => {
      try {
        // Fetch the LoadMatch record with load + truck details
        const res = await api.get(`/matching/truck-owner/matches`);
        const body = res.data;
        const all: any[] = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
        const found = all.find((m: any) => m.id === matchId);
        if (found) {
          setMatch(found);
        } else {
          // Try fetching directly if not in list
          const direct = await api.get(`/matching/${matchId}`).catch(() => null);
          setMatch(direct?.data?.data || direct?.data || null);
        }
      } catch {
        toast.error('Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();
  }, [matchId]);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await api.post(`/matching/${matchId}/create-trip`);
      toast.success('Booking confirmed — trip created');
      navigate('/dashboard/tracking');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to confirm booking');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#345E85]/20 border-t-[#345E85] rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading booking details...</p>
      </div>
    </div>
  );

  if (!match) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <FaTimesCircle className="text-red-400 text-4xl" />
      <p className="text-sm font-black text-slate-700">Booking not found</p>
      <button onClick={() => navigate('/dashboard/smart-matching')}
        className="px-4 py-2 bg-[#345E85] text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
        Back to Matching
      </button>
    </div>
  );

  const load = match.load;
  const truck = match.truck;
  const matchDetails = match.matchDetails || {};

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/dashboard/smart-matching')}
          className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Booking Confirmation</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Review and confirm your booking details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cargo Details */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-[#345E85]" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Cargo Details</h2>
          </div>
          {load ? (
            <div className="space-y-3">
              <Row label="Title" value={load.title || `Cargo ${load.id?.slice(0, 8)}`} />
              <Row label="Weight" value={`${Number(load.weight).toLocaleString()} kg`} />
              <Row label="Type" value={load.cargoType || 'General'} />
              <Row label="Value" value={load.loadValue ? `$${Number(load.loadValue).toLocaleString()}` : '—'} />
              <Row label="Pickup" value={load.origin?.city || load.pickupLocation?.name || '—'} />
              <Row label="Delivery" value={load.destination?.city || load.deliveryLocation?.name || '—'} />
              <Row label="Pickup Date" value={load.pickupDate ? new Date(load.pickupDate).toLocaleDateString() : '—'} />
            </div>
          ) : (
            <p className="text-xs text-slate-400">Load details unavailable</p>
          )}
        </div>

        {/* Truck Details */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <FaTruck className="text-[#345E85]" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Truck Details</h2>
          </div>
          {truck ? (
            <div className="space-y-3">
              <Row label="Plate" value={truck.plateNumber || '—'} />
              <Row label="Make / Model" value={`${truck.make || ''} ${truck.model || ''}`.trim() || '—'} />
              <Row label="Type" value={truck.truckType || '—'} />
              <Row label="Capacity" value={`${Number(truck.capacityWeight).toLocaleString()} kg`} />
              <Row label="GPS" value={truck.hasGps ? '✅ Yes' : '❌ No'} />
              <Row label="Refrigeration" value={truck.hasRefrigeration ? '✅ Yes' : '❌ No'} />
            </div>
          ) : (
            <p className="text-xs text-slate-400">Truck details unavailable</p>
          )}
        </div>

        {/* Match Summary */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <FaCheckCircle className="text-green-500" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Match Summary</h2>
          </div>
          <div className="space-y-3">
            <Row label="Match Score" value={`${Math.round((match.score || 0) * 100)}%`} highlight />
            <Row label="Estimated Cost" value={matchDetails.estimatedCost ? `$${Number(matchDetails.estimatedCost).toLocaleString()}` : '—'} />
            <Row label="Distance" value={matchDetails.distanceKm ? `${matchDetails.distanceKm} km` : '—'} />
            <Row label="Match Reason" value={matchDetails.matchReason || '—'} />
            <Row label="Status" value={match.status} />
          </div>
        </div>

        {/* Payment & Terms */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <FaShieldAlt className="text-[#345E85]" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Payment & Terms</h2>
          </div>
          <div className="space-y-4">
            {[
              { icon: FaDollarSign, color: 'text-green-500', title: 'Payment Method', desc: 'Payment held in escrow until delivery confirmation' },
              { icon: FaClock, color: 'text-blue-500', title: 'Delivery Timeline', desc: 'Delivery must be completed within the agreed schedule' },
              { icon: FaShieldAlt, color: 'text-purple-500', title: 'Insurance', desc: 'Full insurance coverage required for this shipment' },
              { icon: FaMapMarkerAlt, color: 'text-red-500', title: 'Tracking', desc: 'Real-time GPS tracking throughout the journey' },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <Icon className={`${color} mt-0.5 shrink-0`} />
                <div>
                  <p className="text-xs font-black text-slate-700">{title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">
          Confirming will create a trip and notify the truck owner
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/dashboard/smart-matching')}
            className="px-5 py-3 border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors flex items-center gap-2">
            <FaTimesCircle /> Cancel
          </button>
          <button onClick={handleConfirm} disabled={confirming}
            className="px-6 py-3 bg-[#345E85] hover:bg-slate-800 disabled:bg-slate-200 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2">
            {confirming
              ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Confirming...</>
              : <><FaCheckCircle /> Confirm Booking <ArrowRight className="w-3.5 h-3.5" /></>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
    <span className={`text-xs font-black ${highlight ? 'text-[#345E85]' : 'text-slate-700'}`}>{value}</span>
  </div>
);

export default BookingConfirmation;
