/**
 * Sell leftover truck space — TRUCK_OWNER
 * Route: /dashboard/fleet/capacity
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Eye,
  Inbox,
  MapPin,
  Package,
  Radio,
  Truck,
  Weight,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { TranslatedText } from '../../components/translated-text';
import { StatCard } from '../../components/EnliteUI/Cards';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../../components/EnliteUI/Tables';
import {
  capacityApi,
  type CapacityBooking,
  type CapacityOffer,
  type SellableTruck,
} from '../../services/capacityApi';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

const apiError = (err: any, fallback: string) =>
  err?.response?.data?.message ||
  (Array.isArray(err?.response?.data?.message) ? err.response.data.message[0] : null) ||
  err?.response?.data?.error ||
  fallback;

const readOnlyClass =
  'w-full px-4 py-2.5 ui-input border border-slate-100 dark:border-slate-700/80 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200';

const LIVE_STATUSES = ['OPEN', 'PARTIALLY_BOOKED'];

const formatWhen = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const formatDateShort = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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

const cityLabel = (side: 'origin' | 'destination', row: SellableTruck) => {
  const place = side === 'origin' ? row.corridor?.origin : row.corridor?.destination;
  if (!place) return '—';
  return place.city || place.name || place.address || '—';
};

const offerStatusVariant = (status: string) => {
  if (status === 'OPEN') return 'success' as const;
  if (status === 'PARTIALLY_BOOKED') return 'warning' as const;
  if (status === 'EXPIRED') return 'neutral' as const;
  if (status === 'FULFILLED') return 'info' as const;
  return 'neutral' as const;
};

const emptyTone = (pct: number) => {
  if (pct >= 50) {
    return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50';
  }
  if (pct >= 25) {
    return 'bg-blue-50 text-[#345E85] border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50';
  }
  return 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
};

const LeftoverTripCard: React.FC<{
  row: SellableTruck;
  selected: boolean;
  onSelect: () => void;
}> = ({ row, selected, onSelect }) => {
  const origin = cityLabel('origin', row);
  const destination = cityLabel('destination', row);
  const remainingKg = Math.round(row.remainingWeightKg).toLocaleString();
  const listed = Boolean(row.existingOfferId);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group text-left rounded-2xl border p-5 transition-all ${
        selected
          ? 'border-[#345E85] bg-[#345E85]/[0.06] dark:bg-[#345E85]/10 shadow-md ring-1 ring-[#345E85]/25'
          : 'border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-900 hover:border-[#345E85]/40 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`size-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
              selected
                ? 'bg-[#345E85] text-white'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-[#345E85]'
            }`}
          >
            <Truck size={22} />
          </div>
          <div className="min-w-0">
            <p className="ui-table-body truncate">{row.plateNumber}</p>
            <p className="ui-helper mt-0.5 truncate">
              {[row.make, row.model].filter(Boolean).join(' ') || 'Truck'}
            </p>
          </div>
        </div>
        <span className={`ui-badge px-2.5 py-1 rounded-full border shrink-0 ${emptyTone(row.emptyPercent)}`}>
          {Math.round(row.emptyPercent)}% empty
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <p className="ui-label mb-0.5">Origin</p>
          <p className="ui-body-small truncate" title={placeLabel('origin', row)}>
            {origin}
          </p>
        </div>
        <ArrowRight size={14} className="text-slate-300 dark:text-slate-600 shrink-0 mt-3" />
        <div className="flex-1 min-w-0 text-right">
          <p className="ui-label mb-0.5">Destination</p>
          <p className="ui-body-small truncate" title={placeLabel('destination', row)}>
            {destination}
          </p>
        </div>
      </div>

      <p className="ui-helper inline-flex items-center gap-1.5 mb-3">
        <Calendar size={11} className="shrink-0" />
        {formatWindow(row.corridor?.departureAt, row.corridor?.arrivalAt)}
      </p>
      {row.cargoTitle ? <p className="ui-helper mb-3 truncate">{row.cargoTitle}</p> : null}

      <div className="mb-3">
        <div className="flex justify-between ui-helper mb-1.5">
          <span>{Math.round(row.utilizationPercent)}% loaded</span>
          <span>{Math.round(row.emptyPercent)}% leftover</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-[#345E85] rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, row.utilizationPercent))}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 px-3 py-2.5">
          <p className="ui-label mb-0.5">Remaining</p>
          <p className="ui-table-body">{remainingKg} kg</p>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 px-3 py-2.5">
          <p className="ui-label mb-0.5">Volume</p>
          <p className="ui-table-body">{row.remainingVolumeM3} m³</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <span className="ui-button text-[#345E85]">
          {selected ? 'Selected' : listed ? 'Already listed' : row.canList ? 'List this trip' : 'Unavailable'}
        </span>
      </div>
    </button>
  );
};

const SellCapacityPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { compact } = useCurrencyFormat();
  const [sellable, setSellable] = useState<SellableTruck[]>([]);
  const [offers, setOffers] = useState<CapacityOffer[]>([]);
  const [bookings, setBookings] = useState<CapacityBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<SellableTruck | null>(null);
  const [listingTab, setListingTab] = useState<'live' | 'ended'>('live');
  const [pageTab, setPageTab] = useState<'sell' | 'requests'>('sell');
  const [detailBooking, setDetailBooking] = useState<CapacityBooking | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const publishFormRef = useRef<HTMLElement>(null);

  const tripId = params.get('tripId');
  const truckId = params.get('truckId');

  const load = useCallback(async () => {
    const [inventory, listing, inbox] = await Promise.all([
      capacityApi.sellable(),
      capacityApi.listOffers(),
      capacityApi.bookings(),
    ]);
    setSellable(inventory);
    setOffers(listing);
    setBookings(inbox);
    const row = tripId
      ? inventory.find((item) => item.tripId === tripId)
      : truckId
        ? inventory.find((item) => item.truckId === truckId)
        : null;
    if (row) {
      setSelected(row);
    }
  }, [tripId, truckId]);

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
  }, [load]);

  const clearSelection = () => {
    setSelected(null);
  };

  const applySellable = (row: SellableTruck) => {
    setSelected(row);
    window.requestAnimationFrame(() => {
      publishFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  };

  const publish = async () => {
    if (!selected?.tripId) return toast.error('Choose a trip with leftover space');
    setSaving(true);
    try {
      await capacityApi.createOffer({
        truckId: selected.truckId,
        tripId: selected.tripId,
        bookingMode: 'REQUEST',
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

  const requestRows = useMemo(
    () =>
      bookings.filter((b) =>
        ['REQUESTED', 'CONFIRMED', 'REJECTED', 'CANCELLED'].includes(b.status),
      ),
    [bookings],
  );

  const acceptRequest = async (booking: CapacityBooking) => {
    setActingId(booking.id);
    try {
      await capacityApi.accept(booking.id);
      toast.success('Cargo confirmed. Driver notified with pickup and delivery details.');
      setDetailBooking(null);
      await load();
    } catch (err: any) {
      toast.error(apiError(err, 'Accept failed'));
    } finally {
      setActingId(null);
    }
  };

  const cancelRequest = async (booking: CapacityBooking) => {
    setActingId(booking.id);
    try {
      await capacityApi.reject(booking.id, 'Cancelled by truck owner');
      toast.success('Request cancelled');
      setDetailBooking(null);
      await load();
    } catch (err: any) {
      toast.error(apiError(err, 'Could not cancel request'));
    } finally {
      setActingId(null);
    }
  };

  const bookingPlace = (place?: CapacityBooking['origin']) => {
    if (!place) return '—';
    if (place.city && place.country) return `${place.city}, ${place.country}`;
    return place.name || place.address || '—';
  };

  const requestStatusVariant = (status: string) => {
    if (status === 'REQUESTED') return 'warning' as const;
    if (status === 'CONFIRMED') return 'success' as const;
    if (status === 'REJECTED' || status === 'CANCELLED') return 'error' as const;
    return 'neutral' as const;
  };

  const requestColumns: Column<CapacityBooking>[] = useMemo(
    () => [
      {
        key: 'title',
        label: 'Cargo',
        sortable: true,
        render: (_: unknown, row: CapacityBooking) => (
          <div className="min-w-[180px]">
            <p className="ui-table-body">{row.load?.title || row.title || 'Leftover cargo'}</p>
            <p className="ui-helper mt-0.5">
              {Math.round(row.load?.weightKg || row.weightKg).toLocaleString()} kg
              {(row.load?.volumeM3 || row.volumeM3)
                ? ` · ${row.load?.volumeM3 || row.volumeM3} m³`
                : ''}
              {row.load?.cargoType ? ` · ${String(row.load.cargoType).replace(/_/g, ' ')}` : ''}
            </p>
          </div>
        ),
      },
      {
        key: 'offeredPrice',
        label: 'Offered price',
        sortable: true,
        render: (_: unknown, row: CapacityBooking) => (
          <div>
            <p className="ui-table-body">{compact(row.offeredPrice || row.freightAmount || 0, row.currencyCode || 'USD')}</p>
            <p className="ui-helper mt-0.5">{row.commissionRate}% fee · {compact(row.commissionAmount)}</p>
          </div>
        ),
      },
      {
        key: 'pickupDate',
        label: 'Pickup / Delivery',
        sortable: true,
        render: (_: unknown, row: CapacityBooking) => (
          <div className="min-w-[160px]">
            <p className="ui-body-small inline-flex items-center gap-1">
              <MapPin size={11} className="shrink-0" />
              {row.pickupLabel || bookingPlace(row.load?.origin || row.origin)}
            </p>
            <p className="ui-helper mt-0.5">{formatWhen(row.pickupDate)}</p>
            <p className="ui-body-small mt-1.5 inline-flex items-center gap-1">
              <MapPin size={11} className="shrink-0" />
              {row.deliveryLabel || bookingPlace(row.load?.destination || row.destination)}
            </p>
            <p className="ui-helper mt-0.5">{formatWhen(row.deliveryDate)}</p>
          </div>
        ),
      },
      {
        key: 'truckPlate',
        label: 'Truck',
        sortable: true,
        render: (_: unknown, row: CapacityBooking) => (
          <div>
            <p className="ui-table-body">{row.truckPlate || '—'}</p>
            <p className="ui-helper mt-0.5">
              {[row.truckMake, row.truckModel].filter(Boolean).join(' ') || row.corridor || 'Leftover listing'}
            </p>
          </div>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (_: unknown, row: CapacityBooking) => (
          <StatusBadge
            label={row.status.replaceAll('_', ' ')}
            variant={requestStatusVariant(row.status)}
          />
        ),
      },
    ],
    [compact],
  );

  const requestActions: TableAction<CapacityBooking>[] = useMemo(
    () => [
      {
        key: 'view',
        label: 'View cargo',
        icon: <Eye size={14} />,
        onClick: (row) => setDetailBooking(row),
      },
      {
        key: 'accept',
        label: 'Accept',
        icon: <Check size={14} />,
        variant: 'success',
        hidden: (row) => row.status !== 'REQUESTED',
        disabled: (row) => actingId === row.id,
        onClick: (row) => {
          void acceptRequest(row);
        },
      },
      {
        key: 'cancel',
        label: 'Cancel',
        icon: <X size={14} />,
        variant: 'danger',
        hidden: (row) => row.status !== 'REQUESTED',
        disabled: (row) => actingId === row.id,
        onClick: (row) => {
          void cancelRequest(row);
        },
      },
    ],
    [actingId],
  );

  const liveOffers = useMemo(
    () => offers.filter((offer) => LIVE_STATUSES.includes(offer.status)),
    [offers],
  );
  const endedOffers = useMemo(
    () => offers.filter((offer) => !LIVE_STATUSES.includes(offer.status)),
    [offers],
  );
  const listingRows = listingTab === 'live' ? liveOffers : endedOffers;

  const remainingKg = useMemo(
    () => Math.round(sellable.reduce((sum, row) => sum + Number(row.remainingWeightKg || 0), 0)),
    [sellable],
  );

  const listingColumns: Column<CapacityOffer>[] = useMemo(
    () => [
      {
        key: 'corridor',
        label: 'Corridor',
        sortable: true,
        render: (_: unknown, offer: CapacityOffer) => (
          <div className="min-w-[180px]">
            <p className="ui-table-body leading-snug">{offer.corridor || '—'}</p>
            <p className="ui-helper mt-1 inline-flex items-center gap-1">
              <Calendar size={11} className="shrink-0" />
              {formatDateShort(offer.departureAt)} → {formatDateShort(offer.arrivalAt)}
            </p>
          </div>
        ),
      },
      {
        key: 'truck.plateNumber',
        label: 'Truck',
        sortable: true,
        render: (_: unknown, offer: CapacityOffer) => (
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Truck size={16} />
            </div>
            <div>
              <p className="ui-table-body">{offer.truck?.plateNumber || '—'}</p>
              <p className="ui-helper mt-0.5">
                {[offer.truck?.make, offer.truck?.model].filter(Boolean).join(' ') || 'Vehicle'}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: 'remainingWeightKg',
        label: 'Remaining',
        sortable: true,
        render: (_: unknown, offer: CapacityOffer) => (
          <div>
            <p className="ui-table-body">{Math.round(offer.remainingWeightKg).toLocaleString()} kg</p>
            <p className="ui-helper mt-0.5">{offer.remainingVolumeM3} m³</p>
          </div>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (_: unknown, offer: CapacityOffer) => (
          <div className="space-y-1.5">
            <StatusBadge
              label={offer.status.replaceAll('_', ' ')}
              variant={offerStatusVariant(offer.status)}
            />
            <p className="ui-helper">Owner confirms bookings</p>
          </div>
        ),
      },
      {
        key: 'bookingCount',
        label: 'Bookings',
        sortable: true,
        render: (_: unknown, offer: CapacityOffer) => (
          <div>
            <p className="ui-table-body">{offer.bookingCount ?? offer.bookings?.length ?? 0}</p>
            {(offer.pendingRequests ?? 0) > 0 ? (
              <p className="ui-helper text-amber-600 mt-0.5">{offer.pendingRequests} waiting</p>
            ) : null}
          </div>
        ),
      },
    ],
    [],
  );

  const listingActions: TableAction<CapacityOffer>[] = useMemo(
    () => [
      {
        key: 'close',
        label: 'Close listing',
        icon: <X size={14} />,
        variant: 'danger',
        hidden: (offer) => !LIVE_STATUSES.includes(offer.status),
        onClick: (offer) => {
          capacityApi
            .closeOffer(offer.id)
            .then(load)
            .then(() => toast.success('Listing closed'))
            .catch((err) => toast.error(apiError(err, 'Could not close')));
        },
      },
    ],
    [load],
  );

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl animate-pulse">
        <div className="h-8 w-48 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-[2rem]" />
        <div className="h-56 bg-slate-100 dark:bg-slate-800 rounded-[2rem]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl font-sans">
      <div>
        <button
          type="button"
          onClick={() => navigate('/dashboard/fleet')}
          className="inline-flex items-center gap-1.5 ui-button text-slate-400 hover:text-[#345E85] mb-3"
        >
          <ArrowLeft size={12} />
          <TranslatedText text="Fleet overview" />
        </button>
        <h1 className="ui-page-title">
          <TranslatedText text="Sell capacity" />
        </h1>
        <p className="ui-body-small mt-1 max-w-2xl">
          List leftover kg and m³ on trips that are already moving. Review booking requests, cargo details, and offered prices before you confirm.
        </p>
      </div>

      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 w-fit">
        <button
          type="button"
          onClick={() => setPageTab('sell')}
          className={`px-4 py-2 rounded-lg ui-tab transition-colors ${
            pageTab === 'sell'
              ? 'bg-white dark:bg-slate-700 text-[#345E85] shadow-sm'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Sell capacity
        </button>
        <button
          type="button"
          onClick={() => setPageTab('requests')}
          className={`px-4 py-2 rounded-lg ui-tab transition-colors inline-flex items-center gap-2 ${
            pageTab === 'requests'
              ? 'bg-white dark:bg-slate-700 text-[#345E85] shadow-sm'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Booking requests
          {pending.length > 0 ? (
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
              {pending.length}
            </span>
          ) : null}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Leftover trips"
          value={sellable.length}
          subtitle="Ready to list"
          icon={<Truck size={22} />}
          color="primary"
          variant="classic"
        />
        <StatCard
          title="Remaining weight"
          value={`${remainingKg.toLocaleString()} kg`}
          subtitle="Across leftover trips"
          icon={<Weight size={22} />}
          color="primary"
          variant="classic"
        />
        <StatCard
          title="Live listings"
          value={liveOffers.length}
          subtitle="Visible on Available space"
          icon={<Radio size={22} />}
          color="success"
          variant="classic"
        />
        <button
          type="button"
          className="text-left"
          onClick={() => setPageTab('requests')}
        >
          <StatCard
            title="Requests waiting"
            value={pending.length}
            subtitle={pending.length ? 'Open booking requests tab' : 'No pending requests'}
            icon={<Inbox size={22} />}
            color={pending.length ? 'warning' : 'secondary'}
            variant="classic"
          />
        </button>
      </div>

      {pageTab === 'requests' ? (
        <>
          <StandardDataTable<CapacityBooking>
            title="Leftover space booking requests"
            subtitle="Cargo owners assigned unassigned cargo to your leftover listings. Review cargo details and the offered price, then accept or cancel."
            icon={<Inbox size={18} />}
            headerColor="default"
            columns={requestColumns}
            data={requestRows}
            getRowId={(row) => row.id}
            searchable
            searchPlaceholder="Search cargo, truck, or corridor…"
            searchKeys={['title', 'status', 'truckPlate', 'corridor', 'load.title']}
            pagination
            pageSize={8}
            columnVisibility={false}
            stickyHeader
            striped
            hoverable
            emptyMessage="No leftover-space booking requests yet."
            rowActions={requestActions}
            ariaLabel="Leftover space booking requests"
            onRowClick={(row) => setDetailBooking(row)}
          />
        </>
      ) : (
        <>
      <section className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 space-y-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="ui-section-title">Trips with leftover space</h2>
            <p className="ui-body-small mt-1">
              Each trip keeps its own route, dates, and remaining capacity — even if they share a truck.
            </p>
          </div>
          <span className="ui-badge text-[#345E85]">One listing per trip</span>
        </div>
        {sellable.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center">
            <div className="size-14 rounded-[22px] bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 mb-4">
              <Package size={26} />
            </div>
            <p className="ui-body font-black text-slate-700 dark:text-slate-200">No leftover trips right now</p>
            <p className="ui-body-small mt-2 max-w-md">
              When a trip is only partly loaded, it appears here so you can sell the unused kg and m³.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sellable.map((row) => (
              <LeftoverTripCard
                key={row.tripId || row.truckId}
                row={row}
                selected={selected?.tripId === row.tripId}
                onSelect={() => applySellable(row)}
              />
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
              <h2 className="ui-section-title">Publish leftover space</h2>
              <p className="ui-table-body mt-1">
                {selected.plateNumber} · {selected.make} {selected.model}
              </p>
              {selected.cargoTitle ? (
                <p className="ui-body-small mt-0.5">Cargo: {selected.cargoTitle}</p>
              ) : null}
              <p className="ui-helper mt-0.5 inline-flex items-center gap-1">
                <Calendar size={11} />
                {formatWindow(selected.corridor?.departureAt, selected.corridor?.arrivalAt)}
              </p>
            </div>
            <button
              type="button"
              onClick={clearSelection}
              className="ui-button text-slate-400 hover:text-[#345E85]"
            >
              Change trip
            </button>
          </div>

          <p className="ui-body-small">
            This listing is only for this trip’s route and dates. Other trips on the same truck keep their own leftover space and can be listed separately.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="ui-label">Origin (from cargo)</span>
              <div className={`${readOnlyClass} flex items-center gap-2`}>
                <MapPin size={14} className="text-slate-400 shrink-0" />
                <span>{placeLabel('origin', selected)}</span>
              </div>
            </div>
            <div>
              <span className="ui-label">Destination (from cargo)</span>
              <div className={`${readOnlyClass} flex items-center gap-2`}>
                <MapPin size={14} className="text-slate-400 shrink-0" />
                <span>{placeLabel('destination', selected)}</span>
              </div>
            </div>
            <div>
              <span className="ui-label">Departure</span>
              <div className={readOnlyClass}>{formatWhen(selected.corridor?.departureAt)}</div>
            </div>
            <div>
              <span className="ui-label">Arrival</span>
              <div className={readOnlyClass}>{formatWhen(selected.corridor?.arrivalAt)}</div>
            </div>
            <div>
              <span className="ui-label">Remaining kg</span>
              <div className={readOnlyClass}>{Math.round(selected.remainingWeightKg).toLocaleString()} kg</div>
            </div>
            <div>
              <span className="ui-label">Remaining m³</span>
              <div className={readOnlyClass}>{selected.remainingVolumeM3} m³</div>
            </div>
            {selected.loadedWeightKg != null && selected.loadedWeightKg > 0 ? (
              <div className="md:col-span-2">
                <span className="ui-label">Cargo already on board</span>
                <div className={readOnlyClass}>
                  {Math.round(selected.loadedWeightKg).toLocaleString()} kg loaded · {Math.round(selected.utilizationPercent)}% utilized
                </div>
              </div>
            ) : null}
          </div>

          <p className="ui-body-small">
            Cargo owners set the offered price when they request leftover space. You confirm or reject each request. Platform match fee is 8% of freight, billed to the cargo owner — you keep the freight.
          </p>
          <button
            type="button"
            disabled={saving || !selected?.canList}
            onClick={publish}
            className="px-6 py-3 rounded-xl bg-[#345E85] text-white ui-button disabled:opacity-50"
          >
            {saving ? 'Publishing…' : 'List remaining space'}
          </button>
          {selected && !selected.canList && (
            <p className="ui-body-small text-amber-600">This trip cannot be listed right now. Pick another trip.</p>
          )}
        </section>
      ) : (
        <section className="bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center">
          <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 mx-auto mb-3">
            <Radio size={22} />
          </div>
          <p className="ui-body font-black text-slate-700 dark:text-slate-200">Select a trip to publish leftover space</p>
          <p className="ui-body-small mt-2 max-w-md mx-auto">
            The same truck can appear more than once when it has later trips with different dates and locations. Route and remaining capacity come from the cargo on that trip.
          </p>
        </section>
      )}

      {pending.length > 0 && (
        <section className="bg-white dark:bg-slate-900 rounded-[2rem] border border-amber-100 dark:border-amber-900/40 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="ui-section-title text-amber-600">Requests waiting</h2>
              <p className="ui-body-small mt-1">
                {pending.length} leftover-space request{pending.length === 1 ? '' : 's'} need your decision.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPageTab('requests')}
              className="px-4 py-2 rounded-xl bg-amber-500 text-white ui-button"
            >
              Open booking requests
            </button>
          </div>
        </section>
      )}

      <StandardDataTable<CapacityOffer>
        key={listingTab}
        title="Your leftover listings"
        subtitle={
          listingTab === 'live'
            ? 'Live leftover is visible on Available space while the trip is still open.'
            : 'Expired or closed leftover is kept for your records. Cargo owners cannot book this space.'
        }
        icon={<Radio size={18} />}
        headerColor="default"
        columns={listingColumns}
        data={listingRows}
        getRowId={(row) => row.id}
        searchable
        searchPlaceholder="Search corridor, plate, or status…"
        searchKeys={['corridor', 'status', 'bookingMode', 'truck.plateNumber']}
        pagination
        pageSize={8}
        columnVisibility={false}
        stickyHeader
        striped
        hoverable
        emptyMessage={
          listingTab === 'live'
            ? 'No live leftover listings. Publish a leftover trip above to appear on Available space.'
            : 'No ended listings yet.'
        }
        rowActions={listingTab === 'live' ? listingActions : undefined}
        ariaLabel="Leftover capacity listings"
        headerActions={
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setListingTab('live')}
              className={`px-3 py-1.5 rounded-lg ui-tab transition-colors ${
                listingTab === 'live'
                  ? 'bg-white dark:bg-slate-700 text-[#345E85] shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Live ({liveOffers.length})
            </button>
            <button
              type="button"
              onClick={() => setListingTab('ended')}
              className={`px-3 py-1.5 rounded-lg ui-tab transition-colors ${
                listingTab === 'ended'
                  ? 'bg-white dark:bg-slate-700 text-[#345E85] shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Ended ({endedOffers.length})
            </button>
          </div>
        }
      />
        </>
      )}

      {detailBooking &&
        createPortal(
          <div className="fixed inset-0 z-[10000] bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Cargo booking request</h3>
                  <p className="text-xs text-slate-500 mt-1 truncate">
                    {detailBooking.truckPlate || 'Truck'} · {detailBooking.corridor || 'Leftover space'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailBooking(null)}
                  className="size-8 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="px-5 py-4 overflow-y-auto space-y-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    label={detailBooking.status.replaceAll('_', ' ')}
                    variant={requestStatusVariant(detailBooking.status)}
                  />
                  <span className="text-xs text-slate-500">
                    Requested {formatWhen(detailBooking.createdAt)}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                  <p className="ui-label inline-flex items-center gap-1.5">
                    <Package size={12} /> Cargo details
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {detailBooking.load?.title || detailBooking.title || 'Leftover cargo'}
                  </p>
                  {detailBooking.load?.description ? (
                    <p className="text-xs text-slate-500">{detailBooking.load.description}</p>
                  ) : null}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="ui-label mb-0.5">Weight</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {Math.round(detailBooking.load?.weightKg || detailBooking.weightKg).toLocaleString()} kg
                      </p>
                    </div>
                    <div>
                      <p className="ui-label mb-0.5">Volume</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {detailBooking.load?.volumeM3 || detailBooking.volumeM3 || 0} m³
                      </p>
                    </div>
                    <div>
                      <p className="ui-label mb-0.5">Cargo type</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {String(detailBooking.load?.cargoType || detailBooking.cargoType || 'GENERAL').replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="ui-label mb-0.5">Load status</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {detailBooking.load?.status
                          ? String(detailBooking.load.status).replace(/_/g, ' ')
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
                  <p className="ui-label">Pickup & delivery</p>
                  <p className="ui-body-small inline-flex items-start gap-1.5">
                    <MapPin size={12} className="mt-0.5 shrink-0" />
                    <span>
                      {detailBooking.pickupLabel ||
                        bookingPlace(detailBooking.load?.origin || detailBooking.origin)}
                      <span className="block text-slate-500">{formatWhen(detailBooking.pickupDate)}</span>
                    </span>
                  </p>
                  <p className="ui-body-small inline-flex items-start gap-1.5">
                    <MapPin size={12} className="mt-0.5 shrink-0" />
                    <span>
                      {detailBooking.deliveryLabel ||
                        bookingPlace(detailBooking.load?.destination || detailBooking.destination)}
                      <span className="block text-slate-500">{formatWhen(detailBooking.deliveryDate)}</span>
                    </span>
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
                  <p className="ui-label">Offered price</p>
                  <p className="text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                    {compact(
                      detailBooking.offeredPrice || detailBooking.freightAmount || 0,
                      detailBooking.currencyCode || 'USD',
                    )}
                  </p>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Match fee ({detailBooking.commissionRate}%)</span>
                    <span className="tabular-nums">
                      {compact(detailBooking.commissionAmount, detailBooking.currencyCode || 'USD')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>Cargo owner total</span>
                    <span className="tabular-nums">
                      {compact(detailBooking.totalDue, detailBooking.currencyCode || 'USD')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setDetailBooking(null)}
                  className="h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium flex-1"
                >
                  Close
                </button>
                {detailBooking.status === 'REQUESTED' ? (
                  <>
                    <button
                      type="button"
                      disabled={actingId === detailBooking.id}
                      onClick={() => void cancelRequest(detailBooking)}
                      className="h-10 px-3 rounded-lg border border-rose-200 text-rose-600 text-sm font-semibold flex-1 disabled:opacity-50"
                    >
                      {actingId === detailBooking.id ? 'Working…' : 'Cancel request'}
                    </button>
                    <button
                      type="button"
                      disabled={actingId === detailBooking.id}
                      onClick={() => void acceptRequest(detailBooking)}
                      className="h-10 px-3 rounded-lg bg-emerald-600 text-white text-sm font-semibold flex-1 disabled:opacity-50"
                    >
                      {actingId === detailBooking.id ? 'Working…' : 'Accept'}
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default SellCapacityPage;
