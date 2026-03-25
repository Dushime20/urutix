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
    MapPin
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
                <div className="size-20 bg-slate-50 dark:bg-slate-800 rounded-[32px] flex items-center justify-center text-slate-200 dark:text-slate-700 mb-6">
                    <Zap size={40} />
                </div>
                <h3 className="text-xl font-black text-primary-500 dark:text-primary-400 tracking-tight">Zero Match Pulse</h3>
                <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-2 max-w-sm mx-auto">
                    The synchronization engine has not detected any load requests for your fleet infrastructure yet.
                </p>
            </div>
        )
    }

    return (
        <>
            <div className="space-y-8 p-2">
                <div className="flex items-center gap-3 px-2">
                    <div className="size-8 bg-blue-50 dark:bg-blue-950/20 rounded-lg flex items-center justify-center text-blue-500 dark:text-blue-400">
                        <TrendingUp size={16} />
                    </div>
                    <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Load Synchronization Vector</h2>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 p-6 rounded-lg text-sm font-medium uppercase tracking-wider">
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
                                className="bg-white dark:bg-gray-900 p-8 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform"><Zap size={120} /></div>

                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-3 mb-6">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${match.status === 'REQUESTED' ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-500 dark:text-primary-400 border-primary-100 dark:border-primary-900/50' :
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

                                        <h3 className="text-2xl font-black text-primary-500 dark:text-primary-400 tracking-tight mb-4">{match.load?.title || 'Untitled Load Intelligence'}</h3>

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
                                                    <span>{match.load?.origin?.city || 'Origin'}</span>
                                                    <ArrowRight size={12} className="text-slate-300 dark:text-slate-600" />
                                                    <span>{match.load?.destination?.city || 'Destination'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 pt-6 lg:pt-0 border-t lg:border-t-0 border-slate-50 dark:border-slate-800">
                                        {match.status === 'REQUESTED' && (
                                            <>
                                                <button
                                                    onClick={() => handleRespond(match.id, 'ACCEPTED', match)}
                                                    disabled={processingMatchId === match.id}
                                                    className="flex items-center justify-center gap-2 px-8 py-3 bg-primary-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/20 disabled:opacity-50"
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

            {/* Success Portal Integration */}
            <AnimatePresence>
                {showSuccessModal && acceptedMatchDetails && (
                    <div className="fixed inset-0 bg-primary-950/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => setShowSuccessModal(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 dark:border-slate-800"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-10 bg-primary-500 text-white text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10"><Zap size={100} /></div>
                                <div className="size-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 size={40} />
                                </div>
                                <h2 className="text-3xl font-black tracking-tight mb-2">Protocol Active</h2>
                                <p className="text-primary-100 text-[10px] font-black uppercase tracking-[0.2em]">Match Synchronized & Active</p>
                            </div>

                            <div className="p-10 space-y-8">
                                <div className="bg-slate-50 dark:bg-slate-800 rounded-[32px] p-6 space-y-4">
                                    {[
                                        { l: 'Load Asset', v: acceptedMatchDetails.match.load?.title, i: Package },
                                        { l: 'Fleet Unit', v: acceptedMatchDetails.match.truck?.plateNumber, i: Truck },
                                        { l: 'Route Matrix', v: `${acceptedMatchDetails.match.load?.origin?.city} → ${acceptedMatchDetails.match.load?.destination?.city}`, i: MapPin }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <div className="size-8 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center text-primary-400 shadow-sm"><item.i size={14} /></div>
                                            <div>
                                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{item.l}</p>
                                                <p className="text-xs font-bold text-slate-900 dark:text-white">{item.v}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-6 bg-primary-50/50 dark:bg-primary-950/20 rounded-[28px] border border-primary-100/50 dark:border-primary-900/50">
                                    <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-relaxed uppercase tracking-wider">
                                        <strong className="text-primary-500 dark:text-primary-400">Next Vector:</strong> The trip has been initialized. Advance to the Trips Matrix to begin operational tracking and asset monitoring.
                                    </p>
                                </div>
                            </div>

                            <div className="p-10 bg-slate-50/50 dark:bg-slate-800/50 flex gap-3">
                                <button onClick={() => setShowSuccessModal(false)} className="flex-1 h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Close Portal</button>
                                <button onClick={handleViewTrip} className="flex-1 h-14 bg-primary-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/20">Trips Dashboard</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};
