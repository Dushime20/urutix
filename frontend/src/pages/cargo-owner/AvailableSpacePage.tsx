/**
 * Book leftover truck space — CARGO_OWNER
 * Route: /dashboard/available-space
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Package, Search, Truck, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { TranslatedText } from '../../components/translated-text';
import {
  capacityApi,
  type AssignableCargo,
  type CapacityOffer,
  type CapacityPlace,
  type CapacityQuote,
} from '../../services/capacityApi';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { useCurrency } from '../../contexts/CurrencyContext';
import PaymentCurrencySelect from '../../components/common/PaymentCurrencySelect';
import ModernLoader from '../../components/common/ModernLoader';
import { TruckFullProfile } from '../../components/FleetDashboard/TruckFullProfile';

const apiError = (err: any, fallback: string) =>
  err?.response?.data?.message ||
  (Array.isArray(err?.response?.data?.message) ? err.response.data.message[0] : null) ||
  err?.response?.data?.error ||
  fallback;

const cardClass =
  'bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden';

const inputClass =
  'w-full h-10 px-3 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#345E85] focus:border-[#345E85]';

const ghostBtnClass =
  'h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:border-[#345E85] hover:text-[#345E85]';

const primaryBtnClass =
  'inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-[#345E85] text-white text-sm font-semibold hover:bg-[#2c5173] disabled:opacity-40 disabled:pointer-events-none';

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

const prettyStatus = (value?: string) =>
  String(value || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const StatusPill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center h-6 px-2 rounded-md border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
    {children}
  </span>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="ui-label mb-1.5">{label}</span>
    {children}
  </label>
);

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
      <span className="ui-label mb-1.5">{label}</span>
      <div className="relative">
        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => commitTyped(e.target.value)}
          placeholder="City"
          className={`${inputClass} pl-9`}
        />
        {q && (
          <button
            type="button"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            onClick={() => {
              setQ('');
              setHits([]);
              onChange(null);
            }}
            aria-label="Clear city"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {hits.length > 0 && !(value?.lat != null && q.trim() === (value.name || value.city || '')) && (
        <ul className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          {hits.map((city) => (
            <li key={`${city.name}-${city.lat}`}>
              <button
                type="button"
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
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
                <span className="font-medium text-slate-800 dark:text-slate-100">{city.name}</span>
                {city.country ? (
                  <span className="block text-xs text-slate-500">{city.country}</span>
                ) : null}
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

const placeLabel = (place?: CapacityPlace | null) =>
  place?.name || place?.city || place?.address || '—';

type ModalMode = 'details' | 'book' | null;

const AvailableSpacePage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { compact, formatIn, rates } = useCurrencyFormat();
  const { preferredCurrency } = useCurrency();
  const [origin, setOrigin] = useState<CapacityPlace | null>(() => placeFromQuery(params, 'pickup'));
  const [destination, setDestination] = useState<CapacityPlace | null>(() => placeFromQuery(params, 'delivery'));
  const [pickupAt, setPickupAt] = useState(() => toDatetimeLocal(params.get('pickupAt')));
  const [deliveryAt, setDeliveryAt] = useState(() => toDatetimeLocal(params.get('deliveryAt')));
  const [weightKg, setWeightKg] = useState(Number(params.get('weightKg')) || 0);
  const [volumeM3, setVolumeM3] = useState(Number(params.get('volumeM3')) || 0);
  const [title, setTitle] = useState(params.get('title') || 'General cargo');
  const [cargos, setCargos] = useState<AssignableCargo[]>([]);
  const [selectedCargoId, setSelectedCargoId] = useState(params.get('loadId') || '');
  const [offeredPrice, setOfferedPrice] = useState(0);
  const [offerCurrency, setOfferCurrency] = useState(preferredCurrency || 'USD');
  const [catalog, setCatalog] = useState<CapacityOffer[]>([]);
  const [offers, setOffers] = useState<CapacityOffer[]>([]);
  const [filtered, setFiltered] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [active, setActive] = useState<CapacityOffer | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [quote, setQuote] = useState<CapacityQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [booking, setBooking] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const convertBetween = (amount: number, from: string, to: string) => {
    if (!amount || from === to) return amount || 0;
    const fromRate = from === 'USD' ? 1 : rates[from] ?? 1;
    const toRate = to === 'USD' ? 1 : rates[to] ?? 1;
    return Math.round(((amount / fromRate) * toRate) * 100) / 100;
  };

  const moneyInOffer = (amount: number) => formatIn(amount, offerCurrency, offerCurrency);

  const applyCargo = (cargo: AssignableCargo) => {
    setSelectedCargoId(cargo.id);
    setTitle(cargo.title || 'General cargo');
    setWeightKg(Number(cargo.weightKg) || 0);
    setVolumeM3(Number(cargo.volumeM3) || 0);
    if (cargo.origin) setOrigin(cargo.origin);
    if (cargo.destination) setDestination(cargo.destination);
    if (cargo.pickupDate) setPickupAt(toDatetimeLocal(String(cargo.pickupDate)));
    if (cargo.deliveryDate) setDeliveryAt(toDatetimeLocal(String(cargo.deliveryDate)));
  };

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
        volumeM3 > 0,
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
      if (!rows.length) toast('No leftover space matches these filters');
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
    setDeliveryAt('');
    setWeightKg(0);
    setVolumeM3(0);
    showCatalog(catalog);
  };

  const closeModal = () => {
    setActive(null);
    setModalMode(null);
    setQuote(null);
    setQuoting(false);
    setDetailLoading(false);
  };

  const openDetails = async (offer: CapacityOffer) => {
    setActive(offer);
    setModalMode('details');
    setQuote(null);
    setDetailLoading(true);
    try {
      const full = await capacityApi.getOffer(offer.id);
      setActive(full);
    } catch (err: any) {
      toast.error(apiError(err, 'Could not load truck details'));
    } finally {
      setDetailLoading(false);
    }
  };

  const openBook = async (offer: CapacityOffer) => {
    setActive(offer);
    setModalMode('book');
    setQuote(null);
    setOfferedPrice(0);
    const currency = preferredCurrency || offer.currencyCode || 'USD';
    setOfferCurrency(currency);
    try {
      const assignable = await capacityApi.assignableCargos();
      setCargos(assignable);
      const preselected =
        assignable.find((cargo) => cargo.id === selectedCargoId) ||
        assignable.find((cargo) => cargo.id === params.get('loadId')) ||
        null;
      if (preselected) {
        applyCargo(preselected);
        await refreshQuote(offer, preselected, currency);
      } else {
        setSelectedCargoId('');
      }
    } catch (err: any) {
      toast.error(apiError(err, 'Could not load unassigned cargo'));
    }
  };

  const refreshQuote = async (
    offer: CapacityOffer,
    cargo: AssignableCargo,
    currency = offerCurrency,
  ) => {
    const kg = Number(cargo.weightKg) || 0;
    if (kg <= 0) {
      setQuote(null);
      return;
    }
    setQuoting(true);
    try {
      const priced = await capacityApi.quote(offer.id, {
        weightKg: kg,
        volumeM3: Number(cargo.volumeM3) || 0,
        cargoType: cargo.cargoType || 'GENERAL',
        origin:
          cargo.origin?.lat != null && cargo.origin?.lng != null ? cargo.origin : undefined,
        destination:
          cargo.destination?.lat != null && cargo.destination?.lng != null
            ? cargo.destination
            : undefined,
        pickupAt: cargo.pickupDate
          ? new Date(cargo.pickupDate).toISOString()
          : pickupAt
            ? new Date(pickupAt).toISOString()
            : undefined,
      });
      setQuote(priced);
      const listingCurrency = priced.currencyCode || offer.currencyCode || 'USD';
      const suggested = Number(priced.suggestedFreight || priced.freightAmount) || 0;
      setOfferedPrice(convertBetween(suggested, listingCurrency, currency));
    } catch (err: any) {
      setQuote(null);
      toast.error(apiError(err, 'This leftover space cannot take that cargo'));
    } finally {
      setQuoting(false);
    }
  };

  const changeOfferCurrency = (code: string) => {
    setOfferedPrice((prev) => convertBetween(prev, offerCurrency, code));
    setOfferCurrency(code);
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([capacityApi.marketplace({}), capacityApi.bookings(), capacityApi.assignableCargos()])
      .then(async ([rows, mine, assignable]) => {
        if (cancelled) return;
        setCatalog(rows);
        setBookings(mine);
        setCargos(assignable);
        const preselected = assignable.find((cargo) => cargo.id === params.get('loadId'));
        if (preselected) applyCargo(preselected);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmBook = async () => {
    if (!active) return;
    if (!selectedCargoId) {
      toast.error('Select an unassigned cargo to book this leftover space');
      return;
    }
    if (offeredPrice <= 0) {
      toast.error('Set the offered price for this leftover space');
      return;
    }
    setBooking(true);
    try {
      await capacityApi.book(active.id, {
        loadId: selectedCargoId,
        weightKg,
        volumeM3,
        cargoType: 'GENERAL',
        title,
        origin: origin?.lat != null && origin?.lng != null ? origin : undefined,
        destination: destination?.lat != null && destination?.lng != null ? destination : undefined,
        pickupDate: pickupAt ? new Date(pickupAt).toISOString() : undefined,
        deliveryDate: deliveryAt ? new Date(deliveryAt).toISOString() : undefined,
        offeredPrice,
        currencyCode: offerCurrency,
      });
      toast.success('Request sent to the truck owner. They must confirm before the driver is assigned.');
      closeModal();
      const [rows, mine, all, assignable] = await Promise.all([
        hasSearchFilters() ? capacityApi.marketplace(marketplaceParams()) : capacityApi.marketplace({}),
        capacityApi.bookings(),
        capacityApi.marketplace({}),
        capacityApi.assignableCargos(),
      ]);
      setCatalog(all);
      setOffers(rows);
      setFiltered(hasSearchFilters());
      setBookings(mine);
      setCargos(assignable);
      if (!assignable.some((cargo) => cargo.id === selectedCargoId)) {
        setSelectedCargoId('');
      }
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

  const offerPreview = useMemo(() => {
    const listingCurrency = quote?.currencyCode || active?.currencyCode || 'USD';
    const suggestedRaw = Number(quote?.suggestedFreight || quote?.freightAmount || 0);
    const suggested = convertBetween(suggestedRaw, listingCurrency, offerCurrency);
    const freight = offeredPrice > 0 ? offeredPrice : suggested;
    const rate = Number(quote?.commissionRate || 8);
    const fee = Math.round(((freight * rate) / 100) * 100) / 100;
    return { freight, fee, total: Math.round((freight + fee) * 100) / 100, rate, suggested };
  }, [offeredPrice, quote, offerCurrency, active?.currencyCode, rates]);

  const selectedCargo = useMemo(
    () => cargos.find((cargo) => cargo.id === selectedCargoId) || null,
    [cargos, selectedCargoId],
  );

  if (loading) return <ModernLoader isLoading type="form" fields={6} />;

  return (
    <div className="max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="size-9 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-[#345E85] hover:text-[#345E85]"
            aria-label="Back to overview"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <h1 className="ui-page-title">
              <TranslatedText text="Available space" />
            </h1>
          </div>
        </div>
        <p className="text-xs tabular-nums text-slate-500">
          {offers.length} {offers.length === 1 ? 'trip' : 'trips'}
          {filtered ? ' matched' : ''}
        </p>
      </header>

      <section className={cardClass}>
        <div className="p-5 md:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <CityField label="Pickup" value={origin} onChange={setOrigin} />
            <CityField label="Delivery" value={destination} onChange={setDestination} />
            <Field label="Pickup window">
              <input
                type="datetime-local"
                value={pickupAt}
                onChange={(e) => setPickupAt(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Weight (kg)">
              <input
                type="number"
                min={1}
                value={weightKg || ''}
                onChange={(e) => setWeightKg(Number(e.target.value) || 0)}
                className={inputClass}
                placeholder="Optional filter"
              />
            </Field>
            <Field label="Volume (m³)">
              <input
                type="number"
                min={0}
                step={0.1}
                value={volumeM3 || ''}
                onChange={(e) => setVolumeM3(Number(e.target.value) || 0)}
                className={inputClass}
                placeholder="Optional"
              />
            </Field>
          </div>
        </div>
        <div className="px-5 md:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Filter leftover trucks, then use Book to assign unassigned cargo and set your offered price.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {filtered && (
              <button type="button" onClick={clearFilters} className={ghostBtnClass}>
                Clear
              </button>
            )}
            <button type="button" onClick={search} disabled={searching} className={primaryBtnClass}>
              <Search size={14} />
              {searching ? 'Searching…' : 'Filter'}
            </button>
          </div>
        </div>
      </section>

      <section className={cardClass}>
        <div className="px-5 py-3 md:px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            <TranslatedText text="Open trips" />
          </h2>
          <span className="text-xs tabular-nums text-slate-500">{offers.length}</span>
        </div>

        {offers.length === 0 ? (
          <div className="px-5 py-12 md:px-6 text-center">
            <p className="text-sm text-slate-500">
              {filtered ? 'No trips match these filters.' : 'No leftover space listed yet.'}
            </p>
          </div>
        ) : (
          <ul>
            {offers.map((offer) => (
              <li
                key={offer.id}
                className="px-5 md:px-6 py-4 border-t border-slate-100 dark:border-slate-800 first:border-t-0 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill>{prettyStatus(offer.status)}</StatusPill>
                    <StatusPill>Owner confirms</StatusPill>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {offer.corridor}
                  </h3>
                  <p className="text-xs text-slate-500 inline-flex items-center gap-1.5">
                    <Calendar size={12} className="shrink-0" />
                    {formatWindow(offer.departureAt, offer.arrivalAt)}
                  </p>
                  <p className="text-xs text-slate-500 inline-flex items-center gap-1.5">
                    <Truck size={12} className="shrink-0" />
                    {offer.truck?.plateNumber || 'Truck'}
                    {offer.truck?.make || offer.truck?.model
                      ? ` · ${[offer.truck?.make, offer.truck?.model].filter(Boolean).join(' ')}`
                      : ''}
                    {' · '}
                    {Math.round(offer.remainingWeightKg).toLocaleString()} kg leftover ·{' '}
                    {offer.remainingVolumeM3} m³
                  </p>
                  <div className="h-1 w-40 max-w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-[#345E85]"
                      style={{ width: `${Math.min(100, offer.utilizationOfRemainder || 0)}%` }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0 space-y-2">
                  <div>
                    <p className="ui-label mb-0.5">From</p>
                    <p className="text-base font-semibold tabular-nums text-slate-900 dark:text-white">
                      {compact(offer.quote?.freightAmount || offer.floorPrice || 0)}
                    </p>
                    <p className="text-[11px] text-slate-500">{offer.commissionRate}% fee</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={offer.bookable === false}
                      onClick={() => openDetails(offer)}
                      className={ghostBtnClass}
                    >
                      View details
                    </button>
                    <button
                      type="button"
                      disabled={offer.bookable === false}
                      onClick={() => openBook(offer)}
                      className={primaryBtnClass}
                    >
                      {offer.bookable === false ? offer.matchReason || 'Unavailable' : 'Book'}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {liveBookings.length > 0 && (
        <section className={cardClass}>
          <div className="px-5 py-3 md:px-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              <TranslatedText text="Your bookings" />
            </h2>
          </div>
          <ul>
            {liveBookings.map((row) => (
              <li
                key={row.id}
                className="px-5 md:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 first:border-t-0 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {row.title || row.corridor}
                    </p>
                    <StatusPill>{prettyStatus(row.status)}</StatusPill>
                  </div>
                  <p className="text-xs text-slate-500 tabular-nums">
                    Offered {compact(row.offeredPrice || row.freightAmount, row.currencyCode || 'USD')} ·{' '}
                    {compact(row.commissionAmount, row.currencyCode || 'USD')} fee
                    {row.pickupLabel || row.origin?.name
                      ? ` · Pickup ${row.pickupLabel || row.origin?.name}`
                      : ''}
                    {row.pickupDate ? ` ${formatWhen(row.pickupDate)}` : ''}
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
                    className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Cancel
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {active && modalMode === 'details' && (
        <div className="fixed inset-0 z-[400] bg-black/40 flex items-center justify-center p-4">
          <div className={`${cardClass} max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Truck details</h3>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  {active.truck?.plateNumber || 'Truck'}
                  {active.truck?.make || active.truck?.model
                    ? ` · ${[active.truck?.make, active.truck?.model, active.truck?.year]
                        .filter(Boolean)
                        .join(' ')}`
                    : ''}
                  {' · '}
                  {active.corridor}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="size-8 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-xs">
                <div>
                  <p className="ui-label mb-0.5">Leftover weight</p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {Math.round(active.remainingWeightKg).toLocaleString()} kg
                  </p>
                </div>
                <div>
                  <p className="ui-label mb-0.5">Leftover volume</p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {active.remainingVolumeM3} m³
                  </p>
                </div>
                <div>
                  <p className="ui-label mb-0.5">Corridor</p>
                  <p className="font-semibold text-slate-900 dark:text-white truncate" title={active.corridor}>
                    {active.corridor}
                  </p>
                </div>
                <div>
                  <p className="ui-label mb-0.5">Trip window</p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {formatWindow(active.departureAt, active.arrivalAt)}
                  </p>
                </div>
                <div>
                  <p className="ui-label mb-0.5">Origin</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{placeLabel(active.origin)}</p>
                </div>
                <div>
                  <p className="ui-label mb-0.5">Destination</p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {placeLabel(active.destination)}
                  </p>
                </div>
                <div>
                  <p className="ui-label mb-0.5">Listing status</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{prettyStatus(active.status)}</p>
                </div>
                <div>
                  <p className="ui-label mb-0.5">Booking</p>
                  <p className="font-semibold text-slate-900 dark:text-white">Owner must confirm</p>
                </div>
              </div>

              {detailLoading ? (
                <div className="py-12 text-center text-sm text-slate-500">Loading full truck information…</div>
              ) : active.truck ? (
                <TruckFullProfile truck={active.truck} compact />
              ) : (
                <p className="text-sm text-slate-500 py-8 text-center">Truck information is not available.</p>
              )}

              {active.notes ? (
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                  <p className="ui-label mb-1">Listing notes</p>
                  <p className="text-sm text-slate-800 dark:text-slate-200">{active.notes}</p>
                </div>
              ) : null}
            </div>
            <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex gap-2 shrink-0">
              <button type="button" onClick={closeModal} className={`${ghostBtnClass} flex-1`}>
                Close
              </button>
              <button
                type="button"
                disabled={active.bookable === false}
                onClick={() => openBook(active)}
                className={`${primaryBtnClass} flex-1`}
              >
                Book this space
              </button>
            </div>
          </div>
        </div>
      )}

      {active && modalMode === 'book' && (
        <div className="fixed inset-0 z-[400] bg-black/40 flex items-center justify-center p-4">
          <div className={`${cardClass} max-w-lg w-full max-h-[90vh] overflow-y-auto`}>
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Book leftover space</h3>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  {active.truck?.plateNumber || 'Truck'} · {active.corridor}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="size-8 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4 text-sm">
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-xs space-y-1">
                <p className="font-medium text-slate-900 dark:text-white inline-flex items-center gap-1.5">
                  <Truck size={12} />
                  {active.truck?.plateNumber || 'Truck'}
                  {active.truck?.make || active.truck?.model
                    ? ` · ${[active.truck?.make, active.truck?.model].filter(Boolean).join(' ')}`
                    : ''}
                </p>
                <p className="text-slate-500">
                  {Math.round(active.remainingWeightKg).toLocaleString()} kg leftover · {active.remainingVolumeM3}{' '}
                  m³ · {formatWindow(active.departureAt, active.arrivalAt)}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="ui-label mb-0">Unassigned cargo</p>
                  <button
                    type="button"
                    className="text-xs font-medium text-[#345E85] hover:underline"
                    onClick={() => navigate('/dashboard/cargos/create')}
                  >
                    Create cargo
                  </button>
                </div>
                {cargos.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-700 px-4 py-8 text-center">
                    <Package size={22} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-600 dark:text-slate-300">No unassigned cargo</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Create a cargo first, then assign it to this leftover truck.
                    </p>
                  </div>
                ) : (
                  <ul className="max-h-56 overflow-auto rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                    {cargos.map((cargo) => {
                      const selected = cargo.id === selectedCargoId;
                      return (
                        <li key={cargo.id}>
                          <button
                            type="button"
                            className={`w-full text-left px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                              selected ? 'bg-[#345E85]/[0.06] ring-inset ring-1 ring-[#345E85]/30' : ''
                            }`}
                            onClick={() => {
                              applyCargo(cargo);
                              if (active) void refreshQuote(active, cargo);
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                  {cargo.title}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {Math.round(cargo.weightKg).toLocaleString()} kg
                                  {cargo.volumeM3 ? ` · ${cargo.volumeM3} m³` : ''}
                                  {' · '}
                                  {cargo.corridor}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  Pickup {formatWhen(cargo.pickupDate ? String(cargo.pickupDate) : null)}
                                  {' · Delivery '}
                                  {formatWhen(cargo.deliveryDate ? String(cargo.deliveryDate) : null)}
                                </p>
                              </div>
                              {selected ? (
                                <StatusPill>Selected</StatusPill>
                              ) : null}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {selectedCargo ? (
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 space-y-1.5">
                  <p className="ui-label inline-flex items-center gap-1.5">
                    <Package size={12} /> Selected cargo
                  </p>
                  <p className="font-medium text-slate-900 dark:text-white">{selectedCargo.title}</p>
                  <p className="text-xs text-slate-500">
                    {Math.round(selectedCargo.weightKg).toLocaleString()} kg
                    {selectedCargo.volumeM3 ? ` · ${selectedCargo.volumeM3} m³` : ''}
                    {' · '}
                    {placeLabel(selectedCargo.origin)} → {placeLabel(selectedCargo.destination)}
                  </p>
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(9rem,11rem)] gap-3">
                <Field label={`Your offered price (${offerCurrency})`}>
                  <input
                    type="number"
                    min={1}
                    value={offeredPrice || ''}
                    onChange={(e) => setOfferedPrice(Number(e.target.value) || 0)}
                    className={inputClass}
                    disabled={!selectedCargoId}
                  />
                </Field>
                <PaymentCurrencySelect
                  value={offerCurrency}
                  onChange={changeOfferCurrency}
                  label="Currency"
                  layout="block"
                />
              </div>
              <p className="ui-helper -mt-1">
                {quoting
                  ? 'Updating quote…'
                  : quote
                    ? `Suggested from listing: ${moneyInOffer(offerPreview.suggested)}. Truck owner reviews your offer.`
                    : 'Select cargo to get a suggested price.'}
              </p>

              {selectedCargoId && quote ? (
                <div className="space-y-2">
                  <div className="flex justify-between gap-3 text-slate-600 dark:text-slate-300">
                    <span>Offered freight</span>
                    <strong className="tabular-nums text-slate-900 dark:text-white">
                      {moneyInOffer(offerPreview.freight)}
                    </strong>
                  </div>
                  <div className="flex justify-between gap-3 text-slate-600 dark:text-slate-300">
                    <span>Match fee ({offerPreview.rate}%)</span>
                    <strong className="tabular-nums text-slate-900 dark:text-white">
                      {moneyInOffer(offerPreview.fee)}
                    </strong>
                  </div>
                  <div className="flex justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 font-semibold text-slate-900 dark:text-white">
                    <span>Total</span>
                    <span className="tabular-nums">{moneyInOffer(offerPreview.total)}</span>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex gap-2">
              <button type="button" onClick={closeModal} className={`${ghostBtnClass} flex-1`}>
                Back
              </button>
              <button
                type="button"
                disabled={booking || quoting || !selectedCargoId || offeredPrice <= 0}
                onClick={confirmBook}
                className={`${primaryBtnClass} flex-1`}
              >
                {booking ? 'Sending…' : 'Request leftover space'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailableSpacePage;
