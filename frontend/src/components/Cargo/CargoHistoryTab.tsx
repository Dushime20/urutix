import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Clock3,
  Package,
  UserCheck,
  Gavel,
  Truck,
  ClipboardCheck,
  Play,
  MapPin,
  PackageCheck,
  FileText,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Filter,
} from 'lucide-react';
import { loadsAPI } from '@/services/load';
import { cn } from '@/utils/cn';

export type CargoHistoryActivityType =
  | 'created'
  | 'published'
  | 'updated'
  | 'status_change'
  | 'broker_assigned'
  | 'broker_unassigned'
  | 'bid_submitted'
  | 'bid_accepted'
  | 'bid_rejected'
  | 'bid_withdrawn'
  | 'carrier_assigned'
  | 'inspection_started'
  | 'inspection_submitted'
  | 'inspection_approved'
  | 'inspection_failed'
  | 'loading_started'
  | 'loaded'
  | 'trip_started'
  | 'pickup_arrived'
  | 'pickup_completed'
  | 'in_transit'
  | 'delivery_arrived'
  | 'unloading_started'
  | 'unloading_completed'
  | 'delivered'
  | 'cancelled'
  | 'reposted'
  | 'document_uploaded'
  | 'document_deleted'
  | 'receiver_assigned'
  | 'tracking_update'
  | 'alert'
  | 'other';

export interface CargoHistoryItem {
  id: string;
  activityType: CargoHistoryActivityType;
  action: string;
  title: string;
  description: string;
  actorId?: string;
  actorName?: string;
  actorRole?: string;
  createdAt: string;
  source: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

type FilterKey =
  | 'all'
  | 'broker'
  | 'bidding'
  | 'inspection'
  | 'trip'
  | 'loading'
  | 'status'
  | 'documents';

const FILTER_GROUPS: Record<FilterKey, CargoHistoryActivityType[] | null> = {
  all: null,
  broker: ['broker_assigned', 'broker_unassigned', 'receiver_assigned'],
  bidding: ['bid_submitted', 'bid_accepted', 'bid_rejected', 'bid_withdrawn', 'carrier_assigned'],
  inspection: [
    'inspection_started',
    'inspection_submitted',
    'inspection_approved',
    'inspection_failed',
  ],
  trip: [
    'trip_started',
    'pickup_arrived',
    'pickup_completed',
    'in_transit',
    'delivery_arrived',
    'delivered',
  ],
  loading: [
    'loading_started',
    'loaded',
    'unloading_started',
    'unloading_completed',
  ],
  status: ['created', 'published', 'updated', 'status_change', 'cancelled', 'reposted'],
  documents: ['document_uploaded', 'document_deleted'],
};

function activityIcon(type: CargoHistoryActivityType) {
  switch (type) {
    case 'broker_assigned':
    case 'broker_unassigned':
    case 'receiver_assigned':
    case 'carrier_assigned':
      return UserCheck;
    case 'bid_submitted':
    case 'bid_accepted':
    case 'bid_rejected':
    case 'bid_withdrawn':
      return Gavel;
    case 'inspection_started':
    case 'inspection_submitted':
    case 'inspection_approved':
    case 'inspection_failed':
      return ClipboardCheck;
    case 'loading_started':
    case 'loaded':
    case 'unloading_started':
    case 'unloading_completed':
      return PackageCheck;
    case 'trip_started':
    case 'in_transit':
      return Play;
    case 'pickup_arrived':
    case 'pickup_completed':
    case 'delivery_arrived':
      return MapPin;
    case 'delivered':
      return Truck;
    case 'document_uploaded':
    case 'document_deleted':
      return FileText;
    case 'cancelled':
    case 'alert':
      return AlertTriangle;
    case 'created':
    case 'published':
      return Package;
    default:
      return Clock3;
  }
}

function activityColor(type: CargoHistoryActivityType): string {
  switch (type) {
    case 'bid_accepted':
    case 'delivered':
    case 'inspection_approved':
    case 'loaded':
    case 'unloading_completed':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'broker_assigned':
    case 'carrier_assigned':
    case 'receiver_assigned':
      return 'bg-sky-100 text-sky-700 border-sky-200';
    case 'bid_submitted':
    case 'trip_started':
    case 'loading_started':
    case 'inspection_started':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'bid_rejected':
    case 'inspection_failed':
    case 'cancelled':
    case 'alert':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'document_uploaded':
    case 'document_deleted':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

function formatDateTime(iso: string): { date: string; time: string; relative: string } {
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) {
    return { date: '—', time: '—', relative: '' };
  }
  const date = dt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const time = dt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const diffMs = Date.now() - dt.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  let relative = '';
  if (mins < 1) relative = 'Just now';
  else if (mins < 60) relative = `${mins}m ago`;
  else if (hours < 24) relative = `${hours}h ago`;
  else if (days < 7) relative = `${days}d ago`;
  else relative = date;
  return { date, time, relative };
}

interface CargoHistoryTabProps {
  cargoId: string | null;
  enabled?: boolean;
}

export default function CargoHistoryTab({
  cargoId,
  enabled = true,
}: CargoHistoryTabProps) {
  const [filter, setFilter] = useState<FilterKey>('all');

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['cargo-history', cargoId],
    queryFn: async () => {
      const res = await loadsAPI.getHistory(cargoId!, { page: 1, limit: 200 });
      const body = res.data;
      // Support both direct and wrapped API shapes
      const payload = body?.items ? body : body?.data;
      return {
        items: (payload?.items || []) as CargoHistoryItem[],
        total: payload?.total ?? 0,
        page: payload?.page ?? 1,
        limit: payload?.limit ?? 200,
      };
    },
    enabled: !!cargoId && enabled,
  });

  const items = data?.items || [];

  const filtered = useMemo(() => {
    const allowed = FILTER_GROUPS[filter];
    if (!allowed) return items;
    return items.filter((item) => allowed.includes(item.activityType));
  }, [items, filter]);

  const stats = useMemo(() => {
    const statusChanges = items.filter((i) =>
      ['status_change', 'created', 'published', 'cancelled', 'reposted', 'delivered', 'loaded', 'trip_started'].includes(
        i.activityType,
      ),
    ).length;
    const bids = items.filter((i) => i.activityType.startsWith('bid_')).length;
    const inspections = items.filter((i) =>
      i.activityType.startsWith('inspection_'),
    ).length;
    return { total: items.length, statusChanges, bids, inspections };
  }, [items]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-[#345E85]" />
        <p className="text-sm font-medium">Loading cargo history…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <p className="text-rose-800 font-medium mb-2">Could not load history</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 text-sm text-[#345E85] font-semibold hover:underline"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Clock3 className="w-5 h-5 text-[#345E85]" />
            Activity History
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Every broker assignment, bid, inspection, loading, and trip event with date &amp; time
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total events', value: stats.total },
          { label: 'Status / lifecycle', value: stats.statusChanges },
          { label: 'Bidding', value: stats.bids },
          { label: 'Inspections', value: stats.inspections },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {stat.label}
            </p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-slate-400" />
        {(
          [
            ['all', 'All'],
            ['broker', 'Broker'],
            ['bidding', 'Bidding'],
            ['inspection', 'Inspection'],
            ['loading', 'Loading'],
            ['trip', 'Trip'],
            ['status', 'Status'],
            ['documents', 'Documents'],
          ] as [FilterKey, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-semibold border transition-colors',
              filter === key
                ? 'bg-[#345E85] text-white border-[#345E85]'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-14 rounded-xl border border-dashed border-slate-200 bg-slate-50">
          <Clock3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 font-medium">No activity recorded yet</p>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Assignments, bids, inspections, loading, and trip milestones will appear here as they happen.
          </p>
        </div>
      ) : (
        <div className="relative pl-2">
          <div className="absolute left-[27px] top-3 bottom-3 w-px bg-slate-200" />
          <ul className="space-y-0">
            {filtered.map((item) => {
              const Icon = activityIcon(item.activityType);
              const colors = activityColor(item.activityType);
              const { date, time, relative } = formatDateTime(item.createdAt);
              return (
                <li key={item.id} className="relative flex gap-4 py-4">
                  <div
                    className={cn(
                      'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border',
                      colors,
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm">
                          {item.title}
                        </p>
                        <p className="text-sm text-slate-600 mt-0.5">
                          {item.description}
                        </p>
                        {(item.actorName || item.actorRole) && (
                          <p className="text-xs text-slate-400 mt-1.5">
                            By {item.actorName || 'Unknown'}
                            {item.actorRole ? ` · ${item.actorRole}` : ''}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-slate-800">
                          {date}
                        </p>
                        <p className="text-xs text-slate-500">{time}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide">
                          {relative}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
