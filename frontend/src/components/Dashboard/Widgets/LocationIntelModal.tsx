import { useRef, useEffect } from 'react';
import { X, MapPin, Truck, Clock, ShieldCheck, ParkingCircle, Warehouse, Coffee, Fuel } from 'lucide-react';

interface LocationIntelModalProps {
    isOpen: boolean;
    onClose: () => void;
    locationName: string;
}

const LocationIntelModal: React.FC<LocationIntelModalProps> = ({ isOpen, onClose, locationName }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    // Mock data based on LocationIntelligence logic
    const intel = {
        type: 'Warehouse',
        security: 'High Security (CCTV + Guards)',
        operatingHours: '24/7',
        docks: 12,
        maxHeight: '4.5m',
        amenities: ['Driver Lounge', 'Showers', 'Secure Parking'],
        traffic: 'Moderate congestion at entry gate (Avg wait: 15m)'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div ref={modalRef} className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200 border border-white/20">
                {/* Header with Image/Map Placeholder */}
                <div className="h-32 bg-slate-100 relative overflow-hidden group">
                    {/* Abstract map pattern */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>

                    <div className="absolute bottom-4 left-6 text-white">
                        <div className="flex items-center gap-2 text-xs font-bold text-teal-300 uppercase tracking-wider mb-1">
                            <Warehouse size={12} /> {intel.type}
                        </div>
                        <h2 className="text-xl font-black tracking-tight">{locationName}</h2>
                    </div>

                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <div className="p-6">
                    {/* Key Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase mb-1">
                                <Clock size={12} /> Hours
                            </div>
                            <div className="font-bold text-slate-700">{intel.operatingHours}</div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase mb-1">
                                <ShieldCheck size={12} /> Security
                            </div>
                            <div className="font-bold text-green-600 text-sm">Verified Secure</div>
                        </div>
                    </div>

                    {/* Facility Details */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest">Facility Intelligence</h3>

                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                                <Truck size={16} />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-700">Loading Docks</h4>
                                <p className="text-xs text-slate-500">{intel.docks} active docks • Max height {intel.maxHeight}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                                <Coffee size={16} />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-700">Driver Amenities</h4>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {intel.amenities.map(a => (
                                        <span key={a} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-medium border border-slate-200">
                                            {a}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-red-50 text-red-600 rounded-lg shrink-0">
                                <MapPin size={16} />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-700">Traffic Intel</h4>
                                <p className="text-xs text-slate-500">{intel.traffic}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex gap-3">
                        <button className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors">
                            Navigate
                        </button>
                        <button className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors">
                            Call Facility
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LocationIntelModal;
