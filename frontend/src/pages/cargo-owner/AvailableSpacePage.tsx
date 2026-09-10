/**
 * Book leftover truck space — CARGO_OWNER
 * Route: /dashboard/available-space
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
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

const finiteNumber = (value: string | null) => {
  if (value == null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const toDatetimeLocal = (value: string | null) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.length >= 16 ? value.slice(0, 16) : value;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const placeFromQuery = (params: URLSearchParams, side: 'pickup' | 'delivery'): CapacityPlace | null => {
  const city =
    side === 'pickup'
      ? params.get('pickupLocation') || params.get('originCity') || params.get('pickupCity')
      : params.get('deliveryLocation') || params.get('destinationCity') || params.get('deliveryCity');
  const lat = finiteNumber(params.get(side === 'pickup' ? 'originLat' : 'destinationLat'));
  const lng = finiteNumber(params.get(side === 'pickup' ? 'originLng' : 'destinationLng'));
  if (!city && lat == null && lng == null) return null;
  return {
    name: city || '',
    city: city || undefined,
    lat,
    lng,
  };
};

const CityField: React.FC<{
  label: string;
  value?: CapacityPlace | null;
  onChange: (place: CapacityPlace | null) => void;
}> = ({ label, value, onChange }) => {
  const [q, setQ] = useState(value?.name || value?.city || '');
  const [hits, setHits] = useState<any[]>([]);
  useEffect(() => setQ(value?.name || value?.city || ''), [value?.name, value?.city]);
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
  const commitTyped = (next: string) => {
    setQ(next);
    const trimmed = next.trim();
    if (trimmed.length < 2) {
      onChange(null);
      return;
    }
    onChange({
      name: trimmed,
      city: trimmed,
    });
  };
  return (
    <label className="block relative">
      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</span>
      <div className="relative">
        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => commitTyped(e.target.value)}
          placeholder="Search any city worldwide"
          className={`${inputClass} pl-9`}
        />
      </div>
      {hits.length > 0 && !(value?.lat != null && q.trim() === (value.name || value.city || '')) && (
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

const formatWhen = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const formatWindow = (from?: string | null, to?: string | null) => {
  if (!from && !to) return '—';
  return `${formatWhen(from)} → ${formatWhen(to)}`;
};

const AvailableSpacePage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { compact } = useCurrencyFormat();
  const [origin, setOrigin] = useState<CapacityPlace | null>(() => placeFromQuery(params, 'pickup'));
  const [destination, setDestination] = useState<CapacityPlace | null>(() => placeFromQuery(params, 'delivery'));
  const [pickupAt, setPickupAt] = useState(() => toDatetimeLocal(params.get('pickupAt')));
  const [weightKg, setWeightKg] = useState(Number(params.get('weightKg')) || 0);
  const [volumeM3, setVolumeM3] = useState(Number(params.get('volumeM3')) || 0);
  const [title, setTitle] = useState(params.get('title') || 'General cargo');
  const [catalog, setCatalog] = useState<CapacityOffer[]>([]);
  const [offers, setOffers] = useState<CapacityOffer[]>([]);
  const [filtered, setFiltered] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [active, setActive] = useState<CapacityOffer | null>(null);
  const [quote, setQuote] = useState<CapacityQuote | null>(null);
  const [booking, setBooking] = useState(false);

  const loadId = params.get('loadId') || undefined;

  const marketplaceParams = () => {
    const pickupLocation = origin?.name || origin?.city || origin?.address;
    const deliveryLocation = destination?.name || destination?.city || destination?.address;
    return {
      pickupLocation,
      deliveryLocation,
      originCity: pickupLocation,
      destinationCity: deliveryLocation,
      originLat: origin?.lat,
      originLng: origin?.lng,
      destinationLat: destination?.lat,
      destinationLng: destination?.lng,
      pickupAt: pickupAt ? new Date(pickupAt).toISOString() : undefined,
      weightKg: weightKg > 0 ? weightKg : undefined,
      volumeM3: volumeM3 > 0 ? volumeM3 : undefined,
      loadId,
    };
  };

  const hasSearchFilters = () =>
    Boolean(
      origin?.name ||
        origin?.city ||
        destination?.name ||
        destination?.city ||
        pickupAt ||
        weightKg > 0 ||
        volumeM3 > 0 ||
        loadId,
    );

  const showCatalog = (rows: CapacityOffer[]) => {
    setOffers(rows);
    setFiltered(false);
  };

  const search = async () => {
    if (!hasSearchFilters()) {
      showCatalog(catalog);
      return;
    }
    setSearching(true);
    try {
      const rows = await capacityApi.marketplace(marketplaceParams());
      setOffers(rows);
      setFiltered(true);
      if (!rows.length) toast('No leftover space matches these filters', { icon: '📦' });
    } catch (err: any) {
      toast.error(apiError(err, 'Could not search leftover space'));
    } finally {
      setSearching(false);
    }
  };

  const clearFilters = () => {
    setOrigin(null);
    setDestination(null);
    setPickupAt('');
    setWeightKg(0);
    setVolumeM3(0);
    showCatalog(catalog);
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([capacityApi.marketplace({}), capacityApi.bookings()])
      .then(async ([rows, mine]) => {
        if (cancelled) return;
        setCatalog(rows);
        setBookings(mine);
        if (hasSearchFilters()) {
          const matched = await capacityApi.marketplace(marketplaceParams());
          if (cancelled) return;
          setOffers(matched);
          setFiltered(true);
        } else {
          showCatalog(rows);
        }
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
    if (weightKg <= 0) {
      toast.error('Enter cargo weight to book leftover space on this trip');
      return;
    }
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
      const [rows, mine, all] = await Promise.all([
        hasSearchFilters() ? capacityApi.marketplace(marketplaceParams()) : capacityApi.marketplace({}),
        capacityApi.bookings(),
        capacityApi.marketplace({}),
      ]);
      setCatalog(all);
      setOffers(rows);
      setFiltered(hasSearchFilters());
      setBookings(mine);
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
      </div>

      <section className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 md:p-8 space-y-5 shadow-sm">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Find leftover space</h2>
        <p className="text-xs text-slate-500">
          All leftover trips are listed below. Use these filters to narrow the list, or pick a trip as it is.
        </p>
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
            <input type="number" min={1} value={weightKg || ''} onChange={(e) => setWeightKg(Number(e.target.value) || 0)} className={inputClass} placeholder="Optional filter" />
          </label>
          <label>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Volume m³</span>
            <input type="number" min={0} step={0.1} value={volumeM3 || ''} onChange={(e) => setVolumeM3(Number(e.target.value) || 0)} className={inputClass} placeholder="Optional filter" />
          </label>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={search}
            disabled={searching}
            className="px-6 py-3 rounded-xl bg-[#345E85] text-white text-sm font-black uppercase tracking-widest disabled:opacity-50"
          >
            {searching ? 'Searching…' : 'Filter leftover space'}
          </button>
          {filtered ? (
            <button
              type="button"
              onClick={clearFilters}
              className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-black uppercase tracking-widest text-slate-500"
            >
              Show all leftover trips
            </button>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Trucks with unused space per trip</h2>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#345E85]">
            {offers.length} leftover {offers.length === 1 ? 'trip' : 'trips'}
            {filtered ? ' matching filters' : ' listed'}
          </span>
        </div>
        {offers.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-8 text-sm text-slate-400">
            {filtered
              ? 'No leftover trips match these filters. Show all leftover trips to pick from the full list.'
              : 'No leftover space is listed yet. When a fleet publishes unused kg/m³ on a trip, it will show here for booking.'}
          </div>
        ) : (
          offers.map((offer) => (
            <article key={offer.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-[220px]">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#345E85]">{offer.status.replace('_', ' ')}</p>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">{offer.corridor}</h3>
                <p className="text-xs text-slate-500 mt-1 inline-flex items-center gap-1">
                  <Calendar size={12} className="shrink-0" />
                  {formatWindow(offer.departureAt, offer.arrivalAt)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {offer.truck?.plateNumber || 'Truck'} · {Math.round(offer.remainingWeightKg).toLocaleString()} kg left · {offer.remainingVolumeM3} m³ · {offer.bookingMode === 'INSTANT' ? 'Instant book' : 'Request to book'}
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
