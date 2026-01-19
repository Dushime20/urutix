import React, { useState, useEffect } from 'react';
import { X, Search, Truck, Star } from 'lucide-react';
import { brokerAPI } from '../../../services/brokerApi';
import toast from 'react-hot-toast';

interface Transporter {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    phoneNumber?: string;
    rating?: number;
    trucks?: any[];
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
    const [transporters, setTransporters] = useState<Transporter[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            searchTransporters();
        }
    }, [isOpen]);

    const searchTransporters = async (term = '') => {
        setLoading(true);
        try {
            // In a real scenario, we might pass load requirements to filter
            const response = await brokerAPI.searchTransporters({ search: term });
            const data = response.data?.items || response.data || [];
            // Data might be trucks or users depending on API, assuming users/profiles for simplicity or adapting
            // If the API returns trucks, we might need to extract unique owners. 
            // Let's assume for now it returns a list of transporters/truck owners.
            setTransporters(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to search transporters:', error);
            toast.error('Failed to load transporters');
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (transporterId: string) => {
        // Placeholder for invite logic
        console.log(`Inviting transporter ${transporterId} to load ${loadId} (Simulation)`);
        toast.success('Invitation sent to transporter (Simulation)');
        // In real impl: await brokerAPI.inviteTransporter(loadId, transporterId);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Truck className="w-5 h-5 text-blue-600" />
                        Find & Match Transporters
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by name, company, or location..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                // Debounce could be added here
                                if (e.target.value.length > 2 || e.target.value.length === 0) {
                                    searchTransporters(e.target.value);
                                }
                            }}
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : transporters.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>No transporters found matching criteria.</p>
                        </div>
                    ) : (
                        transporters.map(transporter => (
                            <div key={transporter.id} className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex justify-between items-center group">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                        {(transporter.companyName || transporter.firstName || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                            {transporter.companyName || `${transporter.firstName} ${transporter.lastName}`}
                                        </h3>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                            {transporter.rating && (
                                                <span className="flex items-center gap-1 text-amber-500 font-medium">
                                                    <Star className="w-3 h-3 fill-current" /> {transporter.rating}
                                                </span>
                                            )}
                                            <span>• {transporter.trucks?.length || 0} Trucks</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleInvite(transporter.id)}
                                    className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    Invite
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
