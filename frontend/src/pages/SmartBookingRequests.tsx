import React, { useState, useEffect } from 'react';
import { useCurrencyFormat } from '../hooks/useCurrencyFormat';
import { FaSearch, FaSpinner, FaTruck, FaMapMarkerAlt, FaDollarSign } from 'react-icons/fa';
import { smartBookingApi, type BookingRequest } from '../services/smartBookingApi';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../config/errorMessages';
import { cn } from '../utils/cn';

type TabType = 'pending' | 'accepted' | 'rejected' | 'all';

const SmartBookingRequests: React.FC = () => {
    const { compact: fmtMoney } = useCurrencyFormat();
    const [activeTab, setActiveTab] = useState<TabType>('pending');
    const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
    const [filteredRequests, setFilteredRequests] = useState<BookingRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        loadBookingRequests();
    }, []);

    useEffect(() => {
        filterRequests();
    }, [activeTab, search, bookingRequests]);

    const loadBookingRequests = async () => {
        setLoading(true);
        try {
            const requests = await smartBookingApi.getBookingRequests();
            setBookingRequests(requests);
        } catch (error: any) {
            console.error('Error loading booking requests:', error);
            toast.error(getApiErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const filterRequests = () => {
        let filtered = bookingRequests;

        // Filter by tab
        if (activeTab !== 'all') {
            filtered = filtered.filter(req => req.status.toLowerCase() === activeTab);
        }

        // Filter by search
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(req =>
                req.loadId.toLowerCase().includes(searchLower) ||
                req.cargoOwnerName.toLowerCase().includes(searchLower) ||
                req.cargoType.toLowerCase().includes(searchLower)
            );
        }

        setFilteredRequests(filtered);
    };

    const handleAccept = async (request: BookingRequest) => {
        setProcessingId(request.id);
        try {
            await smartBookingApi.acceptBookingRequest(request.id, request.truckId);
            toast.success('Booking request accepted successfully!');
            await loadBookingRequests();
        } catch (error: any) {
            console.error('Error accepting booking:', error);
            toast.error(getApiErrorMessage(error));
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (request: BookingRequest) => {
        setProcessingId(request.id);
        try {
            await smartBookingApi.rejectBookingRequest(request.id);
            toast.success('Booking request rejected');
            await loadBookingRequests();
        } catch (error: any) {
            console.error('Error rejecting booking:', error);
            toast.error(getApiErrorMessage(error));
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING':
                return 'bg-blue-100 text-blue-800';
            case 'ACCEPTED':
                return 'bg-green-100 text-green-800';
            case 'REJECTED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const tabs: { key: TabType; label: string }[] = [
        { key: 'pending', label: 'Pending' },
        { key: 'accepted', label: 'Accepted' },
        { key: 'rejected', label: 'Rejected' },
        { key: 'all', label: 'All' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                                Smart Booking Requests
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                Manage inbound cargo requests matched by AI
                            </p>
                        </div>

                        {/* Search - Full width on mobile */}
                        <div className="relative w-full sm:w-64 lg:w-80">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Tabs - Scrollable on mobile */}
                <div className="border-b border-gray-200 -mx-3 sm:mx-0 px-3 sm:px-0">
                    <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={cn(
                                    'whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors flex-shrink-0',
                                    activeTab === tab.key
                                        ? 'border-primary-500 text-primary-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-12 sm:py-16">
                        <FaSpinner className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 animate-spin" />
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="text-center py-12 sm:py-16 bg-white rounded-lg border border-gray-200">
                        <FaTruck className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 px-4">No Booking Requests</h3>
                        <p className="text-sm sm:text-base text-gray-600 px-4">
                            {search
                                ? `No requests found matching "${search}"`
                                : activeTab === 'all'
                                    ? "You don't have any booking requests yet"
                                    : `No ${activeTab} requests`}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        {filteredRequests.map((request) => (
                            <div
                                key={request.id}
                                className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 lg:p-6 hover:shadow-md transition-shadow"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between gap-3 mb-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                            <span
                                                className={cn(
                                                    'px-2 py-0.5 rounded text-xs font-semibold uppercase',
                                                    getStatusColor(request.status)
                                                )}
                                            >
                                                {request.status}
                                            </span>
                                            <span className="text-xs text-gray-500 truncate">
                                                ID: {request.loadId.substring(0, 8)}...
                                            </span>
                                        </div>
                                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2">
                                            {request.cargoType}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-gray-600 truncate mt-0.5">
                                            {request.cargoOwnerName}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end flex-shrink-0">
                                        <div className="text-xl sm:text-2xl font-bold text-primary-600">
                                            {request.matchScore}%
                                        </div>
                                        <span className="text-xs text-gray-500 whitespace-nowrap">Match Score</span>
                                    </div>
                                </div>

                                {/* Route */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-start gap-2">
                                        <FaMapMarkerAlt className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs font-medium text-gray-500 uppercase">Origin</span>
                                            <p className="text-xs sm:text-sm text-gray-900 truncate">{request.origin}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <FaMapMarkerAlt className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs font-medium text-gray-500 uppercase">Destination</span>
                                            <p className="text-xs sm:text-sm text-gray-900 truncate">{request.destination}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 pt-4 border-t border-gray-100">
                                    <div>
                                        <span className="text-xs font-medium text-gray-500">Offered Price</span>
                                        <div className="flex items-center gap-1 mt-1">
                                            <FaDollarSign className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                                <span className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                                                {fmtMoney(request.offeredPrice)}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-xs font-medium text-gray-500">Requested For</span>
                                        <div className="flex items-center gap-1 mt-1">
                                            <FaTruck className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                            <span className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                                                {request.requestedFor}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                {request.status === 'PENDING' && (
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <button
                                            onClick={() => handleReject(request)}
                                            disabled={processingId === request.id}
                                            className="flex-1 px-4 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                                        >
                                            {processingId === request.id ? (
                                                <FaSpinner className="w-4 h-4 animate-spin" />
                                            ) : (
                                                'Reject'
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleAccept(request)}
                                            disabled={processingId === request.id}
                                            className="flex-1 px-4 py-2.5 sm:py-2 text-sm sm:text-base bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                                        >
                                            {processingId === request.id ? (
                                                <FaSpinner className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <FaTruck className="w-4 h-4" />
                                                    <span className="hidden sm:inline">Accept Booking</span>
                                                    <span className="sm:hidden">Accept</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SmartBookingRequests;
