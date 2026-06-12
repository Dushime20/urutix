import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { enhancedMatchingApi } from '../../services/enhancedMatchingApi';
import {
    Check,
    X,
    Navigation,
    CheckCircle2,
    TrendingUp,
    Zap,
    Clock,
    ArrowRight,
    Package,
    Truck,
    MapPin,
    ChevronDown,
    ChevronUp,
    DollarSign,
    Weight,
    Shield,
    Thermometer,
    AlertTriangle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export const TruckMatches: React.FC = () => {
    const navigate = useNavigate();
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processingMatchId, setProcessingMatchId] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [acceptedMatchDetails, setAcceptedMatchDetails] = useState<any>(null);
    const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
    const [confirmMatch, setConfirmMatch] = useState<{ id: string; match: any } | null>(null);

    const loadMatches = async () => {
        setLoading(true);
        try {
            const result = await enhancedMatchingApi.getTruckOwnerMatches();
            setMatches(result.data || []);
        } catch (err) {
            setError('Failed to synchronize match matrix');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMatches();
    }, []);

    const handleCreateTrip = async (matchId: string) => {
        setProcessingMatchId(matchId);
        try {
            const result = await enhancedMatchingApi.createTripForMatch(matchId);
            toast.success('System Trip Activated');
            const match = matches.find(m => m.id === matchId);
            if (match) {
                setAcceptedMatchDetails({ match: { ...match, trip: result.data }, response: result });
                setShowSuccessModal(true);
            }
            await loadMatches();
        } catch (err: any) {
            toast.error('Trip activation failed');
        } finally {
            setProcessingMatchId(null);
        }
    };

    const handleRespond = async (matchId: string, status: 'ACCEPTED' | 'REJECTED', match: any) => {
        setProcessingMatchId(matchId);
        try {
            const response = await enhancedMatchingApi.respondToMatch(matchId, status);
            if (status === 'ACCEPTED') {
                setAcceptedMatchDetails({ match, response: response.data });
                setShowSuccessModal(true);
                toast.success('Match Synchronized');
            } else {
                toast.success('Match Pulse Terminated');
            }
            await loadMatches();
        } catch (err: any) {
            toast.error('Matrix update failed');
        } finally {
            setProcessingMatchId(null);
        }
    };

    const handleViewTrip = () => {
        setShowSuccessModal(false);
        navigate('/dashboard/trips');
    };

    if (loading) return (
        <div className="py-20 flex flex-col items-center justify-center animate-pulse">
            <div className="size-12 bg-slate-100 dark:bg-slate-800 rounded-full mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Syncing Match Matrix...</p>
        </div>
    );

    const sortedMatches = [...matches].sort((a, b) => {
        if (a.status === 'REQUESTED' && b.status !== 'REQUESTED') return -1;
        if (a.status !== 'REQUESTED' && b.status === 'REQUESTED') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    if (matches.length === 0) {
        return (
            <div className="py-20 text-center flex flex-col items-center">
                <div className="size-20 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-200 dark:text-gray-700 mb-6 transition-colors duration-200">
                    <Zap size={40} />
                </div>
                <h3 className="text-xl font-black text-blue-500 dark:text-blue-400 tracking-tight transition-colors duration-200">Zero Match Pulse</h3>
                <p className="text-sm font-medium text-gray-400 dark:text-gray-500 mt-2 max-w-sm mx-auto transition-colors duration-200">
                    The synchronization engine has not detected any load requests for your fleet infrastructure yet.
                </p>
            </div>
        )
    }

    return (
        <>
            <div className="space-y-8 p-2">
                <div className="flex items-center gap-3 px-2">
                    <div className="size-8 bg-blue-50 dark:bg-blue-950/20 rounded-lg flex items-center justify-center text-blue-500 dark:text-blue-400 transition-colors duration-200">
                        <TrendingUp size={16} />
                    </div>
                    <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Load Synchronization Vector</h2>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 p-6 rounded-lg text-sm font-medium uppercase tracking-wider transition-colors duration-200">
                        {error}
                    </div>
                )}

                <div className="grid gap-6">
                    <AnimatePresence mode='popLayout'>
                        {sortedMatches.map(match => (
                            <motion.div
                                layout
                                key={match.id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="bg-white dark:bg-gray-900 p-8 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-200 relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform"><Zap size={120} /></div>

                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-3 mb-6">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                                match.status === 'REQUESTED' ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-500 dark:text-primary-400 border-primary-100 dark:border-primary-900/50' :
                                                match.status === 'ACCEPTED' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50' :
                                                'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700'
                                            }`}>
                                                {match.status}
                                            </span>
                                            <div className="flex items-center gap-2 px-3 py-1 bg-primary-50 dark:bg-primary-950/20 text-primary-500 dark:text-primary-400 rounded-full border border-primary-100 dark:border-primary-900/50">
                                                <Zap size={10} className="fill-current" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Match {(match.score * 100).toFixed(0)}%</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">
                                                {new Date(match.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <h3 className="text-2xl font-black text-blue-500 dark:text-blue-400 tracking-tight mb-4 transition-colors duration-200">{match.load?.title || 'Untitled Load Intelligence'}</h3>

                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Payload</p>
                                                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 text-sm"><Package size={14} className="text-primary-400" /> {match.load?.weight?.toLocaleString()} kg</div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Asset Vector</p>
                                                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 text-sm"><Truck size={14} className="text-primary-400" /> {match.truck?.plateNumber || 'Unknown'}</div>
                                            </div>
                                            <div className="col-span-2 space-y-1">
                                                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Route Traverse</p>
                                                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 text-sm">
                                                    <MapPin size={14} className="text-primary-400" />
                                                    <span className="truncate max-w-[180px]">
                                                      {match.load?.locations?.find((l: any) => l.type === 'PICKUP')?.locationData?.city
                                                        || match.load?.locations?.find((l: any) => l.type === 'PICKUP')?.locationData?.address?.split(',')[0]
                                                        || match.load?.origin?.city
                                                        || 'Origin'}
                                                    </span>
                                                    <ArrowRight size={12} className="text-slate-300 dark:text-slate-600 shrink-0" />
                                                    <span className="truncate max-w-[180px]">
                                                      {match.load?.locations?.find((l: any) => l.type === 'DELIVERY')?.locationData?.city
                                                        || match.load?.locations?.find((l: any) => l.type === 'DELIVERY')?.locationData?.address?.split(',')[0]
                                                        || match.load?.destination?.city
                                                        || 'Destination'}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                                                  {match.load?.locations?.find((l: any) => l.type === 'PICKUP')?.locationData?.address
                                                    || match.load?.origin?.address || ''}
                                                  {' → '}
                                                  {match.load?.locations?.find((l: any) => l.type === 'DELIVERY')?.locationData?.address
                                                    || match.load?.destination?.address || ''}
                                                </p>
                                            </div>
                                        </div>

                                        {/* View Details toggle */}
                                        <button
                                            onClick={() => setExpandedMatchId(expandedMatchId === match.id ? null : match.id)}
                                            className="mt-5 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-primary-400 hover:text-primary-600 transition-colors"
                                        >
                                            {expandedMatchId === match.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                            {expandedMatchId === match.id ? 'Hide Details' : 'View Details'}
                                        </button>

                                        {/* Expanded detail panel */}
                                        <AnimatePresence>
                                            {expandedMatchId === match.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        {/* Cargo Details */}
                                                        <div className="space-y-3">
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Cargo Details</p>
                                                            <DetailRow icon={<Package size={12} />} label="Type" value={match.load?.cargoType || '—'} />
                                                            <DetailRow icon={<Weight size={12} />} label="Weight" value={`${Number(match.load?.weight || 0).toLocaleString()} kg`} />
                                                            <DetailRow icon={<DollarSign size={12} />} label="Value" value={match.load?.loadValue ? `$${Number(match.load.loadValue).toLocaleString()}` : '—'} />
                                                            <DetailRow icon={<MapPin size={12} />} label="Pickup" value={
                                                                match.load?.locations?.find((l: any) => l.type === 'PICKUP')?.locationData?.address
                                                                    || (match.load?.origin?.city
                                                                        ? `${match.load.origin.city}${match.load.origin.country ? ', ' + match.load.origin.country : ''}`
                                                                        : '—')
                                                            } />
                                                            <DetailRow icon={<MapPin size={12} />} label="Delivery" value={
                                                                match.load?.locations?.find((l: any) => l.type === 'DELIVERY')?.locationData?.address
                                                                    || (match.load?.destination?.city
                                                                        ? `${match.load.destination.city}${match.load.destination.country ? ', ' + match.load.destination.country : ''}`
                                                                        : '—')
                                                            } />
                                                            <DetailRow icon={<Clock size={12} />} label="Pickup Date" value={match.load?.pickupDate ? new Date(match.load.pickupDate).toLocaleDateString() : '—'} />
                                                            <DetailRow icon={<Clock size={12} />} label="Delivery Date" value={match.load?.deliveryDate ? new Date(match.load.deliveryDate).toLocaleDateString() : '—'} />
                                                            {(match.load?.offeredPrice || match.matchDetails?.recommendedPrice) && (
                                                                <DetailRow icon={<DollarSign size={12} />} label="Offered Price" value={`$${Number(match.load?.offeredPrice || match.matchDetails?.recommendedPrice).toLocaleString()}`} />
                                                            )}
                                                            {match.matchDetails?.estimatedCost && (
                                                                <DetailRow icon={<DollarSign size={12} />} label="Suggested Price" value={`$${Number(match.matchDetails.estimatedCost).toLocaleString()}`} />
                                                            )}
                                                            {match.load?.isFragile && <DetailRow icon={<AlertTriangle size={12} />} label="Fragile" value="Yes" warn />}
                                                            {match.load?.isHazardous && <DetailRow icon={<AlertTriangle size={12} />} label="Hazardous" value="Yes" warn />}
                                                            {match.load?.requiresRefrigeration && <DetailRow icon={<Thermometer size={12} />} label="Refrigeration" value="Required" />}
                                                            {match.load?.requiresForklift && <DetailRow icon={<AlertTriangle size={12} />} label="Forklift" value="Required" />}
                                                            {match.load?.requiresCrane && <DetailRow icon={<AlertTriangle size={12} />} label="Crane" value="Required" />}
                                                            {match.load?.requiresLoadingDock && <DetailRow icon={<AlertTriangle size={12} />} label="Loading Dock" value="Required" />}
                                                            {match.load?.requiresGpsMonitoring && <DetailRow icon={<Shield size={12} />} label="GPS Monitoring" value="Required" />}
                                                            {match.load?.numberOfPieces && <DetailRow icon={<Package size={12} />} label="Pieces" value={Number(match.load.numberOfPieces).toLocaleString()} />}
                                                            {match.load?.numberOfPallets && <DetailRow icon={<Package size={12} />} label="Pallets" value={Number(match.load.numberOfPallets).toLocaleString()} />}
                                                            {match.load?.packagingType && <DetailRow icon={<Package size={12} />} label="Packaging" value={match.load.packagingType} />}
                                                            {match.load?.length && <DetailRow icon={<Package size={12} />} label="Dimensions" value={`${match.load.length} × ${match.load.width} × ${match.load.height} m`} />}
                                                            {match.load?.temperatureMin != null && <DetailRow icon={<Thermometer size={12} />} label="Temp Range" value={`${match.load.temperatureMin}°C – ${match.load.temperatureMax}°C`} />}
                                                            {match.load?.specialHandlingInstructions && <DetailRow icon={<AlertTriangle size={12} />} label="Special Handling" value={match.load.specialHandlingInstructions} />}
                                                            {match.load?.insuranceValue && <DetailRow icon={<Shield size={12} />} label="Insurance Value" value={`$${Number(match.load.insuranceValue).toLocaleString()}`} />}
                                                        </div>

                                                        {/* Match Scores */}
                                                        <div className="space-y-3">
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Match Scores</p>
                                                            {match.matchDetails && <>
                                                                <ScoreBar label="Overall" value={match.score} />
                                                                <ScoreBar label="Capacity" value={match.matchDetails.capacityScore} />
                                                                <ScoreBar label="Equipment" value={match.matchDetails.equipmentScore} />
                                                                <ScoreBar label="Distance" value={match.matchDetails.distanceScore} />
                                                                <ScoreBar label="GPS" value={match.matchDetails.gpsTrackingScore} />
                                                                <ScoreBar label="Availability" value={match.matchDetails.availabilityScore} />
                                                            </>}
                                                            {match.matchDetails?.estimatedCost && (
                                                                <DetailRow icon={<DollarSign size={12} />} label="Est. Cost" value={`$${Number(match.matchDetails.estimatedCost).toLocaleString()}`} />
                                                            )}
                                                            {match.matchDetails?.distanceKm && (
                                                                <DetailRow icon={<MapPin size={12} />} label="Distance" value={`${match.matchDetails.distanceKm} km`} />
                                                            )}
                                                        </div>

                                                        {/* Truck Details */}
                                                        <div className="space-y-3">
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Truck Details</p>
                                                            <DetailRow icon={<Truck size={12} />} label="Make / Model" value={`${match.truck?.make || ''} ${match.truck?.model || ''}`.trim() || '—'} />
                                                            <DetailRow icon={<Truck size={12} />} label="Type" value={match.truck?.truckType || '—'} />
                                                            <DetailRow icon={<Weight size={12} />} label="Capacity" value={`${Number(match.truck?.capacityWeight || 0).toLocaleString()} kg`} />
                                                            <DetailRow icon={<Shield size={12} />} label="GPS" value={match.truck?.hasGps ? '✅ Yes' : '❌ No'} />
                                                            <DetailRow icon={<Thermometer size={12} />} label="Refrigeration" value={match.truck?.hasRefrigeration ? '✅ Yes' : '❌ No'} />
                                                            <DetailRow icon={<Shield size={12} />} label="Hazmat" value={match.truck?.hasHazmatPermit ? '✅ Yes' : '❌ No'} />
                                                            {match.matchDetails?.matchReason && (
                                                                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Match Reason</p>
                                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">{match.matchDetails.matchReason}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 pt-6 lg:pt-0 border-t lg:border-t-0 border-slate-50 dark:border-slate-800">
                                        {match.status === 'REQUESTED' && (
                                            <>
                                                <button
                                                    onClick={() => setConfirmMatch({ id: match.id, match })}
                                                    disabled={processingMatchId === match.id}
                                                    className="flex items-center justify-center gap-2 px-8 py-3 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-[#345E85]/20 disabled:opacity-50"
                                                >
                                                    {processingMatchId === match.id ? <Clock size={14} className="animate-spin" /> : <Check size={14} />}
                                                    Authorize Match
                                                </button>
                                                <button
                                                    onClick={() => handleRespond(match.id, 'REJECTED', match)}
                                                    disabled={processingMatchId === match.id}
                                                    className="flex items-center justify-center gap-2 px-8 py-3 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-500 dark:hover:text-rose-400 transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-900/50 disabled:opacity-50"
                                                >
                                                    <X size={14} /> Deny
                                                </button>
                                            </>
                                        )}

                                        {match.status === 'ACCEPTED' && (
                                            match.trip ? (
                                                <button
                                                    onClick={handleViewTrip}
                                                    className="flex items-center justify-center gap-2 px-8 py-3 bg-primary-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/20"
                                                >
                                                    <Navigation size={14} /> Analyze Trip
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleCreateTrip(match.id)}
                                                    disabled={processingMatchId === match.id}
                                                    className="flex items-center justify-center gap-2 px-8 py-3 bg-primary-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/20 disabled:opacity-50"
                                                >
                                                    {processingMatchId === match.id ? <Clock size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                                    Activate Module
                                                </button>
                                            )
                                        )}

                                        {match.status === 'REJECTED' && (
                                            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
                                                <X size={12} /> Registry Terminated
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div >

            {/* ── Authorize Confirmation Modal ───────────────────────── */}
            <AnimatePresence>
                {confirmMatch && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => setConfirmMatch(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 16 }}
                            className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full overflow-hidden border border-slate-100 dark:border-gray-800 shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-6 pb-4 border-b border-slate-100 dark:border-gray-800 flex items-center gap-3">
                                <div className="size-10 bg-[#345E85]/10 rounded-xl flex items-center justify-center">
                                    <CheckCircle2 size={20} className="text-[#345E85]" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Authorize Match</h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Review before confirming</p>
                                </div>
                            </div>

                            {/* Match summary */}
                            <div className="p-6 space-y-3">
                                <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400 font-bold uppercase tracking-widest">Cargo</span>
                                        <span className="font-black text-slate-900 dark:text-white">{confirmMatch.match.load?.title || '—'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400 font-bold uppercase tracking-widest">Truck</span>
                                        <span className="font-black text-slate-900 dark:text-white">{confirmMatch.match.truck?.plateNumber || '—'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400 font-bold uppercase tracking-widest">Route</span>
                                        <span className="font-black text-slate-900 dark:text-white text-right max-w-[200px] truncate">
                                            {confirmMatch.match.load?.locations?.find((l: any) => l.type === 'PICKUP')?.locationData?.city || 'Origin'}
                                            {' → '}
                                            {confirmMatch.match.load?.locations?.find((l: any) => l.type === 'DELIVERY')?.locationData?.city || 'Destination'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400 font-bold uppercase tracking-widest">Match Score</span>
                                        <span className="font-black text-[#345E85]">{Math.round((confirmMatch.match.score || 0) * 100)}%</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400 font-bold uppercase tracking-widest">Weight</span>
                                        <span className="font-black text-slate-900 dark:text-white">{Number(confirmMatch.match.load?.weight || 0).toLocaleString()} kg</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                    By authorizing, you confirm your truck will handle this cargo. The cargo owner will be notified.
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="px-6 pb-6 flex gap-3">
                                <button
                                    onClick={() => setConfirmMatch(null)}
                                    className="flex-1 h-10 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        const { id, match } = confirmMatch;
                                        setConfirmMatch(null);
                                        await handleRespond(id, 'ACCEPTED', match);
                                    }}
                                    disabled={processingMatchId === confirmMatch.id}
                                    className="flex-1 h-10 bg-[#345E85] hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-[#345E85]/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {processingMatchId === confirmMatch.id
                                        ? <Clock size={13} className="animate-spin" />
                                        : <Check size={13} />
                                    }
                                    Authorize
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Success Modal ───────────────────────────────────────── */}
            <AnimatePresence>
                {showSuccessModal && acceptedMatchDetails && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => setShowSuccessModal(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full overflow-hidden border border-slate-100 dark:border-gray-800 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header — system color */}
                            <div className="p-5 bg-[#345E85] text-white text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={64} /></div>
                                <div className="size-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <CheckCircle2 size={24} />
                                </div>
                                <h2 className="text-xl font-black tracking-tight mb-0.5">Match Authorized</h2>
                                <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em]">Synchronized & Active</p>
                            </div>

                            <div className="p-5 space-y-4">
                                {/* Summary row */}
                                <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between">
                                    {[
                                        { l: 'Load Asset', v: acceptedMatchDetails.match.load?.title, i: Package },
                                        { l: 'Fleet Unit', v: acceptedMatchDetails.match.truck?.plateNumber, i: Truck },
                                        { l: 'Route', v: `${
                                            acceptedMatchDetails.match.load?.locations?.find((l: any) => l.type === 'PICKUP')?.locationData?.city
                                            || acceptedMatchDetails.match.load?.origin?.city
                                            || 'Origin'
                                        } → ${
                                            acceptedMatchDetails.match.load?.locations?.find((l: any) => l.type === 'DELIVERY')?.locationData?.city
                                            || acceptedMatchDetails.match.load?.destination?.city
                                            || 'Destination'
                                        }`, i: MapPin }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="size-7 bg-[#345E85]/10 rounded-lg flex items-center justify-center text-[#345E85] shrink-0">
                                                <item.i size={13} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{item.l}</p>
                                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.v}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Next step hint */}
                                <div className="p-4 bg-[#345E85]/5 rounded-xl border border-[#345E85]/10">
                                    <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-relaxed uppercase tracking-wider">
                                        <strong className="text-[#345E85]">Next step:</strong> Trip initialized. Go to the Trips dashboard for operational tracking.
                                    </p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-5 pb-5 flex gap-3">
                                <button
                                    onClick={() => setShowSuccessModal(false)}
                                    className="flex-1 h-10 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                                >
                                    Close
                                </button>
                                <button
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

// Helper components
const DetailRow = ({ icon, label, value, warn }: { icon: React.ReactNode; label: string; value: string; warn?: boolean }) => (
    <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 shrink-0">
            {icon}
            <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
        </div>
        <span className={`text-[10px] font-bold truncate ${warn ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>{value}</span>
    </div>
);

const ScoreBar = ({ label, value }: { label: string; value: number }) => {
    const pct = Math.round((value || 0) * 100);
    const color = pct >= 80 ? 'bg-emerald-400' : pct >= 60 ? 'bg-primary-400' : 'bg-amber-400';
    return (
        <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 w-20 shrink-0">{label}</span>
            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 w-8 text-right">{pct}%</span>
        </div>
    );
};
