import React, { useEffect, useState } from 'react';
import { enhancedMatchingApi } from '../../services/enhancedMatchingApi';
import { FaTruck, FaBox, FaMapMarkerAlt, FaCheck, FaTimes } from 'react-icons/fa';

export const TruckMatches: React.FC = () => {
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string|null>(null);

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

    const handleRespond = async (matchId: string, status: 'ACCEPTED' | 'REJECTED') => {
        try {
            await enhancedMatchingApi.respondToMatch(matchId, status);
            // Refresh list
            loadMatches();
        } catch (err) {
            alert('Failed to update status');
        }
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Incoming Load Requests</h2>
                <span className="text-sm text-gray-500">Showing {matches.length} matches</span>
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
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                    match.status === 'REQUESTED' ? 'bg-blue-50 text-blue-700 border-blue-100' :
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
                                    onClick={() => handleRespond(match.id, 'ACCEPTED')}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-700 font-medium transition-colors shadow-sm"
                                 >
                                    <FaCheck className="w-4 h-4" /> Accept
                                 </button>
                                 <button
                                    onClick={() => handleRespond(match.id, 'REJECTED')}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 px-5 py-2.5 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                 >
                                    <FaTimes className="w-4 h-4" /> Reject
                                 </button>
                            </div>
                        )}
                        
                        {match.status === 'ACCEPTED' && (
                            <div className="text-emerald-600 font-medium flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg">
                                <FaCheck /> Accepted
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
        </div>
    );
};
