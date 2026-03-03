import { MapPin, Truck, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import LocationIntelModal from './LocationIntelModal';

const RouteTimeline = () => {
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

    // Mock timeline data derived from EnrichedCargoLocations logic
    const stops = [
        {
            id: 1,
            type: 'pickup',
            name: 'Tema Port Terminal 3',
            time: '08:00 AM',
            status: 'completed',
            traffic: 'low',
            security: 'high'
        },
        {
            id: 2,
            type: 'stop',
            name: 'Kumasi Distribution Hub',
            time: '02:30 PM',
            status: 'active',
            traffic: 'moderate',
            security: 'medium'
        },
        {
            id: 3,
            type: 'delivery',
            name: 'Tamale Central Warehouse',
            time: '08:00 PM (Est.)',
            status: 'pending',
            traffic: 'unknown',
            security: 'medium'
        }
    ];

    return (
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="font-extrabold text-[#0f172a] text-base">Active Journey</h3>
                    <p className="text-slate-400 text-xs font-medium mt-0.5">Route #TRK-2024-889</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                    <Clock size={12} /> On Schedule
                </div>
            </div>

            <div className="relative pl-4 space-y-8">
                {/* Connecting Line */}
                <div className="absolute left-[27px] top-3 bottom-8 w-0.5 bg-gradient-to-b from-teal-500 via-slate-200 to-slate-100"></div>

                {stops.map((stop, index) => (
                    <div key={stop.id} className="relative flex items-start group">
                        {/* Dot/Icon */}
                        <div className={`
                            relative z-10 size-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center shrink-0 mr-4
                            ${stop.status === 'completed' ? 'bg-teal-500 text-white' :
                                stop.status === 'active' ? 'bg-white border-teal-500 ring-4 ring-teal-100' : 'bg-slate-200'}
                        `}>
                            <div className={`size-2 rounded-full ${stop.status === 'completed' ? 'bg-white' : stop.status === 'active' ? 'bg-teal-500' : 'bg-slate-400'}`}></div>
                        </div>

                        <div
                            onClick={() => setSelectedLocation(stop.name)}
                            className={`flex-1 p-3 rounded-xl border transition-all cursor-pointer ${stop.status === 'active' ? 'bg-teal-50/50 border-teal-100 shadow-sm' : 'bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-100'}`}
                        >
                            <div className="flex items-start justify-between mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{stop.type}</span>
                                <span className={`text-[10px] font-bold ${stop.status === 'active' ? 'text-teal-600' : 'text-slate-400'}`}>{stop.time}</span>
                            </div>

                            <h4 className={`font-bold text-sm mb-2 ${stop.status === 'completed' ? 'text-slate-500 line-through' : 'text-[#0f172a]'}`}>
                                {stop.name}
                            </h4>

                            {/* Intelligence Chips */}
                            <div className="flex flex-wrap gap-2">
                                {/* Traffic */}
                                {stop.traffic !== 'unknown' && (
                                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${stop.traffic === 'low' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                        <Truck size={10} /> {stop.traffic === 'low' ? 'Clear' : 'Busy'}
                                    </div>
                                )}

                                {/* Security */}
                                {stop.security === 'high' && (
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                        <ShieldCheck size={10} /> Secure Zone
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                <span><span className="text-teal-600">320km</span> remaining</span>
                <button className="text-indigo-600 hover:underline">View Map</button>
            </div>

            <LocationIntelModal
                isOpen={!!selectedLocation}
                onClose={() => setSelectedLocation(null)}
                locationName={selectedLocation || ''}
            />
        </div>
    );
};

export default RouteTimeline;
