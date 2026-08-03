import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { enhancedMatchingApi } from '../../services/enhancedMatchingApi';
import {
  ArrowLeft, Package, Truck, MapPin, ArrowRight,
  ChevronDown, Shield,
  CheckCircle, Zap, RefreshCw, Navigation, LayoutList, Table2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { StandardDataTable, StatusBadge, type Column } from '../../components/EnliteUI/Tables';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Haversine distance in km */
const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

/**
 * Calculate real distance from load origin/destination coordinates.
 * Falls back to matchDetails.distanceKm if coordinates are unavailable.
 */
const getDistance = (match: any): string => {
  const load = match.load;
  const details = match.matchDetails ?? match.match_details;

  const oLat = load?.origin?.lat
    ?? load?.locations?.find((l: any) => l.type === 'PICKUP')?.locationData?.coordinates?.latitude;
  const oLng = load?.origin?.lng
    ?? load?.locations?.find((l: any) => l.type === 'PICKUP')?.locationData?.coordinates?.longitude;
  const dLat = load?.destination?.lat
    ?? load?.locations?.find((l: any) => l.type === 'DELIVERY')?.locationData?.coordinates?.latitude;
  const dLng = load?.destination?.lng
    ?? load?.locations?.find((l: any) => l.type === 'DELIVERY')?.locationData?.coordinates?.longitude;

  if (oLat != null && oLng != null && dLat != null && dLng != null) {
    return `${haversineKm(oLat, oLng, dLat, dLng).toLocaleString()} km`;
  }
  if (details?.distanceKm != null) return `${Number(details.distanceKm).toLocaleString()} km`;
  return '—';
};

/**
 * Best available price:
 * trip.agreedPrice > matchDetails.estimatedCost > matchDetails.recommendedPrice > load.offeredPrice
 */
const getPriceValue = (match: any): number | null => {
  const details = match.matchDetails ?? match.match_details;
  const trip = match.trip;
  const val =
    (trip?.agreedPrice != null ? Number(trip.agreedPrice) : null) ??
    (details?.estimatedCost != null ? Number(details.estimatedCost) : null) ??
    (details?.recommendedPrice != null ? Number(details.recommendedPrice) : null) ??
    (match.load?.offeredPrice != null ? Number(match.load.offeredPrice) : null);
  return val == null || isNaN(val) ? null : val;
};

const fmtDate = (d: any) => {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};
// ─────────────────────────────────────────────────────────────────────────────

const AcceptedMatches: React.FC = () => {
  const navigate = useNavigate();
  const { format: formatCurrency } = useCurrencyFormat();
  const getPrice = (match: any): string => {
    const val = getPriceValue(match);
    return val == null ? '—' : formatCurrency(val);
  };
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/matching/cargo-owner/matches');
      const body = res.data;
      setMatches(Array.isArray(body?.data) ? body.data : []);
    } catch {
      toast.error('Failed to load accepted matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreateTrip = async (matchId: string) => {
    setProcessingId(matchId);
    try {
      await enhancedMatchingApi.createTripForMatch(matchId);
      toast.success('Trip created successfully');
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create trip');
    } finally {
      setProcessingId(null);
    }
  };

  const sorted = [...matches].sort((a, b) => {
    const p = (s: string) => s === 'ACCEPTED' ? 0 : 1;
    if (p(a.status) !== p(b.status)) return p(a.status) - p(b.status);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const matchColumns = useMemo<Column<any>[]>(() => [
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_v, match) => <StatusBadge status={match.status} label={match.status} />,
    },
    {
      key: 'load',
      label: 'Cargo',
      render: (_v, match) => (
        <div className="max-w-[160px]">
          <p className="font-black text-slate-900 text-xs truncate">{match.load?.title || `Cargo ${match.loadId?.slice(0, 8)}`}</p>
          <p className="text-[10px] text-slate-400 truncate">{match.load?.cargoType || '—'}</p>
        </div>
      ),
    },
    {
      key: 'weight',
      label: 'Weight',
      render: (_v, match) => (
        <span className="text-xs text-slate-600 whitespace-nowrap">{Number(match.load?.weight || 0).toLocaleString()} kg</span>
      ),
    },
    {
      key: 'truck',
      label: 'Truck',
      render: (_v, match) => (
        <div>
          <p className="text-xs font-bold text-slate-700 whitespace-nowrap">{match.truck?.plateNumber || '—'}</p>
          <p className="text-[10px] text-slate-400">{`${match.truck?.make || ''} ${match.truck?.model || ''}`.trim() || '—'}</p>
        </div>
      ),
    },
    {
      key: 'owner',
      label: 'Truck Owner',
      render: (_v, match) => {
        const details = match.matchDetails ?? match.match_details;
        return (
          <span className="text-xs text-slate-600 max-w-[120px] truncate block">
            {match.truck?.owner?.profile?.firstName
              ? `${match.truck.owner.profile.firstName} ${match.truck.owner.profile.lastName || ''}`.trim()
              : details?.ownerName || '—'}
          </span>
        );
      },
    },
    {
      key: 'route',
      label: 'Route',
      render: (_v, match) => (
        <div className="flex items-center gap-1 text-xs text-slate-600 whitespace-nowrap">
          <span className="truncate max-w-[70px]">
            {match.load?.origin?.city
              || match.load?.locations?.find((l: any) => l.type === 'PICKUP')?.locationData?.city
              || '—'}
          </span>
          <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
          <span className="truncate max-w-[70px]">
            {match.load?.destination?.city
              || match.load?.locations?.find((l: any) => l.type === 'DELIVERY')?.locationData?.city
              || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'distance',
      label: 'Distance',
      render: (_v, match) => <span className="text-xs text-slate-600 whitespace-nowrap">{getDistance(match)}</span>,
    },
    {
      key: 'cost',
      label: 'Est. Cost',
      render: (_v, match) => <span className="text-xs font-black text-slate-900 whitespace-nowrap">{getPrice(match)}</span>,
    },
    {
      key: 'score',
      label: 'Score',
      sortable: true,
      render: (_v, match) => (
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border whitespace-nowrap ${
          (match.score || 0) >= 0.9 ? 'bg-green-50 text-green-600 border-green-200' :
          (match.score || 0) >= 0.8 ? 'bg-blue-50 text-blue-600 border-blue-200' :
          (match.score || 0) >= 0.7 ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
          'bg-red-50 text-red-600 border-red-200'
        }`}>{Math.round((match.score || 0) * 100)}%</span>
      ),
    },
    {
      key: 'pickupDate',
      label: 'Pickup Date',
      render: (_v, match) => <span className="text-xs text-slate-500 whitespace-nowrap">{fmtDate(match.load?.pickupDate)}</span>,
    },
    {
      key: 'action',
      label: 'Action',
      render: (_v, match) => (
        <div className="whitespace-nowrap">
          {match.status === 'ACCEPTED' && !match.trip && (
            <button
              onClick={() => handleCreateTrip(match.id)}
              disabled={processingId === match.id}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#345E85] hover:bg-slate-800 disabled:bg-slate-200 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
            >
              {processingId === match.id
                ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><CheckCircle className="w-3 h-3" /> Start Trip</>}
            </button>
          )}
          {match.status === 'ACCEPTED' && match.trip && (
            <button
              onClick={() => navigate('/dashboard/tracking')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
            >
              <Navigation className="w-3 h-3" /> Track
            </button>
          )}
          {match.status === 'REQUESTED' && (
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Awaiting...</span>
          )}
        </div>
      ),
    },
  ], [getPrice, navigate, processingId]);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-emerald-50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Accepted Matches</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Truck Responses</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Matches accepted by truck owners — take action to start the trip
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          {sorted.length > 0 && !loading && (
            <div className="flex bg-slate-50 p-1 rounded-xl gap-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                title="Card view"
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                title="Table view"
              >
                <Table2 className="w-4 h-4" />
              </button>
            </div>
          )}
          <button onClick={load}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-16 flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-slate-100 border-t-[#345E85] rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading matches...</p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-16 flex flex-col items-center gap-4 text-center">
          <div className="size-16 bg-slate-50 rounded-2xl flex items-center justify-center">
            <Zap className="w-7 h-7 text-slate-200" />
          </div>
          <p className="text-sm font-black text-slate-700 uppercase tracking-widest">No accepted matches yet</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-xs">
            When a truck owner accepts your match request, it will appear here.
          </p>
          <button onClick={() => navigate('/dashboard/smart-matching')}
            className="mt-2 px-5 py-2.5 bg-[#345E85] text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
            Run Smart Matching
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* ── TABLE VIEW ─────────────────────────────────────────── */}
          {viewMode === 'table' && (
            <StandardDataTable<any>
              embedded
              className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-2"
              columns={matchColumns}
              data={sorted}
              getRowId={(row) => row.id}
              searchPlaceholder="Search matches…"
              searchKeys={['status', 'load.title', 'truck.plateNumber']}
              stickyHeader
              columnVisibility
              pagination
              emptyMessage="No accepted matches yet"
              ariaLabel="Accepted matches"
            />
          )}

          {/* ── CARDS VIEW ─────────────────────────────────────────── */}
          {viewMode === 'cards' && (
            <AnimatePresence>
              {sorted.map(match => {
              const details = match.matchDetails ?? match.match_details;
              return (
                <motion.div key={match.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden"
                >
                  {/* Status stripe */}
                  <div className={`h-1 w-full ${match.status === 'ACCEPTED' ? 'bg-emerald-400' : 'bg-primary-400'}`} />

                  <div className="p-6">
                    {/* Top row */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            match.status === 'ACCEPTED'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              : 'bg-primary-50 text-primary-500 border-primary-100'
                          }`}>{match.status}</span>
                          <span className="flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-500 rounded-full border border-primary-100 text-[9px] font-black uppercase tracking-widest">
                            <Zap className="w-2.5 h-2.5 fill-current" /> Match {Math.round((match.score || 0) * 100)}%
                          </span>
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                            {fmtDate(match.createdAt)}
                          </span>
                        </div>

                        <h3 className="text-xl font-black text-slate-900 tracking-tight mb-4">
                          {match.load?.title || `Cargo ${match.loadId?.slice(0, 8)}`}
                        </h3>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <Stat icon={<Package className="w-3.5 h-3.5 text-primary-400" />} label="Payload" value={`${Number(match.load?.weight || 0).toLocaleString()} kg`} />
                          <Stat icon={<Truck className="w-3.5 h-3.5 text-primary-400" />} label="Truck" value={match.truck?.plateNumber || '—'} />
                          <Stat icon={<Shield className="w-3.5 h-3.5 text-primary-400" />} label="Truck Owner" value={
                            match.truck?.owner?.profile?.firstName
                              ? `${match.truck.owner.profile.firstName} ${match.truck.owner.profile.lastName || ''}`.trim()
                              : details?.ownerName || 'Unknown'
                          } />
                          <div className="col-span-2 lg:col-span-1 space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Route</p>
                            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                              <MapPin className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                              <span className="truncate">
                                {match.load?.origin?.city
                                  || match.load?.locations?.find((l: any) => l.type === 'PICKUP')?.locationData?.city
                                  || 'Origin'}
                              </span>
                              <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                              <span className="truncate">
                                {match.load?.destination?.city
                                  || match.load?.locations?.find((l: any) => l.type === 'DELIVERY')?.locationData?.city
                                  || 'Destination'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* View details toggle */}
                        <button
                          onClick={() => setExpandedId(expandedId === match.id ? null : match.id)}
                          className="mt-4 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-primary-400 hover:text-primary-600 transition-colors"
                        >
                          {expandedId === match.id ? <ChevronDown className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {expandedId === match.id ? 'Hide Details' : 'View Details'}
                        </button>

                        {/* Expanded details */}
                        <AnimatePresence>
                          {expandedId === match.id && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                              <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">

                                {/* Cargo Details */}
                                <div className="space-y-2.5">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Cargo Details</p>
                                  <DR label="Type" value={match.load?.cargoType || '—'} />
                                  <DR label="Weight" value={`${Number(match.load?.weight || 0).toLocaleString()} kg`} />
                                  <DR label="Agreed Price" value={getPrice(match)} highlight />
                                  <DR label="Pickup" value={
                                    match.load?.origin?.city
                                    || match.load?.locations?.find((l: any) => l.type === 'PICKUP')?.locationData?.city
                                    || '—'
                                  } />
                                  <DR label="Delivery" value={
                                    match.load?.destination?.city
                                    || match.load?.locations?.find((l: any) => l.type === 'DELIVERY')?.locationData?.city
                                    || '—'
                                  } />
                                  <DR label="Pickup Date" value={fmtDate(match.load?.pickupDate)} />
                                  <DR label="Delivery Date" value={fmtDate(match.load?.deliveryDate)} />
                                </div>

                                {/* Truck Details */}
                                <div className="space-y-2.5">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Truck Details</p>
                                  <DR label="Plate" value={match.truck?.plateNumber || '—'} />
                                  <DR label="Make / Model" value={`${match.truck?.make || ''} ${match.truck?.model || ''}`.trim() || '—'} />
                                  <DR label="Type" value={match.truck?.truckType || '—'} />
                                  <DR label="Capacity" value={`${Number(match.truck?.capacityWeight || 0).toLocaleString()} kg`} />
                                  <DR label="GPS" value={match.truck?.hasGps ? '✅ Yes' : '❌ No'} />
                                  <DR label="Refrigeration" value={match.truck?.hasRefrigeration ? '✅ Yes' : '❌ No'} />
                                </div>

                                {/* Match Info */}
                                <div className="space-y-2.5">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Match Info</p>
                                  <DR label="Score" value={`${Math.round((match.score || 0) * 100)}%`} highlight />
                                  <DR label="Est. Cost" value={getPrice(match)} highlight />
                                  <DR label="Distance" value={getDistance(match)} />
                                  <DR label="Est. Delivery" value={details?.estimatedDeliveryTime ? `${details.estimatedDeliveryTime} hrs` : '—'} />
                                  <DR label="Success Prob." value={details?.successProbability ? `${Math.round(details.successProbability * 100)}%` : '—'} />
                                  {details?.matchReason && (
                                    <div className="pt-2">
                                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Match Reason</p>
                                      <p className="text-[10px] text-slate-500 leading-relaxed">{details.matchReason}</p>
                                    </div>
                                  )}
                                </div>

                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-3 shrink-0">
                        {match.status === 'ACCEPTED' && !match.trip && (
                          <button
                            onClick={() => handleCreateTrip(match.id)}
                            disabled={processingId === match.id}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#345E85] hover:bg-slate-800 disabled:bg-slate-200 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                          >
                            {processingId === match.id
                              ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</>
                              : <><CheckCircle className="w-3.5 h-3.5" /> Start Trip</>
                            }
                          </button>
                        )}
                        {match.status === 'ACCEPTED' && match.trip && (
                          <button
                            onClick={() => navigate('/dashboard/tracking')}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                          >
                            <Navigation className="w-3.5 h-3.5" /> Track Trip
                          </button>
                        )}
                        {match.status === 'REQUESTED' && (
                          <div className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">
                            Awaiting truck owner response
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          )}
        </div>
      )}
    </div>
  );
};

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="space-y-1">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">{icon} {value}</div>
  </div>
);

const DR = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="flex items-center justify-between gap-2 py-1 border-b border-slate-50 last:border-0">
    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 shrink-0">{label}</span>
    <span className={`text-[10px] font-black truncate ${highlight ? 'text-[#345E85]' : 'text-slate-700'}`}>{value}</span>
  </div>
);

export default AcceptedMatches;
