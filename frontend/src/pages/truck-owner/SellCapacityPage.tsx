/**
 * Sell leftover truck space — TRUCK_OWNER
 * Route: /dashboard/fleet/capacity
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { TranslatedText } from '../../components/translated-text';
import { capacityApi, type CapacityPlace, type SellableTruck } from '../../services/capacityApi';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

const apiError = (err: any, fallback: string) =>
  err?.response?.data?.message ||
  (Array.isArray(err?.response?.data?.message) ? err.response.data.message[0] : null) ||
  err?.response?.data?.error ||
  fallback;

const inputClass =
  'w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#345E85] focus:border-transparent';

const toLocal = (iso?: string | Date | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const isCoordinateLabel = (name?: string | null) => !!name && /^Lat:\s*-?\d/i.test(name);

const CityField: React.FC<{
  label: string;
  value?: CapacityPlace | null;
  onChange: (place: CapacityPlace | null) => void;
}> = ({ label, value, onChange }) => {
  const [q, setQ] = useState(value?.name || '');
  const [hits, setHits] = useState<CapacityPlace[]>([]);
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
          placeholder="Search a city"
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
                    address: city.name,
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

const SellCapacityPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { compact } = useCurrencyFormat();
  const [sellable, setSellable] = useState<SellableTruck[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<SellableTruck | null>(null);
  const [origin, setOrigin] = useState<CapacityPlace | null>(null);
  const [destination, setDestination] = useState<CapacityPlace | null>(null);
  const [departureAt, setDepartureAt] = useState('');
  const [arrivalAt, setArrivalAt] = useState('');
  const [remainingWeightKg, setRemainingWeightKg] = useState(0);
  const [remainingVolumeM3, setRemainingVolumeM3] = useState(0);
  const [floorPrice, setFloorPrice] = useState(0);
  const [pricePerTonne, setPricePerTonne] = useState(160);
  const [notes, setNotes] = useState('');
  const publishFormRef = useRef<HTMLElement>(null);

  const load = async () => {
    const [inventory, listing, inbox] = await Promise.all([
      capacityApi.sellable(),
      capacityApi.listOffers(),
      capacityApi.bookings(),
    ]);
    setSellable(inventory);
    setOffers(listing);
    setBookings(inbox);
    const truckId = params.get('truckId');
    if (truckId) {
      const row = inventory.find((item) => item.truckId === truckId);
      if (row) applySellable(row);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load()
      .catch((err) => toast.error(apiError(err, 'Could not load leftover capacity')))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.get('truckId')]);

  const clearSelection = () => {
    setSelected(null);
    setOrigin(null);
    setDestination(null);
    setDepartureAt('');
    setArrivalAt('');
    setRemainingWeightKg(0);
    setRemainingVolumeM3(0);
    setFloorPrice(0);
    setPricePerTonne(160);
    setNotes('');
  };

  const applySellable = (row: SellableTruck) => {
    setSelected(row);
    setRemainingWeightKg(Math.round(row.remainingWeightKg));
    setRemainingVolumeM3(Math.round(row.remainingVolumeM3 * 10) / 10);
    setFloorPrice(Math.round(row.suggestedFloorPrice));
    if (row.corridor?.origin && !isCoordinateLabel(row.corridor.origin.name)) setOrigin(row.corridor.origin);
    else setOrigin(null);
    if (row.corridor?.destination && !isCoordinateLabel(row.corridor.destination.name)) setDestination(row.corridor.destination);
    else setDestination(null);
    if (row.corridor?.departureAt) setDepartureAt(toLocal(row.corridor.departureAt));
    else setDepartureAt('');
    if (row.corridor?.arrivalAt) setArrivalAt(toLocal(row.corridor.arrivalAt));
    else setArrivalAt('');
    window.requestAnimationFrame(() => {
      publishFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  };

  const publish = async () => {
    if (!selected) return toast.error('Choose a truck with leftover space');
    if (!origin || !destination) return toast.error('Origin and destination cities are required');
    if (!departureAt || !arrivalAt) return toast.error('Set the departure and arrival window');
    setSaving(true);
    try {
      await capacityApi.createOffer({
        truckId: selected.truckId,
        tripId: selected.tripId || undefined,
        origin,
        destination,
        departureAt: new Date(departureAt).toISOString(),
        arrivalAt: new Date(arrivalAt).toISOString(),
        remainingWeightKg,
        remainingVolumeM3,
        floorPrice,
        pricePerTonne,
        bookingMode: 'INSTANT',
        notes,
        generalCargoOnly: true,
      });
      toast.success('Leftover space is now for sale');
      setNotes('');
      clearSelection();
      await load();
    } catch (err: any) {
      toast.error(apiError(err, 'Could not publish leftover space'));
    } finally {
      setSaving(false);
    }
  };

  const pending = useMemo(
    () => bookings.filter((b) => b.status === 'REQUESTED'),
    [bookings],
  );

  if (loading) return <p className="text-sm text-slate-500">Loading leftover capacity…</p>;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <button
          type="button"
          onClick={() => navigate('/dashboard/fleet')}
          className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#345E85] mb-3"
        >
          <ArrowLeft size={12} />
          <TranslatedText text="Fleet overview" />
        </button>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
          <TranslatedText text="Sell capacity" />
        </h1>
      </div>

      <section className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Unused space this week</h2>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#345E85]">List remaining space</span>
        </div>
        {sellable.length === 0 ? (
          <p className="text-sm text-slate-400">Register a truck first, then leftover space will appear here.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sellable.map((row) => (
              <button
                key={row.truckId}
                type="button"
                onClick={() => applySellable(row)}
                className={`text-left rounded-2xl border p-4 transition-all ${
                  selected?.truckId === row.truckId
                    ? 'border-[#345E85] bg-blue-50/70 dark:bg-blue-900/20'
                    : 'border-slate-100 dark:border-slate-800 hover:border-[#345E85]/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      {row.plateNumber} · {row.make} {row.model}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {row.corridor
                        ? `${row.corridor.origin?.name} → ${row.corridor.destination?.name}`
                        : 'No active trip — list an empty or return leg'}
                    </p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500">
                    {Math.round(row.emptyPercent)}% empty
                  </span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-[#345E85]" style={{ width: `${Math.min(100, row.utilizationPercent)}%` }} />
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  {Math.round(row.remainingWeightKg).toLocaleString()} kg / {row.remainingVolumeM3} m³ remaining
                  {row.existingOfferId ? ' · already listed' : row.canList ? ' · ready to sell' : ''}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>

      {selected ? (
      <section
        ref={publishFormRef}
        className="bg-white dark:bg-slate-900 rounded-[2rem] border border-[#345E85]/30 dark:border-[#345E85]/40 p-6 md:p-8 space-y-5 shadow-sm"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Publish leftover space</h2>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
              {selected.plateNumber} · {selected.make} {selected.model}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {Math.round(selected.remainingWeightKg).toLocaleString()} kg / {selected.remainingVolumeM3} m³ available
            </p>
          </div>
          <button
            type="button"
            onClick={clearSelection}
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#345E85]"
          >
            Change truck
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CityField label="Origin city" value={origin} onChange={setOrigin} />
          <CityField label="Destination city" value={destination} onChange={setDestination} />
          <label>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Departure</span>
            <input type="datetime-local" value={departureAt} onChange={(e) => setDepartureAt(e.target.value)} className={inputClass} />
          </label>
          <label>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Arrival</span>
            <input type="datetime-local" value={arrivalAt} onChange={(e) => setArrivalAt(e.target.value)} className={inputClass} />
          </label>
          <label>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Remaining kg</span>
            <input type="number" min={50} value={remainingWeightKg} onChange={(e) => setRemainingWeightKg(Number(e.target.value) || 0)} className={inputClass} />
          </label>
          <label>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Remaining m³</span>
            <input type="number" min={0} step={0.1} value={remainingVolumeM3} onChange={(e) => setRemainingVolumeM3(Number(e.target.value) || 0)} className={inputClass} />
          </label>
          <label>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Floor price for this leftover slice</span>
            <input type="number" min={0} value={floorPrice} onChange={(e) => setFloorPrice(Number(e.target.value) || 0)} className={inputClass} />
          </label>
          <label>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Price per tonne</span>
            <input type="number" min={0} value={pricePerTonne} onChange={(e) => setPricePerTonne(Number(e.target.value) || 0)} className={inputClass} />
          </label>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Mix rules, drop points, or access notes"
          className={inputClass}
        />
        <p className="text-xs text-slate-500">
          Platform match fee is 8% of the leftover freight, billed to the cargo owner at booking. You keep the freight.
        </p>
        <button
          type="button"
          disabled={saving || !selected?.canList}
          onClick={publish}
          className="px-6 py-3 rounded-xl bg-[#345E85] text-white text-sm font-black uppercase tracking-widest disabled:opacity-50"
        >
          {saving ? 'Publishing…' : 'List remaining space'}
        </button>
        {selected && !selected.canList && (
          <p className="text-xs text-amber-600">This truck is full or already listed. Pick another unit.</p>
        )}
      </section>
      ) : (
        <section className="bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Select a truck to publish leftover space</p>
          <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
            Choose one of your trucks above — the publish form opens with its corridor, dates, and remaining kg/m³ pre-filled.
          </p>
        </section>
      )}

      {pending.length > 0 && (
        <section className="bg-white dark:bg-slate-900 rounded-[2rem] border border-amber-100 dark:border-amber-900/40 p-6 space-y-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-amber-600">Requests waiting</h2>
          {pending.map((booking) => (
            <div key={booking.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{booking.title}</p>
                <p className="text-xs text-slate-500">
                  {booking.weightKg.toLocaleString()} kg · {compact(booking.freightAmount)} freight · {booking.commissionRate}% fee
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => capacityApi.accept(booking.id).then(load).then(() => toast.success('Space booked')).catch((err) => toast.error(apiError(err, 'Accept failed')))}
                  className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => capacityApi.reject(booking.id, 'Does not fit mix').then(load).then(() => toast.success('Request released')).catch((err) => toast.error(apiError(err, 'Reject failed')))}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Your listings</h2>
        {offers.length === 0 ? (
          <p className="text-sm text-slate-400">No leftover-space listings yet.</p>
        ) : (
          offers.map((offer) => (
            <div key={offer.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white">{offer.corridor}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {offer.truck?.plateNumber} · {Math.round(offer.remainingWeightKg).toLocaleString()} kg left · {offer.bookingMode} · {offer.status.replace('_', ' ')}
                </p>
              </div>
              {['OPEN', 'PARTIALLY_BOOKED'].includes(offer.status) && (
                <button
                  type="button"
                  onClick={() => capacityApi.closeOffer(offer.id).then(load).then(() => toast.success('Listing closed')).catch((err) => toast.error(apiError(err, 'Could not close')))}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 inline-flex items-center gap-1"
                >
                  <X size={12} /> Close
                </button>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default SellCapacityPage;
