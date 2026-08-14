import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Truck, Navigation, LayoutGrid, Map as MapIcon, Radio } from 'lucide-react';
import { tenantApi } from '../../services/tenantApi';
import type { Trip } from '../../services/tenantApi';
import TripMap from './TripMap';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';
import { StandardDataTable, type Column, type TableAction } from '../EnliteUI/Tables';

interface ActiveTripsProps {
  tenantId: string;
  onTrackTrip?: (activity: any) => void;
}

const locationLabel = (
  loc: Trip['origin'] | Trip['destination'],
  fallback: string,
): string => {
  if (!loc) return fallback;
  if (typeof loc === 'string') return loc;
  return loc.name || fallback;
};

const ActiveTrips: React.FC<ActiveTripsProps> = ({ tenantId, onTrackTrip }) => {
  const { tSync } = useTranslation();
  const [viewMode, setViewMode] = React.useState<'list' | 'map'>('list');
  const [selectedTripId, setSelectedTripId] = React.useState<string | null>(null);

  const { data: trips = [], isLoading, refetch, error } = useQuery({
    queryKey: ['activeTrips', tenantId],
    queryFn: () => tenantApi.getActiveTrips(tenantId),
  });

  type TripRow = Trip & { originLabel: string; destinationLabel: string };

  const tableRows: TripRow[] = useMemo(
    () =>
      trips.map((trip) => ({
        ...trip,
        originLabel: locationLabel(trip.origin, ''),
        destinationLabel: locationLabel(trip.destination, ''),
      })),
    [trips],
  );

  const handleTrackMovement = (trip: Trip) => {
    if (onTrackTrip) {
      onTrackTrip({
        action: `${tSync('Movement Tracking')}: ${trip.tripNumber}`,
        description: `${trip.tripNumber} ${tSync('in transit from')} ${locationLabel(trip.origin, tSync('Unknown'))} ${tSync('to')} ${locationLabel(trip.destination, tSync('Unknown'))}`,
        type: 'shipment',
        status: trip.status === 'DELAYED' ? 'warning' : 'success',
        timestamp: 'Live Feed',
        metadata: { tripId: trip.id },
      });
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'DELAYED':
        return 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800';
      case 'IN_PROGRESS':
        return 'bg-primary-50 dark:bg-primary-900/20 text-[#345E85] dark:text-primary-400 border-primary-200 dark:border-primary-800';
      case 'PLANNED':
        return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    }
  };

  const statusLabel = (status: string) => {
    if (status === 'IN_PROGRESS') return tSync('In Transit');
    return tSync(status);
  };

  const columns: Column<TripRow>[] = useMemo(
    () => [
      {
        key: 'tripNumber',
        label: 'TRIP',
        alwaysVisible: true,
        render: (_v, trip) => (
          <div className="flex flex-col">
            <span className="font-black text-slate-900 dark:text-white uppercase text-[11px]">
              {trip.tripNumber}
            </span>
            <span
              className={`mt-1 px-1.5 py-0.5 rounded text-[8px] font-black border w-fit uppercase ${getStatusStyle(trip.status)}`}
            >
              {statusLabel(trip.status)}
            </span>
          </div>
        ),
      },
      {
        key: 'route',
        label: 'ROUTE',
        render: (_v, trip) => (
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase">Origin</p>
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                  {trip.originLabel || tSync('Point A')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-600 shrink-0" />
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase">Destination</p>
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                  {trip.destinationLabel || tSync('Point B')}
                </p>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'truckNumber',
        label: 'ASSET',
        render: (_v, trip) => (
          <div className="flex items-center gap-2">
            <Truck className="w-3.5 h-3.5 text-slate-400" />
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase">Truck</p>
              <p className="text-[11px] font-black text-slate-900 dark:text-white">
                {trip.truckNumber || '—'}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        label: 'STATUS',
        render: (_v, trip) => (
          <span
            className={`inline-flex px-2 py-1 rounded text-[9px] font-black uppercase border ${getStatusStyle(trip.status)}`}
          >
            {statusLabel(trip.status)}
          </span>
        ),
      },
      {
        key: 'location',
        label: 'LIVE',
        render: () => (
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase">Position</p>
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <TranslatedText text="Tracking" />
              </p>
            </div>
          </div>
        ),
      },
    ],
    [tSync],
  );

  const rowActions: TableAction<TripRow>[] = useMemo(
    () => [
      {
        key: 'track',
        label: tSync('Track Live'),
        icon: <Radio className="w-3.5 h-3.5" />,
        onClick: (trip) => handleTrackMovement(trip),
      },
      {
        key: 'map',
        label: tSync('View on Map'),
        icon: <Navigation className="w-3.5 h-3.5" />,
        onClick: (trip) => {
          setSelectedTripId(trip.id);
          setViewMode('map');
        },
      },
    ],
    [tSync, onTrackTrip],
  );

  const viewToggle = (
    <div className="flex bg-white/20 p-0.5 rounded-md">
      <button
        type="button"
        onClick={() => setViewMode('list')}
        className={`px-2.5 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 ${
          viewMode === 'list'
            ? 'bg-white text-[#345E85] shadow-sm'
            : 'text-white/80 hover:text-white'
        }`}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        <TranslatedText text="Table" />
      </button>
      <button
        type="button"
        onClick={() => setViewMode('map')}
        className={`px-2.5 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 ${
          viewMode === 'map'
            ? 'bg-white text-[#345E85] shadow-sm'
            : 'text-white/80 hover:text-white'
        }`}
      >
        <MapIcon className="w-3.5 h-3.5" />
        <TranslatedText text="Map" />
      </button>
    </div>
  );

  if (viewMode === 'map') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="ui-card-title">
              <TranslatedText text="Active Trips" />
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              <TranslatedText text="Monitoring" />{' '}
              <span className="text-primary-600 dark:text-primary-400 font-black">
                {trips.length} <TranslatedText text="units" />
              </span>{' '}
              <TranslatedText text="live" />
            </p>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="px-3 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1.5"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <TranslatedText text="Table" />
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest bg-white dark:bg-slate-900 text-[#345E85] shadow-sm flex items-center gap-1.5"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <TranslatedText text="Map" />
            </button>
          </div>
        </div>
        <TripMap
          trips={trips}
          selectedTripId={selectedTripId}
          onSelectTrip={(trip) => setSelectedTripId(trip.id)}
        />
      </div>
    );
  }

  return (
    <StandardDataTable
      title={<TranslatedText text="Active Trips" />}
      subtitle={
        <>
          <TranslatedText text="Monitoring" /> {trips.length}{' '}
          <TranslatedText text="units live" />
        </>
      }
      icon={<Navigation className="w-5 h-5" />}
      headerColor="primary"
      headerActions={viewToggle}
      columns={columns}
      data={tableRows}
      loading={isLoading}
      error={error ? tSync('Failed to load trips') : null}
      onRetry={() => refetch()}
      getRowId={(row) => row.id}
      searchable
      searchPlaceholder={tSync('Search movements...')}
      searchKeys={['tripNumber', 'truckNumber', 'status', 'originLabel', 'destinationLabel']}
      filters={[
        {
          key: 'status',
          label: tSync('Status'),
          options: [
            { value: 'IN_PROGRESS', label: tSync('In Transit') },
            { value: 'DELAYED', label: tSync('Delayed') },
            { value: 'PLANNED', label: tSync('Planned') },
          ],
        },
      ]}
      pagination
      pageSize={10}
      columnVisibility
      stickyHeader
      striped
      hoverable
      rowActions={rowActions}
      onRefresh={() => refetch()}
      emptyMessage={tSync('No active trips found')}
      ariaLabel="Active trips"
    />
  );
};

export default ActiveTrips;
