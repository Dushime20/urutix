import React from 'react';
import { Navigation, RefreshCw, Route, History } from "lucide-react";

interface TrackingEvent {
    id: string;
    loadId: string;
    status: string;
    location: string;
    timestamp: string;
    description?: string;
    latitude?: number;
    longitude?: number;
}

interface BrokerTrackingSectionProps {
    trackingEvents: TrackingEvent[];
    onRefresh: () => void;
    loading?: boolean;
}

const BrokerTrackingSection: React.FC<BrokerTrackingSectionProps> = ({
    trackingEvents,
    onRefresh,
    loading
}) => {
    // Get the latest event for current status
    const latestEvent = trackingEvents.length > 0 ? trackingEvents[0] : null;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Navigation className="w-5 h-5 mr-2 text-indigo-600" />
                        Tracking Information
                    </h3>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={onRefresh}
                            disabled={loading}
                            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {trackingEvents.length > 0 ? (
                    <div className="space-y-6">
                        {/* Current Status */}
                        <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-6 border border-emerald-200">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-medium text-gray-900 flex items-center">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                                    Current Status
                                </h4>
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full font-medium">
                                    {latestEvent?.status || 'Active'}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white rounded-lg p-3 border border-emerald-200">
                                    <span className="text-xs text-gray-500 font-medium">Last Location</span>
                                    <p className="text-sm font-semibold text-gray-900">{latestEvent?.location || 'Unknown'}</p>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-emerald-200">
                                    <span className="text-xs text-gray-500 font-medium">Last Update</span>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {latestEvent?.timestamp ? new Date(latestEvent.timestamp).toLocaleString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Tracking Timeline */}
                        <div className="bg-white rounded-lg p-6 border border-gray-200">
                            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                                <History className="w-4 h-4" />
                                Tracking History
                            </h4>
                            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                                {trackingEvents.map((event, index) => (
                                    <div key={event.id || index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-emerald-500 text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                            <Route className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 shadow-sm bg-white">
                                            <div className="flex items-center justify-between space-x-2 mb-1">
                                                <div className="font-bold text-slate-900">{event.status}</div>
                                                <time className="font-caveat font-medium text-indigo-500 text-xs">
                                                    {new Date(event.timestamp).toLocaleDateString()}
                                                </time>
                                            </div>
                                            <div className="text-slate-500 text-sm mb-1">{event.location}</div>
                                            {event.description && <div className="text-slate-500 text-xs italic">{event.description}</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Route className="w-10 h-10 text-indigo-400" />
                        </div>
                        <h4 className="text-lg font-medium text-gray-900 mb-3">No Tracking Data</h4>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            There is no tracking history available for this load yet.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BrokerTrackingSection;
