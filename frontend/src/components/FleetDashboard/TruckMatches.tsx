import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { enhancedMatchingApi } from '../../services/enhancedMatchingApi';
import { FaTruck, FaBox, FaMapMarkerAlt, FaCheck, FaTimes, FaRoute, FaCalendar, FaDollarSign, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

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
            setError('Failed to load matches');
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
            toast.success('🎉 Trip created successfully!');

            // Show success modal with correct details
            const match = matches.find(m => m.id === matchId);
            if (match) {
                setAcceptedMatchDetails({
                    match: { ...match, trip: result.data },
                    response: result
                });
                setShowSuccessModal(true);
            }

            await loadMatches();
        } catch (err: any) {
            toast.error('Failed to create trip: ' + (err.response?.data?.message || err.message));
        } finally {
            setProcessingMatchId(null);
        }
    };

    const handleRespond = async (matchId: string, status: 'ACCEPTED' | 'REJECTED', match: any) => {
        setProcessingMatchId(matchId);
        try {
            const response = await enhancedMatchingApi.respondToMatch(matchId, status);

            if (status === 'ACCEPTED') {
                // Show success modal with trip details
                setAcceptedMatchDetails({
                    match,
                    response: response.data
                });
                setShowSuccessModal(true);
                toast.success('🎉 Match accepted! Trip created successfully!');
            } else {
                toast.success('Match rejected');
            }

            // Refresh list
            await loadMatches();
        } catch (err: any) {
            console.error('Failed to respond to match:', err);
            toast.error(err.response?.data?.message || 'Failed to update status');
        } finally {
            setProcessingMatchId(null);
        }
    };

    const handleViewTrip = () => {
        // Navigate to trips page or specific trip
        setShowSuccessModal(false);
        navigate('/dashboard/trips');
        toast.success('Redirecting to your trips...');
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading matches...</div>;

    // Filter to show REQUESTED at top, then Accepted/Rejected
    const sortedMatches = [...matches].sort((a, b) => {
        if (a.status === 'REQUESTED' && b.status !== 'REQUESTED') return -1;
        if (a.status !== 'REQUESTED' && b.status === 'REQUESTED') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    if (matches.length === 0) {
        return (
            <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-50 rounded-full mb-4">
                    <FaTruck className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Match Requests</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                    When cargo owners find your trucks suitable for their loads, their requests will appear here.
                </p>
            </div>
        )
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Incoming Load Requests</h2>
                </div>


                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="grid gap-4">
                    {sortedMatches.map(match => (
                        <div key={match.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${match.status === 'REQUESTED' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                            match.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                'bg-gray-50 text-gray-700 border-gray-100'
                                            }`}>
                                            {match.status}
                                        </span>
                                        <span className="text-xs font-medium text-gray-500">
                                            Match Score: <span className="text-primary-600">{(match.score * 100).toFixed(0)}%</span>
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(match.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-lg text-gray-900 mb-1">{match.load?.title || 'Untitled Load'}</h3>

                                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-3">
                                        <div className="flex items-center gap-1.5">
                                            <FaBox className="text-gray-400" />
                                            <span>{match.load?.weight} kg</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <FaTruck className="text-gray-400" />
                                            <span>For Truck: {match.truck?.plateNumber || 'Unknown'}</span>
                                        </div>
                                    </div>

                                    <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-600">
                                        <FaMapMarkerAlt className="text-gray-400" />
                                        <span>
                                            {match.load?.origin?.city || 'Origin'}
                                            <span className="mx-2 text-gray-300">→</span>
                                            {match.load?.destination?.city || 'Destination'}
                                        </span>
                                    </div>
                                </div>

                                {match.status === 'REQUESTED' && (
                                    <div className="flex gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                                        <button
                                            onClick={() => handleRespond(match.id, 'ACCEPTED', match)}
                                            disabled={processingMatchId === match.id}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-700 font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {processingMatchId === match.id ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <FaCheck className="w-4 h-4" /> Accept
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleRespond(match.id, 'REJECTED', match)}
                                            disabled={processingMatchId === match.id}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 px-5 py-2.5 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <FaTimes className="w-4 h-4" /> Reject
                                        </button>
                                    </div>
                                )}

                                {match.status === 'ACCEPTED' && (
                                    <div className="flex gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                                        {match.trip ? (
                                            <button
                                                onClick={handleViewTrip}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm hover:opacity-90"
                                                style={{ backgroundColor: '#345e85' }}
                                            >
                                                <FaRoute className="w-4 h-4" /> View Trip
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleCreateTrip(match.id)}
                                                disabled={processingMatchId === match.id}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                                                style={{ backgroundColor: '#345e85' }}
                                            >
                                                {processingMatchId === match.id ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                                        Creating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaCheckCircle className="w-4 h-4" /> Create Trip
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                )}
                                {match.status === 'REJECTED' && (
                                    <div className="text-gray-500 font-medium flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                                        <FaTimes /> Rejected
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div >

            {/* Success Modal */}
            {
                showSuccessModal && acceptedMatchDetails && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white">
                                <div className="flex items-center justify-center mb-4">
                                    <div className="bg-white bg-opacity-20 rounded-full p-4">
                                        <FaCheckCircle className="w-12 h-12" />
                                    </div>
                                </div>
                                <h2 className="text-2xl font-bold text-center">Match Accepted!</h2>
                                <p className="text-emerald-100 text-center mt-2">Trip has been created successfully</p>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4">
                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <FaRoute className="text-emerald-600 w-5 h-5" />
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500">Load</p>
                                            <p className="font-semibold text-gray-900">{acceptedMatchDetails.match.load?.title}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <FaTruck className="text-emerald-600 w-5 h-5" />
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500">Truck</p>
                                            <p className="font-semibold text-gray-900">{acceptedMatchDetails.match.truck?.plateNumber}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <FaMapMarkerAlt className="text-emerald-600 w-5 h-5" />
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500">Route</p>
                                            <p className="font-semibold text-gray-900">
                                                {acceptedMatchDetails.match.load?.origin?.city} → {acceptedMatchDetails.match.load?.destination?.city}
                                            </p>
                                        </div>
                                    </div>

                                    {acceptedMatchDetails.match.load?.pickupDate && (
                                        <div className="flex items-center gap-3">
                                            <FaCalendar className="text-emerald-600 w-5 h-5" />
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-500">Pickup Date</p>
                                                <p className="font-semibold text-gray-900">
                                                    {new Date(acceptedMatchDetails.match.load.pickupDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {acceptedMatchDetails.match.load?.offeredPrice && (
                                        <div className="flex items-center gap-3">
                                            <FaDollarSign className="text-emerald-600 w-5 h-5" />
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-500">Agreed Price</p>
                                                <p className="font-semibold text-gray-900">
                                                    ${acceptedMatchDetails.match.load.offeredPrice.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-blue-800">
                                        <strong>Next Steps:</strong> Your trip has been created and is ready to start.
                                        You can view trip details, track progress, and manage documents in the Trips section.
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="p-6 bg-gray-50 flex gap-3">
                                <button
                                    onClick={() => setShowSuccessModal(false)}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={handleViewTrip}
                                    className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors shadow-sm"
                                >
                                    View My Trips
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
};
