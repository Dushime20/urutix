import React, { useState, useEffect } from 'react';
import { X, Truck, Star, MapPin, Gauge, Zap, Phone } from 'lucide-react';
import { matchingAPI } from '../../../services/api';
import toast from 'react-hot-toast';

// Match result from backend matching API
interface MatchResult {
    truckId: string;
    loadId: string;
    overallScore: number;
    distanceKm: number;
    estimatedCost: number;
    plateNumber: string;
    truckMake: string;
    truckModel: string;
    truckType: string;
    capacityWeight: number;
    matchReason: string;
    successProbability: number;
    // Owner info (added)
    ownerId?: string;
    ownerName?: string;
    ownerEmail?: string;
    ownerRating?: number;
    ownerVerified?: boolean;
    ownerCompany?: string;
    // Driver info
    driverId?: string;
    driverName?: string;
    driverRating?: number;
}

interface MatchTransportersModalProps {
    isOpen: boolean;
    onClose: () => void;
    loadId: string;
}

export const MatchTransportersModal: React.FC<MatchTransportersModalProps> = ({
    isOpen,
    onClose,
    loadId,
}) => {
    const [loading, setLoading] = useState(false);
    const [matches, setMatches] = useState<MatchResult[]>([]);

    useEffect(() => {
        if (isOpen && loadId) {
            fetchMatches();
        }
    }, [isOpen, loadId]);

    const fetchMatches = async () => {
        setLoading(true);
        try {
            const response = await matchingAPI.findMatches({
                loadId,
                algorithm: 'WEIGHTED_SCORE',
                maxResults: 20,
                includeDrivers: true, // Request driver info
            });
            const data = response.data?.matches || response.data || [];
            console.log('Match results:', data);
            setMatches(Array.isArray(data) ? data : []);
        } catch (error: any) {
            console.error('Failed to fetch matches:', error);
            toast.error(error.response?.data?.message || 'Failed to load matches');
        } finally {
            setLoading(false);
        }
    };

    const handleContact = (match: MatchResult) => {
        const name = match.ownerName || match.ownerCompany || 'Carrier';
        toast.success(`Contact request sent to ${name}`);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <div>
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Zap className="w-5 h-5" />
                            Smart Carrier Matches
                        </h2>
                        <p className="text-blue-100 text-sm mt-0.5">AI-powered recommendations based on location & capacity</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-gray-500">Analyzing available carriers...</p>
                        </div>
                    ) : matches.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                            <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="font-medium">No matching carriers found</p>
                            <p className="text-sm mt-1">No trucks are currently available for this load.</p>
                        </div>
                    ) : (
                        matches.map((match) => {
                            const score = Math.round((match.overallScore || 0) * 100);
                            const displayName = match.ownerCompany || match.ownerName || 'Unknown Carrier';
                            
                            return (
                                <div key={match.truckId} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between">
                                        {/* Info */}
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                                                {displayName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 text-lg">
                                                    {displayName}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Truck className="w-3.5 h-3.5" />
                                                        {match.plateNumber || 'N/A'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Gauge className="w-3.5 h-3.5" />
                                                        {match.truckType || 'Standard'}
                                                    </span>
                                                    {match.ownerRating && match.ownerRating > 0 && (
                                                        <span className="flex items-center gap-1 text-amber-500 font-medium">
                                                            <Star className="w-3.5 h-3.5 fill-current" />
                                                            {match.ownerRating.toFixed(1)}
                                                        </span>
                                                    )}
                                                    {match.distanceKm > 0 && (
                                                        <span className="flex items-center gap-1 text-green-600">
                                                            <MapPin className="w-3.5 h-3.5" />
                                                            {match.distanceKm.toFixed(0)} km away
                                                        </span>
                                                    )}
                                                </div>
                                                {match.matchReason && (
                                                    <p className="text-xs text-gray-500 mt-2 italic">"{match.matchReason}"</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Score */}
                                        <div className="text-right flex-shrink-0">
                                            <div className={`text-2xl font-bold ${score >= 80 ? 'text-green-600' : score >= 60 ? 'text-blue-600' : 'text-amber-600'}`}>
                                                {score}%
                                            </div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wide">Match</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                        <div className="flex gap-2">
                                            {match.ownerVerified && (
                                                <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs border border-green-200">
                                                    ✓ Verified
                                                </span>
                                            )}
                                            {score >= 80 && (
                                                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs border border-blue-200">
                                                    🌟 Top Match
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleContact(match)}
                                            className="px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
                                        >
                                            <Phone className="w-4 h-4" />
                                            Contact Carrier
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
