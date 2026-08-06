import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { enhancedMatchingApi } from '../../services/enhancedMatchingApi';
import {
  Check,
  X,
  Navigation,
  CheckCircle2,
  Zap,
  Clock,
  Package,
  Truck,
  MapPin,
  DollarSign,
  Weight,
  Shield,
  Thermometer,
  AlertTriangle,
  Eye,
  Calendar,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import {
  StandardDataTable,
  StatusBadge,
  type Column,
  type TableAction,
} from '../EnliteUI/Tables';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';

type MatchRecord = {
  id: string;
  score: number;
  status: string;
  createdAt: string;
  matchDetails?: Record<string, any>;
  load?: Record<string, any> | null;
  truck?: Record<string, any> | null;
  trip?: Record<string, any> | null;
};

const getPickup = (load: Record<string, any> | null | undefined) => {
  const fromLoc = load?.locations?.find((l: any) => l.type === 'PICKUP')?.locationData;
  return {
    city: fromLoc?.city || load?.origin?.city || 'Origin',
    address:
      fromLoc?.address ||
      (load?.origin?.city
        ? `${load.origin.city}${load.origin.country ? `, ${load.origin.country}` : ''}`
        : '—'),
    country: fromLoc?.country || load?.origin?.country || '',
  };
};

const getDelivery = (load: Record<string, any> | null | undefined) => {
  const fromLoc = load?.locations?.find((l: any) => l.type === 'DELIVERY')?.locationData;
  return {
    city: fromLoc?.city || load?.destination?.city || 'Destination',
    address:
      fromLoc?.address ||
      (load?.destination?.city
        ? `${load.destination.city}${load.destination.country ? `, ${load.destination.country}` : ''}`
        : '—'),
    country: fromLoc?.country || load?.destination?.country || '',
  };
};

const formatDate = (value?: string | Date | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const scorePct = (value?: number | null) => Math.round((Number(value) || 0) * 100);

export const TruckMatches: React.FC = () => {
  const navigate = useNavigate();
  const { format: formatCurrency } = useCurrencyFormat();
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingMatchId, setProcessingMatchId] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchRecord | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [acceptedMatchDetails, setAcceptedMatchDetails] = useState<any>(null);
  const [confirmMatch, setConfirmMatch] = useState<{ id: string; match: MatchRecord } | null>(null);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await enhancedMatchingApi.getTruckOwnerMatches();
      setMatches(result.data || []);
    } catch {
      setError('Failed to load smart matches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const handleCreateTrip = async (matchId: string) => {
    setProcessingMatchId(matchId);
    try {
      const result = await enhancedMatchingApi.createTripForMatch(matchId);
      toast.success('Trip activated successfully');
      const match = matches.find((m) => m.id === matchId);
      if (match) {
        setAcceptedMatchDetails({ match: { ...match, trip: result.data }, response: result });
        setShowSuccessModal(true);
        setSelectedMatch(null);
      }
      await loadMatches();
    } catch {
      toast.error('Trip activation failed');
    } finally {
      setProcessingMatchId(null);
    }
  };

  const handleRespond = async (matchId: string, status: 'ACCEPTED' | 'REJECTED', match: MatchRecord) => {
    setProcessingMatchId(matchId);
    try {
      const response = await enhancedMatchingApi.respondToMatch(matchId, status);
      if (status === 'ACCEPTED') {
        setAcceptedMatchDetails({ match, response: response.data });
        setShowSuccessModal(true);
        setSelectedMatch(null);
        toast.success('Match accepted');
      } else {
        toast.success('Match declined');
        if (selectedMatch?.id === matchId) setSelectedMatch(null);
      }
      await loadMatches();
    } catch {
      toast.error('Unable to update match');
    } finally {
      setProcessingMatchId(null);
    }
  };

  const handleViewTrip = () => {
    setShowSuccessModal(false);
    navigate('/dashboard/trips');
  };

  const sortedMatches = useMemo(
    () =>
      [...matches].sort((a, b) => {
        if (a.status === 'REQUESTED' && b.status !== 'REQUESTED') return -1;
        if (a.status !== 'REQUESTED' && b.status === 'REQUESTED') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    [matches],
  );

  const columns: Column<MatchRecord>[] = useMemo(
    () => [
      {
        key: 'load',
        label: 'LOAD',
        sortable: true,
        render: (_v, match) => (
          <div className="flex flex-col min-w-0 max-w-[220px]">
            <span className="font-black text-slate-900 dark:text-white uppercase text-[11px] truncate">
              {match.load?.title || 'Untitled Load'}
            </span>
            <span className="mt-1 text-[9px] font-bold text-[#345E85] uppercase tracking-wider truncate">
              {match.load?.cargoType?.replace(/_/g, ' ') || 'General cargo'}
            </span>
          </div>
        ),
      },
      {
        key: 'route',
        label: 'ROUTE',
        render: (_v, match) => {
          const pickup = getPickup(match.load);
          const delivery = getDelivery(match.load);
          return (
            <div className="flex flex-col gap-1.5 min-w-[160px] max-w-[220px]">
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                  {pickup.city}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-rose-500 shrink-0" />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                  {delivery.city}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        key: 'truck',
        label: 'FLEET UNIT',
        render: (_v, match) => (
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase">
              {match.truck?.plateNumber || '—'}
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              {[match.truck?.make, match.truck?.model].filter(Boolean).join(' ') || match.truck?.truckType || '—'}
            </span>
          </div>
        ),
      },
      {
        key: 'score',
        label: 'MATCH SCORE',
        sortable: true,
        render: (_v, match) => {
          const pct = scorePct(match.score);
          const bar =
            pct >= 80 ? 'bg-emerald-400' : pct >= 60 ? 'bg-[#345E85]' : 'bg-amber-400';
          return (
            <div className="flex items-center gap-2 min-w-[100px]">
              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden max-w-[64px]">
                <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[11px] font-black text-[#345E85]">{pct}%</span>
            </div>
          );
        },
      },
      {
        key: 'payload',
        label: 'PAYLOAD / PRICE',
        render: (_v, match) => {
          const price = match.load?.offeredPrice ?? match.matchDetails?.recommendedPrice;
          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {Number(match.load?.weight || 0).toLocaleString()} kg
              </span>
              <span className="text-[10px] font-black text-[#345E85]">
                {price != null ? formatCurrency(Number(price)) : '—'}
              </span>
            </div>
          );
        },
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        render: (_v, match) => {
          const variantMap: Record<string, 'warning' | 'success' | 'error' | 'neutral' | 'info'> = {
            REQUESTED: 'warning',
            ACCEPTED: 'success',
            REJECTED: 'error',
            EXPIRED: 'neutral',
            POTENTIAL: 'info',
          };
          return (
            <StatusBadge
              variant={variantMap[match.status] || 'neutral'}
              label={match.status}
            />
          );
        },
      },
      {
        key: 'createdAt',
        label: 'DATE',
        sortable: true,
        render: (_v, match) => (
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {formatDate(match.createdAt)}
          </span>
        ),
      },
    ],
    [formatCurrency],
  );

  const rowActions: TableAction<MatchRecord>[] = useMemo(
    () => [
      {
        key: 'details',
        label: 'View Details',
        icon: <Eye size={14} />,
        onClick: (match) => setSelectedMatch(match),
      },
      {
        key: 'accept',
        label: 'Authorize Match',
        icon: <Check size={14} />,
        variant: 'success',
        hidden: (match) => match.status !== 'REQUESTED',
        disabled: (match) => processingMatchId === match.id,
        onClick: (match) => setConfirmMatch({ id: match.id, match }),
      },
      {
        key: 'reject',
        label: 'Decline',
        icon: <X size={14} />,
        variant: 'danger',
        hidden: (match) => match.status !== 'REQUESTED',
        disabled: (match) => processingMatchId === match.id,
        onClick: (match) => handleRespond(match.id, 'REJECTED', match),
      },
      {
        key: 'create-trip',
        label: 'Activate Trip',
        icon: <CheckCircle2 size={14} />,
        variant: 'success',
        hidden: (match) => match.status !== 'ACCEPTED' || !!match.trip,
        disabled: (match) => processingMatchId === match.id,
        onClick: (match) => handleCreateTrip(match.id),
      },
      {
        key: 'view-trip',
        label: 'Open Trip',
        icon: <Navigation size={14} />,
        hidden: (match) => match.status !== 'ACCEPTED' || !match.trip,
        onClick: () => navigate('/dashboard/trips'),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [processingMatchId, navigate],
  );

  const requestedCount = matches.filter((m) => m.status === 'REQUESTED').length;
  const acceptedCount = matches.filter((m) => m.status === 'ACCEPTED').length;

  return (
    <>
      <div className="space-y-4 p-2">
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <StandardDataTable<MatchRecord>
          title="Smart Matching"
          subtitle={`${requestedCount} pending · ${acceptedCount} accepted · ${matches.length} total matches`}
          icon={<Zap className="w-5 h-5" />}
          headerColor="primary"
          loading={loading}
          searchable
          pagination
          pageSize={10}
          columnVisibility
          stickyHeader
          striped
          hoverable
          columns={columns}
          data={sortedMatches}
          getRowId={(row) => row.id}
          searchKeys={['status', 'load.title', 'load.cargoType', 'truck.plateNumber', 'truck.make', 'truck.model']}
          searchPlaceholder="Search by load, truck, status…"
          emptyMessage="No smart matches yet. When cargo owners request your fleet, matches will appear here."
          rowActions={rowActions}
          onRowClick={(row) => setSelectedMatch(row)}
          ariaLabel="Smart matching table"
        />
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedMatch} onOpenChange={(open) => !open && setSelectedMatch(null)}>
        <DialogContent className="max-w-4xl bg-white dark:bg-slate-900 rounded-[28px] p-0 border-0 overflow-hidden shadow-2xl h-[85vh] flex flex-col">
          {selectedMatch && (
            <>
              <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <DialogTitle className="flex items-start justify-between gap-4 pr-8">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-12 w-12 bg-[#345E85]/10 rounded-2xl flex items-center justify-center text-[#345E85] shrink-0">
                      <Zap size={22} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                        {selectedMatch.load?.title || 'Match Details'}
                      </h2>
                      <p className="text-xs font-medium text-slate-400 mt-0.5">
                        Match score {scorePct(selectedMatch.score)}% · {formatDate(selectedMatch.createdAt)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge
                    status={selectedMatch.status}
                    variant={
                      selectedMatch.status === 'REQUESTED'
                        ? 'warning'
                        : selectedMatch.status === 'ACCEPTED'
                          ? 'success'
                          : selectedMatch.status === 'REJECTED'
                            ? 'error'
                            : 'neutral'
                    }
                    label={selectedMatch.status}
                  />
                </DialogTitle>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Score + price strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <SummaryTile
                    label="Match Score"
                    value={`${scorePct(selectedMatch.score)}%`}
                    accent
                  />
                  <SummaryTile
                    label="Payload"
                    value={`${Number(selectedMatch.load?.weight || 0).toLocaleString()} kg`}
                  />
                  <SummaryTile
                    label="Offered Price"
                    value={
                      selectedMatch.load?.offeredPrice != null || selectedMatch.matchDetails?.recommendedPrice != null
                        ? formatCurrency(
                            Number(
                              selectedMatch.load?.offeredPrice ??
                                selectedMatch.matchDetails?.recommendedPrice,
                            ),
                          )
                        : '—'
                    }
                  />
                  <SummaryTile
                    label="Est. Distance"
                    value={
                      selectedMatch.matchDetails?.distanceKm != null
                        ? `${selectedMatch.matchDetails.distanceKm} km`
                        : '—'
                    }
                  />
                </div>

                {/* Route */}
                <section>
                  <SectionHeading icon={<MapPin size={14} />} title="Route" />
                  <div className="relative pl-6 space-y-6 before:absolute before:left-[7px] before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                    <RouteCard
                      tone="pickup"
                      title="Pickup"
                      city={getPickup(selectedMatch.load).city}
                      address={getPickup(selectedMatch.load).address}
                      date={selectedMatch.load?.pickupDate}
                    />
                    <RouteCard
                      tone="delivery"
                      title="Delivery"
                      city={getDelivery(selectedMatch.load).city}
                      address={getDelivery(selectedMatch.load).address}
                      date={selectedMatch.load?.deliveryDate}
                    />
                  </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Cargo */}
                  <section>
                    <SectionHeading icon={<Package size={14} />} title="Cargo Details" />
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 space-y-2.5">
                      <DetailRow icon={<Package size={12} />} label="Type" value={selectedMatch.load?.cargoType?.replace(/_/g, ' ') || '—'} />
                      <DetailRow icon={<Weight size={12} />} label="Weight" value={`${Number(selectedMatch.load?.weight || 0).toLocaleString()} kg`} />
                      <DetailRow
                        icon={<DollarSign size={12} />}
                        label="Cargo Value"
                        value={selectedMatch.load?.loadValue != null ? formatCurrency(Number(selectedMatch.load.loadValue)) : '—'}
                      />
                      {selectedMatch.load?.numberOfPieces != null && (
                        <DetailRow icon={<Package size={12} />} label="Pieces" value={Number(selectedMatch.load.numberOfPieces).toLocaleString()} />
                      )}
                      {selectedMatch.load?.numberOfPallets != null && (
                        <DetailRow icon={<Package size={12} />} label="Pallets" value={Number(selectedMatch.load.numberOfPallets).toLocaleString()} />
                      )}
                      {selectedMatch.load?.packagingType && (
                        <DetailRow icon={<Package size={12} />} label="Packaging" value={selectedMatch.load.packagingType} />
                      )}
                      {selectedMatch.load?.length != null && (
                        <DetailRow
                          icon={<Package size={12} />}
                          label="Dimensions"
                          value={`${selectedMatch.load.length} × ${selectedMatch.load.width} × ${selectedMatch.load.height} m`}
                        />
                      )}
                      {selectedMatch.load?.insuranceValue != null && (
                        <DetailRow
                          icon={<Shield size={12} />}
                          label="Insurance Value"
                          value={formatCurrency(Number(selectedMatch.load.insuranceValue))}
                        />
                      )}
                      {selectedMatch.matchDetails?.estimatedCost != null && (
                        <DetailRow
                          icon={<DollarSign size={12} />}
                          label="Suggested Price"
                          value={formatCurrency(Number(selectedMatch.matchDetails.estimatedCost))}
                        />
                      )}
                      {selectedMatch.load?.specialHandlingInstructions && (
                        <DetailRow
                          icon={<AlertTriangle size={12} />}
                          label="Special Handling"
                          value={selectedMatch.load.specialHandlingInstructions}
                        />
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedMatch.load?.isFragile && <ReqChip warn label="Fragile" />}
                      {selectedMatch.load?.isHazardous && <ReqChip warn label="Hazardous" />}
                      {selectedMatch.load?.requiresRefrigeration && <ReqChip label="Refrigeration" icon={<Thermometer size={10} />} />}
                      {selectedMatch.load?.requiresForklift && <ReqChip label="Forklift" />}
                      {selectedMatch.load?.requiresCrane && <ReqChip label="Crane" />}
                      {selectedMatch.load?.requiresLoadingDock && <ReqChip label="Loading Dock" />}
                      {selectedMatch.load?.requiresGpsMonitoring && <ReqChip label="GPS Monitoring" icon={<Shield size={10} />} />}
                      {selectedMatch.load?.temperatureMin != null && (
                        <ReqChip
                          label={`Temp ${selectedMatch.load.temperatureMin}°C – ${selectedMatch.load.temperatureMax}°C`}
                          icon={<Thermometer size={10} />}
                        />
                      )}
                    </div>
                  </section>

                  {/* Truck */}
                  <section>
                    <SectionHeading icon={<Truck size={14} />} title="Assigned Truck" />
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 space-y-2.5">
                      <DetailRow icon={<Truck size={12} />} label="Plate" value={selectedMatch.truck?.plateNumber || '—'} />
                      <DetailRow
                        icon={<Truck size={12} />}
                        label="Make / Model"
                        value={`${selectedMatch.truck?.make || ''} ${selectedMatch.truck?.model || ''}`.trim() || '—'}
                      />
                      <DetailRow icon={<Truck size={12} />} label="Type" value={selectedMatch.truck?.truckType || '—'} />
                      <DetailRow
                        icon={<Weight size={12} />}
                        label="Capacity"
                        value={`${Number(selectedMatch.truck?.capacityWeight || 0).toLocaleString()} kg`}
                      />
                      <DetailRow icon={<Shield size={12} />} label="GPS" value={selectedMatch.truck?.hasGps ? 'Available' : 'Not available'} />
                      <DetailRow
                        icon={<Thermometer size={12} />}
                        label="Refrigeration"
                        value={selectedMatch.truck?.hasRefrigeration ? 'Available' : 'Not available'}
                      />
                      <DetailRow
                        icon={<Shield size={12} />}
                        label="Hazmat Permit"
                        value={selectedMatch.truck?.hasHazmatPermit ? 'Yes' : 'No'}
                      />
                    </div>

                    {selectedMatch.matchDetails?.matchReason && (
                      <div className="mt-3 p-4 rounded-2xl border border-[#345E85]/15 bg-[#345E85]/5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#345E85] mb-1.5">
                          Match Reason
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {selectedMatch.matchDetails.matchReason}
                        </p>
                      </div>
                    )}
                  </section>
                </div>

                {/* Match scores */}
                {selectedMatch.matchDetails && (
                  <section>
                    <SectionHeading icon={<Zap size={14} />} title="Match Breakdown" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
                      <ScoreBar label="Overall" value={selectedMatch.score} />
                      <ScoreBar label="Capacity" value={selectedMatch.matchDetails.capacityScore} />
                      <ScoreBar label="Equipment" value={selectedMatch.matchDetails.equipmentScore} />
                      <ScoreBar label="Distance" value={selectedMatch.matchDetails.distanceScore} />
                      <ScoreBar label="GPS" value={selectedMatch.matchDetails.gpsTrackingScore} />
                      <ScoreBar label="Availability" value={selectedMatch.matchDetails.availabilityScore} />
                    </div>
                  </section>
                )}
              </div>

              {/* Footer actions */}
              <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex flex-wrap gap-3 justify-end bg-white dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setSelectedMatch(null)}
                  className="h-10 px-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  Close
                </button>

                {selectedMatch.status === 'REQUESTED' && (
                  <>
                    <button
                      type="button"
                      disabled={processingMatchId === selectedMatch.id}
                      onClick={() => handleRespond(selectedMatch.id, 'REJECTED', selectedMatch)}
                      className="h-10 px-5 flex items-center gap-2 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 border border-transparent hover:border-rose-100 transition-all disabled:opacity-50"
                    >
                      <X size={14} /> Decline
                    </button>
                    <button
                      type="button"
                      disabled={processingMatchId === selectedMatch.id}
                      onClick={() => setConfirmMatch({ id: selectedMatch.id, match: selectedMatch })}
                      className="h-10 px-5 flex items-center gap-2 bg-[#345E85] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-[#345E85]/20 disabled:opacity-50"
                    >
                      {processingMatchId === selectedMatch.id ? (
                        <Clock size={14} className="animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                      Authorize Match
                    </button>
                  </>
                )}

                {selectedMatch.status === 'ACCEPTED' &&
                  (selectedMatch.trip ? (
                    <button
                      type="button"
                      onClick={handleViewTrip}
                      className="h-10 px-5 flex items-center gap-2 bg-[#345E85] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                    >
                      <Navigation size={14} /> Open Trip
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={processingMatchId === selectedMatch.id}
                      onClick={() => handleCreateTrip(selectedMatch.id)}
                      className="h-10 px-5 flex items-center gap-2 bg-[#345E85] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
                    >
                      {processingMatchId === selectedMatch.id ? (
                        <Clock size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={14} />
                      )}
                      Activate Trip
                    </button>
                  ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Authorize Confirmation Modal */}
      <AnimatePresence>
        {confirmMatch && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[13000] p-4"
            onClick={() => setConfirmMatch(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full overflow-hidden border border-slate-100 dark:border-gray-800 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 pb-4 border-b border-slate-100 dark:border-gray-800 flex items-center gap-3">
                <div className="size-10 bg-[#345E85]/10 rounded-xl flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-[#345E85]" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                    Authorize Match
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Review before confirming
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-3">
                <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
                  <ConfirmRow label="Cargo" value={confirmMatch.match.load?.title || '—'} />
                  <ConfirmRow label="Truck" value={confirmMatch.match.truck?.plateNumber || '—'} />
                  <ConfirmRow
                    label="Route"
                    value={`${getPickup(confirmMatch.match.load).city} → ${getDelivery(confirmMatch.match.load).city}`}
                  />
                  <ConfirmRow label="Match Score" value={`${scorePct(confirmMatch.match.score)}%`} accent />
                  <ConfirmRow
                    label="Weight"
                    value={`${Number(confirmMatch.match.load?.weight || 0).toLocaleString()} kg`}
                  />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  By authorizing, you confirm your truck will handle this cargo. The cargo owner will be notified.
                </p>
              </div>

              <div className="px-6 pb-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmMatch(null)}
                  className="flex-1 h-10 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const { id, match } = confirmMatch;
                    setConfirmMatch(null);
                    await handleRespond(id, 'ACCEPTED', match);
                  }}
                  disabled={processingMatchId === confirmMatch.id}
                  className="flex-1 h-10 bg-[#345E85] hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-[#345E85]/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingMatchId === confirmMatch.id ? (
                    <Clock size={13} className="animate-spin" />
                  ) : (
                    <Check size={13} />
                  )}
                  Authorize
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && acceptedMatchDetails && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[13000] p-4"
            onClick={() => setShowSuccessModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full overflow-hidden border border-slate-100 dark:border-gray-800 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 bg-[#345E85] text-white text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Zap size={64} />
                </div>
                <div className="size-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 size={24} />
                </div>
                <h2 className="text-xl font-black tracking-tight mb-0.5">Match Authorized</h2>
                <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em]">
                  Synchronized & Active
                </p>
              </div>

              <div className="p-5 space-y-4">
                <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between">
                  {[
                    {
                      l: 'Load',
                      v: acceptedMatchDetails.match.load?.title,
                      i: Package,
                    },
                    {
                      l: 'Fleet Unit',
                      v: acceptedMatchDetails.match.truck?.plateNumber,
                      i: Truck,
                    },
                    {
                      l: 'Route',
                      v: `${getPickup(acceptedMatchDetails.match.load).city} → ${getDelivery(acceptedMatchDetails.match.load).city}`,
                      i: MapPin,
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="size-7 bg-[#345E85]/10 rounded-lg flex items-center justify-center text-[#345E85] shrink-0">
                        <item.i size={13} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          {item.l}
                        </p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.v}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-[#345E85]/5 rounded-xl border border-[#345E85]/10">
                  <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-relaxed uppercase tracking-wider">
                    <strong className="text-[#345E85]">Next step:</strong> Continue to the Trips dashboard for
                    operational tracking.
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowSuccessModal(false)}
                  className="flex-1 h-10 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleViewTrip}
                  className="flex-1 h-10 bg-[#345E85] hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-[#345E85]/20"
                >
                  Trips Dashboard
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

const SectionHeading = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <h3 className="text-xs font-black text-[#345E85] uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
    {icon} {title}
  </h3>
);

const SummaryTile = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) => (
  <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4">
    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
    <p className={`text-sm font-black truncate ${accent ? 'text-[#345E85]' : 'text-slate-900 dark:text-white'}`}>
      {value}
    </p>
  </div>
);

const RouteCard = ({
  tone,
  title,
  city,
  address,
  date,
}: {
  tone: 'pickup' | 'delivery';
  title: string;
  city: string;
  address: string;
  date?: string | Date | null;
}) => (
  <div className="relative">
    <div
      className={`absolute -left-[27px] top-1 h-4 w-4 bg-white dark:bg-slate-900 border-[3px] rounded-full ${
        tone === 'pickup' ? 'border-emerald-500' : 'border-rose-500'
      }`}
    />
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{title}</p>
      <p className="text-sm font-black text-slate-900 dark:text-white mb-1">{city}</p>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">{address}</p>
      {date && (
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <Calendar size={12} /> {formatDate(date)}
        </div>
      )}
    </div>
  </div>
);

const DetailRow = ({
  icon,
  label,
  value,
  warn,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  warn?: boolean;
}) => (
  <div className="flex items-start justify-between gap-3">
    <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 shrink-0">
      {icon}
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <span
      className={`text-[11px] font-bold text-right max-w-[60%] ${
        warn ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'
      }`}
    >
      {value}
    </span>
  </div>
);

const ReqChip = ({
  label,
  warn,
  icon,
}: {
  label: string;
  warn?: boolean;
  icon?: React.ReactNode;
}) => (
  <span
    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
      warn
        ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50'
        : 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
    }`}
  >
    {icon}
    {label}
  </span>
);

const ScoreBar = ({ label, value }: { label: string; value?: number }) => {
  const pct = scorePct(value);
  const color = pct >= 80 ? 'bg-emerald-400' : pct >= 60 ? 'bg-[#345E85]' : 'bg-amber-400';
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 w-24 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 w-8 text-right">{pct}%</span>
    </div>
  );
};

const ConfirmRow = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) => (
  <div className="flex justify-between text-xs gap-3">
    <span className="text-slate-400 font-bold uppercase tracking-widest shrink-0">{label}</span>
    <span
      className={`font-black text-right truncate ${
        accent ? 'text-[#345E85]' : 'text-slate-900 dark:text-white'
      }`}
    >
      {value}
    </span>
  </div>
);
