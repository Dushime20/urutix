/**
 * Book leftover truck space — CARGO_OWNER
 * Route: /dashboard/available-space
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { TranslatedText } from '../../components/translated-text';
import {
  capacityApi,
  type CapacityOffer,
  type CapacityPlace,
  type CapacityQuote,
} from '../../services/capacityApi';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

const apiError = (err: any, fallback: string) =>
  err?.response?.data?.message ||
  (Array.isArray(err?.response?.data?.message) ? err.response.data.message[0] : null) ||
  err?.response?.data?.error ||
  fallback;

const inputClass =
  'w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#345E85] focus:border-transparent';

const CityField: React.FC<{
  label: string;
  value?: CapacityPlace | null;
  onChange: (place: CapacityPlace | null) => void;
}> = ({ label, value, onChange }) => {
  const [q, setQ] = useState(value?.name || '');
  const [hits, setHits] = useState<any[]>([]);
  useEffect(() => setQ(value?.name || ''), [value?.name]);
  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    const t = window.setTimeout(() => {
      capacityApi.searchCities(q).then((rows) => setHits(rows.slice(0, 6))).catch(() => setHits([]));
    }, 250);
    return () => window.clearTimeout(t);
  }, [q]);
  return (
    <label className="block relative">
      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</span>
      <div className="relative">
        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            if (value) onChange(null);
          }}
          placeholder="e.g. Kigali"
          className={`${inputClass} pl-9`}
        />
      </div>
      {hits.length > 0 && !value && (
        <ul className="absolute z-20 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden">
          {hits.map((city) => (
            <li key={`${city.name}-${city.lat}`}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                onClick={() => {
                  onChange({
                    name: city.name,
                    city: city.name,
                    country: city.country,
                    countryCode: city.countryCode,
                    lat: city.lat,
                    lng: city.lng,
                  });
                  setQ(city.name);
                  setHits([]);
                }}
              >
                {city.name}
                {city.country ? <span className="text-slate-400"> · {city.country}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </label>
  );
};

const AvailableSpacePage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { compact } = useCurrencyFormat();
  const [origin, setOrigin] = useState<CapacityPlace | null>(null);
  const [destination, setDestination] = useState<CapacityPlace | null>(null);
  const [pickupAt, setPickupAt] = useState('');
  const [weightKg, setWeightKg] = useState(Number(params.get('weightKg')) || 4000);
  const [volumeM3, setVolumeM3] = useState(Number(params.get('volumeM3')) || 10);
  const [title, setTitle] = useState(params.get('title') || 'General cargo');
  const [offers, setOffers] = useState<CapacityOffer[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [active, setActive] = useState<CapacityOffer | null>(null);
  const [quote, setQuote] = useState<CapacityQuote | null>(null);
  const [booking, setBooking] = useState(false);

  const loadId = params.get('loadId') || undefined;

  const search = async () => {
    setSearching(true);
    try {
      const rows = await capacityApi.marketplace({
        originCity: origin?.name || origin?.city,
        destinationCity: destination?.name || destination?.city,
        originLat: origin?.lat,
        originLng: origin?.lng,
        destinationLat: destination?.lat,
        destinationLng: destination?.lng,
        pickupAt: pickupAt ? new Date(pickupAt).toISOString() : undefined,
        weightKg,
        volumeM3,
        loadId,
      });
      setOffers(rows);
      if (!rows.length) toast('No leftover space on that corridor yet', { icon: '📦' });
    } catch (err: any) {
      toast.error(apiError(err, 'Could not search leftover space'));
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([capacityApi.marketplace({ weightKg, volumeM3, loadId }), capacityApi.bookings(), capacityApi.stats()])
      .then(([rows, mine, totals]) => {
        if (cancelled) return;
        setOffers(rows);
        setBookings(mine);
        setStats(totals);
      })
      .catch((err) => toast.error(apiError(err, 'Could not load available space')))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openQuote = async (offer: CapacityOffer) => {
    try {
      const priced = await capacityApi.quote(offer.id, { weightKg, volumeM3, cargoType: 'GENERAL' });
      setActive(offer);
      setQuote(priced);
    } catch (err: any) {
      toast.error(apiError(err, 'This leftover space cannot take that cargo'));
    }
  };

  const confirmBook = async () => {
    if (!active) return;
    setBooking(true);
    try {
      const result = await capacityApi.book(active.id, {
        loadId,
        weightKg,
        volumeM3,
        cargoType: 'GENERAL',
        title,
        origin,
        destination,
        pickupDate: pickupAt ? new Date(pickupAt).toISOString() : undefined,
      });
      toast.success(
        result.status === 'CONFIRMED'
          ? 'Space booked. Commission is on this leftover shipment.'
          : 'Request sent to the truck owner.',
      );
      setActive(null);
      setQuote(null);
      const [rows, mine, totals] = await Promise.all([
        capacityApi.marketplace({ weightKg, volumeM3, loadId }),
        capacityApi.bookings(),
        capacityApi.stats(),
      ]);
      setOffers(rows);
      setBookings(mine);
      setStats(totals);
    } catch (err: any) {
      toast.error(apiError(err, 'Could not book leftover space'));
    } finally {
      setBooking(false);
    }
  };

  const liveBookings = useMemo(
    () => bookings.filter((b) => !['CANCELLED', 'REJECTED'].includes(b.status)),
    [bookings],
  );

  if (loading) return <p className="text-sm text-slate-500">Loading available space…</p>;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#345E85] mb-3"
        >
          <ArrowLeft size={12} />
          <TranslatedText text="Overview" />
        </button>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
          <TranslatedText text="Available space" />
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
          <TranslatedText text="Book unused space on a truck already going your way. Example: Kigali → Nairobi with 40% empty. You pay the leftover freight plus an 8% platform match fee." />
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'Your bookings', value: stats?.bookings ?? liveBookings.length },
          { label: 'Matched shipments', value: stats?.matchedShipments ?? 0 },
          { label: 'Commission on leftover', value: compact(stats?.commissionPaid || 0) },
        ].map((card) => (
          <div key={card.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{card.label}</p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 md:p-8 space-y-5 shadow-sm">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Find leftover space</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CityField label="Pickup city" value={origin} onChange={setOrigin} />
          <CityField label="Delivery city" value={destination} onChange={setDestination} />
          <label>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Pickup window</span>
            <input type="datetime-local" value={pickupAt} onChange={(e) => setPickupAt(e.target.value)} className={inputClass} />
          </label>
          <label>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Cargo title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </label>
          <label>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Weight kg</span>
            <input type="number" min={1} value={weightKg} onChange={(e) => setWeightKg(Number(e.target.value) || 0)} className={inputClass} />
          </label>
          <label>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Volume m³</span>
            <input type="number" min={0} step={0.1} value={volumeM3} onChange={(e) => setVolumeM3(Number(e.target.value) || 0)} className={inputClass} />
          </label>
        </div>
        <button
          type="button"
          onClick={search}
          disabled={searching}
          className="px-6 py-3 rounded-xl bg-[#345E85] text-white text-sm font-black uppercase tracking-widest disabled:opacity-50"
        >
          {searching ? 'Searching…' : 'Search leftover space'}
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Trucks with unused space</h2>
        {offers.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-8 text-sm text-slate-400">
            No leftover listings yet. Try Kigali → Nairobi, or create a full load if you need an exclusive truck.
          </div>
        ) : (
          offers.map((offer) => (
            <article key={offer.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-[220px]">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#345E85]">{offer.status.replace('_', ' ')}</p>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">{offer.corridor}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {offer.truck?.plateNumber || 'Truck'} · {Math.round(offer.remainingWeightKg).toLocaleString()} kg left · {offer.bookingMode === 'INSTANT' ? 'Instant book' : 'Request to book'}
                </p>
                <div className="mt-3 h-1.5 w-48 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-[#345E85]" style={{ width: `${Math.min(100, offer.utilizationOfRemainder || 0)}%` }} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-black">From</p>
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  {compact(offer.quote?.freightAmount || offer.floorPrice || 0)}
                </p>
                <p className="text-[11px] text-slate-500">{offer.commissionRate}% match fee on booking</p>
                <button
                  type="button"
                  disabled={offer.bookable === false}
                  onClick={() => openQuote(offer)}
                  className="mt-3 px-4 py-2 rounded-xl bg-[#345E85] text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
                >
                  {offer.bookable === false ? offer.matchReason || 'Does not fit' : 'Book this space'}
                </button>
              </div>
            </article>
          ))
        )}
      </section>

      {liveBookings.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Your leftover-space bookings</h2>
          {liveBookings.map((row) => (
            <div key={row.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{row.title || row.corridor}</p>
                <p className="text-xs text-slate-500">
                  {row.status} · {compact(row.freightAmount)} freight · {compact(row.commissionAmount)} fee
                </p>
              </div>
              {['REQUESTED', 'CONFIRMED'].includes(row.status) && (
                <button
                  type="button"
                  onClick={() =>
                    capacityApi
                      .cancel(row.id)
                      .then(() => capacityApi.bookings().then(setBookings))
                      .then(() => toast.success('Booking released'))
                      .catch((err) => toast.error(apiError(err, 'Could not cancel')))
                  }
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500"
                >
                  Cancel
                </button>
              )}
            </div>
          ))}
        </section>
      )}

      {active && quote && (
        <div className="fixed inset-0 z-[400] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Confirm leftover-space booking</h3>
            <p className="text-sm text-slate-500">
              {active.corridor} · {weightKg.toLocaleString()} kg on {active.truck?.plateNumber}
            </p>
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>Leftover freight</span><strong>{compact(quote.freightAmount)}</strong></div>
              <div className="flex justify-between"><span>Platform match fee ({quote.commissionRate}%)</span><strong>{compact(quote.commissionAmount)}</strong></div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 font-black">
                <span>You pay</span><span>{compact(quote.totalDue)}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              The match fee is billed to the cargo owner on this leftover shipment. The truck owner is not charged to list space.
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setActive(null); setQuote(null); }} className="flex-1 py-3 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest">
                Back
              </button>
              <button type="button" disabled={booking} onClick={confirmBook} className="flex-1 py-3 rounded-xl bg-[#345E85] text-white text-[10px] font-black uppercase tracking-widest">
                {booking ? 'Booking…' : active.bookingMode === 'INSTANT' ? 'Book now' : 'Request to book'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailableSpacePage;
