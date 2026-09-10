/**
 * Sell leftover truck space — TRUCK_OWNER
 * Route: /dashboard/fleet/capacity
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { TranslatedText } from '../../components/translated-text';
import { capacityApi, type SellableTruck } from '../../services/capacityApi';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

const apiError = (err: any, fallback: string) =>
  err?.response?.data?.message ||
  (Array.isArray(err?.response?.data?.message) ? err.response.data.message[0] : null) ||
  err?.response?.data?.error ||
  fallback;

const inputClass =
  'w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#345E85] focus:border-transparent';

const readOnlyClass =
  'w-full px-4 py-2.5 text-sm border border-slate-100 dark:border-slate-700/80 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200';

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

const placeLabel = (side: 'origin' | 'destination', row: SellableTruck) => {
  const place = side === 'origin' ? row.corridor?.origin : row.corridor?.destination;
  if (!place) return '—';
  if (place.city && place.country) return `${place.city}, ${place.country}`;
  return place.name || place.address || '—';
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
  const [floorPrice, setFloorPrice] = useState(0);
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
    const tripId = params.get('tripId');
    const truckId = params.get('truckId');
    const row = tripId
      ? inventory.find((item) => item.tripId === tripId)
      : truckId
        ? inventory.find((item) => item.truckId === truckId)
        : null;
    if (row) applySellable(row);
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
  }, [params.get('tripId'), params.get('truckId')]);

  const clearSelection = () => {
    setSelected(null);
    setFloorPrice(0);
  };

  const applySellable = (row: SellableTruck) => {
    setSelected(row);
    setFloorPrice(Math.round(row.suggestedFloorPrice));
    window.requestAnimationFrame(() => {
      publishFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  };

  const publish = async () => {
    if (!selected?.tripId) return toast.error('Choose a trip with leftover space');
    if (floorPrice <= 0) return toast.error('Set a price for the remaining space');
    setSaving(true);
    try {
      await capacityApi.createOffer({
        truckId: selected.truckId,
        tripId: selected.tripId,
        floorPrice,
      });
      toast.success('Leftover space is now for sale');
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

  const liveOffers = useMemo(
    () => offers.filter((offer) => ['OPEN', 'PARTIALLY_BOOKED'].includes(offer.status)),
    [offers],
  );
  const endedOffers = useMemo(
    () => offers.filter((offer) => !['OPEN', 'PARTIALLY_BOOKED'].includes(offer.status)),
    [offers],
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
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Trips with leftover space</h2>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#345E85]">One listing per trip</span>
        </div>
        {sellable.length === 0 ? (
          <p className="text-sm text-slate-400">
            No partially loaded trips right now. Each trip keeps its own dates, route, and leftover kg/m³ — list them separately even if they share a truck.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sellable.map((row) => (
              <button
                key={row.tripId || row.truckId}
                type="button"
                onClick={() => applySellable(row)}
                className={`text-left rounded-2xl border p-4 transition-all ${
                  selected?.tripId === row.tripId
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
                      {placeLabel('origin', row)} → {placeLabel('destination', row)}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 inline-flex items-center gap-1">
                      <Calendar size={11} className="shrink-0" />
                      {formatWindow(row.corridor?.departureAt, row.corridor?.arrivalAt)}
                    </p>
                    {row.cargoTitle ? (
                      <p className="text-[11px] text-slate-400 mt-0.5">{row.cargoTitle}</p>
                    ) : null}
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
                  {row.canList ? ' · ready to sell' : ''}
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
              {selected.cargoTitle ? (
                <p className="text-xs text-slate-500 mt-0.5">Cargo: {selected.cargoTitle}</p>
              ) : null}
              <p className="text-xs text-slate-400 mt-0.5 inline-flex items-center gap-1">
                <Calendar size={11} />
                {formatWindow(selected.corridor?.departureAt, selected.corridor?.arrivalAt)}
              </p>
            </div>
            <button
              type="button"
              onClick={clearSelection}
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#345E85]"
            >
              Change trip
            </button>
          </div>

          <p className="text-xs text-slate-500">
            This listing is only for this trip’s route and dates. Other trips on the same truck keep their own leftover space and can be listed separately.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Origin (from cargo)</span>
              <div className={`${readOnlyClass} flex items-center gap-2`}>
                <MapPin size={14} className="text-slate-400 shrink-0" />
                <span>{placeLabel('origin', selected)}</span>
              </div>
            </div>
            <div>
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Destination (from cargo)</span>
              <div className={`${readOnlyClass} flex items-center gap-2`}>
                <MapPin size={14} className="text-slate-400 shrink-0" />
                <span>{placeLabel('destination', selected)}</span>
              </div>
            </div>
            <div>
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Departure</span>
              <div className={readOnlyClass}>{formatWhen(selected.corridor?.departureAt)}</div>
            </div>
            <div>
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Arrival</span>
              <div className={readOnlyClass}>{formatWhen(selected.corridor?.arrivalAt)}</div>
            </div>
            <div>
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Remaining kg</span>
              <div className={readOnlyClass}>{Math.round(selected.remainingWeightKg).toLocaleString()} kg</div>
            </div>
            <div>
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Remaining m³</span>
              <div className={readOnlyClass}>{selected.remainingVolumeM3} m³</div>
            </div>
            {selected.loadedWeightKg != null && selected.loadedWeightKg > 0 ? (
              <div className="md:col-span-2">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Cargo already on board</span>
                <div className={readOnlyClass}>
                  {Math.round(selected.loadedWeightKg).toLocaleString()} kg loaded · {Math.round(selected.utilizationPercent)}% utilized
                </div>
              </div>
            ) : null}
          </div>

          <label className="block max-w-md">
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Price for remaining space
            </span>
            <input
              type="number"
              min={1}
              value={floorPrice || ''}
              onChange={(e) => setFloorPrice(Number(e.target.value) || 0)}
              className={inputClass}
              placeholder="Enter your asking price"
            />
            {selected.suggestedFloorPrice > 0 ? (
              <p className="text-[11px] text-slate-400 mt-1.5">
                Suggested: {compact(selected.suggestedFloorPrice)} for {Math.round(selected.remainingWeightKg).toLocaleString()} kg
              </p>
            ) : null}
          </label>

          <p className="text-xs text-slate-500">
            Platform match fee is 8% of the leftover freight, billed to the cargo owner at booking. You keep the freight.
          </p>
          <button
            type="button"
            disabled={saving || !selected?.canList || floorPrice <= 0}
            onClick={publish}
            className="px-6 py-3 rounded-xl bg-[#345E85] text-white text-sm font-black uppercase tracking-widest disabled:opacity-50"
          >
            {saving ? 'Publishing…' : 'List remaining space'}
          </button>
          {selected && !selected.canList && (
            <p className="text-xs text-amber-600">This trip cannot be listed right now. Pick another trip.</p>
          )}
        </section>
      ) : (
        <section className="bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Select a trip to publish leftover space</p>
          <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
            The same truck can appear more than once when it has later trips with different dates and locations. Route and remaining capacity come from the cargo on that trip.
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Live leftover</h2>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#345E85]">
            Visible on Available space
          </span>
        </div>
        {liveOffers.length === 0 ? (
          <p className="text-sm text-slate-400">
            No live leftover listings. Cargo owners only see leftover while the trip is still open.
          </p>
        ) : (
          liveOffers.map((offer) => (
            <div key={offer.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white">{offer.corridor}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {offer.truck?.plateNumber} · {Math.round(offer.remainingWeightKg).toLocaleString()} kg left · {offer.bookingMode} · {offer.status.replace('_', ' ')}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {formatWindow(offer.departureAt, offer.arrivalAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => capacityApi.closeOffer(offer.id).then(load).then(() => toast.success('Listing closed')).catch((err) => toast.error(apiError(err, 'Could not close')))}
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 inline-flex items-center gap-1"
              >
                <X size={12} /> Close
              </button>
            </div>
          ))
        )}
      </section>

      {endedOffers.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Ended listings</h2>
          <p className="text-xs text-slate-400">
            Expired or closed leftover is kept for your records. Cargo owners cannot see or book this space.
          </p>
          {endedOffers.map((offer) => (
            <div key={offer.id} className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 opacity-70">
              <p className="text-sm font-black text-slate-700 dark:text-slate-200">{offer.corridor}</p>
              <p className="text-xs text-slate-500 mt-1">
                {offer.truck?.plateNumber} · {Math.round(offer.remainingWeightKg).toLocaleString()} kg left · {offer.status.replace('_', ' ')}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {formatWindow(offer.departureAt, offer.arrivalAt)}
              </p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};

export default SellCapacityPage;
